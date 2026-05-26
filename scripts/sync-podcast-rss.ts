/**
 * sync-podcast-rss.ts
 *
 * 每日執行（由 GitHub Actions 呼叫），完成三件事：
 *  1. 從 Firstory RSS Feed 抓取所有 podcast 集數，upsert 到 Firestore `podcastEpisodes`
 *  2. 對尚未爬取 Spotify/Apple 連結的集數，用 Playwright 補充
 *  3. 將整份 podcast 列表輸出成 public/podcast-list.json，供 CDN 靜態服務
 */

import * as admin from "firebase-admin";
import { XMLParser } from "fast-xml-parser";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import type { PodcastListItem } from "../src/types/podcast-list";

// ─── 環境初始化 ────────────────────────────────────────────────────────────────

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, ...val] = line.split("=");
      if (key && val) {
        process.env[key.trim()] = val.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// ─── 常數 ──────────────────────────────────────────────────────────────────────

const RSS_URL = "https://feed.firstory.me/rss/user/cmdpx4cs200ax01xldg5ta89p";
const COLLECTION = "podcastEpisodes";
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "podcast-list.json");

// Playwright 爬取時每頁最長等待秒數
const PAGE_TIMEOUT_MS = 20_000;
// 並行爬取數量（避免 Firstory 被 rate-limit）
const SCRAPE_CONCURRENCY = 3;

// ─── 型別 ──────────────────────────────────────────────────────────────────────

interface RssItem {
  guid: string;
  title: string;
  firstoryLink: string;
  pubDate: string;
  imageUrl: string;
  duration: number;
}

interface PodcastEpisode extends RssItem {
  spotifyLink?: string;
  applePodcastLink?: string;
  scraped: boolean;
  updatedAt: admin.firestore.Timestamp;
}

// PodcastListItem 從 src/types/podcast-list.ts 引入（共用型別）

// ─── Step 1：抓取並解析 RSS ─────────────────────────────────────────────────────

async function fetchRssItems(): Promise<RssItem[]> {
  console.log("📡 Fetching RSS feed...");
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    // 讓 itunes: 前綴的標籤也被正確解析
    removeNSPrefix: false,
  });

  const parsed = parser.parse(xml);
  const items: any[] = parsed?.rss?.channel?.item ?? [];

  return items.map((item: any): RssItem => {
    // title 可能在 __cdata 或直接是字串
    const rawTitle = item.title?.__cdata ?? item.title ?? "";
    // guid 可能是物件（含 #text）或字串
    const rawGuid =
      typeof item.guid === "object"
        ? item.guid["#text"] ?? item.guid.__cdata ?? ""
        : item.guid ?? "";
    const link = item.link ?? "";
    const pubDate = item.pubDate ?? "";
    const imageHref =
      item["itunes:image"]?.["@_href"] ??
      item["googleplay:image"]?.["@_href"] ??
      "";
    const duration = parseInt(item["itunes:duration"] ?? "0", 10);

    return {
      guid: String(rawGuid).trim(),
      title: String(rawTitle).trim(),
      firstoryLink: String(link).trim(),
      pubDate: String(pubDate).trim(),
      imageUrl: String(imageHref).trim(),
      duration,
    };
  }).filter((item) => item.guid && item.firstoryLink);
}

// ─── Step 2：Upsert 到 Firestore ───────────────────────────────────────────────

async function upsertToFirestore(items: RssItem[]): Promise<void> {
  console.log(`🔥 Upserting ${items.length} items to Firestore...`);
  const batch = db.batch();

  for (const item of items) {
    const ref = db.collection(COLLECTION).doc(item.guid);
    // merge: true — 不覆蓋已有的 spotifyLink / applePodcastLink / scraped
    batch.set(
      ref,
      {
        title: item.title,
        firstoryLink: item.firstoryLink,
        pubDate: item.pubDate,
        imageUrl: item.imageUrl,
        duration: item.duration,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Firestore batch 最多 500 筆，分批提交
  await batch.commit();
  console.log("✅ Firestore upsert done.");
}

// ─── Step 3：Playwright 爬取新集數的 Spotify / Apple 連結 ──────────────────────

async function scrapeLinks(items: RssItem[]): Promise<void> {
  // 查詢哪些集數尚未爬取
  const snapshot = await db
    .collection(COLLECTION)
    .where("scraped", "!=", true)
    .get();

  const unscrapedGuids = new Set(snapshot.docs.map((d) => d.id));
  const toScrape = items.filter((item) => unscrapedGuids.has(item.guid));

  if (toScrape.length === 0) {
    console.log("⏭  No new episodes to scrape.");
    return;
  }

  console.log(`🎭 Launching Playwright to scrape ${toScrape.length} episodes...`);
  const browser = await chromium.launch({ headless: true });

  // 分批並行爬取
  for (let i = 0; i < toScrape.length; i += SCRAPE_CONCURRENCY) {
    const chunk = toScrape.slice(i, i + SCRAPE_CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        const page = await browser.newPage();
        try {
          console.log(`  🔍 Scraping: ${item.title.slice(0, 40)}...`);
          await page.goto(item.firstoryLink, {
            waitUntil: "networkidle",
            timeout: PAGE_TIMEOUT_MS,
          });

          const spotifyHref = await page
            .locator('a[href^="https://open.spotify.com/episode/"]')
            .first()
            .getAttribute("href")
            .catch(() => null);

          const appleHref = await page
            .locator('a[href^="https://podcasts.apple.com/podcast/id1812447277"]')
            .first()
            .getAttribute("href")
            .catch(() => null);

          await db.collection(COLLECTION).doc(item.guid).update({
            spotifyLink: spotifyHref ?? admin.firestore.FieldValue.delete(),
            applePodcastLink: appleHref ?? admin.firestore.FieldValue.delete(),
            scraped: true,
          });

          console.log(`  ✅ ${item.guid}: spotify=${!!spotifyHref}, apple=${!!appleHref}`);
        } catch (err) {
          console.warn(`  ⚠️  Failed to scrape ${item.guid}:`, (err as Error).message);
          // 仍標記為 scraped 避免無限重試（可視情況調整）
          await db.collection(COLLECTION).doc(item.guid).update({ scraped: true });
        } finally {
          await page.close();
        }
      })
    );
  }

  await browser.close();
  console.log("🎭 Playwright done.");
}

// ─── Step 4：從 Firestore 讀取全部資料，輸出 podcast-list.json ─────────────────

async function generateJson(rssItems: RssItem[]): Promise<void> {
  console.log("📄 Reading Firestore to generate podcast-list.json...");
  const snapshot = await db.collection(COLLECTION).get();

  const docMap = new Map<string, admin.firestore.DocumentData>();
  snapshot.docs.forEach((doc) => docMap.set(doc.id, doc.data()));

  // 以 RSS 的順序為準（RSS 是最新在前），補充 Firestore 中的爬取資料
  const list: PodcastListItem[] = rssItems
    .map((item) => {
      const stored = docMap.get(item.guid);
      return {
        id: item.guid,
        title: item.title,
        firstoryLink: item.firstoryLink,
        pubDate: item.pubDate,
        imageUrl: item.imageUrl,
        duration: item.duration,
        spotifyLink: stored?.spotifyLink ?? undefined,
        applePodcastLink: stored?.applePodcastLink ?? undefined,
      };
    })
    .filter(Boolean);

  const output = {
    updatedAt: new Date().toISOString(),
    count: list.length,
    episodes: list,
  };

  // 確保 public/ 目錄存在
  const publicDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ podcast-list.json written: ${list.length} episodes → ${OUTPUT_PATH}`);
}

// ─── 主程式 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting podcast RSS sync...\n");

  const rssItems = await fetchRssItems();
  console.log(`📋 Found ${rssItems.length} episodes in RSS feed.\n`);

  await upsertToFirestore(rssItems);
  await scrapeLinks(rssItems);
  await generateJson(rssItems);

  console.log("\n🎉 All done!");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

/**
 * sync-podcast-rss.ts
 *
 * 每日執行（由 GitHub Actions 呼叫），完成三件事：
 *  1. 從 Firstory 網頁（https://open.firstory.me/user/kidsci/episodes）爬取所有集數（含 VIP），
 *     upsert 到 Firestore `podcastEpisodes`
 *  2. 對尚未爬取 Spotify/Apple 連結的集數，用 Playwright 補充
 *  3. 將整份 podcast 列表輸出成 public/podcast-list.json，供 CDN 靜態服務
 *
 * [本地測試與偵錯]
 *  - 將 DRY_RUN_LOCAL_ONLY 設為 true 時，完全不寫入 Firestore，
 *    而是讀取/更新本地的 public/podcast-list.json 作為資料庫 cache，
 *    並利用 Playwright 在本地進行爬取，提供豐富的偵錯訊息。
 */

import * as admin from "firebase-admin";
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

// ─── 設定開關 ──────────────────────────────────────────────────────────────────

const DRY_RUN_LOCAL_ONLY = false;

// Playwright 爬取時每頁最長等待秒數
const PAGE_TIMEOUT_MS = 20_000;
// 並行爬取數量
const SCRAPE_CONCURRENCY = 2;
// 每次本地偵錯最多爬取的集數（避免爬太久，可自行調整）
const MAX_SCRAPE_PER_RUN = 30;

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sci-listen-guide",
  });
}

const db = admin.firestore();

// ─── 常數 ──────────────────────────────────────────────────────────────────────

const COLLECTION = "podcastEpisodes";
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "podcast-list.json");

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

// ─── 全域快取（用於 Dry-run 模式） ──────────────────────────────────────────────

// 用來儲存從本地 json 檔案讀取出的現有連結
const localCacheMap = new Map<string, { spotifyLink?: string; applePodcastLink?: string }>();
// 用來儲存本次新爬取到的連結
const newlyScrapedMap = new Map<string, { spotifyLink?: string; applePodcastLink?: string }>();

// ─── 輔助函數 ──────────────────────────────────────────────────────────────────

function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  let title = rawTitle;

  // 1. 若標題中包含 `|` 或 `｜`，且前半部（prefix）包含 `(數字)` 或 `（數字）`，則移除整個前半部
  // 例如 "熱門回顧-恐龍專輯(1)｜🦕地球生命..." -> 移除 "熱門回顧-恐龍專輯(1)｜"
  // 注意：只處理第一個 `｜` 之前的部分
  const splitMatch = title.match(/^(.*?[\|｜])(.*)$/);
  if (splitMatch) {
    const prefix = splitMatch[1];
    if (/\(\d+\)/.test(prefix) || /（\d+）/.test(prefix)) {
      title = splitMatch[2]; // 保留 `｜` 之後的部分
    }
  }

  // 2. 移除常見干擾前綴與空白
  title = title
    .replace(/[〈〉「」【】《》]/g, "") // 移除括號
    .replace(/公開｜|會員｜|VIP點播｜|VIP｜/g, "") // 移除常見前綴
    .replace(/^\s*[-｜\|_]\s*/g, "")     // 移除開頭的破折號或分隔符
    .replace(/\s*[-｜\|_]\s*$/g, "")     // 移除結尾的破折號或分隔符
    .replace(/\s+/g, " ")              // 合併多餘空白
    .trim();

  return title;
}

// ─── Step 1：從 Firstory 網頁爬取所有集數 ──────────────────────────────────────

async function fetchFirstoryWebItems(): Promise<RssItem[]> {
  console.log("🎭 Launching Playwright to scrape Firstory web episodes...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    locale: "zh-TW"
  });

  const url = "https://open.firstory.me/user/kidsci/episodes";
  const items: RssItem[] = [];

  try {
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const getEpisodeCount = async () => {
      return await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a")).filter(a => a.href.includes("/story/")).length;
      });
    };

    let prevCount = await getEpisodeCount();
    console.log(`   Initial visible episodes on Firstory web: ${prevCount}`);

    // Click "載入更多" up to 10 times to load all (~200) episodes
    for (let i = 0; i < 10; i++) {
      const loadMoreButton = page.locator("button", { hasText: "載入更多" });
      const buttonCount = await loadMoreButton.count();

      if (buttonCount === 0) {
        console.log("   ✨ '載入更多' button not found. Reached the end.");
        break;
      }

      await loadMoreButton.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await loadMoreButton.first().click();

      // Wait for content hydration/network response
      await page.waitForTimeout(2500);

      const currentCount = await getEpisodeCount();
      console.log(`   [Firstory Click ${i + 1}] Loaded ${currentCount} episodes...`);

      if (currentCount === prevCount && prevCount > 0) {
        // Double check
        await page.waitForTimeout(1500);
        const doubleCheckCount = await getEpisodeCount();
        if (doubleCheckCount === prevCount) {
          console.log("   ✨ Episode count did not increase on Firstory. Finished loading.");
          break;
        }
      }
      prevCount = currentCount;
    }

    // Scrape all episodes from DOM
    const scrapedEpisodes = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a")).filter(a => a.href.includes("/story/"));
      return anchors.map((a) => {
        const text = a.innerText.trim();
        let imageUrl = "";
        const img = a.querySelector("img");
        if (img) {
          imageUrl = img.src || img.getAttribute("src") || "";
        } else {
          // Check sibling or parent elements up to 4 levels
          let parent = a.parentElement;
          for (let i = 0; i < 4; i++) {
            if (parent) {
              const siblingImg = parent.querySelector("img");
              if (siblingImg) {
                imageUrl = siblingImg.src || siblingImg.getAttribute("src") || "";
                break;
              }
              parent = parent.parentElement;
            }
          }
        }

        return {
          text,
          href: a.href,
          imageUrl
        };
      });
    });

    console.log(`✅ Scraped ${scrapedEpisodes.length} total episodes from Firstory web.`);

    // Parse scraped episodes into RssItem
    for (const ep of scrapedEpisodes) {
      if (!ep.href || !ep.text) continue;

      // Extract guid from href
      const guid = ep.href.substring(ep.href.lastIndexOf("/") + 1).split("?")[0].trim();
      if (!guid) continue;

      // Parse text: [Title]  [Date]·[Duration]
      const parts = ep.text.split(/\s{2,}/);
      const rawTitle = parts[0]?.trim() || "";
      const metaPart = parts[1]?.trim() || "";

      // Split date and duration by dot or U+00B7
      const metaSplit = metaPart.split(/[·•.]/);
      const dateStr = metaSplit[0]?.trim() || ""; // YYYY-MM-DD
      const durationStr = metaSplit[1]?.trim() || ""; // HH:MM:SS

      // Convert duration string to seconds
      let duration = 0;
      if (durationStr) {
        const durParts = durationStr.split(":").map(Number);
        if (!durParts.some(isNaN)) {
          if (durParts.length === 3) {
            duration = durParts[0] * 3600 + durParts[1] * 60 + durParts[2];
          } else if (durParts.length === 2) {
            duration = durParts[0] * 60 + durParts[1];
          } else if (durParts.length === 1) {
            duration = durParts[0];
          }
        }
      }

      // Convert date string to pubDate
      let pubDate = "";
      if (dateStr) {
        pubDate = new Date(`${dateStr}T06:00:00+08:00`).toUTCString();
      } else {
        pubDate = new Date().toUTCString();
      }

      const cleanEpTitle = cleanTitle(rawTitle);

      // Skip previews or coffee-support items
      if (cleanEpTitle.includes("預告") || cleanEpTitle.includes("每月一杯咖啡錢")) {
        continue;
      }

      items.push({
        guid,
        title: cleanEpTitle,
        firstoryLink: ep.href.trim(),
        pubDate,
        imageUrl: ep.imageUrl.trim(),
        duration,
      });
    }

  } catch (err) {
    console.error("❌ Error scraping Firstory web:", err);
  } finally {
    await browser.close();
  }

  return items;
}

// ─── Step 2：Upsert 到 Firestore ───────────────────────────────────────────────

async function upsertToFirestore(items: RssItem[]): Promise<void> {
  if (DRY_RUN_LOCAL_ONLY) {
    console.log("🔥 [DRY RUN] Skipping Firestore upsert (Dry-run mode is active).");
    return;
  }

  console.log(`🔥 Upserting ${items.length} items to Firestore...`);
  const batch = db.batch();

  for (const item of items) {
    const ref = db.collection(COLLECTION).doc(item.guid);
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

  await batch.commit();
  console.log("✅ Firestore upsert done.");
}

// ─── Step 3：Playwright 爬取新集數的 Spotify / Apple 連結 ──────────────────────

async function scrapeLinks(items: RssItem[]): Promise<void> {
  let toScrape: RssItem[] = [];

  if (DRY_RUN_LOCAL_ONLY) {
    console.log("🔍 [DRY RUN] Determining items to scrape using local cache map...");
    // 找出在 RSS 中，但本地 json 快取中缺乏 spotifyLink 或 applePodcastLink 的集數
    toScrape = items.filter((item) => {
      const cached = localCacheMap.get(item.guid);
      return !cached || !cached.spotifyLink || !cached.applePodcastLink;
    });

    if (toScrape.length > MAX_SCRAPE_PER_RUN) {
      console.log(`ℹ️ Found ${toScrape.length} unscraped episodes. Limiting this test run to ${MAX_SCRAPE_PER_RUN} episodes to avoid rate-limiting.`);
      toScrape = toScrape.slice(0, MAX_SCRAPE_PER_RUN);
    }
  } else {
    // 正常模式：從 Firestore 讀取所有已儲存的集數，找出缺乏連結的集數
    console.log("🔍 Fetching all stored episodes from Firestore to check link status...");
    const snapshot = await db.collection(COLLECTION).get();
    const storedMap = new Map<string, admin.firestore.DocumentData>();
    snapshot.docs.forEach((doc) => storedMap.set(doc.id, doc.data()));

    toScrape = items.filter((item) => {
      const stored = storedMap.get(item.guid);
      if (!stored) return true;

      // 檢查是否具有正確格式的單集連結（而不是廣義的節目首頁連結）
      const hasValidSpotify = stored.spotifyLink && stored.spotifyLink.startsWith("https://open.spotify.com/episode/");
      const hasValidApple = stored.applePodcastLink && stored.applePodcastLink.includes("podcasts.apple.com/podcast/id1812447277");

      // 如果任一連結無效或缺失，就主動重新進行爬取與修正！
      return !hasValidSpotify || !hasValidApple;
    });

    if (toScrape.length > MAX_SCRAPE_PER_RUN) {
      console.log(`ℹ️ Found ${toScrape.length} unscraped or link-missing episodes in Firestore. Limiting this run to ${MAX_SCRAPE_PER_RUN} episodes.`);
      toScrape = toScrape.slice(0, MAX_SCRAPE_PER_RUN);
    }
  }

  if (toScrape.length === 0) {
    console.log("⏭  No new episodes to scrape (all have links cached or processed).");
    return;
  }

  console.log(`🎭 Launching Playwright to scrape ${toScrape.length} episodes...`);
  const browser = await chromium.launch({ headless: true });

  for (let i = 0; i < toScrape.length; i += SCRAPE_CONCURRENCY) {
    const chunk = toScrape.slice(i, i + SCRAPE_CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        const page = await browser.newPage();
        try {
          console.log(`\n----------------------------------------`);
          console.log(`🔍 [Scraper] Scraping: "${item.title}"`);
          console.log(`🔗 [Scraper] URL: ${item.firstoryLink}`);

          await page.goto(item.firstoryLink, {
            waitUntil: "domcontentloaded",
            timeout: PAGE_TIMEOUT_MS,
          });

          console.log(`⏳ [Scraper] Waiting 3 seconds for React hydration...`);
          await page.waitForTimeout(3000);

          // 獲取頁面所有的 anchor 標籤進行偵錯
          const allLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("a")).map((a) => ({
              text: a.innerText.trim(),
              href: a.href,
              outerHTML: a.outerHTML,
            }));
          });

          console.log(`📊 [Scraper] Found ${allLinks.length} total anchor links on page.`);

          // 過濾並尋找 Spotify 連結：必須為單集連結
          const spotifyLinks = allLinks.filter((l) => l.href.includes("open.spotify.com/episode/"));
          // 過濾並尋找 Apple 連結：必須為特定節目的單集連結
          const appleLinks = allLinks.filter((l) => l.href.includes("podcasts.apple.com/podcast/id1812447277"));

          console.log(`🎵 [Scraper] Spotify candidates:`, spotifyLinks.map(l => l.href));
          console.log(`🍎 [Scraper] Apple candidates:`, appleLinks.map(l => l.href));

          const spotifyHref = spotifyLinks[0]?.href ?? null;
          const appleHref = appleLinks[0]?.href ?? null;

          if (!spotifyHref) {
            console.log(`⚠️ [Scraper] [WARNING] No Spotify link found on page.`);
          }
          if (!appleHref) {
            console.log(`⚠️ [Scraper] [WARNING] No Apple Podcast link found on page.`);
          }

          if (allLinks.length === 0) {
            console.log(`❌ [Scraper] [ERROR] 0 links found on the page. Dumping body content text (first 500 chars):`);
            const bodyText = await page.innerText("body").catch(() => "");
            console.log(bodyText.slice(0, 500));
          }

          if (DRY_RUN_LOCAL_ONLY) {
            // 在 Dry-run 模式下，寫入本地新爬取 Map
            newlyScrapedMap.set(item.guid, {
              spotifyLink: spotifyHref || undefined,
              applePodcastLink: appleHref || undefined,
            });
            console.log(`✅ [Scraper] [DRY RUN SUCCESS] ${item.guid}: spotify=${!!spotifyHref}, apple=${!!appleHref}`);
          } else {
            // 正常模式：寫入 Firestore
            await db.collection(COLLECTION).doc(item.guid).update({
              spotifyLink: spotifyHref ?? admin.firestore.FieldValue.delete(),
              applePodcastLink: appleHref ?? admin.firestore.FieldValue.delete(),
              scraped: true,
            });
            console.log(`✅ [Scraper] [FIRESTORE SUCCESS] ${item.guid}: spotify=${!!spotifyHref}, apple=${!!appleHref}`);
          }
        } catch (err) {
          console.error(`❌ [Scraper] [ERROR] Failed to scrape ${item.guid}:`, (err as Error).message);

          if (!DRY_RUN_LOCAL_ONLY) {
            // 仍標記為 scraped 避免無限重試
            await db.collection(COLLECTION).doc(item.guid).update({ scraped: true }).catch(() => { });
          }
        } finally {
          await page.close();
        }
      })
    );
  }

  await browser.close();
  console.log("\n🎭 Playwright finished scraping.");
}

// ─── Step 4：輸出 podcast-list.json ──────────────────────────────────────────────

async function generateJson(rssItems: RssItem[]): Promise<void> {
  let docMap = new Map<string, { spotifyLink?: string; applePodcastLink?: string }>();

  if (DRY_RUN_LOCAL_ONLY) {
    console.log("📄 [DRY RUN] Generating podcast-list.json combining local cache and new scrape results...");
    // 將本地快取與新爬取結果合併
    for (const [id, val] of localCacheMap.entries()) {
      docMap.set(id, val);
    }
    for (const [id, val] of newlyScrapedMap.entries()) {
      docMap.set(id, {
        ...docMap.get(id),
        ...val
      });
    }
  } else {
    console.log("📄 Reading Firestore to generate podcast-list.json...");
    const snapshot = await db.collection(COLLECTION).get();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      docMap.set(doc.id, {
        spotifyLink: data.spotifyLink,
        applePodcastLink: data.applePodcastLink,
      });
    });
  }

  // 以 RSS 的順序為準（RSS 是最新在前），補充爬取到的資料
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
        spotifyLink: stored?.spotifyLink || undefined,
        applePodcastLink: stored?.applePodcastLink || undefined,
      };
    });

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

// ─── 本地快取載入 ──────────────────────────────────────────────────────────────

function loadLocalCache(): void {
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const raw = fs.readFileSync(OUTPUT_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.episodes)) {
        for (const ep of parsed.episodes) {
          localCacheMap.set(ep.id, {
            spotifyLink: ep.spotifyLink,
            applePodcastLink: ep.applePodcastLink,
          });
        }
      }
      console.log(`💾 Loaded ${localCacheMap.size} episodes from local podcast-list.json cache.`);
    } catch (e) {
      console.warn("⚠️ Failed to read local podcast-list.json cache:", e);
    }
  } else {
    console.log("ℹ️ No local podcast-list.json file found. Cache is empty.");
  }
}

// ─── 主程式 ────────────────────────────────────────────────────────────────────

async function main() {
  // ─── 特殊模式：僅重新從 Firestore 生成 podcast-list.json（跳過所有爬取）
  if (process.env.GENERATE_JSON_ONLY === "true") {
    console.log("📄 GENERATE_JSON_ONLY mode: Reading Firestore to regenerate podcast-list.json...");
    const webItems = await fetchFirstoryWebItems();
    const sortedItems = webItems.sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    await generateJson(sortedItems);
    console.log("\n🎉 JSON regenerated from Firestore!");
    return;
  }

  console.log("🚀 Starting podcast RSS sync...\n");

  if (DRY_RUN_LOCAL_ONLY) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚡ LOCAL DRY-RUN MODE ACTIVE                        ");
    console.log("   - Will NOT write or modify Firestore!        ");
    console.log("   - Reads local public/podcast-list.json cache ");
    console.log("   - Scrapes missing links locally with debug   ");
    console.log("   - Writes final output directly to local JSON ");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    loadLocalCache();
  }

  const webItems = await fetchFirstoryWebItems();
  console.log(`📋 Scraped ${webItems.length} episodes from Firstory web.`);

  // Sort chronologically (newest first)
  const finalItems = webItems.sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  console.log(`📋 Total ${finalItems.length} episodes from Firstory web.\n`);

  await upsertToFirestore(finalItems);
  await scrapeLinks(finalItems);
  await generateJson(finalItems);

  console.log("\n🎉 All done!");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import * as admin from "firebase-admin";

// ─── Firebase 初始化 ─────────────────────────────────────────────────────────
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

const USE_FIRESTORE = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let db: admin.firestore.Firestore | null = null;

if (USE_FIRESTORE) {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sci-listen-guide",
    });
  }
  db = admin.firestore();
}

// Path configuration
const JSON_PATH = path.resolve(process.cwd(), "public", "podcast-list.json");

// Normalize titles for robust comparison
function cleanTitle(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[〈〉「」【】《》|｜\s\-—.,!?!?？：:()（）]/g, "");
}

// Convert long Apple Podcasts URL with text slug to shortened query-param format
function shortenAppleUrl(url: string): string {
  const match = url.match(/https:\/\/podcasts\.apple\.com\/([a-z]{2})\/podcast\/.*?(id\d+)(?:\?i=(\d+))?/);
  if (match) {
    const region = match[1]; // e.g. "tw"
    const podcastId = match[2]; // e.g. "id1812447277"
    const episodeId = match[3]; // e.g. "1000769314277"
    return `https://podcasts.apple.com/${region}/podcast/${podcastId}${episodeId ? `?i=${episodeId}` : ''}`;
  }
  return url;
}

async function main() {
  console.log("🚀 Starting Apple Podcasts Link Scraper and Updater...");

  // 1. Read existing podcast-list.json
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ Error: podcast-list.json not found at ${JSON_PATH}`);
    process.exit(1);
  }

  const fileRaw = fs.readFileSync(JSON_PATH, "utf-8");
  const data = JSON.parse(fileRaw);
  const episodes = data.episodes || [];
  console.log(`💾 Loaded ${episodes.length} episodes from local podcast-list.json.`);

  // 2. Launch headless browser with standard viewport
  console.log("🎭 Launching Playwright browser with desktop viewport...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    const startUrl = "https://podcasts.apple.com/tw/podcast/id1812447277";
    console.log(`🌐 Navigating to main show page: ${startUrl}`);
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const redirectedUrl = page.url();
    console.log(`🔀 Page redirected to: ${redirectedUrl}`);

    // Click "顯示全部" to load the full episodes subpage
    console.log("🔍 Locating '顯示全部' link...");
    const showAllLink = page.locator("a", { hasText: "顯示全部" });

    if (await showAllLink.count() === 0) {
      console.error("❌ Error: Could not find '顯示全部' link on the page!");
      await browser.close();
      process.exit(1);
    }

    console.log("🖱️ Clicking '顯示全部' link...");
    await showAllLink.first().click();
    await page.waitForTimeout(5000); // Wait for the subpage to load

    console.log(`📖 Episode subpage loaded. Title: "${await page.title()}"`);

    // 3. Scroll to load all episodes
    console.log("📜 Scrolling page dynamically to load all episodes...");
    let prevCount = 0;
    let noChangeCount = 0;
    
    // We will do up to 45 scroll attempts to load all 200+ episodes
    for (let i = 0; i < 45; i++) {
      // Trigger lazy load by pressing PageDown and scrolling to bottom
      for (let j = 0; j < 3; j++) {
        await page.keyboard.press("PageDown");
        await page.waitForTimeout(100);
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for content hydration/network response
      await page.waitForTimeout(2000);

      const currentCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a")).filter(a => a.href.includes("?i=")).length;
      });

      console.log(`   [Scroll ${i + 1}] Found ${currentCount} episodes...`);

      if (currentCount === prevCount) {
        noChangeCount++;
        // Allow more attempts since lazy load can sometimes be slow to trigger
        if (noChangeCount >= 5) {
          console.log("   ✨ No new episodes loaded for several scrolls. Reached the end.");
          break;
        }
      } else {
        noChangeCount = 0;
      }
      prevCount = currentCount;
    }

    // 4. Retrieve all episode links and their texts
    const scrapedItems = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      return anchors
        .filter(a => a.href.includes("?i="))
        .map(a => ({
          text: a.innerText.trim(),
          href: a.href
        }));
    });

    console.log(`✅ Scraped a total of ${scrapedItems.length} episodes from Apple Podcasts.`);

    // 5. Match and update episodes
    let updateCount = 0;
    let matchCount = 0;

    for (const episode of episodes) {
      const targetTitleClean = cleanTitle(episode.title);
      if (!targetTitleClean) continue;

      // Find best matching scraped item
      const matchedItem = scrapedItems.find(item => {
        const itemTextClean = cleanTitle(item.text);
        // Match if one title contains the other to allow partial matches
        return itemTextClean.includes(targetTitleClean) || targetTitleClean.includes(itemTextClean);
      });

      if (matchedItem) {
        matchCount++;
        const shortenedUrl = shortenAppleUrl(matchedItem.href);
        const oldUrl = episode.applePodcastLink || "";

        if (oldUrl !== shortenedUrl) {
          episode.applePodcastLink = shortenedUrl;
          updateCount++;
          console.log(`✍️  Updated: "${episode.title.slice(0, 40)}..."`);
          console.log(`    🔗 Link: ${shortenedUrl}`);
        }
      }
    }

    console.log(`\n📊 Match Summary:`);
    console.log(`   - Matched episodes: ${matchCount} / ${episodes.length}`);
    console.log(`   - Newly updated links: ${updateCount}`);

    // 6. Write back to file if updates were made
    if (updateCount > 0) {
      data.updatedAt = new Date().toISOString();
      fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
      console.log(`\n💾 Saved changes to ${JSON_PATH}`);

      // 7. Sync updated applePodcastLinks back to Firestore
      if (db) {
        console.log("🔥 Syncing updated Apple Podcast links back to Firestore...");
        const updatedEpisodes = episodes.filter((ep: any) => ep.applePodcastLink);
        // Firestore batch can handle up to 500 writes
        const BATCH_SIZE = 400;
        for (let i = 0; i < updatedEpisodes.length; i += BATCH_SIZE) {
          const batch = db.batch();
          updatedEpisodes.slice(i, i + BATCH_SIZE).forEach((ep: any) => {
            const ref = db!.collection("podcastEpisodes").doc(ep.id);
            batch.set(ref, { applePodcastLink: ep.applePodcastLink }, { merge: true });
          });
          await batch.commit();
        }
        console.log(`✅ Synced ${updatedEpisodes.length} Apple Podcast links to Firestore.`);
      } else {
        console.log("ℹ️ Firestore not configured — skipping Firestore sync (local mode).");
      }
    } else {
      console.log("\nℹ️ No links needed updating. podcast-list.json is already up to date.");
    }

  } catch (err) {
    console.error("❌ Scraper encountered an error:", err);
  } finally {
    await browser.close();
    console.log("🏁 Browser closed. Script finished.");
  }
}

main().catch(console.error);

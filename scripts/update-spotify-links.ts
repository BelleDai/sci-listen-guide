import { chromium } from "playwright";
import fs from "fs";
import path from "path";

// Path configuration
const JSON_PATH = path.resolve(process.cwd(), "public", "podcast-list.json");

// Normalize titles for robust comparison
function cleanTitle(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[〈〉「」【】《》|｜\s\-—.,!?!?？：:()（）]/g, "");
}

async function main() {
  console.log("🚀 Starting Spotify Link Scraper and Updater...");

  // 1. Read existing podcast-list.json
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ Error: podcast-list.json not found at ${JSON_PATH}`);
    process.exit(1);
  }

  const fileRaw = fs.readFileSync(JSON_PATH, "utf-8");
  const data = JSON.parse(fileRaw);
  const episodes = data.episodes || [];
  console.log(`💾 Loaded ${episodes.length} episodes from local podcast-list.json.`);

  // 2. Launch headless browser with Taiwanese locale and desktop viewport
  console.log("🎭 Launching Playwright browser with Taiwanese locale and desktop viewport...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    locale: "zh-TW"
  });

  try {
    const showUrl = "https://open.spotify.com/show/1eyISRdcgDTwZqIqrP1qKv";
    console.log(`🌐 Navigating to Spotify show page: ${showUrl}`);
    await page.goto(showUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    const getEpisodeCount = async () => {
      return await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a"))
          .filter(a => a.getAttribute("href")?.includes("/episode/") && a.innerText.trim().length > 0).length;
      });
    };

    let initialCount = await getEpisodeCount();
    console.log(`   Initial visible episodes on page: ${initialCount}`);

    // 3. Repeatedly click the "載入更多單集" button
    console.log("📜 Locating and clicking '載入更多單集' button iteratively to load all episodes...");
    let clickCount = 0;
    let prevCount = initialCount;
    
    // We loop up to 45 times to load all 188+ episodes (each click adds about 6 episodes)
    for (let i = 0; i < 45; i++) {
      const loadMoreButton = page.locator("button", { hasText: "載入更多單集" });
      const buttonCount = await loadMoreButton.count();

      if (buttonCount === 0) {
        console.log("   ✨ '載入更多單集' button not found. Reached the end of the list.");
        break;
      }

      // Scroll to button to ensure layout triggers and clicks correctly
      await loadMoreButton.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await loadMoreButton.first().click();

      // Wait for content hydration/network response
      await page.waitForTimeout(2500);

      const currentCount = await getEpisodeCount();
      console.log(`   [Click ${i + 1}] Loaded ${currentCount} episodes...`);

      if (currentCount === prevCount && prevCount > 0) {
        // Double check after another brief wait just in case of slow network
        await page.waitForTimeout(3000);
        const doubleCheckCount = await getEpisodeCount();
        if (doubleCheckCount === prevCount) {
          console.log("   ✨ Episode count did not increase. Finished loading all episodes.");
          break;
        }
      }

      prevCount = currentCount;
      clickCount++;
    }

    console.log(`✅ Finished loading page. Total clicks: ${clickCount}, Scraped count: ${prevCount}`);

    // 4. Retrieve all episode links and their texts
    const scrapedItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute("href") || ""
        }))
        .filter(item => item.href.includes("/episode/") && item.text.length > 0);
    });

    console.log(`✅ Retrieved a total of ${scrapedItems.length} episodes from Spotify.`);

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
        // Construct full URL using open.spotify.com host
        const fullSpotifyUrl = `https://open.spotify.com${matchedItem.href}`;
        const oldUrl = episode.spotifyLink || "";

        if (oldUrl !== fullSpotifyUrl) {
          episode.spotifyLink = fullSpotifyUrl;
          updateCount++;
          console.log(`✍️  Updated: "${episode.title.slice(0, 40)}..."`);
          console.log(`    🔗 Link: ${fullSpotifyUrl}`);
        }
      } else {
        console.log(`⚠️  No match found for local episode: "${episode.title}"`);
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

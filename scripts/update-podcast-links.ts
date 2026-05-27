import { execSync } from "child_process";

async function main() {
  console.log("=================================================================");
  console.log("🍎 [1/2] STARTING APPLE PODCASTS LINK CRAWLER...");
  console.log("=================================================================\n");
  
  try {
    execSync("npx tsx scripts/update-apple-links.ts", { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Apple Podcasts link crawler failed:", (err as Error).message);
  }

  console.log("\n=================================================================");
  console.log("🎵 [2/2] STARTING SPOTIFY LINK CRAWLER...");
  console.log("=================================================================\n");

  try {
    execSync("npx tsx scripts/update-spotify-links.ts", { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Spotify link crawler failed:", (err as Error).message);
  }

  console.log("\n=================================================================");
  console.log("🎉 ALL LINK UPDATES COMPLETED!");
  console.log("=================================================================\n");
}

main().catch(console.error);

import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";

// Load .env.local manually for script
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

function normalizeTitle(title: string): string {
  return title
    .replace(/[〈〉「」【】《》]/g, "")
    .replace(/公開｜|會員｜/g, "")
    .replace(/EP\.\d+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const bigrams = (s: string) => {
    const set: Set<string> = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const ba = bigrams(a);
  const bb = bigrams(b);
  let common = 0;
  ba.forEach((bi) => { if (bb.has(bi)) common++; });
  return (2 * common) / (ba.size + bb.size || 1);
}

async function findMatchingPodcast(title: string) {
  const snapshot = await db.collection("podcastEpisodes").get();
  if (snapshot.empty) return [];

  const normalized = normalizeTitle(title);
  const scored = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const score = similarity(normalized, normalizeTitle(data.title ?? ""));
      return { guid: doc.id, score, data };
    })
    .filter((r) => r.score > 0.1) // 稍微放寬標準
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

async function main() {
  console.log("🚀 檢查需要建立連結的舊集數...\n");

  const snapshot = await db.collection("episodes").get();
  
  // 找出還沒有 firstoryGuid 的集數
  const missingLinkDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return !data.firstoryGuid;
  });

  if (missingLinkDocs.length === 0) {
    console.log("🎉 所有伴讀集數都已經成功連結到 podcastEpisodes！");
    return;
  }

  console.log(`找到 ${missingLinkDocs.length} 筆尚未連結的伴讀集數。\n`);

  for (const doc of missingLinkDocs) {
    const data = doc.data();
    const episodeId = doc.id;
    let searchTitle = data.Title || "";

    console.log(`\n=========================================`);
    console.log(`📦 正在處理伴讀集數 ID: ${episodeId}`);
    console.log(`   現有標題: ${searchTitle}`);
    
    let chosenGuid = null;
    let chosenSpotify = data.Spotify || null;
    let chosenApple = data.ApplePodcast || null;

    while (true) {
      if (!searchTitle) {
        searchTitle = readlineSync.question("\n請輸入關鍵字搜尋 Podcast 集數 (或按 Enter 略過此集): ");
        if (!searchTitle) break;
      }

      console.log(`\n🔍 Searching podcastEpisodes for: "${searchTitle.slice(0, 60)}"`);
      const candidates = await findMatchingPodcast(searchTitle);

      if (candidates.length > 0) {
        console.log("\n📋 找到相似的 Podcast 集數：");
        candidates.forEach((c, i) => {
          console.log(`  ${i + 1}. [${Math.round(c.score * 100)}%] ${c.data.title?.slice(0, 70)}`);
        });

        const confirmPrompt = `\n選擇 (1-${candidates.length})，輸入 '/' 重新搜尋，或按 'n' 略過此集 [預設: 1]: `;
        const confirm = readlineSync.question(confirmPrompt).toLowerCase().trim();

        if (confirm === 'n') {
          break;
        } else if (confirm.startsWith('/')) {
          searchTitle = confirm.slice(1).trim();
          continue;
        } else {
          let choiceIndex = confirm ? parseInt(confirm) - 1 : 0;

          if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < candidates.length) {
            const selected = candidates[choiceIndex];
            chosenGuid = selected.guid;
            // 如果原本沒有連結，才用 podcastEpisodes 的連結覆蓋
            if (!chosenSpotify && selected.data.spotifyLink) chosenSpotify = selected.data.spotifyLink;
            if (!chosenApple && selected.data.applePodcastLink) chosenApple = selected.data.applePodcastLink;
            
            console.log(`✅ 準備連結到：${selected.data.title?.slice(0, 60)}`);
            break;
          } else {
            console.log("❌ 無效的選擇，請重新輸入。");
            searchTitle = ""; // 強制手動輸入
          }
        }
      } else {
        console.log("   （未找到相似集數）");
        searchTitle = readlineSync.question("\n請輸入其他關鍵字重新搜尋 (或按 Enter 略過此集): ");
        if (!searchTitle) break;
      }
    }

    if (chosenGuid) {
      await db.collection("episodes").doc(episodeId).update({
        firstoryGuid: chosenGuid,
        Spotify: chosenSpotify,
        ApplePodcast: chosenApple
      });
      console.log(`✅ 已成功更新集數 ${episodeId} 的連結！`);
    } else {
      console.log(`⏭ 略過集數 ${episodeId}`);
    }
  }

  console.log("\n✅ 全部處理完畢！");
  console.log("請記得執行 npm run build 讓網頁套用最新資料！");
}

main().catch((err) => {
  console.error(err);
});

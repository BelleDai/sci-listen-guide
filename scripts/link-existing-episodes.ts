import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import readline from "readline";

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
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sci-listen-guide",
  });
}

const db = admin.firestore();

// ─── 終端機輸入介面初始化 ────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      resolve(ans);
    });
  });
}

// ─── 標題比對輔助函數 ────────────────────────────────────────────────────────────

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

// ─── 主程式 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting episode link-matching utility...\n");

  const relinkAllAns = await askQuestion("❓ 是否要重新處理所有伴讀集數（包括已經成功連結的）？(y/N): ");
  const relinkAll = relinkAllAns.toLowerCase().trim() === "y";

  if (relinkAll) {
    console.log("⚠️ 將會處理所有伴讀集數，允許你重新對齊與修正已連結的項目。\n");
  } else {
    console.log("ℹ️ 將只篩選「尚未連結（沒有 firstoryGuid）」的伴讀集數。\n");
  }

  const snapshot = await db.collection("episodes").get();
  
  // 依據使用者的選擇進行過濾
  const targetDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return relinkAll ? true : !data.firstoryGuid;
  });

  if (targetDocs.length === 0) {
    console.log("🎉 沒有需要連結的伴讀集數！");
    rl.close();
    return;
  }

  console.log(`📋 找到 ${targetDocs.length} 筆符合條件的伴讀集數。\n`);

  for (const doc of targetDocs) {
    const data = doc.data();
    const episodeId = doc.id;
    let searchTitle = data.Title || "";

    console.log(`\n==================================================`);
    console.log(`📦 正在處理伴讀集數 ID: [${episodeId}]`);
    console.log(`   目前伴讀標題: "${searchTitle}"`);
    if (data.firstoryGuid) {
      console.log(`   🔗 現有連結 Guid: ${data.firstoryGuid}`);
    }
    
    let chosenGuid = null;
    let chosenSpotify = data.Spotify || null;
    let chosenApple = data.ApplePodcast || null;
    let nextTitle = data.Title || "";
    let shouldUpdateTitle = false;

    while (true) {
      if (!searchTitle) {
        searchTitle = await askQuestion("\n👉 請輸入關鍵字搜尋 Podcast 集數 (或按 Enter 略過此集): ");
        if (!searchTitle) break;
      }

      console.log(`\n🔍 正在搜尋 Podcast 資料庫: "${searchTitle.slice(0, 60)}"`);
      const candidates = await findMatchingPodcast(searchTitle);

      if (candidates.length > 0) {
        console.log("\n📋 找到相似的 Podcast 集數：");
        candidates.forEach((c, i) => {
          console.log(`  ${i + 1}. [${Math.round(c.score * 100)}%] ${c.data.title?.slice(0, 70)}`);
        });

        const confirmPrompt = `\n💡 選擇連結對象 (1-${candidates.length})，輸入 '/' + 新關鍵字 重新搜尋，或按 'n' 略過此集 [預設: 1]: `;
        const confirm = (await askQuestion(confirmPrompt)).toLowerCase().trim();

        if (confirm === "n") {
          break;
        } else if (confirm.startsWith("/")) {
          searchTitle = confirm.slice(1).trim();
          continue;
        } else {
          let choiceIndex = confirm ? parseInt(confirm, 10) - 1 : 0;

          if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < candidates.length) {
            const selected = candidates[choiceIndex];
            chosenGuid = selected.guid;
            
            // 獲取對應的正確連結
            chosenSpotify = selected.data.spotifyLink || chosenSpotify;
            chosenApple = selected.data.applePodcastLink || chosenApple;
            
            console.log(`\n✅ 已選定連結到："${selected.data.title}"`);
            
            // 💡 比對標題，如果不同，提問是否同步修改
            if (data.Title !== selected.data.title) {
              console.log(`\n📝 偵測到標題不一致！`);
              console.log(`   - 目前伴讀標題: ${data.Title}`);
              console.log(`   - 節目單元標題: ${selected.data.title}`);
              
              const updateTitleAns = await askQuestion(`❓ 是否要將伴讀單元的標題同步修改為 Podcast 的完美標題？(Y/n): `);
              if (updateTitleAns.toLowerCase().trim() !== "n") {
                nextTitle = selected.data.title;
                shouldUpdateTitle = true;
                console.log(`   👉 標題將同步修正為: "${nextTitle}"`);
              }
            }
            break;
          } else {
            console.log("❌ 無效的選擇，請重新輸入。");
            searchTitle = ""; // 強制手動輸入
          }
        }
      } else {
        console.log("   （未找到相似的 Podcast 集數）");
        searchTitle = await askQuestion("\n👉 請輸入其他關鍵字重新搜尋 (或按 Enter 略過此集): ");
        if (!searchTitle) break;
      }
    }

    if (chosenGuid) {
      const updateData: any = {
        firstoryGuid: chosenGuid,
        Spotify: chosenSpotify,
        ApplePodcast: chosenApple
      };

      if (shouldUpdateTitle) {
        updateData.Title = nextTitle;
      }

      await db.collection("episodes").doc(episodeId).update(updateData);
      console.log(`✅ 已成功連結並更新集數 [${episodeId}] 的資料！`);
    } else {
      console.log(`⏭ 略過集數 [${episodeId}]`);
    }
  }

  console.log("\n✅ 全部處理完畢！");
  console.log("請記得執行 npm run build 讓網頁套用最新資料！");
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});

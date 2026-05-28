import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const rl = readline.createInterface({ input, output });

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

// Initialize Firebase Admin with Application Default Credentials
// This allows the script to bypass Firestore Security Rules when running locally
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Helper to find key in object case-insensitively
function getCaseInsensitiveKey(obj: any, targetKey: string) {
  const keys = Object.keys(obj);
  const foundKey = keys.find((k) => k.toLowerCase() === targetKey.toLowerCase());
  return foundKey ? obj[foundKey] : null;
}

// Normalize a Glossary array: 'word' -> 'term', 'definition' -> 'explanation'
function normalizeGlossary(value: any[]): any[] {
  return value.map((g: any) => ({
    term: g.term ?? g.word ?? "",
    explanation: g.explanation ?? g.definition ?? "",
  }));
}

/**
 * 簡單的 title 正規化：
 * 移除常見前綴（〈公開｜、〈會員｜）、集數編號（EP.xx）、以及中文括號，
 * 只留下核心關鍵詞，方便模糊比對。
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/[〈〉「」【】《》]/g, "")
    .replace(/公開｜|會員｜/g, "")
    .replace(/EP\.\d+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * 計算兩個字串的相似度（0~1）。
 * 使用最長公共子字串長度 / 較長字串長度作為指標，
 * 不依賴外部套件，對中文標題效果足夠好。
 */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  // 找所有共用的 bigram（連續2字）
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

function extractOrderFromText(text?: string): number | null {
  if (!text) return null;
  const m = text.match(/\b(?:EP|SP)\.?\s*(\d+)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function toDayStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function backfillMissingPubDates(): Promise<number> {
  const snapshot = await db.collection("episodes").get();
  if (snapshot.empty) return 0;

  const missing = snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as any }))
    .filter((row) => !row.data.pubDate);

  if (missing.length === 0) return 0;

  const sorted = [...missing].sort((a, b) => {
    const oa = extractOrderFromText(a.data.Title);
    const ob = extractOrderFromText(b.data.Title);
    if (oa !== null && ob !== null && oa !== ob) return oa - ob;
    if (oa !== null && ob === null) return -1;
    if (oa === null && ob !== null) return 1;

    const titleA = String(a.data.Title || "").trim().toLowerCase();
    const titleB = String(b.data.Title || "").trim().toLowerCase();
    const byTitle = titleA.localeCompare(titleB, undefined, { numeric: true });
    if (byTitle !== 0) return byTitle;

    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const baseDay = toDayStartUtc(yesterday);

  let updated = 0;
  for (let i = 0; i < sorted.length; i++) {
    const offsetDays = sorted.length - 1 - i;
    const assignedDay = new Date(baseDay);
    assignedDay.setUTCDate(baseDay.getUTCDate() - offsetDays);
    const assignedPubDate = new Date(
      Date.UTC(
        assignedDay.getUTCFullYear(),
        assignedDay.getUTCMonth(),
        assignedDay.getUTCDate(),
        22,
        0,
        0
      )
    ).toUTCString();

    await db.collection("episodes").doc(sorted[i].id).set({ pubDate: assignedPubDate }, { merge: true });
    updated++;
  }

  return updated;
}

/**
 * 在 podcastEpisodes 中模糊搜尋最相似的集數。
 * 回傳前 3 名候選（相似度 > 0.3）。
 */
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
    .filter((r) => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

async function syncEpisode() {
  const source = await rl.question("Enter Local Path: ");
  const episodeId = await rl.question("Enter Episode ID (e.g., 216): ");

  // Fetch existing Firestore doc so links can be re-used with Enter
  const existingDoc = await db.collection("episodes").doc(episodeId).get();
  const existing = existingDoc.exists ? (existingDoc.data() as any) : {};

  let data: any = {
    id: episodeId,
    status: "published",
  };

  if (!fs.existsSync(source)) {
    console.error("❌ Error: Local path does not exist.");
    process.exit(1);
  }

  const publicDir = path.join(process.cwd(), "public", "episodes", episodeId);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log("Reading from local directory...");

  // ── 讀取 metadata.md 取得 title ──────────────────────────────────────────────
  let titleFromMeta = "";
  const mdPath = path.join(source, "metadata.md");
  if (fs.existsSync(mdPath)) {
    const content = fs.readFileSync(mdPath, "utf-8");
    const titleMatch = content.match(/## Title\s*\n\s*(.+)/);
    if (titleMatch) titleFromMeta = titleMatch[1].trim();
  }

  // ── 模糊比對 podcastEpisodes ──────────────────────────────────────────────────
  const existingGuid = existing.firstoryGuid || "";
  let chosenGuid = existingGuid;
  let podcastData: any = null;

  let searchTitle = titleFromMeta || existing.Title || "";
  
  while (true) {
    if (!searchTitle) {
      console.log("");
      searchTitle = await rl.question("請輸入關鍵字搜尋 Podcast 集數 (或按 Enter 略過): ");
      if (!searchTitle) break;
    }

    console.log(`\n🔍 Searching podcastEpisodes for: "${searchTitle.slice(0, 60)}"`);
    const candidates = await findMatchingPodcast(searchTitle);

    if (candidates.length > 0) {
      console.log("\n📋 找到相似的 Podcast 集數：");
      candidates.forEach((c, i) => {
        console.log(`  ${i + 1}. [${Math.round(c.score * 100)}%] ${c.data.title?.slice(0, 70)}`);
        if (c.data.spotifyLink) console.log(`     Spotify: ${c.data.spotifyLink.slice(0, 60)}`);
        if (c.data.applePodcastLink) console.log(`     Apple:   ${c.data.applePodcastLink.slice(0, 60)}`);
      });

      const confirmPrompt = existingGuid
        ? `\n選擇 (1-${candidates.length})，輸入 '/' 重新搜尋，或按 'n' 保持原連結 [原連結: ${existingGuid.slice(0, 20)}...]: `
        : `\n選擇 (1-${candidates.length})，輸入 '/' 重新搜尋，或按 'n' 略過 [預設: 1]: `;
      
      const confirm = (await rl.question(confirmPrompt)).toLowerCase().trim();

      if (confirm === 'n') {
        break;
      } else if (confirm.startsWith('/')) {
        searchTitle = confirm.slice(1).trim();
        continue;
      } else {
        let choiceIndex = -1;
        if (!confirm && !existingGuid) {
          choiceIndex = 0; // 預設選擇第 1 個
        } else if (!confirm && existingGuid) {
          break; // 保持原有的
        } else {
          choiceIndex = parseInt(confirm) - 1;
        }

        if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < candidates.length) {
          const selected = candidates[choiceIndex];
          chosenGuid = selected.guid;
          podcastData = selected.data;
          console.log(`✅ 已連結到：${selected.data.title?.slice(0, 60)}`);
          break;
        } else {
          console.log("❌ 無效的選擇，請輸入數字 (1, 2, 3)、'/' 重新搜尋，或 'n' 略過。");
          searchTitle = ""; // 強制下一輪手動輸入
        }
      }
    } else {
      console.log("   （未找到相似集數）");
      console.log("");
      searchTitle = await rl.question("請輸入其他關鍵字重新搜尋 (或按 Enter 略過): ");
      if (!searchTitle) break;
    }
  }

  // ── Title：從 podcast 預填或從 metadata 讀取 ─────────────────────────────────
  const existingTitle = existing.Title || "";
  const suggestedTitle = podcastData?.title || titleFromMeta || existingTitle;
  const titlePrompt = existingTitle
    ? `Enter Title [Enter to keep: ${existingTitle.slice(0, 50)}]: `
    : suggestedTitle
      ? `Enter Title [Enter to use: ${suggestedTitle.slice(0, 50)}]: `
      : "Enter Title: ";
  const titleInput = await rl.question(titlePrompt);
  data.Title = titleInput || existingTitle || suggestedTitle;

  // ── Spotify / Apple：從 podcast 自動填入，可手動覆蓋 ─────────────────────────
  const existingSpotify = existing.Spotify || "";
  const suggestedSpotify = podcastData?.spotifyLink || existingSpotify;
  const spotifyPrompt = suggestedSpotify
    ? `Enter Spotify Link [Enter to use: ${suggestedSpotify.slice(0, 50)}...]: `
    : "Enter Spotify Link (optional): ";
  const spotifyInput = await rl.question(spotifyPrompt);
  data.Spotify = spotifyInput || suggestedSpotify;

  const existingApple = existing.ApplePodcast || "";
  const suggestedApple = podcastData?.applePodcastLink || existingApple;
  const applePrompt = suggestedApple
    ? `Enter Apple Podcasts Link [Enter to use: ${suggestedApple.slice(0, 50)}...]: `
    : "Enter Apple Podcasts Link (optional): ";
  const appleInput = await rl.question(applePrompt);
  data.ApplePodcast = appleInput || suggestedApple;

  // 寫入 firstoryGuid
  if (chosenGuid) data.firstoryGuid = chosenGuid;
  data.pubDate = new Date().toUTCString();

  // ── 讀取 JSON 資料 ─────────────────────────────────────────────────────────────
  const jsonFiles = [
    { file: "glossary.json", key: "Glossary" },
    { file: "family_discussion.json", key: "FamilyDiscussion" },
    { file: "audio_question.json", key: "AudioQuestion" },
    { file: "key_takeaways.json", key: "KeyTakeaway" },
    { file: "tags.json", key: "Tags" },
  ];

  for (const item of jsonFiles) {
    const p = path.join(source, item.file);
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      let value = getCaseInsensitiveKey(raw, item.key);

      if (item.key === "Glossary" && Array.isArray(value)) {
        value = normalizeGlossary(value);
      }

      data[item.key] = value;
    }
  }

  if (fs.existsSync(path.join(source, "profile.jpg"))) {
    fs.copyFileSync(path.join(source, "profile.jpg"), path.join(publicDir, "profile.jpg"));
    data.Cover = `/episodes/${episodeId}/profile.jpg`;
  }

  if (fs.existsSync(path.join(source, "3d.jpg"))) {
    fs.copyFileSync(path.join(source, "3d.jpg"), path.join(publicDir, "3d.jpg"));
    data.ThreeDImage = `/episodes/${episodeId}/3d.jpg`;
  }

  const captionPath = path.join(source, "3d_caption.txt");
  if (fs.existsSync(captionPath)) {
    data.ThreeDCaption = fs.readFileSync(captionPath, "utf-8").trim();
  }

  console.log("\nUploading to Firestore...");
  await db.collection("episodes").doc(episodeId).set(data, { merge: true });
  console.log("Backfilling missing pubDate for existing episodes...");
  const backfilledCount = await backfillMissingPubDates();
  console.log(`? Successfully synced Episode ${episodeId}!`);
  console.log(`Set pubDate for ${episodeId}: ${data.pubDate}`);
  console.log(`Backfilled missing pubDate count: ${backfilledCount}`);

}

syncEpisode().catch((err) => {
  if (err.message.includes("Could not load the default credentials")) {
    console.error("\n❌ Error: No credentials found.");
    console.error("Please run: gcloud auth application-default login\n");
  } else {
    console.error(err);
  }
}).finally(() => {
  rl.close();
});

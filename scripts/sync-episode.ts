import * as admin from "firebase-admin";
import { google } from "googleapis";
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

async function syncEpisode() {
  const source = readlineSync.question("Enter Folder ID (Drive) or Local Path: ");
  const episodeId = readlineSync.question("Enter Episode ID (e.g., 216): ");

  // Fetch existing Firestore doc so links can be re-used with Enter
  const existingDoc = await db.collection("episodes").doc(episodeId).get();
  const existing = existingDoc.exists ? (existingDoc.data() as any) : {};

  const existingSpotify = existing.Spotify || "";
  const existingApple = existing.ApplePodcast || "";

  const spotifyPrompt = existingSpotify
    ? `Enter Spotify Link [Enter to keep: ${existingSpotify.slice(0, 50)}...]: `
    : "Enter Spotify Link (optional): ";
  const applePrompt = existingApple
    ? `Enter Apple Podcast Link [Enter to keep: ${existingApple.slice(0, 50)}...]: `
    : "Enter Apple Podcast Link (optional): ";

  const spotifyInput = readlineSync.question(spotifyPrompt);
  const appleInput = readlineSync.question(applePrompt);

  const spotifyLink = spotifyInput || existingSpotify;
  const applePodcastLink = appleInput || existingApple;

  let data: any = {
    id: episodeId,
    status: "published",
    Spotify: spotifyLink,
    ApplePodcast: applePodcastLink,
  };

  const isLocal = fs.existsSync(source);
  const publicDir = path.join(process.cwd(), "public", "episodes", episodeId);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  if (isLocal) {
    console.log("Reading from local directory...");

    const mdPath = path.join(source, "metadata.md");
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, "utf-8");
      const titleMatch = content.match(/## Title\s*\n\s*(.+)/);
      if (titleMatch) data.Title = titleMatch[1].trim();
    }

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

  } else {
    console.log("Fetching from Google Drive using Application Default Credentials...");
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.list({
      q: `'${source}' in parents`,
      fields: "files(id, name)",
    });

    const files = res.data.files || [];

    for (const file of files) {
      if (file.name === "metadata.md") {
        const doc = await drive.files.get({ fileId: file.id!, alt: "media" });
        const content = doc.data as string;
        const titleMatch = content.match(/## Title\s*\n\s*(.+)/);
        if (titleMatch) data.Title = titleMatch[1].trim();
      }

      const jsonMapping: Record<string, string> = {
        "glossary.json": "Glossary",
        "family_discussion.json": "FamilyDiscussion",
        "audio_question.json": "AudioQuestion",
        "key_takeaways.json": "KeyTakeaway",
        "tags.json": "Tags",
      };

      if (jsonMapping[file.name!]) {
        const doc = await drive.files.get({ fileId: file.id!, alt: "media" });
        const raw = doc.data as any;
        let value = getCaseInsensitiveKey(raw, jsonMapping[file.name!]);

        if (jsonMapping[file.name!] === "Glossary" && Array.isArray(value)) {
          value = normalizeGlossary(value);
        }
        data[jsonMapping[file.name!]] = value;
      }

      if (file.name === "profile.jpg") {
        const dest = fs.createWriteStream(path.join(publicDir, "profile.jpg"));
        const doc = await drive.files.get({ fileId: file.id!, alt: "media" }, { responseType: "stream" });
        doc.data.pipe(dest);
        data.Cover = `/episodes/${episodeId}/profile.jpg`;
      }

      if (file.name === "3d.jpg") {
        const dest = fs.createWriteStream(path.join(publicDir, "3d.jpg"));
        const doc = await drive.files.get({ fileId: file.id!, alt: "media" }, { responseType: "stream" });
        doc.data.pipe(dest);
        data.ThreeDImage = `/episodes/${episodeId}/3d.jpg`;
      }

      if (file.name === "3d_caption.txt") {
        const doc = await drive.files.get({ fileId: file.id!, alt: "media" });
        data.ThreeDCaption = (doc.data as string).trim();
      }
    }
    // Give some time for streams to finish
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("Uploading to Firestore...");
  await db.collection("episodes").doc(episodeId).set(data, { merge: true });
  console.log(`✅ Successfully synced Episode ${episodeId}!`);
}

syncEpisode().catch((err) => {
  if (err.message.includes("Could not load the default credentials")) {
    console.error("\n❌ Error: No credentials found.");
    console.error("Please run: gcloud auth application-default login\n");
  } else {
    console.error(err);
  }
});

/**
 * Prune Firestore podcastEpisodes docs that no longer exist on Firstory.
 *
 * Default mode is a dry run. It prints the stale Firestore documents that would
 * be deleted, but does not write anything.
 *
 * Usage:
 *   npx tsx scripts/prune-podcast-episodes.ts
 *   npx tsx scripts/prune-podcast-episodes.ts --confirm-delete
 *
 * Safety flags:
 *   --min-current-count=100   Abort if Firstory scrape finds fewer than this.
 *   --allow-small-scrape      Skip the minimum-count guard.
 *   --limit=10                Delete at most N stale docs in this run.
 *   --credentials=path.json   Firebase service account JSON path.
 *   --project-id=project      Firebase project id.
 *   --confirm-upsert-missing  Add current Firstory docs that are missing in Firestore.
 */

import * as admin from "firebase-admin";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const COLLECTION = "podcastEpisodes";
const FIRSTORY_EPISODES_URL = "https://open.firstory.me/user/kidsci/episodes";
const PAGE_TIMEOUT_MS = 20_000;
const DEFAULT_MIN_CURRENT_COUNT = 100;
const MAX_LOAD_ATTEMPTS = 80;
const MAX_STALE_LOAD_ATTEMPTS = 5;

interface CliOptions {
  confirmDelete: boolean;
  confirmUpsertMissing: boolean;
  allowSmallScrape: boolean;
  minCurrentCount: number;
  limit?: number;
  credentialsPath?: string;
  projectId?: string;
}

interface PodcastDoc {
  id: string;
  title?: string;
  firstoryLink?: string;
  pubDate?: string;
}

interface FirstoryEpisode {
  guid: string;
  title: string;
  firstoryLink: string;
  pubDate: string;
  imageUrl: string;
  duration: number;
}

interface CurrentFirstoryEpisodes {
  ids: Set<string>;
  episodesById: Map<string, FirstoryEpisode>;
}

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, ...val] = line.split("=");
      if (key && val.length > 0) {
        process.env[key.trim()] = val.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const minArg = args.find((arg) => arg.startsWith("--min-current-count="));
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const credentialsArg = args.find((arg) => arg.startsWith("--credentials="));
  const projectIdArg = args.find((arg) => arg.startsWith("--project-id="));

  return {
    confirmDelete: args.includes("--confirm-delete"),
    confirmUpsertMissing: args.includes("--confirm-upsert-missing"),
    allowSmallScrape: args.includes("--allow-small-scrape"),
    minCurrentCount: parsePositiveInt(
      minArg?.split("=")[1] ?? process.env.MIN_CURRENT_FIRSTORY_EPISODES,
      DEFAULT_MIN_CURRENT_COUNT
    ),
    limit: limitArg ? parsePositiveInt(limitArg.split("=")[1], 0) : undefined,
    credentialsPath: credentialsArg?.split("=").slice(1).join("="),
    projectId: projectIdArg?.split("=").slice(1).join("="),
  };
}

function storyIdFromLink(link?: string): string | undefined {
  if (!link) return undefined;
  return link.split("/").filter(Boolean).pop()?.split("?")[0]?.trim() || undefined;
}

function parseDuration(durationText: string): number {
  const parts = durationText.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function parseFirstoryCard(raw: { href: string; text: string; imageUrl: string }): FirstoryEpisode | undefined {
  const guid = storyIdFromLink(raw.href);
  if (!guid || !raw.text.trim()) return undefined;

  const lines = raw.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const doubleSpaceParts = raw.text.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  const title = lines[0] || doubleSpaceParts[0] || "";
  const metaText = lines.find((line) => /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(line)) || doubleSpaceParts[1] || "";
  const dateMatch = metaText.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/)?.[0];
  const durationMatch = metaText.match(/\d{1,2}:\d{2}(?::\d{2})?/)?.[0];
  const normalizedDate = dateMatch?.replace(/\//g, "-");

  return {
    guid,
    title,
    firstoryLink: raw.href.trim(),
    pubDate: normalizedDate
      ? new Date(`${normalizedDate}T06:00:00+08:00`).toUTCString()
      : new Date().toUTCString(),
    imageUrl: raw.imageUrl.trim(),
    duration: durationMatch ? parseDuration(durationMatch) : 0,
  };
}

async function getCurrentFirstoryEpisodes(): Promise<CurrentFirstoryEpisodes> {
  console.log("Launching Playwright to read current Firstory episodes...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    locale: "zh-TW",
  });

  const getStoryIds = async () => {
    const hrefs = await page.evaluate(() => {
      const hrefSet = new Set<string>();
      const nodes = document.querySelectorAll("[href*='/story/']");

      for (const node of nodes) {
        const rawHref = node.getAttribute("href") || "";
        try {
          const abs = new URL(rawHref, window.location.origin).toString();
          if (abs.includes("/story/")) hrefSet.add(abs);
        } catch {
          // Ignore malformed hrefs.
        }
      }

      const html = document.documentElement?.outerHTML || "";
      const absMatches = html.match(/https?:\/\/open\.firstory\.me\/story\/[a-z0-9-]+/gi) || [];
      for (const href of absMatches) hrefSet.add(href);

      const relMatches = html.match(/\/story\/[a-z0-9-]+/gi) || [];
      for (const relative of relMatches) {
        try {
          const abs = new URL(relative, window.location.origin).toString();
          if (abs.includes("/story/")) hrefSet.add(abs);
        } catch {
          // Ignore malformed story paths.
        }
      }

      return Array.from(hrefSet);
    });

    return new Set(hrefs.map(storyIdFromLink).filter((id): id is string => Boolean(id)));
  };

  const getStoryCards = async () => {
    return page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a")).filter((a) => a.href.includes("/story/"));
      return anchors.map((a) => {
        const text = a.innerText.trim();
        let imageUrl = "";
        const img = a.querySelector("img");
        if (img) {
          imageUrl = img.src || img.getAttribute("src") || "";
        } else {
          let parent = a.parentElement;
          for (let i = 0; i < 4; i++) {
            if (!parent) break;
            const siblingImg = parent.querySelector("img");
            if (siblingImg) {
              imageUrl = siblingImg.src || siblingImg.getAttribute("src") || "";
              break;
            }
            parent = parent.parentElement;
          }
        }

        return { text, href: a.href, imageUrl };
      });
    });
  };

  try {
    console.log(`Navigating to: ${FIRSTORY_EPISODES_URL}`);
    await page.goto(FIRSTORY_EPISODES_URL, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    await page.waitForTimeout(3000);

    let ids = await getStoryIds();
    let previousCount = ids.size;
    let staleAttempts = 0;
    console.log(`Initial visible Firstory episodes: ${previousCount}`);

    for (let i = 0; i < MAX_LOAD_ATTEMPTS; i++) {
      const clickedLoadMoreText = await page.evaluate(() => {
        const loadMorePattern = /\u8f09\u5165\u66f4\u591a|\u986f\u793a\u66f4\u591a|\u66f4\u591a|load more|show more/i;
        const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, [role='button']"));

        for (const candidate of candidates) {
          const text = (candidate.innerText || candidate.textContent || "").trim();
          const box = candidate.getBoundingClientRect();
          const isDisabled =
            candidate.hasAttribute("disabled") ||
            candidate.getAttribute("aria-disabled") === "true";
          const isVisible = box.width > 0 && box.height > 0;

          if (isVisible && !isDisabled && loadMorePattern.test(text)) {
            candidate.scrollIntoView({ block: "center" });
            candidate.click();
            return text || "[button without text]";
          }
        }

        return "";
      });

      if (!clickedLoadMoreText) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.mouse.wheel(0, 5000);
      }

      await page.waitForTimeout(clickedLoadMoreText ? 3000 : 2000);
      ids = await getStoryIds();
      console.log(
        `[Firstory load ${i + 1}] current count: ${ids.size}` +
        (clickedLoadMoreText ? `, clicked "${clickedLoadMoreText}"` : "")
      );

      if (ids.size === previousCount && ids.size > 0) {
        staleAttempts++;
        await page.waitForTimeout(2500);
        ids = await getStoryIds();

        if (ids.size > previousCount) {
          previousCount = ids.size;
          staleAttempts = 0;
          continue;
        }

        if (staleAttempts >= MAX_STALE_LOAD_ATTEMPTS) {
          console.log("Episode count stopped increasing. Finished loading Firstory list.");
          break;
        }
      } else {
        staleAttempts = 0;
      }

      previousCount = ids.size;
    }

    const episodesById = new Map<string, FirstoryEpisode>();
    for (const card of await getStoryCards()) {
      const episode = parseFirstoryCard(card);
      if (episode && !episodesById.has(episode.guid)) {
        episodesById.set(episode.guid, episode);
      }
    }

    return { ids, episodesById };
  } finally {
    await browser.close();
  }
}

async function upsertMissingDocs(
  db: admin.firestore.Firestore,
  missingIds: string[],
  episodesById: Map<string, FirstoryEpisode>
): Promise<void> {
  const batch = db.batch();
  let queued = 0;

  for (const id of missingIds) {
    const episode = episodesById.get(id);
    if (!episode) {
      console.warn(`Skipping ${id}: current Firstory metadata was not available.`);
      continue;
    }

    batch.set(
      db.collection(COLLECTION).doc(id),
      {
        title: episode.title,
        firstoryLink: episode.firstoryLink,
        pubDate: episode.pubDate,
        imageUrl: episode.imageUrl,
        duration: episode.duration,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    queued++;
  }

  if (queued === 0) {
    console.log("No missing docs had metadata available for upsert.");
    return;
  }

  await batch.commit();
  console.log(`Upserted ${queued} missing current Firstory docs into ${COLLECTION}.`);
}

async function deleteInBatches(db: admin.firestore.Firestore, staleDocs: PodcastDoc[]): Promise<void> {
  for (let i = 0; i < staleDocs.length; i += 450) {
    const batch = db.batch();
    const chunk = staleDocs.slice(i, i + 450);

    for (const doc of chunk) {
      batch.delete(db.collection(COLLECTION).doc(doc.id));
    }

    await batch.commit();
    console.log(`Deleted ${Math.min(i + chunk.length, staleDocs.length)} / ${staleDocs.length} stale docs...`);
  }
}

async function main() {
  const options = parseArgs();
  loadEnvLocal();

  if (admin.apps.length === 0) {
    const credential = options.credentialsPath
      ? admin.credential.cert(
        JSON.parse(fs.readFileSync(path.resolve(options.credentialsPath), "utf-8")) as admin.ServiceAccount
      )
      : admin.credential.applicationDefault();

    admin.initializeApp({
      credential,
      projectId: options.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sci-listen-guide",
    });
  }

  const db = admin.firestore();
  const currentFirstory = await getCurrentFirstoryEpisodes();
  const currentFirstoryIds = currentFirstory.ids;

  console.log(`Current Firstory story ids found: ${currentFirstoryIds.size}`);
  if (!options.allowSmallScrape && currentFirstoryIds.size < options.minCurrentCount) {
    throw new Error(
      `Aborting: Firstory scrape found only ${currentFirstoryIds.size} episodes. ` +
      `Expected at least ${options.minCurrentCount}. ` +
      "This protects against deleting docs after a partial scrape. " +
      "Use --min-current-count=N or --allow-small-scrape if this is intentional."
    );
  }

  console.log(`Reading Firestore collection: ${COLLECTION}`);
  const snapshot = await db.collection(COLLECTION).get();
  const firestoreDocs: PodcastDoc[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      firstoryLink: data.firstoryLink,
      pubDate: data.pubDate,
    };
  });

  const staleDocs = firestoreDocs.filter((doc) => {
    const linkedStoryId = storyIdFromLink(doc.firstoryLink);
    return !currentFirstoryIds.has(doc.id) && (!linkedStoryId || !currentFirstoryIds.has(linkedStoryId));
  });
  const firestoreIds = new Set<string>();
  for (const doc of firestoreDocs) {
    firestoreIds.add(doc.id);
    const linkedStoryId = storyIdFromLink(doc.firstoryLink);
    if (linkedStoryId) firestoreIds.add(linkedStoryId);
  }
  const missingFirestoreIds = Array.from(currentFirstoryIds).filter((id) => !firestoreIds.has(id));

  const docsToDelete = options.limit ? staleDocs.slice(0, options.limit) : staleDocs;

  console.log("");
  console.log(`Firestore docs in ${COLLECTION}: ${firestoreDocs.length}`);
  console.log(`Stale docs not found on current Firstory list: ${staleDocs.length}`);
  console.log(`Current Firstory ids missing from Firestore: ${missingFirestoreIds.length}`);
  for (const id of missingFirestoreIds.slice(0, 30)) {
    console.log(`+ ${id} | https://open.firstory.fm/story/${id}`);
  }
  if (missingFirestoreIds.length > 30) {
    console.log(`...and ${missingFirestoreIds.length - 30} more missing ids.`);
  }
  if (options.limit) console.log(`Limit active: ${docsToDelete.length} docs will be considered this run.`);

  for (const doc of docsToDelete.slice(0, 30)) {
    console.log(`- ${doc.id} | ${doc.pubDate || "no date"} | ${doc.title || "(untitled)"}`);
  }
  if (docsToDelete.length > 30) {
    console.log(`...and ${docsToDelete.length - 30} more.`);
  }

  if (!options.confirmDelete) {
    console.log("");
    if (options.confirmUpsertMissing) {
      await upsertMissingDocs(db, missingFirestoreIds, currentFirstory.episodesById);
      return;
    } else {
      console.log("Dry run only. No Firestore documents were deleted or upserted.");
      console.log("Run again with --confirm-delete to delete stale docs, or --confirm-upsert-missing to add missing current docs.");
      return;
    }
  }

  if (docsToDelete.length === 0) {
    console.log("No stale docs to delete.");
    return;
  }

  console.log("");
  console.log(`Deleting ${docsToDelete.length} stale docs from ${COLLECTION}...`);
  await deleteInBatches(db, docsToDelete);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

import { EpisodeData } from "@/components/episode/EpisodeView";
import "server-only";

export const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
export const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

// Parse Firestore REST API value format into plain JS values
export function parseFirestoreValue(value: FirestoreValue | undefined | null): unknown {
  if (value === undefined || value === null) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  return null;
}

// Parse Firestore fields object into plain JS object
export function parseFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

export type SearchIndexItem = {
  id: string;
  title: string;
  tags?: string[];
  // 以下為新增：用於識別「純 podcast」條目（沒有伴讀單元）
  isPodcastOnly?: boolean;
  spotifyLink?: string;
  applePodcastLink?: string;
  firstoryLink?: string;
  pubDate?: string;
  // 伴讀 episodes 對應的 Firstory GUID（用於去重）
  firstoryGuid?: string;
};

/**
 * Get all published episodes. Useful for SSG generateStaticParams and generating the search index.
 */
export async function getAllPublishedEpisodes(): Promise<EpisodeData[]> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: "episodes" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "published" },
        },
      },
      // Order by some field if needed, currently just getting all
    },
  };

  const res = await fetch(FIRESTORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Firestore REST API error:", await res.text());
    return [];
  }

  const data = await res.json();
  const episodes: EpisodeData[] = [];

  for (const doc of data) {
    if (!doc.document) continue;
    const docName: string = doc.document.name;
    const id = docName.split("/").pop()!;
    const fields = parseFirestoreFields(doc.document.fields || {});
    episodes.push({ id, ...fields } as EpisodeData);
  }

  return episodes;
}

export async function getLatestPublishedEpisode(): Promise<EpisodeData | null> {
  const episodes = await getAllPublishedEpisodes();

  return episodes
    .filter((episode) => typeof episode.pubDate === "string")
    .sort((a, b) => new Date(b.pubDate as string).getTime() - new Date(a.pubDate as string).getTime())[0] ?? null;
}

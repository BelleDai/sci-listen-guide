import { EpisodeData } from "@/components/episode/EpisodeView";
import "server-only";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

// Parse Firestore REST API value format into plain JS values
export function parseFirestoreValue(value: any): any {
  if (value === undefined || value === null) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return parseInt(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if ("mapValue" in value) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  return null;
}

// Parse Firestore fields object into plain JS object
export function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

export type SearchIndexItem = {
  id: string;
  title: string;
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
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "DESCENDING" }],
      limit: 1,
    },
  };

  const res = await fetch(FIRESTORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Firestore REST API error:", await res.text());
    return null;
  }

  const data = await res.json();
  const doc = data.find((d: any) => d.document);
  if (!doc) return null;

  const docName: string = doc.document.name;
  const id = docName.split("/").pop()!;
  const fields = parseFirestoreFields(doc.document.fields || {});

  return { id, ...fields } as EpisodeData;
}

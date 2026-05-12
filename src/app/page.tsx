import EpisodeView, { EpisodeData } from "@/components/episode/EpisodeView";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

// Parse Firestore REST API value format into plain JS values
function parseFirestoreValue(value: any): any {
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
function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

async function getLatestPublishedEpisode(): Promise<EpisodeData | null> {
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
      limit: 1,
    },
  };

  const res = await fetch(FIRESTORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // No caching for build time - fetch fresh data each build
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Firestore REST API error:", await res.text());
    return null;
  }

  const data = await res.json();

  // runQuery returns an array; skip entries with no document
  const doc = data.find((d: any) => d.document);
  if (!doc) return null;

  const docName: string = doc.document.name;
  const id = docName.split("/").pop()!;
  const fields = parseFirestoreFields(doc.document.fields || {});

  return { id, ...fields } as EpisodeData;
}

export default async function Home() {
  let episodeData: EpisodeData | null = null;

  try {
    episodeData = await getLatestPublishedEpisode();
  } catch (error) {
    console.error("Error fetching episode:", error);
  }

  if (!episodeData) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <h2 className="text-2xl font-bold">目前沒有已發布的內容</h2>
      </div>
    );
  }

  return <EpisodeView episodeData={episodeData} />;
}

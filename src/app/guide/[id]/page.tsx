import { getAllPublishedEpisodes, parseFirestoreFields, PROJECT_ID, FIRESTORE_URL } from "@/lib/episodes";
import EpisodeView, { EpisodeData } from "@/components/episode/EpisodeView";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Dynamic static generation
export async function generateStaticParams() {
  const episodes = await getAllPublishedEpisodes();
  return episodes.map((ep) => ({
    id: ep.id,
  }));
}

// Fetch single episode
async function getEpisodeData(id: string): Promise<EpisodeData | null> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: "episodes" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "published" },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "__name__" },
                op: "EQUAL",
                value: { referenceValue: `projects/${PROJECT_ID}/databases/(default)/documents/episodes/${id}` },
              },
            },
          ],
        },
      },
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
  const docId = docName.split("/").pop()!;
  const fields = parseFirestoreFields(doc.document.fields || {});

  return { id: docId, ...fields } as EpisodeData;
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const episodeData = await getEpisodeData(params.id);

  if (!episodeData) {
    return {
      title: "找不到集數 | 科學好好聽",
    };
  }

  // Use KeyTakeaway for description, joining them together
  const rawDescription = episodeData.KeyTakeaway?.map((k) => k.content).join(" ") || "科學好好聽，科普伴讀。";
  const plainTextDescription = rawDescription.replace(/[#*`_~>\[\]]/g, "").trim();
  const description = plainTextDescription.length > 150 
    ? plainTextDescription.slice(0, 150) + "..." 
    : plainTextDescription;

  const keywords = episodeData.Tags || [];

  return {
    title: `${episodeData.Title} | 科學好好聽`,
    description,
    keywords,
    openGraph: {
      title: `${episodeData.Title} | 科學好好聽`,
      description,
      images: [episodeData.Cover],
      type: "article",
      tags: keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: `${episodeData.Title} | 科學好好聽`,
      description,
      images: [episodeData.Cover],
    },
  };
}

export default async function EpisodePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const episodeData = await getEpisodeData(params.id);

  if (!episodeData) {
    notFound();
  }

  // Fetch all episodes for the search bar
  const allEpisodes = await getAllPublishedEpisodes();
  const searchIndex = allEpisodes.map((ep) => ({ id: ep.id, title: ep.Title, tags: ep.Tags || [], firstoryGuid: (ep as any).firstoryGuid || undefined }));

  // Note: The Header with Stepper is embedded inside EpisodeView. 
  // We need to pass the search index to EpisodeView so it can pass it to Header.
  // We should update EpisodeView to accept `searchIndex`.

  return <EpisodeView episodeData={episodeData} searchIndex={searchIndex} />;
}

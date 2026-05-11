import EpisodeView, { EpisodeData } from "@/components/episode/EpisodeView";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

// Next.js ISR: Revalidate every 60 seconds.
export const revalidate = 60;

export default async function Home() {
  try {
    const episodesRef = collection(db, "episodes");
    const q = query(episodesRef, where("status", "==", "published"), limit(1));
    const querySnapshot = await getDocs(q);

    let episodeData: EpisodeData | null = null;
    if (!querySnapshot.empty) {
      episodeData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as EpisodeData;
    }

    if (!episodeData) {
      return (
        <div className="flex min-h-screen items-center justify-center text-white">
          <h2 className="text-2xl font-bold">目前沒有已發布的內容</h2>
        </div>
      );
    }

    return <EpisodeView episodeData={episodeData} />;
  } catch (error) {
    console.error("Error fetching episode:", error);
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <h2 className="text-2xl font-bold">載入資料時發生錯誤</h2>
      </div>
    );
  }
}

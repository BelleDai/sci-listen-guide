import HomeListenPlatforms from "@/components/home/HomeListenPlatforms";
import LatestPodcastTopFive from "@/components/home/LatestPodcastTopFive";
import LatestEpisodesCarousel from "@/components/home/LatestEpisodesCarousel";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import { getAllPublishedEpisodes } from "@/lib/episodes";
import type { PodcastListItem } from "@/types/podcast-list";
import { ThumbsUp, GraduationCap, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import ClientHeroButton from "@/components/episode/ClientHeroButton";
import FloatingDecor from "@/components/home/FloatingDecor";
import HomeGamesDropdown from "@/components/home/HomeGamesDropdown";
import podcastList from "../../public/podcast-list.json";

export default async function Home() {
  const episodes = await getAllPublishedEpisodes();
  const searchIndex = episodes.map((ep) => ({
    id: ep.id,
    title: ep.Title,
    tags: ep.Tags || [],
    firstoryGuid: typeof ep.firstoryGuid === "string" ? ep.firstoryGuid : undefined,
  }));
  // Project to minimal shape so only 3 fields cross the server→client boundary
  const latestFiveEpisodes = [...episodes]
    .filter((ep) => typeof ep.pubDate === "string")
    .sort((a, b) => new Date(b.pubDate as string).getTime() - new Date(a.pubDate as string).getTime())
    .slice(0, 5)
    .map(({ id, Title, Cover }) => ({ id, Title, Cover }));
  const latestPodcastTopFive = [...(podcastList.episodes as PodcastListItem[])]
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 5);

  return (
    <>
      <Header episodes={searchIndex} />
      <FloatingDecor count={20} />
      <main className="text-foreground min-h-screen">
        {/* =========================================
            Group 1: Hero, Planets, Shortcut
        ========================================= */}
        <div className="py-8 sm:py-10 flex flex-col gap-8 sm:gap-10">
          {/* ── Hero ── */}
          <section className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 text-stroke-dark animate-in fade-in slide-in-from-top-4 duration-500">
              聽科學，<span className="text-secondary">探索世界！</span>
            </h1>
            <p className="text-white/90 mb-7 text-base sm:text-lg leading-relaxed animate-in fade-in duration-700 delay-150">
              200+ 集精彩科普故事，搭配 50+ 集精選<span className="font-bold">『伴讀單元』</span>
              <br />
              給孩子最棒的<span className="text-accent font-bold">科學啟蒙</span>！
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-700 delay-300">
              <ClientHeroButton />
              <HomeGamesDropdown />
            </div>
          </section>

          {/* ── 主題星球探索 ── */}
          <section id="topic-planets" className="scroll-mt-20">
            <div className="max-w-2xl mx-auto px-4 mb-5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                微觀世界到浩瀚星空
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                每一集都是一場<span className="text-accent font-bold">知識的深度旅行</span>
              </p>
            </div>

            {/* Full-width static hero image — above the fold, prioritise for LCP */}
            <div className="max-w-2xl mx-auto px-4 mb-5">
              <img
                src="/hero-collage.png"
                alt="科學百科主題拼貼：火山、地球、顯微鏡、海洋生物、昆蟲、太空"
                className="w-full h-auto block"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </section>

          {/* ── Latest Episodes Carousel ── */}
          {latestFiveEpisodes.length > 0 && (
            <LatestEpisodesCarousel episodes={latestFiveEpisodes} />
          )}
        </div>

        {/* =========================================
            Group 2: Listen Platforms
        ========================================= */}
        <div className="bg-black/10 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12 border-t border-white/10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)]">
          <section id="listen-platforms" className="max-w-2xl w-full mx-auto px-4 scroll-mt-20">
            <div className="mb-5 space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-secondary" />
                全系列 200+ 集故事聽翻天
              </h2>
            </div>
            <HomeListenPlatforms />
            <LatestPodcastTopFive episodes={latestPodcastTopFive} />
          </section>
        </div>

        {/* =========================================
            Group 3: Brand Story
        ========================================= */}
        <div className="py-8 sm:py-10 flex flex-col gap-8 sm:gap-10">
          <section className="max-w-2xl w-full mx-auto px-4">
            <div
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 shadow-[var(--shadow-card)] relative overflow-hidden"
              style={{ backgroundColor: "rgba(52, 49, 76, 0.82)" }}
            >
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/20 blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/25 text-accent font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  理工爸爸 × 好奇博士
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3 relative z-10">
                理工爸爸給台灣孩子的<br className="sm:hidden" />
                <span className="text-secondary">科學禮物</span>
              </h2>

              <p className="text-white/90 leading-relaxed text-sm sm:text-base mb-4 relative z-10">
                主持人擁有 <span className="text-accent font-bold">台大資工博士</span> 背景，每一集都經過
                <span className="text-accent font-bold"> 嚴謹邏輯把關 </span>
                ，把艱深的科學知識變成孩子聽得懂、聽了還想再聽的故事。
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 text-white/90 text-sm relative z-10">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 科學知識精準把關</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 親子共學互動設計</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 在地觀點，繁中原創</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 持續上新，每週更新</li>
              </ul>

              <div className="h-px w-full bg-border/30 my-5 relative z-10" />

              <div className="space-y-3 text-white/90 text-sm sm:text-base leading-relaxed relative z-10">
                <p>創立這個頻道的起點，其實是一個爸爸的小小煩惱：家裡有個熱愛科學、卻總是靜不下來看書的兒子。👦🧪</p>
                <p>我想給他最棒的科學啟蒙，但市面上的有聲教材，不是良莠不齊，就是充滿了不習慣的口音。身為忙碌的工程師，我採用 AI 技術來解決錄製的時間壓力，但最在乎的始終是「內容的品質」。</p>
                <p className="font-bold text-white">謝謝所有喜歡這裡的大小朋友，讓我們繼續一起聽科學、探索世界！</p>
              </div>

              <div className="mt-6 relative z-10">
                <a
                  href="https://www.facebook.com/profile.php?id=61577975781160"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-base text-white shadow-[var(--shadow-glow)] hover:scale-[1.03] transition-transform"
                  style={{ backgroundColor: "#1877F2" }}
                >
                  <ThumbsUp className="w-5 h-5" />
                  前往 Facebook 粉絲頁按讚
                </a>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
}

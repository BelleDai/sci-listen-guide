import HomeListenPlatforms from "@/components/home/HomeListenPlatforms";
import LatestPodcastTopFive from "@/components/home/LatestPodcastTopFive";
import LatestEpisodesCarousel from "@/components/home/LatestEpisodesCarousel";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import { GAME_METADATA } from "@/components/games/core/gameMetadata";
import { getAllPublishedEpisodes } from "@/lib/episodes";
import type { PodcastListItem } from "@/types/podcast-list";
import Link from "next/link";
import {
  BookOpen,
  Gamepad2,
  GraduationCap,
  Headphones,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
} from "lucide-react";
import FloatingDecor from "@/components/home/FloatingDecor";
import podcastList from "../../public/podcast-list.json";
import ClientHeroButton from "@/components/episode/ClientHeroButton";
import LearningPathSection from "@/components/home/LearningPathSection";



const gameHighlights = [
  {
    gameId: "colorful-balloons" as const,
    description: "限時戳氣球，越快越刺激，練反應也練判斷力。",
  },
  {
    gameId: "golden-coins" as const,
    description: "接住正確金幣、避開陷阱，把複習變成收集挑戰。",
  },
  {
    gameId: "treasure-hunter" as const,
    description: "跟著線索尋寶解題，邊探索邊回想重點。",
  },
];

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
        <section className="px-4 pb-10 pt-7 sm:pb-14 sm:pt-10">
          <div className="mx-auto grid max-w-5xl items-center gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div className="text-center lg:text-left">

              <h1 className="text-4xl font-black leading-[1.08] text-white text-stroke-dark sm:text-5xl lg:text-[3.35rem]">
                聽故事、讀科普、<span className="inline-block whitespace-nowrap text-secondary">玩中學</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8 lg:mx-0">
                微觀世界、恐龍海洋、地球宇宙，科學好好聽把包羅萬象的主題變成孩子聽得懂、想再探索的知識旅行。
              </p>

              <div className="mt-6 flex flex-row items-center justify-center gap-3 lg:justify-start">
                <ClientHeroButton />
                <Link
                  href="/games"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/45 bg-accent/15 px-6 py-3.5 text-base font-medium text-white/90 transition hover:border-accent hover:bg-accent/25 hover:text-white sm:w-auto"
                >
                  <Gamepad2 className="h-5 w-5" />
                  <div><span className="hidden sm:inline">前往</span>遊戲基地</div>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
              <div className="absolute -inset-2 rounded-[2rem] bg-accent/10 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden">
                <img
                  src="/hero-science-learning.webp"
                  alt="兩位孩子在科學學習基地中聽 Podcast、閱讀科普伴讀並玩闖關遊戲"
                  className="aspect-video w-full rounded-[1.25rem] object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <LearningPathSection />

        <section id="latest-guides" className="scroll-mt-20 px-4 py-10 sm:py-14">
          <div className="mx-auto mb-7 max-w-5xl sm:mb-8">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <BookOpen className="h-6 w-6 text-secondary" />
              最新科普伴讀
            </h2>
            <p className="mt-3 max-w-2xl text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8">
              每篇都幫孩子抓出重點，親子一起學習，讓故事學得更深。
            </p>
          </div>

          {latestFiveEpisodes.length > 0 && (
            <LatestEpisodesCarousel episodes={latestFiveEpisodes} />
          )}
        </section>

        <section id="listen-platforms" className="scroll-mt-20 bg-black/10 px-4 py-10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)] sm:py-14">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-7 max-w-2xl space-y-3 sm:mb-8">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
                <Headphones className="h-6 w-6 text-secondary" />
                全系列 200+ 集故事聽翻天
              </h2>
            </div>
            <HomeListenPlatforms />
            <LatestPodcastTopFive episodes={latestPodcastTopFive} />
          </div>
        </section>

        <section id="game-intro-section" className="border-y border-white/10 bg-black/10 px-4 py-10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.26)] sm:py-14">
          <div className="mx-auto grid max-w-5xl items-center gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/15 px-3 py-1 text-sm font-semibold text-secondary/90">
                <Star className="h-4 w-4 fill-current" />
                邊玩邊學
              </div>
              <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                把科學變成闖關遊戲
              </h2>
              <p className="mt-3 text-base font-normal leading-7 text-white/75 sm:mt-4 sm:text-lg sm:leading-8">
                遊戲基地把每集知識變成小任務。孩子一邊闖關，一邊回想 Podcast 裡的重點。
              </p>
              <Link
                href="/games"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03] sm:w-auto"
              >
                <PlayCircle className="h-5 w-5" />
                前往遊戲基地
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              {gameHighlights.map((item) => {
                const meta = GAME_METADATA[item.gameId];

                return (
                  <div
                    key={item.gameId}
                    className="group relative min-h-[132px] overflow-hidden rounded-2xl p-4 leading-7 transition duration-200 hover:-translate-y-1 sm:p-5"
                    style={meta.cardStyle}
                  >
                    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/15" />
                    <div className="absolute bottom-3 right-4 text-5xl opacity-10 transition group-hover:scale-110 group-hover:opacity-15" aria-hidden="true">
                      {meta.emoji}
                    </div>
                    <div className="relative flex items-start gap-3">
                      <span
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg"
                        style={meta.badgeClassName}
                        aria-hidden="true"
                      >
                        {meta.emoji}
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-white sm:text-lg">{meta.label}</span>
                        <span className="mt-1 block text-sm font-normal leading-6 text-white/78 sm:text-base sm:leading-7">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="group relative min-h-[132px] overflow-hidden rounded-2xl border border-secondary/35 bg-gradient-to-br from-card/95 to-secondary/15 p-4 leading-7 shadow-[0_0_18px_hsl(var(--secondary)/0.18),inset_0_-3px_8px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-1 sm:p-5">
                <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-secondary/15 blur-2xl transition group-hover:bg-secondary/20" />
                <div className="absolute bottom-3 right-4 text-5xl opacity-10 transition group-hover:scale-110 group-hover:opacity-15" aria-hidden="true">
                  🏅
                </div>
                <div className="relative flex items-start gap-3">
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-secondary/50 bg-secondary/20 text-3xl shadow-lg"
                    aria-hidden="true"
                  >
                    🏅
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-white sm:text-lg">徽章與進度</span>
                    <span className="mt-1 block text-sm font-normal leading-6 text-white/78 sm:text-base sm:leading-7">
                      完成關卡後，看見自己的成長。
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            Group 3: Brand Story
        ========================================= */}
        <div className="flex flex-col gap-8 py-10 sm:gap-10 sm:py-14">
          <section className="mx-auto w-full max-w-5xl px-4">
            <div
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 shadow-[var(--shadow-card)] relative overflow-hidden"
              style={{ backgroundColor: "rgba(52, 49, 76, 0.82)" }}
            >
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/20 blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/25 text-accent/90 font-semibold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  理工爸爸 × 好奇博士
                </span>
              </div>

              <h2 className="relative z-10 mb-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                理工爸爸給台灣孩子的<br className="sm:hidden" />
                <span className="text-secondary">科學禮物</span>
              </h2>

              <p className="relative z-10 mb-5 max-w-3xl text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8">
                主持人擁有 <span className="text-accent font-bold">台大資工博士</span> 背景，每一集都經過
                <span className="text-accent font-bold"> 嚴謹邏輯把關 </span>
                ，把艱深的科學知識變成孩子聽得懂、聽了還想再聽的故事。
              </p>

              <ul className="relative z-10 mb-5 grid grid-cols-1 gap-3 text-base font-normal text-white/75 sm:grid-cols-2">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 科學知識精準把關</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 親子共學互動設計</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 在地觀點，繁中原創</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 持續上新，每週更新</li>
              </ul>

              <div className="h-px w-full bg-border/30 my-5 relative z-10" />

              <div className="relative z-10 max-w-3xl space-y-3 text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8">
                <p>創立這個頻道的起點，其實是一個爸爸的小小煩惱：家裡有個熱愛科學、卻總是靜不下來看書的兒子。👦🧪</p>
                <p>我想給他最棒的科學啟蒙，但市面上的有聲教材，不是良莠不齊，就是充滿了不習慣的口音。身為忙碌的工程師，我採用 AI 技術來解決錄製的時間壓力，但最在乎的始終是「內容的品質」。</p>
                <p className="font-semibold text-white/90">謝謝所有喜歡這裡的大小朋友，讓我們繼續一起聽科學、探索世界！</p>
              </div>

              <div className="mt-6 relative z-10">
                <a
                  href="https://www.facebook.com/profile.php?id=61577975781160"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-base text-white shadow-[var(--shadow-glow)] hover:scale-[1.03] transition-transform"
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

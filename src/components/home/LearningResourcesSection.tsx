"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Gamepad2, Lightbulb } from "lucide-react";
import FloatingDecor from "@/components/home/FloatingDecor";
import { GAME_METADATA } from "@/components/games/core/gameMetadata";
import type { EpisodeQuizGameId } from "@/components/games/core/episodeQuizzes";
import { getTaipeiDateKey, pickDaily } from "@/lib/daily-pick";
import { getGuideEpisodeLabel, getPodcastDisplayTitle } from "@/lib/podcast";
import { trackLearningResourceClick } from "@/lib/analytics";

export type ResourceGuide = { id: string; title: string; cover: string };
export type ResourceGameStage = { id: string; name: string; emoji: string };
export type ResourceGameGroup = { gameId: EpisodeQuizGameId; stages: ResourceGameStage[] };

const DAILY_GUIDE_COUNT = 3;

const noopSubscribe = () => () => {};

/** 只在瀏覽器取得台北日期；伺服器端（build）回傳 null，先顯示骨架避免 hydration 不一致 */
function useTaipeiDateKey(): string | null {
  return useSyncExternalStore(noopSubscribe, () => getTaipeiDateKey(), () => null);
}

/** 打開 Header 的搜尋面板（列出全部伴讀與節目） */
function openHeaderSearch() {
  const button = document.querySelector<HTMLButtonElement>('header button[aria-label="展開搜尋"]');
  if (!button) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.setTimeout(() => button.click(), 200);
}

function SkeletonCards({ className }: { className: string }) {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className={`animate-pulse rounded-2xl border border-white/10 bg-white/[0.05] ${className}`} aria-hidden="true" />
      ))}
    </>
  );
}

interface Props {
  guides: ResourceGuide[];
  gameGroups: ResourceGameGroup[];
}

export default function LearningResourcesSection({ guides, gameGroups }: Props) {
  const dateKey = useTaipeiDateKey();
  const dailyGuides = dateKey ? pickDaily(guides, DAILY_GUIDE_COUNT, `guides:${dateKey}`) : [];
  const dailyStages = dateKey
    ? gameGroups.flatMap(({ gameId, stages }) =>
        pickDaily(stages, 1, `games:${gameId}:${dateKey}`).map((stage) => ({ ...stage, gameId }))
      )
    : [];

  return (
    <section
      id="resources"
      aria-labelledby="resources-heading"
      className="section-band section-band-indigo relative isolate scroll-mt-28 md:scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <FloatingDecor variant="section" count={10} />
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">KEEP EXPLORING</p>
          <h2 id="resources-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
            <Lightbulb className="h-6 w-6 text-secondary" aria-hidden="true" />
            更多親子學習資源
          </h2>
          <p className="mt-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            好奇心不只停在聽完：讀一篇科普伴讀、闖一關科學遊戲，讓知識繼續發芽。
          </p>
        </div>

        {/* 科普伴讀：每天固定隨機 3 篇 */}
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
              今日科普伴讀
            </h3>
            <button
              type="button"
              onClick={openHeaderSearch}
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-1 text-sm font-semibold text-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              瀏覽全部伴讀
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {dailyGuides.length === 0 ? (
              <SkeletonCards className="h-28 sm:h-72" />
            ) : (
              dailyGuides.map((guide, index) => {
                const label = getGuideEpisodeLabel(guide.id);
                return (
                  <li key={guide.id} className="min-w-0">
                    <Link
                      href={`/guide/${guide.id}`}
                      onClick={() => trackLearningResourceClick("guide", guide.id, index + 1)}
                      className="group flex h-full overflow-hidden rounded-2xl border border-white/12 bg-[#1e1c2a] transition hover:-translate-y-1 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-col"
                    >
                      <div className="aspect-square w-28 flex-shrink-0 overflow-hidden bg-white/10 sm:aspect-[4/3] sm:w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={guide.cover}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
                        {label && <span className="text-xs font-semibold text-accent sm:text-sm">{label}</span>}
                        <span className="line-clamp-2 text-base font-semibold leading-snug text-white">
                          {getPodcastDisplayTitle(guide.title)}
                        </span>
                        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-secondary group-hover:text-white">
                          開始閱讀
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* 遊戲基地：三種遊戲各一關 */}
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <Gamepad2 className="h-5 w-5 text-accent" aria-hidden="true" />
              今日挑戰關卡
            </h3>
            <Link
              href="/games"
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-1 text-sm font-semibold text-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              前往遊戲基地
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {dailyStages.length === 0 ? (
              <SkeletonCards className="h-40" />
            ) : (
              dailyStages.map((stage, index) => {
                const meta = GAME_METADATA[stage.gameId];
                return (
                  <li key={stage.id} className="min-w-0">
                    <Link
                      href={`/games/${stage.id}`}
                      onClick={() => trackLearningResourceClick("game", stage.id, index + 1)}
                      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-4 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5"
                      style={meta.cardStyle}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                          style={meta.badgeClassName}
                          aria-hidden="true"
                        >
                          {meta.emoji}
                        </span>
                        <span className="text-sm font-semibold text-white/85">{meta.label}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-base font-semibold leading-snug text-white">
                          <span aria-hidden="true">{stage.emoji} </span>
                          {stage.name}
                        </span>
                      </span>
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-secondary group-hover:text-white">
                        開始挑戰
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

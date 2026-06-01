"use client";

import PlayerLaunch from "@/components/episode/PlayerLaunch";
import type { PodcastListItem } from "@/types/podcast-list";

function openHeaderSearch() {
  const btn = document.querySelector<HTMLButtonElement>(
    'header button[aria-label="展開搜尋"]'
  );
  if (btn) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => btn.click(), 200);
  }
}

function formatDate(pubDate: string) {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
  });
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  return `${Math.round(seconds / 60)} 分鐘`;
}

interface Props {
  episodes: PodcastListItem[];
}

export default function LatestPodcastTopFive({ episodes }: Props) {
  if (episodes.length === 0) return null;

  return (
    <div className="mt-9 space-y-4 sm:mt-10">
      <p className="text-white/85 text-base leading-relaxed">
        <span className="text-accent font-bold">新故事</span>到站，準備開聽！
      </p>
      <div className="space-y-3">
        {episodes.map((episode) => {
          const date = formatDate(episode.pubDate);
          const duration = formatDuration(episode.duration);
          const meta = [date, duration].filter(Boolean).join(" · ");

          return (
            <article
              key={episode.id}
              className="flex gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-3 backdrop-blur-md"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/10 sm:h-24 sm:w-24">
                <img
                  src={episode.imageUrl}
                  alt={episode.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="min-w-0">
                  {meta && <div className="mb-1 text-xs font-semibold text-white/85">{meta}</div>}
                  <div className="line-clamp-2 text-sm font-extrabold leading-snug text-white sm:text-base">
                    {episode.title}
                  </div>
                </div>

                <PlayerLaunch
                  size="xs"
                  spotify={episode.spotifyLink}
                  applePodcast={episode.applePodcastLink}
                  firstoryLink={episode.firstoryLink}
                  className="flex flex-row items-center justify-start gap-2.5 flex-wrap"
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Read-more button ── */}
      <button
        type="button"
        onClick={openHeaderSearch}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-secondary/30 hover:border-accent/60 text-white/90 hover:text-white transition-colors group"
      >
        <span className="text-sm font-bold">探索更多故事</span>
      </button>
    </div>
  );
}

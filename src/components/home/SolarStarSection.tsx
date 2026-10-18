"use client";

import { useState } from "react";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import { YouTubeIcon } from "@/components/home/PlatformIcons";
import type { ExternalLink, SolarVideo } from "@/lib/home-content";
import { trackOutboundClick, trackSolarVideoPlay } from "@/lib/analytics";

const thumbnailUrl = (youtubeId: string, quality: "hqdefault" | "mqdefault") =>
  `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;

// 隱私加強模式；只在使用者點擊後才載入，因此 autoplay=1 不會在進站時自動播放
const embedUrl = (youtubeId: string) =>
  `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`;

function MoreLink({ link, className }: { link: ExternalLink; className: string }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutboundClick("youtube", "home_solar_section")}
      className={className}
    >
      <YouTubeIcon className="h-4 w-4" />
      {link.label}
      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">（另開新視窗）</span>
    </a>
  );
}

interface Props {
  title: string;
  description: string;
  moreLink?: ExternalLink;
  videos: SolarVideo[];
}

export default function SolarStarSection({ title, description, moreLink, videos }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = videos[activeIndex];

  const play = (index: number) => {
    setActiveIndex(index);
    setPlaying(true);
    trackSolarVideoPlay(videos[index].youtubeId, videos[index].title, index + 1);
  };

  return (
    <section
      id="solar"
      aria-labelledby="solar-heading"
      className="scroll-mt-28 md:scroll-mt-20 bg-black/10 px-4 py-10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)] sm:py-14"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">SOLAR STAR</p>
            <h2 id="solar-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <Sparkles className="h-6 w-6 text-secondary" aria-hidden="true" />
              {title}
            </h2>
            <p className="mt-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">{description}</p>
          </div>
          {moreLink && videos.length > 0 && (
            <MoreLink
              link={moreLink}
              className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          )}
        </div>

        {!active ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-5 py-10 text-center">
            <span className="text-5xl" aria-hidden="true">🎬</span>
            <p className="text-lg font-semibold text-white">Solar Star 新影片即將在這裡上映</p>
            <p className="max-w-md text-sm leading-6 text-white/70">
              我們正在整理精選影片，敬請期待！現在也可以先到 YouTube 看看。
            </p>
            {moreLink && (
              <MoreLink
                link={moreLink}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#cc0000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e00000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)] md:gap-8">
            <div className="mx-auto flex w-full max-w-[300px] flex-col gap-3 md:mx-0 md:w-[280px]">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[var(--shadow-card)]">
                {playing ? (
                  <iframe
                    key={active.youtubeId}
                    src={embedUrl(active.youtubeId)}
                    title={active.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => play(activeIndex)}
                    aria-label={`播放影片：${active.title}`}
                    className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl(active.youtubeId, "hqdefault")}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#cc0000] text-white shadow-lg transition group-hover:scale-110">
                        <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="absolute bottom-3 left-3 right-3 text-xs text-white/80">點擊後載入 YouTube 播放器</span>
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold leading-snug text-white">{active.title}</h3>
                {active.description && <p className="mt-1 text-sm leading-6 text-white/70">{active.description}</p>}
              </div>
            </div>

            {videos.length > 1 && (
              <ul className="grid gap-3" aria-label="精選影片">
                {videos.map((video, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={video.id}>
                      <button
                        type="button"
                        onClick={() => play(index)}
                        aria-pressed={isActive}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isActive
                            ? "border-secondary/50 bg-secondary/10"
                            : "border-white/12 bg-white/[0.05] hover:border-white/30"
                        }`}
                      >
                        <span className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnailUrl(video.youtubeId, "mqdefault")}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-sm font-semibold text-white sm:text-base">{video.title}</span>
                          <span className={`mt-1 block text-xs font-semibold ${isActive ? "text-secondary" : "text-accent"}`}>
                            {isActive ? (playing ? "播放中" : "目前選取") : "點擊播放"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

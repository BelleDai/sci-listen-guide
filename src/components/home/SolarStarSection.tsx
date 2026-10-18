"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import FloatingDecor from "@/components/home/FloatingDecor";
import { YouTubeIcon } from "@/components/home/PlatformIcons";
import type { ExternalLink, SolarVideo } from "@/lib/home-content";
import { trackOutboundClick, trackSolarVideoPlay } from "@/lib/analytics";

const thumbnailUrl = (youtubeId: string, quality: "hqdefault" | "mqdefault") =>
  `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";
const YOUTUBE_ORIGINS = [PLAYER_ORIGIN, "https://www.youtube.com"];
const YT_STATE_ENDED = 0;

// 隱私加強模式；只在使用者點擊後才載入，因此 autoplay=1 不會在進站時自動播放。
// enablejsapi + origin 讓播放器以 postMessage 回報播放狀態（用來偵測播完）
const embedUrl = (youtubeId: string) =>
  `${PLAYER_ORIGIN}/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(
    window.location.origin
  )}`;

/**
 * 監聽嵌入播放器「播放結束」。直接使用 YouTube 播放器的 postMessage 協定，
 * 不必另外載入 youtube.com 的 IFrame API 腳本。
 */
function useYouTubeEnded(iframeRef: RefObject<HTMLIFrameElement | null>, videoKey: string | null, onEnded: () => void) {
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!videoKey || !iframe) return;

    let connected = false;
    let ended = false;
    // 播放器準備好之前訊息可能遺失，因此持續送出 listening 直到收到回應
    const listen = () =>
      iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: videoKey, channel: "widget" }), PLAYER_ORIGIN);
    const timer = window.setInterval(() => (connected ? window.clearInterval(timer) : listen()), 500);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow || !YOUTUBE_ORIGINS.includes(event.origin)) return;
      connected = true;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      const state =
        data?.event === "onStateChange"
          ? data.info
          : data?.event === "infoDelivery"
            ? (data.info as { playerState?: number } | undefined)?.playerState
            : undefined;
      if (state === YT_STATE_ENDED && !ended) {
        ended = true;
        onEndedRef.current();
      }
    };

    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", listen);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("message", handleMessage);
      iframe.removeEventListener("load", listen);
    };
  }, [iframeRef, videoKey]);
}

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const active = videos[activeIndex];

  const play = (index: number, trigger: "click" | "autoplay_next" = "click") => {
    setActiveIndex(index);
    setPlaying(true);
    trackSolarVideoPlay(videos[index].youtubeId, videos[index].title, index + 1, trigger);
  };

  // 播完自動播下一支；最後一支播完就停，不無限連播
  useYouTubeEnded(iframeRef, playing && active ? active.youtubeId : null, () => {
    if (activeIndex < videos.length - 1) play(activeIndex + 1, "autoplay_next");
  });

  // 手機上的橫向縮圖列：切換影片時把目前那一支捲到中間（直式清單不會捲動）
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.clientWidth) / 2, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <section
      id="solar"
      aria-labelledby="solar-heading"
      className="section-band section-band-space relative isolate scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <FloatingDecor variant="section" iconSet="space" count={10} />
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
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-8">
            <div className="w-full max-w-[400px] md:w-[340px] lg:w-[400px]">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[var(--shadow-card)]">
                {playing ? (
                  <iframe
                    ref={iframeRef}
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
            </div>

            {videos.length > 1 && (
              // 手機：橫向滑動的縮圖列（類似 Shorts 架）；平板以上：播放器右側的直式清單
              <ul
                ref={listRef}
                className="relative -mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:w-[300px] md:gap-2.5 md:overflow-visible md:p-0"
                aria-label="精選影片"
              >
                {videos.map((video, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={video.id} className="w-24 shrink-0 snap-start md:w-auto">
                      <button
                        type="button"
                        onClick={() => play(index)}
                        aria-pressed={isActive}
                        className={`flex w-full flex-col gap-2 rounded-xl border p-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:flex-row md:items-center md:gap-3 md:p-2.5 ${
                          isActive
                            ? "border-secondary/60 bg-[#29251c]"
                            : "border-white/12 bg-[#121624] hover:border-white/30"
                        }`}
                      >
                        <span className="relative aspect-[9/16] w-full overflow-hidden rounded-md bg-black md:aspect-auto md:h-16 md:w-12 md:flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnailUrl(video.youtubeId, "mqdefault")}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0 md:flex-1">
                          <span className="line-clamp-2 block text-xs font-semibold text-white md:text-sm">{video.title}</span>
                          <span className={`mt-1 hidden text-xs font-semibold md:block ${isActive ? "text-secondary" : "text-accent"}`}>
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

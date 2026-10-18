"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import type { HeroCard } from "@/lib/home-content";
import { trackHeroCardClick } from "@/lib/analytics";

function isExternal(href: string) {
  return href.startsWith("https://");
}

function HeroCardLink({ card, position, className, children }: {
  card: HeroCard;
  position: number;
  className: string;
  children: React.ReactNode;
}) {
  const onClick = () => trackHeroCardClick(card.id, position);

  if (isExternal(card.href)) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={card.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(reducedMotionQuery);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** 使用者系統設定「減少動態效果」時，不自動輪播 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false
  );
}

interface Props {
  cards: HeroCard[];
  /** 自動輪播間隔（秒），0 代表關閉 */
  autoplaySeconds: number;
}

/**
 * 精選卡片輪播。自動輪播時：滑鼠移入或鍵盤焦點在輪播內會暫停，
 * 也提供暫停／播放按鈕；系統開啟「減少動態效果」時不自動播放。
 */
export default function HeroFeatureCarousel({ cards, autoplaySeconds }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const interacting = hovered || keyboardFocused;
  const prefersReducedMotion = usePrefersReducedMotion();

  const autoplayAvailable = autoplaySeconds > 0 && cards.length > 1 && !prefersReducedMotion;
  const autoplayRunning = autoplayAvailable && !userPaused && !interacting;

  const onSelect = useCallback((emblaApi: NonNullable<CarouselApi>) => {
    setSelected(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  // 每次換到新的一張（手動或自動）都重新計時
  useEffect(() => {
    if (!api || !autoplayRunning) return;
    const timer = window.setTimeout(() => api.scrollNext(), autoplaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [api, autoplayRunning, autoplaySeconds, selected]);

  if (cards.length === 0) return null;

  const total = cards.length;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: total > 1 }}
      aria-label="本週精選"
      className="w-full rounded-[1.5rem] border border-white/12 bg-card/60 p-3 shadow-[var(--shadow-card)] backdrop-blur-md sm:p-4"
      // 只有滑鼠移入與鍵盤焦點會暫停；觸控點擊不暫停，避免手機上卡在暫停狀態
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onFocus={(e) => setKeyboardFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardFocused(false);
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <span className="text-sm font-semibold text-secondary">✦ 本週精選</span>
        <div className="flex items-center gap-1">
          {/* 自動輪播時不朗讀每次切換，避免干擾螢幕閱讀器 */}
          <span
            className="text-xs font-medium tabular-nums text-white/60"
            aria-live={autoplayRunning ? "off" : "polite"}
          >
            {pad(selected + 1)} / {pad(total)}
          </span>
          {autoplayAvailable && (
            <button
              type="button"
              onClick={() => setUserPaused((paused) => !paused)}
              aria-label={userPaused ? "繼續自動輪播" : "暫停自動輪播"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <CarouselContent>
        {cards.map((card, index) => {
          const isActive = index === selected;
          return (
            <CarouselItem
              key={card.id}
              aria-label={`第 ${index + 1} 張，共 ${total} 張：${card.title}`}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e1c2a]/80">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-card via-[#24304d] to-[#121a2c]">
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.image}
                      alt={card.imageAlt ?? ""}
                      className="h-full w-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
                      <div className="absolute h-40 w-40 rounded-full border border-accent/20" />
                      <div className="absolute h-64 w-64 rounded-full border border-accent/10" />
                      <span className="relative text-7xl drop-shadow-[0_0_24px_hsl(var(--accent)/0.35)]">
                        {card.emoji ?? "✦"}
                      </span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {card.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-xl">{card.title}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-white/75 sm:text-base">{card.description}</p>
                  <HeroCardLink
                    card={card}
                    position={index + 1}
                    className="mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full border border-accent/45 bg-accent/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {card.ctaLabel}
                    {isExternal(card.href) ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isExternal(card.href) && <span className="sr-only">（另開新視窗）</span>}
                  </HeroCardLink>
                </div>
              </article>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      {total > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`顯示第 ${index + 1} 張：${card.title}`}
                aria-current={index === selected ? "true" : undefined}
                className="flex h-11 w-7 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
              >
                <span
                  className={`block h-2 rounded-full transition-all ${index === selected ? "w-6 bg-secondary" : "w-2 bg-white/35"}`}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              aria-label="上一張"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              aria-label="下一張"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </Carousel>
  );
}

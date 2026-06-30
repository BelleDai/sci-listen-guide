"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRef, useEffect, useCallback, useState } from "react";

interface EpisodeCard {
  id: string;
  Title: string;
  Cover: string;
}

interface LatestEpisodesCarouselProps {
  episodes: EpisodeCard[];
}

const SCROLL_EDGE_TOLERANCE = 24;

function openHeaderSearch() {
  // The header search button has aria-label="展開搜尋" when closed
  const btn = document.querySelector<HTMLButtonElement>(
    'header button[aria-label="展開搜尋"]'
  );
  if (btn) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => btn.click(), 200);
  }
}

export default function LatestEpisodesCarousel({ episodes }: LatestEpisodesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ── Mouse-drag scroll (desktop) ────────────────────────────────────────────
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
    scrollRef.current.style.userSelect = "none";
  }, []);

  const onMouseLeaveOrUp = useCallback(() => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = "grab";
    scrollRef.current.style.userSelect = "";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const remainingScroll = el.scrollWidth - el.clientWidth - el.scrollLeft;
    setCanScrollLeft(el.scrollLeft > SCROLL_EDGE_TOLERANCE);
    setCanScrollRight(remainingScroll > SCROLL_EDGE_TOLERANCE);
  }, []);

  const scrollPrevious = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: -Math.round(el.clientWidth * 0.85),
      behavior: "smooth",
    });
  }, []);

  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: Math.round(el.clientWidth * 0.85),
      behavior: "smooth",
    });
  }, []);

  // Set initial cursor style
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.style.cursor = "grab";
    el.scrollLeft = 0;
    requestAnimationFrame(updateScrollState);

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  if (!episodes || episodes.length === 0) return null;

  return (
    <section className="w-full">
      <div className="relative mx-auto max-w-5xl overflow-hidden">
        <div
          ref={scrollRef}
          className="latest-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "1rem",
            paddingRight: "1rem",
          }}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeaveOrUp}
          onMouseUp={onMouseLeaveOrUp}
          onMouseMove={onMouseMove}
        >
          {episodes.map((ep, idx) => (
            <Link
              key={ep.id}
              href={`/guide/${ep.id}`}
              draggable={false}
              className="group relative w-[82%] max-w-[360px] flex-none snap-start overflow-hidden rounded-2xl border border-secondary/35 glass-card transition-colors hover:border-accent/70 sm:w-[46%] lg:w-[32%]"
              aria-label={`伴讀單元：${ep.Title}`}
            >
              <div className="flex items-center gap-3 p-4 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={ep.Cover}
                    alt={ep.Title}
                    className="h-[72px] w-[72px] rounded-2xl object-cover sm:h-20 sm:w-20"
                    loading={idx === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="line-clamp-3 text-sm font-medium leading-snug text-white/90 sm:text-base">
                    {ep.Title}
                  </div>
                  <div className="mt-2 text-sm font-medium text-accent/90 transition-transform group-hover:translate-x-1">
                    進入伴讀 →
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* ── "更多伴讀" card at the end ── */}
          <div
            className="group flex min-h-[112px] w-[68%] flex-none snap-start cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-secondary/30 transition-colors hover:border-accent/60 sm:w-[240px]"
            role="button"
            tabIndex={0}
            aria-label="探索更多伴讀"
            onClick={openHeaderSearch}
            onKeyDown={(e) => e.key === "Enter" && openHeaderSearch()}
          >
            <div className="w-11 h-11 rounded-full bg-secondary/15 flex items-center justify-center group-hover:bg-secondary/25 transition-colors">
              <Search className="w-5 h-5 text-secondary group-hover:text-accent transition-colors" />
            </div>
            <div className="text-center px-3">
              <div className="text-sm font-medium leading-snug text-white/90 sm:text-base">探索更多伴讀</div>
            </div>
          </div>

          {/* Trailing spacer */}
          <div className="flex-none w-1" aria-hidden="true" />
        </div>

        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-background via-background/80 to-transparent pl-2 pr-10">
            <button
              type="button"
              aria-label="顯示前面的科普伴讀"
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-secondary/40 bg-card/95 text-secondary shadow-[0_0_18px_hsl(var(--secondary)/0.22)] backdrop-blur-md transition hover:scale-105 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={scrollPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
        )}

        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-background via-background/80 to-transparent pl-10 pr-2">
            <button
              type="button"
              aria-label="顯示更多科普伴讀"
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-secondary/40 bg-card/95 text-secondary shadow-[0_0_18px_hsl(var(--secondary)/0.22)] backdrop-blur-md transition hover:scale-105 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>

      {/* Hide scrollbar webkit */}
      <style>{`
        .latest-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

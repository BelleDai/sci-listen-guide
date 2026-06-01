"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";

interface EpisodeCard {
  id: string;
  Title: string;
  Cover: string;
}

interface LatestEpisodesCarouselProps {
  episodes: EpisodeCard[];
}

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

  // Set initial cursor style
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  }, []);

  if (!episodes || episodes.length === 0) return null;

  return (
    <section className="w-full -mt-5">
      {/*
        Constrain to max-w-2xl to match the topic-planets section width.
        overflow-hidden clips the scroll track to the same boundary.
        The inner scroll div handles the horizontal overflow.
      */}
      <div className="max-w-2xl mx-auto overflow-hidden">
        <div
          ref={scrollRef}
          className="latest-carousel flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
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
              // 77% of the container width → ~1.3 cards visible
              className="flex-none snap-start rounded-3xl overflow-hidden glass-card border-2 border-secondary/40 hover:border-accent/70 transition-colors group relative"
              style={{ width: "min(77%, 320px)" }}
              aria-label={`伴讀單元：${ep.Title}`}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={ep.Cover}
                    alt={ep.Title}
                    className="w-20 h-20 rounded-2xl object-cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-white text-sm leading-snug line-clamp-3">
                    {ep.Title}
                  </div>
                  <div className="text-accent text-xs mt-2 font-bold group-hover:translate-x-1 transition-transform">
                    進入伴讀 →
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* ── "更多伴讀" card at the end ── */}
          <div
            className="flex-none snap-start rounded-3xl border-2 border-dashed border-secondary/30 hover:border-accent/60 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group"
            style={{ width: "min(60%, 220px)", minHeight: "112px" }}
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
              <div className="text-white font-bold text-sm leading-snug">探索更多伴讀</div>
            </div>
          </div>

          {/* Trailing spacer */}
          <div className="flex-none w-1" aria-hidden="true" />
        </div>
      </div>

      {/* Hide scrollbar webkit */}
      <style>{`
        .latest-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

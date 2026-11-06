"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Compass, Headphones } from "lucide-react";
import FloatingDecor from "@/components/home/FloatingDecor";
import HeroFeatureCarousel from "@/components/home/HeroFeatureCarousel";
import HighlightText from "@/components/home/HighlightText";
import type { HeroCard, HeroContent } from "@/lib/home-content";

interface Props {
  content: HeroContent;
  cards: HeroCard[];
}

/** 整個 Hero 的背景：目前這張卡片的圖片淡入，深色漸層確保文字清楚 */
function HeroBackdrop({ cards, active }: { cards: HeroCard[]; active: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
      {cards.map((card, index) =>
        card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={card.id}
            src={card.image}
            alt=""
            decoding="async"
            loading={index === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] transition-opacity duration-1000 ${
              index === active ? "opacity-50" : "opacity-0"
            }`}
          />
        ) : null
      )}
      {/* 手機：上深下淺；桌機：左側文字區較深 */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.92)_0%,hsl(var(--background)/0.75)_55%,hsl(var(--background)/0.9)_100%)] lg:bg-[linear-gradient(90deg,hsl(var(--background)/0.95)_0%,hsl(var(--background)/0.8)_45%,hsl(var(--background)/0.45)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[hsl(var(--background))]" />
    </div>
  );
}

export default function HeroSection({ content, cards }: Props) {
  const [activeCard, setActiveCard] = useState(0);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative isolate scroll-mt-20 overflow-hidden px-4 pb-10 pt-7 sm:pb-14 sm:pt-10"
    >
      <HeroBackdrop cards={cards} active={activeCard} />
      <FloatingDecor count={12} />
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10">
        <div className="min-w-0 text-center lg:text-left">
          {content.eyebrow && (
            <p className="mb-4 inline-flex items-center rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
              {content.eyebrow}
            </p>
          )}

          <h1
            id="hero-heading"
            className="text-4xl font-black leading-[1.15] text-white text-stroke-dark sm:text-5xl lg:text-[3.35rem]"
          >
            {/* 以「、」切成片語，片語內不換行，只在頓號後換行（避免「玩／中學」被拆開） */}
            {content.tagline.split(/(?<=、)/).map((phrase) => (
              <span key={phrase} className="inline-block whitespace-nowrap">
                <HighlightText text={phrase} highlight={content.taglineHighlight} />
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8 lg:mx-0">
            {content.intro}
          </p>

          {content.showCtas && (
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href={content.primaryCta.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-6 py-3.5 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Headphones className="h-5 w-5" aria-hidden="true" />
                {content.primaryCta.label}
              </Link>
              <Link
                href={content.secondaryCta.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent/45 bg-accent/15 px-6 py-3.5 text-base font-medium text-white/90 transition hover:border-accent hover:bg-accent/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Compass className="h-5 w-5" aria-hidden="true" />
                {content.secondaryCta.label}
              </Link>
            </div>
          )}

          {content.highlights.length > 0 && (
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/70 lg:justify-start">
              {content.highlights.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mx-auto w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-none">
          <HeroFeatureCarousel cards={cards} autoplaySeconds={content.autoplaySeconds} onSelectedChange={setActiveCard} />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Check, Compass, Headphones } from "lucide-react";
import HeroFeatureCarousel from "@/components/home/HeroFeatureCarousel";
import type { HeroCard, HeroContent } from "@/lib/home-content";

function Tagline({ tagline, highlight }: { tagline: string; highlight?: string }) {
  const index = highlight ? tagline.indexOf(highlight) : -1;
  if (!highlight || index < 0) return <>{tagline}</>;

  return (
    <>
      {tagline.slice(0, index)}
      <span className="inline-block whitespace-nowrap text-secondary">{highlight}</span>
      {tagline.slice(index + highlight.length)}
    </>
  );
}

interface Props {
  content: HeroContent;
  cards: HeroCard[];
}

export default function HeroSection({ content, cards }: Props) {
  return (
    <section id="top" aria-labelledby="hero-heading" className="scroll-mt-28 md:scroll-mt-20 px-4 pb-10 pt-7 sm:pb-14 sm:pt-10">
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
            <Tagline tagline={content.tagline} highlight={content.taglineHighlight} />
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base font-normal leading-7 text-white/75 sm:text-lg sm:leading-8 lg:mx-0">
            {content.intro}
          </p>

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
          <HeroFeatureCarousel cards={cards} autoplaySeconds={content.autoplaySeconds} />
        </div>
      </div>
    </section>
  );
}

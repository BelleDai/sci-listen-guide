"use client";

import { ArrowUpRight, FlaskConical } from "lucide-react";
import type { ExternalLink, LabItem } from "@/lib/home-content";
import { trackInteractiveLabClick, trackOutboundClick } from "@/lib/analytics";

const gridColumns: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

interface Props {
  labs: LabItem[];
  moreLink?: ExternalLink;
}

export default function InteractiveLabsSection({ labs, moreLink }: Props) {
  if (labs.length === 0) return null;

  return (
    <section
      id="explore"
      aria-labelledby="explore-heading"
      className="scroll-mt-28 md:scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">INTERACTIVE LAB</p>
            <h2 id="explore-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <FlaskConical className="h-6 w-6 text-secondary" aria-hidden="true" />
              互動科學探索館
            </h2>
            <p className="mt-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              看見科學、動手操作科學，動動手指發現世界更多不可思議。
            </p>
          </div>
          {moreLink && (
            <a
              href={moreLink.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOutboundClick("kidsci_lab", "home_explore_section")}
              className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {moreLink.label}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">（另開新視窗）</span>
            </a>
          )}
        </div>

        <ul className={`grid grid-cols-1 gap-4 ${gridColumns[labs.length] ?? gridColumns[4]}`}>
          {labs.map((lab, index) => (
            <li key={lab.id} className="min-w-0">
              <a
                href={lab.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInteractiveLabClick(lab.id, lab.title, index + 1)}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#1e1c2a]/80 transition hover:-translate-y-1 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-card via-[#24304d] to-[#121a2c]">
                  {lab.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lab.coverImage}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
                      <div className="absolute h-32 w-32 rounded-full border border-accent/20" />
                      <div className="absolute h-52 w-52 rounded-full border border-accent/10" />
                      <span className="relative text-6xl drop-shadow-[0_0_24px_hsl(var(--accent)/0.35)] transition duration-300 group-hover:scale-110">
                        {lab.emoji ?? "🔬"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                  <h3 className="text-lg font-bold leading-snug text-white">{lab.title}</h3>
                  <p className="text-sm leading-6 text-white/75 sm:text-base sm:leading-7">{lab.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-accent group-hover:text-white">
                    開始探索
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">（另開新視窗）</span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

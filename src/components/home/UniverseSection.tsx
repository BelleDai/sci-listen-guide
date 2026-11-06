"use client";

import { ArrowUpRight, Map } from "lucide-react";
import FloatingDecor from "@/components/home/FloatingDecor";
import type { UniverseGroup } from "@/lib/universe";
import { trackOutboundClick, trackUniverseClick } from "@/lib/analytics";

const SOURCE = "home_universe_section";

const steps = ["坐火箭選一座主題島", "每位居民都是一集科學故事", "點隊長聽短介紹，或按 Podcast 播放鍵聽完整故事"];

interface Props {
  groups: UniverseGroup[];
  /** 宇宙群島首頁與各島的連結（已含 utm），由 server 端的 universeLink() 產生 */
  links: { home: string; isles: Record<string, string> };
}

function track(target: string) {
  trackOutboundClick("universe", SOURCE);
  trackUniverseClick(target, SOURCE);
}

export default function UniverseSection({ groups, links }: Props) {
  const islandCount = groups.reduce((n, g) => n + g.islands.length, 0);
  const episodeCount = groups.reduce((n, g) => n + g.islands.reduce((m, i) => m + i.episodes, 0), 0);

  return (
    <section
      id="universe"
      aria-labelledby="universe-heading"
      className="section-band section-band-indigo relative isolate scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <FloatingDecor iconSet="space" count={8} />
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">UNIVERSE ISLES</p>
            <h2 id="universe-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <Map className="h-6 w-6 text-secondary" aria-hidden="true" />
              宇宙群島
            </h2>
            <p className="mt-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              一張地圖，看見所有科學主題！{islandCount} 座浮空島、{episodeCount} 集故事，每座島代表一個主題。
            </p>
            <ol className="mt-5 space-y-2.5">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-6 text-white/80 sm:text-base">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary/20 text-xs font-bold text-secondary">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href={links.home}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("home")}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-6 py-3 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              🚀 進入宇宙群島
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">（另開新視窗）</span>
            </a>
          </div>

          <a
            href={links.home}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("home")}
            className="group block overflow-hidden rounded-2xl border border-white/15 shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/universe/map.webp"
              alt="宇宙群島地圖：動物、遠古、科學、科技、太空等主題浮空島"
              loading="lazy"
              decoding="async"
              className="w-full transition duration-300 group-hover:scale-[1.02]"
            />
            <span className="sr-only">（另開新視窗）</span>
          </a>
        </div>

        <div className="mt-8 space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <h3 className="flex-shrink-0 pt-1.5 text-sm font-bold text-white sm:w-28">
                <span aria-hidden="true">{group.emoji} </span>
                {group.name}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.islands.map((isle) => (
                  <li key={isle.id}>
                    <a
                      href={links.isles[isle.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track(isle.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-[#151a2e] px-3 py-1.5 text-sm font-medium text-white/90 transition hover:-translate-y-0.5 hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span aria-hidden="true">{isle.emoji}</span>
                      {isle.name}
                      <span className="rounded-full bg-secondary/15 px-1.5 text-xs font-semibold text-secondary">
                        {isle.episodes}
                        <span className="sr-only"> 集</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

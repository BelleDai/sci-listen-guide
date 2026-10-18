"use client";

import { ArrowUpRight } from "lucide-react";
import { PLATFORM_STYLES } from "@/components/home/PlatformIcons";
import type { PodcastPlatform } from "@/lib/home-content";
import { trackOutboundClick, trackPodcastPlatformClick } from "@/lib/analytics";

const SOURCE = "home_podcast_section";

function onPlatformClick(platform: PodcastPlatform["id"]) {
  trackOutboundClick(platform, SOURCE);
  trackPodcastPlatformClick(platform, SOURCE);
}

/** 節目層級的收聽／追蹤入口：Apple Podcasts、Spotify 為主，其他平台為次要 */
export default function PodcastPlatformBar({ platforms }: { platforms: PodcastPlatform[] }) {
  const featured = platforms.filter((p) => p.featured);
  const others = platforms.filter((p) => !p.featured);

  return (
    <div className="rounded-2xl border border-white/12 bg-black/15 p-4 sm:p-5">
      <h3 className="text-base font-bold text-white sm:text-lg">追蹤我們的節目，新故事上架不錯過</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {featured.map((platform) => {
          const { Icon, color } = PLATFORM_STYLES[platform.id];
          return (
            <a
              key={platform.id}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPlatformClick(platform.id)}
              className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 transition hover:-translate-y-0.5 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ backgroundColor: `${color}26` }}
            >
              <span
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-semibold text-white sm:text-base">
                在 {platform.label} 收聽／追蹤
              </span>
              <ArrowUpRight className="h-4 w-4 text-white/70 group-hover:text-white" aria-hidden="true" />
              <span className="sr-only">（另開新視窗）</span>
            </a>
          );
        })}
      </div>

      {others.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/65">
          <span>也可以在</span>
          {others.map((platform) => {
            const { Icon } = PLATFORM_STYLES[platform.id];
            return (
              <a
                key={platform.id}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onPlatformClick(platform.id)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-medium text-white/85 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon className="h-4 w-4" />
                {platform.label}
                <span className="sr-only">（另開新視窗）</span>
              </a>
            );
          })}
          <span>收聽</span>
        </div>
      )}
    </div>
  );
}

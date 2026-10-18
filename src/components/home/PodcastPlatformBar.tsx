"use client";

import { PLATFORM_STYLES } from "@/components/home/PlatformIcons";
import type { PodcastPlatform } from "@/lib/home-content";
import { trackOutboundClick, trackPodcastPlatformClick } from "@/lib/analytics";

const SOURCE = "home_podcast_section";

/** 節目層級的收聽／追蹤入口：四大平台卡片 */
export default function PodcastPlatformBar({ platforms }: { platforms: PodcastPlatform[] }) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-normal leading-8 text-white/70">
        <span className="font-semibold text-accent/90">四大平台</span>任你收聽
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {platforms.map((platform) => {
          const { Icon, color } = PLATFORM_STYLES[platform.id];
          return (
            <a
              key={platform.id}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackOutboundClick(platform.id, SOURCE);
                trackPodcastPlatformClick(platform.id, SOURCE);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ backgroundColor: `${color}22`, boxShadow: `0 6px 24px -10px ${color}` }}
            >
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium text-white/90">{platform.label}</span>
              <span className="sr-only">（另開新視窗）</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

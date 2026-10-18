"use client";

import Link from "next/link";
import { BookOpen, Radio } from "lucide-react";
import { AppleIcon, SpotifyIcon } from "@/components/home/PlatformIcons";
import type { PodcastListItem } from "@/types/podcast-list";
import { trackOutboundClick, trackPodcastEpisodeClick } from "@/lib/analytics";
import {
  formatPodcastDate,
  formatPodcastDuration,
  getPodcastDisplayTitle,
  getPodcastEpisodeLabel,
} from "@/lib/podcast";

type ListenLink = { platform: string; label: string; href: string; className: string; icon: React.ReactNode };

function getListenLinks(episode: PodcastListItem): ListenLink[] {
  const links: ListenLink[] = [];
  if (episode.applePodcastLink) {
    links.push({
      platform: "apple_podcasts",
      label: "Apple Podcasts",
      href: episode.applePodcastLink,
      className: "bg-[#7224d8] hover:bg-[#8236e8]",
      icon: <AppleIcon className="h-4 w-4" />,
    });
  }
  if (episode.spotifyLink) {
    links.push({
      platform: "spotify",
      label: "Spotify",
      href: episode.spotifyLink,
      className: "bg-[#117a3d] hover:bg-[#15904a]",
      icon: <SpotifyIcon className="h-4 w-4" />,
    });
  }
  if (links.length === 0 && episode.firstoryLink) {
    links.push({
      platform: "firstory",
      label: "前往收聽",
      href: episode.firstoryLink,
      className: "bg-[#b4441c] hover:bg-[#c9531f]",
      icon: <Radio className="h-4 w-4" aria-hidden="true" />,
    });
  }
  return links;
}

interface Props {
  episode: PodcastListItem;
  guideId?: string;
  source: "home_latest" | "home_search";
  variant?: "featured" | "compact";
}

export default function PodcastEpisodeCard({ episode, guideId, source, variant = "compact" }: Props) {
  const episodeLabel = getPodcastEpisodeLabel(episode.title);
  const displayTitle = getPodcastDisplayTitle(episode.title);
  const meta = [formatPodcastDate(episode.pubDate, source === "home_search"), formatPodcastDuration(episode.duration)]
    .filter(Boolean)
    .join(" · ");
  const links = getListenLinks(episode);
  const featured = variant === "featured";

  return (
    <article
      className={`flex gap-3 rounded-2xl border bg-white/[0.07] p-3.5 backdrop-blur-md sm:p-4 ${
        featured ? "border-secondary/35 sm:gap-5 sm:p-5" : "border-white/15"
      }`}
    >
      <div
        className={`relative flex-shrink-0 self-start overflow-hidden rounded-xl bg-white/10 ${
          featured ? "h-28 w-28 sm:h-48 sm:w-48 lg:h-56 lg:w-56" : "h-20 w-20 sm:h-24 sm:w-24"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={episode.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
        <div className="min-w-0">
          {featured && (
            <span className="mb-2 inline-flex rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
              ✦ 最新上架
            </span>
          )}
          <p className="text-xs font-medium text-white/65 sm:text-sm">
            {episodeLabel && <span className="mr-1.5 font-semibold text-accent">{episodeLabel}</span>}
            {meta}
          </p>
          <h3
            className={`mt-1 font-semibold leading-snug text-white/95 ${
              featured ? "text-lg sm:text-xl" : "line-clamp-2 text-sm sm:text-base"
            }`}
          >
            {displayTitle}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <a
              key={link.platform}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 ${link.label} 收聽「${displayTitle}」（另開新視窗）`}
              onClick={() => {
                trackOutboundClick(link.platform, source);
                trackPodcastEpisodeClick({
                  episodeId: episode.id,
                  episodeTitle: episode.title,
                  platform: link.platform,
                  source,
                });
              }}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm ${link.className}`}
            >
              {link.icon}
              {link.platform === "apple_podcasts" ? "Podcasts" : link.label}
            </a>
          ))}
          {guideId && (
            <Link
              href={`/guide/${guideId}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              科普伴讀
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

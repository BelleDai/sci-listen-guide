/**
 * 讀取首頁可編輯內容（src/content/**.json）。
 * 在 build 時以 home-content-schema 驗證：JSON 格式錯誤會讓 build 失敗，而不是讓錯誤內容上線。
 * Hero 卡片、互動作品、Solar Star 影片可由 Google Sheets 同步（scripts/sync-home-content.ts）。
 */
import { z } from "zod";
import heroJson from "@/content/home/hero.json";
import brandJson from "@/content/home/brand.json";
import labsJson from "@/content/home/labs.json";
import solarStarJson from "@/content/home/solar-star.json";
import siteLinksJson from "@/content/site-links.json";
import type { PodcastListItem } from "@/types/podcast-list";
import { formatPodcastDate, getPodcastDisplayTitle, getPodcastEpisodeLabel } from "@/lib/podcast";
import {
  brandContentSchema,
  heroContentSchema,
  labsContentSchema,
  siteLinksSchema,
  solarStarContentSchema,
  type BrandContent,
  type ExternalLink,
  type HeroContent,
  type LabItem,
  type SiteLinks,
} from "@/lib/home-content-schema";

export type {
  BrandContent,
  ExternalLink,
  HeroContent,
  LabItem,
  PodcastPlatform,
  SiteLinks,
  SolarVideo,
} from "@/lib/home-content-schema";

/** 主影片 1 支＋可切換 3 支 */
export const MAX_SOLAR_VIDEOS = 4;

export type HeroCard = {
  id: string;
  label: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  emoji?: string;
  href: string;
  ctaLabel: string;
};

export const MAX_HERO_CARDS = 3;

function parseContent<T>(schema: z.ZodType<T>, data: unknown, fileName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`首頁內容 ${fileName} 格式錯誤：\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function getHeroContent(): HeroContent {
  return parseContent(heroContentSchema, heroJson, "src/content/home/hero.json");
}

export function getSiteLinks(): SiteLinks {
  return parseContent(siteLinksSchema, siteLinksJson, "src/content/site-links.json");
}

export function getBrandContent(): BrandContent {
  return parseContent(brandContentSchema, brandJson, "src/content/home/brand.json");
}

const byPublishedAndOrder = <T extends { status: string; sortOrder: number }>(items: T[]) =>
  items.filter((item) => item.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);

/** 首頁精選互動作品：已上架且 featured，依 sortOrder 取前 maxFeatured 個 */
export function getFeaturedLabs(): { items: LabItem[]; moreLink?: ExternalLink } {
  const content = parseContent(labsContentSchema, labsJson, "src/content/home/labs.json");
  return {
    items: byPublishedAndOrder(content.items.filter((item) => item.featured)).slice(0, content.maxFeatured),
    moreLink: content.moreLink,
  };
}

/** Solar Star 已上架影片，依 sortOrder 取前 4 支 */
export function getSolarStarContent() {
  const content = parseContent(solarStarContentSchema, solarStarJson, "src/content/home/solar-star.json");
  return { ...content, videos: byPublishedAndOrder(content.videos).slice(0, MAX_SOLAR_VIDEOS) };
}

/**
 * 依 status / sortOrder 篩選排序 Hero 卡片，並把 latest-podcast 卡片填入最新一集資料。
 * 沒有最新集數資料時，該卡片會被略過，避免出現空卡片。
 */
export function resolveHeroCards(content: HeroContent, latestEpisode?: PodcastListItem): HeroCard[] {
  return byPublishedAndOrder(content.cards)
    .flatMap((card): HeroCard[] => {
      const base = {
        id: card.id,
        label: card.label,
        image: card.image,
        imageAlt: card.imageAlt,
        emoji: card.emoji,
        href: card.href,
        ctaLabel: card.ctaLabel,
      };

      if (card.source !== "latest-podcast") {
        return [{ ...base, title: card.title, description: card.description }];
      }

      if (!latestEpisode) return [];
      const episodeLabel = getPodcastEpisodeLabel(latestEpisode.title);
      const date = formatPodcastDate(latestEpisode.pubDate);
      return [
        {
          ...base,
          title: card.title ?? getPodcastDisplayTitle(latestEpisode.title),
          description:
            card.description ?? [episodeLabel, date && `${date} 上架`].filter(Boolean).join(" · "),
          image: card.image ?? latestEpisode.imageUrl,
          imageAlt: card.imageAlt ?? `${getPodcastDisplayTitle(latestEpisode.title)} 節目封面`,
        },
      ];
    })
    .slice(0, MAX_HERO_CARDS);
}

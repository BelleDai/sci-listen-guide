/**
 * 首頁可編輯內容（src/content/**.json）的 schema 與讀取。
 * 在 build 時驗證：JSON 格式錯誤會讓 build 失敗，而不是讓錯誤內容上線。
 * 未來 Google Sheets 同步流程只需產出符合這些 schema 的 JSON。
 */
import { z } from "zod";
import heroJson from "@/content/home/hero.json";
import labsJson from "@/content/home/labs.json";
import solarStarJson from "@/content/home/solar-star.json";
import siteLinksJson from "@/content/site-links.json";
import type { PodcastListItem } from "@/types/podcast-list";
import { formatPodcastDate, getPodcastDisplayTitle, getPodcastEpisodeLabel } from "@/lib/podcast";

const linkSchema = z
  .string()
  .regex(/^(#[\w-]+|\/[^\s]*|https:\/\/\S+)$/, "連結需為 #區塊、/站內路徑 或 https:// 網址");

const ctaSchema = z.object({
  label: z.string().min(1),
  href: linkSchema,
});

const contentStatusSchema = z.enum(["published", "draft"]);

const manualHeroCardSchema = z.object({
  id: z.string().min(1),
  source: z.literal("manual").optional(),
  label: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  image: linkSchema.optional(),
  imageAlt: z.string().optional(),
  emoji: z.string().optional(),
  href: linkSchema,
  ctaLabel: z.string().min(1),
  status: contentStatusSchema,
  sortOrder: z.number(),
});

/** 自動帶入最新一集 Podcast；title / description / image 可省略 */
const latestPodcastHeroCardSchema = manualHeroCardSchema.extend({
  source: z.literal("latest-podcast"),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const heroContentSchema = z.object({
  eyebrow: z.string(),
  tagline: z.string().min(1),
  taglineHighlight: z.string().optional(),
  intro: z.string().min(1),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  highlights: z.array(z.string().min(1)).max(4),
  /** 精選卡片自動輪播間隔（秒）；0 代表關閉自動輪播 */
  autoplaySeconds: z
    .number()
    .refine((n) => n === 0 || (n >= 4 && n <= 30), "autoplaySeconds 需為 0（關閉）或 4–30 秒")
    .default(6),
  cards: z.array(z.union([latestPodcastHeroCardSchema, manualHeroCardSchema])),
});

const podcastPlatformSchema = z.object({
  id: z.enum(["apple_podcasts", "spotify", "youtube", "kkbox"]),
  label: z.string().min(1),
  href: z.url({ protocol: /^https$/ }),
  featured: z.boolean(),
});

const siteLinksSchema = z.object({
  podcastPlatforms: z.array(podcastPlatformSchema).min(1),
});

const externalLinkSchema = z.object({
  label: z.string().min(1),
  href: z.url({ protocol: /^https$/ }),
});

/** 互動作品；欄位與未來 Google Sheets 作品表一致 */
const labItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  coverImage: linkSchema.optional(),
  emoji: z.string().optional(),
  url: z.url({ protocol: /^https$/ }),
  status: contentStatusSchema,
  featured: z.boolean(),
  sortOrder: z.number(),
});

const labsContentSchema = z.object({
  /** 首頁最多顯示幾個精選作品（2–4） */
  maxFeatured: z.number().int().min(2).max(4),
  moreLink: externalLinkSchema.optional(),
  items: z.array(labItemSchema),
});

const solarVideoSchema = z.object({
  id: z.string().min(1),
  youtubeId: z.string().regex(/^[\w-]{11}$/, "youtubeId 需為 11 碼 YouTube 影片 ID"),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  status: contentStatusSchema,
  sortOrder: z.number(),
});

const solarStarContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  moreLink: externalLinkSchema.optional(),
  videos: z.array(solarVideoSchema),
});

export type HeroContent = z.infer<typeof heroContentSchema>;
export type PodcastPlatform = z.infer<typeof podcastPlatformSchema>;
export type ExternalLink = z.infer<typeof externalLinkSchema>;
export type LabItem = z.infer<typeof labItemSchema>;
export type SolarVideo = z.infer<typeof solarVideoSchema>;

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

export function getPodcastPlatforms(): PodcastPlatform[] {
  return parseContent(siteLinksSchema, siteLinksJson, "src/content/site-links.json").podcastPlatforms;
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

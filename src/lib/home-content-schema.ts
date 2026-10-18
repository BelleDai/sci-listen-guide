/**
 * 首頁可編輯內容的 zod schema。網站 build（src/lib/home-content.ts）與
 * Google Sheets 同步腳本（scripts/sync-home-content.ts）共用同一份規則。
 */
import { z } from "zod";

/** 清單中的 id 不可重複（試算表複製貼上時常見的錯誤） */
const uniqueIds = <T extends z.ZodType<{ id: string }>>(item: T) =>
  z.array(item).superRefine((items, ctx) => {
    const seen = new Set<string>();
    for (const [index, { id }] of items.entries()) {
      if (seen.has(id)) ctx.addIssue({ code: "custom", message: `id「${id}」重複`, path: [index, "id"] });
      seen.add(id);
    }
  });

export const linkSchema = z
  .string()
  .regex(/^(#[\w-]+|\/[^\s]*|https:\/\/\S+)$/, "連結需為 #區塊、/站內路徑 或 https:// 網址");

export const ctaSchema = z.object({
  label: z.string().min(1),
  href: linkSchema,
});

export const contentStatusSchema = z.enum(["published", "draft"]);

export const manualHeroCardSchema = z.object({
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
export const latestPodcastHeroCardSchema = manualHeroCardSchema.extend({
  source: z.literal("latest-podcast"),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export const heroContentSchema = z.object({
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
  cards: uniqueIds(z.union([latestPodcastHeroCardSchema, manualHeroCardSchema])),
});

export const podcastPlatformSchema = z.object({
  id: z.enum(["apple_podcasts", "spotify", "youtube", "kkbox"]),
  label: z.string().min(1),
  href: z.url({ protocol: /^https$/ }),
  featured: z.boolean(),
});

export const footerLinkSchema = z.object({
  label: z.string().min(1),
  href: linkSchema,
});

export const socialLinkSchema = z.object({
  id: z.enum(["facebook", "youtube", "email"]),
  label: z.string().min(1),
  href: z.string().regex(/^(https:\/\/|mailto:)\S+$/, "社群連結需為 https:// 或 mailto:"),
});

export const siteLinksSchema = z.object({
  podcastPlatforms: z.array(podcastPlatformSchema).min(1),
  footerLinks: z.array(footerLinkSchema),
  social: z.array(socialLinkSchema),
});

export const brandContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string().min(1),
  titleHighlight: z.string().optional(),
  image: linkSchema,
  imageAlt: z.string().min(1),
  credentials: z.array(z.object({ icon: z.enum(["graduation", "award"]), text: z.string().min(1) })),
  story: z.array(z.string().min(1)).min(1),
  values: z.array(z.string().min(1)),
  cta: ctaSchema.optional(),
});

export const externalLinkSchema = z.object({
  label: z.string().min(1),
  href: z.url({ protocol: /^https$/ }),
});

/** 互動作品；欄位與未來 Google Sheets 作品表一致 */
export const labItemSchema = z.object({
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

export const labsContentSchema = z.object({
  /** 首頁最多顯示幾個精選作品（2–4） */
  maxFeatured: z.number().int().min(2).max(4),
  moreLink: externalLinkSchema.optional(),
  items: uniqueIds(labItemSchema),
});

export const solarVideoSchema = z.object({
  id: z.string().min(1),
  youtubeId: z.string().regex(/^[\w-]{11}$/, "youtubeId 需為 11 碼 YouTube 影片 ID"),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  status: contentStatusSchema,
  sortOrder: z.number(),
});

export const solarStarContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  moreLink: externalLinkSchema.optional(),
  /** 首頁最多顯示幾支（第 1 支為主影片，其餘列在旁邊切換） */
  maxVideos: z.number().int().min(1).max(8).default(4),
  videos: uniqueIds(solarVideoSchema),
});

export type HeroContent = z.infer<typeof heroContentSchema>;
export type PodcastPlatform = z.infer<typeof podcastPlatformSchema>;
export type ExternalLink = z.infer<typeof externalLinkSchema>;
export type BrandContent = z.infer<typeof brandContentSchema>;
export type SiteLinks = z.infer<typeof siteLinksSchema>;
export type LabItem = z.infer<typeof labItemSchema>;
export type SolarVideo = z.infer<typeof solarVideoSchema>;

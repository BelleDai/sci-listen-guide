import type { PodcastListItem } from "@/types/podcast-list";

type EpisodePrefix = "EP" | "SP" | "VIP";

const episodeNumberPattern = /\b(EP|SP|VIP)\.?\s*(\d+)\b/i;
const trailingEpisodeLabelPattern = /\s*[｜|]\s*(?:EP|SP|VIP)\.?\s*\d+\s*$/i;

/** 從節目標題解析集數，例如「…｜EP.105」、「…｜VIP.31」→ { prefix: "EP", number: "105" } */
export function parsePodcastEpisodeNumber(title: string): { prefix: EpisodePrefix; number: string } | undefined {
  const match = title.match(episodeNumberPattern);
  if (!match) return undefined;
  return { prefix: match[1].toUpperCase() as EpisodePrefix, number: match[2] };
}

/** 顯示用集數標籤，例如 "EP.105"；標題中沒有集數時回傳 undefined */
export function getPodcastEpisodeLabel(title: string): string | undefined {
  const parsed = parsePodcastEpisodeNumber(title);
  return parsed ? `${parsed.prefix}.${parsed.number}` : undefined;
}

/** 移除標題結尾的「｜EP.xxx」，集數另外以標籤顯示 */
export function getPodcastDisplayTitle(title: string): string {
  return title.replace(trailingEpisodeLabelPattern, "").trim() || title;
}

function toTaipeiDate(pubDate: string): Date | undefined {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Date(date.getTime() + 8 * 60 * 60 * 1000);
}

/** 以台北時區格式化日期；withYear 為 true 時輸出 2026/9/19 */
export function formatPodcastDate(pubDate: string, withYear = false): string {
  const date = toTaipeiDate(pubDate);
  if (!date) return "";
  const monthDay = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  return withYear ? `${date.getUTCFullYear()}/${monthDay}` : monthDay;
}

export function formatPodcastDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  return `${Math.round(seconds / 60)} 分鐘`;
}

export function sortPodcastEpisodesByDate(episodes: PodcastListItem[]): PodcastListItem[] {
  return [...episodes].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

/**
 * 以標題與集數比對。純數字（或 EP105 / SP.3 / VIP31）視為集數查詢；
 * 其他關鍵字以空白切開，全部命中標題才算符合。
 */
export function searchPodcastEpisodes(episodes: PodcastListItem[], query: string): PodcastListItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const numberQuery = trimmed.match(/^(?:(EP|SP|VIP)\.?\s*)?(\d+)$/i);
  if (numberQuery) {
    const prefix = numberQuery[1]?.toUpperCase();
    const number = numberQuery[2];
    const exactMatches = episodes.filter((episode) => {
      const parsed = parsePodcastEpisodeNumber(episode.title);
      if (!parsed || parsed.number !== number) return false;
      return !prefix || parsed.prefix === prefix;
    });
    if (prefix) return exactMatches;

    // 只輸入數字時，集數完全相符的排前面，其餘標題含有該數字的接在後面
    const titleMatches = episodes.filter(
      (episode) => !exactMatches.includes(episode) && getPodcastDisplayTitle(episode.title).includes(number)
    );
    return [...exactMatches, ...titleMatches];
  }

  const terms = trimmed.toLocaleLowerCase().split(/\s+/);
  return episodes.filter((episode) => {
    const title = episode.title.toLocaleLowerCase();
    return terms.every((term) => title.includes(term));
  });
}

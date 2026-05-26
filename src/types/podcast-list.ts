/**
 * podcast-list.ts
 * 定義 /public/podcast-list.json 的型別，供前端 (Header.tsx) 使用。
 * 對應的資料由 scripts/sync-podcast-rss.ts 生成。
 */

export interface PodcastListItem {
  id: string;          // Firstory GUID，作為唯一識別
  title: string;
  firstoryLink: string;
  pubDate: string;
  imageUrl: string;
  duration: number;    // 秒
  spotifyLink?: string;
  applePodcastLink?: string;
}

export interface PodcastListJson {
  updatedAt: string;
  count: number;
  episodes: PodcastListItem[];
}

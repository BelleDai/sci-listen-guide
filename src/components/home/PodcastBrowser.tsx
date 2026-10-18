"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import PodcastEpisodeCard from "@/components/home/PodcastEpisodeCard";
import type { PodcastListItem, PodcastListJson } from "@/types/podcast-list";
import { searchPodcastEpisodes, sortPodcastEpisodesByDate } from "@/lib/podcast";

const PAGE_SIZE = 10;

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface Props {
  latestEpisodes: PodcastListItem[];
  /** firstoryGuid → 伴讀 id，用來在節目卡片上顯示伴讀入口 */
  guideByGuid: Record<string, string>;
}

/** Podcast 區塊：預設顯示最新集數，輸入關鍵字後改顯示搜尋結果 */
export default function PodcastBrowser({ latestEpisodes, guideByGuid }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [allEpisodes, setAllEpisodes] = useState<PodcastListItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchEpisodes = () => {
    setStatus("loading");
    fetch("/podcast-list.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PodcastListJson>;
      })
      .then((data) => {
        setAllEpisodes(sortPodcastEpisodesByDate(data.episodes ?? []));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  // 第一次聚焦或輸入時才下載完整節目列表（CDN 靜態檔，不經 Firestore）
  const loadEpisodes = () => {
    if (status === "idle") fetchEpisodes();
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
    if (value.trim()) loadEpisodes();
  };

  const results = useMemo(() => searchPodcastEpisodes(allEpisodes, query), [allEpisodes, query]);
  const isSearching = query.trim() !== "";

  let statusMessage = "";
  if (isSearching) {
    if (status === "loading") statusMessage = "正在載入節目列表…";
    else if (status === "error") statusMessage = "節目列表暫時無法載入";
    else if (status === "ready") statusMessage = `找到 ${results.length} 集`;
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <p className="text-lg font-normal leading-8 text-white/70 md:pt-2">
          {isSearching ? (
            <span className="font-semibold text-accent/90">搜尋結果</span>
          ) : (
            <>
              <span className="font-semibold text-accent/90">新故事</span>到站，準備開聽！
            </>
          )}
        </p>
        <div className="w-full md:max-w-sm">
          <form role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="podcast-search" className="sr-only">
              搜尋 Podcast 節目
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" aria-hidden="true" />
              <input
                id="podcast-search"
                type="search"
                value={query}
                onFocus={loadEpisodes}
                onChange={(e) => updateQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") updateQuery("");
                }}
                placeholder="搜尋節目：恐龍、太陽系、EP.105…"
                autoComplete="off"
                className="h-12 w-full rounded-full border border-white/20 bg-white/[0.07] pl-12 pr-12 text-base text-white placeholder:text-white/45 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  aria-label="清除搜尋"
                  className="absolute right-1.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>

      {!isSearching ? (
        latestEpisodes.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            <PodcastEpisodeCard
              episode={latestEpisodes[0]}
              guideId={guideByGuid[latestEpisodes[0].id]}
              source="home_latest"
              variant="featured"
            />
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {latestEpisodes.slice(1).map((episode) => (
                <PodcastEpisodeCard key={episode.id} episode={episode} guideId={guideByGuid[episode.id]} source="home_latest" />
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 text-center text-white/75">
            目前沒有可顯示的集數，請直接到下方的 Podcast 平台收聽。
          </p>
        )
      ) : status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] p-6 text-white/75">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          正在載入節目列表…
        </div>
      ) : status === "error" ? (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="font-semibold text-white">節目列表暫時無法載入</p>
          <p className="mt-1 text-sm text-white/70">請檢查網路後再試一次，或直接到下方的 Podcast 平台收聽。</p>
          <button
            type="button"
            onClick={fetchEpisodes}
            className="mt-3 inline-flex min-h-10 items-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            重新載入
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 text-center">
          <p className="font-semibold text-white">找不到符合「{query.trim()}」的集數</p>
          <p className="mt-1 text-sm text-white/70">試試更短的關鍵字或集數，或到下方的 Podcast 平台瀏覽全部節目。</p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-white/70">找到 {results.length} 集</p>
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {results.slice(0, visibleCount).map((episode) => (
              <PodcastEpisodeCard key={episode.id} episode={episode} guideId={guideByGuid[episode.id]} source="home_search" />
            ))}
          </div>
          {results.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="mt-4 flex w-full min-h-11 items-center justify-center rounded-2xl border border-dashed border-secondary/35 px-4 py-3 text-white/80 transition-colors hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              顯示更多（還有 {results.length - visibleCount} 集）
            </button>
          )}
        </div>
      )}
    </div>
  );
}

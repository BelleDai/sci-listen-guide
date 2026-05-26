"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Headphones, Radio } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIndexItem } from "@/lib/episodes";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import PlayerLaunch from "@/components/episode/PlayerLaunch";
import type { PodcastListItem } from "@/types/podcast-list";

interface Props {
  episodes?: SearchIndexItem[];
  step?: number;
  total?: number;
  onJump?: (n: number) => void;
}

const Header = ({ episodes = [], step, total, onJump }: Props) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [podcastList, setPodcastList] = useState<PodcastListItem[]>([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const router = useRouter();

  // Used for tracking if we clicked inside the search dropdown
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Click outside to close search
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 搜尋列第一次展開時，才 fetch podcast-list.json（CDN 快取，不計 Firestore 費用）
  useEffect(() => {
    if (searchOpen && podcastList.length === 0 && !podcastLoading) {
      setPodcastLoading(true);
      fetch("/podcast-list.json")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.episodes) setPodcastList(data.episodes);
        })
        .catch(() => {/* 靜默失敗，僅顯示伴讀集數 */})
        .finally(() => setPodcastLoading(false));
    }
  }, [searchOpen, podcastList.length, podcastLoading]);

  // 計算已有伴讀的 firstoryGuid 集合（用於去重）
  const episodeGuids = new Set(
    episodes.map((e) => e.firstoryGuid).filter(Boolean)
  );

  // 過濾掉已有伴讀單元的 podcast，僅顯示「純 podcast」
  const podcastOnly = podcastList.filter((p) => !episodeGuids.has(p.id));

  const goHome = () => {
    router.push('/');
  };

  const handleSelect = (id: string) => {
    setSearchOpen(false);
    router.push(`/guide/${id}`);
  };

  const hasStepper = step !== undefined && total !== undefined && onJump !== undefined;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-card/70 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3 relative">
        {/* Left: Brand = home */}
        <button
          onClick={goHome}
          aria-label="回首頁"
          className="flex items-center gap-2 flex-shrink-0 hover:scale-[1.02] transition-transform"
        >
          <img
            src="https://files.soundon.fm/1758618850575-3b62b9ae-8417-4916-a6dc-b25e0b872fba.jpeg"
            alt="科學好好聽"
            className="w-9 h-9 rounded-md object-cover"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-white text-base leading-none">科學好好聽</span>
            {hasStepper && (<span className="hidden sm:inline font-extrabold text-accent text-base leading-none">科普伴讀</span>)}
          </span>
        </button>

        {/* Right: Search + Stepper */}
        <div className="flex items-center gap-3 flex-shrink-0" ref={searchContainerRef}>
          {/* CMDK Pill search */}
          {mounted && (
            <Command className="bg-transparent overflow-visible static flex flex-row items-center justify-end" shouldFilter={true}>
              <motion.div
                animate={{
                  width: searchOpen ? (typeof window !== "undefined" && window.innerWidth < 640 ? 180 : 240) : 36,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                className={`relative h-9 flex items-center overflow-visible bg-white/10 hover:bg-accent/40 backdrop-blur-md rounded-full shadow-sm transition-colors ${searchOpen ? "px-3" : ""
                  }`}
              >
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: 0.08 }}
                      className="flex-1 h-full flex items-center min-w-0 pr-2"
                    >
                      <CommandInput
                        placeholder="搜尋全部集數..."
                        className="h-full border-0 focus:ring-0 bg-transparent text-white placeholder:text-white/55 text-sm w-full px-2 py-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label={searchOpen ? "收合搜尋" : "展開搜尋"}
                  className={`flex-shrink-0 inline-flex items-center justify-center text-accent hover:text-white transition-colors ${searchOpen ? "w-6 h-6" : "w-9 h-9"
                    }`}
                >
                  <Search className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </button>
              </motion.div>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[52px] right-4 sm:right-auto w-[calc(100vw-32px)] sm:w-[360px] bg-card/95 backdrop-blur-md border border-accent/30 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <CommandList className="max-h-[60vh] sm:max-h-[480px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty>
                        <div className="py-5 px-4 text-center">
                          <p className="text-base font-bold text-white mb-2">找不到這個主題 🧪</p>
                          <p className="text-sm text-white/90 leading-relaxed mb-4">試試其他關鍵字，或直接去 Podcast 平台收聽！</p>
                          <a
                            href="https://podcasts.apple.com/tw/podcast/id1812447277"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white hover:scale-[1.03] transition-transform"
                            style={{ backgroundColor: "#7224d8" }}
                          >
                            前往 Apple Podcasts 收聽故事
                          </a>
                        </div>
                      </CommandEmpty>

                      {/* Group 1：有伴讀單元的集數（點擊可進入伴讀頁） */}
                      {episodes.length > 0 && (
                        <CommandGroup heading="🎧 科普伴讀單元" className="text-white/80 [&_[cmdk-group-heading]]:text-accent [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                          {episodes.map((ep) => (
                            <CommandItem
                              key={ep.id}
                              value={`${ep.title} ${ep.tags?.join(' ') || ''}`}
                              onSelect={() => handleSelect(ep.id)}
                              className="cursor-pointer aria-selected:bg-accent/20 aria-selected:text-white text-white/90 my-1 py-2.5 px-3 flex items-start gap-3 rounded-lg"
                            >
                              <Headphones className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent/70" />
                              <span className="line-clamp-2 leading-tight">{ep.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {/* Group 2：純 Podcast 集數（沒有伴讀，顯示收聽按鈕） */}
                      {podcastOnly.length > 0 && (
                        <CommandGroup heading="📻 全部集數（尚無伴讀）" className="text-white/80 [&_[cmdk-group-heading]]:text-white/50 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                          {podcastOnly.map((ep) => (
                            <CommandItem
                              key={ep.id}
                              value={ep.title}
                              // 純 podcast 不跳頁，onSelect 用來展開/收合按鈕
                              onSelect={() => {/* 不做任何事，讓按鈕自己處理 */}}
                              className="aria-selected:bg-white/5 text-white/70 my-0.5 py-2 px-3 flex flex-col items-start gap-1 rounded-lg cursor-default"
                            >
                              <div className="flex items-start gap-3 w-full">
                                <Radio className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/40" />
                                <span className="line-clamp-2 leading-tight text-sm flex-1">{ep.title}</span>
                              </div>
                              <div className="pl-7">
                                <PlayerLaunch
                                  inline
                                  spotify={ep.spotifyLink}
                                  applePodcast={ep.applePodcastLink}
                                  firstoryLink={ep.firstoryLink}
                                />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {/* Loading 狀態 */}
                      {podcastLoading && (
                        <div className="px-3 py-2 text-xs text-white/40 text-center">
                          載入全部集數中...
                        </div>
                      )}
                    </CommandList>
                  </motion.div>
                )}
              </AnimatePresence>
            </Command>
          )}

          {/* Stepper */}
          {hasStepper && (
            <nav aria-label="進度" className="flex items-center gap-1.5 ml-1">
              {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
                const reached = n <= step;
                const current = n === step;
                return (
                  <button
                    key={n}
                    onClick={() => reached && onJump(n)}
                    aria-label={`第 ${n} 步`}
                    aria-current={current ? "step" : undefined}
                    disabled={!reached}
                  >
                    <motion.span
                      animate={{ scale: current ? 1.25 : 1 }}
                      className={`block w-3 h-3 rounded-full transition-colors ${reached
                        ? "bg-secondary shadow-[0_0_0_3px_hsl(var(--secondary)/0.25)]"
                        : "bg-accent/70"
                        }`}
                    />
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Headphones } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIndexItem } from "@/lib/episodes";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Props {
  episodes?: SearchIndexItem[];
  step?: number;
  total?: number;
  onJump?: (n: number) => void;
}

const Header = ({ episodes = [], step, total, onJump }: Props) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
                        placeholder="搜尋 50+ 集伴讀單元..."
                        className="h-full border-0 focus:ring-0 bg-transparent text-white placeholder:text-white/55 text-sm w-full px-2 py-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      // Hide the default search icon that cmdk input might have, we use our own on the right
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
                    className="absolute top-[52px] right-4 sm:right-auto w-[calc(100vw-32px)] sm:w-[320px] bg-card/95 backdrop-blur-md border border-accent/30 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <CommandList className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty>
                        <div className="py-5 px-4 text-center">
                          <p className="text-base font-bold text-white mb-2">科學隊長還在實驗室趕工中！🧪</p>
                          <p className="text-sm text-white/90 leading-relaxed mb-4">這集故事目前還沒有製作『伴讀單元』。科學隊長正親自為 200 多集故事嚴謹把關，先去聽聽精彩的故事原音吧！</p>
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
                      <CommandGroup heading="節目列表" className="text-white/80 [&_[cmdk-group-heading]]:text-accent">
                        {episodes.map((ep) => (
                          <CommandItem
                            key={ep.id}
                            value={ep.title}
                            onSelect={() => handleSelect(ep.id)}
                            className="cursor-pointer aria-selected:bg-accent/20 aria-selected:text-white text-white/90 my-1 py-2.5 px-3 flex items-start gap-3 rounded-lg"
                          >
                            <Headphones className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent/70" />
                            <span className="line-clamp-2 leading-tight">{ep.title}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
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

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/sonner";

interface Props {
  step: number;
  total: number;
  onJump: (n: number) => void;
}

const Header = ({ step, total, onJump }: Props) => {
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    toast(`正在搜尋「${term}」的科普主題…`, {
      description: "更多精彩主題即將上線，敬請期待！",
    });
    setQ("");
    setSearchOpen(false);
  };

  const goHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    onJump(1);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-card/70 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
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
          <span className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-extrabold text-white text-base leading-none">科學好好聽</span>
            <span className="font-extrabold text-accent text-base leading-none">科普伴讀</span>
          </span>
        </button>

        {/* Middle: Expandable search */}
        <div className="flex-1 flex justify-center">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <motion.div
              animate={{ width: searchOpen ? 240 : 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative h-10 rounded-full bg-card/80 border-2 border-accent/50 overflow-hidden flex items-center"
            >
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={searchOpen ? "收合搜尋" : "展開搜尋"}
                className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center text-accent hover:text-white transition-colors z-10"
              >
                <Search className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    ref={inputRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: 0.1 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onBlur={() => !q && setSearchOpen(false)}
                    placeholder="想聽什麼主題呢？"
                    className="absolute left-10 right-8 top-0 h-10 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none"
                  />
                )}
              </AnimatePresence>
              {searchOpen && q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  aria-label="清除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          </form>
        </div>

        {/* Right: Stepper */}
        <nav aria-label="進度" className="flex items-center gap-1.5 flex-shrink-0">
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
                  className={`block w-3 h-3 rounded-full transition-colors ${
                    reached
                      ? "bg-secondary shadow-[0_0_0_3px_hsl(var(--secondary)/0.25)]"
                      : "bg-accent/70"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;

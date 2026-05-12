import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-card/70 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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

        {/* Right: Search + Stepper */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Pill search */}
          <form onSubmit={handleSearch} className="flex items-center">
            <motion.div
              animate={{
                width: searchOpen ? 220 : 28,
                paddingLeft: searchOpen ? 14 : 0,
                paddingRight: searchOpen ? 8 : 0,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className={`relative h-9 flex items-center overflow-hidden ${
                searchOpen
                  ? "rounded-full bg-card/80 border border-accent/60 shadow-[0_0_12px_-2px_hsl(var(--accent)/0.4)]"
                  : ""
              }`}
            >
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    ref={inputRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: 0.08 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onBlur={() => !q && setSearchOpen(false)}
                    placeholder="想聽什麼主題呢？"
                    className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none min-w-0"
                  />
                )}
              </AnimatePresence>
              {searchOpen && q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-white/60 hover:text-white mr-1"
                  aria-label="清除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={searchOpen ? "收合搜尋" : "展開搜尋"}
                className="flex-shrink-0 text-accent hover:text-white transition-colors"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={2.25} />
              </button>
            </motion.div>
          </form>

          {/* Stepper */}
          <nav aria-label="進度" className="flex items-center gap-1.5">
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
      </div>
    </header>
  );
};

export default Header;

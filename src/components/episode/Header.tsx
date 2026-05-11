import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

interface Props {
  step: number;
  total: number;
  onJump: (n: number) => void;
}

const Header = ({ step, total, onJump }: Props) => {
  const [q, setQ] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    toast(`正在搜尋「${term}」的科普主題…`, {
      description: "更多精彩主題即將上線，敬請期待！",
    });
  };

  const goHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    onJump(1);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-card/70 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <img
          src="https://files.soundon.fm/1758618850575-3b62b9ae-8417-4916-a6dc-b25e0b872fba.jpeg"
          alt="科學好好聽"
          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
        />
        <div className="hidden sm:flex items-baseline gap-2 flex-shrink-0">
          <p className="font-extrabold text-white leading-tight text-base sm:text-lg">科學好好聽</p>
          <p className="font-extrabold text-accent leading-tight text-base sm:text-lg">科普伴讀</p>
        </div>

        <nav aria-label="進度" className="flex items-center gap-1.5 ml-auto sm:ml-0">
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
      <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-2">
        <button
          onClick={goHome}
          aria-label="回首頁"
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary text-secondary-foreground font-bold text-sm hover:scale-105 transition-transform"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">回首頁</span>
        </button>
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="想聽什麼主題呢？（宇宙、海洋、昆蟲…）"
            className="w-full pl-9 pr-4 py-2 rounded-full bg-card/80 border-2 border-accent/50 text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.25)] transition-all"
          />
        </form>
      </div>
    </header>
  );
};

export default Header;

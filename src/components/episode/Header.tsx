import { motion } from "framer-motion";

interface Props {
  step: number;
  total: number;
  onJump: (n: number) => void;
}

const Header = ({ step, total, onJump }: Props) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-card/60 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <img
          src="https://files.soundon.fm/1758618850575-3b62b9ae-8417-4916-a6dc-b25e0b872fba.jpeg"
          alt="科學好好聽"
          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <p className="font-extrabold text-white leading-tight text-base sm:text-lg">科學好好聽</p>
          <p className="font-extrabold text-accent leading-tight text-base sm:text-lg">科普伴讀</p>
        </div>
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
                className="relative flex items-center justify-center"
              >
                <motion.span
                  animate={{ scale: current ? 1.25 : 1 }}
                  className={`block rounded-full transition-colors ${
                    reached
                      ? "w-3 h-3 bg-secondary shadow-[0_0_0_3px_hsl(var(--secondary)/0.25)]"
                      : "w-3 h-3 bg-accent/70"
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

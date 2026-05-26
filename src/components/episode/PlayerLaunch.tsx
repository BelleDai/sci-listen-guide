import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Podcast, ChevronRight, Lock, Radio } from "lucide-react";
import { trackOutboundClick } from "@/lib/analytics";

interface Props {
  applePodcast?: string;
  spotify?: string;
  firstoryLink?: string;
  className?: string;
  buttonClassName?: string;
  /** 緊湊行內模式：直接顯示按鈕列，不需要 toggle 展開動畫（用於搜尋下拉列表） */
  inline?: boolean;
}

const PlayerLaunch = ({ applePodcast, spotify, firstoryLink, className, buttonClassName, inline = false }: Props) => {
  const [open, setOpen] = useState(false);
  const hasLinks = Boolean(applePodcast || spotify || firstoryLink);

  // ─── Inline 模式：直接顯示緊湊按鈕列 ────────────────────────────────────────
  if (inline) {
    if (!hasLinks) return null;
    return (
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {spotify && (
          <a
            href={spotify}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => { e.stopPropagation(); trackOutboundClick("spotify", "search_inline"); }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
          >
            Spotify
          </a>
        )}
        {applePodcast && (
          <a
            href={applePodcast}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => { e.stopPropagation(); trackOutboundClick("apple_podcasts", "search_inline"); }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
          >
            Apple
          </a>
        )}
        {!spotify && !applePodcast && firstoryLink && (
          <a
            href={firstoryLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => { e.stopPropagation(); trackOutboundClick("firstory", "search_inline"); }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#f97316,#dc2626)" }}
          >
            收聽
          </a>
        )}
      </div>
    );
  }

  // ─── 標準模式：toggle 展開動畫 ────────────────────────────────────────────────
  return (
    <div className={className || "flex flex-row items-center justify-center gap-3 mt-5 flex-wrap"}>
      <motion.button
        onClick={() => hasLinks && setOpen((o) => !o)}
        whileHover={hasLinks ? { scale: 1.04 } : {}}
        whileTap={hasLinks ? { scale: 0.96 } : {}}
        aria-expanded={open}
        disabled={!hasLinks}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-extrabold text-base sm:text-lg shadow-[var(--shadow-glow)] transition-colors ${hasLinks
          ? buttonClassName || "text-primary-foreground bg-secondary bg-[image:var(--gradient-primary)] cursor-pointer"
          : "text-white/40 bg-white/10 cursor-not-allowed shadow-none"
          }`}
      >
        {hasLinks ? <Podcast className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        {hasLinks ? "收聽故事" : "即將上架"}
        {hasLinks && (
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronRight className="w-4 h-4" />
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -10, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -10, width: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="flex flex-row items-center gap-2 overflow-hidden"
          >
            {applePodcast && (
              <motion.a
                href={applePodcast}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("apple_podcasts", "player_launch")}
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
                whileHover={{ scale: 1.06 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
              >
                Apple Podcasts
              </motion.a>
            )}
            {spotify && (
              <motion.a
                href={spotify}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("spotify", "player_launch")}
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
                whileHover={{ scale: 1.06 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
              >
                Spotify
              </motion.a>
            )}
            {!applePodcast && !spotify && firstoryLink && (
              <motion.a
                href={firstoryLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("firstory", "player_launch")}
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
                whileHover={{ scale: 1.06 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#f97316,#dc2626)" }}
              >
                <Radio className="w-4 h-4" />
                前往收聽
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerLaunch;

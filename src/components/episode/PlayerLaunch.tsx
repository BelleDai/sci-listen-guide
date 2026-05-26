import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Podcast, ChevronRight, Lock, Radio } from "lucide-react";
import { trackOutboundClick } from "@/lib/analytics";

// ─── 內聯品牌圖標 (防止外部檔案遺失) ──────────────────────────────────────────────

const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.934 1.154-1.686 1.63-3.324 1.654-3.411-.035-.018-3.197-1.226-3.223-4.872-.023-3.051 2.493-4.512 2.607-4.58-1.424-2.083-3.633-2.365-4.417-2.42-1.802-.178-3.626 1.153-4.562 1.153zm-.304-6.315c.844-.993 1.41-2.378 1.258-3.778-1.218.048-2.656.79-3.528 1.808-.78.892-1.442 2.308-1.262 3.678 1.36.096 2.688-.714 3.532-1.708z" />
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.854-.878 7.15-.505 9.818 1.13.295.18.387.563.207.857zm1.226-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.078-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.243-.57 11.346 1.336.367.227.487.708.26 1.074zm.106-2.833C14.385 8.8 8.594 8.6 5.253 9.615c-.523.158-1.077-.143-1.235-.666-.158-.523.143-1.077.666-1.235C8.22 6.643 14.625 6.87 18.775 9.336c.477.283.633.9.35 1.377-.283.477-.9.633-1.377.35z" />
  </svg>
);

interface Props {
  applePodcast?: string;
  spotify?: string;
  firstoryLink?: string;
  className?: string;
  buttonClassName?: string;
  size?: "xs" | "default";
}

const sizeConfigs = {
  xs: {
    btnClass: "px-3.5 py-1.5 text-xs gap-1.5",
    linkClass: "px-3 py-1.5 text-xs gap-1.5",
    iconSize: "w-3.5 h-3.5",
  },
  default: {
    btnClass: "px-6 py-3 text-base sm:text-lg gap-2",
    linkClass: "px-5 py-3 text-sm sm:text-base gap-2",
    iconSize: "w-5 h-5",
  },
};

const PlayerLaunch = ({
  applePodcast,
  spotify,
  firstoryLink,
  className,
  buttonClassName,
  size = "default",
}: Props) => {
  const [open, setOpen] = useState(false);
  const hasLinks = Boolean(applePodcast || spotify || firstoryLink);
  const config = sizeConfigs[size] || sizeConfigs.default;

  return (
    <div className={className || "flex flex-row items-center justify-center gap-3 mt-1 flex-wrap"}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="listen-trigger"
            onClick={() => hasLinks && setOpen(true)}
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={hasLinks ? { scale: 1.04 } : {}}
            whileTap={hasLinks ? { scale: 0.96 } : {}}
            aria-expanded={open}
            disabled={!hasLinks}
            className={`inline-flex items-center rounded-full font-extrabold shadow-[var(--shadow-glow)] transition-colors ${config.btnClass} ${hasLinks
              ? buttonClassName || "text-primary-foreground bg-secondary bg-[image:var(--gradient-primary)] cursor-pointer"
              : "text-white/40 bg-white/10 cursor-not-allowed shadow-none"
              }`}
          >
            {hasLinks ? <Podcast className={config.iconSize} /> : <Lock className={config.iconSize} />}
            {hasLinks ? "收聽故事" : "即將上架"}
          </motion.button>
        ) : (
          <motion.div
            key="streaming-links"
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-row items-center justify-center gap-2.5 flex-wrap"
          >
            {applePodcast && (
              <motion.a
                href={applePodcast}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("apple_podcasts", "player_launch")}
                whileHover={{ scale: 1.06 }}
                className={`inline-flex items-center rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0 hover:scale-[1.03] transition-transform ${config.linkClass}`}
                style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
              >
                <AppleIcon className={`${config.iconSize} flex-shrink-0 text-white`} />
                <span>Podcasts</span>
              </motion.a>
            )}
            {spotify && (
              <motion.a
                href={spotify}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("spotify", "player_launch")}
                whileHover={{ scale: 1.06 }}
                className={`inline-flex items-center rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0 hover:scale-[1.03] transition-transform ${config.linkClass}`}
                style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
              >
                <SpotifyIcon className={`${config.iconSize} flex-shrink-0 text-white`} />
                <span>Spotify</span>
              </motion.a>
            )}
            {!applePodcast && !spotify && firstoryLink && (
              <motion.a
                href={firstoryLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutboundClick("firstory", "player_launch")}
                whileHover={{ scale: 1.06 }}
                className={`inline-flex items-center rounded-full font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0 hover:scale-[1.03] transition-transform ${config.linkClass}`}
                style={{ background: "linear-gradient(135deg,#f97316,#dc2626)" }}
              >
                <Radio className={size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4"} />
                <span>前往收聽</span>
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerLaunch;

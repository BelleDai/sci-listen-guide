"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Podcast, X } from "lucide-react";
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
  show: boolean;
  applePodcast?: string;
  spotify?: string;
}

export default function SpeedDial({ show, applePodcast, spotify }: Props) {
  const [open, setOpen] = useState(false);
  const hasLinks = Boolean(applePodcast || spotify);

  if (!hasLinks) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col gap-3 items-end mb-2"
              >
                {applePodcast && (
                  <motion.a
                    href={applePodcast}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackOutboundClick("apple_podcasts", "speed_dial")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-white shadow-lg whitespace-nowrap text-sm sm:text-base hover:scale-[1.03] transition-transform flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
                  >
                    <AppleIcon className="w-4 h-4 flex-shrink-0 text-white" />
                    <span>Podcasts</span>
                  </motion.a>
                )}
                {spotify && (
                  <motion.a
                    href={spotify}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackOutboundClick("spotify", "speed_dial")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-white shadow-lg whitespace-nowrap text-sm sm:text-base hover:scale-[1.03] transition-transform flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
                  >
                    <SpotifyIcon className="w-4 h-4 flex-shrink-0 text-white" />
                    <span>Spotify</span>
                  </motion.a>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setOpen((o) => !o)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-secondary text-primary-foreground bg-[image:var(--gradient-primary)] overflow-hidden"
            title="收聽故事"
            aria-label="收聽故事"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Podcast className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

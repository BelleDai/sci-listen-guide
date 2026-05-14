"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Podcast, X } from "lucide-react";
import { trackOutboundClick } from "@/lib/analytics";

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
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
                  >
                    Apple Podcast
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
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
                  >
                    Spotify
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

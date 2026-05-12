import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Headphones, ChevronDown } from "lucide-react";

interface Props {
  applePodcast?: string;
  spotify?: string;
}

const PlayerLaunch = ({ applePodcast, spotify }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-extrabold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-[image:var(--gradient-primary)]"
      >
        <Headphones className="w-5 h-5" />
        收聽本集故事
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {applePodcast && (
              <motion.a
                href={applePodcast}
                target="_blank"
                rel="noreferrer"
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
                whileHover={{ scale: 1.06 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg,#a855f7,#6d28d9)" }}
              >
                <span className="text-xl"></span>
                Apple Podcast
              </motion.a>
            )}
            {spotify && (
              <motion.a
                href={spotify}
                target="_blank"
                rel="noreferrer"
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
                whileHover={{ scale: 1.06 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg,#1ed760,#0a8a3a)" }}
              >
                <span className="text-xl">🎧</span>
                Spotify
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerLaunch;

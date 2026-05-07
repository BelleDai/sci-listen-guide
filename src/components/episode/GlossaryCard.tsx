import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, Volume2, Square } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  term: string;
  explanation: string;
}

const GlossaryCard = ({ term, explanation }: Props) => {
  const [open, setOpen] = useState(false);
  const { speak, stop, speakingId } = useTTS();
  const id = `glossary-${term}`;
  const isSpeaking = speakingId === id;

  return (
    <motion.div
      layout
      className={`text-left w-full glass-card rounded-2xl p-4 sm:p-5 transition-all ${
        open ? "border-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.5)]" : "hover:border-primary"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Sparkles className="w-5 h-5 text-secondary flex-shrink-0" />
        <span className="font-extrabold text-lg text-white flex-1">{term}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-white/60 text-xs"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="exp"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <p className="text-white/90 leading-relaxed text-base sm:text-lg flex-1">
                {explanation}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(`${term}。${explanation}`, id);
                  }}
                  aria-label="朗讀"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent hover:bg-accent/40 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {isSpeaking && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      stop();
                    }}
                    aria-label="停止"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white shadow-[0_0_0_3px_hsl(var(--primary)/0.3)]"
                  >
                    <Square className="w-3 h-3" fill="currentColor" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GlossaryCard;

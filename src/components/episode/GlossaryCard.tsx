import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Volume2 } from "lucide-react";
import { useTTS, isTTSSupported } from "@/hooks/useTTS";
import SpeakingIndicator from "./SpeakingIndicator";

interface Props {
  term: string;
  explanation: string;
  episodeId?: string;
}

const GlossaryCard = ({ term, explanation, episodeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const { speak, stop, speakingId } = useTTS();
  const id = `glossary-${term}`;
  const isSpeaking = speakingId === id;

  useEffect(() => {
    setCanSpeak(isTTSSupported);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && canSpeak) {
      if (episodeId) {
        import("@/lib/analytics").then(({ trackTTSPlay }) => trackTTSPlay("glossary", episodeId));
      }
      speak(`${term}。${explanation}`, id);
    } else {
      if (isSpeaking) stop();
    }
  };

  return (
    <motion.div
      layout
      className={`text-left w-full glass-card rounded-2xl p-4 sm:p-5 transition-all ${open ? "border-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.5)]" : "hover:border-secondary/40"
        }`}
    >
      <button
        onClick={toggleOpen}
        className="w-full flex items-center gap-2 text-left"
      >
        <Sparkles className="w-5 h-5 text-secondary flex-shrink-0" />
        <span className="font-extrabold text-lg text-white flex-1">{term}</span>
        {canSpeak && (
          <span className="inline-flex items-center gap-1 text-accent" aria-hidden>
            <Volume2 className="w-4 h-4" />
            <SpeakingIndicator active={isSpeaking} />
          </span>
        )}
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
            <p className="text-white/90 leading-relaxed text-base sm:text-lg">
              {explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GlossaryCard;

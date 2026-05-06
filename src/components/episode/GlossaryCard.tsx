import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import SpeakingIndicator from "./SpeakingIndicator";

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
    <motion.button
      layout
      onClick={() => {
        setOpen((o) => {
          const next = !o;
          if (next) speak(`${term}。${explanation}`, id);
          else stop();
          return next;
        });
      }}
      whileTap={{ scale: 0.97 }}
      className={`text-left w-full glass-card rounded-2xl p-4 sm:p-5 transition-all ${
        open ? "border-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.5)]" : "hover:border-primary"
      }`}
    >
      <motion.div layout className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-secondary flex-shrink-0" />
        <span className="font-extrabold text-lg text-white">{term}</span>
        <SpeakingIndicator active={isSpeaking} />
      </motion.div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            key="exp"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/90 leading-relaxed text-base sm:text-lg overflow-hidden"
          >
            {explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default GlossaryCard;

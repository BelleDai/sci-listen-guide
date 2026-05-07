import { Volume2, Square } from "lucide-react";
import { motion } from "framer-motion";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  id: string;
  text: string;
}

const SpeakLine = ({ id, text }: Props) => {
  const { speak, stop, speakingId } = useTTS();
  const active = speakingId === id;
  return (
    <span className="inline-flex items-center gap-1 ml-1 align-middle">
      <button
        onClick={() => speak(text, id)}
        aria-label="朗讀這一句"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/20 text-accent hover:bg-accent/40 transition-colors"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      {active && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={stop}
          aria-label="停止朗讀"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow-[0_0_0_3px_hsl(var(--primary)/0.3)]"
        >
          <Square className="w-3 h-3" fill="currentColor" />
        </motion.button>
      )}
    </span>
  );
};

export default SpeakLine;

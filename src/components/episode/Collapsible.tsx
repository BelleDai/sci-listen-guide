import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { ChevronDown, Square } from "lucide-react";
import SpeakingIndicator from "./SpeakingIndicator";

interface Props {
  label: string;
  children: ReactNode;
  onToggle?: (open: boolean) => void;
  speakingActive?: boolean;
  onStop?: () => void;
}

const Collapsible = ({ label, children, onToggle, speakingActive, onStop }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden border border-accent/40 bg-card/70">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          onToggle?.(next);
        }}
        className="w-full flex items-center justify-between px-5 py-4 font-bold text-accent text-base sm:text-lg hover:bg-accent/10 transition-colors"
      >
        <span className="flex items-center gap-2">
          🔍 {label}
          <SpeakingIndicator active={!!speakingActive} />
          {speakingActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              role="button"
              aria-label="停止語音"
              onClick={(e) => {
                e.stopPropagation();
                onStop?.();
              }}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-white shadow-[0_0_0_3px_hsl(var(--primary)/0.3)] hover:scale-110 transition-transform cursor-pointer"
            >
              <Square className="w-3 h-3" fill="currentColor" />
            </motion.span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 markdown-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Collapsible;

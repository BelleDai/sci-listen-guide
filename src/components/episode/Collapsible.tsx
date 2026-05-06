import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import SpeakingIndicator from "./SpeakingIndicator";

interface Props {
  label: string;
  children: ReactNode;
  onToggle?: (open: boolean) => void;
  speakingActive?: boolean;
}

const Collapsible = ({ label, children, onToggle, speakingActive }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden border border-accent/40 bg-card/70">
      <button
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            onToggle?.(next);
            return next;
          });
        }}
        className="w-full flex items-center justify-between px-5 py-4 font-bold text-accent hover:bg-accent/10 transition-colors"
      >
        <span className="flex items-center gap-2">
          🔍 {label}
          <SpeakingIndicator active={!!speakingActive} />
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
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Collapsible;

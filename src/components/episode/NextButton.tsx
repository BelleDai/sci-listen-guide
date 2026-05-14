import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Check } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
  done?: boolean;
  className?: string;
}

const NextButton = ({ label, onClick, done, className }: Props) => (
  <div className={className || "flex justify-center mt-8"}>
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={done}
      className="group inline-flex items-center gap-2 px-7 py-4 rounded-full font-extrabold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-secondary bg-[image:var(--gradient-primary)] disabled:opacity-90"
    >
      {done ? "已完成" : label}
      <span className="relative w-5 h-5 inline-block">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span
              key="arrow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="absolute inset-0 flex items-center justify-center group-hover:translate-y-1 transition-transform"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  </div>
);

export default NextButton;

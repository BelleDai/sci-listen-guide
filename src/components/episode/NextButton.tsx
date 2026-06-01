import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
  done?: boolean;
  className?: string;
}

const NextButton = ({ label, onClick, done, className }: Props) => (
  <AnimatePresence>
    {!done && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 15, height: 0, marginTop: 0, overflow: "hidden" }}
        transition={{ duration: 0.25 }}
        className={className || "flex justify-center mt-8"}
      >
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-flex items-center gap-2 px-7 py-4 rounded-full font-extrabold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-secondary bg-[image:var(--gradient-primary)]"
        >
          {label}
          <span className="relative w-5 h-5 inline-block">
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
          </span>
        </motion.button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default NextButton;

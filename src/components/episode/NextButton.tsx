import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
}

const NextButton = ({ label, onClick }: Props) => (
  <div className="flex justify-center mt-8">
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group inline-flex items-center gap-2 px-7 py-4 rounded-full font-extrabold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-[image:var(--gradient-primary)]"
    >
      {label}
      <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
    </motion.button>
  </div>
);

export default NextButton;

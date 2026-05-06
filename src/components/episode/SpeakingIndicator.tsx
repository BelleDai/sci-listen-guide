import { motion } from "framer-motion";

const SpeakingIndicator = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <span className="inline-flex items-end gap-0.5 h-4 ml-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 bg-accent rounded-full"
          animate={{ height: ["30%", "100%", "30%"] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          style={{ height: "30%" }}
        />
      ))}
    </span>
  );
};

export default SpeakingIndicator;

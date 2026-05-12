import { motion } from "framer-motion";
import { Microscope, Atom, FlaskConical, Rocket, Orbit, Dna, TestTube, Sparkles, Telescope } from "lucide-react";
import { useMemo } from "react";

const ICONS = [Microscope, Atom, FlaskConical, Rocket, Orbit, Dna, TestTube, Sparkles, Telescope];

interface Item {
  Icon: typeof Microscope;
  top: string;
  left: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
  opacity: number;
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const FloatingDecor = ({ count = 18 }: { count?: number }) => {
  const items = useMemo<Item[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      Icon: ICONS[i % ICONS.length],
      top: `${rand(2, 95)}%`,
      left: `${rand(2, 95)}%`,
      size: Math.round(rand(20, 44)),
      color: Math.random() > 0.5 ? "#97e5ff" : "#ffc952",
      duration: rand(7, 14),
      delay: rand(0, 5),
      drift: rand(10, 28),
      rotate: rand(-25, 25),
      opacity: rand(0.25, 0.5),
    }));
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {items.map((it, i) => {
        const { Icon } = it;
        return (
          <motion.div
            key={i}
            style={{ top: it.top, left: it.left, opacity: it.opacity, color: it.color }}
            className="absolute"
            animate={{
              y: [0, -it.drift, it.drift * 0.6, 0],
              x: [0, it.drift * 0.4, -it.drift * 0.3, 0],
              rotate: [0, it.rotate, -it.rotate * 0.6, 0],
            }}
            transition={{
              duration: it.duration,
              delay: it.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon size={it.size} strokeWidth={1.5} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingDecor;

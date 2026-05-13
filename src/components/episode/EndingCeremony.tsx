import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const fire = () => {
  const colors = ["#ff7473", "#ffc952", "#47b8e0", "#ffffff"];
  const end = Date.now() + 1500;
  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.4 },
    colors,
  });
};

const EndingCeremony = ({ open, onClose }: Props) => {
  useEffect(() => {
    if (!open) return;
    fire();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(
        "太棒了！恭喜你完成今天的探險，讓我們一起期待下一場科普冒險吧！"
      );
      u.lang = "zh-TW";
      u.rate = 0.9;
      u.pitch = 1.1;
      const voices = synth.getVoices();
      const zh = voices.find((v) => /zh|cmn|Chinese/i.test(v.lang));
      if (zh) u.voice = zh;
      synth.speak(u);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl px-8 py-10 text-center text-white bg-secondary bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
          >
            <button
              aria-label="關閉"
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
              className="text-6xl mb-3"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl sm:text-3xl font-black mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6" />
              恭喜你完成今天的科普探險！
            </h3>
            <p className="text-white/90 leading-relaxed">
              你已經是一位小小科學家了，<br />讓我們一起期待下一場冒險吧！
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EndingCeremony;

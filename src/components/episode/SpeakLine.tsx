import { ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTTS } from "@/hooks/useTTS";
import SpeakingIndicator from "./SpeakingIndicator";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  text: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  episodeId?: string;
  contentType?: string;
}

const SpeakLine = ({ id, text, children, className, contentClassName, episodeId, contentType }: Props) => {
  const { speak, speakingId } = useTTS();
  const active = speakingId === id;
  const toggleSpeak = () => {
    if (!active && episodeId && contentType) {
      import("@/lib/analytics").then(({ trackTTSPlay }) => trackTTSPlay(contentType, episodeId));
    }
    speak(text, id);
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={toggleSpeak}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSpeak();
        }
      }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "relative cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active && "ring-2 ring-primary/70 shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]",
        className,
      )}
      aria-label={active ? "停止朗讀這一段" : "朗讀這一段"}
    >
      <span
        className={cn(
          "pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/50 px-2 py-1 text-accent backdrop-blur-sm",
          active && "text-primary",
        )}
      >
        <Volume2 className="w-4 h-4" />
        <SpeakingIndicator active={active} />
      </span>
      <div className={cn("pr-11", contentClassName)}>{children ?? text}</div>
    </motion.div>
  );
};

export default SpeakLine;

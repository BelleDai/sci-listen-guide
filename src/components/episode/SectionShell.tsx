import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";

interface Props {
  id: string;
  title?: string;
  emoji?: string;
  children: ReactNode;
  show: boolean;
}

const SectionShell = forwardRef<HTMLElement, Props>(({ id, title, emoji, children, show }, ref) => {
  return (
    <section
      ref={ref}
      id={id}
      className="min-h-screen w-full flex items-center justify-center px-4 py-16 sm:py-20"
    >
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl mx-auto"
        >
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-secondary text-center mb-6 text-stroke-dark">
              {emoji && <span className="mr-2">{emoji}</span>}
              {title}
            </h2>
          )}
          {children}
        </motion.div>
      )}
    </section>
  );
});

SectionShell.displayName = "SectionShell";
export default SectionShell;

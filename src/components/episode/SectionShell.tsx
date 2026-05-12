"use client";

import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";

interface Props {
  id: string;
  title?: string;
  emoji?: string;
  children: ReactNode;
  show: boolean;
  className?: string;
}

const SectionShell = forwardRef<HTMLElement, Props>(({ id, title, emoji, children, show, className = "" }, ref) => {
  if (!show) {
    // Take no space when not yet revealed
    return <section ref={ref} id={id} aria-hidden className="h-0 overflow-hidden" />;
  }
  return (
    <section
      ref={ref}
      id={id}
      className={`w-full flex items-start justify-center px-4 pt-8 pb-16 sm:pt-12 sm:pb-20 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
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
    </section>
  );
});

SectionShell.displayName = "SectionShell";
export default SectionShell;

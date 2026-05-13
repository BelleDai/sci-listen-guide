"use client";

import { Sparkles } from "lucide-react";

export default function ClientHeroButton() {
  return (
    <button
      onClick={() => {
        // Expand the search in Header
        const headerSearchBtn = document.querySelector('header button[aria-label="展開搜尋"]');
        if (headerSearchBtn) {
          (headerSearchBtn as HTMLButtonElement).click();
        } else {
          // Fallback, scroll to listen section
          window.location.href = "#listen";
        }
      }}
      className="w-full sm:w-auto px-8 py-4 bg-secondary bg-[image:var(--gradient-primary)] text-primary-foreground rounded-full font-bold text-lg shadow-[var(--shadow-glow)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
    >
      <Sparkles className="w-5 h-5" />
      開始探索主題
    </button>
  );
}

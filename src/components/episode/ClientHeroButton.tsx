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
      className="w-full sm:w-auto px-6 py-3.5 bg-secondary bg-[image:var(--gradient-primary)] text-primary-foreground rounded-full font-bold text-base shadow-[var(--shadow-glow)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
    >
      <Sparkles className="w-5 h-5" />
      <div><span className="hidden sm:inline">開始</span>探索主題</div>
    </button>
  );
}

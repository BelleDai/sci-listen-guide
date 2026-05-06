import { useCallback, useEffect, useState } from "react";

export const stripMarkdown = (md: string): string => {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*>+\s?/gm, "")
    .replace(/^[ \t]*#{1,6}\s+/gm, "")
    .replace(/^[ \t]*[-*+]\s+/gm, "")
    .replace(/^[ \t]*\d+[.)]\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/[#*_>`~]/g, "")
    .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, "$1")
    .replace(/\n+/g, "。")
    .replace(/\s+/g, " ")
    .trim();
};

let activeId: string | null = null;
const listeners = new Set<(id: string | null) => void>();
const setActive = (id: string | null) => {
  activeId = id;
  listeners.forEach((l) => l(id));
};

export const useTTS = () => {
  const [speakingId, setSpeakingId] = useState<string | null>(activeId);

  useEffect(() => {
    const l = (id: string | null) => setSpeakingId(id);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const speak = useCallback((text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const clean = stripMarkdown(text);
    if (!clean) return;

    // toggle off if same
    if (activeId === id) {
      synth.cancel();
      setActive(null);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "zh-TW";
    u.rate = 0.9;
    u.pitch = 1.1;
    const voices = synth.getVoices();
    const zh = voices.find((v) => /zh|cmn|Chinese/i.test(v.lang) || /Chinese|中文/i.test(v.name));
    if (zh) u.voice = zh;
    u.onend = () => {
      if (activeId === id) setActive(null);
    };
    u.onerror = () => {
      if (activeId === id) setActive(null);
    };
    setActive(id);
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setActive(null);
  }, []);

  return { speak, stop, speakingId };
};

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

let hasAlertedTTS = false;

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
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      if (!hasAlertedTTS) {
        alert("您目前的瀏覽器不支援語音朗讀功能，建議您改用系統預設瀏覽器（如 Safari 或 Chrome）開啟此網頁。");
        hasAlertedTTS = true;
      }
      return;
    }

    try {
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
      
      u.onerror = (e) => {
        if (activeId === id) setActive(null);
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.error("TTS Error:", e);
          if (!hasAlertedTTS) {
            alert("語音播放失敗。可能是目前的 App 內建瀏覽器限制了此功能，建議您點擊右上角「使用預設瀏覽器」開啟此網頁！");
            hasAlertedTTS = true;
          }
        }
      };
      
      setActive(id);
      synth.speak(u);
    } catch (e) {
      console.error("TTS try-catch error:", e);
      if (activeId === id) setActive(null);
      if (!hasAlertedTTS) {
        alert("語音播放發生錯誤，建議您改用系統預設瀏覽器開啟！");
        hasAlertedTTS = true;
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setActive(null);
  }, []);

  return { speak, stop, speakingId };
};

"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export function useGameBgm(notes: number[], intervalMs = 250, volume = 0.04) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIndexRef = useRef(0);
  const playingRef = useRef(false);

  const initAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!audioCtxRef.current) {
      const audioWindow = window as AudioWindow;
      const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (AudioContextCtor) {
        audioCtxRef.current = new AudioContextCtor();
      }
    }

    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const playNote = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !playingRef.current || notes.length === 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(notes[noteIndexRef.current % notes.length], ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    noteIndexRef.current++;
  }, [notes, volume]);

  const startBgm = useCallback(() => {
    initAudioContext();
    playingRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(playNote, intervalMs);
  }, [initAudioContext, intervalMs, playNote]);

  const stopBgm = useCallback(() => {
    playingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => stopBgm, [stopBgm]);

  return { initAudioContext, startBgm, stopBgm };
}

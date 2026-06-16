"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BookOpen, LogOut, RotateCcw } from 'lucide-react';
import { GAME_SETTINGS } from './core/gameSettings';

type GameResultPanelProps = {
  /** @deprecated Use correctCount/wrongCount for star calculation. Kept for backward compatibility. */
  isWin?: boolean;
  correctCount: number;
  wrongCount: number;
  knowledge: string;
  correctLabel: string;
  wrongLabel: string;
  onPlayAgain: () => void;
  gamesHref?: string;
  reviewHref?: string;
  stars?: number; // Optional stars override
  onWin?: (stars: number) => void;
};

function calcStars(correctCount: number, wrongCount: number): 0 | 1 | 2 | 3 {
  const accuracy = correctCount / Math.max(1, correctCount + wrongCount);
  if (correctCount >= GAME_SETTINGS.success.minimumCorrect && accuracy >= 0.8) return 3;
  if (correctCount >= GAME_SETTINGS.success.minimumCorrect && accuracy >= 0.6) return 2;
  return 1;
}

const STAR_CONFIGS = {
  0: {
    emoji: '💔',
    headline: '挑戰失敗！',
    sub: '哎呀！不要氣餒，再試一次一定可以的！',
    headlineColor: 'text-red-600',
    subColor: 'text-red-500',
    bgGradient: 'from-red-50 to-orange-50',
    ringColor: 'ring-red-400',
  },
  3: {
    emoji: '🌟🌟🌟',
    headline: '超厲害，挑戰成功！',
    sub: '滿分英雄！你是遊戲小天才！',
    headlineColor: 'text-yellow-600',
    subColor: 'text-yellow-500',
    bgGradient: 'from-yellow-50 to-orange-50',
    ringColor: 'ring-yellow-400',
  },
  2: {
    emoji: '⭐⭐',
    headline: '很棒，挑戰成功！',
    sub: '再練習一下，就能得到三顆星了！',
    headlineColor: 'text-[#8c5230]',
    subColor: 'text-orange-500',
    bgGradient: 'from-orange-50 to-amber-50',
    ringColor: 'ring-orange-300',
  },
  1: {
    emoji: '⭐',
    headline: '很棒，挑戰成功！',
    sub: '再練習一下，就能得到三顆星了！',
    headlineColor: 'text-[#8c5230]',
    subColor: 'text-amber-600',
    bgGradient: 'from-amber-50 to-yellow-50',
    ringColor: 'ring-amber-300',
  },
} as const;

export default function GameResultPanel({
  correctCount,
  wrongCount,
  knowledge,
  correctLabel,
  wrongLabel,
  onPlayAgain,
  gamesHref = '/games',
  reviewHref = '/guide/138',
  stars: externalStars,
  onWin,
}: GameResultPanelProps) {
  const stars = (externalStars as 0 | 1 | 2 | 3) ?? calcStars(correctCount, wrongCount);
  const config = STAR_CONFIGS[stars];
  const hasMarkedWin = useRef(false);

  useEffect(() => {
    if (hasMarkedWin.current || stars === 0) return;
    hasMarkedWin.current = true;
    onWin?.(stars);
  }, [stars, onWin]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className={`w-full max-w-sm animate-in fade-in zoom-in-95 rounded-[30px] bg-gradient-to-b ${config.bgGradient} p-6 text-center shadow-2xl duration-300 ring-4 ${config.ringColor}`}>

        {/* 星星動畫區 */}
        <div className="-mt-10 mb-4 flex flex-col items-center">
          <div className="text-5xl animate-bounce drop-shadow-md select-none">{config.emoji}</div>
        </div>

        <h3 className={`mb-1 text-2xl font-black ${config.headlineColor}`}>
          {config.headline}
        </h3>
        <p className={`mb-5 text-sm font-bold ${config.subColor}`}>
          {config.sub}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border-2 border-green-400 bg-green-50 p-3">
            <p className="mb-1 text-xs font-bold text-green-600">{correctLabel}</p>
            <p className="text-3xl font-black text-green-500">{correctCount}</p>
          </div>
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3">
            <p className="mb-1 text-xs font-bold text-red-500">{wrongLabel}</p>
            <p className="text-3xl font-black text-red-400">{wrongCount}</p>
          </div>
        </div>

        <div className="relative mb-6 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left">
          <span className="absolute -top-3 left-4 rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
            科普總結
          </span>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-gray-700">
            {knowledge}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d17a49] py-3 font-bold text-white shadow-[0_4px_0_#a8572b] transition-all active:translate-y-1 active:shadow-none"
            >
              <RotateCcw size={18} />
              再玩一次
            </button>
            {stars !== 3 && reviewHref && (
              <Link
                href={reviewHref}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-[0_4px_0_#1d4ed8] transition-all active:translate-y-1 active:shadow-none"
              >
                <BookOpen size={18} />
                去複習
              </Link>
            )}
          </div>
          <Link
            href={gamesHref ?? '/games'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 py-3 font-bold text-white shadow-[0_4px_0_#444] transition-all active:translate-y-1 active:shadow-none"
          >
            <LogOut size={18} />
            回遊戲基地
          </Link>
        </div>
      </div>
    </div>
  );
}

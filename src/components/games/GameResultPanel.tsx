"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, List, RotateCcw, XCircle } from 'lucide-react';

type GameResultPanelProps = {
  isWin: boolean;
  correctCount: number;
  wrongCount: number;
  knowledge: string;
  correctLabel: string;
  wrongLabel: string;
  onPlayAgain: () => void;
  gamesHref?: string;
  reviewHref?: string;
  onWin?: () => void;
};

export default function GameResultPanel({
  isWin,
  correctCount,
  wrongCount,
  knowledge,
  correctLabel,
  wrongLabel,
  onPlayAgain,
  gamesHref = '/games',
  reviewHref = '/guide/138',
  onWin,
}: GameResultPanelProps) {
  const hasMarkedWin = useRef(false);

  useEffect(() => {
    if (!isWin || hasMarkedWin.current) {
      return;
    }

    hasMarkedWin.current = true;
    onWin?.();
  }, [isWin, onWin]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-[30px] bg-white p-6 text-center shadow-2xl duration-300">
        <div className={`mx-auto -mt-12 mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-lg ${isWin ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
          {isWin ? <CheckCircle size={42} /> : <XCircle size={42} />}
        </div>

        <h3 className="mb-2 text-2xl font-black text-[#8c5230]">
          {isWin ? '挑戰成功！' : '挑戰失敗！'}
        </h3>
        <p className={`mb-5 text-sm font-bold ${isWin ? 'text-green-600' : 'text-red-500'}`}>
          {isWin ? '太棒了，你接到的正確答案比較多喔！' : '沒關係，先回科普伴讀複習一下再挑戰！'}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 ${isWin ? 'border-2 border-green-400 bg-green-50' : 'border-green-100 bg-green-50'}`}>
            <p className="mb-1 text-xs font-bold text-green-600">{correctLabel}</p>
            <p className="text-3xl font-black text-green-500">{correctCount}</p>
          </div>
          <div className={`rounded-xl border p-3 ${!isWin ? 'border-2 border-red-400 bg-red-50' : 'border-red-100 bg-red-50'}`}>
            <p className="mb-1 text-xs font-bold text-red-600">{wrongLabel}</p>
            <p className="text-3xl font-black text-red-500">{wrongCount}</p>
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

        {isWin ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d17a49] py-3 font-bold text-white shadow-[0_4px_0_#a8572b] transition-all active:translate-y-1 active:shadow-none"
            >
              <RotateCcw size={18} />
              再玩一次
            </button>
            <Link
              href={gamesHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-800 py-3 font-bold text-white shadow-[0_4px_0_#444] transition-all active:translate-y-1 active:shadow-none"
            >
              <List size={18} />
              遊戲列表
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d17a49] py-3 font-bold text-white shadow-[0_4px_0_#a8572b] transition-all active:translate-y-1 active:shadow-none"
            >
              <RotateCcw size={18} />
              再玩一次
            </button>
            <Link
              href={reviewHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-[0_4px_0_#1d4ed8] transition-all active:translate-y-1 active:shadow-none"
            >
              <BookOpen size={18} />
              去這集科普伴讀複習
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

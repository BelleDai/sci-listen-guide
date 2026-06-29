// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Home, Play, ArrowLeft, CheckCircle, Sparkles, Map, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { treasureHunterGame } from './data/treasureHunter.data';
import GameResultPanel from './GameResultPanel';
import { markEpisodeGameCompleted } from './core/gameProgress';
import { toSingleQuestionScenes } from './core/questionQueue';
import type { GameScene } from './core/types';

const TREASURE_HUNTER_MAX_ATTEMPTS = 3;
const TREASURE_HUNTER_TIMER_BASE_SECONDS = 8;
const TREASURE_HUNTER_SECONDS_PER_OPTION = 3;
const TREASURE_HUNTER_MIN_SECONDS = 22;
const TREASURE_HUNTER_MAX_SECONDS = 45;
const TREASURE_HUNTER_QUESTION_TTS_RATE = 1.15;
const TREASURE_HUNTER_EXPLANATION_TTS_RATE = 1.35;

const GROUP_ITEM_LAYOUTS = [
  { x: 50, y: 25, size: 'text-5xl' },
  { x: 26, y: 34, size: 'text-5xl' },
  { x: 74, y: 34, size: 'text-5xl' },
  { x: 38, y: 49, size: 'text-5xl' },
  { x: 62, y: 49, size: 'text-5xl' },
  { x: 22, y: 66, size: 'text-5xl' },
  { x: 78, y: 66, size: 'text-5xl' },
  { x: 50, y: 75, size: 'text-5xl' },
];

const GROUP_DECOY_LAYOUTS = [
  { x: 15, y: 22, size: 'text-5xl' },
  { x: 85, y: 23, size: 'text-5xl' },
  { x: 17, y: 47, size: 'text-5xl' },
  { x: 83, y: 48, size: 'text-5xl' },
  { x: 31, y: 78, size: 'text-5xl' },
  { x: 69, y: 79, size: 'text-5xl' },
  { x: 12, y: 71, size: 'text-5xl' },
  { x: 88, y: 70, size: 'text-5xl' },
];

function buildTreasureQuestionGroups(sourceScenes: GameScene[]): GameScene[] {
  const allQuestionScenes = toSingleQuestionScenes(sourceScenes);
  if (allQuestionScenes.length === 0) {
    return [];
  }

  // 1. 過濾掉具有相同正確答案 (label) 的題目，避免畫面上出現兩個一樣的選項
  // 並且最多只取 GROUP_ITEM_LAYOUTS.length 題，避免位置重疊
  const questionScenes = [];
  const usedLabels = new Set();

  for (const scene of allQuestionScenes) {
    if (questionScenes.length >= GROUP_ITEM_LAYOUTS.length) break;

    const itemLabel = scene.items[0]?.label;
    if (itemLabel && !usedLabels.has(itemLabel)) {
      usedLabels.add(itemLabel);
      questionScenes.push(scene);
    }
  }

  if (questionScenes.length === 0) return [];

  const firstScene = questionScenes[0];
  const items = questionScenes.map((scene, index) => ({
    ...scene.items[0],
    id: `${scene.items[0].id}-${index}`,
    ...GROUP_ITEM_LAYOUTS[index],
  }));

  // 2. 挑選干擾物 (Decoy)，確保不跟正確解答或其他干擾物重複
  const decoys = [];
  for (const scene of allQuestionScenes) {
    for (const decoy of scene.decoys) {
      if (decoys.length >= GROUP_DECOY_LAYOUTS.length) break;
      if (decoy.label && !usedLabels.has(decoy.label)) {
        usedLabels.add(decoy.label);
        decoys.push({
          ...decoy,
          id: `${decoy.id}-group-decoy-${decoys.length}`,
          ...GROUP_DECOY_LAYOUTS[decoys.length],
        });
      }
    }
    if (decoys.length >= GROUP_DECOY_LAYOUTS.length) break;
  }

  return [{
    ...firstScene,
    id: `${firstScene.id}-treasure-group`,
    title: firstScene.title,
    prompt: firstScene.prompt,
    items,
    decoys,
    knowledge: Array.from(new Set(questionScenes.map((scene) => scene.knowledge).filter(Boolean))).join('\n\n'),
  }];
}

function getTreasureQuestionTimeLimit(scene: GameScene) {
  const optionCount = scene.items.length + scene.decoys.length;
  const seconds = TREASURE_HUNTER_TIMER_BASE_SECONDS + optionCount * TREASURE_HUNTER_SECONDS_PER_OPTION;
  return Math.min(
    TREASURE_HUNTER_MAX_SECONDS,
    Math.max(TREASURE_HUNTER_MIN_SECONDS, seconds)
  );
}

function getTreasureStars(correctCount: number, totalQuestions: number): 0 | 1 | 2 | 3 {
  if (totalQuestions <= 0 || correctCount <= 0) return 0;

  const ratio = correctCount / totalQuestions;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio >= 0.35) return 1;
  return 0;
}

type TreasureHunterGameProps = {
  scenes?: GameScene[];
  episodeId?: string;
  gamesHref?: string;
  reviewHref?: string;
  gameTitle?: string;
  episodeKnowledge?: string;
};

export default function App({
  scenes,
  episodeId,
  gamesHref = '/games',
  reviewHref,
  gameTitle,
  episodeKnowledge,
}: TreasureHunterGameProps) {
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [foundItems, setFoundItems] = useState([]);
  const [failedItems, setFailedItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // 狀態控制
  const [clickedItemId, setClickedItemId] = useState(null);
  const [wrongItemId, setWrongItemId] = useState(null);
  const [subtitle, setSubtitle] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0); // 記錄目前題目的錯誤次數
  const [questionActive, setQuestionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [failedExplanation, setFailedExplanation] = useState(null);

  const sourceScenes = scenes ?? treasureHunterGame.scenes;
  const activeScenes = selectedScenes.length > 0 ? selectedScenes : sourceScenes;
  const currentScene = activeScenes.find(s => s.id === currentSceneId);
  const audioRef = useRef(null);
  const speechFallbackTimer = useRef(null);
  const speechTokenRef = useRef(0);
  const { startBgm, stopBgm } = useGameBgm(treasureHunterGame.bgmNotes, 300, 0.035);

  // 清除所有音訊與字幕
  const stopAudio = () => {
    speechTokenRef.current += 1;
    clearTimeout(speechFallbackTimer.current);
    if (audioRef.current) {
      audioRef.current.onended = null; // 確保不會觸發舊的 callback
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      if (window.currentUtterance) {
        window.currentUtterance.onend = null; // 確保不會觸發舊的 callback
      }
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSubtitle("");
  };

  // 播放 TTS 語音 (新增 onEndCallback 以支援連續播放)
  const playTTS = (
    text,
    onEndCallback = null,
    showSubtitle = true,
    rate = TREASURE_HUNTER_QUESTION_TTS_RATE
  ) => {
    stopAudio();
    if (!text) {
      if (onEndCallback) onEndCallback();
      return;
    }

    setIsSpeaking(true);
    if (showSubtitle) setSubtitle(text);

    if (!('speechSynthesis' in window)) {
      setTimeout(() => {
        setIsSpeaking(false);
        setTimeout(() => setSubtitle(""), 1000);
        if (onEndCallback) onEndCallback();
      }, 1800);
      return;
    }

    const synth = window.speechSynthesis;
    const speechToken = speechTokenRef.current + 1;
    speechTokenRef.current = speechToken;
    clearTimeout(speechFallbackTimer.current);
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = rate;

    let finished = false;
    const finish = () => {
      if (speechTokenRef.current !== speechToken || finished) return;
      finished = true;
      clearTimeout(speechFallbackTimer.current);
      setIsSpeaking(false);
      setTimeout(() => setSubtitle(""), 1000);
      if (onEndCallback) onEndCallback();
    };

    speechFallbackTimer.current = window.setTimeout(() => {
      if (speechTokenRef.current !== speechToken || finished) return;
      synth.cancel();
      finish();
    }, Math.max(4000, text.length * 350));

    window.currentUtterance = utterance; // 避免 Chrome GC 導致語音中斷
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
  };
  const startQuestion = (scene, itemIndex, delayMs = 0) => {
    const targetItem = scene?.items?.[itemIndex];
    if (!targetItem) return;

    const limit = getTreasureQuestionTimeLimit(scene);
    setQuestionActive(false);
    setCurrentItemIndex(itemIndex);
    setMistakeCount(0);
    setTimeLimit(limit);
    setTimeLeft(limit);

    window.setTimeout(() => {
      playTTS(targetItem.question, () => {
        setQuestionActive(true);
      }, false, TREASURE_HUNTER_QUESTION_TTS_RATE);
    }, delayMs);
  };

  const moveToNextQuestion = (nextItemIndex) => {
    if (!currentScene) return;

    if (nextItemIndex >= currentScene.items.length) {
      advanceScene();
      return;
    }

    startQuestion(currentScene, nextItemIndex, 350);
  };

  const revealCurrentAnswer = (reason = 'wrong') => {
    if (!currentScene || currentItemIndex >= currentScene.items.length) return;

    const expectedItem = currentScene.items[currentItemIndex];
    setQuestionActive(false);
    setFailedItems(prev => prev.includes(expectedItem.id) ? prev : [...prev, expectedItem.id]);
    setMistakeCount(0);
    if (reason === 'timeout') {
      setTotalWrong(prev => prev + 1);
    }

    const explanation = expectedItem.audioText ?? expectedItem.explanation ?? expectedItem.question;
    const revealText = reason === 'timeout'
      ? `時間到！答案是 ${expectedItem.label}。${explanation}`
      : `答案是 ${expectedItem.label}。${explanation}`;

    playTTS(revealText, () => {
      moveToNextQuestion(currentItemIndex + 1);
    }, true, TREASURE_HUNTER_EXPLANATION_TTS_RATE);
  };

  useEffect(() => {
    if (!questionActive || showResult) return;

    if (timeLeft <= 0) {
      revealCurrentAnswer('timeout');
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [questionActive, showResult, timeLeft, currentItemIndex]);

  // 處理點擊物品
  const handleItemClick = (item) => {
    if (!currentScene || foundItems.includes(item.id) || failedItems.includes(item.id)) return;
    if (clickedItemId || (mistakeCount > 0 && !questionActive)) return;

    // 獲取目前「應該」要尋找的目標物品
    const expectedItem = currentScene.items[currentItemIndex];
    if (!expectedItem || foundItems.includes(expectedItem.id) || failedItems.includes(expectedItem.id)) return;

    // 點擊的是錯誤的物品 (順序不對的目標物)
    if (item.id !== expectedItem.id) {
      handleDecoyClick({ id: item.id });
      return;
    }

    // ------- 答對了！-------
    setQuestionActive(false);
    setClickedItemId(item.id);
    setTotalCorrect(prev => prev + 1);

    const nextItemIndex = currentItemIndex + 1;

    // 播放 explanation (audioText)，完成後再吸下一題或結尾知識總結
    const explanation = item.audioText ?? item.question;
    playTTS(explanation, () => {
      moveToNextQuestion(nextItemIndex);
    }, true, TREASURE_HUNTER_EXPLANATION_TTS_RATE);

    setTimeout(() => {
      setFoundItems(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
      setMistakeCount(0);
    }, 400);

    setTimeout(() => setClickedItemId(null), 1000);
  };

  // 處理點擊干擾物(誘餌) 或 點錯順序
  const handleDecoyClick = (decoy) => {
    if (!currentScene || currentItemIndex >= currentScene.items.length) return;
    const expectedItem = currentScene.items[currentItemIndex];
    if (!expectedItem || foundItems.includes(expectedItem.id) || failedItems.includes(expectedItem.id)) return;
    if (clickedItemId || (mistakeCount > 0 && !questionActive)) return;

    setQuestionActive(false);
    setWrongItemId(decoy.id);
    const newMistakeCount = mistakeCount + 1;
    setMistakeCount(newMistakeCount);
    setTotalWrong(prev => prev + 1);
    setTimeout(() => setWrongItemId(null), 600);

    if (newMistakeCount >= TREASURE_HUNTER_MAX_ATTEMPTS) {
      revealCurrentAnswer('wrong');
      return;
    }

    playTTS(`哎呀！錯囉！還有 ${TREASURE_HUNTER_MAX_ATTEMPTS - newMistakeCount} 次機會。`, () => {
      setQuestionActive(true);
    }, true, TREASURE_HUNTER_QUESTION_TTS_RATE);
  };

  const resetLevel = () => {
    stopAudio();
    setFoundItems([]);
    setFailedItems([]);
    setCurrentItemIndex(0);
    setMistakeCount(0);
    setQuestionActive(false);
    setTimeLeft(0);
    setTimeLimit(0);
    setFailedExplanation(null);
  };

  const resetGameStats = () => {
    setTotalCorrect(0);
    setTotalWrong(0);
    setShowResult(false);
  };

  const startGame = () => {
    const nextScenes = buildTreasureQuestionGroups(sourceScenes);
    if (nextScenes.length === 0) return;

    setSelectedScenes(nextScenes);
    resetGameStats();
    resetLevel();
    setSceneIndex(0);
    setCurrentSceneId(nextScenes[0].id);
    startQuestion(nextScenes[0], 0, 600);
    startBgm();
  };

  const advanceScene = () => {
    stopBgm();
    stopAudio();
    setShowResult(true);
  };

  useEffect(() => {
    if (showResult) {
      stopBgm();
      const finalKnowledge = failedExplanation ?? episodeKnowledge ?? currentScene?.knowledge;
      if (finalKnowledge) playTTS(finalKnowledge, null, true, TREASURE_HUNTER_EXPLANATION_TTS_RATE);
    }
  }, [showResult]);

  const playAgain = () => {
    startGame();
  };

  const goHome = () => {
    stopAudio();
    stopBgm();
    setCurrentSceneId(null);
    setSelectedScenes([]);
    setSceneIndex(0);
    resetGameStats();
    resetLevel();
  };

  useEffect(() => {
    return () => {
      stopAudio();
      stopBgm();
    };
  }, []);

  // 取得目前問題
  const currentTargetItem = currentScene && currentItemIndex < currentScene.items.length
    ? currentScene.items[currentItemIndex]
    : null;
  const timerPercent = timeLimit > 0 ? Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100)) : 0;
  const finalStars = currentScene ? getTreasureStars(totalCorrect, currentScene.items.length) : 0;

  return (
    <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake-wrong {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-shake-wrong { animation: shake-wrong 0.4s ease-in-out; }
      `}} />

      <div className="w-full max-w-2xl h-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden relative border-0 sm:border-8 border-neutral-800 flex flex-col">

        {!currentScene ? (
          // ================= [ 主選單畫面 ] =================
          <div className="flex-1 bg-[#fff8eb] overflow-y-auto relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <div className="min-h-full flex flex-col items-center justify-center p-4 py-8">
              <div className="z-10 text-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white shadow-blue-500/50 relative">
                  <span className="text-6xl">💎</span>
                  <Sparkles className="absolute -top-2 -right-2 text-blue-400 w-8 h-8" />
                </div>
                <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-1 tracking-wide">
                  尋寶獵人
                </h1>
                {gameTitle && (
                  <p className="text-[#a36b4a]/90 font-bold text-base px-4 py-2 rounded-full inline-block">
                    {gameTitle}
                  </p>
                )}
              </div>

              {/* 遊戲機制說明 */}
              <div className="z-10 w-full max-w-xs bg-white/80 rounded-2xl border border-orange-200 p-4 mb-6 text-left space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <p className="font-black text-[#8c5230] mb-1.5 sm:mb-2">遊戲規則</p>
                <div className="flex items-start gap-2 text-[#6b4731]">
                  <span>👂</span>
                  <span>先聽題目，題目念完後才開始倒數。</span>
                </div>
                <div className="flex items-start gap-2 text-[#6b4731]">
                  <span>🔎</span>
                  <span>每一題找一個寶物，答對後會播放解說，接著換下一題。</span>
                </div>
                <div className="flex items-start gap-2 text-[#6b4731]">
                  <span>❤️</span>
                  <span>每題有<b className="text-blue-500 text-lg"> 3 次</b> 機會。時間到或 3 次都答錯，會顯示正確答案。</span>
                </div>
                {/* <div className="flex items-start gap-2 text-[#6b4731]">
                  <span>✅</span>
                  <span>答對會出現綠色勾勾；沒答對會灰掉並出現叉叉。</span>
                </div> */}
                <div className="flex items-start gap-2 text-[#6b4731]">
                  <span>🏆</span>
                  <span>完成全部題目後，會依答對數拿到 1 到 3 顆星。</span>
                </div>
              </div>

              <div className="w-full z-10 px-1 mt-2 flex justify-center">
                <button
                  onClick={startGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full text-xl sm:text-2xl flex items-center gap-3 shadow-[0_6px_0_#1d4ed8] active:translate-y-2 active:shadow-none transition-all"
                >
                  <Play fill="currentColor" /> 開始遊戲
                </button>
              </div>
            </div>
          </div>
        ) : (
          // ================= [ 遊戲場景畫面 ] =================
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black">

            {/* 頂部任務與問題欄 */}
            <div className="bg-[#d17a49] text-white pt-6 sm:pt-10 pb-3 sm:pb-4 px-2 sm:rounded-b-[30px] rounded-b-[20px] border-b-[4px] sm:border-b-[6px] border-[#a8572b] shadow-[0_10px_20px_rgba(0,0,0,0.2)] relative z-30">
              <div className="absolute inset-x-0 top-0 h-3 overflow-hidden bg-black/20 sm:rounded-t-[32px]">
                <div
                  className={`h-full rounded-r-full transition-all duration-300 ${
                    timeLeft <= 6 && questionActive ? 'bg-red-400' : 'bg-yellow-300'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-black leading-none text-white shadow-sm">
                  {questionActive ? `${timeLeft}s` : '--'}
                </span>
              </div>
              <button onClick={goHome} className="hidden">
                <ArrowLeft size={18} />
              </button>

              {/* <h2 className="text-center text-sm font-black mb-2 drop-shadow-md opacity-80 md:hidden">
                {currentScene.title}
              </h2> */}

              {/* 目前要尋找的問題提示框 (加入點擊可重新聽題目) */}
              <div
                onClick={() => currentTargetItem && playTTS(currentTargetItem.question, null, false, TREASURE_HUNTER_QUESTION_TTS_RATE)}
                className="bg-[#a8572b]/60 mx-3 mb-4 p-3 rounded-2xl border border-white/20 shadow-inner flex items-start gap-2 cursor-pointer active:scale-95 transition-transform"
                title="點擊重新聽題目"
              >
                <Volume2 className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-yellow-50 text-base font-bold leading-snug select-none">
                  {currentTargetItem ? currentTargetItem.question : '任務完成！恭喜你找出所有物品。'}
                </p>
              </div>

              {/* 尋寶進度條 (小圖標) */}
              <div className="flex justify-center gap-2">
                {currentScene.items.map((item, idx) => {
                  const isFound = foundItems.includes(item.id);
                  const isFailed = failedItems.includes(item.id);
                  const isCurrentTarget = currentItemIndex === idx && !isFound && !isFailed;

                  let displayIcon = '❓';
                  if (isFound) displayIcon = item.icon;
                  else if (isFailed) displayIcon = item.icon;

                  return (
                    <div
                      key={`header-${idx}-${item.id}`}
                      className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-xl sm:text-2xl transition-all duration-500 shadow-inner
                        ${isFound ? 'border-[3px] border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] scale-90' :
                          isFailed ? 'border-[3px] border-red-400 opacity-70 grayscale' :
                          isCurrentTarget ? 'border-[4px] border-yellow-400 scale-110 shadow-[0_0_16px_rgba(250,204,21,0.45)]' : 'border-[3px] border-[#e6a583] opacity-40 grayscale'}
                      `}
                    >
                      <span className={displayIcon === '❓' ? 'text-gray-400 opacity-60 font-black text-lg sm:text-xl' : ''}>
                        {displayIcon}
                      </span>
                      {isFound && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full text-white scale-75 sm:scale-100">
                          <CheckCircle size={14} />
                        </div>
                      )}
                      {isFailed && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-red-500 text-white scale-75 sm:scale-100">
                          <XCircle size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 主要尋寶區域 */}
            <div className={`flex-1 relative ${currentScene.bgColor ?? 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500'} overflow-hidden -mt-8`}>
              {currentScene.background ?? (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute left-[8%] top-[12%] h-28 w-28 rounded-full bg-white/20 blur-xl" />
                  <div className="absolute right-[10%] top-[22%] h-16 w-16 rounded-full bg-yellow-100/30 blur-lg" />
                  <div className="absolute bottom-0 left-0 h-24 w-full bg-black/15" />
                  <div className="absolute bottom-[12%] left-[12%] h-12 w-24 rounded-full bg-white/15 blur-md" />
                  <div className="absolute bottom-[18%] right-[16%] h-16 w-32 rounded-full bg-white/10 blur-md" />
                </div>
              )}

              {/* 繪製干擾物品 (誘餌) */}
              {currentScene.decoys.map((decoy, idx) => {
                const isWrongNow = wrongItemId === decoy.id;
                return (
                  <div
                    key={`decoy-${idx}-${decoy.id}`}
                    style={{ top: `${decoy.y}%`, left: `${decoy.x}%` }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      onClick={() => handleDecoyClick(decoy)}
                      className={`relative transition-transform duration-200 flex flex-col items-center ${decoy.size} ${isWrongNow ? 'animate-shake-wrong' : 'hover:scale-110'}`}
                    >
                      <span className="drop-shadow-md">{decoy.icon}</span>
                      {/* Emoji 下方的文字標籤 */}
                      <span className="mt-1 text-sm font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider">
                        {decoy.label}
                      </span>
                      {isWrongNow && (
                        <XCircle className="absolute top-0 right-0 w-8 h-8 text-red-500 bg-white rounded-full scale-125 -translate-y-1/2 translate-x-1/2" />
                      )}
                    </button>
                  </div>
                );
              })}

              {/* 繪製隱藏的正確物品 */}
              {currentScene.items.map((item, idx) => {
                const isFound = foundItems.includes(item.id);
                const isFailed = failedItems.includes(item.id);
                const isClickedNow = clickedItemId === item.id;
                const isWrongNow = wrongItemId === item.id;

                return (
                  <div
                    key={`scene-${idx}-${item.id}`}
                    style={{ top: `${item.y}%`, left: `${item.x}%` }}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700
                      ${isFound ? 'opacity-0 scale-150 pointer-events-none -translate-y-20' : 'opacity-100'}
                      ${isFailed ? 'grayscale opacity-60' : ''}
                    `}
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      disabled={isFound || isFailed}
                      className={`relative cursor-pointer select-none transition-transform duration-200 flex flex-col items-center
                        ${item.size} 
                        ${!isFound && !isFailed && !isClickedNow && !isWrongNow ? 'hover:scale-110' : ''}
                        ${isClickedNow ? 'scale-150 brightness-150' : ''}
                        ${isWrongNow ? 'animate-shake-wrong' : ''}
                      `}
                    >
                      <span className="drop-shadow-md relative">
                        {item.icon}
                        {isClickedNow && (
                          <div className="absolute inset-0 text-yellow-300 animate-ping">
                            <Sparkles className="w-full h-full" />
                          </div>
                        )}
                      </span>
                      {/* Emoji 下方的文字標籤 */}
                      <span className="mt-1 text-sm font-bold text-white px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider bg-black/50">
                        {item.label}
                      </span>

                      {isWrongNow && (
                        <XCircle className="absolute top-0 right-0 w-8 h-8 text-red-500 bg-white rounded-full scale-125 -translate-y-1/2 translate-x-1/2" />
                      )}
                      {isFailed && (
                        <XCircle className="absolute top-0 right-0 w-8 h-8 text-red-500 bg-white rounded-full scale-125 -translate-y-1/2 translate-x-1/2" />
                      )}
                    </button>
                  </div>
                );
              })}

            </div>

            {/* 字幕與語音狀態區塊 (浮動在底部) */}
            <div className={`absolute bottom-6 left-4 right-4 z-40 transition-all duration-300 ${subtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="bg-black/80 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-white/20 flex gap-3 items-start">
                <div className={`mt-1 shrink-0 ${isSpeaking ? 'text-green-400 animate-pulse' : 'text-gray-400'}`}>
                  <Volume2 size={20} />
                </div>
                <p className="text-[15px] font-medium leading-relaxed tracking-wide">
                  {subtitle}
                </p>
              </div>
            </div>

            {showResult && (
              <GameResultPanel
                correctCount={totalCorrect}
                wrongCount={totalWrong}
                correctLabel="尋獲目標"
                wrongLabel="尋寶失誤"
                knowledge={failedExplanation ?? episodeKnowledge ?? currentScene.knowledge}
                gamesHref={gamesHref}
                reviewHref={reviewHref ?? (episodeId ? `/guide/${episodeId}` : undefined)}
                onWin={episodeId ? (s) => markEpisodeGameCompleted(episodeId, s) : undefined}
                onPlayAgain={playAgain}
                stars={finalStars}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
}

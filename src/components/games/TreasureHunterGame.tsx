// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Home, Play, ArrowLeft, CheckCircle, Sparkles, Map, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { treasureHunterGame } from './data/treasureHunter.data';
import GameResultPanel from './GameResultPanel';
import { GAME_SETTINGS } from './core/gameSettings';
import { markEpisodeGameCompleted } from './core/gameProgress';
import { toSingleQuestionScenes } from './core/questionQueue';
import type { GameScene } from './core/types';

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
  const questionScenes = toSingleQuestionScenes(sourceScenes);
  if (questionScenes.length === 0) {
    return [];
  }

  const firstScene = questionScenes[0];
  const items = questionScenes.map((scene, index) => ({
    ...scene.items[0],
    id: `${scene.items[0].id}-${index}`,
    ...GROUP_ITEM_LAYOUTS[index % GROUP_ITEM_LAYOUTS.length],
  }));
  const decoys = questionScenes.slice(0, GROUP_DECOY_LAYOUTS.length).flatMap((scene, index) => {
    const decoy = scene.decoys[0];
    if (!decoy) return [];

    return [{
      ...decoy,
      id: `${decoy.id}-group-decoy-${index}`,
      ...GROUP_DECOY_LAYOUTS[index % GROUP_DECOY_LAYOUTS.length],
    }];
  });

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
  const [showKnowledge, setShowKnowledge] = useState(false);
  
  // 狀態控制
  const [clickedItemId, setClickedItemId] = useState(null);
  const [wrongItemId, setWrongItemId] = useState(null);
  const [subtitle, setSubtitle] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0); // 記錄目前題目的錯誤次數
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
  const playTTS = (text, onEndCallback = null, showSubtitle = true) => {
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
    utterance.rate = 1.15;

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
  // 進入新場景時，自動唸出第一題的題目
  useEffect(() => {
    if (currentSceneId) {
      const scene = activeScenes.find(s => s.id === currentSceneId);
      if (scene && scene.items.length > 0) {
        const timer = setTimeout(() => {
          playTTS(scene.items[0].question, null, false);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSceneId]);

  // 處理點擊物品
  const handleItemClick = (item) => {
    if (foundItems.includes(item.id)) return;
    
    // 獲取目前「應該」要尋找的目標物品
    const expectedItem = currentScene.items[foundItems.length];

    // 點擊的是錯誤的物品 (順序不對的目標物)
    if (item.id !== expectedItem.id) {
      handleDecoyClick({ id: item.id });
      return;
    }

    // ------- 答對了！-------
    setClickedItemId(item.id);
    setTotalCorrect(prev => prev + 1);
    
    const isLastItem = foundItems.length + 1 === currentScene.items.length;
    const nextItemIndex = foundItems.length + 1;

    // 播放 explanation (audioText)，完成後再吸下一題或結尾知識總結
    const explanation = item.audioText ?? item.question;
    playTTS(explanation, () => {
      if (!isLastItem) {
        playTTS(currentScene.items[nextItemIndex].question, null, false);
      } else {
        setShowKnowledge(true);
        playTTS(episodeKnowledge ?? currentScene.knowledge);
      }
    });
    
    setTimeout(() => {
      const newFoundItems = [...foundItems, item.id];
      setFoundItems(newFoundItems);
      setMistakeCount(0);
    }, 400);
    
    setTimeout(() => setClickedItemId(null), 1000);
  };

  // 處理點擊干擾物(誘餌) 或 點錯順序
  const handleDecoyClick = (decoy) => {
    if (currentScene && foundItems.length === currentScene.items.length) return;
    if (mistakeCount >= 3) return;
    setWrongItemId(decoy.id);
    const newMistakeCount = mistakeCount + 1;
    setMistakeCount(newMistakeCount);
    setTotalWrong(prev => prev + 1);
    setTimeout(() => setWrongItemId(null), 600);

    const expectedItem = currentScene.items[foundItems.length];

    if (newMistakeCount === 1) {
      playTTS("哎呀！這不是喔！");
    } else if (newMistakeCount === 2) {
      playTTS("哎呀！這不是喔！小提示：試著尋找黃色光圈附近的地方喔！");
    } else {
      playTTS("哎呀！這不是喔！尋寶失敗！", () => {
        stopBgm();
        setFailedExplanation(expectedItem.audioText ?? expectedItem.explanation ?? expectedItem.question);
        setShowResult(true);
      });
    }
  };

  const resetLevel = () => {
    stopAudio();
    setFoundItems([]);
    setShowKnowledge(false);
    setMistakeCount(0);
    setFailedExplanation(null);
  };

  const resetGameStats = () => {
    setTotalCorrect(0);
    setTotalWrong(0);
    setShowResult(false);
  };

  const startGame = () => {
    const nextScenes = buildTreasureQuestionGroups(sourceScenes);
    setSelectedScenes(nextScenes);
    resetGameStats();
    resetLevel();
    setSceneIndex(0);
    setCurrentSceneId(nextScenes[0].id);
    startBgm();
  };

  const advanceScene = () => {
    if (sceneIndex < selectedScenes.length - 1) {
      const nextSceneIndex = sceneIndex + 1;
      resetLevel();
      setSceneIndex(nextSceneIndex);
      setCurrentSceneId(selectedScenes[nextSceneIndex].id);
    } else {
      stopBgm();
      stopAudio();
      setShowKnowledge(false);
      setShowResult(true);
    }
  };

  useEffect(() => {
    if (showResult) {
      stopBgm();
      const finalKnowledge = failedExplanation ?? episodeKnowledge ?? currentScene?.knowledge;
      if (finalKnowledge) playTTS(finalKnowledge);
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
  const currentTargetItem = currentScene && foundItems.length < currentScene.items.length 
    ? currentScene.items[foundItems.length] 
    : null;

  return (
    <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake-wrong {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-shake-wrong { animation: shake-wrong 0.4s ease-in-out; }
      `}} />

      <div className="w-full max-w-2xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex flex-col">
        
        {!currentScene ? (
          // ================= [ 主選單畫面 ] =================
          <div className="flex-1 bg-[#fff8eb] flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="z-10 text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white shadow-blue-500/50 relative">
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
            <div className="z-10 w-full max-w-xs bg-white/80 rounded-2xl border border-orange-200 p-4 mb-6 text-left space-y-2">
              <p className="font-black text-[#8c5230] mb-2">遊戲規則</p>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>👂</span>
                <span>打開聲音，邊找邊學！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>👌</span>
                <span>聽題目提示，按順序點擊場景中的尋寶物品</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>💡</span>
                <span>答錯會加強提示，選錯 3 次會直接失敗喔！</span>
              </div>
            </div>

            <div className="w-full z-10 px-1">
              <button
                onClick={startGame}
                className="mx-auto flex items-center justify-center gap-3 rounded-full bg-blue-500 px-10 py-4 text-2xl font-black text-white shadow-[0_6px_0_#1d4ed8] transition-all hover:bg-blue-600 active:translate-y-2 active:shadow-none"
              >
                <Play fill="currentColor" /> 開始遊戲
              </button>
            </div>
          </div>
        ) : (
          // ================= [ 遊戲場景畫面 ] =================
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
            
            {/* 頂部任務與問題欄 */}
            <div className="bg-[#d17a49] text-white pt-10 pb-4 px-2 rounded-b-[30px] border-b-[6px] border-[#a8572b] shadow-[0_10px_20px_rgba(0,0,0,0.2)] relative z-30">
              <button onClick={goHome} className="hidden">
                <ArrowLeft size={18} />
              </button>
              
              <h2 className="text-center text-sm font-black mb-2 drop-shadow-md opacity-80 md:hidden">
                {currentScene.title}
              </h2>
              
              {/* 目前要尋找的問題提示框 (加入點擊可重新聽題目) */}
              <div 
                onClick={() => currentTargetItem && playTTS(currentTargetItem.question, null, false)}
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
                  const isCurrentTarget = foundItems.length === idx;
                  const showHint =
                    isCurrentTarget && mistakeCount >= GAME_SETTINGS.treasureHunter.maxMistakesBeforeHint;
                  
                  let displayIcon = '❓';
                  if (isFound) displayIcon = item.icon;
                  else if (showHint) displayIcon = item.icon;

                  return (
                    <div 
                      key={`header-${item.id}`} 
                      className={`relative w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl transition-all duration-500 shadow-inner
                        ${isFound ? 'border-[3px] border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] scale-90' : 
                          isCurrentTarget ? 'border-[4px] border-yellow-400 scale-110 shadow-[0_0_16px_rgba(250,204,21,0.45)]' : 'border-[3px] border-[#e6a583] opacity-40 grayscale'}
                      `}
                    >
                      <span className={displayIcon === '❓' ? 'text-gray-400 opacity-60 font-black text-xl' : ''}>
                        {displayIcon}
                      </span>
                      {isFound && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full text-white">
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 主要尋寶區域 */}
            <div className={`flex-1 relative ${currentScene.bgColor ?? 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500'} overflow-hidden`}>
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
              {currentScene.decoys.map(decoy => {
                const isWrongNow = wrongItemId === decoy.id;
                return (
                  <div
                    key={`decoy-${decoy.id}`}
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
              {currentScene.items.map(item => {
                const isFound = foundItems.includes(item.id);
                const isClickedNow = clickedItemId === item.id;
                const isWrongNow = wrongItemId === item.id;
                const isCurrentTarget = currentScene.items[foundItems.length]?.id === item.id;
                // 第 2 次錯誤時，目標物品顯示淡小光圈
                const showGlowHint = isCurrentTarget && mistakeCount >= 2 && mistakeCount < GAME_SETTINGS.treasureHunter.maxMistakesBeforeHint;
                
                return (
                  <div
                    key={`scene-${item.id}`}
                    style={{ top: `${item.y}%`, left: `${item.x}%` }}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700
                      ${isFound ? 'opacity-0 scale-150 pointer-events-none -translate-y-20' : 'opacity-100'}
                    `}
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      disabled={isFound}
                      className={`relative cursor-pointer select-none transition-transform duration-200 flex flex-col items-center
                        ${item.size} 
                        ${!isFound && !isClickedNow && !isWrongNow ? 'hover:scale-110' : ''}
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
                        {/* 第 2 次錯誤光圈提示 */}
                        {showGlowHint && (
                          <div className="absolute inset-0 rounded-full animate-ping opacity-60 bg-yellow-300 blur-sm scale-150 pointer-events-none" />
                        )}
                      </span>
                      {/* Emoji 下方的文字標籤 */}
                      <span className={`mt-1 text-sm font-bold text-white px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider
                        ${showGlowHint ? 'bg-yellow-500/80 border border-yellow-300' : 'bg-black/50'}
                      `}>
                        {item.label}
                      </span>
                      
                      {isWrongNow && (
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

            {/* 過關科普知識彈窗 */}
            {showKnowledge && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-sm rounded-[30px] p-6 text-center shadow-2xl transform scale-100 animate-[bounce-in_0.5s_ease-out]">
                  
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 border-4 border-white shadow-lg">
                    <CheckCircle size={40} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-[#8c5230] mb-2">太棒了！全找到啦！</h3>
                  <div className="w-16 h-1 bg-orange-200 mx-auto mb-4 rounded-full"></div>
                  
                  <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100 relative text-left">
                     <span className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Map size={12} /> 科普總結
                     </span>
                    <p className="text-gray-700 font-medium leading-relaxed mt-2 text-[15px]">
                      {episodeKnowledge ?? currentScene.knowledge}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={goHome}
                      className="hidden"
                    >
                      <Home size={18} /> 回首頁
                    </button>
                    <button 
                      onClick={advanceScene}
                      className="flex-1 py-3 bg-[#d17a49] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_0_#a8572b] active:translate-y-1 active:shadow-none transition-all"
                    >
                      {sceneIndex < selectedScenes.length - 1 ? '下一題' : '完成遊戲'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                stars={failedExplanation ? 0 : 3}
              />
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

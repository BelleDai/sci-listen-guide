// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Home, Play, ArrowLeft, CheckCircle, Sparkles, Map, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { treasureHunterGame } from './data/treasureHunter.data';

export default function App() {
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
  
  const activeScenes = selectedScenes.length > 0 ? selectedScenes : treasureHunterGame.scenes;
  const currentScene = activeScenes.find(s => s.id === currentSceneId);
  const audioRef = useRef(null);
  const { startBgm, stopBgm } = useGameBgm(treasureHunterGame.bgmNotes, 300, 0.035);

  // 清除所有音訊與字幕
  const stopAudio = () => {
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
  const playTTS = (text, onEndCallback = null) => {
    stopAudio();
    setIsSpeaking(true);
    setSubtitle(text);

    const finish = () => {
      setIsSpeaking(false);
      setTimeout(() => setSubtitle(""), 1000);
      if (onEndCallback) onEndCallback();
    };

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.15;
      window.currentUtterance = utterance;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(finish, 1800);
    }
  };
  // 進入新場景時，自動唸出第一題的題目
  useEffect(() => {
    if (currentSceneId) {
      const scene = activeScenes.find(s => s.id === currentSceneId);
      if (scene && scene.items.length > 0) {
        const timer = setTimeout(() => {
          playTTS(scene.items[0].question);
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

    // 如果點擊的是正確物品，但是不符合「當前問題」，當作點錯處理
    if (item.id !== expectedItem.id) {
      handleDecoyClick({ id: item.id });
      return;
    }
    
    // 答對了！
    setClickedItemId(item.id);
    
    const isLastItem = foundItems.length + 1 === currentScene.items.length;
    const nextItemIndex = foundItems.length + 1;

    // 唸出原理解釋，結束後唸下一題 (或結尾知識總結)
    playTTS(item.audioText, () => {
      if (!isLastItem) {
        playTTS(currentScene.items[nextItemIndex].question);
      } else {
        setShowKnowledge(true);
        playTTS(currentScene.knowledge);
      }
    });
    
    setTimeout(() => {
      const newFoundItems = [...foundItems, item.id];
      setFoundItems(newFoundItems);
      setMistakeCount(0); // 答對了，重置錯誤次數給下一題
    }, 400);
    
    setTimeout(() => setClickedItemId(null), 1000);
  };

  // 處理點擊干擾物(誘餌) 或 點錯順序
  const handleDecoyClick = (decoy) => {
    if (currentScene && foundItems.length === currentScene.items.length) return; // 遊戲結束防誤觸
    setWrongItemId(decoy.id);
    setMistakeCount(prev => prev + 1); // 增加錯誤次數
    playTTS("哎呀！這不是我們要找的喔！"); 
    
    setTimeout(() => setWrongItemId(null), 600);
  };

  const resetLevel = () => {
    stopAudio();
    setFoundItems([]);
    setShowKnowledge(false);
    setMistakeCount(0);
  };

  const startGame = () => {
    const nextScenes = treasureHunterGame.pickScenes(2);
    setSelectedScenes(nextScenes);
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
      goHome();
    }
  };

  const goHome = () => {
    stopAudio();
    stopBgm();
    setCurrentSceneId(null);
    setSelectedScenes([]);
    setSceneIndex(0);
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
            
            <div className="z-10 text-center mb-10">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white shadow-blue-500/50 relative">
                <span className="text-6xl">🕵️‍♂️</span>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-8 h-8" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-2 tracking-wide">
                寶藏獵人
              </h1>
              <p className="text-[#a36b4a] font-bold">打開聲音，邊找邊學！</p>
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
                onClick={() => currentTargetItem && playTTS(currentTargetItem.question)}
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
                  const showHint = isCurrentTarget && mistakeCount >= 5; // 點錯 5 次才顯示提示
                  
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
            <div className={`flex-1 relative ${currentScene.bgColor} overflow-hidden`}>
              {currentScene.background}

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
                      <span className="mt-1 text-[11px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider">
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
                      </span>
                      {/* Emoji 下方的文字標籤 */}
                      <span className="mt-1 text-[11px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider">
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
                      {currentScene.knowledge}
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
                      {sceneIndex < selectedScenes.length - 1 ? '下一關' : '完成遊戲'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

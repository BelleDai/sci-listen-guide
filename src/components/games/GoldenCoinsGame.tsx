// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Play, ArrowLeft, CheckCircle, Sparkles, Map, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { goldenCoinsGame } from './data/goldenCoins.data';
import GameResultPanel from './GameResultPanel';
import { GAME_SETTINGS, isChallengeSuccessful } from './core/gameSettings';
import { markEpisodeGameCompleted } from './core/gameProgress';
import { toSingleQuestionScenes } from './core/questionQueue';
import type { GameScene } from './core/types';

const GAME_DURATION = GAME_SETTINGS.goldenCoins.secondsPerQuestion; 

type GoldenCoinsGameProps = {
  scenes?: GameScene[];
  episodeId?: string;
  gamesHref?: string;
  reviewHref?: string;
};

export default function App({
  scenes,
  episodeId,
  gamesHref = '/games',
  reviewHref,
}: GoldenCoinsGameProps) {
  const [gameState, setGameState] = useState('MENU'); 
  const [currentScene, setCurrentScene] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [scores, setScores] = useState({}); 
  const [bombCount, setBombCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [totalBombCount, setTotalBombCount] = useState(0);
  const [fallingItems, setFallingItems] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [godPosition, setGodPosition] = useState(50); 
  const [playerX, setPlayerX] = useState(50);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDropping, setIsDropping] = useState(false); // 控制是否開始撒物品
  
  const audioRef = useRef(null);
  const gameLoopRef = useRef(null);
  const playerDirRef = useRef(0); 
  const playerXRef = useRef(50);
  const itemsRef = useRef([]);
  const godPosRef = useRef(50);
  const godDirRef = useRef(1);
  const lastDropTimeRef = useRef(0);
  const fallingItemSessionRef = useRef(`falling-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const fallingItemIdRef = useRef(0);
  const floatingTextSessionRef = useRef(`float-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const floatingTextIdRef = useRef(0);
  const activeQuestionRef = useRef(null);
  const intermissionTimeoutRef = useRef(null); 
  const questionStartTimeoutRef = useRef(null);
  const isDroppingRef = useRef(false);
  const { initAudioContext, startBgm: startBGM, stopBgm: stopBGM } = useGameBgm(goldenCoinsGame.bgmNotes);
  const sourceScenes = scenes ?? goldenCoinsGame.scenes;

  const playTickSound = () => {
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  };

  // ================= [ 語音功能 ] =================
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      if (window.currentUtterance) window.currentUtterance.onend = null;
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const playTTS = useCallback((text, onEndCallback = null) => {
    stopAudio();
    setIsSpeaking(true);
    initAudioContext();

    const finish = () => {
      setIsSpeaking(false);
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
  }, [initAudioContext, stopAudio]);

  const speakInstant = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^[a-zA-Z]+$/.test(text.replace(/[^a-zA-Z]/g, '')) ? 'en-US' : 'zh-TW';
      utterance.rate = 1.3;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ================= [ 遊戲邏輯 ] =================
  const handleStartGameClick = (scene, nextSceneIndex = 0) => {
    initAudioContext(); // 必須在點擊事件中初始化 Web Audio
    setCurrentScene(scene);
    setSceneIndex(nextSceneIndex);
    setQuestionIndex(0);
    setScores({});
    setBombCount(0);
    startQuestion(scene, 0);
  };

  const startNewGame = () => {
    const nextScenes = toSingleQuestionScenes(sourceScenes);
    setSelectedScenes(nextScenes);
    setTotalCorrectCount(0);
    setTotalBombCount(0);
    handleStartGameClick(nextScenes[0], 0);
  };

  const playAgain = () => {
    stopAudio();
    stopBGM();
    cancelAnimationFrame(gameLoopRef.current);
    clearTimeout(questionStartTimeoutRef.current);
    clearTimeout(intermissionTimeoutRef.current);
    startNewGame();
  };

  const advanceOrFinishGame = () => {
    const nextSceneIndex = sceneIndex + 1;
    if (nextSceneIndex < selectedScenes.length) {
      handleStartGameClick(selectedScenes[nextSceneIndex], nextSceneIndex);
    } else {
      goHome();
    }
  };

  const startQuestion = (scene, qIndex) => {
    if (questionStartTimeoutRef.current) {
      clearTimeout(questionStartTimeoutRef.current);
      questionStartTimeoutRef.current = null;
    }

    const qData = scene.items[qIndex];
    activeQuestionRef.current = qData;
    setTimeLeft(GAME_DURATION);
    setFallingItems([]);
    itemsRef.current = [];
    setPlayerX(50);
    playerXRef.current = 50;
    playerDirRef.current = 0;
    
    setGameState('PLAYING');
    setIsDropping(false); 
    
    let hasStartedDropping = false;
    const beginDropping = () => {
      if (hasStartedDropping) return;
      hasStartedDropping = true;
      if (questionStartTimeoutRef.current) {
        clearTimeout(questionStartTimeoutRef.current);
        questionStartTimeoutRef.current = null;
      }
      setIsDropping(true);
      startBGM();
    };

    // TTS is helpful, but gameplay must not depend on browser speech callbacks.
    playTTS(qData.question, beginDropping);
    questionStartTimeoutRef.current = setTimeout(beginDropping, 2500);
  };

  // 同步 ref 給 RAF 使用
  useEffect(() => {
    isDroppingRef.current = isDropping;
    if (isDropping) {
        lastDropTimeRef.current = performance.now(); // 確保不會一開始就掉落一堆
    }
  }, [isDropping]);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') playerDirRef.current = -1;
      if (e.key === 'ArrowRight') playerDirRef.current = 1;
    };
    const handleKeyUp = (e) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' && playerDirRef.current === -1) playerDirRef.current = 0;
      if (e.key === 'ArrowRight' && playerDirRef.current === 1) playerDirRef.current = 0;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // 遊戲主迴圈
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let lastTime = performance.now();
    let tickCount = 0;

    const loop = (time) => {
      const deltaTime = time - lastTime;
      
      if (deltaTime > 20) { 
        lastTime = time;
        tickCount++;

        // 1. 更新玩家位置 (就算還沒開始掉東西也能動)
        if (playerDirRef.current !== 0) {
          let next = playerXRef.current + playerDirRef.current * 2;
          if (next < 5) next = 5;
          if (next > 95) next = 95;
          playerXRef.current = next;
          setPlayerX(next);
        }

        // 2. 更新財神爺位置
        godPosRef.current += godDirRef.current * 0.7;
        if (godPosRef.current > 90) {
          godPosRef.current = 90;
          godDirRef.current = -1;
        } else if (godPosRef.current < 10) {
          godPosRef.current = 10;
          godDirRef.current = 1;
        }
        if (tickCount % 2 === 0) setGodPosition(godPosRef.current);

        let itemsChanged = false;

        // 3. 掉落新物品 (只有 isDropping 為 true 時才撒選項)
        if (isDroppingRef.current && time - lastDropTimeRef.current > 750) { 
          lastDropTimeRef.current = time;
          
          const isCorrect = Math.random() < 0.35; 
          let dropItemData;
          if (isCorrect) {
             dropItemData = activeQuestionRef.current;
          } else {
             const allOptions = [...currentScene.items, ...currentScene.decoys];
             const wrongOptions = allOptions.filter(opt => opt.id !== activeQuestionRef.current.id);
             dropItemData = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          }

          const newItem = {
            uid: `${fallingItemSessionRef.current}-${fallingItemIdRef.current++}`,
            data: dropItemData,
            x: godPosRef.current,
            y: 12, 
            speed: 0.4 + Math.random() * 0.3 
          };
          itemsRef.current.push(newItem);
          itemsChanged = true;
        }

        // 4. 更新掉落物位置與碰撞偵測
        const newItems = [];
        const currentPx = playerXRef.current;
        const hitRadiusX = 10; 
        const hitRadiusY = 8; 
        const playerY = 80;   

        for (let i = 0; i < itemsRef.current.length; i++) {
          const item = itemsRef.current[i];
          item.y += item.speed;

          const isHit = Math.abs(item.x - currentPx) < hitRadiusX && Math.abs(item.y - playerY) < hitRadiusY;

          if (isHit) {
             handleCatch(item, currentPx);
             itemsChanged = true;
          } else if (item.y < 105) {
             newItems.push(item);
          } else {
             itemsChanged = true; 
          }
        }
        itemsRef.current = newItems;

        if (itemsChanged || tickCount % 2 === 0) {
            setFallingItems([...itemsRef.current]);
        }
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, currentScene]); 

  // 倒數計時器獨立 Effect (依賴 isDropping)
  useEffect(() => {
    if (gameState !== 'PLAYING' || !isDropping) return;

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        // 倒數 10 秒內播放滴答聲增加緊張感
        if (prev <= 11 && prev > 1) playTickSound(); 
        
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState, isDropping]); // eslint-disable-line react-hooks/exhaustive-deps

  // 處理接到物品
  const handleCatch = (item, pX) => {
    const isCorrect = item.data.id === activeQuestionRef.current.id;
    
    if (isCorrect) {
      setScores(prev => ({ ...prev, [item.data.id]: (prev[item.data.id] || 0) + 1 }));
      setTotalCorrectCount(prev => prev + 1);
      showFloatingText(`+1 ${item.data.icon}`, pX, 'text-green-500');
      // 成功時唸出選項名稱 (例如：太陽)
      speakInstant(item.data.label);
    } else {
      setBombCount(prev => prev + 1);
      setTotalBombCount(prev => prev + 1);
      showFloatingText(`💥 扣分`, pX, 'text-red-500 animate-shake-wrong');
      // 失敗發出哎呀
      speakInstant("哎呀！");
    }
  };

  const showFloatingText = (text, x, colorClass) => {
    const id = `${floatingTextSessionRef.current}-${floatingTextIdRef.current++}`;
    setFloatingTexts(prev => [...prev, { id, text, x, colorClass }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1000);
  };

  // 時間結束處理 
  const handleTimeUp = () => {
    cancelAnimationFrame(gameLoopRef.current);
    stopBGM();
    setIsDropping(false);
    const currentQ = activeQuestionRef.current;
    
    if (questionIndex < currentScene.items.length - 1) {
      setGameState('INTERMISSION');
      stopAudio(); 
      
      let nextTriggered = false;
      const goToNext = () => {
        if (nextTriggered) return;
        nextTriggered = true;
        setQuestionIndex(prev => {
          startQuestion(currentScene, prev + 1);
          return prev + 1;
        });
      };

      // 唸出原理解釋，唸完自動進下一題
      playTTS(currentQ.audioText, goToNext);
      intermissionTimeoutRef.current = setTimeout(goToNext, 7000); // 保底超時
    } else {
      setGameState('RESULT');
      stopAudio();
      playTTS(currentScene.knowledge);
    }
  };

  const goHome = () => {
    stopAudio();
    stopBGM();
    cancelAnimationFrame(gameLoopRef.current);
    clearTimeout(questionStartTimeoutRef.current);
    clearTimeout(intermissionTimeoutRef.current); 
    setGameState('MENU');
    setCurrentScene(null);
    setSelectedScenes([]);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      stopBGM();
      clearTimeout(questionStartTimeoutRef.current);
      clearTimeout(intermissionTimeoutRef.current);
    };
  }, [stopAudio, stopBGM]);

  // --- 畫面渲染組件 ---
  
  if (gameState === 'MENU') {
    return (
      <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
        <div className="w-full max-w-2xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex flex-col">
          <div className="flex-1 bg-[#fff8eb] flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px]"></div>

            <div className="z-10 text-center mb-10">
                <div className="w-24 h-24 bg-[#d17a49] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white shadow-orange-500/30 relative">
                    <span className="text-5xl">🪙</span>
                    <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-8 h-8 animate-pulse" />
                </div>
                <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-2 tracking-wide">
                    知識接接樂
                </h1>
                <p className="text-[#a36b4a] font-bold">先聽題目，再把正確答案接起來喔！</p>
            </div>

            <div className="w-full z-10 px-1">
              <button
                onClick={startNewGame}
                className="mx-auto flex items-center justify-center gap-3 rounded-full bg-[#d17a49] px-10 py-4 text-2xl font-black text-white shadow-[0_6px_0_#a8572b] transition-all hover:bg-[#c26b3a] active:translate-y-2 active:shadow-none"
              >
                <Play fill="currentColor" /> 開始遊戲
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT') {
    const totalCorrect = Object.values(scores).reduce((a, b) => a + b, 0);
    // 勝利條件由共用設定管理：正確題數與答題準確率都要達標。
    const isWin = isChallengeSuccessful(totalCorrect, bombCount);

    if (sceneIndex >= selectedScenes.length - 1) {
      const finalCorrect = totalCorrectCount;
      const finalWrong = totalBombCount;

      return (
        <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
          <div className="w-full max-w-2xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex items-center justify-center">
            <GameResultPanel
              isWin={isChallengeSuccessful(finalCorrect, finalWrong)}
              correctCount={finalCorrect}
              wrongCount={finalWrong}
              correctLabel="接中正確選項"
              wrongLabel="接到炸彈次數"
              knowledge={currentScene.knowledge}
              gamesHref={gamesHref}
              reviewHref={reviewHref ?? (episodeId ? `/guide/${episodeId}` : undefined)}
              onWin={episodeId ? () => markEpisodeGameCompleted(episodeId) : undefined}
              onPlayAgain={playAgain}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
        <div className="w-full max-w-2xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex items-center justify-center">
            
            {/* 結果彈窗 */}
            <div className="bg-white w-[90%] rounded-[30px] p-6 text-center shadow-xl border border-gray-100 z-10 animate-[bounce-in_0.5s_ease-out]">
                <div className={`w-20 h-20 ${isWin ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'} rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 border-4 border-white shadow-lg`}>
                    {isWin ? <CheckCircle size={40} /> : <XCircle size={40} />}
                </div>
                
                <h3 className="text-2xl font-black text-[#8c5230] mb-1">
                  {isWin ? '挑戰成功！' : '挑戰失敗！'}
                </h3>
                {isWin ? (
                    <p className="text-sm font-bold text-green-600 mb-4">太棒了，你接到的正確答案比較多喔！</p>
                ) : (
                    <p className="text-sm font-bold text-red-500 mb-4">哎呀，炸彈接太多了，再試一次吧！</p>
                )}
                
                <div className="w-16 h-1 bg-orange-200 mx-auto mb-4 rounded-full"></div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`bg-green-50 p-3 rounded-xl border ${totalCorrect > bombCount ? 'border-green-400 border-2' : 'border-green-100'}`}>
                        <p className="text-xs text-green-600 font-bold mb-1">接中正確選項</p>
                        <p className="text-3xl font-black text-green-500">{totalCorrect}</p>
                    </div>
                    <div className={`bg-red-50 p-3 rounded-xl border ${bombCount >= totalCorrect ? 'border-red-400 border-2' : 'border-red-100'}`}>
                        <p className="text-xs text-red-600 font-bold mb-1">接到炸彈次數</p>
                        <p className="text-3xl font-black text-red-500">{bombCount}</p>
                    </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100 relative text-left">
                    <span className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Map size={12} /> 科普總結
                    </span>
                    <div className="mt-2 flex gap-2 items-start">
                        <Volume2 className={`w-5 h-5 text-orange-400 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        <p className="text-gray-700 font-medium leading-relaxed text-[14px]">
                            {currentScene.knowledge}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={goHome} className="hidden">
                        <Home size={18} /> 首頁
                    </button>
                    <button onClick={advanceOrFinishGame} className="flex-1 py-3 bg-[#d17a49] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_0_#a8572b] active:translate-y-1 active:shadow-none transition-all">
                        {sceneIndex < selectedScenes.length - 1 ? '下一題' : '完成遊戲'}
                    </button>
                </div>
            </div>
            
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // PLAYING 或 INTERMISSION
  const activeQuestion = currentScene.items[questionIndex];
  const currentItemScore = scores[activeQuestion.id] || 0;
  const currentQuestionNumber = sceneIndex + 1;
  const totalQuestionCount = selectedScenes.length || 1;

  return (
    <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake-wrong { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } }
        .animate-shake-wrong { animation: shake-wrong 0.3s ease-in-out; }
      `}} />
      
      <div className="w-full max-w-2xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex flex-col">
        
        <div className="bg-[#d17a49] text-white pt-6 pb-4 px-2 rounded-b-[30px] border-b-[6px] border-[#a8572b] shadow-[0_10px_20px_rgba(0,0,0,0.15)] relative z-30">
          <button onClick={goHome} className="hidden">
            <ArrowLeft size={18} />
          </button>
          
          <h2 className="text-center text-sm font-black mb-3 drop-shadow-md opacity-90">
            第 {currentQuestionNumber} / {totalQuestionCount} 題
          </h2>

          <div 
            onClick={() => !isDropping && playTTS(activeQuestion.question, () => { setIsDropping(true); startBGM(); })}
            className="bg-[#a8572b]/60 mx-3 mb-3 p-3 rounded-2xl border border-white/20 shadow-inner flex items-start gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <Volume2 className={`w-5 h-5 text-yellow-300 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <div className="flex-1 text-left">
                <p className="text-yellow-50 text-[15px] font-bold leading-snug">
                  {activeQuestion.question}
                </p>
            </div>
          </div>

          <div className="flex justify-center items-center gap-3 px-3">
             <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex flex-col items-center flex-1 transition-colors ${timeLeft <= 10 && isDropping ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-white/20 border-white/30'}`}>
                <span className="text-white/80 text-xs mb-0.5">時間</span>
                <span className="text-xl tracking-wider">{String(timeLeft).padStart(2, '0')}</span>
             </div>
             <div className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 text-sm font-bold flex flex-col items-center flex-1">
                <span className="text-orange-200 text-xs mb-0.5">收集 {activeQuestion.icon}</span>
                <span className="text-xl tracking-wider text-green-300">{currentItemScore}</span>
             </div>
             <div className="bg-red-500/40 px-3 py-1.5 rounded-xl border border-red-400/50 text-sm font-bold flex flex-col items-center flex-1">
                <span className="text-red-200 text-xs mb-0.5">炸彈</span>
                <span className="text-xl tracking-wider text-red-100">{bombCount}</span>
             </div>
          </div>
        </div>

        <div className={`relative flex-1 w-full overflow-hidden ${currentScene.bgColor ?? 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500'}`}>
          
          <div 
            className="absolute top-2 transition-transform duration-75"
            style={{ left: `${godPosition}%`, transform: 'translateX(-50%)', zIndex: 10 }}
          >
            <div className="text-5xl drop-shadow-lg">🪙</div>
          </div>

          {fallingItems.map((item, index) => (
            <div 
              key={`${item.uid}-${index}`}
              className="absolute flex flex-col items-center justify-center transition-none"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)', zIndex: 5 }}
            >
              <div className="text-5xl drop-shadow-md sm:text-6xl">{item.data.icon}</div>
              <div className="mt-1 max-w-28 rounded-full border border-white/25 bg-black/70 px-2.5 py-1 text-center text-sm font-black leading-tight text-white shadow-lg backdrop-blur-sm sm:max-w-36">
                {item.data.label}
              </div>
            </div>
          ))}

          {floatingTexts.map((ft, index) => (
            <div
              key={`${ft.id}-${index}`}
              className={`absolute font-black text-xl animate-bounce z-20 drop-shadow-md ${ft.colorClass}`}
              style={{ left: `${ft.x}%`, top: `70%`, transform: 'translateX(-50%)' }}
            >
              {ft.text}
            </div>
          ))}

          <div 
            className="absolute bottom-4 transition-transform duration-75 ease-linear"
            style={{ left: `${playerX}%`, transform: 'translateX(-50%)', zIndex: 15 }}
          >
            <div className="text-5xl drop-shadow-xl relative">
              🤠
              <div className="absolute -right-3 bottom-0 text-3xl opacity-90 drop-shadow-lg">🎒</div>
            </div>
          </div>

          {gameState === 'INTERMISSION' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white p-6 text-center">
              <h2 className="text-3xl font-black text-yellow-400 mb-4 drop-shadow-lg animate-pulse">時間到！</h2>
              <div className="flex gap-2 items-start bg-black/40 p-4 rounded-xl border border-white/20">
                <Volume2 className={`w-6 h-6 text-yellow-400 shrink-0 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <p className="text-left font-medium tracking-wide">
                  {activeQuestion.audioText}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#fff8eb] px-4 py-3 pb-4 sm:py-4 sm:pb-6 border-t-[6px] border-[#e2d5c3] relative z-20">
          <div className="flex justify-between gap-3 sm:gap-4">
            <button 
              className="flex-1 min-h-14 bg-white border-b-[4px] sm:border-b-[6px] border-[#d4c6b1] rounded-xl sm:rounded-2xl py-2 sm:py-4 text-2xl sm:text-4xl active:border-b-0 active:translate-y-[4px] sm:active:translate-y-[6px] transition-all touch-manipulation flex justify-center items-center shadow-sm text-gray-700"
              onPointerDown={() => playerDirRef.current = -1}
              onPointerUp={() => playerDirRef.current = 0}
              onPointerLeave={() => playerDirRef.current = 0}
            >
              ⬅️
            </button>
            <button 
              className="flex-1 min-h-14 bg-white border-b-[4px] sm:border-b-[6px] border-[#d4c6b1] rounded-xl sm:rounded-2xl py-2 sm:py-4 text-2xl sm:text-4xl active:border-b-0 active:translate-y-[4px] sm:active:translate-y-[6px] transition-all touch-manipulation flex justify-center items-center shadow-sm text-gray-700"
              onPointerDown={() => playerDirRef.current = 1}
              onPointerUp={() => playerDirRef.current = 0}
              onPointerLeave={() => playerDirRef.current = 0}
            >
              ➡️
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

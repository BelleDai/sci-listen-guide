// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Play, ArrowLeft, CheckCircle, Sparkles, Map, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { goldenCoinsGame } from './data/goldenCoins.data';
import GameResultPanel from './GameResultPanel';
import { GAME_SETTINGS } from './core/gameSettings';
import { markEpisodeGameCompleted } from './core/gameProgress';
import { toSingleQuestionScenes } from './core/questionQueue';
import type { GameScene } from './core/types';

const GAME_DURATION = GAME_SETTINGS.goldenCoins.secondsPerQuestion;

type GoldenCoinsGameProps = {
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
}: GoldenCoinsGameProps) {
  const [gameState, setGameState] = useState('MENU');
  const [currentScene, setCurrentScene] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [scores, setScores] = useState({});
  const scoresRef = useRef({});
  const [bombCount, setBombCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [totalBombCount, setTotalBombCount] = useState(0);
  const [fallingItems, setFallingItems] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [godPosition, setGodPosition] = useState(50);
  const [playerX, setPlayerX] = useState(50);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [failedExplanation, setFailedExplanation] = useState(null);
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
  const speechTokenRef = useRef(0);
  const speechFallbackTimerRef = useRef(null);
  // 錯題回收：單題內炸彈次數
  const wrongCountPerScene = useRef(0);
  // 供 RAF loop 讀取最新的 selectedScenes / sceneIndex
  const selectedScenesRef = useRef([]);
  const sceneIndexRef = useRef(0);
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
    speechTokenRef.current += 1;
    clearTimeout(speechFallbackTimerRef.current);
    
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      if (window.currentUtterance) {
        window.currentUtterance.onend = null;
        window.currentUtterance.onerror = null;
      }
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSubtitle("");
  }, []);

  const playTTS = useCallback((text, onEndCallback = null, showSubtitle = true) => {
    stopAudio();
    if (!text) {
      if (onEndCallback) onEndCallback();
      return;
    }
    
    setIsSpeaking(true);
    if (showSubtitle) setSubtitle(text);
    initAudioContext();
    
    const speechToken = speechTokenRef.current + 1;
    speechTokenRef.current = speechToken;
    let finished = false;

    const finish = () => {
      if (speechTokenRef.current !== speechToken || finished) return;
      finished = true;
      clearTimeout(speechFallbackTimerRef.current);
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
      
      speechFallbackTimerRef.current = window.setTimeout(() => {
        if (speechTokenRef.current !== speechToken || finished) return;
        window.speechSynthesis.cancel();
        finish();
      }, Math.max(4000, text.length * 350));
      
      window.speechSynthesis.speak(utterance);
    } else {
      speechFallbackTimerRef.current = window.setTimeout(finish, 1800);
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
    sceneIndexRef.current = nextSceneIndex;
    setQuestionIndex(0);
    setScores({});
    scoresRef.current = {};
    setBombCount(0);
    wrongCountPerScene.current = 0;
    startQuestion(scene, 0);
  };

  const startNewGame = () => {
    const nextScenes = toSingleQuestionScenes(sourceScenes);
    setSelectedScenes(nextScenes);
    selectedScenesRef.current = nextScenes;
    setTotalCorrectCount(0);
    setTotalBombCount(0);
    setFailedExplanation(null);
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
    playTTS(qData.question, beginDropping, false);
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

  // 當進入 RESULT 狀態時，播放對應的科普總結或失敗提示
  useEffect(() => {
    if (gameState === 'RESULT') {
      stopBGM();
      stopAudio();
      const finalKnowledge = failedExplanation ?? episodeKnowledge ?? currentScene?.knowledge;
      if (finalKnowledge) {
        // 給一點點延遲，確保前一個音效或語音完全停止，並讓畫面先出現
        setTimeout(() => playTTS(finalKnowledge), 300);
      }
    }
  }, [gameState, failedExplanation, episodeKnowledge, currentScene, stopBGM, stopAudio, playTTS]);

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
            // 閃避獎勵：干擾物掉出畫面底部，給予星星特效
            const itemIsCorrect = item.data.id === activeQuestionRef.current?.id;
            if (!itemIsCorrect) {
              showFloatingText('⭐ 閃過！', item.x, 'text-yellow-400 font-black');
            }
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
      const newScore = (scoresRef.current[item.data.id] || 0) + 1;
      scoresRef.current[item.data.id] = newScore;
      setScores({ ...scoresRef.current });
      setTotalCorrectCount(prev => prev + 1);
      showFloatingText(`+1 ${item.data.icon}`, pX, 'text-green-500');
      // 成功時唸出選項名稱
      speakInstant(item.data.label);
      // 提早過關：接到 5 個正確物品立刻進下一題
      if (newScore >= 5) {
        handleTimeUp();
      }
    } else {
      setBombCount(prev => prev + 1);
      setTotalBombCount(prev => prev + 1);
      showFloatingText(`💥 扣分`, pX, 'text-red-500 animate-shake-wrong');
      speakInstant("哎呀！");
      // 錯題挑戰失敗：單題內接到炸彈 >= 5 次
      wrongCountPerScene.current += 1;
      if (wrongCountPerScene.current >= 5) {
        cancelAnimationFrame(gameLoopRef.current);
        setIsDropping(false);
        setFailedExplanation(activeQuestionRef.current?.audioText ?? activeQuestionRef.current?.question);
        setGameState('RESULT');
      }
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
    setIsDropping(false);
    setFallingItems([]);
    itemsRef.current = [];
    const currentQ = activeQuestionRef.current;
    // 換題時重置錯題計數
    wrongCountPerScene.current = 0;

    // 如果還有下一題（場景），進入過場並自動下一題
    if (sceneIndex < selectedScenes.length - 1) {
      setGameState('INTERMISSION');
      stopAudio();

      let nextTriggered = false;
      const goToNext = () => {
        if (nextTriggered) return;
        nextTriggered = true;
        const nextSceneIndex = sceneIndex + 1;
        handleStartGameClick(selectedScenes[nextSceneIndex], nextSceneIndex);
      };

      // 過場時播放 explanation (audioText)，唸完再進下一題
      const explanation = currentQ.audioText ?? currentScene.knowledge ?? currentQ.question;
      playTTS(explanation, goToNext);
      intermissionTimeoutRef.current = setTimeout(goToNext, 8000); // 保底超時
    } else {
      setGameState('RESULT');
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
        <div className="w-full max-w-2xl h-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden relative border-0 sm:border-8 border-neutral-800 flex flex-col">
          <div className="flex-1 bg-[#fff8eb] overflow-y-auto relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <div className="min-h-full flex flex-col items-center justify-center p-4 py-8">
              <div className="z-10 text-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#d17a49] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white shadow-orange-500/30 relative">
                <span className="text-5xl">🪙</span>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-1 tracking-wide">
                知識接接樂
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
                <span>先聽題目，再把正確答案接起來喔！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>✅</span>
                <span>每題接滿 5 個正確答案就提早進入下一題！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>💥</span>
                <span>同一題接錯 5 個就直接挑戰失敗！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>⭐</span>
                <span>3星：24 個金幣｜2星：16 個金幣｜1星：8 個金幣</span>
              </div>
            </div>

            <div className="w-full z-10 px-1 mt-2">
              <button
                onClick={startNewGame}
                className="mx-auto flex items-center justify-center gap-3 rounded-full bg-[#d17a49] px-8 py-3 sm:px-10 sm:py-4 text-xl sm:text-2xl font-black text-white shadow-[0_6px_0_#a8572b] transition-all hover:bg-[#c26b3a] active:translate-y-2 active:shadow-none"
              >
                <Play fill="currentColor" /> 開始遊戲
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT') {
    // If failed, or reached the last scene, show the final result screen
    if (failedExplanation || sceneIndex >= selectedScenes.length - 1) {
      const finalCorrect = totalCorrectCount;
      const finalWrong = totalBombCount;

      let calculatedStars = 0;
      if (!failedExplanation) {
        if (finalCorrect >= 25) calculatedStars = 3;
        else if (finalCorrect >= 15) calculatedStars = 2;
        else if (finalCorrect >= 10) calculatedStars = 1;
        else calculatedStars = 0;
      }

      return (
        <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation">
          <div className="w-full max-w-2xl h-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden relative border-0 sm:border-8 border-neutral-800 flex items-center justify-center">
            <GameResultPanel
              correctCount={finalCorrect}
              wrongCount={finalWrong}
              correctLabel="接中正確選項"
              wrongLabel="接到炸彈次數"
              knowledge={failedExplanation ?? episodeKnowledge ?? currentScene?.knowledge ?? ""}
              gamesHref={gamesHref}
              reviewHref={reviewHref ?? (episodeId ? `/guide/${episodeId}` : undefined)}
              onWin={episodeId ? (s) => markEpisodeGameCompleted(episodeId, s) : undefined}
              onPlayAgain={playAgain}
              stars={calculatedStars}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  // PLAYING 或 INTERMISSION
  const activeQuestion = currentScene.items[questionIndex];
  const currentItemScore = scores[activeQuestion.id] || 0;
  const currentQuestionNumber = sceneIndex + 1;
  const totalQuestionCount = selectedScenes.length || 1;

  return (
    <div className="w-full flex flex-1 items-stretch justify-center font-sans touch-manipulation select-none">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake-wrong { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } }
        .animate-shake-wrong { animation: shake-wrong 0.3s ease-in-out; }
      `}} />

      <div className="w-full max-w-2xl h-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden relative border-0 sm:border-8 border-neutral-800 flex flex-col">

        <div className="bg-[#d17a49] text-white pt-4 sm:pt-6 pb-3 sm:pb-4 px-2 sm:rounded-b-[30px] rounded-b-[20px] border-b-[4px] sm:border-b-[6px] border-[#a8572b] shadow-[0_10px_20px_rgba(0,0,0,0.15)] relative z-30">
          <button onClick={goHome} className="hidden">
            <ArrowLeft size={18} />
          </button>

          <h2 className="text-center text-sm font-black mb-3 drop-shadow-md opacity-90">
            第 {currentQuestionNumber} / {totalQuestionCount} 題
          </h2>

          <div
            onClick={() => !isDropping && playTTS(activeQuestion.question, () => { setIsDropping(true); startBGM(); }, false)}
            className="bg-[#a8572b]/60 mx-3 mb-3 p-3 rounded-2xl border border-white/20 shadow-inner flex items-start gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <Volume2 className={`w-5 h-5 text-yellow-300 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <div className="flex-1 text-left">
              <p className="text-yellow-50 text-[15px] font-bold leading-snug">
                {activeQuestion.question}
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-4 mx-1 sm:mx-2">
            <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border text-sm font-bold flex flex-col items-center flex-1 transition-colors ${timeLeft <= 10 && isDropping ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-white/20 border-white/30'}`}>
              <span className="text-white/80 text-[10px] sm:text-xs mb-0.5">時間</span>
              <span className="text-base sm:text-xl tracking-wider">{String(timeLeft).padStart(2, '0')}</span>
            </div>
            <div className="bg-white/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/30 text-sm font-bold flex flex-col items-center flex-1">
              <span className="text-orange-200 text-[10px] sm:text-xs mb-0.5">收集</span>
              <span className="text-base sm:text-xl tracking-wider text-green-300">{currentItemScore}</span>
            </div>
            <div className="bg-red-500/40 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-red-400/50 text-sm font-bold flex flex-col items-center flex-1">
              <span className="text-red-200 text-[10px] sm:text-xs mb-0.5">炸彈</span>
              <span className="text-base sm:text-xl tracking-wider text-red-100">{bombCount}</span>
            </div>
          </div>
        </div>

        <div className={`relative flex-1 w-full -mt-4 overflow-hidden ${currentScene.bgColor ?? 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500'}`}>

          <div
            className="absolute top-2 transition-transform duration-75"
            style={{ left: `${godPosition}%`, transform: 'translateX(-50%)', zIndex: 10 }}
          >
            <div className="text-5xl drop-shadow-lg">🎅</div>
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
        </div>

        <div className="bg-[#fff8eb] px-4 py-3 pb-4 sm:py-4 sm:pb-6 border-t-[6px] border-[#e2d5c3] relative z-20">
          <div className="flex justify-between gap-3 sm:gap-4">
            <button
              className="flex-1 min-h-8 bg-white border-b-[4px] sm:border-b-[6px] border-[#d4c6b1] rounded-xl sm:rounded-2xl py-2 sm:py-4 text-2xl sm:text-4xl active:border-b-0 active:translate-y-[4px] sm:active:translate-y-[6px] transition-all touch-manipulation flex justify-center items-center shadow-sm text-gray-700"
              onPointerDown={() => playerDirRef.current = -1}
              onPointerUp={() => playerDirRef.current = 0}
              onPointerLeave={() => playerDirRef.current = 0}
            >
              ⬅️
            </button>
            <button
              className="flex-1 min-h-8 bg-white border-b-[4px] sm:border-b-[6px] border-[#d4c6b1] rounded-xl sm:rounded-2xl py-2 sm:py-4 text-2xl sm:text-4xl active:border-b-0 active:translate-y-[4px] sm:active:translate-y-[6px] transition-all touch-manipulation flex justify-center items-center shadow-sm text-gray-700"
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

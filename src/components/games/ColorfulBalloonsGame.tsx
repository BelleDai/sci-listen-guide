// @ts-nocheck
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Home, Play, Volume2, XCircle, Zap } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { colorfulBalloonsGame } from './data/colorfulBalloons.data';
import GameResultPanel from './GameResultPanel';
import { GAME_SETTINGS } from './core/gameSettings';
import { markEpisodeGameCompleted } from './core/gameProgress';
import { summarizeSceneKnowledge, toSingleQuestionScenes } from './core/questionQueue';
import type { GameScene } from './core/types';

const BALLOON_COLORS = [
  'bg-red-400 border-red-500',
  'bg-blue-400 border-blue-500',
  'bg-green-400 border-green-500',
  'bg-yellow-400 border-yellow-500',
  'bg-purple-400 border-purple-500',
  'bg-pink-400 border-pink-500',
];

class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  playSuccess() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playBomb() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playTick(isFast = false) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(isFast ? 800 : 400, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

type ColorfulBalloonsGameProps = {
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
}: ColorfulBalloonsGameProps) {
  const [gameState, setGameState] = useState('start');
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [bombCount, setBombCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SETTINGS.colorfulBalloons.secondsPerQuestion);
  const [balloons, setBalloons] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [failedExplanation, setFailedExplanation] = useState<string | null>(null);

  // Combo & Fever Time
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);

  const audioEngine = useRef(null);
  const gameTimer = useRef(null);
  const balloonSpawner = useRef(null);
  const readyTimer = useRef(null);
  const speechFallbackTimer = useRef(null);
  const speechTokenRef = useRef(0);
  const gameRunRef = useRef(0);
  const balloonIdCounter = useRef(0);
  // 保底計數：每 3 顆確保有一顆正確
  const spawnCounter = useRef(0);
  // 錯題回收：單題內錯誤次數
  const wrongCountPerScene = useRef(0);
  // Fever Timer
  const feverTimer = useRef(null);
  // selectedScenes ref (供 spawn 與 handleClick 操作時讀取最新值)
  const selectedScenesRef = useRef([]);
  const sceneIndexRef = useRef(0);

  // 每次 selectedScenes / sceneIndex 變動，同步 ref
  useEffect(() => { selectedScenesRef.current = selectedScenes; }, [selectedScenes]);
  useEffect(() => { sceneIndexRef.current = sceneIndex; }, [sceneIndex]);

  const currentScene = selectedScenes[sceneIndex];
  const sourceScenes = scenes ?? colorfulBalloonsGame.scenes;
  const { startBgm, stopBgm } = useGameBgm(colorfulBalloonsGame.bgmNotes, 280, 0.035);

  const initAudio = () => {
    if (!audioEngine.current) {
      audioEngine.current = new AudioEngine();
    }
  };

  const stopAudio = () => {
    speechTokenRef.current += 1;
    clearTimeout(speechFallbackTimer.current);
    if ('speechSynthesis' in window) {
      if (window.currentUtterance) window.currentUtterance.onend = null;
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (text, callback) => {
    if (!text) {
      if (callback) callback();
      return;
    }

    if (!('speechSynthesis' in window)) {
      if (callback) callback();
      return;
    }

    const synth = window.speechSynthesis;
    const speechToken = speechTokenRef.current + 1;
    speechTokenRef.current = speechToken;
    clearTimeout(speechFallbackTimer.current);
    synth.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.1;
    utterance.pitch = 1.2;

    let finished = false;
    const finish = () => {
      if (speechTokenRef.current !== speechToken || finished) return;
      finished = true;
      clearTimeout(speechFallbackTimer.current);
      setIsSpeaking(false);
      if (callback) callback();
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

  const startScene = (scene, index, runId = gameRunRef.current) => {
    if (!scene) return;

    stopBgm();
    clearTimeout(readyTimer.current);
    setSceneIndex(index);
    setGameState('reading');
    setBalloons([]);
    setTimeLeft(GAME_SETTINGS.colorfulBalloons.secondsPerQuestion);
    // 重置錯題計數與保底計數
    spawnCounter.current = 0;
    wrongCountPerScene.current = 0;
    // 重置 Combo（每一題重新開始）
    setCombo(0);
    setIsFever(false);
    clearTimeout(feverTimer.current);

    // 延遲一個 tick，確保上一題 ended 狀態的 speakText callback 完整執行完成
    // （避免 startScene 裡的 speakText 中斷前一題的 knowledge 播放）
    const promptText = `${scene.prompt ?? scene.title}`;
    window.setTimeout(() => {
      if (gameRunRef.current !== runId) return;
      speakText(promptText, () => {
        if (gameRunRef.current !== runId) return;
        setGameState('ready');
        readyTimer.current = window.setTimeout(() => {
          if (gameRunRef.current !== runId) return;
          startBgm();
          setGameState('playing');
        }, 1200);
      });
    }, 80);
  };

  const startGame = () => {
    const runId = gameRunRef.current + 1;
    gameRunRef.current = runId;
    initAudio();
    stopBgm();
    const nextScenes = toSingleQuestionScenes(sourceScenes);
    setSelectedScenes(nextScenes);
    selectedScenesRef.current = nextScenes;
    setScore(0);
    setBombCount(0);
    setSceneIndex(0);
    setFailedExplanation(null);
    sceneIndexRef.current = 0;
    startScene(nextScenes[0], 0, runId);
  };

  const goHome = () => {
    gameRunRef.current += 1;
    stopAudio();
    stopBgm();
    clearInterval(gameTimer.current);
    clearInterval(balloonSpawner.current);
    clearTimeout(readyTimer.current);
    clearTimeout(feverTimer.current);
    setGameState('start');
    setSelectedScenes([]);
    setSceneIndex(0);
    setBalloons([]);
    setCombo(0);
    setIsFever(false);
  };

  const playAgain = () => {
    goHome();
    window.setTimeout(startGame, 0);
  };

  const advanceOrFinish = () => {
    const scenes = selectedScenesRef.current;
    const idx = sceneIndexRef.current;
    if (idx < scenes.length - 1) {
      startScene(scenes[idx + 1], idx + 1);
    } else {
      setGameState('gameover');
    }
  };

  // ============================================================
  // 氣球生成邏輯（含保底 + Fever）
  // ============================================================
  useEffect(() => {
    if (gameState !== 'playing' || !currentScene) {
      clearInterval(balloonSpawner.current);
      return;
    }

    const spawnBalloon = () => {
      spawnCounter.current += 1;
      const isGuaranteedCorrect = spawnCounter.current % 3 === 0;

      let isCorrect;
      let selectedOption;

      const correctOptions = currentScene.items.map(item => ({ ...item, isCorrect: true }));
      const decoyOptions = currentScene.decoys.map(item => ({ ...item, isCorrect: false }));

      if (isFever) {
        // Fever 期間只產生正確氣球
        isCorrect = true;
        selectedOption = correctOptions[Math.floor(Math.random() * correctOptions.length)];
      } else if (isGuaranteedCorrect || correctOptions.length > 0 && decoyOptions.length === 0) {
        // 保底第三顆、或只有正確選項時
        isCorrect = true;
        selectedOption = correctOptions[Math.floor(Math.random() * correctOptions.length)];
      } else {
        // 隨機選
        const options = [...correctOptions, ...decoyOptions];
        selectedOption = options[Math.floor(Math.random() * options.length)];
        isCorrect = selectedOption.isCorrect;
      }

      const randomColor = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      // Fever 期間氣球變大、速度加快
      const speedBase = isFever ? 3.0 : 4.5;
      const speedRange = isFever ? 2.5 : 3.5;

      const newBalloon = {
        ...selectedOption,
        uid: balloonIdCounter.current++,
        color: randomColor,
        left: Math.floor(Math.random() * 70) + 15,
        speed: Math.random() * speedRange + speedBase,
        isPopped: false,
        isFeverBalloon: isFever,
      };

      setBalloons(prev => [...prev, newBalloon]);
    };

    spawnBalloon();
    const interval = isFever
      ? Math.round(GAME_SETTINGS.colorfulBalloons.spawnIntervalMs * 0.65)
      : GAME_SETTINGS.colorfulBalloons.spawnIntervalMs;
    balloonSpawner.current = window.setInterval(spawnBalloon, interval);
    return () => clearInterval(balloonSpawner.current);
  }, [gameState, currentScene, isFever]);

  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(gameTimer.current);
      return;
    }

    gameTimer.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        if (audioEngine.current) {
          audioEngine.current.playTick(prev <= 10);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(gameTimer.current);
  }, [gameState]);

  // 時間到 → 先唸 explanation，再唸 knowledge，再進下一題
  useEffect(() => {
    if (timeLeft !== 0 || gameState !== 'playing' || !currentScene) return;

    setGameState('ended');
    stopBgm();
    clearInterval(gameTimer.current);
    clearInterval(balloonSpawner.current);

    const explanation = currentScene.items[0]?.audioText;
    const knowledge = currentScene.knowledge;

    if (explanation && explanation !== knowledge) {
      speakText(explanation, () => speakText(knowledge, advanceOrFinish));
    } else {
      speakText(knowledge, advanceOrFinish);
    }
  }, [timeLeft, gameState, currentScene]);

  // ============================================================
  // 點擊氣球
  // ============================================================
  const handleBalloonClick = (uid, isCorrect, label, audioText, e) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    setBalloons(prev => prev.map(balloon => (
      balloon.uid === uid ? { ...balloon, isPopped: true } : balloon
    )));

    if (isCorrect) {
      if (audioEngine.current) audioEngine.current.playSuccess();
      speakText(label);
      setScore(prev => prev + 1);

      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo >= 2 && !isFever) {
          // 觸發 Fever Time
          setIsFever(true);
          clearTimeout(feverTimer.current);
          feverTimer.current = window.setTimeout(() => {
            setIsFever(false);
          }, 4000);
        }
        return newCombo;
      });
    } else {
      if (audioEngine.current) audioEngine.current.playBomb();
      setBombCount(prev => prev + 1);
      setCombo(0);
      setIsFever(false);
      clearTimeout(feverTimer.current);

      // 錯題：同一題點錯 >= 3 次直接挑戰失敗
      wrongCountPerScene.current += 1;
      if (wrongCountPerScene.current >= 3) {
        wrongCountPerScene.current = 0;
        const curScenes = selectedScenesRef.current;
        const curIdx = sceneIndexRef.current;
        const currentScene = curScenes[curIdx];
        const explanation = currentScene?.items[0]?.audioText ?? currentScene?.knowledge;
        setFailedExplanation(explanation);
        setGameState('gameover');
      }
    }
  };

  useEffect(() => {
    if (balloons.length > 25) {
      setBalloons(prev => prev.slice(prev.length - 15));
    }
  }, [balloons]);

  useEffect(() => {
    return () => {
      stopAudio();
      stopBgm();
      clearTimeout(speechFallbackTimer.current);
      clearInterval(gameTimer.current);
      clearInterval(balloonSpawner.current);
      clearTimeout(readyTimer.current);
      clearTimeout(feverTimer.current);
    };
  }, [stopBgm]);

  useEffect(() => {
    if (gameState === 'gameover') {
      stopBgm();
      const finalKnowledge = episodeKnowledge ?? currentScene?.knowledge;
      if (finalKnowledge) speakText(finalKnowledge);
    }
  }, [gameState, episodeKnowledge, currentScene?.knowledge]);

  return (
    <div className="w-full flex flex-1 flex-col font-sans overflow-hidden cursor-crosshair select-none relative items-center justify-center">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(1); opacity: 1; }
          100% { transform: translateY(-30vh) scale(1); opacity: 1; }
        }
        @keyframes floatUpFever {
          0% { transform: translateY(100vh) scale(1.25); opacity: 1; }
          100% { transform: translateY(-30vh) scale(1.25); opacity: 1; }
        }
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes feverPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
        .animate-float { animation: floatUp linear forwards; }
        .animate-float-fever { animation: floatUpFever linear forwards; }
        .animate-pop { animation: pop 0.25s ease-out forwards; }
        .animate-fever-bg { animation: feverPulse 1s ease-in-out infinite; }
      `}} />

      <div className="w-full max-w-2xl h-full sm:rounded-[40px] bg-white shadow-2xl overflow-hidden relative sm:border-[6px] border-neutral-800 flex flex-col">
        {gameState === 'start' && (
          <div className="flex-1 bg-[#fff8eb] overflow-y-auto relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <div className="min-h-full flex flex-col items-center justify-center p-4 py-8">
              <div className="z-10 text-center mb-4 sm:mb-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#d17a49] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_8px_0_#a8572b] border-4 border-white relative animate-bounce">
                  <span className="text-6xl sm:text-7xl">🎈</span>
                </div>
              <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-1 tracking-wide">
                七彩氣球
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
                <span>🎈</span>
                <span>聆聽語音提示，點擊畫面上正確的氣球。</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>💣</span>
                <span>小心炸彈！點到炸彈會扣分並重置連擊！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>🔥</span>
                <span>連續點對氣球可以進入 Fever Time 分數加倍！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>💡</span>
                <span>同一題點錯 3 次會直接挑戰失敗喔！</span>
              </div>
              <div className="flex items-start gap-2 text-[#6b4731]">
                <span>⭐</span>
                <span>100顆3星，50顆2星，10顆1星。</span>
              </div>
            </div>

            <div className="w-full z-10 px-1 mt-2 flex justify-center">
              <button
                onClick={startGame}
                className="bg-[#d17a49] hover:bg-[#c26b3a] text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full text-xl sm:text-2xl flex items-center gap-3 shadow-[0_6px_0_#a8572b] active:translate-y-2 active:shadow-none transition-all"
              >
                <Play fill="currentColor" /> 開始遊戲
              </button>
            </div>
            </div>
          </div>
        )}

        {gameState !== 'start' && currentScene && (
          <>
            <div className={`text-white pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-4 rounded-b-[20px] sm:rounded-b-[30px] border-b-[4px] sm:border-b-[6px] shadow-md relative z-30 flex flex-col items-center transition-all duration-500 ${isFever ? 'bg-yellow-500 border-yellow-700' : 'bg-[#d17a49] border-[#a8572b]'}`}>
              <button onClick={goHome} className="hidden">
                <Home size={20} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-black opacity-90 drop-shadow-md tracking-wider">
                  第 {sceneIndex + 1} / {selectedScenes.length} 題
                </h2>
                {isFever && (
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
                    <Zap size={12} fill="currentColor" /> FEVER!
                  </span>
                )}
                {combo >= 2 && !isFever && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">
                    🔥 Combo ×{combo}
                  </span>
                )}
              </div>

              <div className="bg-[#a8572b]/60 w-full p-3 rounded-2xl border border-white/20 shadow-inner flex items-start gap-2">
                <Volume2 className={`w-6 h-6 text-yellow-300 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <p className="text-white text-[16px] font-bold leading-snug">
                  {currentScene.prompt}
                </p>
              </div>
            </div>

            <div className={`flex-1 relative -mt-6 overflow-hidden transition-all duration-500 ${isFever ? 'bg-gradient-to-b from-yellow-300 via-orange-200 to-red-100 animate-fever-bg' : 'bg-gradient-to-b from-sky-300 via-blue-200 to-green-100'}`}>
              <div className="absolute top-[10%] left-[10%] text-white/50 text-6xl">☁️</div>
              <div className="absolute top-[25%] right-[15%] text-white/40 text-5xl">☁️</div>

              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                {gameState === 'reading' && (
                  <div className="bg-yellow-300/90 text-yellow-900 border-4 border-yellow-500 px-8 py-4 rounded-full text-2xl font-black shadow-xl animate-pulse backdrop-blur-sm">
                    聽題目中...
                  </div>
                )}

                {gameState === 'ready' && (
                  <div className="flex flex-col items-center justify-center animate-bounce" style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.3))' }}>
                    <div className="flex space-x-1 sm:space-x-2">
                      {['R', 'E', 'A', 'D', 'Y'].map((char, i) => {
                        const colors = ['#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#eab308'];
                        return (
                          <span
                            key={char}
                            className="text-6xl sm:text-7xl font-black inline-block"
                            style={{
                              fontFamily: "'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif",
                              color: colors[i],
                              WebkitTextStroke: '4px white',
                              transform: `rotate(${[-6, 5, -4, 6, -5][i]}deg)`,
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex space-x-2 mt-1">
                      {['G', 'O'].map((char, i) => {
                        const colors = ['#ec4899', '#2ecc71'];
                        return (
                          <span
                            key={char}
                            className="text-7xl sm:text-8xl font-black inline-block"
                            style={{
                              fontFamily: "'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif",
                              color: colors[i],
                              WebkitTextStroke: '5px white',
                              transform: `rotate(${[-5, 7][i]}deg)`,
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {gameState === 'ended' && (
                  <div className="bg-white/95 text-[#8c5230] border-4 border-[#d17a49] px-6 py-5 rounded-3xl shadow-2xl max-w-sm text-center">
                    <div className="text-2xl font-black mb-3">時間到！</div>
                    <div className="flex items-start gap-2 text-left text-[15px] font-bold leading-relaxed text-[#6b4731]">
                      <Volume2 className={`w-5 h-5 shrink-0 text-[#d17a49] mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      <span>{currentScene.items[0]?.audioText ?? currentScene.knowledge}</span>
                    </div>
                  </div>
                )}
              </div>

              {(gameState === 'playing' || gameState === 'ended') && balloons.map(balloon => {
                if (balloon.isPopped) {
                  return (
                    <div key={balloon.uid} className="absolute text-6xl animate-pop pointer-events-none" style={{ left: `${balloon.left}%`, top: '40%' }}>
                      {balloon.isCorrect ? '✅' : '💥'}
                    </div>
                  );
                }

                return (
                  <div
                    key={balloon.uid}
                    onPointerDown={(e) => handleBalloonClick(balloon.uid, balloon.isCorrect, balloon.label, balloon.audioText, e)}
                    className={`absolute flex flex-col items-center cursor-crosshair group ${balloon.isFeverBalloon ? 'animate-float-fever' : 'animate-float'} ${gameState === 'ended' ? 'opacity-30 pointer-events-none' : ''}`}
                    style={{ left: `${balloon.left}%`, animationDuration: `${balloon.speed}s` }}
                  >
                    <div className={`rounded-[50%] ${balloon.color} border-4 relative shadow-inner flex items-center justify-center transition-transform active:scale-90 ${balloon.isFeverBalloon ? 'w-28 h-32' : 'w-24 h-28'}`}>
                      <span className="text-4xl drop-shadow-md">{balloon.icon}</span>
                      <div className={`absolute -bottom-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${balloon.color.replace('bg-', 'border-b-').replace('border-', '').split(' ')[0]} opacity-90`}></div>
                    </div>
                    <div className="w-[2px] h-10 bg-white/70"></div>
                    <div className="bg-white px-3 py-1.5 rounded-xl shadow-md text-sm font-extrabold text-[#6b4731] w-28 text-center border-2 border-gray-200 mt-1">
                      {balloon.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#fff8eb] border-t-4 border-[#e2d5c3] p-4 flex justify-between items-center z-30">
              <div className="bg-white border-2 border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                <Clock className={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#d17a49]'}`} size={24} />
                <span className={`font-black text-2xl font-mono ${timeLeft <= 5 ? 'text-red-500' : 'text-[#8c5230]'}`}>
                  {timeLeft}s
                </span>
              </div>

              <div className="flex gap-3">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="font-black text-2xl text-green-700 font-mono w-8 text-right">{score}</span>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                  <XCircle className="text-red-500" size={24} />
                  <span className="font-black text-2xl text-red-700 font-mono w-8 text-right">{bombCount}</span>
                </div>
              </div>
            </div>
            {gameState === 'gameover' && (() => {
              const calcBalloonStars = (correct: number) => {
                if (failedExplanation) return 0; // Failed challenge directly
                if (correct >= 100) return 3;
                if (correct >= 50) return 2;
                if (correct >= 10) return 1;
                return 0; // 0 stars means fail.
              };

              const stars = calcBalloonStars(score);

              return (
                <GameResultPanel
                  correctCount={score}
                  wrongCount={bombCount}
                  correctLabel="戳中正確氣球"
                  wrongLabel="點到炸彈次數"
                  knowledge={failedExplanation ?? episodeKnowledge ?? currentScene?.knowledge}
                  gamesHref={gamesHref}
                  reviewHref={reviewHref ?? (episodeId ? `/guide/${episodeId}` : undefined)}
                  onWin={episodeId ? (s) => markEpisodeGameCompleted(episodeId, s) : undefined}
                  onPlayAgain={playAgain}
                  stars={stars}
                />
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

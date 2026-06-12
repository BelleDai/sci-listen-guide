// @ts-nocheck
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Home, Play, Star, Volume2, XCircle } from 'lucide-react';
import { useGameBgm } from './useGameBgm';
import { colorfulBalloonsGame } from './data/colorfulBalloons.data';

const BALLOON_COLORS = [
  'bg-red-400 border-red-500',
  'bg-blue-400 border-blue-500',
  'bg-green-400 border-green-500',
  'bg-yellow-400 border-yellow-500',
  'bg-purple-400 border-purple-500',
  'bg-pink-400 border-pink-500',
];

const ROUND_SECONDS = 30;

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

export default function App() {
  const [gameState, setGameState] = useState('start');
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [bombCount, setBombCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [balloons, setBalloons] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioEngine = useRef(null);
  const gameTimer = useRef(null);
  const balloonSpawner = useRef(null);
  const readyTimer = useRef(null);
  const balloonIdCounter = useRef(0);
  const currentScene = selectedScenes[sceneIndex];
  const { startBgm, stopBgm } = useGameBgm(colorfulBalloonsGame.bgmNotes, 280, 0.035);

  const initAudio = () => {
    if (!audioEngine.current) {
      audioEngine.current = new AudioEngine();
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
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
    synth.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.1;
    utterance.pitch = 1.2;

    const fallbackId = window.setTimeout(() => {
      synth.cancel();
      setIsSpeaking(false);
      if (callback) callback();
    }, Math.max(2500, text.length * 180));

    const finish = () => {
      clearTimeout(fallbackId);
      setIsSpeaking(false);
      if (callback) callback();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
  };

  const startScene = (scene, index) => {
    if (!scene) return;

    clearTimeout(readyTimer.current);
    setSceneIndex(index);
    setGameState('reading');
    setBalloons([]);
    setTimeLeft(ROUND_SECONDS);

    const audioText = `${scene.audioText ?? scene.title} 注意囉！這裡有好幾個正確答案，請把對的氣球戳破！`;
    speakText(audioText, () => {
      setGameState('ready');
      readyTimer.current = window.setTimeout(() => {
        setGameState('playing');
      }, 1200);
    });
  };

  const startGame = () => {
    initAudio();
    startBgm();
    const nextScenes = colorfulBalloonsGame.pickScenes(2);
    setSelectedScenes(nextScenes);
    setScore(0);
    setBombCount(0);
    setSceneIndex(0);
    startScene(nextScenes[0], 0);
  };

  const goHome = () => {
    stopAudio();
    stopBgm();
    clearInterval(gameTimer.current);
    clearInterval(balloonSpawner.current);
    clearTimeout(readyTimer.current);
    setGameState('start');
    setSelectedScenes([]);
    setSceneIndex(0);
    setBalloons([]);
  };

  const advanceOrFinish = () => {
    if (sceneIndex < selectedScenes.length - 1) {
      startBgm();
      startScene(selectedScenes[sceneIndex + 1], sceneIndex + 1);
    } else {
      setGameState('gameover');
    }
  };

  useEffect(() => {
    if (gameState !== 'playing' || !currentScene) {
      clearInterval(balloonSpawner.current);
      return;
    }

    const spawnBalloon = () => {
      const options = [
        ...currentScene.items.map(item => ({ ...item, isCorrect: true })),
        ...currentScene.decoys.map(item => ({ ...item, isCorrect: false })),
      ];
      const randomOption = options[Math.floor(Math.random() * options.length)];
      const randomColor = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

      const newBalloon = {
        ...randomOption,
        uid: balloonIdCounter.current++,
        color: randomColor,
        left: Math.floor(Math.random() * 70) + 15,
        speed: Math.random() * 3.5 + 4.5,
        isPopped: false,
      };

      setBalloons(prev => [...prev, newBalloon]);
    };

    spawnBalloon();
    balloonSpawner.current = window.setInterval(spawnBalloon, 1000);
    return () => clearInterval(balloonSpawner.current);
  }, [gameState, currentScene]);

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

  useEffect(() => {
    if (timeLeft !== 0 || gameState !== 'playing' || !currentScene) return;

    setGameState('ended');
    stopBgm();
    clearInterval(gameTimer.current);
    clearInterval(balloonSpawner.current);
    speakText(currentScene.knowledge, advanceOrFinish);
  }, [timeLeft, gameState, currentScene]);

  const handleBalloonClick = (uid, isCorrect, label, e) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    setBalloons(prev => prev.map(balloon => (
      balloon.uid === uid ? { ...balloon, isPopped: true } : balloon
    )));

    if (isCorrect) {
      if (audioEngine.current) audioEngine.current.playSuccess();
      speakText(label);
      setScore(prev => prev + 1);
    } else {
      if (audioEngine.current) audioEngine.current.playBomb();
      setBombCount(prev => prev + 1);
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
      clearInterval(gameTimer.current);
      clearInterval(balloonSpawner.current);
      clearTimeout(readyTimer.current);
    };
  }, [stopBgm]);

  return (
    <div className="w-full flex flex-1 flex-col font-sans overflow-hidden cursor-crosshair select-none relative items-center justify-center">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(1); opacity: 1; }
          100% { transform: translateY(-30vh) scale(1); opacity: 1; }
        }
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
        .animate-float { animation: floatUp linear forwards; }
        .animate-pop { animation: pop 0.25s ease-out forwards; }
      `}} />

      <div className="w-full max-w-2xl h-full sm:rounded-[40px] bg-white shadow-2xl overflow-hidden relative border-[6px] border-neutral-800 flex flex-col">
        {gameState === 'start' && (
          <div className="flex-1 bg-[#fff8eb] flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:20px_20px]"></div>

            <div className="z-10 text-center mb-10">
              <div className="w-28 h-28 bg-[#d17a49] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_0_#a8572b] border-4 border-white relative animate-bounce">
                <span className="text-7xl">🎈</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#8c5230] drop-shadow-sm mb-3 tracking-wide">
                七彩氣球戳戳樂
              </h1>
              <p className="text-[#a36b4a] font-bold text-lg bg-white/50 px-4 py-2 rounded-full inline-block">
                聽題目，把正確答案戳破！
              </p>
            </div>

            <button
              onClick={startGame}
              className="z-10 bg-[#d17a49] hover:bg-[#c26b3a] text-white font-bold py-4 px-10 rounded-full text-2xl flex items-center gap-3 shadow-[0_6px_0_#a8572b] active:translate-y-2 active:shadow-none transition-all"
            >
              <Play fill="currentColor" /> 開始遊戲
            </button>
          </div>
        )}

        {gameState !== 'start' && currentScene && (
          <>
            <div className="bg-[#d17a49] text-white pt-6 pb-4 px-4 rounded-b-[30px] border-b-[6px] border-[#a8572b] shadow-md relative z-30 flex flex-col items-center">
              <button onClick={goHome} className="hidden">
                <Home size={20} />
              </button>

              <h2 className="text-sm font-black mb-2 opacity-90 drop-shadow-md tracking-wider">
                第 {sceneIndex + 1} / {selectedScenes.length} 關
              </h2>

              <div className="bg-[#a8572b]/60 w-full p-3 rounded-2xl border border-white/20 shadow-inner flex items-start gap-2">
                <Volume2 className={`w-6 h-6 text-yellow-300 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <p className="text-white text-[16px] font-bold leading-snug">
                  {currentScene.audioText}
                </p>
              </div>
            </div>

            <div className="flex-1 relative -mt-6 bg-gradient-to-b from-sky-300 via-blue-200 to-green-100 overflow-hidden">
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
                      <span>{currentScene.knowledge}</span>
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
                    onPointerDown={(e) => handleBalloonClick(balloon.uid, balloon.isCorrect, balloon.label, e)}
                    className={`absolute flex flex-col items-center animate-float cursor-crosshair group ${gameState === 'ended' ? 'opacity-30 pointer-events-none' : ''}`}
                    style={{ left: `${balloon.left}%`, animationDuration: `${balloon.speed}s` }}
                  >
                    <div className={`w-24 h-28 rounded-[50%] ${balloon.color} border-4 relative shadow-inner flex items-center justify-center transition-transform active:scale-90`}>
                      <span className="text-4xl drop-shadow-md">{balloon.icon}</span>
                      <div className={`absolute -bottom-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${balloon.color.replace('bg-', 'border-b-').replace('border-', '').split(' ')[0]} opacity-90`}></div>
                    </div>
                    <div className="w-[2px] h-10 bg-white/70"></div>
                    <div className="bg-white px-3 py-1.5 rounded-xl shadow-md text-[17px] font-extrabold text-[#6b4731] w-28 text-center border-2 border-gray-200 mt-1">
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

            {gameState === 'gameover' && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white w-full rounded-[30px] p-6 text-center shadow-2xl animate-[bounce-in_0.5s_ease-out]">
                  <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 border-4 border-white shadow-lg">
                    <Star size={40} fill="currentColor" />
                  </div>

                  <h3 className="text-2xl font-black text-[#8c5230] mb-2">闖關完成！</h3>
                  <div className="w-16 h-1 bg-orange-200 mx-auto mb-6 rounded-full"></div>

                  <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-lg font-bold text-blue-800">
                      <span>答對氣球</span>
                      <span className="text-2xl">{score} 個</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-red-600">
                      <span>錯誤氣球</span>
                      <span className="text-2xl">{bombCount} 個</span>
                    </div>
                  </div>

                  <button onClick={goHome} className="flex-1 w-full py-3 bg-[#d17a49] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_0_#a8572b] active:translate-y-1 active:shadow-none transition-all">
                    完成遊戲
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

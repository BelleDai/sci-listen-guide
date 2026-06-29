"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { BookOpen, Brain, Lightbulb, Users, CircleStar, Sparkles, Award, LogIn } from "lucide-react";
import SectionShell from "@/components/episode/SectionShell";
import NextButton from "@/components/episode/NextButton";
import GlossaryCard from "@/components/episode/GlossaryCard";
import AnswerReveal from "@/components/episode/AnswerReveal";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import SpeakLine from "@/components/episode/SpeakLine";
import PlayerLaunch from "@/components/episode/PlayerLaunch";
import SpeedDial from "@/components/episode/SpeedDial";
import { useTTS } from "@/hooks/useTTS";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { GAME_METADATA } from "@/components/games/core/gameMetadata";
import { getEpisodeGameId } from "@/components/games/core/episodeQuizzes";
import { trackEpisodeStep, trackEpisodeCompleted, trackEpisodeLanded } from "@/lib/analytics";

const TOTAL = 4;

const EMPTY_AUDIO: AudioQuestion = {
  topic: "",
  description: "",
  reference_answer: "",
};

const EMPTY_FAMILY: FamilyDiscussion = {
  topic: "",
  description: "",
  reference_answer: "",
};

const fireConfetti = async () => {
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#ff7473", "#ffc952", "#47b8e0", "#ffffff"];
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors });
};

const playCheerSound = () => {
  if (typeof window === "undefined") return;

  const audioWindow = window as Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.75, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.05);
  master.connect(ctx.destination);

  for (let i = 0; i < 12; i++) {
    const duration = 0.4 + i * 0.025;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let j = 0; j < channel.length; j++) {
      const fade = 1 - j / channel.length;
      channel[j] = (Math.random() * 2 - 1) * fade;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(520 + i * 115, now);
    filter.Q.setValueAtTime(1.2, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05 + i * 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95 + i * 0.055);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.playbackRate.setValueAtTime(0.8 + i * 0.055, now);
    source.start(now + i * 0.045);
  }

  for (let i = 0; i < 10; i++) {
    const clapTime = now + 0.12 + i * 0.13;
    const duration = 0.055;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let j = 0; j < channel.length; j++) {
      const envelope = Math.exp(-j / (ctx.sampleRate * 0.012));
      channel[j] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1300 + Math.random() * 900, clapTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, clapTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.08);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(clapTime);
  }

  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + 0.04 + 0.11 * i;
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.2);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.42);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 2300);
};

export interface GlossaryItem {
  term: string;
  explanation?: string;
  definition?: string; // some files use 'definition' instead of 'explanation'
}

export interface AudioQuestion {
  topic: string;
  description: string;
  reference_answer: string;
}

export interface KeyTakeaway {
  emoji: string;
  content: string;
}

export interface FamilyDiscussion {
  topic: string;
  description: string;
  reference_answer: string;
}

export interface EpisodeData {
  id: string;
  status: string;
  Title: string;
  Cover: string;
  AudioQuestion: AudioQuestion[];
  KeyTakeaway: KeyTakeaway[];
  FamilyDiscussion: FamilyDiscussion[];
  Spotify?: string;
  ApplePodcast?: string;
  Glossary: GlossaryItem[];
  Tags: string[];
  [key: string]: unknown;
}

interface EpisodeViewProps {
  episodeData: EpisodeData;
  searchIndex?: { id: string; title: string }[];
}

const EpisodeView = ({ episodeData, searchIndex = [] }: EpisodeViewProps) => {
  const [step, setStep] = useState(1);
  const [celebrated, setCelebrated] = useState(false);
  const [isFamilyAnswerOpened, setIsFamilyAnswerOpened] = useState(false);
  const [isAudioAnswerOpened, setIsAudioAnswerOpened] = useState(false);
  const [isPodcastSource, setIsPodcastSource] = useState<boolean | null>(null);
  const [familyIndex, setFamilyIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { speakingId, speak, stop } = useTTS();
  const { user, loading: authLoading, completions } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const isGameDone = !!episodeData.id && (episodeData.id in completions);
  const gameStars = isGameDone ? completions[episodeData.id] : 0;

  const sectionOneRef = useRef<HTMLElement>(null);
  const sectionTwoRef = useRef<HTMLElement>(null);
  const sectionThreeRef = useRef<HTMLElement>(null);
  const sectionFourRef = useRef<HTMLElement>(null);

  const playerLaunchRef = useRef<HTMLDivElement>(null);
  const [isPlayerLaunchVisible, setIsPlayerLaunchVisible] = useState(true);
  const pendingTimersRef = useRef<number[]>([]);
  const speakingIdRef = useRef(speakingId);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerLaunchVisible(entry.isIntersecting);
      },
      { rootMargin: "0px" }
    );
    if (playerLaunchRef.current) {
      observer.observe(playerLaunchRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scheduleTimer = useCallback((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((id) => id !== timerId);
      callback();
    }, delay);
    pendingTimersRef.current.push(timerId);
  }, []);

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingTimersRef.current = [];
    };
  }, []);

  const getSectionRef = useCallback((n: number) => {
    switch (n) {
      case 1:
        return sectionOneRef;
      case 2:
        return sectionTwoRef;
      case 3:
        return sectionThreeRef;
      case 4:
        return sectionFourRef;
      default:
        return sectionOneRef;
    }
  }, []);

  const jumpTo = useCallback((n: number) => {
    getSectionRef(n).current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [getSectionRef]);

  useEffect(() => {
    speakingIdRef.current = speakingId;
  }, [speakingId]);

  // 用 hash 簡單攔截 back 鍵來停止 TTS
  useEffect(() => {
    if (speakingId) {
      if (window.location.hash !== "#speaking") {
        window.history.pushState(null, "", window.location.pathname + window.location.search + "#speaking");
      }
    } else {
      if (window.location.hash === "#speaking") {
        window.history.back();
      }
    }
  }, [speakingId]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== "#speaking" && speakingIdRef.current) {
        stop();
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [stop]);

  useEffect(() => {
    document.title = `${episodeData.Title} ｜ 科學好好聽`;
    return () => stop();
  }, [stop, episodeData.Title]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") ?? undefined;
    const isPodcast = source === "podcast";

    pendingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingTimersRef.current = [];
    stop();

    const timerId = window.setTimeout(() => {
      setMounted(true);
      setIsPodcastSource(isPodcast);
      setStep(isPodcast ? 1 : 2);
      setCelebrated(false);
      setIsAudioAnswerOpened(false);
      setIsFamilyAnswerOpened(false);
      setFamilyIndex(0);
      setIsPlayerLaunchVisible(true);

      trackEpisodeLanded(episodeData.id ?? "", episodeData.Title, source);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [episodeData.id, episodeData.Title, stop]);

  // 追蹤連續連各階段進入
  useEffect(() => {
    if (step > 1) {
      trackEpisodeStep(step, episodeData.id ?? "", episodeData.Title);
    }
  }, [step, episodeData.id, episodeData.Title]);

  const onCelebrate = useCallback(() => {
    if (celebrated) return;

    stop();
    playCheerSound();
    setCelebrated(true);
    void fireConfetti();
    trackEpisodeCompleted(episodeData.id ?? "", episodeData.Title);
    scheduleTimer(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
  }, [celebrated, episodeData.id, episodeData.Title, scheduleTimer, stop]);

  const glossaryItems = useMemo(
    () => (Array.isArray(episodeData.Glossary) ? episodeData.Glossary.filter(Boolean) : []),
    [episodeData.Glossary],
  );
  const keyTakeaways = useMemo(
    () => (Array.isArray(episodeData.KeyTakeaway) ? episodeData.KeyTakeaway.filter(Boolean) : []),
    [episodeData.KeyTakeaway],
  );
  const audio = useMemo(
    () => episodeData.AudioQuestion?.[0] ?? EMPTY_AUDIO,
    [episodeData.AudioQuestion],
  );
  // FamilyDiscussion is an array — pick a random one each visit
  const familyList = useMemo(
    () => (
      Array.isArray(episodeData.FamilyDiscussion)
        ? episodeData.FamilyDiscussion.filter(Boolean)
        : episodeData.FamilyDiscussion
          ? [episodeData.FamilyDiscussion]
          : []
    ),
    [episodeData.FamilyDiscussion],
  );
  useEffect(() => {
    // Select a random family discussion index after mounting to prevent SSR hydration mismatches
    if (familyList.length > 1) {
      const timerId = window.setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * familyList.length);
        setFamilyIndex(randomIndex);
      }, 0);
      return () => window.clearTimeout(timerId);
    }
  }, [episodeData.id, familyList.length]);

  const family = useMemo(
    () => familyList[familyIndex] || familyList[0] || EMPTY_FAMILY,
    [familyIndex, familyList],
  );

  const goNext = useCallback((next: number) => {
    setStep((s) => Math.max(s, next));
    scheduleTimer(() => {
      getSectionRef(next).current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    // if (next === 3 && audio.description) {
    //   scheduleTimer(() => speak(audio.description, "audio-q"), 450);
    // }

    // if (next === 4 && family.description) {
    //   scheduleTimer(() => speak(family.description, "fam-q"), 450);
    // }
  }, [audio.description, family.description, getSectionRef, scheduleTimer, speak]);

  return (
    <>
      <Header step={step} total={TOTAL} onJump={jumpTo} episodes={searchIndex} />
      <main className="text-foreground">
        {/* Section 1 - Hero */}
        <SectionShell id="s1" show ref={sectionOneRef}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start text-center md:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full md:w-[40%] flex-shrink-0"
            >
              <div className="relative aspect-square max-h-[40vh] md:max-h-none rounded-3xl overflow-hidden shadow-[var(--shadow-card)] border-4 border-secondary/40">
                <Image
                  src={episodeData.Cover}
                  alt={`${episodeData.Title} 封面`}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>

            <div className="w-full md:w-[60%] flex flex-col justify-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-white leading-snug mb-6 text-stroke-dark"
              >
                <div className="block text-secondary text-sm mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 font-bold">
                    <CircleStar className="w-4 h-4 md:w-5 md:h-5" />
                    {isGameDone ? "挑戰成功" : "今日科普探險"}
                  </span>
                </div>
                {episodeData.Title}
              </motion.h1>

              <div ref={playerLaunchRef}>
                <PlayerLaunch className="flex flex-row items-center justify-center md:justify-start gap-3 flex-wrap" applePodcast={episodeData.ApplePodcast} spotify={episodeData.Spotify} />
              </div>

              {!isGameDone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 inline-flex items-start gap-2.5 rounded-xl bg-accent/15 border border-accent/30 px-4 py-3 text-sm sm:text-base font-bold text-accent"
                >
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left leading-relaxed">
                    小提醒：加油喔！努力滑到頁面的最後，有好玩的挑戰遊戲喔！
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="text-left mt-12 md:mt-16">
            <h3 className="flex items-center gap-2 text-xl font-bold text-accent mb-3">
              <BookOpen className="w-6 h-6" />
              聽故事時有不懂的詞嗎？
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {glossaryItems.map((g) => (
                <GlossaryCard key={g.term} term={g.term} explanation={g.explanation ?? g.definition ?? ""} episodeId={episodeData.id} />
              ))}
            </div>
          </div>

          {isPodcastSource !== false && (
            <div className="mt-8 flex justify-center">
              <NextButton className="flex" label="探索下一步！" onClick={() => goNext(2)} done={step >= 2} />
            </div>
          )}
        </SectionShell>

        {/* Section 2 - Key Takeaways */}
        <SectionShell
          id="s2"
          show={step >= 2}
          ref={sectionTwoRef}
          title={isPodcastSource === false ? "聽完故事，孩子將得到的知識" : "這集最重要的三件事，你記住了嗎？"}
          emoji={isPodcastSource === false ? "🚀" : "💡"}
        >
          <div className="space-y-6">
            {keyTakeaways.map((k, i) => {
              const id = `take-${i}`;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 sm:p-7 flex gap-5 sm:gap-6 items-start"
                  style={{
                    boxShadow: `0 6px 0 -2px hsl(var(--primary) / 0.4), var(--shadow-card)`,
                  }}
                >
                  <div className="text-4xl sm:text-5xl flex-shrink-0">{k.emoji}</div>
                  <div className="pt-1 flex-1">
                    <div className="text-xs font-bold text-accent mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> 重點 {i + 1}
                    </div>
                    <SpeakLine
                      id={id}
                      text={k.content}
                      className="rounded-xl p-3 -ml-3 hover:bg-accent/10"
                      episodeId={episodeData.id}
                      contentType="takeaway"
                    >
                      <p className="leading-relaxed text-base sm:text-lg text-white">{k.content}</p>
                    </SpeakLine>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <NextButton className="flex" label="我學會了，下一步" onClick={() => goNext(3)} done={step >= 3} />
          </div>
        </SectionShell>

        {/* Section 3 - Brain Challenge */}
        <SectionShell
          id="s3"
          show={step >= 3}
          ref={sectionThreeRef}
          title="聽完故事，換你動動腦！"
          emoji="🧠"
        >
          <SpeakLine
            id="audio-q"
            text={`${audio.description}`}
            className="glass-card rounded-3xl p-5 sm:p-7 mb-8 hover:border-accent/50"
            episodeId={episodeData.id}
            contentType="audio_question_desc"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-sm">
                <Brain className="w-4 h-4" />
                {audio.topic}
              </span>
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{audio.description}</p>
          </SpeakLine>

          <AnswerReveal
            idPrefix="audio-ans"
            text={audio.reference_answer}
            episodeId={episodeData.id}
            contentType="audio_question_ans"
            onFirstReveal={() => setIsAudioAnswerOpened(true)}
          />

          {isAudioAnswerOpened && (
            <NextButton label="我學會了，下一步" onClick={() => goNext(4)} done={step >= 4} />
          )}
        </SectionShell>

        {/* Section 4 - Game Call to Action (Replaces Family Discussion) */}
        <SectionShell
          id="s4"
          show={step >= 4}
          ref={sectionFourRef}
          title="測實力，贏徽章！"
          emoji="🎖️"
        >
          {(() => {
            const gameId = getEpisodeGameId(episodeData.id);
            const gameMeta = GAME_METADATA[gameId];

            return (
              <div
                className="relative px-6 py-10 text-center sm:px-8 rounded-3xl overflow-hidden border-[1px] text-white"
                style={{
                  backgroundColor: "#34314c",
                  borderColor: "rgb(255, 201, 82, 0.5)",
                  boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 40px #ffc95240`,
                }}
              >
                <Sparkles className="absolute right-8 top-10 h-6 w-6 text-[#ff7473]" />
                <Sparkles className="absolute bottom-28 left-8 h-5 w-5 text-[#97e5ff]" />

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-xl"
                  style={{
                    ...gameMeta.cardStyle,
                    border: isGameDone ? `2px solid #ffc952` : gameMeta.cardStyle.border,
                    boxShadow: isGameDone
                      ? `0 0 22px #ffc95280, 0 0 38px #ffc95230`
                      : gameMeta.cardStyle.boxShadow,
                  }}
                >
                  <span className="relative drop-shadow-sm">{gameMeta.emoji}</span>
                  {isGameDone && (
                    <span
                      className="absolute -right-2 -top-2 flex h-8 items-center justify-center rounded-full text-white px-2.5 py-0.5"
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <span className="text-sm tracking-tighter">{'⭐'.repeat(gameStars)}</span>
                    </span>
                  )}
                </motion.div>
                <h3 className="mb-3 text-2xl font-black leading-snug sm:text-3xl" style={{ color: "#ffc952" }}>
                  {gameMeta.label}
                </h3>
                <p className="mb-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-base font-bold text-white/80">
                  <span className="text-justify">{isGameDone ? "這集已經挑戰成功囉！" : episodeData.Title}</span>
                </p>
                {user ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`/games/${episodeData.id}`}
                      onClick={() => trackEpisodeStep(5, episodeData.id ?? "", episodeData.Title)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-7 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition sm:text-lg"
                    >
                      <Sparkles className="h-5 w-5" />
                      {isGameDone ? "再玩一次" : "開始挑戰"}
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cyan-200/30 bg-cyan-200/10 p-4 text-left">
                      <p className="text-lg font-black text-cyan-50">
                        玩遊戲前請先登入
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                        登入後，我們會幫你保存徽章和星星，下次回來也看得到。
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => {
                        trackEpisodeStep(5, episodeData.id ?? "", episodeData.Title);
                        setAuthDialogOpen(true);
                      }}
                      disabled={authLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-7 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition disabled:cursor-wait disabled:opacity-70 sm:text-lg"
                    >
                      <LogIn className="h-5 w-5" />
                      登入
                    </motion.button>
                  </div>
                )}
              </div>
            );
          })()}
        </SectionShell>

        {/* Section 4 - Family Discussion (Hidden per user request)
        <SectionShell
          id="s4-legacy"
          show={false}
          ref={sectionFourRef}
          title="最後，跟爸媽一起討論吧！"
          emoji="👨‍👩‍👧"
        >
          <SpeakLine
            id="fam-q"
            text={`${family.description}`}
            className="glass-card rounded-3xl p-5 sm:p-7 mb-8 border-secondary/40 hover:border-accent/50"
            episodeId={episodeData.id}
            contentType="family_discussion_desc"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-sm">
                <Users className="w-4 h-4" />
                {family.topic}
              </span>
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{family.description}</p>
          </SpeakLine>

          <AnswerReveal
            idPrefix="fam-ans"
            text={family.reference_answer}
            episodeId={episodeData.id}
            contentType="family_discussion_ans"
            onFirstReveal={() => setIsFamilyAnswerOpened(true)}
          />

          <div className="mt-10 min-h-[80px] flex justify-center">
            <AnimatePresence mode="wait">
              {!celebrated && isFamilyAnswerOpened && (
                <motion.button
                  key="cta"
                  onClick={onCelebrate}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-secondary bg-[image:var(--gradient-primary)]"
                >
                  <Sparkles className="w-5 h-5" />
                  我是小小探險家，達成任務!
                </motion.button>
              )}
              {celebrated && (
                <motion.div
                  key="celebrate"
                  initial={{ opacity: 0, y: 30, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="w-full rounded-3xl px-6 py-10 text-center shadow-[0_0_40px_rgba(255,201,82,0.25)] border-[1px]"
                    style={{ backgroundColor: "#34314c", borderColor: "rgb(255, 201, 82, 0.5)" }}
                  >
                  <div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-xl relative"
                    style={{ backgroundColor: "#ffc952" }}
                  >
                    <Award className="w-12 h-12" style={{ color: "#34314c" }} strokeWidth={2.5} />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#ff7473]" />
                    <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-[#97e5ff]" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: "#ffc952" }}>
                    🎉 恭喜你完成探險！
                  </h3>
                  <p className="text-base sm:text-lg font-bold mb-8 text-white">
                    你已經是一位小小科學家了！繼續保持好奇心吧！
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const headerSearchBtn = document.querySelector('header button[aria-label="展開搜尋"]');
                      if (headerSearchBtn) {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setTimeout(() => (headerSearchBtn as HTMLButtonElement).click(), 150);
                      } else {
                        window.location.href = "/";
                      }
                    }}
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-secondary bg-[image:var(--gradient-primary)]"
                  >
                    <Sparkles className="w-5 h-5" />
                    探索其他主題
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SectionShell>
        */}

        {step >= 4 && <Footer />}
      </main>
      <SpeedDial show={mounted && !isPlayerLaunchVisible} applePodcast={episodeData.ApplePodcast} spotify={episodeData.Spotify} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default EpisodeView;

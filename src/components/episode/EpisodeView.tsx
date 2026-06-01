"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import { BookOpen, Brain, Lightbulb, Users, CircleStar, Sparkles, Award } from "lucide-react";
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
import { trackEpisodeStep, trackEpisodeCompleted, trackEpisodeLanded } from "@/lib/analytics";

const TOTAL = 4;

const fireConfetti = () => {
  const colors = ["#ff7473", "#ffc952", "#47b8e0", "#ffffff"];
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors });
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
  const [mounted, setMounted] = useState(false);
  const { speakingId, stop } = useTTS();

  const refs = [
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
  ];

  const playerLaunchRef = useRef<HTMLDivElement>(null);
  const [isPlayerLaunchVisible, setIsPlayerLaunchVisible] = useState(true);

  useEffect(() => {
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

  const goNext = (next: number) => {
    setStep((s) => Math.max(s, next));
    setTimeout(() => {
      refs[next - 1].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const jumpTo = (n: number) => {
    refs[n - 1].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const speakingIdRef = useRef(speakingId);
  speakingIdRef.current = speakingId;

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
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") ?? undefined;
    const isPodcast = source === "podcast";
    setIsPodcastSource(isPodcast);

    trackEpisodeLanded(episodeData.id ?? "", episodeData.Title, source);

    if (!isPodcast) {
      setStep((s) => Math.max(s, 2));
    }
  }, [episodeData.id, episodeData.Title]);

  // 追蹤連續連各階段進入
  useEffect(() => {
    if (step > 1) {
      trackEpisodeStep(step, episodeData.id ?? "", episodeData.Title);
    }
  }, [step, episodeData.id, episodeData.Title]);

  const onCelebrate = () => {
    setCelebrated(true);
    fireConfetti();
    trackEpisodeCompleted(episodeData.id ?? "", episodeData.Title);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
  };

  const audio = episodeData.AudioQuestion[0];
  // FamilyDiscussion is an array — pick a random one each visit
  const familyList = Array.isArray(episodeData.FamilyDiscussion)
    ? episodeData.FamilyDiscussion
    : [episodeData.FamilyDiscussion];
  const [familyIndex, setFamilyIndex] = useState(0);

  useEffect(() => {
    // Select a random family discussion index after mounting to prevent SSR hydration mismatches
    if (familyList.length > 1) {
      const randomIndex = Math.floor(Math.random() * familyList.length);
      setFamilyIndex(randomIndex);
    }
  }, [familyList.length]);

  const family = familyList[familyIndex] || familyList[0];

  return (
    <>
      <Header step={step} total={TOTAL} onJump={jumpTo} episodes={searchIndex} />
      <main className="text-foreground">
        {/* Section 1 - Hero */}
        <SectionShell id="s1" show ref={refs[0]}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start text-center md:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full md:w-[40%] flex-shrink-0"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-card)] border-4 border-secondary/40">
                <img
                  src={episodeData.Cover}
                  alt={`${episodeData.Title} 封面`}
                  className="w-full h-auto max-h-[40vh] md:max-h-none aspect-square object-cover"
                  loading="eager"
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
                    今日科普探險
                  </span>
                </div>
                {episodeData.Title}
              </motion.h1>

              <div ref={playerLaunchRef}>
                <PlayerLaunch className="flex flex-row items-center justify-center md:justify-start gap-3 flex-wrap" applePodcast={episodeData.ApplePodcast} spotify={episodeData.Spotify} />
              </div>
            </div>
          </div>

          <div className="text-left mt-12 md:mt-16">
            <h3 className="flex items-center gap-2 text-xl font-bold text-accent mb-3">
              <BookOpen className="w-6 h-6" />
              聽故事時有不懂的詞嗎？
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {episodeData.Glossary.map((g) => (
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
          ref={refs[1]}
          title={isPodcastSource === false ? "聽完故事，孩子將得到的知識" : "這集最重要的三件事，你記住了嗎？"}
          emoji={isPodcastSource === false ? "🚀" : "💡"}
        >
          {/* <p className="text-white/80 text-sm sm:text-base font-medium mb-6 text-center">
            {isPodcastSource === false
              ? "想知道這些知識背後的神奇故事嗎？點擊上方播放鍵，跟著科學隊長出發吧！"
              : "複習完重點，下方還有好玩的動動腦挑戰等著你喔！"}
          </p> */}
          <div className="space-y-6">
            {episodeData.KeyTakeaway.map((k, i) => {
              const id = `take-${i}`;
              const active = speakingId === id;
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
          ref={refs[2]}
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

        {/* Section 4 - Family Discussion */}
        <SectionShell
          id="s4"
          show={step >= 4}
          ref={refs[3]}
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
                  style={{ backgroundColor: "#34314c", borderColor: "#ffc952" }}
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

        {step >= 4 && <Footer />}
      </main>
      <SpeedDial show={mounted && !isPlayerLaunchVisible} applePodcast={episodeData.ApplePodcast} spotify={episodeData.Spotify} />
    </>
  );
};

export default EpisodeView;

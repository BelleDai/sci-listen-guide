import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import { BookOpen, Brain, Lightbulb, Users, Volume2, Sparkles, Award } from "lucide-react";
import { episodeData } from "@/data/episode";
import SectionShell from "@/components/episode/SectionShell";
import NextButton from "@/components/episode/NextButton";
import GlossaryCard from "@/components/episode/GlossaryCard";
import Collapsible from "@/components/episode/Collapsible";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import SpeakingIndicator from "@/components/episode/SpeakingIndicator";
import AnswerList from "@/components/episode/AnswerList";
import SpeakLine from "@/components/episode/SpeakLine";
import PlayerLaunch from "@/components/episode/PlayerLaunch";
import { useTTS } from "@/hooks/useTTS";

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

const Index = () => {
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const { speakingId, stop } = useTTS();

  const refs = [
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
  ];

  const goNext = (next: number) => {
    setStep((s) => Math.max(s, next));
    setTimeout(() => {
      refs[next - 1].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const jumpTo = (n: number) => {
    refs[n - 1].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    document.title = `${episodeData.Title} ｜ 科學好好聽`;
    return () => stop();
  }, [stop]);

  const onCelebrate = () => {
    setCelebrated(true);
    fireConfetti();
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
  };

  const audio = episodeData.AudioQuestion[0];
  const family = episodeData.FamilyDiscussion;

  return (
    <>
      <Header step={step} total={TOTAL} onJump={jumpTo} />
      <main className="text-foreground">
        {/* Section 1 - Hero */}
        <SectionShell id="s1" show ref={refs[0]}>
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-black text-white leading-snug mb-6 text-stroke-dark"
            >
              <span className="block text-secondary text-base sm:text-lg mb-2">🎧 今日科普探險</span>
              {episodeData.Title}
            </motion.h1>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-card)] border-4 border-secondary/40 mb-6"
            >
              <img
                src={episodeData.Cover}
                alt={`${episodeData.Title} 封面`}
                className="w-full aspect-square object-cover"
                loading="eager"
              />
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "暫停" : "播放"}
                className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] hover:scale-110 transition-transform"
              >
                {playing ? (
                  <Pause className="w-10 h-10 text-white" fill="currentColor" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                )}
              </button>
            </motion.div>

            <div className="text-left mt-10">
              <h3 className="flex items-center gap-2 text-xl font-extrabold text-accent mb-2">
                <BookOpen className="w-6 h-6" />
                聽故事時有不懂的詞嗎？
              </h3>
              <p className="text-white/90 text-sm sm:text-base mb-4 rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-accent flex-shrink-0" />
                想聽哪裡點哪裡！只要看到小喇叭 🔊，就唸給你聽喔！
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {episodeData.Glossary.map((g) => (
                  <GlossaryCard key={g.term} term={g.term} explanation={g.explanation} />
                ))}
              </div>
            </div>

            <NextButton label="探索下一步！" onClick={() => goNext(2)} done={step >= 2} />
          </div>
        </SectionShell>

        {/* Section 2 - Brain Challenge */}
        <SectionShell
          id="s2"
          show={step >= 2}
          ref={refs[1]}
          title="聽完故事，換你動動腦！"
          emoji="🧠"
        >
          <SpeakLine
            id="audio-q"
            text={`${audio.topic}。${audio.description}`}
            className="glass-card rounded-3xl p-5 sm:p-7 mb-5 hover:border-accent/50"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-sm">
                <Brain className="w-4 h-4" />
                {audio.topic}
              </span>
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{audio.description}</p>
          </SpeakLine>

          <Collapsible label="聽聽科學隊長怎麼說">
            <AnswerList idPrefix="audio-ans" text={audio.reference_answer} />
          </Collapsible>

          <NextButton label="我學會了！" onClick={() => goNext(3)} done={step >= 3} />
        </SectionShell>

        {/* Section 3 - Key Takeaways */}
        <SectionShell
          id="s3"
          show={step >= 3}
          ref={refs[2]}
          title="這集最重要的三件事，你記住了嗎？"
          emoji="💡"
        >
          <div className="space-y-4">
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
                  className="glass-card rounded-2xl p-5 flex gap-4 items-start"
                  style={{
                    boxShadow: `0 6px 0 -2px hsl(var(--primary) / 0.4), var(--shadow-card)`,
                  }}
                >
                  <div className="text-4xl sm:text-5xl flex-shrink-0">{k.emoji}</div>
                  <div className="pt-1 flex-1">
                    <div className="text-xs font-bold text-accent mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> 重點 {i + 1}
                      <SpeakingIndicator active={active} />
                    </div>
                    <SpeakLine
                      id={id}
                      text={k.content}
                      className="rounded-xl p-3 -ml-3 hover:bg-accent/10"
                    >
                      <p className="leading-relaxed text-base sm:text-lg text-white">{k.content}</p>
                    </SpeakLine>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <NextButton label="探索下一步！" onClick={() => goNext(4)} done={step >= 4} />
        </SectionShell>

        {/* Section 4 - Family Discussion */}
        <SectionShell
          id="s4"
          show={step >= 4}
          ref={refs[3]}
          title="最後，跟爸爸媽媽一起動動腦吧！"
          emoji="👨‍👩‍👧"
        >
          <SpeakLine
            id="fam-q"
            text={`${family.topic}。${family.description}`}
            className="glass-card rounded-3xl p-5 sm:p-7 mb-5 border-secondary/40 hover:border-accent/50"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-sm">
                <Users className="w-4 h-4" />
                親子討論：{family.topic}
              </span>
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{family.description}</p>
          </SpeakLine>

          <Collapsible label="聽聽科學隊長怎麼說">
            <AnswerList idPrefix="fam-ans" text={family.reference_answer} />
          </Collapsible>

          <div className="flex justify-center mt-10">
            <motion.button
              onClick={onCelebrate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={celebrated}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-extrabold text-base sm:text-lg text-primary-foreground shadow-[var(--shadow-glow)] bg-[image:var(--gradient-primary)] disabled:opacity-90"
            >
              <Sparkles className="w-5 h-5" />
              我是小小科學家，任務達成！
            </motion.button>
          </div>

          <AnimatePresence>
            {celebrated && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="mt-8 rounded-3xl px-6 py-8 text-center text-white bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
                  className="text-5xl mb-2"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-black mb-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  恭喜你完成今天的科普探險！
                </h3>
                <p className="text-white/90">你已經是一位小小科學家了！</p>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionShell>

        {step >= 4 && <Footer />}
      </main>
    </>
  );
};

export default Index;

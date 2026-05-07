import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Play, Pause, BookOpen, Brain, Lightbulb, Users, Volume2, Sparkles } from "lucide-react";
import { episodeData } from "@/data/episode";
import SectionShell from "@/components/episode/SectionShell";
import NextButton from "@/components/episode/NextButton";
import GlossaryCard from "@/components/episode/GlossaryCard";
import Collapsible from "@/components/episode/Collapsible";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import SpeakingIndicator from "@/components/episode/SpeakingIndicator";
import AnswerList from "@/components/episode/AnswerList";
import EndingCeremony from "@/components/episode/EndingCeremony";
import { useTTS } from "@/hooks/useTTS";

const TOTAL = 4;

const Index = () => {
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const { speak, stop, speakingId } = useTTS();

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
              <p className="text-muted-foreground text-sm mb-4 flex items-center gap-1">
                點一下卡片，會自動唸給你聽 <Volume2 className="w-4 h-4" /> 👇
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
          <button
            onClick={() => speak(`${audio.topic}。${audio.description}`, "audio-q")}
            className="text-left w-full glass-card rounded-3xl p-5 sm:p-7 mb-5 hover:border-primary transition-colors"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-sm mb-3">
              <Brain className="w-4 h-4" />
              {audio.topic}
              <SpeakingIndicator active={speakingId === "audio-q"} />
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{audio.description}</p>
          </button>

          <Collapsible
            label="看看博士怎麼說"
            speakingActive={speakingId === "audio-ans"}
            onStop={stop}
            onToggle={(o) => {
              if (o) speak(audio.reference_answer, "audio-ans");
              else stop();
            }}
          >
            <div className="markdown-body text-white/95">
              <ReactMarkdown>{audio.reference_answer}</ReactMarkdown>
            </div>
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
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileTap={{ scale: 0.98 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => speak(k.content, id)}
                  className="text-left w-full glass-card rounded-2xl p-5 flex gap-4 items-start hover:border-secondary transition-colors"
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
                    <p className="leading-relaxed text-base sm:text-lg text-white">{k.content}</p>
                  </div>
                </motion.button>
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
          <button
            onClick={() => speak(`${family.topic}。${family.description}`, "fam-q")}
            className="text-left w-full glass-card rounded-3xl p-5 sm:p-7 mb-5 border-secondary/40 hover:border-primary transition-colors"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-sm mb-3">
              <Users className="w-4 h-4" />
              親子討論：{family.topic}
              <SpeakingIndicator active={speakingId === "fam-q"} />
            </div>
            <p className="leading-relaxed text-base sm:text-lg text-white">{family.description}</p>
          </button>

          <Collapsible
            label="親子洞見參考"
            speakingActive={speakingId === "fam-ans"}
            onStop={stop}
            onToggle={(o) => {
              if (o) speak(family.reference_answer, "fam-ans");
              else stop();
            }}
          >
            <div className="markdown-body text-white/95">
              <ReactMarkdown>{family.reference_answer}</ReactMarkdown>
            </div>
          </Collapsible>

          <div className="text-center mt-12 pb-8">
            <div className="text-5xl mb-3">🦅✨</div>
            <p className="text-secondary font-extrabold text-lg">恭喜你完成今天的科普探險！</p>
            <p className="text-muted-foreground text-sm mt-1">明天再一起認識新的動物吧！</p>
          </div>
        </SectionShell>
      </main>
    </>
  );
};

export default Index;

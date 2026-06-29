"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import SpeakLine from "@/components/episode/SpeakLine";
import { useTTS, stripMarkdown } from "@/hooks/useTTS";
import { trackAnswerOpened, trackTTSPlay } from "@/lib/analytics";

// ── 💡 Brand color palette from tailwind.config.ts (HSL mapped) ──────────────────
const SLICE_COLORS = [
  "hsl(var(--secondary))", // warm yellow
  "hsl(var(--primary))",   // coral pink
  "hsl(var(--accent))",    // sky blue
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--accent) / 0.8)",
];

// ── 📐 Geometry helpers ──────────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r},0,${large},1,${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

// ── 📝 Markdown Parser: splits preamble (常駐) and lists ────────────────────────
function parse(md: string): { preamble: string; items: string[] } {
  if (!md) return { preamble: "", items: [] };
  const lines = md.split("\n");
  const pre: string[] = [];
  const items: string[] = [];
  let hitList = false;

  for (const l of lines) {
    const trimmed = l.trim();
    // Match bullet points or numbered lists (e.g. "1. 我想用...", "- item", "1、item")
    const m = trimmed.match(/^(?:[-*]|\d+[\.\、])\s+(.+)$/);
    if (m) {
      hitList = true;
      items.push(m[1].trim());
    } else {
      if (!hitList) {
        pre.push(l);
      }
    }
  }

  return { preamble: pre.join("\n").trim(), items };
}

interface Props {
  idPrefix: string;
  text: string;
  episodeId?: string;
  contentType?: string;
  onFirstReveal?: () => void;
}

export default function AnswerReveal({ idPrefix, text, episodeId, contentType, onFirstReveal }: Props) {
  const { preamble, items } = parse(text);
  const n = items.length;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [usedSet, setUsedSet] = useState<Set<number>>(new Set());

  const { speak, stop, speakingId } = useTTS();

  const firstFired = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allDone = usedSet.size === n;
  const segAngle = 360 / n;

  // Spin target logic (Fisher-Yates non-repeating)
  const spin = useCallback(() => {
    if (spinning || allDone || n === 0) return;

    // 🔊 Stop active speech synthesis if currently speaking
    if (speakingId) {
      stop();
    }

    // 🎡 Track the wheel spin in Google Analytics!
    const cleanedSection = contentType?.replace("_ans", "") || "unknown";
    trackAnswerOpened(cleanedSection, episodeId || "", true);

    // Filter to find remaining unselected sectors
    const unused = Array.from({ length: n }, (_, i) => i).filter(i => !usedSet.has(i));
    const target = unused[Math.floor(Math.random() * unused.length)];

    // Target angle needs to align slice center with 12 o'clock (0° / 360°)
    const segCentre = (target + 0.5) * segAngle;
    const baseTarget = (360 - (segCentre % 360)) % 360;

    const currentMod = ((rotation % 360) + 360) % 360;
    const diff = ((baseTarget - currentMod) + 360) % 360;

    // Spin at least 5 full rotations (1800°) for a high-tension feel!
    const finalRotation = rotation + 1800 + (diff === 0 ? 360 : diff);

    setSpinning(true);
    setRotation(finalRotation);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRevealed(target);
      setUsedSet(prev => new Set([...prev, target]));
      setSpinning(false);

      // 🗣️ Automatically speak the revealed answer aloud!
      // const revealId = `${idPrefix}-reveal-${target}`;
      // speak(items[target], revealId);

      // 🎡 Track the automatic TTS play in Google Analytics!
      // trackTTSPlay(contentType || "answer", episodeId || "");

      if (!firstFired.current) {
        firstFired.current = true;
        onFirstReveal?.();
      }
    }, 3500); // 3.5s matches CSS ease-out deceleration curve
  }, [spinning, allDone, n, rotation, usedSet, segAngle, onFirstReveal, speak, stop, speakingId, items, idPrefix, contentType, episodeId]);

  const reset = useCallback(() => {
    setUsedSet(new Set());
    setRevealed(null);
    firstFired.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 🔔 Trigger first reveal callback automatically on mount if there is no wheel to spin (items is empty)
  useEffect(() => {
    if (n === 0) {
      onFirstReveal?.();
      // 🎡 Track direct reveal (without spin) on mount!
      const cleanedSection = contentType?.replace("_ans", "") || "unknown";
      trackAnswerOpened(cleanedSection, episodeId || "", false);
    }
  }, [n, onFirstReveal, contentType, episodeId]);

  // If there are no list items to spin for, display ONLY the preamble answer card directly
  if (n === 0) {
    if (!preamble) return null;
    const cleanPreamble = stripMarkdown(preamble).trim();
    const speakId = `${idPrefix}-preamble`;
    return (
      <div className="mt-4">
        <SpeakLine
          id={speakId}
          text={cleanPreamble}
          className="rounded-2xl border border-secondary/30 bg-card/70 p-5 sm:p-6 text-white text-base sm:text-lg leading-relaxed hover:border-secondary/50 hover:bg-card/85 transition-all shadow-[var(--shadow-card)]"
          episodeId={episodeId}
          contentType={contentType}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="leading-relaxed mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-secondary font-black">{children}</strong>,
            }}
          >
            {preamble}
          </ReactMarkdown>
        </SpeakLine>
      </div>
    );
  }

  // SVG dimensions
  const CX = 150, CY = 150;
  const R = 120;   // sector radius
  const RIM = 140; // gold rim outer radius
  const HUB = 32;  // central hub radius

  return (
    <div className="space-y-6 mt-4">
      {/* ── CSS Keyframe animations (Self-contained, wiggling peg, blinking gold rim bulbs & hub cursor scaling) ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pointer-wiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-10deg); }
          40% { transform: rotate(8deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(5deg); }
        }
        .pointer-active {
          animation: pointer-wiggle 0.16s ease-in-out infinite;
          transform-origin: 150px 118px;
        }
        @keyframes light-blinking {
          0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 1px rgba(255,255,255,0.2)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 4px hsl(var(--secondary))); }
        }
        .light-active {
          animation: light-blinking 0.25s linear infinite;
        }
        .center-hub-btn {
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
        }
        .center-hub-btn:hover {
          transform: scale(1.08);
          transform-origin: 150px 150px;
          filter: brightness(1.2);
        }
        .center-hub-btn:active {
          transform: scale(0.94);
          transform-origin: 150px 150px;
        }
      `}} />

      {/* ── RWD Layout Container: Side-by-Side on Desktop, Stacked on Mobile ── */}
      <div className="flex flex-col md:flex-row md:items-stretch md:gap-8 justify-center items-center">

        {/* Left Panel: The Wheel */}
        <div className="flex flex-col items-center flex-shrink-0 md:justify-center p-2">
          {/* SVG Container wrapper with responsive sizes */}
          <div className="relative flex justify-center items-center w-[230px] h-[230px] sm:w-[280px] sm:h-[280px] md:w-[300px] md:h-[300px] transition-all duration-300">
            <div className="absolute inset-0 rounded-full shadow-[0_0_35px_rgba(255,116,115,0.15)] pointer-events-none" />

            <svg
              width="100%"
              height="100%"
              viewBox="0 0 300 300"
              className="select-none"
              style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}
            >
              {/* 1. ROTATING WHEEL GROUP */}
              <g
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "150px 150px",
                  transition: spinning ? "transform 3.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
                  cursor: spinning || allDone ? "default" : "pointer",
                }}
                onClick={spin}
              >
                {/* Outer gold-yellow rim plate */}
                <circle cx={CX} cy={CY} r={RIM + 1} fill="hsl(var(--secondary) / 0.3)" />
                <circle cx={CX} cy={CY} r={RIM} fill="#ffc952" />
                <circle cx={CX} cy={CY} r={RIM - 4} fill="#e8a000" />
                <circle cx={CX} cy={CY} r={RIM - 6} fill="#ffc952" />

                {/* Sectors / Slices */}
                {items.map((_, i) => {
                  const start = i * segAngle;
                  const end = (i + 1) * segAngle;
                  const used = usedSet.has(i);
                  const color = SLICE_COLORS[i % SLICE_COLORS.length];
                  return (
                    <g key={i}>
                      {/* Pie wedge */}
                      <path
                        d={slicePath(CX, CY, R, start, end)}
                        fill={used ? "rgba(52, 49, 76, 0.65)" : color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity={used ? 0.4 : 0.95}
                      />

                      {/* Radial rotated segment number label */}
                      {(() => {
                        const angle = start + segAngle / 2;
                        return (
                          <g transform={`rotate(${angle} 150 150)`}>
                            <text
                              x="150"
                              y={150 - R * 0.65}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={n <= 4 ? 24 : n <= 6 ? 20 : 16}
                              fontWeight="900"
                              fill={used ? "rgba(255, 255, 255, 0.35)" : "#1a1830"}
                              style={{ fontFamily: "inherit" }}
                            >
                              {used ? "✓" : `${i + 1}`}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* Metal spokes dividing slices */}
                {items.map((_, i) => {
                  const p = polar(CX, CY, R, i * segAngle);
                  return (
                    <line
                      key={i}
                      x1={CX}
                      y1={CY}
                      x2={p.x}
                      y2={p.y}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      opacity={0.8}
                    />
                  );
                })}

                {/* Outer rim gold/white blinking lights */}
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i * 360) / 16;
                  const p = polar(CX, CY, RIM - 10, angle);
                  const isWhite = i % 2 === 0;

                  // Add active blink class if spinning
                  const activeClass = spinning ? (isWhite ? "light-active" : "animate-pulse") : "";

                  return (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={isWhite ? 5.5 : 3.5}
                      fill={isWhite ? "#ffffff" : "#ff7473"}
                      className={activeClass}
                      style={{
                        transition: "opacity 0.2s ease",
                        animationDelay: isWhite ? `${i * 0.05}s` : `${i * 0.08}s`,
                      }}
                    />
                  );
                })}
              </g>

              {/* 2. FIXED HUB & 3D POINTER (Centred controls to Spin / Reset) */}
              <g
                className="center-hub-btn"
                onClick={(e) => {
                  e.stopPropagation(); // prevent double triggers from svg clicks
                  if (spinning) return;
                  if (allDone) {
                    reset();
                  } else {
                    spin();
                  }
                }}
              >
                {/* Pointer Needle (pointing UP towards 12 o'clock, wiggles on spin) */}
                <g className={spinning ? "pointer-active" : ""}>
                  {/* 3D bevel left side */}
                  <polygon
                    points="150,52 137,80 150,118"
                    fill="hsl(var(--primary))"
                  />
                  {/* 3D bevel right side */}
                  <polygon
                    points="150,52 163,80 150,118"
                    fill="#ff9797"
                  />
                </g>

                {/* Central hub (Orange plate with decorative outer dot circle) */}
                <circle cx={CX} cy={CY} r={HUB} fill="hsl(var(--primary))" />
                <circle cx={CX} cy={CY} r={HUB - 3} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3,3" opacity={0.8} />
                <circle cx={CX} cy={CY} r={HUB - 10} fill="#ff9797" />
                <circle cx={CX} cy={CY} r={HUB - 18} fill="#ff4444" />

                {/* SPIN/RESET Wording in Hub */}
                <text
                  x="150"
                  y="151"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={allDone ? "10px" : "11px"}
                  fontWeight="900"
                  fill="#ffffff"
                  className="select-none font-black pointer-events-none"
                  style={{ fontFamily: "inherit", letterSpacing: "-0.5px" }}
                >
                  {spinning ? "⏳" : "GO"}
                </text>
              </g>
            </svg>
          </div>

          {/* Dynamic progress pips */}
          {n > 1 && (
            <div className="flex items-center gap-2 mt-4 select-none">
              {items.map((_, i) => (
                <span
                  key={i}
                  className="block w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    background: usedSet.has(i) ? "hsl(var(--secondary))" : "hsl(0 0% 100% / 0.18)",
                    transform: usedSet.has(i) ? "scale(1.1)" : "scale(1)",
                    boxShadow: usedSet.has(i) ? "0 0 8px hsl(var(--secondary) / 0.6)" : "none",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Revealed Answer Card (takes remaining screen space in desktop) */}
        <div className="w-full md:flex-1 flex flex-col justify-center min-h-[140px] pt-4 md:pt-0">
          <AnimatePresence mode="wait">
            {revealed === null ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center shadow-inner flex flex-col justify-center items-center h-full"
              >
                <p className="text-secondary/90 text-base sm:text-lg font-bold mb-2">
                  👉 點選大轉盤中心「GO!」解鎖答案！
                </p>
                <p className="text-white/85 text-xs sm:text-sm">
                  轉動幸運轉盤，隨機抽出一道參考回答與孩子討論吧！
                </p>
              </motion.div>
            ) : (
              revealed !== null && (
                <motion.div
                  key={`reveal-${revealed}`}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className="rounded-2xl p-3 leading-relaxed overflow-hidden flex flex-col justify-center h-full"
                >
                  <div className="flex items-center gap-2 mb-3 select-none">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-black text-[#1a1830] shadow-sm"
                      style={{ background: SLICE_COLORS[revealed % SLICE_COLORS.length] }}
                    >
                      {revealed + 1}
                    </span>
                    <span
                      className="text-base font-black tracking-wider"
                      style={{ color: SLICE_COLORS[revealed % SLICE_COLORS.length] }}
                    >
                      答案揭曉！
                    </span>
                  </div>

                  <div className="text-white">
                    <SpeakLine
                      id={`${idPrefix}-reveal-${revealed}`}
                      text={stripMarkdown(items[revealed]).trim()}
                      className="rounded-xl px-4 py-3 bg-white/5 border border-white/5 text-base sm:text-lg hover:bg-white/10 transition-colors"
                      episodeId={episodeId}
                      contentType={contentType}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="leading-relaxed mb-0">{children}</p>,
                          strong: ({ children }) => (
                            <strong style={{ color: SLICE_COLORS[revealed % SLICE_COLORS.length] }} className="font-extrabold">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {items[revealed]}
                      </ReactMarkdown>
                    </SpeakLine>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

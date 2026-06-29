"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  GAME_COMPLETIONS_UPDATED_EVENT,
  getCompletedRecords,
  type GameCompletionRecords,
  type GameCompletionsUpdatedEvent,
} from './core/gameProgress';
import { getEpisodeGameId, type StageCategory, type StageEpisode } from './core/episodeQuizzes';
import { GAME_METADATA } from './core/gameMetadata';

type EpisodeGamesListProps = {
  categories: StageCategory[];
};

type SelectedEpisode = StageEpisode & {
  categoryName: string;
};

const COLORS = {
  bg: '#0f0d1a',
  card: '#34314c',
  coral: '#ff7473',
  yellow: '#ffc952',
  blue: '#97e5ff',
  green: '#4ade80',
};

const CATEGORY_EMOJIS = ['🔬', '⛰️', '🌦️', '🚀', '🛰️', '🧬'];

export default function EpisodeGamesList({ categories }: EpisodeGamesListProps) {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    progressLoading,
    completions,
    signOutUser,
  } = useAuth();
  const [completionRecords, setCompletionRecords] = useState<GameCompletionRecords>({});
  const [selected, setSelected] = useState<SelectedEpisode | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setCompletionRecords(getCompletedRecords());

    const syncLocalCompletions = (event: Event) => {
      const updatedEvent = event as GameCompletionsUpdatedEvent;
      setCompletionRecords(updatedEvent.detail ?? getCompletedRecords());
    };

    window.addEventListener(GAME_COMPLETIONS_UPDATED_EVENT, syncLocalCompletions);

    return () => {
      window.removeEventListener(GAME_COMPLETIONS_UPDATED_EVENT, syncLocalCompletions);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setCompletionRecords(completions);
    } else if (!authLoading) {
      setCompletionRecords(getCompletedRecords());
    }
  }, [authLoading, completions, user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } catch (error) {
      console.warn('Unable to sign out.', error);
    } finally {
      setSigningOut(false);
    }
  };

  const completedIds = useMemo(() => Object.keys(completionRecords), [completionRecords]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const stats = useMemo(() => {
    let completed = 0;
    let total = 0;
    const perCategory = categories.map((category) => {
      const categoryCompleted = category.episode.filter((episode) => completedSet.has(episode.id)).length;
      completed += categoryCompleted;
      total += category.episode.length;
      return { completed: categoryCompleted, total: category.episode.length };
    });

    return { completed, total, perCategory };
  }, [categories, completedSet]);

  return (
    <main className="relative min-h-svh overflow-hidden pt-[72px] text-white" style={{ background: COLORS.bg }}>
      <header className="fixed top-0 z-50 w-full backdrop-blur-md bg-card/70 border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3 relative">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="回遊戲基地"
            className="flex min-w-0 flex-shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <img
              src="https://files.soundon.fm/1758618850575-3b62b9ae-8417-4916-a6dc-b25e0b872fba.jpeg"
              alt="科學好好聽"
              className="h-9 w-9 rounded-md object-cover"
            />
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-base font-extrabold leading-none text-white">
                科學好好聽
              </span>
              <span className="hidden text-base font-extrabold leading-none text-accent sm:inline">
                遊戲基地
              </span>
            </span>
          </button>

          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-3 py-2 text-sm font-black text-yellow-100 sm:px-4">
                <span aria-hidden="true">🏅</span>
                <span>徽章 {stats.completed} / {stats.total}</span>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                aria-label="登出"
                title="登出"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthDialogOpen(true)}
              disabled={authLoading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-cyan-200/40 bg-cyan-200/15 px-3 py-2 text-xs font-black text-cyan-50 shadow-[0_0_18px_rgba(151,229,255,0.18)] transition hover:bg-cyan-200/25 disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>登入</span>
            </button>
          )}
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-24 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute right-[12%] top-56 h-32 w-32 rounded-full bg-yellow-300/10 blur-2xl" />
        <div className="absolute bottom-20 left-[18%] h-28 w-28 rounded-full bg-rose-300/10 blur-2xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-12 text-center">
          <h1
            className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 text-stroke-dark animate-in fade-in slide-in-from-top-4 duration-500"
            style={{ textShadow: `0 0 24px ${COLORS.blue}73` }}
          >
            科學隊長的<span className="text-secondary">遊戲基地</span>
          </h1>
          <p className="text-white/90 mb-7 text-base sm:text-lg leading-relaxed animate-in fade-in duration-700 delay-150">
            聽故事、玩挑戰！解鎖你的科學徽章，成為最強知識探險家！
          </p>
        </header>

        <div className="space-y-8">
          {categories.map((category, categoryIndex) => {
            const categoryStats = stats.perCategory[categoryIndex];
            const pct = Math.round((categoryStats.completed / categoryStats.total) * 100);

            return (
              <section
                key={category.category_name}
                className="rounded-3xl p-5 sm:p-8"
                style={{
                  background: 'rgba(52, 49, 76, 0.55)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${COLORS.blue}3d`,
                }}
              >
                <div className="mb-6">
                  <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
                    <span className="mr-2">{CATEGORY_EMOJIS[categoryIndex % CATEGORY_EMOJIS.length]}</span>
                    {category.category_name}
                    <span className="ml-3 text-sm font-normal text-white/60">
                      {categoryStats.completed} / {categoryStats.total}
                    </span>
                  </h2>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: COLORS.green, boxShadow: `0 0 10px ${COLORS.green}99` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {category.episode.map((episode) => {
                    const done = completedSet.has(episode.id);
                    const gameId = getEpisodeGameId(episode.id);
                    const gameMeta = GAME_METADATA[gameId];
                    const stars = completionRecords[episode.id] ?? 0;

                    return (
                      <button
                        key={episode.id}
                        type="button"
                        onClick={() => setSelected({ ...episode, categoryName: category.category_name })}
                        className="group relative flex min-h-[150px] flex-col items-center justify-start rounded-2xl p-3 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        style={{
                          ...gameMeta.cardStyle,
                          border: done ? `2px solid ${COLORS.yellow}` : gameMeta.cardStyle.border,
                          boxShadow: done
                            ? `0 0 22px ${COLORS.yellow}80, 0 0 38px ${COLORS.yellow}30`
                            : gameMeta.cardStyle.boxShadow,
                        }}
                      >
                        <span
                          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl drop-shadow-lg sm:h-16 sm:w-16 sm:text-4xl"
                          style={{
                            ...gameMeta.badgeClassName,
                          }}
                        >
                          {gameMeta.emoji}
                        </span>
                        <span className="text-sm font-black leading-5 text-white sm:text-base group-hover:underline">
                          {gameMeta.label}
                        </span>
                        <span className="mt-2 block max-w-full rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 text-white/90">
                          <span className="line-clamp-2 text-justify">
                            {episode.name}
                          </span>
                        </span>
                        {done && (
                          <span
                            className="absolute -right-1 -top-2 flex h-7 items-center justify-center rounded-full text-white px-2 py-0.5"
                            style={{
                              background: 'rgba(0,0,0,0.6)',
                              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            <span className="text-xs tracking-tighter">{'⭐'.repeat(stars)}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className="max-w-md overflow-hidden border-[1px] p-0 text-white"
          style={{
            backgroundColor: COLORS.card,
            borderColor: "rgb(255, 201, 82, 0.5)",
            boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 40px ${COLORS.yellow}40`,
            borderRadius: '24px',
          }}
        >
          <DialogTitle className="sr-only">
            {selected
              ? `開始挑戰：${GAME_METADATA[getEpisodeGameId(selected.id)].label} - ${selected.name}`
              : '開始挑戰'}
          </DialogTitle>
          <AnimatePresence>
            {selected && (
              (() => {
                const gameMeta = GAME_METADATA[getEpisodeGameId(selected.id)];

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="relative px-6 py-10 text-center sm:px-8"
                  >
                    <Sparkles className="absolute right-8 top-10 h-6 w-6 text-[#ff7473]" />
                    <Sparkles className="absolute bottom-28 left-8 h-5 w-5 text-[#97e5ff]" />

                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-xl"
                      style={{
                        ...gameMeta.cardStyle,
                      }}
                    >
                      <span className="relative drop-shadow-sm">{gameMeta.emoji}</span>
                    </motion.div>
                    <h3 className="mb-3 text-2xl font-black leading-snug sm:text-3xl" style={{ color: COLORS.yellow }}>
                      {gameMeta.label}
                    </h3>
                    <p className="mb-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-base font-bold text-white/80">
                      <span aria-hidden="true">{selected.emoji}</span>
                      <span className="text-justify">{selected.name}</span>
                    </p>
                    {user ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={`/games/${selected.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-7 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition sm:text-lg"
                        >
                          <Sparkles className="h-5 w-5" />
                          開始挑戰
                        </Link>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-cyan-200/30 bg-cyan-200/10 p-4 text-left">
                          <p className="text-lg font-black text-cyan-50">
                            先登入，徽章才不會不見喔！
                          </p>
                          <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                            玩遊戲前請先登入。登入後，我們會幫你保存徽章和星星，下次回來也看得到。
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => setAuthDialogOpen(true)}
                          disabled={authLoading || progressLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary bg-[image:var(--gradient-primary)] px-7 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition disabled:cursor-wait disabled:opacity-70 sm:text-lg"
                        >
                          <LogIn className="h-5 w-5" />
                          登入
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })()
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </main>
  );
}

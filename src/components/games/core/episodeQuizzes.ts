import { createElement } from 'react';
import { toTreasureHunterScene } from './adapters';
import type { GameId, GameScene } from './types';
import type { QuestionAnswerInput, QuestionInput } from './questionInput';
import episodeQuizData from '../data/episodeQuizzes.json';

export type EpisodeQuizGameId = Extract<GameId, 'colorful-balloons' | 'golden-coins' | 'treasure-hunter'>;

export type StageEpisode = {
  id: string;
  name: string;
  emoji: string;
};

export type StageCategory = {
  category_name: string;
  episode: StageEpisode[];
};

export type EpisodeQuiz = {
  id: string;
  question: string;
  correctAnswers: QuestionAnswerInput[];
  wrongAnswers: QuestionAnswerInput[];
};

export type EpisodeQuizFile = {
  episodeId: string;
  categoryName: string;
  name: string;
  title: string;
  prompt: string;
  description: string;
  knowledge: string;
  gameId: EpisodeQuizGameId;
  quizzes: EpisodeQuiz[];
};

type StandardizedEpisodeQuizFile = Omit<EpisodeQuizFile, 'episodeId' | 'categoryName' | 'gameId'> & {
  episode_id: string;
  category_name: string;
  gameId?: EpisodeQuizGameId;
};

const ITEM_LAYOUTS = [
  { x: 50, y: 38, size: 'text-6xl' },
  { x: 31, y: 54, size: 'text-5xl' },
  { x: 69, y: 54, size: 'text-5xl' },
];

const DECOY_LAYOUTS = [
  { x: 20, y: 30, size: 'text-5xl' },
  { x: 80, y: 29, size: 'text-5xl' },
  { x: 27, y: 72, size: 'text-5xl' },
  { x: 73, y: 72, size: 'text-5xl' },
  { x: 50, y: 82, size: 'text-5xl' },
];

const EPISODE_BG_COLORS = [
  'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500',
  'bg-gradient-to-b from-indigo-300 via-blue-500 to-blue-900',
  'bg-gradient-to-b from-teal-200 via-emerald-400 to-emerald-800',
  'bg-gradient-to-b from-amber-200 via-orange-300 to-rose-500',
  'bg-gradient-to-b from-purple-300 via-fuchsia-400 to-slate-900',
];

const gameIds: EpisodeQuizGameId[] = ['colorful-balloons', 'golden-coins', 'treasure-hunter'];
const rawEpisodeQuizFiles = episodeQuizData as unknown as StandardizedEpisodeQuizFile[];

export const episodeQuizFiles: EpisodeQuizFile[] = rawEpisodeQuizFiles.map((episode, index) => ({
  ...episode,
  episodeId: episode.episode_id,
  categoryName: episode.category_name,
  gameId: gameIds[index % gameIds.length],
}));

const episodeQuizFileById = new Map(episodeQuizFiles.map((episode) => [episode.episodeId, episode]));

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getEpisodeGameId(episodeId: string): EpisodeQuizGameId {
  return episodeQuizFileById.get(episodeId)?.gameId ?? gameIds[stableHash(episodeId) % gameIds.length];
}

export function getEpisodeQuiz(episodeId: string) {
  return episodeQuizFileById.get(episodeId);
}

function getEpisodeBgColor(episodeId: string) {
  return EPISODE_BG_COLORS[stableHash(episodeId) % EPISODE_BG_COLORS.length];
}

export function flattenStageCategories(categories: StageCategory[]) {
  return categories.flatMap((category) =>
    category.episode.map((episode) => ({
      episodeId: episode.id,
      categoryName: category.category_name,
      name: episode.name,
      title: episode.name,
      emoji: episode.emoji,
      gameId: getEpisodeGameId(episode.id),
    })),
  );
}

function toQuestionInput(episode: EpisodeQuizFile, quiz: EpisodeQuiz): QuestionInput {
  return {
    id: `${episode.episodeId}-${quiz.id}`,
    title: episode.name,
    prompt: quiz.question || episode.prompt,
    description: episode.description,
    knowledge: quiz.correctAnswers[0]?.explanation || episode.knowledge,
    correctAnswers: quiz.correctAnswers.map((answer, index) => ({
      ...answer,
      id: answer.id || `${quiz.id}-correct-${index + 1}`,
      question: answer.question || quiz.question,
      explanation: answer.explanation || episode.knowledge,
    })),
    wrongAnswers: quiz.wrongAnswers.map((answer, index) => ({
      ...answer,
      id: answer.id || `${quiz.id}-wrong-${index + 1}`,
      question: answer.question || quiz.question,
    })),
  };
}

export function episodeQuizToScenes(episode: EpisodeQuizFile): GameScene[] {
  return episode.quizzes.map((quiz) =>
    ({
      ...toTreasureHunterScene(toQuestionInput(episode, quiz), {
        itemLayouts: ITEM_LAYOUTS,
        decoyLayouts: DECOY_LAYOUTS,
      }),
      bgColor: getEpisodeBgColor(episode.episodeId),
      background: createElement(
        'div',
        { className: 'pointer-events-none absolute inset-0 overflow-hidden' },
        createElement('div', { className: 'absolute left-[8%] top-[12%] h-28 w-28 rounded-full bg-white/20 blur-xl' }),
        createElement('div', { className: 'absolute right-[10%] top-[22%] h-16 w-16 rounded-full bg-yellow-100/30 blur-lg' }),
        createElement('div', { className: 'absolute bottom-0 left-0 h-24 w-full bg-black/15' }),
        createElement('div', { className: 'absolute bottom-[12%] left-[12%] h-12 w-24 rounded-full bg-white/15 blur-md' }),
        createElement('div', { className: 'absolute bottom-[18%] right-[16%] h-16 w-32 rounded-full bg-white/10 blur-md' }),
      ),
    }),
  );
}

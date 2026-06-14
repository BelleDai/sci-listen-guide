import { toGoldenCoinsScene } from '../core/adapters';
import { SceneGame } from '../core/SceneGame';
import type { GameScene } from '../core/types';
import { WATER_QUESTIONS } from './waterQuestions.data';

const BGM_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];

const SCENE_STYLES: Record<string, Pick<GameScene, 'bgColor'>> = {
  cycle: {
    bgColor: 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-400',
  },
  storage: {
    bgColor: 'bg-gradient-to-b from-indigo-300 to-blue-700',
  },
  extremes: {
    bgColor: 'bg-gradient-to-b from-teal-200 to-emerald-800',
  },
  time: {
    bgColor: 'bg-gradient-to-b from-purple-300 to-slate-800',
  },
};

export const GOLDEN_COINS_SCENES: GameScene[] = WATER_QUESTIONS.map(question => (
  toGoldenCoinsScene(question, SCENE_STYLES[question.id])
));

export const goldenCoinsGame = new SceneGame({
  id: 'golden-coins',
  title: '知識接接樂',
  bgmNotes: BGM_NOTES,
  content: GOLDEN_COINS_SCENES,
});

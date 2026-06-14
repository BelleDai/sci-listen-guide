import { toColorfulBalloonsScene } from '../core/adapters';
import { SceneGame } from '../core/SceneGame';
import type { GameScene } from '../core/types';
import { WATER_QUESTIONS } from './waterQuestions.data';

const BGM_NOTES = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];

export const COLORFUL_BALLOONS_SCENES: GameScene[] = WATER_QUESTIONS.map(question => (
  toColorfulBalloonsScene(question)
));

export const colorfulBalloonsGame = new SceneGame({
  id: 'colorful-balloons',
  title: '七彩氣球',
  bgmNotes: BGM_NOTES,
  content: COLORFUL_BALLOONS_SCENES,
});

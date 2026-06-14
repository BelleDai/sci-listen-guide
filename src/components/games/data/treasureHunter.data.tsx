import { toTreasureHunterScene, type SceneAdapterOptions } from '../core/adapters';
import { SceneGame } from '../core/SceneGame';
import type { GameScene } from '../core/types';
import { WATER_QUESTIONS } from './waterQuestions.data';

const BGM_NOTES = [392.0, 493.88, 587.33, 739.99, 659.25, 587.33, 493.88, 440.0];

const SCENE_VISUALS: Record<string, SceneAdapterOptions> = {
  cycle: {
    bgColor: 'bg-gradient-to-b from-sky-300 via-blue-200 to-blue-500',
    itemLayouts: [
      { x: 20, y: 20, size: 'text-6xl' },
      { x: 40, y: 50, size: 'text-5xl' },
      { x: 70, y: 20, size: 'text-5xl' },
      { x: 80, y: 60, size: 'text-5xl' },
      { x: 30, y: 80, size: 'text-5xl' },
    ],
    decoyLayouts: [
      { x: 10, y: 40, size: 'text-5xl' },
      { x: 85, y: 30, size: 'text-5xl' },
      { x: 20, y: 60, size: 'text-5xl' },
      { x: 60, y: 80, size: 'text-4xl' },
      { x: 50, y: 20, size: 'text-4xl' },
    ],
    background: (
      <>
        <div className="absolute bottom-0 w-full h-1/3 bg-blue-600/60 rounded-t-[100px] border-t-8 border-blue-400"></div>
        <div className="absolute bottom-0 right-[-10%] w-[60%] h-[40%] bg-emerald-500 rounded-t-[100px] border-t-8 border-emerald-400"></div>
        <div className="absolute top-[20%] left-[10%] w-20 h-4 bg-white/40 rounded-full blur-md"></div>
      </>
    ),
  },
  storage: {
    bgColor: 'bg-gradient-to-b from-indigo-300 to-blue-900',
    itemLayouts: [
      { x: 50, y: 80, size: 'text-6xl' },
      { x: 80, y: 75, size: 'text-6xl' },
      { x: 70, y: 35, size: 'text-6xl' },
      { x: 20, y: 60, size: 'text-5xl' },
      { x: 25, y: 25, size: 'text-5xl' },
    ],
    decoyLayouts: [
      { x: 85, y: 55, size: 'text-5xl' },
      { x: 40, y: 90, size: 'text-5xl' },
      { x: 85, y: 15, size: 'text-5xl' },
      { x: 15, y: 85, size: 'text-5xl' },
      { x: 10, y: 40, size: 'text-5xl' },
    ],
    background: (
      <>
        <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[60%] bg-blue-600 rounded-t-full opacity-80 border-t-[10px] border-blue-400 flex items-center justify-center">
          <span className="text-white/30 font-bold text-4xl mb-20">OCEAN</span>
        </div>
        <div className="absolute top-[30%] right-[10%] w-32 h-32 bg-white/80 rounded-t-full"></div>
      </>
    ),
  },
  extremes: {
    bgColor: 'bg-gradient-to-b from-teal-200 to-emerald-800',
    itemLayouts: [
      { x: 25, y: 45, size: 'text-6xl' },
      { x: 70, y: 60, size: 'text-6xl' },
      { x: 45, y: 20, size: 'text-6xl' },
      { x: 80, y: 85, size: 'text-5xl' },
      { x: 25, y: 80, size: 'text-5xl' },
    ],
    decoyLayouts: [
      { x: 40, y: 60, size: 'text-5xl' },
      { x: 85, y: 35, size: 'text-5xl' },
      { x: 10, y: 20, size: 'text-4xl' },
      { x: 55, y: 80, size: 'text-5xl' },
      { x: 45, y: 90, size: 'text-4xl' },
    ],
    background: (
      <>
        <div className="absolute left-0 top-0 w-1/2 h-full bg-green-600/30"></div>
        <div className="absolute right-0 bottom-0 w-1/2 h-[70%] bg-blue-800/60 rounded-tl-full"></div>
      </>
    ),
  },
  time: {
    bgColor: 'bg-gradient-to-b from-purple-300 to-slate-800',
    itemLayouts: [
      { x: 30, y: 25, size: 'text-5xl' },
      { x: 65, y: 45, size: 'text-6xl' },
      { x: 75, y: 15, size: 'text-5xl' },
      { x: 25, y: 60, size: 'text-6xl' },
      { x: 80, y: 75, size: 'text-6xl' },
    ],
    decoyLayouts: [
      { x: 35, y: 85, size: 'text-5xl' },
      { x: 50, y: 70, size: 'text-6xl' },
      { x: 50, y: 15, size: 'text-5xl' },
      { x: 85, y: 35, size: 'text-5xl' },
      { x: 15, y: 20, size: 'text-5xl' },
    ],
    background: (
      <>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-64 h-64 border-[20px] border-white rounded-full border-dashed animate-[spin_60s_linear_infinite]"></div>
        </div>
        <div className="absolute bottom-0 w-full h-[40%] bg-slate-900 border-t-8 border-slate-700"></div>
        <div className="absolute top-[40%] left-[5%] w-[40%] h-[30%] bg-white rounded-t-full opacity-80"></div>
      </>
    ),
  },
};

export const TREASURE_HUNTER_SCENES: GameScene[] = WATER_QUESTIONS.map(question => (
  toTreasureHunterScene(question, SCENE_VISUALS[question.id])
));

export const treasureHunterGame = new SceneGame({
  id: 'treasure-hunter',
  title: '尋寶獵人',
  bgmNotes: BGM_NOTES,
  content: TREASURE_HUNTER_SCENES,
});

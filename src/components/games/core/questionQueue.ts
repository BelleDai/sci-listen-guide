import { GAME_SETTINGS } from './gameSettings';
import type { GameItem, GameScene } from './types';

export type GameQuestionUnit = {
  uid: string;
  sourceScene: GameScene;
  targetItem: GameItem;
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createQuestionUnit(scene: GameScene, item: GameItem, index: number): GameQuestionUnit {
  return {
    uid: `${scene.id}-${item.id}-${index}`,
    sourceScene: scene,
    targetItem: item,
  };
}

function avoidConsecutiveDuplicate(units: GameQuestionUnit[]) {
  for (let index = 1; index < units.length; index += 1) {
    if (units[index].targetItem.id !== units[index - 1].targetItem.id) {
      continue;
    }

    const swapIndex = units.findIndex(
      (unit, candidateIndex) =>
        candidateIndex > index && unit.targetItem.id !== units[index - 1].targetItem.id,
    );

    if (swapIndex !== -1) {
      [units[index], units[swapIndex]] = [units[swapIndex], units[index]];
    }
  }

  return units;
}

export function buildQuestionQueue(
  scenes: GameScene[],
  count = GAME_SETTINGS.questionsPerGame,
): GameQuestionUnit[] {
  const baseUnits = scenes.flatMap((scene) =>
    scene.items.map((item, index) => createQuestionUnit(scene, item, index)),
  );

  if (baseUnits.length === 0 || count <= 0) {
    return [];
  }

  const queue: GameQuestionUnit[] = [];
  while (queue.length < count) {
    queue.push(...shuffle(baseUnits));
  }

  return avoidConsecutiveDuplicate(queue).slice(0, count).map((unit, index) => ({
    ...unit,
    uid: `${unit.sourceScene.id}-${unit.targetItem.id}-${index}`,
  }));
}

export function toSingleQuestionScenes(
  scenes: GameScene[],
  count = GAME_SETTINGS.questionsPerGame,
): GameScene[] {
  return buildQuestionQueue(scenes, count).map(({ uid, sourceScene, targetItem }) => ({
    ...sourceScene,
    id: uid,
    title: sourceScene.title,
    prompt: targetItem.question ?? sourceScene.prompt,
    items: [targetItem],
    decoys: [
      ...sourceScene.decoys,
      ...sourceScene.items.filter((item) => item.id !== targetItem.id),
    ],
  }));
}

export function summarizeSceneKnowledge(scenes: GameScene[]) {
  return Array.from(new Set(scenes.map((scene) => scene.knowledge).filter(Boolean))).join('\n\n');
}

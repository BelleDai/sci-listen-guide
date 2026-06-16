import type { ReactNode } from 'react';
import type { GameItem, GameScene } from './types';
import type { QuestionAnswerInput, QuestionInput } from './questionInput';

export type GameItemLayout = Pick<GameItem, 'x' | 'y' | 'size'>;

export type SceneAdapterOptions = {
  /** 覆蓋或補上 GameScene.bgColor。 */
  bgColor?: string;

  /** 覆蓋或補上 GameScene.background。 */
  background?: ReactNode;

  /** 依 correctAnswers 順序套用到 items 的位置與尺寸設定。 */
  itemLayouts?: GameItemLayout[];

  /** 依 wrongAnswers 順序套用到 decoys 的位置與尺寸設定。 */
  decoyLayouts?: GameItemLayout[];
};

const toGameItem = (
  answer: QuestionAnswerInput,
  layout?: GameItemLayout,
): GameItem => ({
  id: answer.id,
  icon: answer.icon,
  label: answer.label,
  question: answer.question,
  audioText: answer.explanation,
  ...layout,
});

const toGameScene = (
  input: QuestionInput,
  options: SceneAdapterOptions = {},
): GameScene => {
  const title = input.title || input.id;
  const prompt = input.prompt || title;

  return {
    id: input.id,
    name: title,
    title,
    prompt,
    description: input.description || input.knowledge,
    bgColor: options.bgColor,
    knowledge: input.knowledge,
    items: input.correctAnswers.map((answer, index) => (
      toGameItem(answer, options.itemLayouts?.[index])
    )),
    decoys: input.wrongAnswers.map((answer, index) => (
      toGameItem(answer, options.decoyLayouts?.[index])
    )),
    background: options.background,
  };
};

/** 將標準問答題轉成金幣遊戲使用的關卡資料。 */
export const toGoldenCoinsScene = (
  input: QuestionInput,
  options?: SceneAdapterOptions,
): GameScene => toGameScene(input, options);

/** 將標準問答題轉成尋寶遊戲使用的關卡資料，通常會額外帶入位置與背景。 */
export const toTreasureHunterScene = (
  input: QuestionInput,
  options?: SceneAdapterOptions,
): GameScene => toGameScene(input, options);

/** 將標準問答題轉成氣球遊戲使用的關卡資料。 */
export const toColorfulBalloonsScene = (
  input: QuestionInput,
  options?: SceneAdapterOptions,
): GameScene => toGameScene(input, options);

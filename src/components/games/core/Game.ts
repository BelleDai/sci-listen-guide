import type { GameConfig, GameId } from './types';

export abstract class Game<TContent> {
  readonly id: GameId;
  readonly title: string;
  readonly bgmNotes: number[];
  readonly content: TContent;

  protected constructor(config: GameConfig<TContent>) {
    this.id = config.id;
    this.title = config.title;
    this.bgmNotes = config.bgmNotes;
    this.content = config.content;
  }

  protected pickRandomItems<TItem>(items: TItem[], count: number): TItem[] {
    return [...items].sort(() => Math.random() - 0.5).slice(0, count);
  }
}

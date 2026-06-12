import { Game } from './Game';
import type { GameConfig, GameScene } from './types';

export class SceneGame extends Game<GameScene[]> {
  constructor(config: GameConfig<GameScene[]>) {
    super(config);
  }

  get scenes(): GameScene[] {
    return this.content;
  }

  pickScenes(count = 2): GameScene[] {
    return this.pickRandomItems(this.scenes, count);
  }
}

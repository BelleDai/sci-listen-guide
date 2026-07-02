import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'src/components/games/data/episodeQuizzes.json');
const outputDir = join(root, 'src/components/games/data/episode-quizzes');
const indexPath = join(root, 'src/components/games/core/episodeQuizIndex.generated.ts');
const loaderPath = join(root, 'src/components/games/core/episodeQuizLoaders.generated.ts');
const gameIds = ['colorful-balloons', 'golden-coins', 'treasure-hunter'];

const episodes = JSON.parse(readFileSync(sourcePath, 'utf8'));

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const gameIdEntries = [];
const loaderEntries = [];

episodes.forEach((episode, index) => {
  const episodeId = String(episode.episode_id);
  const gameId = episode.gameId ?? gameIds[index % gameIds.length];
  const fileName = `${episodeId}.json`;

  writeFileSync(join(outputDir, fileName), `${JSON.stringify(episode, null, 2)}\n`);
  gameIdEntries.push(`  ${JSON.stringify(episodeId)}: ${JSON.stringify(gameId)},`);
  loaderEntries.push(`  ${JSON.stringify(episodeId)}: () => import('../data/episode-quizzes/${fileName}'),`);
});

writeFileSync(
  indexPath,
  `import type { EpisodeQuizGameId } from './episodeQuizzes';\n\n` +
    `export const EPISODE_QUIZ_GAME_IDS = {\n${gameIdEntries.join('\n')}\n} as const satisfies Record<string, EpisodeQuizGameId>;\n\n` +
    `export const EPISODE_QUIZ_IDS = Object.keys(EPISODE_QUIZ_GAME_IDS);\n`,
);

writeFileSync(
  loaderPath,
  `import type { StandardizedEpisodeQuizFile } from './episodeQuizzes';\n\n` +
    `type EpisodeQuizModule = { default: StandardizedEpisodeQuizFile };\n\n` +
    `const episodeQuizLoaders = {\n${loaderEntries.join('\n')}\n} as const satisfies Record<string, () => Promise<EpisodeQuizModule>>;\n\n` +
    `export async function loadStandardizedEpisodeQuiz(episodeId: string) {\n` +
    `  const loader = episodeQuizLoaders[episodeId as keyof typeof episodeQuizLoaders];\n` +
    `  if (!loader) return null;\n` +
    `  const module = await loader();\n` +
    `  return module.default as StandardizedEpisodeQuizFile;\n` +
    `}\n`,
);

console.log(`Split ${episodes.length} episode quizzes into ${outputDir}`);

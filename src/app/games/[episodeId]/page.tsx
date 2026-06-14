import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ColorfulBalloonsGame from '@/components/games/ColorfulBalloonsGame';
import GamePageShell from '@/components/games/GamePageShell';
import GoldenCoinsGame from '@/components/games/GoldenCoinsGame';
import TreasureHunterGame from '@/components/games/TreasureHunterGame';
import {
  episodeQuizToScenes,
  flattenStageCategories,
  getEpisodeQuiz,
  type StageCategory,
} from '@/components/games/core/episodeQuizzes';
import stageCategories from '../../../../public/stage_1_categories.json';

type EpisodeGamePageProps = {
  params: Promise<{ episodeId: string }>;
};

const typedIndex = flattenStageCategories(stageCategories as StageCategory[]);

export function generateStaticParams() {
  return typedIndex.map((episode) => ({
    episodeId: episode.episodeId,
  }));
}

export async function generateMetadata({ params }: EpisodeGamePageProps): Promise<Metadata> {
  const { episodeId } = await params;
  const episode = typedIndex.find((item) => item.episodeId === episodeId);

  return {
    title: episode ? `${episode.name}｜科學好好聽` : '科學好好聽',
    description: '科學好好聽的遊戲基地，挑戰你的科學知識，看看你能不能通關！',
  };
}

export default async function EpisodeGamePage({ params }: EpisodeGamePageProps) {
  const { episodeId } = await params;
  const episodeMeta = typedIndex.find((item) => item.episodeId === episodeId);

  if (!episodeMeta) {
    notFound();
  }

  const episode = getEpisodeQuiz(episodeId);
  if (!episode) {
    notFound();
  }

  const scenes = episodeQuizToScenes(episode);
  const sharedProps = {
    scenes,
    episodeId,
    gamesHref: '/games',
    reviewHref: `/guide/${episodeId}`,
  };

  return (
    <GamePageShell title={episodeMeta.name}>
      {episodeMeta.gameId === 'colorful-balloons' ? (
        <ColorfulBalloonsGame {...sharedProps} />
      ) : episodeMeta.gameId === 'golden-coins' ? (
        <GoldenCoinsGame {...sharedProps} />
      ) : (
        <TreasureHunterGame {...sharedProps} />
      )}
    </GamePageShell>
  );
}

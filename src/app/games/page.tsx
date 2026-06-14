import type { Metadata } from 'next';

import EpisodeGamesList from '@/components/games/EpisodeGamesList';
import type { StageCategory } from '@/components/games/core/episodeQuizzes';
import stageCategories from '../../../public/stage_1_categories.json';

export const metadata: Metadata = {
  title: '遊戲基地｜科學好好聽',
  description: '每一集科普伴讀都有一個小測驗，通關後會記錄在本機。',
};

export default function GamesPage() {
  return <EpisodeGamesList categories={stageCategories as StageCategory[]} />;
}

import type { StandardizedEpisodeQuizFile } from './episodeQuizzes';

type EpisodeQuizModule = { default: StandardizedEpisodeQuizFile };

const episodeQuizLoaders = {
  "130": () => import('../data/episode-quizzes/130.json'),
  "131": () => import('../data/episode-quizzes/131.json'),
  "132": () => import('../data/episode-quizzes/132.json'),
  "133": () => import('../data/episode-quizzes/133.json'),
  "134": () => import('../data/episode-quizzes/134.json'),
  "135": () => import('../data/episode-quizzes/135.json'),
  "136": () => import('../data/episode-quizzes/136.json'),
  "138": () => import('../data/episode-quizzes/138.json'),
  "140": () => import('../data/episode-quizzes/140.json'),
  "142": () => import('../data/episode-quizzes/142.json'),
  "143": () => import('../data/episode-quizzes/143.json'),
  "144": () => import('../data/episode-quizzes/144.json'),
  "145": () => import('../data/episode-quizzes/145.json'),
  "146": () => import('../data/episode-quizzes/146.json'),
  "147": () => import('../data/episode-quizzes/147.json'),
  "148": () => import('../data/episode-quizzes/148.json'),
  "149": () => import('../data/episode-quizzes/149.json'),
  "150": () => import('../data/episode-quizzes/150.json'),
  "151": () => import('../data/episode-quizzes/151.json'),
  "152": () => import('../data/episode-quizzes/152.json'),
  "153": () => import('../data/episode-quizzes/153.json'),
  "154": () => import('../data/episode-quizzes/154.json'),
  "155": () => import('../data/episode-quizzes/155.json'),
  "215": () => import('../data/episode-quizzes/215.json'),
  "216": () => import('../data/episode-quizzes/216.json'),
  "s2": () => import('../data/episode-quizzes/s2.json'),
  "s3": () => import('../data/episode-quizzes/s3.json'),
  "s4": () => import('../data/episode-quizzes/s4.json'),
  "s5": () => import('../data/episode-quizzes/s5.json'),
  "s6": () => import('../data/episode-quizzes/s6.json'),
  "s7": () => import('../data/episode-quizzes/s7.json'),
  "s8": () => import('../data/episode-quizzes/s8.json'),
  "s9": () => import('../data/episode-quizzes/s9.json'),
  "s10": () => import('../data/episode-quizzes/s10.json'),
  "s11": () => import('../data/episode-quizzes/s11.json'),
  "s12": () => import('../data/episode-quizzes/s12.json'),
  "s13": () => import('../data/episode-quizzes/s13.json'),
  "s14": () => import('../data/episode-quizzes/s14.json'),
  "s15": () => import('../data/episode-quizzes/s15.json'),
  "s16": () => import('../data/episode-quizzes/s16.json'),
  "s17": () => import('../data/episode-quizzes/s17.json'),
  "s18": () => import('../data/episode-quizzes/s18.json'),
  "s19": () => import('../data/episode-quizzes/s19.json'),
  "s20": () => import('../data/episode-quizzes/s20.json'),
  "s21": () => import('../data/episode-quizzes/s21.json'),
  "s22": () => import('../data/episode-quizzes/s22.json'),
  "s23": () => import('../data/episode-quizzes/s23.json'),
  "s24": () => import('../data/episode-quizzes/s24.json'),
  "s25": () => import('../data/episode-quizzes/s25.json'),
  "s26": () => import('../data/episode-quizzes/s26.json'),
} as const satisfies Record<string, () => Promise<EpisodeQuizModule>>;

export async function loadStandardizedEpisodeQuiz(episodeId: string) {
  const loader = episodeQuizLoaders[episodeId as keyof typeof episodeQuizLoaders];
  if (!loader) return null;
  const module = await loader();
  return module.default as StandardizedEpisodeQuizFile;
}

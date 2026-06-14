export const GAME_COMPLETIONS_STORAGE_KEY = 'sci-listen-guide:completed-episode-games';

function readCompletedIds() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(GAME_COMPLETIONS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function getCompletedEpisodeGameIds() {
  return readCompletedIds();
}

export function isEpisodeGameCompleted(episodeId: string) {
  return readCompletedIds().includes(episodeId);
}

export function markEpisodeGameCompleted(episodeId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const completedIds = new Set(readCompletedIds());
  completedIds.add(episodeId);
  window.localStorage.setItem(
    GAME_COMPLETIONS_STORAGE_KEY,
    JSON.stringify(Array.from(completedIds)),
  );
}

export const GAME_COMPLETIONS_STORAGE_KEY = 'sci-listen-guide:completed-episode-games';

function readCompletedRecords(): Record<string, number> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(GAME_COMPLETIONS_STORAGE_KEY);
    if (!rawValue) return {};
    
    const parsedValue = JSON.parse(rawValue);
    
    // Migration: If it's an array of strings, convert to object with 3 stars default
    if (Array.isArray(parsedValue)) {
      const migrated: Record<string, number> = {};
      for (const id of parsedValue) {
        if (typeof id === 'string') {
          migrated[id] = 3;
        }
      }
      // Save the migrated format back to storage
      window.localStorage.setItem(GAME_COMPLETIONS_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    
    if (typeof parsedValue === 'object' && parsedValue !== null) {
      return parsedValue;
    }
    return {};
  } catch {
    return {};
  }
}

export function getCompletedEpisodeGameIds(): string[] {
  return Object.keys(readCompletedRecords());
}

export function getEpisodeGameStars(episodeId: string): number | null {
  const records = readCompletedRecords();
  return records[episodeId] ?? null;
}

export function isEpisodeGameCompleted(episodeId: string): boolean {
  return episodeId in readCompletedRecords();
}

export function markEpisodeGameCompleted(episodeId: string, stars: number = 3) {
  if (typeof window === 'undefined') {
    return;
  }

  const records = readCompletedRecords();
  // Only update if the new stars are higher than the old stars (or if it doesn't exist)
  if (!(episodeId in records) || stars > records[episodeId]) {
    records[episodeId] = stars;
    window.localStorage.setItem(
      GAME_COMPLETIONS_STORAGE_KEY,
      JSON.stringify(records)
    );
  }
}

export const GAME_SETTINGS = {
  questionsPerGame: 8,
  success: {
    minimumCorrect: 6,
    minimumAccuracy: 0.65,
  },
  colorfulBalloons: {
    secondsPerQuestion: 20,
    spawnIntervalMs: 900,
  },
  goldenCoins: {
    secondsPerQuestion: 22,
  },
  treasureHunter: {
    maxMistakesBeforeHint: 3,
  },
} as const;

export function getAnswerAccuracy(correctCount: number, wrongCount: number) {
  const attempts = correctCount + wrongCount;
  return attempts === 0 ? 0 : correctCount / attempts;
}

export function isChallengeSuccessful(correctCount: number, wrongCount: number) {
  return (
    correctCount >= GAME_SETTINGS.success.minimumCorrect &&
    getAnswerAccuracy(correctCount, wrongCount) >= GAME_SETTINGS.success.minimumAccuracy
  );
}

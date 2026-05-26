export const LEADERBOARD_TOP_N = 10;

export type RunScoreTuple = {
  score: number;
  runDurationSeconds: number;
};

export type LeaderboardSortBy = 'SCORE' | 'TIME';

/** Classement par score : score ↑ puis temps ↓ (plus rapide). */
export function isBetterForScoreBoard(
  candidate: RunScoreTuple,
  reference: RunScoreTuple
): boolean {
  if (candidate.score !== reference.score) {
    return candidate.score > reference.score;
  }
  return candidate.runDurationSeconds < reference.runDurationSeconds;
}

/** Classement par temps : durée ↓ puis score ↑. */
export function isBetterForTimeBoard(
  candidate: RunScoreTuple,
  reference: RunScoreTuple
): boolean {
  if (candidate.runDurationSeconds !== reference.runDurationSeconds) {
    return candidate.runDurationSeconds < reference.runDurationSeconds;
  }
  return candidate.score > reference.score;
}

/** @deprecated alias */
export function isRunBetter(candidate: RunScoreTuple, reference: RunScoreTuple): boolean {
  return isBetterForScoreBoard(candidate, reference);
}

export function compareForScoreBoard(a: RunScoreTuple, b: RunScoreTuple): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.runDurationSeconds - b.runDurationSeconds;
}

export function compareForTimeBoard(a: RunScoreTuple, b: RunScoreTuple): number {
  if (a.runDurationSeconds !== b.runDurationSeconds) {
    return a.runDurationSeconds - b.runDurationSeconds;
  }
  return b.score - a.score;
}

export function compareBySort(a: RunScoreTuple, b: RunScoreTuple, sortBy: LeaderboardSortBy): number {
  return sortBy === 'TIME' ? compareForTimeBoard(a, b) : compareForScoreBoard(a, b);
}

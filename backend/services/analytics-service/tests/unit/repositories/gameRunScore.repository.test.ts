
const { isBetterForScoreBoard, compareForScoreBoard } = require('../../../src/utils/runRanking.util');

describe('leaderboard top-10 policy (in-memory)', () => {
  type Slot = { userId: string; score: number; runDurationSeconds: number };

  function worstOf(board: Slot[]): Slot {
    return [...board].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.runDurationSeconds - a.runDurationSeconds;
    })[0];
  }

  function tryInsert(board: Slot[], entry: Slot, max = 10): Slot[] {
    const idx = board.findIndex((r) => r.userId === entry.userId);
    if (idx >= 0) {
      if (!isBetterForScoreBoard(entry, board[idx])) return board;
      const next = [...board];
      next[idx] = entry;
      return next.sort(compareForScoreBoard);
    }
    if (board.length < max) return [...board, entry].sort(compareForScoreBoard);
    const w = worstOf(board);
    if (!isBetterForScoreBoard(entry, w)) return board;
    return [...board.filter((r) => r.userId !== w.userId), entry].sort(compareForScoreBoard);
  }

  let board: Slot[] = [];

  beforeEach(() => {
    board = [];
  });

  it('caps at 10 players and evicts worst', () => {
    for (let i = 0; i < 10; i += 1) {
      board = tryInsert(board, { userId: `u${i}`, score: 500 + i * 10, runDurationSeconds: 100 });
    }
    expect(board).toHaveLength(10);
    const before = worstOf(board);
    board = tryInsert(board, { userId: 'challenger', score: before.score + 1, runDurationSeconds: 200 });
    expect(board.find((r) => r.userId === 'challenger')).toBeDefined();
    expect(board.find((r) => r.userId === before.userId)).toBeUndefined();
  });
});

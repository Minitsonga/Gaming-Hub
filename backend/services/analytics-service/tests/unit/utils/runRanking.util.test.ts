
describe('runRanking.util', () => {
  const {
    isBetterForScoreBoard,
    isBetterForTimeBoard,
    compareForScoreBoard,
    compareForTimeBoard,
    LEADERBOARD_TOP_N,
  } = require('../../../src/utils/runRanking.util');

  it('prefers higher score on score board', () => {
    expect(isBetterForScoreBoard({ score: 600, runDurationSeconds: 120 }, { score: 500, runDurationSeconds: 10 })).toBe(
      true
    );
  });

  it('breaks score ties with faster time', () => {
    expect(isBetterForScoreBoard({ score: 500, runDurationSeconds: 90 }, { score: 500, runDurationSeconds: 120 })).toBe(
      true
    );
  });

  it('prefers faster time on time board', () => {
    expect(isBetterForTimeBoard({ score: 100, runDurationSeconds: 60 }, { score: 200, runDurationSeconds: 120 })).toBe(
      true
    );
  });

  it('breaks time ties with higher score', () => {
    expect(isBetterForTimeBoard({ score: 500, runDurationSeconds: 120 }, { score: 400, runDurationSeconds: 120 })).toBe(
      true
    );
  });

  it('sorts score leaderboard', () => {
    const runs = [
      { score: 500, runDurationSeconds: 100 },
      { score: 600, runDurationSeconds: 200 },
      { score: 500, runDurationSeconds: 50 },
    ];
    const sorted = [...runs].sort(compareForScoreBoard);
    expect(sorted[0].score).toBe(600);
    expect(sorted[1].runDurationSeconds).toBe(50);
  });

  it('sorts time leaderboard', () => {
    const runs = [
      { score: 100, runDurationSeconds: 120 },
      { score: 200, runDurationSeconds: 60 },
      { score: 300, runDurationSeconds: 60 },
    ];
    const sorted = [...runs].sort(compareForTimeBoard);
    expect(sorted[0].runDurationSeconds).toBe(60);
    expect(sorted[0].score).toBe(300);
  });

  it('keeps top 10 constant', () => {
    expect(LEADERBOARD_TOP_N).toBe(10);
  });
});

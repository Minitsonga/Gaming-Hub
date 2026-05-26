import { GameRunScoreRepository } from '../repositories/gameRunScore.repository';
import type { LeaderboardSortBy } from '../utils/runRanking.util';
import { RecordRunScoreSchema } from '../utils/validators';

export class RunScoresService {
  private repo = new GameRunScoreRepository();

  async recordRunScore(userId: string, input: unknown) {
    const data = RecordRunScoreSchema.parse(input);
    const { doc, scoreImproved, timeImproved } = await this.repo.recordPlayerRun({
      userId,
      playerName: data.playerName,
      gameSlug: data.gameSlug,
      score: data.score,
      runDurationSeconds: data.runDurationSeconds,
    });

    const scoreBoard = await this.repo.leaderboardForGame(data.gameSlug, 'SCORE', userId);
    const timeBoard = await this.repo.leaderboardForGame(data.gameSlug, 'TIME', userId);

    const rankScore = this.viewerRankFromBoard(scoreBoard, userId);
    const rankTime = this.viewerRankFromBoard(timeBoard, userId);

    return {
      scoreImproved,
      timeImproved,
      personalBestImproved: scoreImproved || timeImproved,
      run: {
        id: doc._id.toString(),
        userId,
        playerName: data.playerName,
        gameSlug: data.gameSlug,
        score: data.score,
        runDurationSeconds: data.runDurationSeconds,
        rank: rankScore ?? rankTime ?? 0,
        isViewer: true,
      },
      ranks: {
        score: rankScore,
        time: rankTime,
      },
    };
  }

  async gameRunLeaderboard(
    gameSlug: string,
    sortBy: LeaderboardSortBy = 'SCORE',
    viewerUserId: string | null = null,
    limit = 10
  ) {
    return this.repo.leaderboardForGame(gameSlug, sortBy, viewerUserId, limit);
  }

  async myGameRecords(userId: string) {
    return this.repo.myRecords(userId);
  }

  private viewerRankFromBoard(
    board: Awaited<ReturnType<GameRunScoreRepository['leaderboardForGame']>>,
    userId: string
  ): number | null {
    const entry =
      board.viewer ?? board.top.find((row) => row.userId === userId) ?? null;
    return entry?.rank ?? null;
  }
}

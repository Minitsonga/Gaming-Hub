import { IPlayerGameStat, PlayerGameStat } from '../models/PlayerGameStat.model';

interface UpsertStatsInput {
  userId: string;
  gameSlug: string;
  playtimeMinutes: number;
  runsCompleted: number;
  metrics: Record<string, number>;
  lastPlayedAt: Date;
}

export class PlayerStatsRepository {
  async findByUserAndGame(userId: string, gameSlug: string): Promise<IPlayerGameStat | null> {
    return PlayerGameStat.findOne({ userId, gameSlug });
  }

  async upsert(input: UpsertStatsInput): Promise<IPlayerGameStat> {
    const { userId, gameSlug, ...data } = input;
    return PlayerGameStat.findOneAndUpdate(
      { userId, gameSlug },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ) as Promise<IPlayerGameStat>;
  }

  async findByUser(userId: string, limit: number): Promise<IPlayerGameStat[]> {
    return PlayerGameStat.find({ userId }).sort({ playtimeMinutes: -1 }).limit(limit);
  }

  async topPlayedGames(limit: number): Promise<
    Array<{
      gameSlug: string;
      totalPlaytimeMinutes: number;
      totalRuns: number;
      totalPlayers: number;
    }>
  > {
    const results = await PlayerGameStat.aggregate([
      {
        $group: {
          _id: '$gameSlug',
          totalPlaytimeMinutes: { $sum: '$playtimeMinutes' },
          totalRuns: { $sum: '$runsCompleted' },
          totalPlayers: { $sum: 1 },
        },
      },
      { $sort: { totalPlaytimeMinutes: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          gameSlug: '$_id',
          totalPlaytimeMinutes: 1,
          totalRuns: 1,
          totalPlayers: 1,
        },
      },
    ]);

    return results;
  }

  async topPlayersByPlaytime(
    limit: number
  ): Promise<Array<{ userId: string; gameSlug: string; value: number; metric: string }>> {
    const results = await PlayerGameStat.find()
      .sort({ playtimeMinutes: -1 })
      .limit(limit)
      .select('userId gameSlug playtimeMinutes');

    return results.map((entry) => ({
      userId: entry.userId,
      gameSlug: entry.gameSlug,
      value: entry.playtimeMinutes,
      metric: 'playtimeMinutes',
    }));
  }

  async gameLeaderboard(
    gameSlug: string,
    metric: string,
    limit: number
  ): Promise<Array<{ userId: string; gameSlug: string; value: number; metric: string }>> {
    const metricPath =
      metric === 'playtimeMinutes' || metric === 'runsCompleted'
        ? `$${metric}`
        : `$metrics.${metric}`;

    const results = await PlayerGameStat.aggregate([
      { $match: { gameSlug } },
      {
        $project: {
          userId: 1,
          gameSlug: 1,
          value: { $ifNull: [metricPath, 0] },
        },
      },
      { $sort: { value: -1 } },
      { $limit: limit },
    ]);

    return results.map((entry) => ({
      userId: entry.userId,
      gameSlug: entry.gameSlug,
      value: entry.value,
      metric,
    }));
  }
}

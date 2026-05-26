import { PlayerStatsService } from '../services/playerStats.service';
import { RankingsService } from '../services/rankings.service';
import { RunScoresService } from '../services/runScores.service';
import { requireAuth, requireIngestAccess } from '../middleware/auth.middleware';
import type { GraphQLContext } from '../middleware/auth.middleware';

const playerStatsService = new PlayerStatsService();
const rankingsService = new RankingsService();
const runScoresService = new RunScoresService();

function metricsRecordToList(metrics: Record<string, number>) {
  return Object.entries(metrics ?? {}).map(([key, value]) => ({ key, value }));
}

export const resolvers = {
  User: {
    profileStats: (parent: { id: string }, { limit }: { limit?: number }) =>
      playerStatsService.getByUser(parent.id, limit ?? 20),
  },
  PlayerGameStats: {
    metrics: (parent: { metrics: Record<string, number> }) => metricsRecordToList(parent.metrics),
  },
  Query: {
    myProfileStats: (_: unknown, { limit }: { limit?: number }, context: GraphQLContext) => {
      const user = requireAuth(context);
      return playerStatsService.getByUser(user.id, limit ?? 20);
    },
    playerStats: (_: unknown, { userId, gameSlug }: { userId: string; gameSlug?: string }) => {
      if (gameSlug) return playerStatsService.getByUserAndGame(userId, gameSlug);
      return playerStatsService.getByUser(userId, 100);
    },
    topPlayedGames: (_: unknown, { limit }: { limit?: number }) =>
      rankingsService.topPlayedGames(limit ?? 10),
    topPlayersByPlaytime: (_: unknown, { limit }: { limit?: number }) =>
      rankingsService.topPlayersByPlaytime(limit ?? 10),
    gameLeaderboard: (
      _: unknown,
      { gameSlug, metric, limit }: { gameSlug: string; metric?: string; limit?: number }
    ) => rankingsService.gameLeaderboard(gameSlug, metric ?? 'playtimeMinutes', limit ?? 10),
    gameRunLeaderboard: (
      _: unknown,
      {
        gameSlug,
        sortBy,
        limit,
      }: { gameSlug: string; sortBy?: 'SCORE' | 'TIME'; limit?: number },
      context: GraphQLContext
    ) => {
      const viewerId = context.user?.id ?? null;
      return runScoresService.gameRunLeaderboard(
        gameSlug,
        sortBy ?? 'SCORE',
        viewerId,
        limit ?? 10
      );
    },
    myGameRecords: (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return runScoresService.myGameRecords(user.id);
    },
  },
  Mutation: {
    recordGameplayStats: (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      requireIngestAccess(context, input.userId);
      const mappedInput = {
        ...input,
        metrics: Object.fromEntries(
          (input.metrics ?? []).map((entry: { key: string; value: number }) => [
            entry.key,
            entry.value,
          ])
        ),
      };
      return playerStatsService.recordGameplayStats(mappedInput);
    },
    upsertPlayerMetric: (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      requireIngestAccess(context, input.userId);
      return playerStatsService.upsertPlayerMetric(input);
    },
    recordRunScore: (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      const user = requireAuth(context);
      return runScoresService.recordRunScore(user.id, input);
    },
  },
};

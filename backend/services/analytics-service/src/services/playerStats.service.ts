import { PlayerStatsRepository } from '../repositories/playerStats.repository';
import { RecordGameplayStatsSchema, UpsertPlayerMetricSchema } from '../utils/validators';

export interface PlayerGameStatsResponse {
  id: string;
  userId: string;
  gameSlug: string;
  playtimeMinutes: number;
  runsCompleted: number;
  metrics: Record<string, number>;
  lastPlayedAt: string;
}

function toResponse(stat: {
  _id: { toString(): string };
  userId: string;
  gameSlug: string;
  playtimeMinutes: number;
  runsCompleted: number;
  metrics: Record<string, number>;
  lastPlayedAt: Date;
}): PlayerGameStatsResponse {
  return {
    id: stat._id.toString(),
    userId: stat.userId,
    gameSlug: stat.gameSlug,
    playtimeMinutes: stat.playtimeMinutes,
    runsCompleted: stat.runsCompleted,
    metrics: stat.metrics ?? {},
    lastPlayedAt: stat.lastPlayedAt.toISOString(),
  };
}

export class PlayerStatsService {
  private playerStatsRepo = new PlayerStatsRepository();

  async recordGameplayStats(input: unknown): Promise<PlayerGameStatsResponse> {
    const data = RecordGameplayStatsSchema.parse(input);
    const updated = await this.playerStatsRepo.upsert({
      userId: data.userId,
      gameSlug: data.gameSlug,
      playtimeMinutes: data.playtimeMinutes,
      runsCompleted: data.runsCompleted,
      metrics: data.metrics,
      lastPlayedAt: data.lastPlayedAt ? new Date(data.lastPlayedAt) : new Date(),
    });

    return toResponse(updated as any);
  }

  async upsertPlayerMetric(input: unknown): Promise<PlayerGameStatsResponse> {
    const data = UpsertPlayerMetricSchema.parse(input);
    const existing = await this.playerStatsRepo.findByUserAndGame(data.userId, data.gameSlug);
    const nextMetrics = { ...(existing?.metrics ?? {}), [data.metric]: data.value };

    const updated = await this.playerStatsRepo.upsert({
      userId: data.userId,
      gameSlug: data.gameSlug,
      playtimeMinutes: existing?.playtimeMinutes ?? 0,
      runsCompleted: existing?.runsCompleted ?? 0,
      metrics: nextMetrics,
      lastPlayedAt: existing?.lastPlayedAt ?? new Date(),
    });

    return toResponse(updated as any);
  }

  async getByUser(userId: string, limit = 20): Promise<PlayerGameStatsResponse[]> {
    const stats = await this.playerStatsRepo.findByUser(userId, limit);
    return stats.map((entry) => toResponse(entry as any));
  }

  async getByUserAndGame(userId: string, gameSlug: string): Promise<PlayerGameStatsResponse[]> {
    const entry = await this.playerStatsRepo.findByUserAndGame(userId, gameSlug);
    return entry ? [toResponse(entry as any)] : [];
  }
}

import { PlayerStatsService } from '../../../src/services/playerStats.service';
import { PlayerStatsRepository } from '../../../src/repositories/playerStats.repository';

jest.mock('../../../src/repositories/playerStats.repository');

describe('PlayerStatsService', () => {
  let service: PlayerStatsService;
  let mockRepo: jest.Mocked<PlayerStatsRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlayerStatsService();
    mockRepo = (service as any).playerStatsRepo;
  });

  it('recordGameplayStats should validate and persist payload', async () => {
    mockRepo.upsert.mockResolvedValue({
      _id: { toString: () => 's1' },
      userId: 'u1',
      gameSlug: 'roguelike-core',
      playtimeMinutes: 120,
      runsCompleted: 6,
      metrics: { xp: 500 },
      lastPlayedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as any);

    const result = await service.recordGameplayStats({
      userId: 'u1',
      gameSlug: 'roguelike-core',
      playtimeMinutes: 120,
      runsCompleted: 6,
      metrics: { xp: 500 },
    });

    expect(mockRepo.upsert).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 's1', userId: 'u1', playtimeMinutes: 120 });
  });

  it('upsertPlayerMetric should merge existing metrics', async () => {
    mockRepo.findByUserAndGame.mockResolvedValue({
      playtimeMinutes: 10,
      runsCompleted: 1,
      metrics: { xp: 100 },
      lastPlayedAt: new Date(),
    } as any);
    mockRepo.upsert.mockResolvedValue({
      _id: { toString: () => 's1' },
      userId: 'u1',
      gameSlug: 'roguelike-core',
      playtimeMinutes: 10,
      runsCompleted: 1,
      metrics: { xp: 100, bestTimeSeconds: 95 },
      lastPlayedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as any);

    const result = await service.upsertPlayerMetric({
      userId: 'u1',
      gameSlug: 'roguelike-core',
      metric: 'bestTimeSeconds',
      value: 95,
    });

    expect(result.metrics.bestTimeSeconds).toBe(95);
  });
});

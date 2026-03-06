import { SaveService } from '../../../src/services/save.service';
import { PlayerSaveRepository } from '../../../src/repositories/playerSave.repository';

jest.mock('../../../src/repositories/playerSave.repository');

describe('SaveService', () => {
  let service: SaveService;
  let mockRepo: jest.Mocked<PlayerSaveRepository>;
  let mockAnalyticsClient: { recordGameplayStats: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SaveService();
    mockRepo = (service as any).saveRepo;
    mockAnalyticsClient = { recordGameplayStats: jest.fn().mockResolvedValue(undefined) };
    (service as any).analyticsClient = mockAnalyticsClient;
  });

  it('getMySave should delegate to repository', async () => {
    mockRepo.findByUserAndGame.mockResolvedValue({ _id: 'save-1' } as any);
    await service.getMySave('u1', 'roguelike-core');
    expect(mockRepo.findByUserAndGame).toHaveBeenCalledWith('u1', 'roguelike-core');
  });

  it('upsertSave should delegate with payload', async () => {
    mockRepo.upsert.mockResolvedValue({
      _id: 'save-1',
      playtimeMinutes: 3,
      lastPlayed: new Date('2026-01-01T00:00:00.000Z'),
      saveData: { runsCompleted: 1, level: 2, xp: 10, xyst: 5, highestWave: 3, totalKills: 20 },
    } as any);
    await service.upsertSave('u1', 'roguelike-core', { xp: 10, runsCompleted: 1 }, 3);
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      'u1',
      'roguelike-core',
      { xp: 10, runsCompleted: 1 },
      3
    );
    expect(mockAnalyticsClient.recordGameplayStats).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', gameSlug: 'roguelike-core', playtimeMinutes: 3 })
    );
  });
});

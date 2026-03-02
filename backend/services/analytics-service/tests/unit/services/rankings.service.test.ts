import { RankingsService } from '../../../src/services/rankings.service';
import { PlayerStatsRepository } from '../../../src/repositories/playerStats.repository';

jest.mock('../../../src/repositories/playerStats.repository');

describe('RankingsService', () => {
  let service: RankingsService;
  let mockRepo: jest.Mocked<PlayerStatsRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RankingsService();
    mockRepo = (service as any).playerStatsRepo;
  });

  it('topPlayedGames should delegate to repository', async () => {
    mockRepo.topPlayedGames.mockResolvedValue([]);
    await service.topPlayedGames(5);
    expect(mockRepo.topPlayedGames).toHaveBeenCalledWith(5);
  });

  it('topPlayersByPlaytime should delegate to repository', async () => {
    mockRepo.topPlayersByPlaytime.mockResolvedValue([]);
    await service.topPlayersByPlaytime(5);
    expect(mockRepo.topPlayersByPlaytime).toHaveBeenCalledWith(5);
  });

  it('gameLeaderboard should delegate with metric and limit', async () => {
    mockRepo.gameLeaderboard.mockResolvedValue([]);
    await service.gameLeaderboard('platformer', 'bestTimeSeconds', 10);
    expect(mockRepo.gameLeaderboard).toHaveBeenCalledWith('platformer', 'bestTimeSeconds', 10);
  });
});

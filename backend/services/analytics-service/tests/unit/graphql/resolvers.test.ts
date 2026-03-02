const mockGetByUser = jest.fn();
const mockGetByUserAndGame = jest.fn();
const mockRecordGameplayStats = jest.fn();
const mockUpsertPlayerMetric = jest.fn();
const mockTopPlayedGames = jest.fn();
const mockTopPlayersByPlaytime = jest.fn();
const mockGameLeaderboard = jest.fn();

jest.mock('../../../src/services/playerStats.service', () => ({
  PlayerStatsService: jest.fn().mockImplementation(() => ({
    getByUser: mockGetByUser,
    getByUserAndGame: mockGetByUserAndGame,
    recordGameplayStats: mockRecordGameplayStats,
    upsertPlayerMetric: mockUpsertPlayerMetric,
  })),
}));

jest.mock('../../../src/services/rankings.service', () => ({
  RankingsService: jest.fn().mockImplementation(() => ({
    topPlayedGames: mockTopPlayedGames,
    topPlayersByPlaytime: mockTopPlayersByPlaytime,
    gameLeaderboard: mockGameLeaderboard,
  })),
}));

import { resolvers } from '../../../src/graphql/resolvers';

describe('analytics resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Query.myProfileStats should require auth and call getByUser', async () => {
    mockGetByUser.mockResolvedValue([]);
    await resolvers.Query.myProfileStats({}, { limit: 5 }, {
      user: { id: 'u1' },
      isService: false,
    } as any);
    expect(mockGetByUser).toHaveBeenCalledWith('u1', 5);
  });

  it('Mutation.recordGameplayStats should map metrics list to object', async () => {
    mockRecordGameplayStats.mockResolvedValue({});
    await resolvers.Mutation.recordGameplayStats(
      {},
      {
        input: {
          userId: 'u1',
          gameSlug: 'roguelike-core',
          playtimeMinutes: 100,
          runsCompleted: 5,
          metrics: [{ key: 'xp', value: 500 }],
        },
      },
      { user: null, isService: true } as any
    );

    expect(mockRecordGameplayStats).toHaveBeenCalledWith(
      expect.objectContaining({ metrics: { xp: 500 } })
    );
  });
});

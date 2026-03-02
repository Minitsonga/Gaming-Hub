import { PlayerStatsRepository } from '../repositories/playerStats.repository';

export class RankingsService {
  private playerStatsRepo = new PlayerStatsRepository();

  async topPlayedGames(limit = 10) {
    return this.playerStatsRepo.topPlayedGames(limit);
  }

  async topPlayersByPlaytime(limit = 10) {
    return this.playerStatsRepo.topPlayersByPlaytime(limit);
  }

  async gameLeaderboard(gameSlug: string, metric = 'playtimeMinutes', limit = 10) {
    return this.playerStatsRepo.gameLeaderboard(gameSlug, metric, limit);
  }
}

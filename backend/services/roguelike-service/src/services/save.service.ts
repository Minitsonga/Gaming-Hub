import { PlayerSaveRepository } from '../repositories/playerSave.repository';
import { IPlayerSave, ISaveData } from '../models/PlayerSave.model';
import { AnalyticsClient } from '../clients/analytics.client';

export class SaveService {
  private saveRepo = new PlayerSaveRepository();
  private analyticsClient = new AnalyticsClient();

  async getMySave(userId: string, gameSlug: string): Promise<IPlayerSave | null> {
    return this.saveRepo.findByUserAndGame(userId, gameSlug);
  }

  async upsertSave(
    userId: string,
    gameSlug: string,
    saveData: Partial<ISaveData>,
    playtimeMinutes?: number
  ): Promise<IPlayerSave> {
    const updatedSave = await this.saveRepo.upsert(userId, gameSlug, saveData, playtimeMinutes);

    try {
      await this.analyticsClient.recordGameplayStats({
        userId,
        gameSlug,
        playtimeMinutes: updatedSave.playtimeMinutes,
        runsCompleted: updatedSave.saveData?.runsCompleted ?? 0,
        metrics: {
          level: updatedSave.saveData?.level ?? 0,
          xp: updatedSave.saveData?.xp ?? 0,
          xyst: updatedSave.saveData?.xyst ?? 0,
          highestWave: updatedSave.saveData?.highestWave ?? 0,
          totalKills: updatedSave.saveData?.totalKills ?? 0,
        },
        lastPlayedAt: updatedSave.lastPlayed.toISOString(),
      });
    } catch (error) {
      console.warn('Analytics ingest skipped:', error);
    }

    return updatedSave;
  }
}

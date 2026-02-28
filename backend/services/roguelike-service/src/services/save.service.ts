import { PlayerSaveRepository } from '../repositories/playerSave.repository';
import { IPlayerSave, ISaveData } from '../models/PlayerSave.model';

export class SaveService {
  private saveRepo = new PlayerSaveRepository();

  async getMySave(userId: string, gameSlug: string): Promise<IPlayerSave | null> {
    return this.saveRepo.findByUserAndGame(userId, gameSlug);
  }

  async upsertSave(
    userId: string,
    gameSlug: string,
    saveData: Partial<ISaveData>,
    playtimeMinutes?: number
  ): Promise<IPlayerSave> {
    return this.saveRepo.upsert(userId, gameSlug, saveData, playtimeMinutes);
  }
}

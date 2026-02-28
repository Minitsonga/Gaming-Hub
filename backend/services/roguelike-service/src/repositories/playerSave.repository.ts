import { PlayerSave, IPlayerSave, ISaveData } from '../models/PlayerSave.model';

export class PlayerSaveRepository {
  async findByUserAndGame(userId: string, gameSlug: string): Promise<IPlayerSave | null> {
    return PlayerSave.findOne({ userId, gameSlug });
  }

  async upsert(
    userId: string,
    gameSlug: string,
    saveData: Partial<ISaveData>,
    playtimeMinutes?: number
  ): Promise<IPlayerSave> {
    const update: Record<string, unknown> = { lastPlayed: new Date() };

    for (const [key, value] of Object.entries(saveData)) {
      update[`saveData.${key}`] = value;
    }

    if (playtimeMinutes !== undefined) {
      update['playtimeMinutes'] = playtimeMinutes;
    }

    return PlayerSave.findOneAndUpdate(
      { userId, gameSlug },
      { $set: update },
      { new: true, upsert: true }
    ) as Promise<IPlayerSave>;
  }
}

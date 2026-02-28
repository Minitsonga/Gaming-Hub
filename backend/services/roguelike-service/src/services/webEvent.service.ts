import { WebEventRepository } from '../repositories/webEvent.repository';
import { SaveService } from './save.service';
import { AppError } from '../utils/AppError';
import { IWebEvent } from '../models/WebEvent.model';
import { ISaveData } from '../models/PlayerSave.model';

export class WebEventService {
  private eventRepo = new WebEventRepository();
  private saveService = new SaveService();

  async getActiveEvents(gameSlug: string): Promise<IWebEvent[]> {
    return this.eventRepo.findActiveByGame(gameSlug);
  }

  async clickEvent(
    eventId: string,
    userId: string,
    gameSlug: string
  ): Promise<{ event: IWebEvent; newSaveData: ISaveData }> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');
    if (!event.isActive) throw AppError.badRequest('Event is not active');

    const partialSaveData: Partial<ISaveData> = {};
    const save = await this.saveService.getMySave(userId, gameSlug);

    if (event.effectTarget === 'player_xp') {
      const currentXp = save?.saveData?.xp ?? 0;
      partialSaveData.xp = currentXp + event.effectValue;
    } else if (event.effectTarget === 'player_xyst') {
      const currentXyst = save?.saveData?.xyst ?? 0;
      partialSaveData.xyst = currentXyst + event.effectValue;
    }

    const updatedSave = await this.saveService.upsertSave(userId, gameSlug, partialSaveData);
    return { event, newSaveData: updatedSave.saveData };
  }
}

import { WebEvent, IWebEvent } from '../models/WebEvent.model';

export class WebEventRepository {
  async findActiveByGame(gameSlug: string): Promise<IWebEvent[]> {
    return WebEvent.find({ gameSlug, isActive: true });
  }

  async findById(id: string): Promise<IWebEvent | null> {
    return WebEvent.findById(id);
  }
}

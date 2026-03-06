import { Game, IGame } from '../models/Game.model';

export class GameRepository {
  async create(data: Partial<IGame>): Promise<IGame> {
    const game = new Game(data);
    return game.save();
  }

  async findById(id: string): Promise<IGame | null> {
    return Game.findById(id);
  }

  async findBySlug(slug: string): Promise<IGame | null> {
    return Game.findOne({ slug });
  }

  async findAll(filters: { status?: string; tag?: string } = {}): Promise<IGame[]> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.tag) query.tags = filters.tag;
    return Game.find(query).sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<IGame>): Promise<IGame | null> {
    return Game.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Game.findByIdAndDelete(id);
    return !!result;
  }
}

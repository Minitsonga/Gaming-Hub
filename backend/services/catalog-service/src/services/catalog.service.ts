import { GameRepository } from '../repositories/game.repository';
import { CreateGameSchema, UpdateGameSchema } from '../utils/validators';
import { AppError } from '../utils/AppError';
import { IGame } from '../models/Game.model';

export class CatalogService {
  private gameRepo = new GameRepository();

  async getGames(filters: { status?: string; tag?: string } = {}): Promise<IGame[]> {
    return this.gameRepo.findAll(filters);
  }

  async getGame(id: string): Promise<IGame> {
    const game = await this.gameRepo.findById(id);
    if (!game) throw AppError.notFound('Game not found');
    return game;
  }

  async createGame(input: unknown, developerId: string): Promise<IGame> {
    const data = CreateGameSchema.parse(input);

    const existing = await this.gameRepo.findBySlug(data.slug);
    if (existing) throw AppError.conflict('Slug already taken');

    return this.gameRepo.create({ ...data, developerId });
  }

  async updateGame(id: string, input: unknown, requesterId: string): Promise<IGame> {
    const game = await this.gameRepo.findById(id);
    if (!game) throw AppError.notFound('Game not found');
    if (game.developerId !== requesterId) throw AppError.forbidden('Not your game');

    const data = UpdateGameSchema.parse(input);
    const updated = await this.gameRepo.update(id, data);
    if (!updated) throw AppError.notFound('Game not found');
    return updated;
  }

  async deleteGame(id: string, requesterId: string): Promise<boolean> {
    const game = await this.gameRepo.findById(id);
    if (!game) throw AppError.notFound('Game not found');
    if (game.developerId !== requesterId) throw AppError.forbidden('Not your game');
    return this.gameRepo.delete(id);
  }
}

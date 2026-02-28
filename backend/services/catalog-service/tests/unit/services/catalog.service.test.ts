import { CatalogService } from '../../../src/services/catalog.service';
import { GameRepository } from '../../../src/repositories/game.repository';

jest.mock('../../../src/repositories/game.repository');

describe('CatalogService', () => {
  let service: CatalogService;
  let mockRepo: jest.Mocked<GameRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogService();
    mockRepo = (service as any).gameRepo;
  });

  it('getGame should throw when game does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getGame('missing-id')).rejects.toThrow('Game not found');
  });

  it('createGame should throw when slug already exists', async () => {
    mockRepo.findBySlug.mockResolvedValue({ _id: '1' } as any);

    await expect(
      service.createGame(
        {
          slug: 'my-game',
          title: 'My Game',
          description: 'A valid game description',
          technology: 'web-native',
        },
        'dev-1'
      )
    ).rejects.toThrow('Slug already taken');
  });

  it('createGame should persist and return game', async () => {
    const created = { _id: '1', slug: 'my-game', developerId: 'dev-1' } as any;
    mockRepo.findBySlug.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(created);

    const result = await service.createGame(
      {
        slug: 'my-game',
        title: 'My Game',
        description: 'A valid game description',
        technology: 'web-native',
      },
      'dev-1'
    );

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'my-game', developerId: 'dev-1' })
    );
    expect(result).toBe(created);
  });

  it('updateGame should reject non owner', async () => {
    mockRepo.findById.mockResolvedValue({ _id: '1', developerId: 'another-dev' } as any);

    await expect(
      service.updateGame(
        '1',
        {
          title: 'Updated title',
        },
        'dev-1'
      )
    ).rejects.toThrow('Not your game');
  });

  it('deleteGame should return repository result for owner', async () => {
    mockRepo.findById.mockResolvedValue({ _id: '1', developerId: 'dev-1' } as any);
    mockRepo.delete.mockResolvedValue(true);

    await expect(service.deleteGame('1', 'dev-1')).resolves.toBe(true);
  });
});

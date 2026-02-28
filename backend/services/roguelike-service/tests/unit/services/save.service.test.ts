import { SaveService } from '../../../src/services/save.service';
import { PlayerSaveRepository } from '../../../src/repositories/playerSave.repository';

jest.mock('../../../src/repositories/playerSave.repository');

describe('SaveService', () => {
  let service: SaveService;
  let mockRepo: jest.Mocked<PlayerSaveRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SaveService();
    mockRepo = (service as any).saveRepo;
  });

  it('getMySave should delegate to repository', async () => {
    mockRepo.findByUserAndGame.mockResolvedValue({ _id: 'save-1' } as any);
    await service.getMySave('u1', 'roguelike-core');
    expect(mockRepo.findByUserAndGame).toHaveBeenCalledWith('u1', 'roguelike-core');
  });

  it('upsertSave should delegate with payload', async () => {
    mockRepo.upsert.mockResolvedValue({ _id: 'save-1' } as any);
    await service.upsertSave('u1', 'roguelike-core', { xp: 10 }, 3);
    expect(mockRepo.upsert).toHaveBeenCalledWith('u1', 'roguelike-core', { xp: 10 }, 3);
  });
});

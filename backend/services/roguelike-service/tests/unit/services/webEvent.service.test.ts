import { WebEventService } from '../../../src/services/webEvent.service';
import { WebEventRepository } from '../../../src/repositories/webEvent.repository';
import { SaveService } from '../../../src/services/save.service';

jest.mock('../../../src/repositories/webEvent.repository');
jest.mock('../../../src/services/save.service');

describe('WebEventService', () => {
  let service: WebEventService;
  let mockEventRepo: jest.Mocked<WebEventRepository>;
  let mockSaveService: jest.Mocked<SaveService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebEventService();
    mockEventRepo = (service as any).eventRepo;
    mockSaveService = (service as any).saveService;
  });

  it('should throw when event is not found', async () => {
    mockEventRepo.findById.mockResolvedValue(null);
    await expect(service.clickEvent('e1', 'u1', 'roguelike-core')).rejects.toThrow(
      'Event not found'
    );
  });

  it('should throw when event is inactive', async () => {
    mockEventRepo.findById.mockResolvedValue({ isActive: false } as any);
    await expect(service.clickEvent('e1', 'u1', 'roguelike-core')).rejects.toThrow(
      'Event is not active'
    );
  });

  it('should apply xp effect and return updated save', async () => {
    mockEventRepo.findById.mockResolvedValue({
      _id: 'e1',
      isActive: true,
      effectTarget: 'player_xp',
      effectValue: 15,
    } as any);
    mockSaveService.getMySave.mockResolvedValue({ saveData: { xp: 10 } } as any);
    mockSaveService.upsertSave.mockResolvedValue({ saveData: { xp: 25 } } as any);

    const result = await service.clickEvent('e1', 'u1', 'roguelike-core');

    expect(mockSaveService.upsertSave).toHaveBeenCalledWith('u1', 'roguelike-core', { xp: 25 });
    expect(result.newSaveData).toEqual({ xp: 25 });
  });
});

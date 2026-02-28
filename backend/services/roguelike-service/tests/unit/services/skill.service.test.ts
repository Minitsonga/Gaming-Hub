import { SkillService } from '../../../src/services/skill.service';
import { SkillDefinitionRepository } from '../../../src/repositories/skillDefinition.repository';

jest.mock('../../../src/repositories/skillDefinition.repository');

describe('SkillService', () => {
  let service: SkillService;
  let mockRepo: jest.Mocked<SkillDefinitionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SkillService();
    mockRepo = (service as any).skillRepo;
  });

  it('getSkills should forward optional category', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    await service.getSkills('growth' as any);
    expect(mockRepo.findAll).toHaveBeenCalledWith('growth');
  });

  it('getSkill should request by skillId', async () => {
    mockRepo.findBySkillId.mockResolvedValue(null);
    await service.getSkill('skill-001');
    expect(mockRepo.findBySkillId).toHaveBeenCalledWith('skill-001');
  });
});

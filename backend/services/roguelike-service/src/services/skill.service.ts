import { SkillDefinitionRepository } from '../repositories/skillDefinition.repository';
import { ISkillDefinition, SkillCategory } from '../models/SkillDefinition.model';

export class SkillService {
  private skillRepo = new SkillDefinitionRepository();

  async getSkills(category?: SkillCategory): Promise<ISkillDefinition[]> {
    return this.skillRepo.findAll(category);
  }

  async getSkill(skillId: string): Promise<ISkillDefinition | null> {
    return this.skillRepo.findBySkillId(skillId);
  }
}

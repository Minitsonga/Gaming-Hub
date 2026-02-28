import { SkillDefinition, ISkillDefinition, SkillCategory } from '../models/SkillDefinition.model';

export class SkillDefinitionRepository {
  async findAll(category?: SkillCategory): Promise<ISkillDefinition[]> {
    const query = category ? { category } : {};
    return SkillDefinition.find(query);
  }

  async findBySkillId(skillId: string): Promise<ISkillDefinition | null> {
    return SkillDefinition.findOne({ skillId });
  }
}

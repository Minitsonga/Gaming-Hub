import { SaveDataInputSchema, SkillInstanceInputSchema } from '../../../src/utils/validators';

describe('roguelike validators', () => {
  it('SkillInstanceInputSchema should accept valid payload', () => {
    const result = SkillInstanceInputSchema.safeParse({
      skillId: 'skill-1',
      rarityHistory: [1, 2],
      isPermanent: false,
    });
    expect(result.success).toBe(true);
  });

  it('SaveDataInputSchema should accept partial payload', () => {
    const result = SaveDataInputSchema.safeParse({ xp: 100, level: 2 });
    expect(result.success).toBe(true);
  });

  it('SaveDataInputSchema should reject invalid numeric values', () => {
    const result = SaveDataInputSchema.safeParse({ xp: 'bad' });
    expect(result.success).toBe(false);
  });
});

import { z } from 'zod';

export const SkillInstanceInputSchema = z.object({
  skillId: z.string(),
  rarityHistory: z.array(z.number()),
  isPermanent: z.boolean(),
});

export const SaveDataInputSchema = z.object({
  ownedSkills: z.array(SkillInstanceInputSchema).optional(),
  level: z.number().int().optional(),
  xp: z.number().int().optional(),
  xyst: z.number().int().optional(),
  runsCompleted: z.number().int().optional(),
  highestWave: z.number().int().optional(),
  totalKills: z.number().int().optional(),
});

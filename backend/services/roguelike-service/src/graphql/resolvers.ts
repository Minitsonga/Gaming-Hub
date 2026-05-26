import { SaveService } from '../services/save.service';
import { SkillService } from '../services/skill.service';
import { WebEventService } from '../services/webEvent.service';
import { requireAuth } from '../middleware/auth.middleware';
import type { GraphQLContext } from '../middleware/auth.middleware';
import type { SkillCategory } from '../models/SkillDefinition.model';
import { SaveDataInputSchema } from '../utils/validators';

const saveService = new SaveService();
const skillService = new SkillService();
const webEventService = new WebEventService();

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) return value;
  return new Date().toISOString();
}

export const resolvers = {
  PlayerSave: {
    id: (parent: { id?: string; _id?: { toString(): string } }) =>
      parent.id ?? parent._id?.toString() ?? '',
    lastPlayed: (parent: { lastPlayed?: unknown }) => toIsoString(parent.lastPlayed),
  },
  SaveData: {
    ownedSkills: (parent: { ownedSkills?: unknown[] }) => parent.ownedSkills ?? [],
    level: (parent: { level?: number }) => parent.level ?? 1,
    xp: (parent: { xp?: number }) => parent.xp ?? 0,
    xyst: (parent: { xyst?: number }) => parent.xyst ?? 0,
    runsCompleted: (parent: { runsCompleted?: number }) => parent.runsCompleted ?? 0,
    highestWave: (parent: { highestWave?: number }) => parent.highestWave ?? 0,
    totalKills: (parent: { totalKills?: number }) => parent.totalKills ?? 0,
  },
  Query: {
    mySave: (_: unknown, { gameSlug }: { gameSlug: string }, context: GraphQLContext) => {
      const user = requireAuth(context);
      return saveService.getMySave(user.id, gameSlug);
    },
    skills: (_: unknown, { category }: { category?: SkillCategory }) =>
      skillService.getSkills(category),
    activeWebEvents: (_: unknown, { gameSlug }: { gameSlug: string }) =>
      webEventService.getActiveEvents(gameSlug),
  },
  Mutation: {
    upsertSave: (
      _: unknown,
      {
        gameSlug,
        saveData,
        playtimeMinutes,
      }: { gameSlug: string; saveData: unknown; playtimeMinutes?: number },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);
      const parsedSaveData = SaveDataInputSchema.parse(saveData);
      return saveService.upsertSave(user.id, gameSlug, parsedSaveData, playtimeMinutes);
    },
    clickWebEvent: (
      _: unknown,
      { eventId, gameSlug }: { eventId: string; gameSlug: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);
      return webEventService.clickEvent(eventId, user.id, gameSlug);
    },
  },
};

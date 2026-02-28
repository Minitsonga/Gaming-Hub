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

export const resolvers = {
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

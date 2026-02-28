import { CatalogService } from '../services/catalog.service';
import { requireAuth } from '../middleware/auth.middleware';
import type { GraphQLContext } from '../middleware/auth.middleware';

const catalogService = new CatalogService();

export const resolvers = {
  Query: {
    games: (_: unknown, args: { status?: string; tag?: string }) => catalogService.getGames(args),
    game: (_: unknown, { id }: { id: string }) => catalogService.getGame(id),
  },
  Mutation: {
    createGame: (_: unknown, { input }: { input: unknown }, context: GraphQLContext) => {
      const user = requireAuth(context);
      return catalogService.createGame(input, user.id);
    },
    updateGame: (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);
      return catalogService.updateGame(id, input, user.id);
    },
    deleteGame: (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);
      return catalogService.deleteGame(id, user.id);
    },
  },
};

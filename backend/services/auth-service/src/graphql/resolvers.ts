import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import type { GraphQLContext } from '../middleware/auth.middleware';

const authService = new AuthService();

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return authService.getMe(user.id);
    },
    users: () => authService.getAllUsers(),
    user: (_: unknown, { id }: { id: string }) => authService.getUserById(id),
  },
  Mutation: {
    register: (_: unknown, { input }: { input: unknown }) => authService.register(input),
    login: (_: unknown, { input }: { input: unknown }) => authService.login(input),
    refreshToken: (_: unknown, { input }: { input: unknown }) => authService.refreshToken(input),
    logout: (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return authService.logout(user.id);
    },
    deleteUser: (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      return authService.deleteUser(id);
    },
  },
};

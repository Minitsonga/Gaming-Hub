import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import type { AuthContext } from '../middleware/auth.middleware';

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RefreshTokenInput {
  refreshToken: string;
}

const authController = new AuthController();
const userController = new UserController();

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, context: AuthContext) =>
      userController.me(context),
    users: () => userController.getAllUsers(),
    user: (_: unknown, { id }: { id: string }) =>
      userController.getUserById(id),
  },
  Mutation: {
    register: (_: unknown, { input }: { input: RegisterInput }) =>
      authController.register(input),
    login: (_: unknown, { input }: { input: LoginInput }) =>
      authController.login(input),
    refreshToken: (_: unknown, { input }: { input: RefreshTokenInput }) =>
      authController.refreshToken(input),
    deleteUser: (_: unknown, { id }: { id: string }, context: AuthContext) =>
      userController.deleteUser(id, context),
  },
};

import { verifyToken } from '../utils/jwt.util';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';

export interface AuthContext {
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
}

export interface UserRepo {
  findById(
    id: string
  ): Promise<{ _id: { toString(): string }; username: string; email: string } | null>;
}

const defaultUserRepo = new UserRepository();

/** Factory pour permettre l'injection du repo en tests */
export function createCreateContext(userRepo: UserRepo = defaultUserRepo) {
  return async function createContext({ req }: any): Promise<AuthContext> {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return { user: null };
    }

    try {
      const { userId } = verifyToken(token);
      const user = await userRepo.findById(userId);

      if (!user) {
        return { user: null };
      }

      return {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        },
      };
    } catch {
      return { user: null };
    }
  };
}

export const createContext = createCreateContext();

export function requireAuth(context: AuthContext) {
  if (!context.user) {
    throw AppError.unauthorized('Authentication required');
  }
  return context.user;
}

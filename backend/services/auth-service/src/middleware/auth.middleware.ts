import { verifyToken } from '../utils/jwt.util';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';

const userRepo = new UserRepository();

export interface AuthContext {
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
}

export async function createContext({ req }: any): Promise<AuthContext> {
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
}

export function requireAuth(context: AuthContext) {
  if (!context.user) {
    throw AppError.unauthorized('Authentication required');
  }
  return context.user;
}

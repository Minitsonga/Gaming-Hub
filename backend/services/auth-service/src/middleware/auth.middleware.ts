import { verifyToken } from '../utils/jwt.util';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';

export interface GraphQLContext {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

const defaultUserRepo = new UserRepository();

export async function createContext({ req }: { req: Express.Request }): Promise<GraphQLContext> {
  const authHeader = (req as any).headers?.authorization ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return { user: null };

  try {
    const { userId } = verifyToken(token);
    const user = await defaultUserRepo.findById(userId);

    if (!user) return { user: null };

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch {
    return { user: null };
  }
}

export function requireAuth(context: GraphQLContext): NonNullable<GraphQLContext['user']> {
  if (!context.user) throw AppError.unauthorized('Authentication required');
  return context.user;
}

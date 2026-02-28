import { verifyToken } from '../utils/jwt.util';
import { AppError } from '../utils/AppError';

export interface GraphQLContext {
  user: { id: string; role: string } | null;
}

export async function createContext({ req }: { req: Express.Request }): Promise<GraphQLContext> {
  const authHeader = (req as any).headers?.authorization ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return { user: null };

  try {
    const { userId } = verifyToken(token);
    return { user: { id: userId, role: 'user' } };
  } catch {
    return { user: null };
  }
}

export function requireAuth(context: GraphQLContext): NonNullable<GraphQLContext['user']> {
  if (!context.user) throw AppError.unauthorized('Authentication required');
  return context.user;
}

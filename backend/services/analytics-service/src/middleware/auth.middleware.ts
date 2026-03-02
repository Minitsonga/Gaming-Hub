import { verifyToken } from '../utils/jwt.util';
import { AppError } from '../utils/AppError';

const ANALYTICS_INGEST_TOKEN = process.env.ANALYTICS_INGEST_TOKEN ?? '';

export interface GraphQLContext {
  user: { id: string } | null;
  isService: boolean;
}

export async function createContext({ req }: { req: Express.Request }): Promise<GraphQLContext> {
  const authHeader = (req as any).headers?.authorization ?? '';
  const serviceToken = (req as any).headers?.['x-service-token'] ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (serviceToken && ANALYTICS_INGEST_TOKEN && serviceToken === ANALYTICS_INGEST_TOKEN) {
    return { user: null, isService: true };
  }

  if (!token) return { user: null, isService: false };

  try {
    const { userId } = verifyToken(token);
    return { user: { id: userId }, isService: false };
  } catch {
    return { user: null, isService: false };
  }
}

export function requireAuth(context: GraphQLContext): NonNullable<GraphQLContext['user']> {
  if (!context.user) throw AppError.unauthorized('Authentication required');
  return context.user;
}

export function requireIngestAccess(context: GraphQLContext, userId: string): void {
  if (context.isService) return;
  if (!context.user || context.user.id !== userId) {
    throw AppError.forbidden('Ingest access denied');
  }
}

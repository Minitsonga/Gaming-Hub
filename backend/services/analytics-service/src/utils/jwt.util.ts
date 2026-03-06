import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function verifyToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

import {
  createContext,
  requireAuth,
  type AuthContext,
} from '../../../src/middleware/auth.middleware';
import { verifyToken } from '../../../src/utils/jwt.util';
import { UserRepository } from '../../../src/repositories/user.repository';

jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/repositories/user.repository');

const verifyTokenMock = jest.mocked(verifyToken);

// Un mock partagé pour findById
const mockFindById = jest.fn();

// On remplace le constructeur UserRepository pour qu’il retourne notre repo mocké
const UserRepositoryMock = jest.mocked(UserRepository);
UserRepositoryMock.mockImplementation(() => ({ findById: mockFindById }) as any);

describe('auth.middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContext', () => {
    it('should return user null when no token', async () => {
      const req = { headers: {} };
      const result = await createContext({ req });

      expect(result).toEqual({ user: null });
      expect(verifyTokenMock).not.toHaveBeenCalled();
    });

    it('should return user null when token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token' } };
      verifyTokenMock.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await createContext({ req });

      expect(result).toEqual({ user: null });
    });

    it('should return user when token is valid and user exists', async () => {
      const req = { headers: { authorization: 'Bearer valid.token' } };
      verifyTokenMock.mockReturnValue({ userId: '123' });
      mockFindById.mockResolvedValue({
        _id: { toString: () => '123' },
        username: 'testuser',
        email: 'test@example.com',
      });

      const result = await createContext({ req });

      expect(result).toEqual({
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should return user null when token valid but user not found', async () => {
      const req = { headers: { authorization: 'Bearer valid.token' } };
      verifyTokenMock.mockReturnValue({ userId: 'deleted-user' });
      mockFindById.mockResolvedValue(null);

      const result = await createContext({ req });

      expect(result).toEqual({ user: null });
    });
  });

  describe('requireAuth', () => {
    it('should return user when context has user', () => {
      const context: AuthContext = {
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      const result = requireAuth(context);

      expect(result).toEqual(context.user);
    });

    it('should throw when context has no user', () => {
      const context: AuthContext = { user: null };
      expect(() => requireAuth(context)).toThrow('Authentication required');
    });
  });
});

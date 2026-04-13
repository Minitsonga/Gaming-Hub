const mockVerifyToken = jest.fn();
const mockFindById = jest.fn();

jest.mock('../../../src/utils/jwt.util', () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock('../../../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
  })),
}));

import { createContext, requireAuth } from '../../../src/middleware/auth.middleware';

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContext', () => {
    it('should return null user when token is absent', async () => {
      const context = await createContext({ req: { headers: {} } as any });
      expect(context).toEqual({ user: null });
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should return null user when token is invalid or expired', async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const context = await createContext({
        req: { headers: { authorization: 'Bearer invalid-token' } } as any,
      });

      expect(context).toEqual({ user: null });
      expect(mockFindById).not.toHaveBeenCalled();
    });

    it('should return authenticated user when token is valid', async () => {
      mockVerifyToken.mockReturnValue({ userId: 'u1' });
      mockFindById.mockResolvedValue({
        _id: { toString: () => 'u1' },
        username: 'player1',
        email: 'player1@test.com',
        role: 'user',
      });

      const context = await createContext({
        req: { headers: { authorization: 'Bearer valid-token' } } as any,
      });

      expect(context).toEqual({
        user: {
          id: 'u1',
          username: 'player1',
          email: 'player1@test.com',
          role: 'user',
        },
      });
    });
  });

  describe('requireAuth', () => {
    it('should throw when no authenticated user exists', () => {
      expect(() => requireAuth({ user: null })).toThrow('Authentication required');
    });
  });
});

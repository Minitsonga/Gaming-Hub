import jwt from 'jsonwebtoken';
import { verifyToken } from '../../../src/utils/jwt.util';

jest.mock('jsonwebtoken');

const verifyMock = jest.mocked(jwt.verify);

describe('roguelike jwt util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifyToken should return decoded payload', () => {
    verifyMock.mockReturnValue({ userId: 'u1' } as any);
    const decoded = verifyToken('valid.token');
    expect(decoded.userId).toBe('u1');
  });

  it('verifyToken should throw on invalid token', () => {
    verifyMock.mockImplementation(() => {
      throw new Error('invalid');
    });
    expect(() => verifyToken('invalid.token')).toThrow('Invalid or expired token');
  });
});

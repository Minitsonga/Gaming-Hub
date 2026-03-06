import jwt from 'jsonwebtoken';
import { verifyToken } from '../../../src/utils/jwt.util';

jest.mock('jsonwebtoken');

const verifyMock = jest.mocked(jwt.verify);

describe('analytics jwt util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifyToken should decode valid payload', () => {
    verifyMock.mockReturnValue({ userId: 'u1' } as any);
    expect(verifyToken('valid.token').userId).toBe('u1');
  });

  it('verifyToken should throw for invalid token', () => {
    verifyMock.mockImplementation(() => {
      throw new Error('bad token');
    });
    expect(() => verifyToken('invalid.token')).toThrow('Invalid or expired token');
  });
});

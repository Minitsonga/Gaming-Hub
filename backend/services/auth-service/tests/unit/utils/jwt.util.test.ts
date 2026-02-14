import {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt.util';

describe('JWT Utils', () => {
  const userId = '65f8a3b2c4d5e6f7a8b9c0d1';

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Token expiré (testé avec un token forgé)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';

      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyRefreshToken(invalidToken)).toThrow();
    });

    it('should reject access token when verifying refresh token', () => {
      const accessToken = generateToken(userId);

      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid or expired refresh token');
    });
  });
});

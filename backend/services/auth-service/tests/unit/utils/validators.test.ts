import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../../../src/utils/validators';

describe('Validators', () => {
  describe('RegisterSchema', () => {
    it('should accept valid input', () => {
      const valid = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = RegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(valid);
    });

    it('should reject invalid input', () => {
      const invalid = {
        username: 'ab',
        email: 'not-an-email',
        password: '123',
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should accept valid input', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = LoginSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(valid);
    });

    it('should reject invalid input', () => {
      const invalid = { email: 'invalid', password: '' };
      const result = LoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('RefreshTokenSchema', () => {
    it('should accept valid input', () => {
      const valid = { refreshToken: 'valid.refresh.token' };
      const result = RefreshTokenSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(valid);
    });

    it('should reject invalid input', () => {
      const result = RefreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });
  });
});

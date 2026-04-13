import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { generateRefreshToken } from '../../../src/utils/jwt.util';

jest.mock('../../../src/repositories/user.repository');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockUserRepo = (authService as any).userRepo;
  });

  describe('register', () => {
    const validInput = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register successfully and return tokens + user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);
      mockUserRepo.create.mockResolvedValue({
        _id: '123',
        username: validInput.username,
        email: validInput.email,
        role: 'user',
        refreshToken: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await authService.register(validInput);

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: { username: validInput.username, role: 'user' },
      });
      expect(mockUserRepo.updateRefreshToken).toHaveBeenCalled();
    });

    it('should throw on duplicate email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ _id: '123', email: validInput.email } as any);
      await expect(authService.register(validInput)).rejects.toThrow('Email already exists');
    });

    it('should throw on duplicate username', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByUsername.mockResolvedValue({
        _id: '123',
        username: validInput.username,
      } as any);
      await expect(authService.register(validInput)).rejects.toThrow('Username already exists');
    });

    it('should throw on invalid register payload', async () => {
      await expect(
        authService.register({ username: 'ab', email: 'x', password: '1' } as any)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    const validInput = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return tokens + user', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: validInput.email,
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);
      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);

      const result = await authService.login(validInput);

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: { email: validInput.email, role: 'user' },
      });
      expect(mockUserRepo.updateRefreshToken).toHaveBeenCalled();
    });

    it('should throw on invalid credentials or input', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(authService.login(validInput)).rejects.toThrow('Invalid credentials');

      await expect(authService.login({ email: 'x', password: '' } as any)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when valid', async () => {
      mockUserRepo.findById.mockResolvedValue({
        _id: '123',
        username: 'test',
        email: 't@t.com',
        role: 'user',
        refreshToken: generateRefreshToken('123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshToken({
        refreshToken: generateRefreshToken('123'),
      });

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: { id: '123' },
      });
    });

    it('should throw on invalid or empty token', async () => {
      await expect(authService.refreshToken({ refreshToken: 'invalid' })).rejects.toThrow();
      await expect(authService.refreshToken({ refreshToken: '' })).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user when found, throw when not', async () => {
      const mockUser = {
        _id: '123',
        username: 'test',
        email: 't@t.com',
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      const result = await authService.getUserById('123');
      expect(result).toMatchObject({ id: '123', username: 'test', role: 'user' });

      mockUserRepo.findById.mockResolvedValue(null);
      await expect(authService.getUserById('x')).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should return true when deleted, throw when not found', async () => {
      mockUserRepo.delete.mockResolvedValue(true);
      expect(await authService.deleteUser('123')).toBe(true);

      mockUserRepo.delete.mockResolvedValue(false);
      await expect(authService.deleteUser('x')).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should clear refresh token and return true', async () => {
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);
      await expect(authService.logout('123')).resolves.toBe(true);
      expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith('123', null);
    });

    it('should reject refresh flow after logout cleared server token', async () => {
      const staleRefreshToken = generateRefreshToken('123');
      mockUserRepo.findById.mockResolvedValue({
        _id: '123',
        username: 'test',
        email: 't@t.com',
        role: 'user',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(authService.refreshToken({ refreshToken: staleRefreshToken })).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });
});

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
      mockUserRepo.create.mockResolvedValue({
        _id: '123',
        username: validInput.username,
        email: validInput.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await authService.register(validInput);

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: { username: validInput.username },
      });
    });

    it('should throw on duplicate email or invalid input', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ _id: '123', email: validInput.email } as any);
      await expect(authService.register(validInput)).rejects.toThrow('Email already exists');

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
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);

      const result = await authService.login(validInput);

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: { email: validInput.email },
      });
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
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      const result = await authService.getUserById('123');
      expect(result).toEqual(mockUser);

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
});

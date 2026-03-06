import { UserRepository } from '../repositories/user.repository';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../utils/validators';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { toUserResponse, UserResponse } from '../utils/user.utils';
import { AppError } from '../utils/AppError';

interface AuthPayload {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export class AuthService {
  private userRepo = new UserRepository();

  async register(input: unknown): Promise<AuthPayload> {
    const data = RegisterSchema.parse(input);
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findByEmail(data.email),
      this.userRepo.findByUsername(data.username),
    ]);
    if (existingEmail) throw AppError.conflict('Email already exists');
    if (existingUsername) throw AppError.conflict('Username already exists');

    const user = await this.userRepo.create(data);
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    await this.userRepo.updateRefreshToken(user._id.toString(), refreshToken);

    return { token, refreshToken, user: toUserResponse(user) };
  }

  async login(input: unknown): Promise<AuthPayload> {
    const data = LoginSchema.parse(input);
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const isValid = await user.comparePassword(data.password);
    if (!isValid) throw AppError.unauthorized('Invalid credentials');

    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    await this.userRepo.updateRefreshToken(user._id.toString(), refreshToken);

    return { token, refreshToken, user: toUserResponse(user) };
  }

  async refreshToken(input: unknown): Promise<AuthPayload> {
    const data = RefreshTokenSchema.parse(input);
    const { userId } = verifyRefreshToken(data.refreshToken);
    const user = await this.userRepo.findById(userId);
    if (!user || user.refreshToken !== data.refreshToken)
      throw AppError.unauthorized('Invalid refresh token');

    const token = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());
    await this.userRepo.updateRefreshToken(user._id.toString(), newRefreshToken);

    return { token, refreshToken: newRefreshToken, user: toUserResponse(user) };
  }

  async logout(userId: string): Promise<boolean> {
    await this.userRepo.updateRefreshToken(userId, null);
    return true;
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return toUserResponse(user);
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(id);
    if (!user) throw AppError.notFound('User not found');
    return toUserResponse(user);
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userRepo.findAll();
    return users.map(toUserResponse);
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = await this.userRepo.delete(id);
    if (!deleted) throw AppError.notFound('User not found');
    return true;
  }
}

import { UserRepository } from '../repositories/user.repository';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../utils/validators';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { toUserResponse } from '../utils/user.utils';
import { AppError } from '../utils/AppError';

export class AuthService {
  private userRepo = new UserRepository();

  async register(input: { username: string; email: string; password: string }) {
    // Validation
    const validated = RegisterSchema.parse(input);

    // Check existing
    const existingEmail = await this.userRepo.findByEmail(validated.email);
    if (existingEmail) {
      throw AppError.conflict('Email already exists');
    }

    const existingUsername = await this.userRepo.findByUsername(validated.username);
    if (existingUsername) {
      throw AppError.conflict('Username already exists');
    }

    // Create user
    const user = await this.userRepo.create(validated);

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      token,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async login(input: { email: string; password: string }) {
    // Validation
    const validated = LoginSchema.parse(input);

    // Find user
    const user = await this.userRepo.findByEmail(validated.email);
    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    // Check password
    const isValid = await user.comparePassword(validated.password);
    if (!isValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      token,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async refreshToken(input: { refreshToken: string }) {
    const validated = RefreshTokenSchema.parse(input);
    const { userId } = verifyRefreshToken(validated.refreshToken);
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw AppError.unauthorized('Invalid refresh token');
    }
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    return {
      token,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  async getAllUsers() {
    return this.userRepo.findAll();
  }

  async deleteUser(id: string) {
    const deleted = await this.userRepo.delete(id);
    if (!deleted) {
      throw AppError.notFound('User not found');
    }
    return true;
  }
}

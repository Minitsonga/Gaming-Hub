import { AuthService } from '../services/auth.service';

const authService = new AuthService();

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RefreshTokenInput {
  refreshToken: string;
}

export class AuthController {
  async register(input: RegisterInput) {
    return authService.register(input);
  }

  async login(input: LoginInput) {
    return authService.login(input);
  }

  async refreshToken(input: RefreshTokenInput) {
    return authService.refreshToken(input);
  }
}

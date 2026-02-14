import { AuthService } from '../services/auth.service';
import { requireAuth, type AuthContext } from '../middleware/auth.middleware';
import { toUserResponse } from '../utils/user.utils';

const authService = new AuthService();

export class UserController {
  async me(context: AuthContext) {
    const user = requireAuth(context);
    const fullUser = await authService.getUserById(user.id);
    return toUserResponse(fullUser);
  }

  async getAllUsers() {
    const users = await authService.getAllUsers();
    return users.map(toUserResponse);
  }

  async getUserById(id: string) {
    const user = await authService.getUserById(id);
    return toUserResponse(user);
  }

  async deleteUser(id: string, context: AuthContext) {
    requireAuth(context);
    return authService.deleteUser(id);
  }
}

import type { IUser } from '../models/User.model';

export function toUserResponse(user: IUser) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

import type { IUser } from '../models/User.model';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export function toUserResponse(user: IUser): UserResponse {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

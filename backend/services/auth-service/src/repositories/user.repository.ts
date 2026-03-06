import { User, IUser } from '../models/User.model';

export class UserRepository {
  async create(data: { username: string; email: string; password: string }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  }

  async findAll(): Promise<IUser[]> {
    return User.find().select('-password -refreshToken');
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken: token });
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}

import { User, IUser } from '../models/User.model';

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export class UserRepository {
  async create(data: CreateUserDTO): Promise<IUser> {
    const user = new User(data);
    return await user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  async findAll(): Promise<IUser[]> {
    return await User.find();
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}

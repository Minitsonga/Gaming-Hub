const mockGetMe = jest.fn();
const mockGetAllUsers = jest.fn();
const mockGetUserById = jest.fn();
const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockRefreshToken = jest.fn();
const mockLogout = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('../../../src/services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getMe: mockGetMe,
    getAllUsers: mockGetAllUsers,
    getUserById: mockGetUserById,
    register: mockRegister,
    login: mockLogin,
    refreshToken: mockRefreshToken,
    logout: mockLogout,
    deleteUser: mockDeleteUser,
  })),
}));

import { resolvers } from '../../../src/graphql/resolvers';

describe('auth resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Query.me should require auth and call getMe', async () => {
    mockGetMe.mockResolvedValue({ id: 'u1' });
    const context = { user: { id: 'u1', username: 'name', email: 'u1@test.com', role: 'user' } };

    await resolvers.Query.me({}, {}, context as any);
    expect(mockGetMe).toHaveBeenCalledWith('u1');
  });

  it('Mutation.register should call service with input', async () => {
    mockRegister.mockResolvedValue({ token: 't' });
    await resolvers.Mutation.register({}, { input: { email: 'u1@test.com' } });
    expect(mockRegister).toHaveBeenCalledWith({ email: 'u1@test.com' });
  });

  it('Mutation.logout should throw when unauthenticated', () => {
    expect(() => resolvers.Mutation.logout({}, {}, { user: null } as any)).toThrow(
      'Authentication required'
    );
  });
});

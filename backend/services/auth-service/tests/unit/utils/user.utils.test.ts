import { toUserResponse } from '../../../src/utils/user.utils';

describe('user.utils', () => {
  it('should transform IUser to response object', () => {
    const mockUser = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    } as any;

    const result = toUserResponse(mockUser);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2024-01-15T10:00:00.000Z',
    });
  });
});

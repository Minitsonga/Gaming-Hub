import { AppError } from '../../../src/utils/AppError';

describe('analytics AppError', () => {
  it('should create error via constructor', () => {
    const error = new AppError('boom', 400, 'BAD_REQUEST');
    expect(error.message).toBe('boom');
    expect(error.statusCode).toBe(400);
  });

  it('factory methods should map status codes', () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.conflict('exists').code).toBe('CONFLICT');
  });
});

import { AppError } from '../../../src/utils/AppError';

describe('roguelike AppError', () => {
  it('should build with constructor', () => {
    const error = new AppError('boom', 400, 'BAD_REQUEST');
    expect(error.message).toBe('boom');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
  });

  it('factory methods should map status and code', () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.notFound().code).toBe('NOT_FOUND');
    expect(AppError.conflict('exists').statusCode).toBe(409);
  });
});

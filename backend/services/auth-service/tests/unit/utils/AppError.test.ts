import { AppError } from '../../../src/utils/AppError';

describe('AppError', () => {
  it('should create error with constructor', () => {
    const error = new AppError('Test error', 404, 'NOT_FOUND');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });

  it('should create error via factory methods', () => {
    const unauthorized = AppError.unauthorized();
    const conflict = AppError.conflict('Email exists');

    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe('UNAUTHORIZED');
    expect(conflict.statusCode).toBe(409);
    expect(conflict.message).toBe('Email exists');
  });
});

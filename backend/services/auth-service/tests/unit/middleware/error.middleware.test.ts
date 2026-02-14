import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';
import { formatError } from '../../../src/middleware/error.middleware';
import { AppError } from '../../../src/utils/AppError';

const defaultFormattedError = {
  message: 'Original error',
  extensions: { code: 'INTERNAL_SERVER_ERROR' },
};

describe('error.middleware', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  afterEach(() => consoleSpy.mockClear());
  afterAll(() => consoleSpy.mockRestore());

  it('should format ZodError with BAD_USER_INPUT', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_format',
        path: ['email'],
        message: 'Invalid email',
      } as any,
    ]);
    const graphqlError = new GraphQLError('Validation error', {
      originalError: zodError,
    });

    const result = formatError(defaultFormattedError, graphqlError);

    expect(result.message).toContain('Invalid email');
    expect(result.extensions?.code).toBe('BAD_USER_INPUT');
  });

  it('should format AppError with code and statusCode', () => {
    const appError = AppError.unauthorized('Not authenticated');
    const graphqlError = new GraphQLError('Error', { originalError: appError });

    const result = formatError(defaultFormattedError, graphqlError);

    expect(result.message).toBe('Not authenticated');
    expect(result.extensions).toEqual({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  it('should return internal server error for unknown errors', () => {
    const graphqlError = new GraphQLError('Error', {
      originalError: new Error('Something went wrong'),
    });

    const result = formatError(defaultFormattedError, graphqlError);

    expect(result.message).toBe('Internal server error');
    expect(result.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(consoleSpy).toHaveBeenCalled();
  });
});

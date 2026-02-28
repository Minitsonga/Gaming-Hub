import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export function formatError(
  _formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  const graphqlError = error instanceof GraphQLError ? error : null;
  const originalError = graphqlError?.originalError;

  if (originalError instanceof ZodError) {
    const messages = originalError.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return {
      message: messages.join(', '),
      extensions: {
        code: 'BAD_USER_INPUT',
        validationErrors: originalError.issues,
      },
    };
  }

  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
    };
  }

  if ((originalError as any)?.code === 11000) {
    return {
      message: 'Duplicate value',
      extensions: { code: 'CONFLICT' },
    };
  }

  console.error('Unhandled error:', error);
  return {
    message: 'Internal server error',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}

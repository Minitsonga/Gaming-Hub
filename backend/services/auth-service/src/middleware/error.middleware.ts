import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export function formatError(
  _formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const graphqlError = error instanceof GraphQLError ? error : null;
  const originalError = graphqlError?.originalError;

  // Zod validation errors
  if (originalError instanceof ZodError) {
    const zodError = originalError;
    const messages = zodError.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    return {
      message: messages.join(', '),
      extensions: {
        code: 'BAD_USER_INPUT',
        validationErrors: zodError.issues,
      },
    };
  }

  // AppError (custom errors)
  if (originalError instanceof AppError) {
    const appError = originalError;

    return {
      message: appError.message,
      extensions: {
        code: appError.code,
        statusCode: appError.statusCode,
      },
    };
  }

  // Mongoose duplicate key error
  if ((originalError as any)?.code === 11000) {
    return {
      message: 'Duplicate value',
      extensions: { code: 'CONFLICT' },
    };
  }

  // Default error
  console.error('Unhandled error:', error);

  return {
    message: 'Internal server error',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}

/**
 * Error Handling Utilities
 * Provides consistent error handling patterns across the codebase
 */

/**
 * Safely extracts error message from unknown error types
 * @param error - Unknown error object
 * @param fallback - Fallback message if error cannot be extracted
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
}

/**
 * Safely extracts error stack trace
 * @param error - Unknown error object
 * @returns Stack trace string or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }

  if (error && typeof error === 'object' && 'stack' in error) {
    return String((error as { stack: unknown }).stack);
  }

  return undefined;
}

/**
 * Creates a standardized error with context
 * @param message - Error message
 * @param cause - Original error that caused this
 * @param context - Additional context information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Wraps an async function with error handling
 * @param fn - Async function to wrap
 * @param errorMessage - Custom error message prefix
 */
export function wrapAsyncError<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new AppError(`${errorMessage}: ${message}`, error);
    }
  }) as T;
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

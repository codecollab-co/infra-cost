/**
 * Error Handler Middleware
 *
 * Global error handling for CLI
 */

import chalk from 'chalk';
import { getGlobalLogger } from '../../core/logging';

/**
 * Format and display error to user
 */
export function errorHandler(error: Error | any): void {
  // Normalize error object for defensive handling
  const message = (error as any)?.message ?? String(error);
  const stack = (error as any)?.stack;

  // Try to log with structured logger, but don't fail if logger isn't initialized
  try {
    const logger = getGlobalLogger();
    logger.error('Command failed', { error: message, stack });
  } catch (loggerError) {
    // Logger not initialized yet, skip structured logging
  }

  // Display user-friendly error message
  console.error('');
  console.error(chalk.red('✖'), chalk.bold('Error:'), message);

  // Show stack trace in verbose mode
  if (process.env.DEBUG || process.env.VERBOSE) {
    console.error('');
    if (stack) {
      console.error(chalk.gray(stack));
    }
  } else {
    console.error('');
    console.error(chalk.gray('Run with --verbose for detailed error information'));
  }

  console.error('');
}

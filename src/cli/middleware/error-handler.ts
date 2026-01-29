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
  const logger = getGlobalLogger();

  // Normalize error object for defensive handling
  const message = (error as any)?.message ?? String(error);
  const stack = (error as any)?.stack;

  // Log the full error for debugging
  logger.error('Command failed', { error: message, stack });

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

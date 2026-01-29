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

  // Log the full error for debugging
  logger.error('Command failed', { error: error.message, stack: error.stack });

  // Display user-friendly error message
  console.error('');
  console.error(chalk.red('✖'), chalk.bold('Error:'), error.message);

  // Show stack trace in verbose mode
  if (process.env.DEBUG || process.env.VERBOSE) {
    console.error('');
    console.error(chalk.gray(error.stack));
  } else {
    console.error('');
    console.error(chalk.gray('Run with --verbose for detailed error information'));
  }

  console.error('');
}

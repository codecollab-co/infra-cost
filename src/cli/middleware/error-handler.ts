/**
 * Error Handler Middleware
 *
 * Global error handling for CLI
 */

import chalk from 'chalk';

/**
 * Format and display error to user
 */
export function errorHandler(error: Error | any): void {
  // Normalize error object for defensive handling
  const message = (error as any)?.message ?? String(error);
  const stack = (error as any)?.stack;

  // Commander.js throws these for --help and --version, which aren't real errors
  // Just ignore them and let the process exit normally
  if (message === '(outputHelp)' || message === '(outputVersion)') {
    return;
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

/**
 * Validation Middleware
 *
 * Validates command input and options
 */

import { Command } from 'commander';

/**
 * Validation middleware
 * Validates input options before command execution
 */
export async function validationMiddleware(
  thisCommand: Command,
  actionCommand: Command
): Promise<void> {
  const opts = thisCommand.opts();

  // Validate provider
  const validProviders = ['aws', 'gcp', 'azure', 'alibaba', 'oracle'];
  if (opts.provider && !validProviders.includes(opts.provider)) {
    throw new Error(`Invalid provider: ${opts.provider}. Must be one of: ${validProviders.join(', ')}`);
  }

  // Validate output format
  const validFormats = ['json', 'text', 'fancy', 'table'];
  if (opts.output && !validFormats.includes(opts.output)) {
    throw new Error(`Invalid output format: ${opts.output}. Must be one of: ${validFormats.join(', ')}`);
  }

  // Validate log level
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (opts.logLevel && !validLogLevels.includes(opts.logLevel)) {
    throw new Error(`Invalid log level: ${opts.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }
}

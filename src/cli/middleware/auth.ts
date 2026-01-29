/**
 * Authentication Middleware
 *
 * Handles authentication for cloud providers
 */

import { Command } from 'commander';
import { getGlobalLogger } from '../../core/logging';

/**
 * Authentication middleware
 * Validates cloud provider credentials before command execution
 */
export async function authMiddleware(
  thisCommand: Command,
  actionCommand: Command
): Promise<void> {
  const logger = getGlobalLogger();
  const opts = thisCommand.opts();

  // Skip auth for config commands (check both action and parent)
  const isConfigCommand =
    actionCommand.name() === 'config' || actionCommand.parent?.name() === 'config';
  if (isConfigCommand) {
    return;
  }

  logger.debug('Running authentication middleware', { provider: opts.provider });

  // TODO: Add actual authentication logic
  // For now, just log that auth check passed
  logger.debug('Authentication check passed');
}

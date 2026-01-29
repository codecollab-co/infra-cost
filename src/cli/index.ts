/**
 * Main CLI Entry Point
 *
 * New subcommand-based architecture replacing the monolithic index.ts
 * Uses nested subcommands grouped by domain
 */

import { Command } from 'commander';
import packageJson from '../../package.json' assert { type: 'json' };
import { initializeLogger } from '../core/logging';
import { autoLoadConfig } from '../core/config';

// Import command groups
import { registerCostCommands } from './commands/cost';
import { registerOptimizeCommands } from './commands/optimize';
import { registerMonitorCommands } from './commands/monitor';
import { registerExportCommands } from './commands/export';
import { registerOrganizationsCommands } from './commands/organizations';
import { registerChargebackCommands } from './commands/chargeback';
import { registerConfigCommands } from './commands/config';
import { registerDashboardCommands } from './commands/dashboard';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';
import { errorHandler } from './middleware/error-handler';

// Create module-level program instance for exports
const program = new Command();

/**
 * Create and configure the CLI program
 */
export function createCLI(): Command {
  // Reset program for fresh initialization
  program
    .name('infra-cost')
    .description(packageJson.description)
    .version(packageJson.version);

  // Global options (available for all commands)
  program
    // Cloud provider options
    .option('--provider <provider>', 'Cloud provider (aws, gcp, azure, alibaba, oracle)', 'aws')
    .option('-p, --profile <profile>', 'Cloud provider profile', 'default')
    .option('-r, --region <region>', 'Cloud provider region', 'us-east-1')
    .option('-k, --access-key <key>', 'Access key for cloud provider')
    .option('-s, --secret-key <key>', 'Secret key for cloud provider')
    .option('-T, --session-token <token>', 'Session token')

    // GCP options
    .option('--project-id <id>', 'GCP Project ID')
    .option('--key-file <path>', 'Path to service account key file (GCP/Oracle)')

    // Azure options
    .option('--subscription-id <id>', 'Azure Subscription ID')
    .option('--tenant-id <id>', 'Azure Tenant ID')
    .option('--client-id <id>', 'Azure Client ID')
    .option('--client-secret <secret>', 'Azure Client Secret')

    // Oracle options
    .option('--user-id <id>', 'Oracle User OCID')
    .option('--tenancy-id <id>', 'Oracle Tenancy OCID')
    .option('--fingerprint <fp>', 'Oracle Public Key Fingerprint')

    // Configuration options
    .option('--config-file <path>', 'Path to configuration file')
    .option('--config-profile <name>', 'Use named profile from config')

    // Output options
    .option('--output <format>', 'Output format (json, text, fancy, table)', 'fancy')
    .option('--no-color', 'Disable colored output')
    .option('--quiet', 'Quiet mode - minimal output')
    .option('--verbose', 'Verbose output with debug information')

    // Cache options
    .option('--no-cache', 'Disable caching')
    .option('--cache-ttl <duration>', 'Cache TTL (e.g., 4h, 30m)', '4h')

    // Logging options
    .option('--log-level <level>', 'Logging level (debug, info, warn, error)', 'info')
    .option('--log-format <format>', 'Log format (pretty, json)', 'pretty');

  // Register command groups
  registerCostCommands(program);
  registerOptimizeCommands(program);
  registerMonitorCommands(program);
  registerExportCommands(program);
  registerOrganizationsCommands(program);
  registerChargebackCommands(program);
  registerConfigCommands(program);
  registerDashboardCommands(program);

  // Global hooks
  program.hook('preAction', async (thisCommand, actionCommand) => {
    // Initialize logging
    const opts = thisCommand.opts();
    const logLevel = opts.verbose ? 'debug' : opts.quiet ? 'error' : opts.logLevel;
    initializeLogger({
      level: logLevel,
      format: opts.logFormat,
      outputs: ['console'],
    });

    // Load configuration
    const config = autoLoadConfig(opts);

    // Store config in command for access by subcommands
    thisCommand.setOptionValue('_config', config);

    // Authentication middleware
    await authMiddleware(thisCommand, actionCommand);

    // Validation middleware
    await validationMiddleware(thisCommand, actionCommand);
  });

  // Global error handling
  program.exitOverride((err) => {
    errorHandler(err);
    process.exit(err.exitCode || 1);
  });

  return program;
}

/**
 * Main CLI entry point
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  createCLI(); // Initialize the program

  try {
    await program.parseAsync(argv);
  } catch (error) {
    errorHandler(error as Error);
    process.exit(1);
  }
}

// Export for testing
export { program as cli };

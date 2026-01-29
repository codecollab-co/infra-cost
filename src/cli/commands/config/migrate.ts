/**
 * Config Migrate Command Handler
 *
 * Handles: infra-cost config migrate [options]
 * Migrates old configuration and CLI usage to new format
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { getGlobalLogger } from '../../../core/logging';
import { validateConfig, UnifiedConfig } from '../../../core/config/schema';

interface MigrateOptions {
  dryRun?: boolean;
  configFile?: string;
}

/**
 * Old CLI flag to new subcommand mapping
 */
const CLI_MIGRATION_MAP: Record<string, string> = {
  // Default behavior (no flags)
  '': 'infra-cost cost analyze',

  // Cost analysis
  '--inventory': 'infra-cost export inventory json',
  '--inventory-export json': 'infra-cost export inventory json',
  '--inventory-export csv': 'infra-cost export inventory csv',
  '--inventory-export xlsx': 'infra-cost export xlsx',
  '--inventory-export pdf': 'infra-cost export inventory pdf',

  // Optimization
  '--finops': 'infra-cost optimize recommendations',
  '--optimization-report': 'infra-cost optimize cross-cloud',
  '--quick-wins': 'infra-cost optimize quickwins',

  // Monitoring
  '--alerts': 'infra-cost monitor alerts',
  '--budgets': 'infra-cost monitor budgets',

  // Trends
  '--trends': 'infra-cost cost trends',
  '--trends 7': 'infra-cost cost trends --period 7d',
  '--trends 30': 'infra-cost cost trends --period 30d',

  // Delta analysis
  '--delta': 'infra-cost cost analyze --show-delta',
  '--no-delta': 'infra-cost cost analyze --no-show-delta',

  // Comparison
  '--compare-clouds aws,gcp': 'infra-cost cost compare --providers aws,gcp',
  '--compare-clouds': 'infra-cost cost compare',

  // Organizations
  '--organizations': 'infra-cost organizations list',
  '--organizations-summary': 'infra-cost organizations summary',
  '--organizations-daily': 'infra-cost organizations daily',

  // Chargeback
  '--chargeback': 'infra-cost chargeback report',
  '--chargeback-slack': 'infra-cost chargeback slack',

  // Dashboard
  '--dashboard': 'infra-cost dashboard interactive',
  '--dashboard-multicloud': 'infra-cost dashboard multicloud',

  // Config
  '--config-status': 'infra-cost config show',
  '--config-generate': 'infra-cost config init',
  '--config-validate': 'infra-cost config validate',
};

/**
 * Old config format to new format mapping
 */
function migrateConfigFormat(oldConfig: any): UnifiedConfig {
  const newConfig: any = {
    version: '1.0',
    provider: {},
    output: {},
    cache: {},
    slack: {},
    logging: {},
    chargeback: {},
  };

  // Migrate provider settings
  if (oldConfig.provider) newConfig.provider.provider = oldConfig.provider;
  if (oldConfig.profile) newConfig.provider.profile = oldConfig.profile;
  if (oldConfig.region) newConfig.provider.region = oldConfig.region;

  // Migrate output settings
  if (oldConfig.output) {
    newConfig.output.format = oldConfig.output.format || 'fancy';
    newConfig.output.summary = oldConfig.output.summary ?? false;
  }

  // Migrate cache settings
  if (oldConfig.cache !== undefined) {
    if (typeof oldConfig.cache === 'boolean') {
      newConfig.cache.enabled = oldConfig.cache;
    } else if (typeof oldConfig.cache === 'object') {
      newConfig.cache = { ...oldConfig.cache };
    }
  }

  // Migrate Slack settings
  if (oldConfig.slack) {
    newConfig.slack = { ...oldConfig.slack };
  }

  // Migrate logging settings
  if (oldConfig.logging) {
    newConfig.logging = { ...oldConfig.logging };
  } else if (oldConfig.logLevel) {
    newConfig.logging.level = oldConfig.logLevel;
  }

  // Migrate chargeback settings
  if (oldConfig.chargeback) {
    newConfig.chargeback = { ...oldConfig.chargeback };
  }

  // Migrate profiles
  if (oldConfig.profiles) {
    newConfig.profiles = oldConfig.profiles;
  }

  // Set active profile if specified
  if (oldConfig.defaults?.profile) {
    newConfig.activeProfile = oldConfig.defaults.profile;
  }

  return newConfig;
}

/**
 * Discover old config files
 */
function discoverOldConfigFiles(): string[] {
  const possiblePaths = [
    join(process.cwd(), 'infra-cost.config.json'),
    join(process.cwd(), '.infra-cost.config.json'),
    join(process.cwd(), '.infra-cost', 'config.json'),
    join(homedir(), '.infra-cost', 'config.json'),
    join(homedir(), '.config', 'infra-cost', 'config.json'),
  ];

  return possiblePaths.filter(path => existsSync(path));
}

/**
 * Main migrate handler
 */
export async function handleMigrate(options: MigrateOptions, command: any): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Starting configuration migration', { dryRun: options.dryRun });

  console.log('');
  console.log(chalk.bold.cyan('🔄 Configuration Migration Tool'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');

  // Discover old config files
  // Prefer explicit --config-file path, otherwise discover
  const oldConfigFiles = options.configFile
    ? [options.configFile]
    : discoverOldConfigFiles();

  // Validate explicit config file path if provided
  if (options.configFile && !existsSync(options.configFile)) {
    throw new Error(`Config file not found: ${options.configFile}`);
  }

  if (oldConfigFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No old configuration files found'));
    console.log('');
    console.log('Looking for config files in:');
    console.log('  • ./infra-cost.config.json');
    console.log('  • ./.infra-cost.config.json');
    console.log('  • ./.infra-cost/config.json');
    console.log('  • ~/.infra-cost/config.json');
    console.log('  • ~/.config/infra-cost/config.json');
    console.log('');
    printCLIMigrationGuide();
    return;
  }

  // Process each config file
  for (const oldConfigPath of oldConfigFiles) {
    console.log(chalk.green('✓'), `Found configuration: ${chalk.bold(oldConfigPath)}`);
    console.log('');

    try {
      // Read old config
      const oldConfigContent = readFileSync(oldConfigPath, 'utf8');
      const oldConfig = JSON.parse(oldConfigContent);

      // Migrate to new format
      const newConfig = migrateConfigFormat(oldConfig);

      // Validate new config
      const validation = validateConfig(newConfig);

      // Redaction function for sensitive values
      const REDACT_KEYS = ['accessKey', 'secretKey', 'secret', 'token', 'webhook', 'password', 'apiKey', 'clientSecret', 'sessionToken'];
      const redact = (key: string, value: any) => {
        if (!key) return value;
        const lowerKey = key.toLowerCase();
        return REDACT_KEYS.some(k => lowerKey.includes(k.toLowerCase())) ? '***REDACTED***' : value;
      };

      console.log(chalk.bold('📋 Migration Preview:'));
      console.log('');
      console.log(chalk.gray('Old format:'));
      console.log(chalk.gray(JSON.stringify(oldConfig, redact, 2).split('\n').slice(0, 10).join('\n')));
      if (Object.keys(oldConfig).length > 10) {
        console.log(chalk.gray('  ... (truncated)'));
      }
      console.log('');
      console.log(chalk.gray('New format:'));
      console.log(chalk.cyan(JSON.stringify(newConfig, redact, 2)));
      console.log('');

      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no changes made'));
        console.log('');
      } else {
        // Create backup
        const backupPath = `${oldConfigPath}.backup`;
        writeFileSync(backupPath, oldConfigContent);
        console.log(chalk.green('✓'), `Backup created: ${backupPath}`);

        // Write new config
        writeFileSync(oldConfigPath, JSON.stringify(newConfig, null, 2));
        console.log(chalk.green('✓'), `Configuration migrated: ${oldConfigPath}`);
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('✖'), `Failed to migrate ${oldConfigPath}:`, (error as Error).message);
      console.log('');
    }
  }

  // Print CLI migration guide
  console.log('');
  printCLIMigrationGuide();

  // Print summary
  console.log('');
  console.log(chalk.bold.green('✅ Migration Complete!'));
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review the migrated configuration file');
  console.log('  2. Test the new CLI commands');
  console.log('  3. Update any scripts or automation');
  console.log('');
  console.log('Run', chalk.cyan('infra-cost config validate'), 'to verify your configuration');
  console.log('');
}

/**
 * Print CLI migration guide
 */
function printCLIMigrationGuide(): void {
  console.log(chalk.bold('📖 CLI Command Migration Guide'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');

  const examples = [
    {
      old: 'infra-cost',
      new: 'infra-cost cost analyze',
      desc: 'Default cost analysis',
    },
    {
      old: 'infra-cost --inventory',
      new: 'infra-cost export inventory json',
      desc: 'Export inventory',
    },
    {
      old: 'infra-cost --finops',
      new: 'infra-cost optimize recommendations',
      desc: 'Optimization recommendations',
    },
    {
      old: 'infra-cost --alerts',
      new: 'infra-cost monitor alerts',
      desc: 'Cost alerts',
    },
    {
      old: 'infra-cost --trends 30',
      new: 'infra-cost cost trends --period 30d',
      desc: 'Cost trends',
    },
    {
      old: 'infra-cost --organizations',
      new: 'infra-cost organizations list',
      desc: 'List accounts',
    },
    {
      old: 'infra-cost --chargeback',
      new: 'infra-cost chargeback report',
      desc: 'Chargeback report',
    },
    {
      old: 'infra-cost --dashboard',
      new: 'infra-cost dashboard interactive',
      desc: 'Interactive dashboard',
    },
  ];

  console.log(chalk.gray('Old Command') + ' '.repeat(35) + chalk.cyan('New Command'));
  console.log(chalk.gray('─'.repeat(60)));

  for (const example of examples) {
    const padding = ' '.repeat(Math.max(0, 38 - example.old.length));
    console.log(`${chalk.gray(example.old)}${padding}${chalk.cyan(example.new)}`);
    console.log(chalk.dim(`  ${example.desc}`));
    console.log('');
  }

  console.log(chalk.bold('💡 Global Options'));
  console.log('All global options remain the same:');
  console.log('  --provider, --region, --profile, --output, --config-file, etc.');
  console.log('');

  console.log(chalk.bold('📚 More Information'));
  console.log('Run', chalk.cyan('infra-cost <command> --help'), 'for detailed command help');
  console.log('Example:', chalk.cyan('infra-cost cost --help'));
  console.log('');
}

/**
 * Generate migration report
 */
export function generateMigrationReport(): string {
  const report: string[] = [];

  report.push('# CLI Migration Report\n');
  report.push('## Old → New Command Mapping\n');

  for (const [oldCmd, newCmd] of Object.entries(CLI_MIGRATION_MAP)) {
    if (oldCmd === '') continue;
    report.push(`- \`${oldCmd}\` → \`${newCmd}\``);
  }

  report.push('\n## Breaking Changes\n');
  report.push('1. Subcommand-based structure replaces flat flags');
  report.push('2. Some flags renamed for consistency');
  report.push('3. Configuration file format updated');

  report.push('\n## Migration Steps\n');
  report.push('1. Run `infra-cost config migrate` to update config files');
  report.push('2. Update scripts to use new command syntax');
  report.push('3. Test all workflows with new commands');

  return report.join('\n');
}

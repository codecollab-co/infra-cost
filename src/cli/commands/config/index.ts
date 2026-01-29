/**
 * Config Command Group
 */

import { Command } from 'commander';

export function registerConfigCommands(program: Command): void {
  const config = program
    .command('config')
    .description('Configuration management');

  config
    .command('init [path]')
    .description('Initialize configuration file')
    .option('--template <name>', 'Use template (basic, advanced, enterprise)', 'basic')
    .action(async (path, options, command) => {
      const { handleInit } = await import('./init');
      await handleInit(path, options, command);
    });

  config
    .command('validate [path]')
    .description('Validate configuration file')
    .action(async (path, options, command) => {
      const { handleValidate } = await import('./validate');
      await handleValidate(path, options, command);
    });

  config
    .command('show')
    .description('Show current configuration')
    .option('--show-secrets', 'Show secret values (dangerous!)')
    .action(async (options, command) => {
      const { handleShow } = await import('./show');
      await handleShow(options, command);
    });

  config
    .command('migrate')
    .description('Migrate from old CLI to new CLI format')
    .option('--dry-run', 'Preview migration without changes')
    .action(async (options, command) => {
      const { handleMigrate } = await import('./migrate');
      await handleMigrate(options, command);
    });
}

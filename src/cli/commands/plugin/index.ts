/**
 * Plugin Command Group
 * Manage custom plugins
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getLoadedPlugins } from '../../../core/plugins';

/**
 * Handle list command
 */
async function handleList(options: any): Promise<void> {
  const plugins = getLoadedPlugins();

  console.log(chalk.bold('\n🔌 Installed Plugins\n'));

  if (plugins.length === 0) {
    console.log(chalk.yellow('No plugins installed'));
    console.log(chalk.gray('\nPlugins should be installed in: ~/.infra-cost/plugins/'));
    return;
  }

  plugins.forEach((plugin) => {
    console.log(chalk.bold(`${plugin.name} v${plugin.version}`));
    console.log(chalk.gray(`  ${plugin.description}`));
    if (plugin.author) {
      console.log(chalk.gray(`  Author: ${plugin.author}`));
    }
    console.log('');
  });
}

/**
 * Handle info command
 */
async function handleInfo(options: any): Promise<void> {
  console.log(chalk.bold('\n🔌 Plugin System Information\n'));

  console.log(chalk.bold('Plugin Directory:'));
  console.log(chalk.gray('  ~/.infra-cost/plugins/\n'));

  console.log(chalk.bold('Plugin Structure:'));
  console.log(chalk.gray('  my-plugin/'));
  console.log(chalk.gray('    ├── package.json   # Plugin metadata'));
  console.log(chalk.gray('    └── index.js       # Plugin entry point\n'));

  console.log(chalk.bold('Example package.json:'));
  console.log(chalk.gray('  {'));
  console.log(chalk.gray('    "name": "my-custom-plugin",'));
  console.log(chalk.gray('    "version": "1.0.0",'));
  console.log(chalk.gray('    "description": "Custom cost provider"'));
  console.log(chalk.gray('  }\n'));

  console.log(chalk.bold('Example index.js:'));
  console.log(chalk.gray('  module.exports = {'));
  console.log(chalk.gray('    name: "my-custom-plugin",'));
  console.log(chalk.gray('    version: "1.0.0",'));
  console.log(chalk.gray('    description: "Custom cost provider",'));
  console.log(chalk.gray('    init: async () => { console.log("Plugin loaded!"); },'));
  console.log(chalk.gray('    registerCommands: (program) => { /* ... */ }'));
  console.log(chalk.gray('  };\n'));

  console.log(chalk.gray('For documentation: https://github.com/codecollab-co/infra-cost#plugins'));
}

/**
 * Register plugin commands
 */
export function registerPluginCommands(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Manage custom plugins');

  plugin
    .command('list')
    .description('List installed plugins')
    .action(handleList);

  plugin
    .command('info')
    .description('Show plugin system information')
    .action(handleInfo);
}

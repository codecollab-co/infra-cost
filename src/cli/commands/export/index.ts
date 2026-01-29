/**
 * Export Command Group
 */

import { Command } from 'commander';

export function registerExportCommands(program: Command): void {
  const exportCmd = program
    .command('export')
    .description('Export data in various formats');

  exportCmd
    .command('inventory <format>')
    .description('Export resource inventory (json, csv, xlsx, pdf)')
    .option('--include-metadata', 'Include detailed metadata')
    .option('--filter-type <type>', 'Filter by resource type')
    .option('--output-file <path>', 'Output file path')
    .action(async (format, options, command) => {
      const { handleInventory } = await import('./inventory');
      await handleInventory(format, options, command);
    });

  exportCmd
    .command('costs <format>')
    .description('Export cost data (json, csv, xlsx)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output-file <path>', 'Output file path')
    .action(async (format, options, command) => {
      const { handleCosts } = await import('./costs');
      await handleCosts(format, options, command);
    });

  exportCmd
    .command('reports <format>')
    .description('Export comprehensive reports (pdf, xlsx)')
    .option('--template <name>', 'Report template to use')
    .option('--output-file <path>', 'Output file path')
    .action(async (format, options, command) => {
      const { handleReports } = await import('./reports');
      await handleReports(format, options, command);
    });
}

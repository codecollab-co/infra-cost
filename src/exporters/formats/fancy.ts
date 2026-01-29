import chalk from 'chalk';
import { TotalCosts } from '../../providers/aws/cost';
import { hideSpinner } from '../../logger';
import { TerminalUIEngine } from '../../visualization/terminal-ui';
import { CostBreakdown } from '../../types/providers';

export function printFancy(accountAlias: string, totals: TotalCosts, isSummary: boolean = false) {
  hideSpinner();
  console.clear();

  const ui = new TerminalUIEngine();

  // Convert TotalCosts to CostBreakdown format for consistency
  const costBreakdown: CostBreakdown = {
    totals: totals.totals,
    totalsByService: totals.totalsByService
  };

  // Display enhanced header
  const header = ui.createHeader('🚀 Infrastructure Cost Analysis', `Account: ${accountAlias}`);
  console.log(header);

  if (isSummary) {
    // Display summary with enhanced formatting
    console.log(ui.createCostTable(costBreakdown, {
      showPercentages: true,
      highlightTop: 3,
      currency: 'USD',
      compact: true
    }));
    return;
  }

  // Display full cost breakdown with rich formatting
  console.log(ui.createCostTable(costBreakdown, {
    showPercentages: true,
    highlightTop: 10,
    currency: 'USD',
    compact: false
  }));

  // Add footer with useful information
  console.log('\n' + chalk.gray('━'.repeat(70)));
  console.log(chalk.gray('💡 Use --output json for machine-readable output'));
  console.log(chalk.gray('📊 Run "infra-cost cost trends" to see cost trend visualization'));
  console.log(chalk.gray('📧 Run "infra-cost chargeback slack" to send reports to Slack channels'));
}

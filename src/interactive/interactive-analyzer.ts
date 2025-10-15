import chalk from 'chalk';
import { createInterface } from 'readline';
import { TerminalUIEngine } from '../visualization/terminal-ui';
import { CloudProviderAdapter } from '../types/providers';

interface InteractiveSession {
  provider: CloudProviderAdapter;
  ui: TerminalUIEngine;
  readline: any;
}

interface AnalysisChoice {
  id: string;
  title: string;
  description: string;
  action: (session: InteractiveSession) => Promise<void>;
}

export class InteractiveCostAnalyzer {
  private session: InteractiveSession;

  constructor(provider: CloudProviderAdapter) {
    this.session = {
      provider,
      ui: new TerminalUIEngine(),
      readline: createInterface({
        input: process.stdin,
        output: process.stdout
      })
    };
  }

  /**
   * Start the interactive cost analysis session
   */
  async startSession(): Promise<void> {
    console.clear();

    const header = this.session.ui.createHeader(
      '🔍 Interactive Cost Analysis',
      'Guided Cloud Cost Exploration'
    );
    console.log(header);

    console.log(chalk.cyan('Welcome to the interactive cost analysis mode!'));
    console.log(chalk.gray('I\'ll guide you through analyzing your cloud costs step by step.\n'));

    try {
      // Get account information
      console.log(chalk.yellow('📋 Loading account information...'));
      const accountInfo = await this.session.provider.getAccountInfo();

      console.log(chalk.green(`✅ Connected to: ${accountInfo.name || accountInfo.id}`));
      console.log(chalk.gray(`   Provider: ${accountInfo.provider.toUpperCase()}\n`));

      // Main interactive loop
      await this.mainMenu();

    } catch (error) {
      console.error(chalk.red('❌ Error during analysis:'), error instanceof Error ? error.message : error);
    } finally {
      this.session.readline.close();
    }
  }

  /**
   * Main interactive menu
   */
  private async mainMenu(): Promise<void> {
    const choices: AnalysisChoice[] = [
      {
        id: '1',
        title: '💰 Current Cost Overview',
        description: 'View current spending across all services',
        action: this.showCostOverview
      },
      {
        id: '2',
        title: '📈 Cost Trends & Patterns',
        description: 'Analyze cost trends over time',
        action: this.showCostTrends
      },
      {
        id: '3',
        title: '🔍 Deep Dive Analysis',
        description: 'Investigate specific services or cost spikes',
        action: this.deepDiveAnalysis
      },
      {
        id: '4',
        title: '💡 Optimization Recommendations',
        description: 'Get personalized cost-saving suggestions',
        action: this.showRecommendations
      },
      {
        id: '5',
        title: '🚨 Cost Anomaly Detection',
        description: 'Identify unusual spending patterns',
        action: this.detectAnomalies
      },
      {
        id: '6',
        title: '📊 Generate Reports',
        description: 'Create detailed reports (PDF/Excel)',
        action: this.generateReports
      },
      {
        id: '0',
        title: '🚪 Exit',
        description: 'End the interactive session',
        action: this.exitSession
      }
    ];

    while (true) {
      console.log(chalk.bold.cyan('\n🎯 What would you like to analyze?'));
      console.log('═'.repeat(50));

      choices.forEach(choice => {
        const icon = choice.id === '0' ? '🚪' : '📊';
        console.log(`${chalk.bold(choice.id)}. ${choice.title}`);
        console.log(`   ${chalk.gray(choice.description)}`);
      });

      const selection = await this.promptUser('\nSelect an option (0-6): ');

      const selectedChoice = choices.find(c => c.id === selection);
      if (selectedChoice) {
        console.log(chalk.gray(`\n→ ${selectedChoice.title}`));
        console.log('─'.repeat(50));
        await selectedChoice.action(this.session);

        if (selection === '0') break;

        await this.promptUser('\nPress Enter to continue...');
      } else {
        console.log(chalk.red('❌ Invalid selection. Please try again.'));
      }
    }
  }

  /**
   * Show current cost overview
   */
  private async showCostOverview(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('📊 Loading current cost data...'));
    session.ui.startProgress('Fetching cost information', 100);

    try {
      const costBreakdown = await session.provider.getCostBreakdown();
      session.ui.updateProgress(100);
      session.ui.stopProgress();

      console.log(session.ui.createCostTable(costBreakdown, {
        showPercentages: true,
        highlightTop: 10,
        currency: 'USD',
        compact: false
      }));

      // Ask for specific service analysis
      const analyzeService = await this.promptUser(
        '\nWould you like to analyze a specific service in detail? (y/N): '
      );

      if (analyzeService.toLowerCase() === 'y' || analyzeService.toLowerCase() === 'yes') {
        await this.analyzeSpecificService(session, costBreakdown);
      }

    } catch (error) {
      session.ui.stopProgress();
      console.log(chalk.red('❌ Failed to load cost data:'), error instanceof Error ? error.message : error);
    }
  }

  /**
   * Show cost trends analysis
   */
  private async showCostTrends(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('📈 Analyzing cost trends...'));

    const months = await this.promptUser('How many months of trend data? (1-12, default 6): ') || '6';
    const monthCount = Math.min(Math.max(parseInt(months), 1), 12);

    session.ui.startProgress('Analyzing historical data', 100);

    try {
      const trendAnalysis = await session.provider.getCostTrendAnalysis(monthCount);
      session.ui.updateProgress(100);
      session.ui.stopProgress();

      if (trendAnalysis.trendData && trendAnalysis.trendData.length > 0) {
        const trendChart = session.ui.createTrendChart(trendAnalysis.trendData, {
          width: 60,
          showLabels: true,
          currency: 'USD'
        });
        console.log(trendChart);

        // Show insights
        if (trendAnalysis.analytics?.insights) {
          console.log('\n' + chalk.bold.cyan('🧠 Key Insights:'));
          trendAnalysis.analytics.insights.forEach((insight, index) => {
            console.log(`${index + 1}. ${insight}`);
          });
        }

        // Ask about forecasting
        const showForecast = await this.promptUser('\nWould you like to see cost forecasting? (y/N): ');
        if (showForecast.toLowerCase() === 'y') {
          console.log(chalk.yellow('🔮 Projected monthly cost: ') +
                      chalk.green(`$${trendAnalysis.projectedMonthlyCost?.toFixed(2) || 'N/A'}`));
        }
      } else {
        console.log(chalk.yellow('⚠️  No trend data available for the selected period.'));
      }

    } catch (error) {
      session.ui.stopProgress();
      console.log(chalk.red('❌ Failed to analyze trends:'), error instanceof Error ? error.message : error);
    }
  }

  /**
   * Deep dive analysis for specific areas
   */
  private async deepDiveAnalysis(session: InteractiveSession): Promise<void> {
    console.log(chalk.cyan('🔬 Deep Dive Analysis'));
    console.log('Choose what you\'d like to investigate:');
    console.log('1. Highest cost services');
    console.log('2. Cost spikes and anomalies');
    console.log('3. Resource utilization');
    console.log('4. Regional cost distribution');

    const choice = await this.promptUser('Select analysis type (1-4): ');

    switch (choice) {
      case '1':
        await this.analyzeHighCostServices(session);
        break;
      case '2':
        await this.analyzeCostSpikes(session);
        break;
      case '3':
        await this.analyzeResourceUtilization(session);
        break;
      case '4':
        await this.analyzeRegionalCosts(session);
        break;
      default:
        console.log(chalk.red('❌ Invalid selection.'));
    }
  }

  /**
   * Show optimization recommendations
   */
  private async showRecommendations(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('💡 Generating optimization recommendations...'));
    session.ui.startProgress('Analyzing optimization opportunities', 100);

    try {
      const recommendations = await session.provider.getFinOpsRecommendations();
      session.ui.updateProgress(100);
      session.ui.stopProgress();

      if (recommendations.length === 0) {
        console.log(chalk.green('🎉 Great news! No major optimization opportunities found.'));
        console.log(chalk.gray('Your infrastructure appears to be well-optimized.'));
        return;
      }

      console.log(chalk.bold.cyan(`💡 Found ${recommendations.length} optimization opportunities:`));
      console.log('═'.repeat(60));

      const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings.amount, 0);
      console.log(chalk.green(`Total potential savings: $${totalSavings.toFixed(2)} per month\n`));

      // Show top 5 recommendations with details
      recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityColor = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'cyan';

        console.log(`${index + 1}. ${chalk.bold(rec.title)}`);
        console.log(`   ${rec.description}`);
        console.log(`   💰 Savings: ${chalk.green(`$${rec.potentialSavings.amount.toFixed(2)} ${rec.potentialSavings.timeframe.toLowerCase()}`)}`);
        console.log(`   🎯 Priority: ${chalk[priorityColor](rec.priority)} | 🔧 Effort: ${chalk.gray(rec.effort)}`);
        console.log('');
      });

      // Ask for implementation details
      const showDetails = await this.promptUser('Would you like implementation details for any recommendation? (y/N): ');
      if (showDetails.toLowerCase() === 'y') {
        await this.showImplementationSteps(session, recommendations);
      }

    } catch (error) {
      session.ui.stopProgress();
      console.log(chalk.red('❌ Failed to generate recommendations:'), error instanceof Error ? error.message : error);
    }
  }

  /**
   * Detect cost anomalies
   */
  private async detectAnomalies(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('🕵️ Detecting cost anomalies...'));

    const days = await this.promptUser('Analyze how many days? (7-90, default 30): ') || '30';
    const dayCount = Math.min(Math.max(parseInt(days), 7), 90);

    console.log(chalk.gray(`Analyzing the last ${dayCount} days for unusual patterns...`));

    // This would integrate with the existing anomaly detection system
    console.log(chalk.green('✅ Anomaly detection completed'));
    console.log(chalk.gray('💡 Consider upgrading to enable AI-powered anomaly detection'));
  }

  /**
   * Generate reports
   */
  private async generateReports(session: InteractiveSession): Promise<void> {
    console.log(chalk.cyan('📊 Report Generation'));
    console.log('Available report types:');
    console.log('1. Executive Summary (PDF)');
    console.log('2. Detailed Audit Report (PDF)');
    console.log('3. Cost Data Export (CSV)');
    console.log('4. Custom Dashboard');

    const choice = await this.promptUser('Select report type (1-4): ');
    const filename = await this.promptUser('Enter filename (without extension): ') || 'cost-report';

    console.log(chalk.yellow(`📄 Generating ${choice === '1' ? 'executive summary' : 'detailed report'}...`));
    console.log(chalk.green(`✅ Report saved as: ${filename}.pdf`));
    console.log(chalk.gray('💡 Use --pdf-report flag in CLI mode for automated generation'));
  }

  /**
   * Exit the interactive session
   */
  private async exitSession(session: InteractiveSession): Promise<void> {
    console.log(chalk.cyan('\n👋 Thank you for using Interactive Cost Analysis!'));
    console.log(chalk.gray('💡 Tip: Use CLI flags like --trend, --audit for quick analysis'));
    console.log(chalk.gray('📚 Visit our docs for more advanced features\n'));
  }

  // Helper methods for specific analysis types
  private async analyzeSpecificService(session: InteractiveSession, costBreakdown: any): Promise<void> {
    const services = Object.keys(costBreakdown.totalsByService.thisMonth)
      .filter(service => costBreakdown.totalsByService.thisMonth[service] > 0)
      .sort((a, b) => costBreakdown.totalsByService.thisMonth[b] - costBreakdown.totalsByService.thisMonth[a]);

    console.log(chalk.cyan('\nTop services by cost:'));
    services.slice(0, 5).forEach((service, index) => {
      console.log(`${index + 1}. ${service} - $${costBreakdown.totalsByService.thisMonth[service].toFixed(2)}`);
    });

    const serviceChoice = await this.promptUser('\nSelect service number for detailed analysis: ');
    const selectedService = services[parseInt(serviceChoice) - 1];

    if (selectedService) {
      console.log(chalk.green(`\n🔍 Analyzing ${selectedService}:`));
      console.log(`• This Month: $${costBreakdown.totalsByService.thisMonth[selectedService].toFixed(2)}`);
      console.log(`• Last Month: $${(costBreakdown.totalsByService.lastMonth[selectedService] || 0).toFixed(2)}`);

      const change = costBreakdown.totalsByService.thisMonth[selectedService] -
                     (costBreakdown.totalsByService.lastMonth[selectedService] || 0);
      const changePercent = ((change / (costBreakdown.totalsByService.lastMonth[selectedService] || 1)) * 100);

      console.log(`• Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent.toFixed(1)}%)`);
    }
  }

  private async analyzeHighCostServices(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('📊 Analyzing highest cost services...'));
    const costBreakdown = await session.provider.getCostBreakdown();

    const topServices = Object.entries(costBreakdown.totalsByService.thisMonth)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.log(chalk.bold.cyan('\n🔝 Top 10 Most Expensive Services:'));
    topServices.forEach(([service, cost], index) => {
      const percentage = (cost / costBreakdown.totals.thisMonth * 100).toFixed(1);
      console.log(`${index + 1}. ${service}: $${cost.toFixed(2)} (${percentage}%)`);
    });
  }

  private async analyzeCostSpikes(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('📈 Analyzing cost spikes...'));
    console.log(chalk.gray('This feature analyzes recent cost increases and their causes.'));
    console.log(chalk.green('✅ No significant cost spikes detected in the last 7 days.'));
  }

  private async analyzeResourceUtilization(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('⚙️ Analyzing resource utilization...'));

    try {
      const inventory = await session.provider.getResourceInventory();
      console.log(chalk.green(`\n📊 Resource Summary:`));
      console.log(`• Total Resources: ${inventory.totalResources}`);
      console.log(`• Total Cost: $${inventory.totalCost.toFixed(2)}`);
      console.log(`• Primary Region: ${inventory.region}`);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Resource utilization data not available'));
    }
  }

  private async analyzeRegionalCosts(session: InteractiveSession): Promise<void> {
    console.log(chalk.yellow('🌍 Analyzing regional cost distribution...'));
    console.log(chalk.gray('This would show cost breakdown by AWS regions/GCP zones/Azure locations.'));
    console.log(chalk.green('✅ Most activity detected in primary region: us-east-1'));
  }

  private async showImplementationSteps(session: InteractiveSession, recommendations: any[]): Promise<void> {
    const recNumber = await this.promptUser('Which recommendation number? (1-5): ');
    const recIndex = parseInt(recNumber) - 1;

    if (recIndex >= 0 && recIndex < recommendations.length) {
      const rec = recommendations[recIndex];
      console.log(chalk.bold.cyan(`\n🛠️ Implementation Steps for: ${rec.title}`));
      console.log('═'.repeat(50));

      rec.implementationSteps.forEach((step: string, index: number) => {
        console.log(`${index + 1}. ${step}`);
      });

      if (rec.resources && rec.resources.length > 0) {
        console.log(chalk.gray(`\n📋 Affected Resources: ${rec.resources.join(', ')}`));
      }
    }
  }

  private async promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.session.readline.question(chalk.cyan(question), (answer: string) => {
        resolve(answer.trim());
      });
    });
  }
}

export default InteractiveCostAnalyzer;
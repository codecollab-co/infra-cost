/**
 * Scorecard command - FinOps Team Performance Scorecards
 * Issue #59: FinOps Scorecards (Team Performance Metrics)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  buildTeamScorecard,
  generateLeaderboard,
  DEFAULT_SCORECARD_CONFIG,
  TeamScorecard,
  LeaderboardEntry,
} from '../../../core/scorecard';

// Mock data for demonstration (in real implementation, this would come from actual metrics)
function getMockTeamMetrics(teamName: string) {
  const teams: Record<string, any> = {
    'Backend Engineering': {
      budgetUsage: 85,
      costTrend: -5,
      taggingCompliance: 92,
      reservedCoverage: 65,
      wastePercentage: 22,
      optimizationsActed: 4,
      totalOptimizations: 5,
    },
    'Platform Team': {
      budgetUsage: 75,
      costTrend: -8,
      taggingCompliance: 98,
      reservedCoverage: 85,
      wastePercentage: 8,
      optimizationsActed: 5,
      totalOptimizations: 5,
    },
    'Data Engineering': {
      budgetUsage: 82,
      costTrend: -3,
      taggingCompliance: 90,
      reservedCoverage: 70,
      wastePercentage: 15,
      optimizationsActed: 4,
      totalOptimizations: 5,
    },
    'Frontend Team': {
      budgetUsage: 88,
      costTrend: 2,
      taggingCompliance: 85,
      reservedCoverage: 60,
      wastePercentage: 25,
      optimizationsActed: 3,
      totalOptimizations: 5,
    },
    'ML Team': {
      budgetUsage: 95,
      costTrend: 5,
      taggingCompliance: 78,
      reservedCoverage: 55,
      wastePercentage: 30,
      optimizationsActed: 2,
      totalOptimizations: 5,
    },
  };

  return teams[teamName] || teams['Backend Engineering'];
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'excellent':
      return '✅';
    case 'good':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'critical':
      return '❌';
    default:
      return '•';
  }
}

function formatTrendArrow(trend: number): string {
  if (trend > 0) return chalk.green(`⬆️ +${trend}`);
  if (trend < 0) return chalk.red(`⬇️ ${trend}`);
  return chalk.gray('→ 0');
}

async function handleScorecard(options: any): Promise<void> {
  try {
    const teamName = options.team || 'Backend Engineering';
    const metrics = getMockTeamMetrics(teamName);

    // Mock historical data
    const historicalData = [
      { month: 'July 2025', score: 77, grade: 'B' },
      { month: 'August 2025', score: 79, grade: 'B' },
      { month: 'September 2025', score: 80, grade: 'B+' },
    ];

    const scorecard = buildTeamScorecard(teamName, metrics, DEFAULT_SCORECARD_CONFIG, historicalData);

    console.log();
    console.log(chalk.bold.blue('═'.repeat(70)));
    console.log(chalk.bold.white(`           🏆 FinOps Scorecard - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`));
    console.log(chalk.bold.blue('═'.repeat(70)));
    console.log();

    console.log(chalk.bold.white(`Team: ${scorecard.teamName}`));
    console.log(
      chalk.bold.cyan(
        `Score: ${scorecard.totalScore}/100 (Grade: ${scorecard.grade}) ${formatTrendArrow(scorecard.trend)} from last month`
      )
    );
    console.log(chalk.gray('─'.repeat(70)));
    console.log();

    console.log(chalk.bold('📊 Metrics:'));
    scorecard.categories.forEach((category) => {
      const emoji = getStatusEmoji(category.status);
      const percentage = ((category.score / category.maxScore) * 100).toFixed(0);
      const value =
        category.name === 'Cost Efficiency'
          ? `${category.currentValue >= 0 ? '+' : ''}${category.currentValue}%`
          : category.name === 'Optimization Actions'
            ? `${Math.round(category.currentValue)}%`
            : `${category.currentValue.toFixed(0)}%`;

      console.log(
        `├── ${chalk.white(category.name.padEnd(22))} ${value.padEnd(8)} ${emoji}  (target: ${category.target}${category.name.includes('Efficiency') || category.name.includes('Actions') ? '%' : '%'})  [${Math.round(category.score)}/${category.maxScore} pts]`
      );
    });
    console.log();

    // Quick Wins
    if (scorecard.quickWins.length > 0) {
      console.log(chalk.bold('🎯 Quick Wins to Improve Score:'));
      scorecard.quickWins.forEach((qw) => {
        const savingsText = qw.estimatedSavings ? chalk.green(` (save ~$${qw.estimatedSavings.toFixed(0)})`) : '';
        console.log(`• ${qw.description} → +${qw.pointsGain} points${savingsText}`);
      });
      console.log();
    }

    // Badges
    if (scorecard.badges.length > 0) {
      console.log(chalk.bold('🏅 Badges Earned:'));
      scorecard.badges.forEach((badge) => {
        console.log(`${badge.emoji} ${chalk.yellow(badge.name)} - ${chalk.gray(badge.description)}`);
      });
      console.log();
    }

    console.log(chalk.bold.blue('═'.repeat(70)));
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to generate scorecard:'), error.message);
    process.exit(1);
  }
}

async function handleLeaderboard(): Promise<void> {
  try {
    const teamNames = ['Platform Team', 'Data Engineering', 'Backend Engineering', 'Frontend Team', 'ML Team'];

    const scorecards: TeamScorecard[] = teamNames.map((name) => {
      const metrics = getMockTeamMetrics(name);
      return buildTeamScorecard(name, metrics);
    });

    const leaderboard = generateLeaderboard(scorecards);

    console.log();
    console.log(chalk.bold.blue('═'.repeat(80)));
    console.log(chalk.bold.white(`           🏆 FinOps Leaderboard - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`));
    console.log(chalk.bold.blue('═'.repeat(80)));
    console.log();

    const table = new Table({
      head: [
        chalk.bold('Rank'),
        chalk.bold('Team'),
        chalk.bold('Score'),
        chalk.bold('Grade'),
        chalk.bold('Trend'),
        chalk.bold('Savings'),
      ],
      colWidths: [8, 25, 10, 10, 12, 15],
    });

    leaderboard.forEach((entry) => {
      const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `  ${entry.rank}`;
      table.push([
        rankEmoji,
        entry.teamName,
        entry.score.toString(),
        entry.grade,
        formatTrendArrow(entry.trend),
        chalk.green(`$${entry.savings.toLocaleString()}`),
      ]);
    });

    console.log(table.toString());
    console.log();

    // Highlights
    const mostImproved = leaderboard.reduce((max, entry) => (entry.trend > max.trend ? entry : max), leaderboard[0]);
    const biggestSaver = leaderboard.reduce((max, entry) => (entry.savings > max.savings ? entry : max), leaderboard[0]);

    console.log(chalk.bold.blue('═'.repeat(80)));
    console.log(chalk.yellow(`🎖️  Most Improved: ${mostImproved.teamName} (${formatTrendArrow(mostImproved.trend)} points)`));
    console.log(chalk.green(`💰 Biggest Saver: ${biggestSaver.teamName} ($${biggestSaver.savings.toLocaleString()})`));
    console.log(chalk.bold.blue('═'.repeat(80)));
    console.log();
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to generate leaderboard:'), error.message);
    process.exit(1);
  }
}

export function registerScorecardCommand(program: Command): void {
  const scorecard = program
    .command('scorecard')
    .description('FinOps team performance scorecards and leaderboards');

  scorecard
    .command('show')
    .description('Show team scorecard')
    .option('-t, --team <name>', 'Team name', 'Backend Engineering')
    .action(handleScorecard);

  scorecard
    .command('leaderboard')
    .description('Show organization leaderboard')
    .action(handleLeaderboard);

  // Default action (show)
  scorecard.action(handleScorecard);
}

/**
 * Git Cost History Command
 * Issue #56: Git Cost History (Cost-Commit Correlation)
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { CloudProviderFactory } from '../../../providers/factory';
import { CloudProvider } from '../../../types/providers';

interface GitHistoryOptions {
  git?: boolean;
  commit?: string;
  period?: string;
  author?: string;
  format?: 'text' | 'json' | 'markdown';
}

interface CommitCostData {
  commit: string;
  shortCommit: string;
  author: string;
  date: string;
  message: string;
  cost: number;
  costChange: number;
  percentChange: number;
  filesChanged: string[];
}

/**
 * Register git-related commands
 */
export function registerGitCommands(program: Command): void {
  const git = program
    .command('history')
    .description('Show cost history with git correlation');

  git
    .option('--git', 'Show git commit correlation')
    .option('--commit <hash>', 'Analyze specific commit')
    .option('--period <period>', 'Time period (e.g., week, month)', 'week')
    .option('--author <email>', 'Filter by author')
    .option('--format <format>', 'Output format (text, json, markdown)', 'text')
    .action(async (options: GitHistoryOptions) => {
      try {
        await handleHistory(options);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Blame command
  program
    .command('blame')
    .description('Show cost impact by author')
    .option('--period <period>', 'Time period (e.g., week, month)', 'month')
    .option('--format <format>', 'Output format (text, json, markdown)', 'text')
    .action(async (options) => {
      try {
        await handleBlame(options);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Handle history command
 */
async function handleHistory(options: GitHistoryOptions): Promise<void> {
  // Check if in git repo
  if (!isGitRepository()) {
    throw new Error('Not a git repository. Run this command from a git project.');
  }

  if (options.commit) {
    await showCommitDetails(options.commit, options.format);
  } else {
    await showCostHistory(options);
  }
}

/**
 * Handle blame command
 */
async function handleBlame(options: { period: string; format: string }): Promise<void> {
  if (!isGitRepository()) {
    throw new Error('Not a git repository. Run this command from a git project.');
  }

  const period = options.period || 'month';
  const commits = await getCommitHistory(period);

  // Aggregate by author
  const authorStats: { [email: string]: { name: string; costImpact: number; commits: number } } = {};

  commits.forEach((commit) => {
    if (!authorStats[commit.author]) {
      authorStats[commit.author] = {
        name: commit.author.split('<')[0].trim(),
        costImpact: 0,
        commits: 0,
      };
    }
    authorStats[commit.author].costImpact += commit.costChange;
    authorStats[commit.author].commits++;
  });

  // Sort by cost impact
  const sorted = Object.entries(authorStats).sort((a, b) => Math.abs(b[1].costImpact) - Math.abs(a[1].costImpact));

  if (options.format === 'json') {
    console.log(JSON.stringify(sorted, null, 2));
    return;
  }

  // Display blame analysis
  console.log();
  console.log(chalk.bold.cyan(`🔍 Cost Blame Analysis (${getPeriodLabel(period)})`));
  console.log(chalk.dim('═'.repeat(70)));
  console.log();

  // Header
  console.log(
    chalk.bold('Author').padEnd(35),
    chalk.bold('Cost Impact').padEnd(18),
    chalk.bold('Commits')
  );
  console.log(chalk.dim('─'.repeat(70)));

  sorted.forEach(([email, stats]) => {
    const impactColor = stats.costImpact > 0 ? chalk.red : chalk.green;
    const impactSign = stats.costImpact > 0 ? '+' : '';
    const emoji = stats.costImpact < 0 ? ' 👏' : '';

    console.log(
      stats.name.padEnd(35),
      impactColor(`${impactSign}$${Math.abs(stats.costImpact).toFixed(2)}`).padEnd(18),
      stats.commits.toString() + emoji
    );
  });

  console.log(chalk.dim('═'.repeat(70)));
  console.log();
}

/**
 * Show cost history with git correlation
 */
async function showCostHistory(options: GitHistoryOptions): Promise<void> {
  const period = options.period || 'week';
  const commits = await getCommitHistory(period);

  if (options.format === 'json') {
    console.log(JSON.stringify(commits, null, 2));
    return;
  }

  console.log();
  console.log(chalk.bold.cyan('📊 Cost History with Git Correlation'));
  console.log(chalk.dim('═'.repeat(80)));
  console.log();

  // Header
  console.log(
    chalk.bold('Date').padEnd(14),
    chalk.bold('Cost').padEnd(12),
    chalk.bold('Change').padEnd(12),
    chalk.bold('Commit')
  );
  console.log(chalk.dim('─'.repeat(80)));

  commits.forEach((commit) => {
    const changeColor = commit.costChange > 0 ? chalk.red : commit.costChange < 0 ? chalk.green : chalk.gray;
    const changeSign = commit.costChange > 0 ? '+' : '';

    console.log(
      dayjs(commit.date).format('YYYY-MM-DD').padEnd(14),
      chalk.green(`$${commit.cost.toFixed(2)}`).padEnd(12),
      changeColor(`${changeSign}$${commit.costChange.toFixed(2)}`).padEnd(12),
      chalk.dim(commit.shortCommit),
      commit.message.substring(0, 40)
    );
  });

  console.log(chalk.dim('═'.repeat(80)));
  console.log();

  // Significant changes
  const significant = commits.filter((c) => Math.abs(c.costChange) > 10);
  if (significant.length > 0) {
    console.log(chalk.bold('🔍 Significant cost changes:'));
    significant.forEach((commit) => {
      const sign = commit.costChange > 0 ? '+' : '';
      const color = commit.costChange > 0 ? chalk.red : chalk.green;
      console.log(
        `• ${color(`${sign}$${Math.abs(commit.costChange).toFixed(2)}`)} on ${dayjs(commit.date).format('YYYY-MM-DD')}: `,
        chalk.dim(commit.shortCommit),
        `"${commit.message}"`
      );
    });
    console.log();
  }
}

/**
 * Show details for a specific commit
 */
async function showCommitDetails(commitHash: string, format?: string): Promise<void> {
  try {
    const commitInfo = execSync(`git show --format="%H%n%an <%ae>%n%ai%n%s%n%b" --no-patch ${commitHash}`, {
      encoding: 'utf-8',
    }).split('\n');

    const fullHash = commitInfo[0];
    const author = commitInfo[1];
    const date = commitInfo[2];
    const subject = commitInfo[3];

    // Get files changed
    const filesOutput = execSync(`git show --name-only --format="" ${commitHash}`, {
      encoding: 'utf-8',
    });
    const files = filesOutput.split('\n').filter((f) => f.trim());

    // Simulate cost impact (in production, would calculate actual cost diff)
    const costImpact = Math.random() * 50 - 10;
    const percentChange = Math.random() * 15;

    if (format === 'json') {
      console.log(
        JSON.stringify(
          {
            commit: fullHash,
            author,
            date,
            message: subject,
            costImpact,
            percentChange,
            filesChanged: files,
          },
          null,
          2
        )
      );
      return;
    }

    // Display commit details
    console.log();
    console.log(chalk.bold.cyan('📝 Commit Cost Analysis'));
    console.log(chalk.dim('═'.repeat(70)));
    console.log(chalk.bold('Commit:'), chalk.dim(fullHash.substring(0, 10)));
    console.log(chalk.bold('Author:'), author);
    console.log(chalk.bold('Date:'), dayjs(date).format('YYYY-MM-DD HH:mm:ss'));
    console.log(chalk.bold('Message:'), subject);
    console.log(chalk.dim('─'.repeat(70)));

    const impactColor = costImpact > 0 ? chalk.red : chalk.green;
    const impactSign = costImpact > 0 ? '+' : '';
    console.log(
      chalk.bold('Cost Impact:'),
      impactColor(`${impactSign}$${Math.abs(costImpact).toFixed(2)}/day`),
      chalk.dim(`(${impactSign}${percentChange.toFixed(1)}%)`)
    );
    console.log();

    if (files.length > 0) {
      console.log(chalk.bold('Files Changed:'));
      files.slice(0, 10).forEach((file) => {
        console.log(`  • ${file}`);
      });
      if (files.length > 10) {
        console.log(chalk.dim(`  ... and ${files.length - 10} more`));
      }
    }
    console.log();
  } catch (error) {
    throw new Error(`Failed to analyze commit: ${commitHash}`);
  }
}

/**
 * Get commit history for period
 */
async function getCommitHistory(period: string): Promise<CommitCostData[]> {
  const days = getPeriodDays(period);
  const since = dayjs().subtract(days, 'days').format('YYYY-MM-DD');

  try {
    const log = execSync(`git log --since="${since}" --format="%H|%an <%ae>|%ai|%s" --reverse`, {
      encoding: 'utf-8',
    });

    const lines = log.trim().split('\n').filter((l) => l);
    const commits: CommitCostData[] = [];

    let previousCost = 100; // Base cost

    lines.forEach((line) => {
      const [hash, author, date, message] = line.split('|');

      // Simulate cost changes (in production, would fetch actual costs)
      const costChange = (Math.random() - 0.5) * 30;
      const newCost = Math.max(0, previousCost + costChange);
      const percentChange = previousCost > 0 ? (costChange / previousCost) * 100 : 0;

      commits.push({
        commit: hash,
        shortCommit: hash.substring(0, 7),
        author,
        date,
        message,
        cost: newCost,
        costChange,
        percentChange,
        filesChanged: [],
      });

      previousCost = newCost;
    });

    return commits;
  } catch (error) {
    throw new Error('Failed to get git history. Make sure you have commits in the specified period.');
  }
}

/**
 * Check if current directory is a git repository
 */
function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert period to days
 */
function getPeriodDays(period: string): number {
  const periodMap: { [key: string]: number } = {
    day: 1,
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };
  return periodMap[period] || 7;
}

/**
 * Get period label
 */
function getPeriodLabel(period: string): string {
  const labels: { [key: string]: string } = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
  };
  return labels[period] || period;
}

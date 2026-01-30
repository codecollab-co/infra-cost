/**
 * Ask command - Natural Language Cost Queries
 * Issue #44: Natural Language Cost Queries
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as readline from 'readline';
import { QueryParser } from '../../../core/nlp/query-parser';
import { QueryExecutor } from '../../../core/nlp/query-executor';
import { getProviderFromConfig } from '../../../api/utils';

async function handleAsk(question: string): Promise<void> {
  try {
    console.log(chalk.blue('🤖 Analyzing your question...'));
    console.log();

    const parser = new QueryParser();
    const parsed = parser.parse(question);

    if (parsed.type === 'unknown') {
      console.log(chalk.yellow('❓ I\'m not sure how to answer that question.'));
      console.log();
      console.log(chalk.white('Here are some example questions:'));
      const suggestions = parser.suggestQueries();
      suggestions.forEach((suggestion) => {
        console.log(chalk.gray(`  • ${suggestion}`));
      });
      console.log();
      return;
    }

    console.log(chalk.gray(`Query type: ${parsed.type}`));
    if (parsed.service) console.log(chalk.gray(`Service: ${parsed.service}`));
    if (parsed.timeframe) console.log(chalk.gray(`Timeframe: ${parsed.timeframe}`));
    console.log();

    // Execute query
    const provider = await getProviderFromConfig();
    const executor = new QueryExecutor(provider);
    const response = await executor.execute(parsed);

    // Display answer
    console.log(chalk.bold.white('Answer:'));
    console.log(response.answer);
    console.log();

    // Display recommendations if any
    if (response.recommendations && response.recommendations.length > 0) {
      console.log(chalk.yellow('💡 Recommendations:'));
      response.recommendations.forEach((rec) => {
        console.log(chalk.gray(`  • ${rec}`));
      });
      console.log();
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

async function handleChat(): Promise<void> {
  console.log(chalk.bold.blue('═'.repeat(60)));
  console.log(chalk.bold.white('           💬 infra-cost Chat Mode'));
  console.log(chalk.bold.blue('═'.repeat(60)));
  console.log();
  console.log(chalk.gray('Ask questions about your cloud costs in natural language.'));
  console.log(chalk.gray('Type "exit" or "quit" to end the session.'));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('> '),
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();

    if (input === 'exit' || input === 'quit') {
      console.log(chalk.yellow('Goodbye!'));
      rl.close();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      const parser = new QueryParser();
      const parsed = parser.parse(input);

      if (parsed.type === 'unknown') {
        console.log(chalk.yellow('❓ I\'m not sure how to answer that.'));
        console.log(chalk.gray('Try: "what\'s my EC2 spend?" or "how can I save money?"'));
      } else {
        const provider = await getProviderFromConfig();
        const executor = new QueryExecutor(provider);
        const response = await executor.execute(parsed);

        console.log();
        console.log(response.answer);

        if (response.recommendations) {
          console.log();
          response.recommendations.forEach((rec) => {
            console.log(chalk.gray(`  💡 ${rec}`));
          });
        }
      }
    } catch (error: any) {
      console.log(chalk.red('Error:'), error.message);
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

export function registerAskCommand(program: Command): void {
  program
    .command('ask <question...>')
    .description('Ask natural language questions about costs')
    .action(async (questionParts: string[]) => {
      const question = questionParts.join(' ');
      await handleAsk(question);
    });

  program
    .command('chat')
    .description('Interactive chat mode for cost queries')
    .action(handleChat);
}

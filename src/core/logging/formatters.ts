/**
 * Log Formatters
 *
 * Various log output formatters for different use cases
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * Pretty format for console output
 */
export function formatPretty(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const level = formatLevel(entry.level);
  const message = entry.message;

  let output = `${chalk.gray(timestamp)} ${level} ${message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += '\n  ' + chalk.gray(JSON.stringify(entry.context, null, 2).split('\n').join('\n  '));
  }

  if (entry.error) {
    output += '\n  ' + chalk.red(entry.error.stack || entry.error.message);
  }

  return output;
}

/**
 * JSON format for machine-readable logs
 */
export function formatJSON(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: entry.timestamp.toISOString(),
    level: entry.level,
    message: entry.message,
    context: entry.context,
    error: entry.error ? {
      message: entry.error.message,
      stack: entry.error.stack,
    } : undefined,
  });
}

/**
 * Simple text format without colors
 */
export function formatText(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  let output = `[${timestamp}] [${entry.level}] ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ' ' + JSON.stringify(entry.context);
  }

  if (entry.error) {
    output += ` Error: ${entry.error.message}`;
  }

  return output;
}

/**
 * Format log level with colors
 */
function formatLevel(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return chalk.blue('DEBUG');
    case LogLevel.INFO:
      return chalk.green('INFO ');
    case LogLevel.WARN:
      return chalk.yellow('WARN ');
    case LogLevel.ERROR:
      return chalk.red('ERROR');
    default:
      return level;
  }
}

/**
 * Compact format for single-line logs
 */
export function formatCompact(entry: LogEntry): string {
  const time = entry.timestamp.toTimeString().split(' ')[0];
  return `${time} [${entry.level}] ${entry.message}`;
}

/**
 * Format for file output (no colors, full details)
 */
export function formatFile(entry: LogEntry): string {
  const lines: string[] = [];

  lines.push(`[${entry.timestamp.toISOString()}] [${entry.level}] ${entry.message}`);

  if (entry.context && Object.keys(entry.context).length > 0) {
    lines.push(`Context: ${JSON.stringify(entry.context)}`);
  }

  if (entry.error) {
    lines.push(`Error: ${entry.error.message}`);
    if (entry.error.stack) {
      lines.push(`Stack: ${entry.error.stack}`);
    }
  }

  return lines.join('\n');
}

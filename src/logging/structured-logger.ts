/**
 * Structured Logging System
 * Issue #32: Add comprehensive logging and audit trail system
 *
 * Provides structured logging with configurable levels, formats, outputs,
 * audit trails, performance profiling, and correlation ID tracking.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// Log Levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

// Log Formats
export type LogFormat = 'json' | 'pretty' | 'compact';

// Log Output Types
export type LogOutputType = 'console' | 'file' | 'syslog' | 'http';

// Log Output Configuration
export interface LogOutput {
  type: LogOutputType;
  destination?: string; // file path or URL
  level?: LogLevel; // Override level for this output
}

// Logging Configuration
export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  outputs: LogOutput[];
  enableAudit: boolean;
  auditOutput?: string;
  correlationId?: string;
  component?: string;
  enablePerformance?: boolean;
  silent?: boolean;
}

// Log Metadata
export interface LogMetadata {
  [key: string]: unknown;
  component?: string;
  operation?: string;
  duration?: number;
  correlationId?: string;
  error?: Error | string;
}

// Structured Log Entry
export interface LogEntry {
  timestamp: string;
  level: string;
  levelNum: LogLevel;
  correlationId: string;
  component: string;
  operation?: string;
  message: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  performance?: PerformanceData;
}

// Performance Data
export interface PerformanceData {
  apiCalls?: number;
  cacheHits?: number;
  cacheMisses?: number;
  memoryUsed?: number;
  executionTime?: number;
}

// Audit Event Types
export enum AuditEventType {
  // Data Access
  COST_DATA_ACCESSED = 'cost_data_accessed',
  RESOURCE_INVENTORY_ACCESSED = 'resource_inventory_accessed',
  ACCOUNT_INFO_ACCESSED = 'account_info_accessed',
  RECOMMENDATION_GENERATED = 'recommendation_generated',

  // Operations
  OPTIMIZATION_EXECUTED = 'optimization_executed',
  CONFIGURATION_CHANGED = 'configuration_changed',
  CACHE_CLEARED = 'cache_cleared',
  REPORT_GENERATED = 'report_generated',
  EXPORT_CREATED = 'export_created',

  // Security
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  PERMISSION_DENIED = 'permission_denied',
  SSO_LOGIN = 'sso_login',

  // System
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  ERROR_OCCURRED = 'error_occurred',
  PROVIDER_CONNECTED = 'provider_connected',
}

// Data Classification
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

// Audit Event Details
export interface AuditDetails {
  userId?: string;
  sessionId?: string;
  action: string;
  resource?: {
    type: string;
    id: string;
    region?: string;
  };
  result: 'success' | 'failure' | 'partial';
  dataClassification?: DataClassification;
  complianceFramework?: string[];
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    hostname?: string;
  };
  metadata?: Record<string, unknown>;
}

// Audit Log Entry
export interface AuditEntry {
  auditId: string;
  timestamp: string;
  eventType: AuditEventType;
  correlationId: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource?: {
    type: string;
    id: string;
    region?: string;
  };
  result: 'success' | 'failure' | 'partial';
  dataClassification?: DataClassification;
  complianceFramework?: string[];
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    hostname?: string;
  };
  metadata?: Record<string, unknown>;
}

// Timer for performance profiling
export interface Timer {
  operation: string;
  startTime: number;
  startMemory?: number;
}

// Default Configuration
const DEFAULT_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,
  format: 'pretty',
  outputs: [{ type: 'console' }],
  enableAudit: false,
  enablePerformance: false,
  silent: false,
};

// Global logger instance
let globalLogger: StructuredLogger | null = null;

/**
 * Structured Logger Implementation
 */
export class StructuredLogger extends EventEmitter {
  private config: LoggingConfig;
  private correlationId: string;
  private component: string;
  private sessionId: string;
  private performanceCounters: Map<string, number> = new Map();
  private fileStreams: Map<string, fs.WriteStream> = new Map();

  constructor(config: Partial<LoggingConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.correlationId = config.correlationId || this.generateId('req');
    this.component = config.component || 'infra-cost';
    this.sessionId = this.generateId('session');
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${random}`;
  }

  /**
   * Get current timestamp in ISO format
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Check if should log at given level
   */
  private shouldLog(level: LogLevel): boolean {
    return !this.config.silent && level <= this.config.level;
  }

  /**
   * Get level name from number
   */
  private getLevelName(level: LogLevel): string {
    const names = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    return names[level] || 'UNKNOWN';
  }

  /**
   * Format message for console output (pretty format)
   */
  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<string, string> = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      TRACE: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';

    const levelIcon: Record<string, string> = {
      ERROR: '❌',
      WARN: '⚠️ ',
      INFO: 'ℹ️ ',
      DEBUG: '🔍',
      TRACE: '🔬',
    };

    const time = entry.timestamp.split('T')[1].split('.')[0];
    const icon = levelIcon[entry.level] || '';
    const component = entry.component ? `[${entry.component}]` : '';
    const operation = entry.operation ? `(${entry.operation})` : '';
    const duration = entry.duration ? ` [${entry.duration}ms]` : '';

    let output = `${color}${icon} ${time} ${entry.level.padEnd(5)} ${component}${operation}${duration}${reset} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      const metaStr = JSON.stringify(entry.metadata, null, 2)
        .split('\n')
        .map((line, i) => i === 0 ? line : `   ${line}`)
        .join('\n');
      output += `\n   ${color}metadata:${reset} ${metaStr}`;
    }

    return output;
  }

  /**
   * Format message for compact output
   */
  private formatCompact(entry: LogEntry): string {
    const time = entry.timestamp.split('T')[1].split('.')[0];
    const component = entry.component ? `[${entry.component}]` : '';
    return `${time} ${entry.level} ${component} ${entry.message}`;
  }

  /**
   * Format message for JSON output
   */
  private formatJson(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Format log entry based on configuration
   */
  private formatEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return this.formatJson(entry);
      case 'compact':
        return this.formatCompact(entry);
      case 'pretty':
      default:
        return this.formatPretty(entry);
    }
  }

  /**
   * Write to file output
   */
  private writeToFile(filepath: string, content: string): void {
    try {
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let stream = this.fileStreams.get(filepath);
      if (!stream) {
        stream = fs.createWriteStream(filepath, { flags: 'a' });
        this.fileStreams.set(filepath, stream);
      }

      stream.write(content + '\n');
    } catch (error) {
      console.error(`Failed to write to log file ${filepath}:`, error);
    }
  }

  /**
   * Write to outputs
   */
  private writeToOutputs(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);

    for (const output of this.config.outputs) {
      // Check output-specific level override
      const outputLevel = output.level ?? this.config.level;
      if (entry.levelNum > outputLevel) {
        continue;
      }

      switch (output.type) {
        case 'console':
          if (entry.levelNum === LogLevel.ERROR) {
            console.error(formatted);
          } else {
            console.log(formatted);
          }
          break;

        case 'file':
          if (output.destination) {
            // For file output, always use JSON format for parseability
            this.writeToFile(output.destination, this.formatJson(entry));
          }
          break;

        case 'http':
          // HTTP output would be implemented here for log aggregation
          this.emit('httpLog', entry, output.destination);
          break;

        case 'syslog':
          // Syslog output would be implemented here
          this.emit('syslog', entry, output.destination);
          break;
      }
    }

    // Emit log event for external listeners
    this.emit('log', entry);
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: this.getLevelName(level),
      levelNum: level,
      correlationId: metadata?.correlationId || this.correlationId,
      component: metadata?.component || this.component,
      operation: metadata?.operation,
      message,
      duration: metadata?.duration,
      metadata: this.sanitizeMetadata(metadata),
    };

    if (this.config.enablePerformance) {
      entry.performance = {
        apiCalls: this.performanceCounters.get('apiCalls') || 0,
        cacheHits: this.performanceCounters.get('cacheHits') || 0,
        cacheMisses: this.performanceCounters.get('cacheMisses') || 0,
      };
    }

    return entry;
  }

  /**
   * Sanitize metadata (remove internal fields)
   */
  private sanitizeMetadata(metadata?: LogMetadata): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const { component, operation, duration, correlationId, ...rest } = metadata;

    // Handle error objects
    if (rest.error instanceof Error) {
      rest.error = {
        name: rest.error.name,
        message: rest.error.message,
        stack: rest.error.stack,
      };
    }

    return Object.keys(rest).length > 0 ? rest : undefined;
  }

  // Public logging methods

  error(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeToOutputs(this.createEntry(LogLevel.ERROR, message, metadata));
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeToOutputs(this.createEntry(LogLevel.WARN, message, metadata));
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeToOutputs(this.createEntry(LogLevel.INFO, message, metadata));
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeToOutputs(this.createEntry(LogLevel.DEBUG, message, metadata));
    }
  }

  trace(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.writeToOutputs(this.createEntry(LogLevel.TRACE, message, metadata));
    }
  }

  /**
   * Audit logging
   */
  audit(eventType: AuditEventType, details: AuditDetails): void {
    if (!this.config.enableAudit) return;

    const entry: AuditEntry = {
      auditId: this.generateId('audit'),
      timestamp: this.getTimestamp(),
      eventType,
      correlationId: this.correlationId,
      sessionId: this.sessionId,
      ...details,
    };

    // Write to audit output
    if (this.config.auditOutput) {
      this.writeToFile(this.config.auditOutput, JSON.stringify(entry));
    }

    // Emit audit event
    this.emit('audit', entry);

    // Also log as INFO if it's a significant event
    if (
      eventType === AuditEventType.AUTHENTICATION_FAILURE ||
      eventType === AuditEventType.PERMISSION_DENIED ||
      eventType === AuditEventType.ERROR_OCCURRED
    ) {
      this.warn(`Audit: ${eventType}`, { action: details.action, result: details.result });
    }
  }

  // Performance profiling methods

  /**
   * Start a timer for performance profiling
   */
  startTimer(operation: string): Timer {
    return {
      operation,
      startTime: Date.now(),
      startMemory: process.memoryUsage?.()?.heapUsed,
    };
  }

  /**
   * End a timer and log the result
   */
  endTimer(timer: Timer, metadata?: LogMetadata): number {
    const duration = Date.now() - timer.startTime;

    this.debug(`${timer.operation} completed`, {
      ...metadata,
      operation: timer.operation,
      duration,
    });

    return duration;
  }

  /**
   * Profile an operation
   */
  async profile<T>(operation: string, fn: () => Promise<T> | T, metadata?: LogMetadata): Promise<T> {
    const timer = this.startTimer(operation);

    try {
      const result = await fn();
      this.endTimer(timer, { ...metadata, result: 'success' });
      return result;
    } catch (error) {
      this.endTimer(timer, { ...metadata, result: 'failure', error: error as Error });
      throw error;
    }
  }

  /**
   * Increment performance counter
   */
  incrementCounter(name: string, amount: number = 1): void {
    const current = this.performanceCounters.get(name) || 0;
    this.performanceCounters.set(name, current + amount);
  }

  /**
   * Get performance stats
   */
  getPerformanceStats(): Record<string, number> {
    return Object.fromEntries(this.performanceCounters);
  }

  /**
   * Reset performance counters
   */
  resetPerformanceCounters(): void {
    this.performanceCounters.clear();
  }

  // Configuration methods

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Set correlation ID
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Create a child logger with a specific component
   */
  child(component: string): StructuredLogger {
    const childLogger = new StructuredLogger({
      ...this.config,
      component,
      correlationId: this.correlationId,
    });
    return childLogger;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Close file streams
   */
  close(): void {
    for (const stream of this.fileStreams.values()) {
      stream.end();
    }
    this.fileStreams.clear();
  }
}

// Helper functions

/**
 * Get or create global logger instance
 */
export function getLogger(component?: string): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger();
  }
  return component ? globalLogger.child(component) : globalLogger;
}

/**
 * Initialize global logger with configuration
 */
export function initializeLogger(config: Partial<LoggingConfig>): StructuredLogger {
  globalLogger = new StructuredLogger(config);
  return globalLogger;
}

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const levelMap: Record<string, LogLevel> = {
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    warning: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    trace: LogLevel.TRACE,
  };
  return levelMap[level.toLowerCase()] ?? LogLevel.INFO;
}

/**
 * Parse log outputs from CLI string
 * Format: "console,file:./logs/app.log,http://logger.example.com"
 */
export function parseLogOutputs(outputStr: string): LogOutput[] {
  const outputs: LogOutput[] = [];

  for (const part of outputStr.split(',')) {
    const trimmed = part.trim();

    if (trimmed === 'console' || trimmed === 'stdout') {
      outputs.push({ type: 'console' });
    } else if (trimmed.startsWith('file:')) {
      outputs.push({ type: 'file', destination: trimmed.substring(5) });
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      outputs.push({ type: 'http', destination: trimmed });
    } else if (trimmed.startsWith('syslog:')) {
      outputs.push({ type: 'syslog', destination: trimmed.substring(7) });
    }
  }

  return outputs.length > 0 ? outputs : [{ type: 'console' }];
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

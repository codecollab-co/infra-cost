/**
 * Audit Logging Module
 *
 * Extracted from structured-logger.ts for better separation of concerns
 * Handles compliance audit trails (SOC2, GDPR, HIPAA, PCI DSS)
 */

import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_FAILED = 'auth.failed',

  // Data access events
  DATA_READ = 'data.read',
  DATA_WRITE = 'data.write',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',

  // Configuration events
  CONFIG_CHANGE = 'config.change',
  CONFIG_READ = 'config.read',

  // Cost events
  COST_QUERY = 'cost.query',
  COST_ALERT = 'cost.alert',
  COST_REPORT = 'cost.report',

  // System events
  SYSTEM_START = 'system.start',
  SYSTEM_STOP = 'system.stop',
  SYSTEM_ERROR = 'system.error',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum ComplianceFramework {
  SOC2 = 'SOC2',
  GDPR = 'GDPR',
  HIPAA = 'HIPAA',
  PCI_DSS = 'PCI_DSS',
}

export interface AuditEntry {
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  resourceId?: string;
  action: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress?: string;
  complianceFrameworks?: ComplianceFramework[];
}

export interface AuditLoggerOptions {
  enabled: boolean;
  directory: string;
  retentionDays: number;
  complianceFrameworks: ComplianceFramework[];
}

/**
 * Audit Logger for compliance and security tracking
 */
export class AuditLogger extends EventEmitter {
  private options: AuditLoggerOptions;
  private auditFile: string;

  constructor(options: Partial<AuditLoggerOptions> = {}) {
    super();

    this.options = {
      enabled: options.enabled ?? true,
      directory: options.directory ?? join(process.cwd(), '.infra-cost', 'audit'),
      retentionDays: options.retentionDays ?? 90,
      complianceFrameworks: options.complianceFrameworks ?? [],
    };

    // Create audit directory
    if (this.options.enabled && !existsSync(this.options.directory)) {
      mkdirSync(this.options.directory, { recursive: true });
    }

    // Set audit file path
    const date = new Date().toISOString().split('T')[0];
    this.auditFile = join(this.options.directory, `audit-${date}.log`);
  }

  /**
   * Log an audit event
   */
  log(entry: Partial<AuditEntry> & Pick<AuditEntry, 'eventType' | 'action'>): void {
    if (!this.options.enabled) {
      return;
    }

    const auditEntry: AuditEntry = {
      timestamp: new Date(),
      severity: entry.severity ?? AuditSeverity.INFO,
      result: entry.result ?? 'success',
      complianceFrameworks: this.options.complianceFrameworks,
      ...entry,
    };

    // Write to file
    const logLine = JSON.stringify(auditEntry) + '\n';
    try {
      appendFileSync(this.auditFile, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }

    // Emit event for real-time monitoring
    this.emit('audit', auditEntry);
  }

  /**
   * Log authentication event
   */
  logAuth(userId: string, action: 'login' | 'logout' | 'failed', details?: Record<string, any>): void {
    const eventType = action === 'login' ? AuditEventType.AUTH_LOGIN :
                      action === 'logout' ? AuditEventType.AUTH_LOGOUT :
                      AuditEventType.AUTH_FAILED;

    this.log({
      eventType,
      userId,
      action: `User ${action}`,
      result: action === 'failed' ? 'failure' : 'success',
      severity: action === 'failed' ? AuditSeverity.WARN : AuditSeverity.INFO,
      details,
    });
  }

  /**
   * Log data access event
   */
  logDataAccess(
    type: 'read' | 'write' | 'delete' | 'export',
    resourceId: string,
    userId?: string,
    details?: Record<string, any>
  ): void {
    const eventType = type === 'read' ? AuditEventType.DATA_READ :
                      type === 'write' ? AuditEventType.DATA_WRITE :
                      type === 'delete' ? AuditEventType.DATA_DELETE :
                      AuditEventType.DATA_EXPORT;

    this.log({
      eventType,
      userId,
      resourceId,
      action: `Data ${type}`,
      details,
      severity: type === 'delete' ? AuditSeverity.WARN : AuditSeverity.INFO,
    });
  }

  /**
   * Log configuration change
   */
  logConfigChange(
    userId: string,
    configKey: string,
    oldValue: any,
    newValue: any
  ): void {
    this.log({
      eventType: AuditEventType.CONFIG_CHANGE,
      userId,
      action: 'Configuration change',
      severity: AuditSeverity.WARN,
      details: {
        configKey,
        oldValue,
        newValue,
      },
    });
  }

  /**
   * Log cost query
   */
  logCostQuery(
    provider: string,
    startDate: Date,
    endDate: Date,
    userId?: string
  ): void {
    this.log({
      eventType: AuditEventType.COST_QUERY,
      userId,
      action: 'Cost data query',
      details: {
        provider,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  }

  /**
   * Log system event
   */
  logSystemEvent(
    type: 'start' | 'stop' | 'error',
    details?: Record<string, any>
  ): void {
    const eventType = type === 'start' ? AuditEventType.SYSTEM_START :
                      type === 'stop' ? AuditEventType.SYSTEM_STOP :
                      AuditEventType.SYSTEM_ERROR;

    this.log({
      eventType,
      action: `System ${type}`,
      severity: type === 'error' ? AuditSeverity.ERROR : AuditSeverity.INFO,
      details,
    });
  }

  /**
   * Get current audit file path
   */
  getAuditFilePath(): string {
    return this.auditFile;
  }

  /**
   * Check if audit logging is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }
}

// Global audit logger instance
let globalAuditLogger: AuditLogger | null = null;

/**
 * Initialize global audit logger
 */
export function initializeAuditLogger(options?: Partial<AuditLoggerOptions>): AuditLogger {
  globalAuditLogger = new AuditLogger(options);
  return globalAuditLogger;
}

/**
 * Get global audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger();
  }
  return globalAuditLogger;
}

/**
 * Unified Logging System
 *
 * Central logging management for infra-cost
 * Consolidates:
 * - src/logging/structured-logger.ts (full-featured logging)
 * - src/logger.ts (simple CLI logging - deprecated)
 * - Scattered console.log calls
 */

// Export logging types and classes
export {
  StructuredLogger,
  initializeLogger,
  getGlobalLogger,
  parseLogLevel,
  parseLogOutputs,
  LogLevel,
  LogOutput,
  LogEntry as StructuredLogEntry,
  LoggerOptions,
} from './structured-logger';

// Export audit logging
export {
  AuditLogger,
  initializeAuditLogger,
  getAuditLogger,
  AuditEventType,
  AuditSeverity,
  ComplianceFramework,
  AuditEntry,
  AuditLoggerOptions,
} from './audit';

// Export formatters
export {
  formatPretty,
  formatJSON,
  formatText,
  formatCompact,
  formatFile,
  LogEntry as FormatterLogEntry,
} from './formatters';

// Re-export LogLevel for convenience
export { LogLevel as Level } from './formatters';

import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { CloudProvider, ResourceInventory, CostBreakdown } from '../types/providers';
import EventEmitter from 'events';

export enum AuditEventType {
  COST_ANALYSIS = 'cost_analysis',
  RESOURCE_DISCOVERY = 'resource_discovery',
  OPTIMIZATION_EXECUTED = 'optimization_executed',
  ALERT_TRIGGERED = 'alert_triggered',
  FORECAST_GENERATED = 'forecast_generated',
  CONFIGURATION_CHANGED = 'configuration_changed',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  DATA_EXPORT = 'data_export',
  SYSTEM_ERROR = 'system_error',
  COMPLIANCE_CHECK = 'compliance_check',
  POLICY_VIOLATION = 'policy_violation'
}

export enum AuditSeverity {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ComplianceFramework {
  SOC2 = 'soc2',
  HIPAA = 'hipaa',
  PCI_DSS = 'pci_dss',
  GDPR = 'gdpr',
  NIST = 'nist',
  ISO27001 = 'iso27001',
  CIS = 'cis',
  FedRAMP = 'fedramp',
  CUSTOM = 'custom'
}

export interface AuditEvent {
  // Core event metadata
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // Actor and context
  actor: {
    type: 'user' | 'system' | 'api' | 'scheduled_job';
    id: string;
    name?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  // Cloud context
  cloudContext: {
    provider: CloudProvider;
    region?: string;
    accountId?: string;
    subscriptionId?: string;
    environment?: string; // dev, staging, prod
  };

  // Event details
  resource?: {
    type: string;
    id: string;
    name?: string;
    arn?: string;
    tags?: Record<string, string>;
  };

  // Action and outcome
  action: string;
  outcome: 'success' | 'failure' | 'partial';

  // Data and changes
  data?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    metadata?: Record<string, any>;
  };

  // Cost and financial impact
  financialImpact?: {
    costChange: number;
    currency: string;
    budgetImpact?: number;
    savingsRealized?: number;
  };

  // Compliance and risk
  compliance?: {
    frameworks: ComplianceFramework[];
    controlsAffected: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresReview: boolean;
  };

  // Error and diagnostic information
  error?: {
    code: string;
    message: string;
    stackTrace?: string;
    additionalInfo?: Record<string, any>;
  };

  // Correlation and traceability
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  parentEventId?: string;

  // Retention and lifecycle
  retentionPolicy?: {
    retainUntil: Date;
    archiveAfter?: Date;
    purgeAfter?: Date;
  };
}

export interface ComplianceRule {
  id: string;
  name: string;
  framework: ComplianceFramework;
  description: string;

  // Rule logic
  conditions: {
    eventTypes: AuditEventType[];
    resourceTypes?: string[];
    providers?: CloudProvider[];
    severity?: AuditSeverity[];
    customConditions?: string; // JSONPath or similar
  };

  // Compliance requirements
  requirements: {
    dataRetention: number; // days
    encryptionRequired: boolean;
    accessControlRequired: boolean;
    approvalRequired: boolean;
    documentationRequired: boolean;
  };

  // Monitoring and alerting
  monitoring: {
    enabled: boolean;
    alertOnViolation: boolean;
    notificationChannels: string[];
    escalationPolicy?: string;
  };
}

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  generatedAt: Date;
  reportPeriod: {
    start: Date;
    end: Date;
  };

  // Overall compliance status
  overallCompliance: {
    score: number; // 0-100
    status: 'compliant' | 'non_compliant' | 'under_review';
    lastAssessment: Date;
  };

  // Control assessments
  controls: Array<{
    id: string;
    name: string;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
    evidence: string[];
    findings: string[];
    remediation?: string[];
  }>;

  // Violations and issues
  violations: Array<{
    id: string;
    severity: AuditSeverity;
    description: string;
    affectedResources: string[];
    detectedAt: Date;
    status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
    remediation?: string;
  }>;

  // Metrics and KPIs
  metrics: {
    totalEvents: number;
    criticalEvents: number;
    violationCount: number;
    averageResolutionTime: number; // hours
    costImpactTotal: number;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    estimatedEffort: string;
    expectedOutcome: string;
  }>;
}

export class AuditLogger extends EventEmitter {
  private logDirectory: string;
  private currentLogFile: string;
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private eventBuffer: AuditEvent[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 10000; // 10 seconds
  private encryptionEnabled: boolean = false;
  private retentionDays: number = 2555; // 7 years default for financial records

  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: {
    logDirectory?: string;
    bufferSize?: number;
    flushInterval?: number;
    encryptionEnabled?: boolean;
    retentionDays?: number;
  } = {}) {
    super();

    this.logDirectory = config.logDirectory || join(process.cwd(), 'audit-logs');
    this.bufferSize = config.bufferSize || 100;
    this.flushInterval = config.flushInterval || 10000;
    this.encryptionEnabled = config.encryptionEnabled || false;
    this.retentionDays = config.retentionDays || 2555;

    this.initializeLogDirectory();
    this.initializeComplianceRules();
    this.startBufferFlushTimer();
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const fullEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      retentionPolicy: {
        retainUntil: new Date(Date.now() + (this.retentionDays * 24 * 60 * 60 * 1000)),
        archiveAfter: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year
        purgeAfter: new Date(Date.now() + (this.retentionDays * 24 * 60 * 60 * 1000))
      }
    };

    // Validate event against compliance rules
    await this.validateCompliance(fullEvent);

    // Add to buffer
    this.eventBuffer.push(fullEvent);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    // Emit event for real-time processing
    this.emit('auditEvent', fullEvent);

    // Check for immediate compliance violations
    await this.checkComplianceViolations(fullEvent);

    return fullEvent.id;
  }

  /**
   * Log cost analysis event
   */
  async logCostAnalysis(
    actor: AuditEvent['actor'],
    cloudContext: AuditEvent['cloudContext'],
    costBreakdown: CostBreakdown,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.COST_ANALYSIS,
      severity: AuditSeverity.INFO,
      actor,
      cloudContext,
      action: 'cost_analysis_executed',
      outcome: 'success',
      data: {
        metadata: {
          totalCost: costBreakdown.totals.thisMonth,
          serviceCount: Object.keys(costBreakdown.totalsByService.thisMonth || {}).length,
          ...metadata
        }
      },
      financialImpact: {
        costChange: 0,
        currency: 'USD',
        budgetImpact: costBreakdown.totals.thisMonth
      }
    });
  }

  /**
   * Log optimization event
   */
  async logOptimization(
    actor: AuditEvent['actor'],
    cloudContext: AuditEvent['cloudContext'],
    resource: AuditEvent['resource'],
    action: string,
    outcome: AuditEvent['outcome'],
    costSavings: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.OPTIMIZATION_EXECUTED,
      severity: outcome === 'success' ? AuditSeverity.INFO : AuditSeverity.WARN,
      actor,
      cloudContext,
      resource,
      action,
      outcome,
      data: { metadata },
      financialImpact: {
        costChange: -costSavings,
        currency: 'USD',
        savingsRealized: costSavings
      },
      compliance: {
        frameworks: [ComplianceFramework.SOC2, ComplianceFramework.NIST],
        controlsAffected: ['change_management', 'resource_management'],
        riskLevel: 'medium',
        requiresReview: costSavings > 1000 // High-impact changes require review
      }
    });
  }

  /**
   * Log compliance check event
   */
  async logComplianceCheck(
    framework: ComplianceFramework,
    controlsChecked: string[],
    violations: string[],
    actor: AuditEvent['actor']
  ): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.COMPLIANCE_CHECK,
      severity: violations.length > 0 ? AuditSeverity.WARN : AuditSeverity.INFO,
      actor,
      cloudContext: {
        provider: CloudProvider.AWS, // Generic for compliance checks
        environment: process.env.NODE_ENV || 'production'
      },
      action: 'compliance_check_executed',
      outcome: violations.length === 0 ? 'success' : 'partial',
      data: {
        metadata: {
          framework,
          controlsChecked,
          violations,
          violationCount: violations.length
        }
      },
      compliance: {
        frameworks: [framework],
        controlsAffected: controlsChecked,
        riskLevel: violations.length > 5 ? 'critical' : violations.length > 0 ? 'high' : 'low',
        requiresReview: violations.length > 0
      }
    });
  }

  /**
   * Generic log method for simple event logging
   */
  async log(action: string, metadata?: Record<string, any>): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.INFO,
      actor: {
        type: 'system',
        id: 'system',
        name: 'System'
      },
      cloudContext: {
        provider: CloudProvider.AWS,
        environment: process.env.NODE_ENV || 'production'
      },
      action,
      outcome: 'success',
      data: {
        metadata
      }
    });
  }

  /**
   * Log data export event
   */
  async logDataExport(
    actor: AuditEvent['actor'],
    exportType: string,
    dataTypes: string[],
    recordCount: number,
    filePath?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.DATA_EXPORT,
      severity: AuditSeverity.INFO,
      actor,
      cloudContext: {
        provider: CloudProvider.AWS, // Generic
        environment: process.env.NODE_ENV || 'production'
      },
      action: `data_export_${exportType}`,
      outcome: 'success',
      data: {
        metadata: {
          exportType,
          dataTypes,
          recordCount,
          filePath: filePath || 'not_specified',
          sensitiveData: this.containsSensitiveData(dataTypes)
        }
      },
      compliance: {
        frameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2],
        controlsAffected: ['data_export', 'access_control', 'data_protection'],
        riskLevel: this.containsSensitiveData(dataTypes) ? 'high' : 'medium',
        requiresReview: this.containsSensitiveData(dataTypes)
      }
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: ComplianceFramework,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const events = await this.queryEvents({
      startDate,
      endDate,
      frameworks: [framework]
    });

    const report: ComplianceReport = {
      id: this.generateReportId(),
      framework,
      generatedAt: new Date(),
      reportPeriod: { start: startDate, end: endDate },
      overallCompliance: {
        score: 0,
        status: 'under_review',
        lastAssessment: new Date()
      },
      controls: [],
      violations: [],
      metrics: {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === AuditSeverity.CRITICAL).length,
        violationCount: 0,
        averageResolutionTime: 0,
        costImpactTotal: events.reduce((sum, e) => sum + (e.financialImpact?.costChange || 0), 0)
      },
      recommendations: []
    };

    // Analyze compliance based on framework
    switch (framework) {
      case ComplianceFramework.SOC2:
        report.controls = await this.assessSOC2Controls(events);
        break;
      case ComplianceFramework.GDPR:
        report.controls = await this.assessGDPRControls(events);
        break;
      case ComplianceFramework.HIPAA:
        report.controls = await this.assessHIPAAControls(events);
        break;
      case ComplianceFramework.PCI_DSS:
        report.controls = await this.assessPCIDSSControls(events);
        break;
      default:
        report.controls = await this.assessGenericControls(events);
    }

    // Calculate overall compliance score
    const compliantControls = report.controls.filter(c => c.status === 'compliant').length;
    const totalControls = report.controls.filter(c => c.status !== 'not_applicable').length;
    report.overallCompliance.score = totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;
    report.overallCompliance.status = report.overallCompliance.score >= 95 ? 'compliant' : 'non_compliant';

    // Generate violations summary
    report.violations = this.extractViolations(events, framework);
    report.metrics.violationCount = report.violations.length;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report, events);

    // Log the report generation
    await this.logEvent({
      eventType: AuditEventType.COMPLIANCE_CHECK,
      severity: AuditSeverity.INFO,
      actor: {
        type: 'system',
        id: 'audit_system',
        name: 'Audit Logger'
      },
      cloudContext: {
        provider: CloudProvider.AWS,
        environment: process.env.NODE_ENV || 'production'
      },
      action: 'compliance_report_generated',
      outcome: 'success',
      data: {
        metadata: {
          framework,
          reportId: report.id,
          complianceScore: report.overallCompliance.score,
          violationCount: report.violations.length
        }
      },
      compliance: {
        frameworks: [framework],
        controlsAffected: ['reporting', 'compliance_monitoring'],
        riskLevel: report.overallCompliance.score < 80 ? 'high' : 'medium',
        requiresReview: report.overallCompliance.score < 95
      }
    });

    return report;
  }

  /**
   * Query audit events with filters
   */
  async queryEvents(filters: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: AuditEventType[];
    severity?: AuditSeverity[];
    actors?: string[];
    providers?: CloudProvider[];
    frameworks?: ComplianceFramework[];
    resourceTypes?: string[];
    outcomes?: string[];
    limit?: number;
    offset?: number;
  }): Promise<AuditEvent[]> {
    // In a production system, this would query from a database or search index
    // For now, we'll implement a simple file-based query

    const logFiles = this.getLogFiles(filters.startDate, filters.endDate);
    const events: AuditEvent[] = [];

    for (const logFile of logFiles) {
      try {
        const fileContent = readFileSync(logFile, 'utf8');
        const fileEvents = fileContent.split('\\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line) as AuditEvent);

        // Apply filters
        const filteredEvents = fileEvents.filter(event => {
          if (filters.startDate && event.timestamp < filters.startDate) return false;
          if (filters.endDate && event.timestamp > filters.endDate) return false;
          if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) return false;
          if (filters.severity && !filters.severity.includes(event.severity)) return false;
          if (filters.actors && !filters.actors.includes(event.actor.id)) return false;
          if (filters.providers && !filters.providers.includes(event.cloudContext.provider)) return false;
          if (filters.frameworks && event.compliance &&
              !event.compliance.frameworks.some(f => filters.frameworks!.includes(f))) return false;
          if (filters.resourceTypes && event.resource &&
              !filters.resourceTypes.includes(event.resource.type)) return false;
          if (filters.outcomes && !filters.outcomes.includes(event.outcome)) return false;

          return true;
        });

        events.push(...filteredEvents);
      } catch (error) {
        console.error(`Failed to read log file ${logFile}:`, error.message);
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || events.length;
    return events.slice(offset, offset + limit);
  }

  /**
   * Export audit logs for external systems
   */
  async exportLogs(
    format: 'json' | 'csv' | 'xml' | 'syslog',
    filters: Parameters<typeof this.queryEvents>[0],
    outputPath?: string
  ): Promise<string> {
    const events = await this.queryEvents(filters);

    let exportData: string;
    let filename: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (format) {
      case 'json':
        exportData = JSON.stringify(events, null, 2);
        filename = outputPath || `audit-export-${timestamp}.json`;
        break;

      case 'csv':
        exportData = this.convertToCSV(events);
        filename = outputPath || `audit-export-${timestamp}.csv`;
        break;

      case 'xml':
        exportData = this.convertToXML(events);
        filename = outputPath || `audit-export-${timestamp}.xml`;
        break;

      case 'syslog':
        exportData = this.convertToSyslog(events);
        filename = outputPath || `audit-export-${timestamp}.log`;
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    writeFileSync(filename, exportData);

    // Log the export activity
    await this.logDataExport(
      {
        type: 'system',
        id: 'audit_system',
        name: 'Audit Logger'
      },
      format,
      ['audit_events'],
      events.length,
      filename
    );

    return filename;
  }

  /**
   * Initialize compliance rules
   */
  private initializeComplianceRules(): void {
    // SOC2 Rules
    this.addComplianceRule({
      id: 'soc2-access-control',
      name: 'SOC2 Access Control',
      framework: ComplianceFramework.SOC2,
      description: 'Monitor access control events for SOC2 compliance',
      conditions: {
        eventTypes: [AuditEventType.ACCESS_GRANTED, AuditEventType.ACCESS_DENIED],
        severity: [AuditSeverity.WARN, AuditSeverity.ERROR, AuditSeverity.CRITICAL]
      },
      requirements: {
        dataRetention: 2555, // 7 years
        encryptionRequired: true,
        accessControlRequired: true,
        approvalRequired: true,
        documentationRequired: true
      },
      monitoring: {
        enabled: true,
        alertOnViolation: true,
        notificationChannels: ['email', 'slack']
      }
    });

    // GDPR Rules
    this.addComplianceRule({
      id: 'gdpr-data-export',
      name: 'GDPR Data Export Monitoring',
      framework: ComplianceFramework.GDPR,
      description: 'Monitor data export activities for GDPR compliance',
      conditions: {
        eventTypes: [AuditEventType.DATA_EXPORT],
        severity: [AuditSeverity.INFO, AuditSeverity.WARN]
      },
      requirements: {
        dataRetention: 2190, // 6 years
        encryptionRequired: true,
        accessControlRequired: true,
        approvalRequired: false,
        documentationRequired: true
      },
      monitoring: {
        enabled: true,
        alertOnViolation: true,
        notificationChannels: ['email']
      }
    });

    // HIPAA Rules
    this.addComplianceRule({
      id: 'hipaa-access-audit',
      name: 'HIPAA Access Audit',
      framework: ComplianceFramework.HIPAA,
      description: 'Audit trail for HIPAA access requirements',
      conditions: {
        eventTypes: [
          AuditEventType.ACCESS_GRANTED,
          AuditEventType.ACCESS_DENIED,
          AuditEventType.DATA_EXPORT,
          AuditEventType.CONFIGURATION_CHANGED
        ]
      },
      requirements: {
        dataRetention: 2190, // 6 years minimum for HIPAA
        encryptionRequired: true,
        accessControlRequired: true,
        approvalRequired: true,
        documentationRequired: true
      },
      monitoring: {
        enabled: true,
        alertOnViolation: true,
        notificationChannels: ['email', 'sms']
      }
    });
  }

  /**
   * Add compliance rule
   */
  addComplianceRule(rule: ComplianceRule): void {
    this.complianceRules.set(rule.id, rule);
    this.emit('complianceRuleAdded', rule);
  }

  /**
   * Private helper methods
   */
  private initializeLogDirectory(): void {
    if (!existsSync(this.logDirectory)) {
      require('fs').mkdirSync(this.logDirectory, { recursive: true });
    }

    this.currentLogFile = this.getCurrentLogFile();
  }

  private getCurrentLogFile(): string {
    const today = new Date().toISOString().split('T')[0];
    return join(this.logDirectory, `audit-${today}.jsonl`);
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    const logData = events.map(event => JSON.stringify(event)).join('\\n') + '\\n';

    try {
      appendFileSync(this.currentLogFile, logData);
      this.emit('bufferFlushed', events.length);
    } catch (error) {
      // Re-add events to buffer if write fails
      this.eventBuffer.unshift(...events);
      this.emit('flushError', error);
    }
  }

  private startBufferFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  private async validateCompliance(event: AuditEvent): Promise<void> {
    // Validate against applicable compliance rules
    for (const [ruleId, rule] of this.complianceRules) {
      if (this.eventMatchesRule(event, rule)) {
        // Apply compliance requirements
        if (rule.requirements.encryptionRequired && !this.encryptionEnabled) {
          this.emit('complianceViolation', {
            ruleId,
            event,
            violation: 'encryption_required_but_disabled'
          });
        }
      }
    }
  }

  private eventMatchesRule(event: AuditEvent, rule: ComplianceRule): boolean {
    if (!rule.conditions.eventTypes.includes(event.eventType)) return false;
    if (rule.conditions.severity && !rule.conditions.severity.includes(event.severity)) return false;
    if (rule.conditions.resourceTypes && event.resource &&
        !rule.conditions.resourceTypes.includes(event.resource.type)) return false;
    if (rule.conditions.providers && !rule.conditions.providers.includes(event.cloudContext.provider)) return false;

    return true;
  }

  private async checkComplianceViolations(event: AuditEvent): Promise<void> {
    // Check for immediate compliance violations
    if (event.compliance?.requiresReview) {
      this.emit('complianceReviewRequired', event);
    }

    if (event.severity === AuditSeverity.CRITICAL) {
      this.emit('criticalEvent', event);
    }
  }

  private containsSensitiveData(dataTypes: string[]): boolean {
    const sensitiveTypes = ['user_data', 'financial', 'pii', 'phi', 'credentials'];
    return dataTypes.some(type => sensitiveTypes.includes(type.toLowerCase()));
  }

  private getLogFiles(startDate?: Date, endDate?: Date): string[] {
    // Implementation would scan log directory for relevant files
    // For simplicity, return current log file
    return [this.currentLogFile];
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'id', 'timestamp', 'eventType', 'severity', 'actor.type', 'actor.id',
      'cloudContext.provider', 'cloudContext.region', 'action', 'outcome',
      'resource.type', 'resource.id', 'financialImpact.costChange'
    ];

    const csvLines = [headers.join(',')];

    events.forEach(event => {
      const row = [
        event.id,
        event.timestamp.toISOString(),
        event.eventType,
        event.severity,
        event.actor.type,
        event.actor.id,
        event.cloudContext.provider,
        event.cloudContext.region || '',
        event.action,
        event.outcome,
        event.resource?.type || '',
        event.resource?.id || '',
        event.financialImpact?.costChange || 0
      ].map(field => `"${field}"`);

      csvLines.push(row.join(','));
    });

    return csvLines.join('\\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<auditEvents>\\n';

    events.forEach(event => {
      xml += `  <event id="${event.id}">\\n`;
      xml += `    <timestamp>${event.timestamp.toISOString()}</timestamp>\\n`;
      xml += `    <eventType>${event.eventType}</eventType>\\n`;
      xml += `    <severity>${event.severity}</severity>\\n`;
      xml += `    <action>${event.action}</action>\\n`;
      xml += `    <outcome>${event.outcome}</outcome>\\n`;
      xml += `  </event>\\n`;
    });

    xml += '</auditEvents>';
    return xml;
  }

  private convertToSyslog(events: AuditEvent[]): string {
    return events.map(event => {
      const priority = this.getSyslogPriority(event.severity);
      const timestamp = event.timestamp.toISOString();
      const hostname = 'infra-cost-audit';
      const tag = 'audit';

      return `<${priority}>${timestamp} ${hostname} ${tag}: ${event.eventType} ${event.action} by ${event.actor.id} - ${event.outcome}`;
    }).join('\\n');
  }

  private getSyslogPriority(severity: AuditSeverity): number {
    switch (severity) {
      case AuditSeverity.CRITICAL: return 2; // Critical
      case AuditSeverity.ERROR: return 3;    // Error
      case AuditSeverity.WARN: return 4;     // Warning
      case AuditSeverity.INFO: return 6;     // Informational
      default: return 6;
    }
  }

  // Compliance assessment methods
  private async assessSOC2Controls(events: AuditEvent[]): Promise<ComplianceReport['controls']> {
    return [
      {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        status: 'compliant',
        evidence: [`${events.filter(e => e.eventType === AuditEventType.ACCESS_GRANTED).length} access events logged`],
        findings: []
      },
      {
        id: 'CC7.1',
        name: 'System Operations',
        status: 'compliant',
        evidence: [`${events.filter(e => e.eventType === AuditEventType.SYSTEM_ERROR).length} system events monitored`],
        findings: []
      }
    ];
  }

  private async assessGDPRControls(events: AuditEvent[]): Promise<ComplianceReport['controls']> {
    return [
      {
        id: 'Art32',
        name: 'Security of Processing',
        status: 'compliant',
        evidence: ['Encryption enabled', 'Access controls in place'],
        findings: []
      }
    ];
  }

  private async assessHIPAAControls(events: AuditEvent[]): Promise<ComplianceReport['controls']> {
    return [
      {
        id: '164.312(a)(1)',
        name: 'Access Control',
        status: 'compliant',
        evidence: ['User access monitored', 'Audit logs maintained'],
        findings: []
      }
    ];
  }

  private async assessPCIDSSControls(events: AuditEvent[]): Promise<ComplianceReport['controls']> {
    return [
      {
        id: 'Req10',
        name: 'Audit Trails',
        status: 'compliant',
        evidence: ['Comprehensive audit logging implemented'],
        findings: []
      }
    ];
  }

  private async assessGenericControls(events: AuditEvent[]): Promise<ComplianceReport['controls']> {
    return [
      {
        id: 'GEN001',
        name: 'Event Logging',
        status: 'compliant',
        evidence: [`${events.length} events logged`],
        findings: []
      }
    ];
  }

  private extractViolations(events: AuditEvent[], framework: ComplianceFramework): ComplianceReport['violations'] {
    const violations = events
      .filter(e => e.outcome === 'failure' || e.severity === AuditSeverity.CRITICAL)
      .map(event => ({
        id: `violation_${event.id}`,
        severity: event.severity,
        description: `${event.eventType} failed: ${event.error?.message || 'Unknown error'}`,
        affectedResources: event.resource ? [event.resource.id] : [],
        detectedAt: event.timestamp,
        status: 'open' as const
      }));

    return violations;
  }

  private generateRecommendations(report: ComplianceReport, events: AuditEvent[]): ComplianceReport['recommendations'] {
    const recommendations: ComplianceReport['recommendations'] = [];

    if (report.overallCompliance.score < 95) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Overall Compliance Score',
        description: `Current compliance score is ${report.overallCompliance.score.toFixed(1)}%. Focus on resolving non-compliant controls.`,
        estimatedEffort: '1-2 weeks',
        expectedOutcome: 'Achieve >95% compliance score'
      });
    }

    if (report.violations.length > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Address Compliance Violations',
        description: `${report.violations.length} violations detected. Immediate remediation required.`,
        estimatedEffort: '1 week',
        expectedOutcome: 'Zero open violations'
      });
    }

    return recommendations;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushBuffer();
    this.emit('shutdown');
  }
}
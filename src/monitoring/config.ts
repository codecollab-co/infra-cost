import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AlertThresholdType, NotificationChannelType, AlertSeverity, AlertConfiguration, NotificationChannelConfig } from './cost-monitor';

export interface MonitoringConfiguration {
  // Basic settings
  dataCollectionInterval: number;
  retentionDays: number;
  enableHealthChecks: boolean;

  // Alert configurations
  alerts: { [alertId: string]: AlertConfiguration };

  // Notification channels
  notificationChannels: { [channelId: string]: NotificationChannelConfig };

  // Provider settings
  provider?: {
    type: string;
    region?: string;
    credentials?: Record<string, any>;
  };

  // Advanced settings
  analytics?: {
    enableAnomalyDetection: boolean;
    enableTrendAnalysis: boolean;
    enableBudgetForecasting: boolean;
    anomalySensitivity: number; // 1-10 scale
  };

  // Logging settings
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    logFile?: string;
    enableConsoleOutput: boolean;
  };
}

export class MonitoringConfigManager {
  private static readonly DEFAULT_CONFIG_PATH = join(process.cwd(), '.infra-cost-monitoring.json');
  private static readonly DEFAULT_CONFIG: MonitoringConfiguration = {
    dataCollectionInterval: 60000, // 1 minute
    retentionDays: 30,
    enableHealthChecks: true,
    alerts: {},
    notificationChannels: {},
    analytics: {
      enableAnomalyDetection: true,
      enableTrendAnalysis: true,
      enableBudgetForecasting: true,
      anomalySensitivity: 5
    },
    logging: {
      level: 'info',
      enableConsoleOutput: true
    }
  };

  /**
   * Load monitoring configuration from file or environment
   */
  static loadConfiguration(configPath?: string): MonitoringConfiguration {
    const path = configPath || this.DEFAULT_CONFIG_PATH;

    // Try to load from file first
    if (existsSync(path)) {
      try {
        const configContent = readFileSync(path, 'utf8');
        const config = JSON.parse(configContent) as MonitoringConfiguration;

        // Merge with defaults for missing fields
        return this.mergeWithDefaults(config);
      } catch (error) {
        console.warn(`Failed to load configuration from ${path}: ${error.message}`);
        console.warn('Using default configuration...');
      }
    }

    // Try to load from environment variables
    const envConfig = this.loadFromEnvironment();
    return this.mergeWithDefaults(envConfig);
  }

  /**
   * Save configuration to file
   */
  static saveConfiguration(config: MonitoringConfiguration, configPath?: string): void {
    const path = configPath || this.DEFAULT_CONFIG_PATH;

    try {
      writeFileSync(path, JSON.stringify(config, null, 2));
      console.log(`✅ Configuration saved to ${path}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Create a sample configuration file
   */
  static createSampleConfig(configPath?: string): void {
    const path = configPath || this.DEFAULT_CONFIG_PATH;

    const sampleConfig: MonitoringConfiguration = {
      ...this.DEFAULT_CONFIG,
      alerts: {
        'monthly-budget': {
          thresholdType: AlertThresholdType.ABSOLUTE,
          thresholdValue: 1000,
          severity: AlertSeverity.HIGH,
          enabled: true,
          cooldownMinutes: 60,
          description: 'Monthly budget exceeded'
        },
        'cost-spike': {
          thresholdType: AlertThresholdType.PERCENTAGE,
          thresholdValue: 25,
          severity: AlertSeverity.MEDIUM,
          enabled: true,
          cooldownMinutes: 30,
          description: 'Cost increased by more than 25%'
        },
        'anomaly-detection': {
          thresholdType: AlertThresholdType.ANOMALY,
          thresholdValue: 2.0,
          severity: AlertSeverity.MEDIUM,
          enabled: true,
          cooldownMinutes: 15,
          description: 'Cost anomaly detected (2 standard deviations)'
        }
      },
      notificationChannels: {
        'slack-alerts': {
          type: NotificationChannelType.SLACK,
          webhookUrl: '${SLACK_WEBHOOK_URL}',
          channel: '#cost-alerts',
          enabled: true
        },
        'email-alerts': {
          type: NotificationChannelType.EMAIL,
          to: '${ALERT_EMAIL_TO}',
          from: '${ALERT_EMAIL_FROM}',
          enabled: false
        }
      }
    };

    this.saveConfiguration(sampleConfig, path);
    console.log('📋 Sample configuration created with common alert scenarios');
    console.log('💡 Customize the alerts and notification channels as needed');
  }

  /**
   * Validate configuration
   */
  static validateConfiguration(config: MonitoringConfiguration): string[] {
    const errors: string[] = [];

    // Validate basic settings
    if (config.dataCollectionInterval < 10000) {
      errors.push('dataCollectionInterval must be at least 10 seconds (10000ms)');
    }

    if (config.retentionDays < 1 || config.retentionDays > 365) {
      errors.push('retentionDays must be between 1 and 365');
    }

    // Validate alerts
    Object.entries(config.alerts).forEach(([alertId, alert]) => {
      if (!alert.thresholdType || !Object.values(AlertThresholdType).includes(alert.thresholdType)) {
        errors.push(`Alert '${alertId}': invalid thresholdType`);
      }

      if (alert.thresholdValue <= 0) {
        errors.push(`Alert '${alertId}': thresholdValue must be positive`);
      }

      if (!alert.severity || !Object.values(AlertSeverity).includes(alert.severity)) {
        errors.push(`Alert '${alertId}': invalid severity`);
      }

      if (alert.cooldownMinutes < 1) {
        errors.push(`Alert '${alertId}': cooldownMinutes must be at least 1`);
      }
    });

    // Validate notification channels
    Object.entries(config.notificationChannels).forEach(([channelId, channel]) => {
      if (!channel.type || !Object.values(NotificationChannelType).includes(channel.type)) {
        errors.push(`Channel '${channelId}': invalid type`);
      }

      // Channel-specific validation
      switch (channel.type) {
        case NotificationChannelType.SLACK:
          if (!channel.webhookUrl) {
            errors.push(`Channel '${channelId}': slack requires webhookUrl`);
          }
          break;
        case NotificationChannelType.EMAIL:
          if (!channel.to || !channel.from) {
            errors.push(`Channel '${channelId}': email requires 'to' and 'from' addresses`);
          }
          break;
        case NotificationChannelType.WEBHOOK:
          if (!channel.url) {
            errors.push(`Channel '${channelId}': webhook requires url`);
          }
          break;
        case NotificationChannelType.SMS:
          if (!channel.phoneNumber) {
            errors.push(`Channel '${channelId}': SMS requires phoneNumber`);
          }
          break;
      }
    });

    // Validate analytics settings
    if (config.analytics) {
      if (config.analytics.anomalySensitivity < 1 || config.analytics.anomalySensitivity > 10) {
        errors.push('analytics.anomalySensitivity must be between 1 and 10');
      }
    }

    return errors;
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnvironment(): Partial<MonitoringConfiguration> {
    const config: Partial<MonitoringConfiguration> = {};

    // Basic settings from environment
    if (process.env.INFRA_COST_MONITORING_INTERVAL) {
      config.dataCollectionInterval = parseInt(process.env.INFRA_COST_MONITORING_INTERVAL);
    }

    if (process.env.INFRA_COST_MONITORING_RETENTION_DAYS) {
      config.retentionDays = parseInt(process.env.INFRA_COST_MONITORING_RETENTION_DAYS);
    }

    // Create alerts from environment
    const alerts: { [key: string]: AlertConfiguration } = {};

    if (process.env.INFRA_COST_BUDGET_ALERT_THRESHOLD) {
      alerts['budget-alert'] = {
        thresholdType: AlertThresholdType.ABSOLUTE,
        thresholdValue: parseFloat(process.env.INFRA_COST_BUDGET_ALERT_THRESHOLD),
        severity: AlertSeverity.HIGH,
        enabled: true,
        cooldownMinutes: 60,
        description: 'Budget threshold exceeded'
      };
    }

    if (process.env.INFRA_COST_PERCENTAGE_ALERT_THRESHOLD) {
      alerts['percentage-alert'] = {
        thresholdType: AlertThresholdType.PERCENTAGE,
        thresholdValue: parseFloat(process.env.INFRA_COST_PERCENTAGE_ALERT_THRESHOLD),
        severity: AlertSeverity.MEDIUM,
        enabled: true,
        cooldownMinutes: 30,
        description: 'Cost percentage increase threshold exceeded'
      };
    }

    if (Object.keys(alerts).length > 0) {
      config.alerts = alerts;
    }

    // Create notification channels from environment
    const channels: { [key: string]: NotificationChannelConfig } = {};

    if (process.env.SLACK_WEBHOOK_URL) {
      channels['slack'] = {
        type: NotificationChannelType.SLACK,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts',
        enabled: true
      };
    }

    if (process.env.ALERT_EMAIL_TO && process.env.ALERT_EMAIL_FROM) {
      channels['email'] = {
        type: NotificationChannelType.EMAIL,
        to: process.env.ALERT_EMAIL_TO,
        from: process.env.ALERT_EMAIL_FROM,
        enabled: true
      };
    }

    if (process.env.ALERT_WEBHOOK_URL) {
      channels['webhook'] = {
        type: NotificationChannelType.WEBHOOK,
        url: process.env.ALERT_WEBHOOK_URL,
        enabled: true
      };
    }

    if (Object.keys(channels).length > 0) {
      config.notificationChannels = channels;
    }

    return config;
  }

  /**
   * Merge user configuration with defaults
   */
  private static mergeWithDefaults(config: Partial<MonitoringConfiguration>): MonitoringConfiguration {
    return {
      ...this.DEFAULT_CONFIG,
      ...config,
      analytics: {
        ...this.DEFAULT_CONFIG.analytics!,
        ...config.analytics
      },
      logging: {
        ...this.DEFAULT_CONFIG.logging!,
        ...config.logging
      }
    };
  }

  /**
   * Generate configuration from wizard-like prompts
   */
  static async generateInteractiveConfig(): Promise<MonitoringConfiguration> {
    console.log('🚀 Interactive Monitoring Configuration Setup');
    console.log('─'.repeat(50));

    const config: MonitoringConfiguration = { ...this.DEFAULT_CONFIG };

    // This would normally use a library like inquirer for interactive prompts
    // For now, we'll create a reasonable default configuration

    console.log('💡 Using recommended default configuration...');
    console.log('   You can customize this later by editing the configuration file');

    // Add some common alert scenarios
    config.alerts = {
      'monthly-budget-1000': {
        thresholdType: AlertThresholdType.ABSOLUTE,
        thresholdValue: 1000,
        severity: AlertSeverity.HIGH,
        enabled: true,
        cooldownMinutes: 60,
        description: 'Monthly costs exceeded $1000'
      },
      'cost-increase-20-percent': {
        thresholdType: AlertThresholdType.PERCENTAGE,
        thresholdValue: 20,
        severity: AlertSeverity.MEDIUM,
        enabled: true,
        cooldownMinutes: 30,
        description: 'Costs increased by more than 20%'
      },
      'anomaly-detector': {
        thresholdType: AlertThresholdType.ANOMALY,
        thresholdValue: 2.0,
        severity: AlertSeverity.MEDIUM,
        enabled: true,
        cooldownMinutes: 15,
        description: 'Cost anomaly detected'
      }
    };

    // Add notification channels if environment variables are available
    if (process.env.SLACK_WEBHOOK_URL) {
      config.notificationChannels['slack'] = {
        type: NotificationChannelType.SLACK,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#cost-alerts',
        enabled: true
      };
    }

    return config;
  }
}

// CLI helper functions
export function initializeMonitoringConfig(configPath?: string): void {
  const path = configPath || MonitoringConfigManager['DEFAULT_CONFIG_PATH'];

  if (existsSync(path)) {
    console.log(`⚠️  Configuration file already exists at ${path}`);
    console.log('Use --force to overwrite or specify a different path');
    return;
  }

  MonitoringConfigManager.createSampleConfig(path);
}

export function validateMonitoringConfig(configPath?: string): boolean {
  try {
    const config = MonitoringConfigManager.loadConfiguration(configPath);
    const errors = MonitoringConfigManager.validateConfiguration(config);

    if (errors.length === 0) {
      console.log('✅ Configuration is valid');
      return true;
    } else {
      console.log('❌ Configuration validation failed:');
      errors.forEach(error => console.log(`   • ${error}`));
      return false;
    }
  } catch (error) {
    console.error(`Failed to validate configuration: ${error.message}`);
    return false;
  }
}
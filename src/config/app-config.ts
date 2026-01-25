import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { CloudProvider } from '../types/providers';

/**
 * Application Configuration Interface
 * Supports persistent settings for the infra-cost CLI
 */
export interface InfraCostConfiguration {
  // Schema version for future migrations
  $schema?: string;
  version: string;

  // Default settings applied when no CLI args are provided
  defaults: {
    provider: CloudProvider | string;
    profile: string;
    region: string;
    output: {
      format: 'json' | 'text' | 'fancy';
      summary: boolean;
      includeMetadata: boolean;
    };
  };

  // Named profiles for quick switching between environments
  profiles: {
    [profileName: string]: ConfigProfile;
  };

  // Slack integration settings
  slack?: {
    token?: string;
    channel?: string;
    enabled: boolean;
  };

  // Cache settings
  cache?: {
    enabled: boolean;
    ttl: string; // e.g., "4h", "30m"
    type: 'file' | 'memory' | 'redis';
    redisUrl?: string;
  };

  // Monitoring defaults
  monitoring?: {
    enabled: boolean;
    interval: string; // e.g., "1h", "30m"
    configPath?: string;
  };

  // Alert defaults
  alerts?: {
    defaultThreshold?: number;
    defaultChannel?: string;
    enabled: boolean;
  };
}

export interface ConfigProfile {
  provider?: CloudProvider | string;
  profile?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  sessionToken?: string;
  // GCP specific
  projectId?: string;
  keyFile?: string;
  // Azure specific
  subscriptionId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  // Oracle specific
  userId?: string;
  tenancyId?: string;
  fingerprint?: string;
  // Output settings
  output?: {
    format?: 'json' | 'text' | 'fancy';
    summary?: boolean;
  };
  // Slack override
  slack?: {
    token?: string;
    channel?: string;
  };
}

export interface ResolvedConfig {
  provider: string;
  profile: string;
  region: string;
  accessKey?: string;
  secretKey?: string;
  sessionToken?: string;
  projectId?: string;
  keyFile?: string;
  subscriptionId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  userId?: string;
  tenancyId?: string;
  fingerprint?: string;
  outputFormat: 'json' | 'text' | 'fancy';
  summary: boolean;
  slackToken?: string;
  slackChannel?: string;
}

/**
 * Configuration Manager for infra-cost
 * Handles loading, saving, and resolving configurations from multiple sources
 */
export class AppConfigManager {
  private static readonly CONFIG_FILENAME = 'infra-cost.config.json';
  private static readonly CONFIG_DIR = '.infra-cost';

  // Configuration file search paths in priority order
  private static readonly CONFIG_PATHS = [
    join(process.cwd(), 'infra-cost.config.json'),           // Project-specific
    join(process.cwd(), '.infra-cost.config.json'),          // Project-specific (hidden)
    join(homedir(), '.infra-cost', 'config.json'),           // User global
    join(homedir(), '.config', 'infra-cost', 'config.json'), // XDG standard
  ];

  private static readonly DEFAULT_CONFIG: InfraCostConfiguration = {
    version: '1.0',
    defaults: {
      provider: CloudProvider.AWS,
      profile: 'default',
      region: 'us-east-1',
      output: {
        format: 'fancy',
        summary: false,
        includeMetadata: true,
      },
    },
    profiles: {},
    cache: {
      enabled: true,
      ttl: '4h',
      type: 'file',
    },
    monitoring: {
      enabled: false,
      interval: '1h',
    },
    alerts: {
      enabled: false,
    },
  };

  /**
   * Load configuration from file or environment
   * Priority: CLI args > Environment vars > Config file profile > Config file defaults > Built-in defaults
   */
  static loadConfiguration(configPath?: string): InfraCostConfiguration {
    const path = configPath || this.findConfigFile();

    if (path && existsSync(path)) {
      try {
        const configContent = readFileSync(path, 'utf8');
        const config = JSON.parse(configContent) as InfraCostConfiguration;
        return this.mergeWithDefaults(config);
      } catch (error) {
        console.warn(`Failed to load configuration from ${path}: ${(error as Error).message}`);
        console.warn('Using default configuration...');
      }
    }

    // Try to load from environment variables
    const envConfig = this.loadFromEnvironment();
    return this.mergeWithDefaults(envConfig);
  }

  /**
   * Find the first existing configuration file from search paths
   */
  static findConfigFile(): string | null {
    // Check environment variable first
    if (process.env.INFRA_COST_CONFIG && existsSync(process.env.INFRA_COST_CONFIG)) {
      return process.env.INFRA_COST_CONFIG;
    }

    // Search through standard paths
    for (const path of this.CONFIG_PATHS) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Save configuration to file
   */
  static saveConfiguration(config: InfraCostConfiguration, configPath?: string): void {
    const path = configPath || join(homedir(), this.CONFIG_DIR, 'config.json');
    const dir = dirname(path);

    try {
      // Ensure directory exists
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(path, JSON.stringify(config, null, 2));
      // Set restrictive permissions (owner read/write only) for security
      // Config files may contain sensitive credentials
      chmodSync(path, 0o600);
      console.log(`Configuration saved to ${path}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Create a sample configuration file
   */
  static createSampleConfig(configPath?: string): void {
    const path = configPath || join(process.cwd(), this.CONFIG_FILENAME);

    const sampleConfig: InfraCostConfiguration = {
      $schema: 'https://infra-cost.io/config.schema.json',
      version: '1.0',
      defaults: {
        provider: 'aws',
        profile: 'default',
        region: 'us-east-1',
        output: {
          format: 'fancy',
          summary: false,
          includeMetadata: true,
        },
      },
      profiles: {
        production: {
          provider: 'aws',
          profile: 'prod',
          region: 'us-east-1',
          slack: {
            token: '${SLACK_PROD_TOKEN}',
            channel: '#infrastructure-costs',
          },
        },
        staging: {
          provider: 'aws',
          profile: 'staging',
          region: 'eu-west-1',
        },
        development: {
          provider: 'aws',
          profile: 'dev',
          region: 'us-west-2',
          output: {
            format: 'text',
            summary: true,
          },
        },
        'multi-cloud': {
          provider: 'aws',
          output: {
            format: 'json',
          },
        },
      },
      slack: {
        token: '${SLACK_TOKEN}',
        channel: '#cost-alerts',
        enabled: true,
      },
      cache: {
        enabled: true,
        ttl: '4h',
        type: 'file',
      },
      monitoring: {
        enabled: false,
        interval: '1h',
      },
      alerts: {
        defaultThreshold: 1000,
        defaultChannel: 'slack',
        enabled: true,
      },
    };

    this.saveConfiguration(sampleConfig, path);
    console.log('Sample configuration created with common scenarios');
    console.log('Customize the profiles and settings as needed');
  }

  /**
   * Initialize configuration file interactively
   */
  static initializeConfig(configPath?: string, force: boolean = false): void {
    const path = configPath || join(process.cwd(), this.CONFIG_FILENAME);

    if (existsSync(path) && !force) {
      console.log(`Configuration file already exists at ${path}`);
      console.log('Use --force to overwrite or specify a different path');
      return;
    }

    this.createSampleConfig(path);
  }

  /**
   * Validate configuration
   */
  static validateConfiguration(config: InfraCostConfiguration): string[] {
    const errors: string[] = [];

    // Validate version
    if (!config.version) {
      errors.push('Configuration version is required');
    }

    // Validate defaults
    if (!config.defaults) {
      errors.push('Default configuration section is required');
    } else {
      if (!config.defaults.provider) {
        errors.push('Default provider is required');
      }
      if (!config.defaults.region) {
        errors.push('Default region is required');
      }
    }

    // Validate profiles
    if (config.profiles) {
      for (const [profileName, profile] of Object.entries(config.profiles)) {
        if (profile.provider && !Object.values(CloudProvider).includes(profile.provider as CloudProvider)) {
          // Allow string providers for flexibility
          const validProviders = ['aws', 'gcp', 'azure', 'alicloud', 'oracle'];
          if (!validProviders.includes(profile.provider.toLowerCase())) {
            errors.push(`Profile '${profileName}': invalid provider '${profile.provider}'`);
          }
        }
      }
    }

    // Validate cache settings
    if (config.cache) {
      if (config.cache.ttl && !this.isValidTTL(config.cache.ttl)) {
        errors.push('Cache TTL must be in format like "4h", "30m", "1d"');
      }
      if (config.cache.type === 'redis' && !config.cache.redisUrl) {
        errors.push('Redis URL is required when cache type is "redis"');
      }
    }

    return errors;
  }

  /**
   * Resolve configuration by merging CLI options with config file settings
   * Priority: CLI options > Environment variables > Profile settings > Default settings
   */
  static resolveConfig(
    cliOptions: Partial<ResolvedConfig>,
    configProfileName?: string,
    configFilePath?: string
  ): ResolvedConfig {
    const config = this.loadConfiguration(configFilePath);
    const profile = configProfileName ? config.profiles[configProfileName] : null;

    // Resolve environment variable references in config values
    // Supports both ${VAR} and $VAR patterns
    const resolveEnvVar = (value: string | undefined): string | undefined => {
      if (!value) return value;
      // Handle ${VAR} pattern
      if (value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        return process.env[envVar] || value;
      }
      // Handle $VAR pattern (must be the entire value and a valid env var name)
      if (value.startsWith('$') && /^\$[A-Z_][A-Z0-9_]*$/i.test(value)) {
        const envVar = value.slice(1);
        return process.env[envVar] || value;
      }
      return value;
    };

    // Build resolved config with priority: CLI > Env > Profile > Defaults
    const resolved: ResolvedConfig = {
      // Provider settings
      provider: cliOptions.provider ||
        process.env.INFRA_COST_PROVIDER ||
        profile?.provider ||
        config.defaults.provider ||
        'aws',

      profile: cliOptions.profile ||
        process.env.INFRA_COST_PROFILE ||
        profile?.profile ||
        config.defaults.profile ||
        'default',

      region: cliOptions.region ||
        process.env.INFRA_COST_REGION ||
        process.env.AWS_REGION ||
        profile?.region ||
        config.defaults.region ||
        'us-east-1',

      // Credentials
      accessKey: cliOptions.accessKey ||
        process.env.AWS_ACCESS_KEY_ID ||
        resolveEnvVar(profile?.accessKey),

      secretKey: cliOptions.secretKey ||
        process.env.AWS_SECRET_ACCESS_KEY ||
        resolveEnvVar(profile?.secretKey),

      sessionToken: cliOptions.sessionToken ||
        process.env.AWS_SESSION_TOKEN ||
        resolveEnvVar(profile?.sessionToken),

      // GCP settings
      projectId: cliOptions.projectId ||
        process.env.GCP_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        profile?.projectId,

      keyFile: cliOptions.keyFile ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        profile?.keyFile,

      // Azure settings
      subscriptionId: cliOptions.subscriptionId ||
        process.env.AZURE_SUBSCRIPTION_ID ||
        profile?.subscriptionId,

      tenantId: cliOptions.tenantId ||
        process.env.AZURE_TENANT_ID ||
        profile?.tenantId,

      clientId: cliOptions.clientId ||
        process.env.AZURE_CLIENT_ID ||
        profile?.clientId,

      clientSecret: cliOptions.clientSecret ||
        process.env.AZURE_CLIENT_SECRET ||
        resolveEnvVar(profile?.clientSecret),

      // Oracle settings
      userId: cliOptions.userId ||
        process.env.OCI_USER_ID ||
        profile?.userId,

      tenancyId: cliOptions.tenancyId ||
        process.env.OCI_TENANCY_ID ||
        profile?.tenancyId,

      fingerprint: cliOptions.fingerprint ||
        process.env.OCI_FINGERPRINT ||
        profile?.fingerprint,

      // Output settings
      outputFormat: (cliOptions.outputFormat ||
        profile?.output?.format ||
        config.defaults.output?.format ||
        'fancy') as 'json' | 'text' | 'fancy',

      summary: cliOptions.summary ??
        profile?.output?.summary ??
        config.defaults.output?.summary ??
        false,

      // Slack settings
      slackToken: cliOptions.slackToken ||
        process.env.SLACK_TOKEN ||
        resolveEnvVar(profile?.slack?.token) ||
        resolveEnvVar(config.slack?.token),

      slackChannel: cliOptions.slackChannel ||
        process.env.SLACK_CHANNEL ||
        profile?.slack?.channel ||
        config.slack?.channel,
    };

    return resolved;
  }

  /**
   * List available profiles from configuration
   */
  static listProfiles(): string[] {
    const config = this.loadConfiguration();
    return Object.keys(config.profiles);
  }

  /**
   * Get profile details
   */
  static getProfile(profileName: string): ConfigProfile | null {
    const config = this.loadConfiguration();
    return config.profiles[profileName] || null;
  }

  /**
   * Add or update a profile
   */
  static setProfile(profileName: string, profile: ConfigProfile, configPath?: string): void {
    const config = this.loadConfiguration(configPath);
    config.profiles[profileName] = profile;
    this.saveConfiguration(config, configPath);
  }

  /**
   * Remove a profile
   */
  static removeProfile(profileName: string, configPath?: string): boolean {
    const config = this.loadConfiguration(configPath);
    if (config.profiles[profileName]) {
      delete config.profiles[profileName];
      this.saveConfiguration(config, configPath);
      return true;
    }
    return false;
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnvironment(): Partial<InfraCostConfiguration> {
    const config: Partial<InfraCostConfiguration> = {
      defaults: {
        provider: process.env.INFRA_COST_PROVIDER as CloudProvider || CloudProvider.AWS,
        profile: process.env.INFRA_COST_PROFILE || 'default',
        region: process.env.INFRA_COST_REGION || process.env.AWS_REGION || 'us-east-1',
        output: {
          format: (process.env.INFRA_COST_OUTPUT_FORMAT as 'json' | 'text' | 'fancy') || 'fancy',
          summary: process.env.INFRA_COST_SUMMARY === 'true',
          includeMetadata: process.env.INFRA_COST_INCLUDE_METADATA !== 'false',
        },
      },
      profiles: {},
    };

    // Load slack settings from environment
    if (process.env.SLACK_TOKEN) {
      config.slack = {
        token: process.env.SLACK_TOKEN,
        channel: process.env.SLACK_CHANNEL || '#cost-alerts',
        enabled: true,
      };
    }

    return config;
  }

  /**
   * Merge user configuration with defaults
   */
  private static mergeWithDefaults(config: Partial<InfraCostConfiguration>): InfraCostConfiguration {
    return {
      ...this.DEFAULT_CONFIG,
      ...config,
      defaults: {
        ...this.DEFAULT_CONFIG.defaults,
        ...config.defaults,
        output: {
          ...this.DEFAULT_CONFIG.defaults.output,
          ...config.defaults?.output,
        },
      },
      profiles: {
        ...this.DEFAULT_CONFIG.profiles,
        ...config.profiles,
      },
      cache: {
        ...this.DEFAULT_CONFIG.cache!,
        ...config.cache,
      },
      monitoring: {
        ...this.DEFAULT_CONFIG.monitoring!,
        ...config.monitoring,
      },
      alerts: {
        ...this.DEFAULT_CONFIG.alerts!,
        ...config.alerts,
      },
    };
  }

  /**
   * Validate TTL format (e.g., "4h", "30m", "1d")
   */
  private static isValidTTL(ttl: string): boolean {
    return /^\d+[smhd]$/.test(ttl);
  }

  /**
   * Parse TTL string to milliseconds
   */
  static parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 4 * 60 * 60 * 1000; // Default 4 hours

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 4 * 60 * 60 * 1000;
    }
  }
}

// CLI helper functions
export function configInit(configPath?: string, force: boolean = false): void {
  AppConfigManager.initializeConfig(configPath, force);
}

export function configValidate(configPath?: string): boolean {
  try {
    const config = AppConfigManager.loadConfiguration(configPath);
    const errors = AppConfigManager.validateConfiguration(config);

    if (errors.length === 0) {
      console.log('Configuration is valid');
      return true;
    } else {
      console.log('Configuration validation failed:');
      errors.forEach(error => console.log(`  - ${error}`));
      return false;
    }
  } catch (error) {
    console.error(`Failed to validate configuration: ${(error as Error).message}`);
    return false;
  }
}

export function configListProfiles(): void {
  const profiles = AppConfigManager.listProfiles();

  if (profiles.length === 0) {
    console.log('No profiles configured.');
    console.log('Run "infra-cost --config-init" to create a sample configuration.');
    return;
  }

  console.log('Available profiles:');
  profiles.forEach(profile => {
    const details = AppConfigManager.getProfile(profile);
    const provider = details?.provider || 'aws';
    const region = details?.region || 'default';
    console.log(`  - ${profile} (${provider}, ${region})`);
  });
}

export function configShow(configPath?: string): void {
  const config = AppConfigManager.loadConfiguration(configPath);
  console.log(JSON.stringify(config, null, 2));
}

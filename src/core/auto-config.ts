/**
 * Auto Configuration Loader
 * Sprint 6: UX Improvements
 *
 * Automatically discovers and applies configuration from config files,
 * environment variables, and smart defaults to provide a seamless experience.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Configuration file search paths in priority order
const CONFIG_PATHS = [
  join(process.cwd(), 'infra-cost.config.json'),           // Project-specific
  join(process.cwd(), '.infra-cost.config.json'),          // Project-specific (hidden)
  join(process.cwd(), '.infra-cost', 'config.json'),       // Project directory
  join(homedir(), '.infra-cost', 'config.json'),           // User global
  join(homedir(), '.config', 'infra-cost', 'config.json'), // XDG standard
];

// Configuration Interface
export interface AutoConfig {
  // Provider settings
  provider?: string;
  profile?: string;
  region?: string;

  // Credentials (resolved from env vars)
  accessKey?: string;
  secretKey?: string;
  sessionToken?: string;

  // Output preferences
  output?: {
    format?: 'json' | 'text' | 'fancy';
    summary?: boolean;
    showDelta?: boolean;
    showQuickWins?: boolean;
    deltaThreshold?: number;
    quickWinsCount?: number;
  };

  // Cache settings
  cache?: {
    enabled?: boolean;
    ttl?: string;
    type?: 'file' | 'memory';
  };

  // Slack settings
  slack?: {
    token?: string;
    channel?: string;
    enabled?: boolean;
  };

  // Chargeback defaults
  chargeback?: {
    dimensions?: string[];
    handleUntagged?: string;
  };

  // Logging
  logging?: {
    level?: string;
    format?: string;
    auditEnabled?: boolean;
  };
}

// Default configuration values
const DEFAULT_CONFIG: AutoConfig = {
  provider: 'aws',
  profile: 'default',
  region: 'us-east-1',
  output: {
    format: 'fancy',
    summary: false,
    showDelta: true,          // NEW: Show delta by default
    showQuickWins: true,      // NEW: Show quick wins by default
    deltaThreshold: 10,
    quickWinsCount: 3,
  },
  cache: {
    enabled: true,            // NEW: Cache enabled by default
    ttl: '4h',
    type: 'file',
  },
  logging: {
    level: 'info',
    format: 'pretty',
    auditEnabled: false,
  },
};

/**
 * Discover configuration file
 */
export function discoverConfigFile(): string | null {
  for (const configPath of CONFIG_PATHS) {
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Load configuration from file
 */
export function loadConfigFile(configPath: string): Partial<AutoConfig> {
  try {
    const content = readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    // Handle profile-specific config
    if (config.profiles && config.defaults?.profile) {
      const activeProfile = config.profiles[config.defaults.profile];
      if (activeProfile) {
        return mergeConfigs(config.defaults, activeProfile);
      }
    }

    return config.defaults || config;
  } catch (error) {
    console.warn(`Warning: Could not load config from ${configPath}: ${(error as Error).message}`);
    return {};
  }
}

/**
 * Resolve environment variables in config values
 */
export function resolveEnvVars(config: Partial<AutoConfig>): Partial<AutoConfig> {
  const resolved: Partial<AutoConfig> = JSON.parse(JSON.stringify(config));

  // Resolve credentials from environment (env vars always override config)
  if (process.env.AWS_ACCESS_KEY_ID) {
    resolved.accessKey = process.env.AWS_ACCESS_KEY_ID;
  }
  if (process.env.AWS_SECRET_ACCESS_KEY) {
    resolved.secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  }
  if (process.env.AWS_SESSION_TOKEN) {
    resolved.sessionToken = process.env.AWS_SESSION_TOKEN;
  }
  if (process.env.AWS_REGION) {
    resolved.region = process.env.AWS_REGION;
  }
  if (process.env.AWS_PROFILE) {
    resolved.profile = process.env.AWS_PROFILE;
  }

  // Resolve Slack from environment (env vars always override config)
  if (process.env.SLACK_TOKEN || process.env.SLACK_CHANNEL) {
    resolved.slack = {
      ...resolved.slack,
      token: process.env.SLACK_TOKEN ?? resolved.slack?.token,
      channel: process.env.SLACK_CHANNEL ?? resolved.slack?.channel,
      enabled: true,
    };
  }

  return resolved;
}

/**
 * Merge multiple configs with priority
 */
export function mergeConfigs(...configs: Partial<AutoConfig>[]): AutoConfig {
  const result: any = {};

  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        result[key] = { ...result[key], ...value };
      } else {
        result[key] = value;
      }
    }
  }

  return result as AutoConfig;
}

/**
 * Auto-load configuration from all sources
 * Priority: CLI args > Environment > Config file > Defaults
 */
export function autoLoadConfig(cliOptions: Record<string, any> = {}): AutoConfig {
  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Load from config file if exists
  const configPath = cliOptions.configFile || discoverConfigFile();
  if (configPath) {
    const fileConfig = loadConfigFile(configPath);
    config = mergeConfigs(config, fileConfig);
  }

  // Apply environment variables
  config = mergeConfigs(config, resolveEnvVars(config));

  // Apply CLI options (highest priority)
  const cliConfig = mapCliOptionsToConfig(cliOptions);
  config = mergeConfigs(config, cliConfig);

  return config;
}

/**
 * Map CLI options to config structure
 */
function mapCliOptionsToConfig(options: Record<string, any>): Partial<AutoConfig> {
  const config: Partial<AutoConfig> = {};

  // Provider settings
  if (options.provider) config.provider = options.provider;
  if (options.profile) config.profile = options.profile;
  if (options.region) config.region = options.region;
  if (options.accessKey) config.accessKey = options.accessKey;
  if (options.secretKey) config.secretKey = options.secretKey;
  if (options.sessionToken) config.sessionToken = options.sessionToken;

  // Output settings
  if (options.json || options.text || options.summary) {
    config.output = config.output || {};
    if (options.json) config.output.format = 'json';
    if (options.text) config.output.format = 'text';
    if (options.summary) config.output.summary = true;
  }

  // Delta settings
  if (options.delta !== undefined) {
    config.output = config.output || {};
    config.output.showDelta = options.delta;
  }
  if (options.deltaThreshold) {
    config.output = config.output || {};
    config.output.deltaThreshold = parseFloat(options.deltaThreshold);
  }

  // Quick wins settings
  if (options.quickWins !== undefined) {
    config.output = config.output || {};
    config.output.showQuickWins = options.quickWins;
  }
  if (options.quickWinsCount) {
    config.output = config.output || {};
    config.output.quickWinsCount = parseInt(options.quickWinsCount, 10);
  }

  // Cache settings
  if (options.cache !== undefined || options.noCache !== undefined) {
    config.cache = config.cache || {};
    config.cache.enabled = options.cache === true || (options.noCache !== true);
  }
  if (options.cacheTtl) {
    config.cache = config.cache || {};
    config.cache.ttl = options.cacheTtl;
  }
  if (options.cacheType) {
    config.cache = config.cache || {};
    config.cache.type = options.cacheType;
  }

  // Slack settings
  if (options.slackToken || options.slackChannel) {
    config.slack = config.slack || {};
    if (options.slackToken) config.slack.token = options.slackToken;
    if (options.slackChannel) config.slack.channel = options.slackChannel;
    config.slack.enabled = true;
  }

  // Logging settings
  if (options.logLevel || options.verbose || options.quiet) {
    config.logging = config.logging || {};
    if (options.logLevel) config.logging.level = options.logLevel;
    if (options.verbose) config.logging.level = 'debug';
    if (options.quiet) config.logging.level = 'error';
  }

  return config;
}

/**
 * Generate sample configuration file content
 */
export function generateSampleConfig(): string {
  const sample = {
    $schema: 'https://infra-cost.dev/schema/config.json',
    version: '1.0',
    defaults: {
      provider: 'aws',
      profile: 'default',
      region: 'us-east-1',
      output: {
        format: 'fancy',
        summary: false,
        showDelta: true,
        showQuickWins: true,
        deltaThreshold: 10,
        quickWinsCount: 3,
      },
      cache: {
        enabled: true,
        ttl: '4h',
        type: 'file',
      },
      slack: {
        token: '${SLACK_TOKEN}',
        channel: '#finops',
        enabled: false,
      },
      chargeback: {
        dimensions: ['team', 'project', 'environment'],
        handleUntagged: 'shared',
      },
      logging: {
        level: 'info',
        format: 'pretty',
        auditEnabled: false,
      },
    },
    profiles: {
      production: {
        profile: 'prod-account',
        region: 'us-east-1',
        output: {
          format: 'json',
        },
        slack: {
          channel: '#prod-costs',
          enabled: true,
        },
      },
      staging: {
        profile: 'staging-account',
        region: 'us-west-2',
      },
      development: {
        profile: 'dev-account',
        region: 'us-west-2',
        cache: {
          enabled: false,
        },
      },
    },
  };

  return JSON.stringify(sample, null, 2);
}

/**
 * Print configuration status
 */
export function printConfigStatus(config: AutoConfig, configPath: string | null): void {
  console.log('');
  console.log('📋 Configuration Status');
  console.log('─'.repeat(50));

  if (configPath) {
    console.log(`✓ Config file: ${configPath}`);
  } else {
    console.log('○ No config file found (using defaults)');
  }

  console.log(`  Provider: ${config.provider}`);
  console.log(`  Profile: ${config.profile}`);
  console.log(`  Region: ${config.region}`);
  console.log(`  Cache: ${config.cache?.enabled ? 'enabled' : 'disabled'} (TTL: ${config.cache?.ttl})`);
  console.log(`  Show Delta: ${config.output?.showDelta ? 'yes' : 'no'}`);
  console.log(`  Show Quick Wins: ${config.output?.showQuickWins ? 'yes' : 'no'}`);

  if (config.slack?.enabled) {
    console.log(`  Slack: ${config.slack.channel}`);
  }

  console.log('');
}

/**
 * Configuration Schema and Validation
 *
 * Unified configuration schema using Zod for type-safe validation
 * across all configuration sources (files, environment, CLI)
 */

import { z } from 'zod';

// Provider Configuration Schema
export const ProviderConfigSchema = z.object({
  provider: z.enum(['aws', 'gcp', 'azure', 'alibaba', 'oracle']).default('aws'),
  profile: z.string().default('default'),
  region: z.string().default('us-east-1'),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  sessionToken: z.string().optional(),

  // GCP specific
  projectId: z.string().optional(),
  keyFile: z.string().optional(),

  // Azure specific
  subscriptionId: z.string().optional(),
  tenantId: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),

  // Oracle specific
  userId: z.string().optional(),
  tenancyId: z.string().optional(),
  fingerprint: z.string().optional(),
});

// Output Configuration Schema
export const OutputConfigSchema = z.object({
  format: z.enum(['json', 'text', 'fancy', 'table']).default('fancy'),
  summary: z.boolean().default(false),
  showDelta: z.boolean().default(true),
  showQuickWins: z.boolean().default(true),
  deltaThreshold: z.number().min(0).max(100).default(10),
  quickWinsCount: z.number().int().min(1).max(10).default(3),
  colorOutput: z.boolean().default(true),
});

// Cache Configuration Schema
export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  ttl: z.string().default('4h'),
  type: z.enum(['file', 'memory']).default('file'),
  directory: z.string().optional(),
});

// Slack Configuration Schema
export const SlackConfigSchema = z.object({
  enabled: z.boolean().default(false),
  token: z.string().optional(),
  channel: z.string().optional(),
});

// Logging Configuration Schema
// Log Output Schema matching LogOutput interface
const LogOutputSchema = z.object({
  type: z.enum(['console', 'file', 'syslog', 'http']),
  destination: z.string().optional(),
  level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).optional(),
});

// Logging Configuration Schema - aligned with LoggingConfig interface
export const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  format: z.enum(['json', 'pretty', 'compact']).default('pretty'),
  outputs: z.array(LogOutputSchema).default([{ type: 'console' }]),
  enableAudit: z.boolean().default(false),
  auditOutput: z.string().optional(),
  correlationId: z.string().optional(),
  component: z.string().optional(),
  enablePerformance: z.boolean().optional(),
  silent: z.boolean().optional(),
});

// Chargeback Configuration Schema
export const ChargebackConfigSchema = z.object({
  dimensions: z.array(z.string()).default(['team', 'project', 'environment']),
  handleUntagged: z.enum(['ignore', 'shared', 'proportional']).default('shared'),
  requiredTags: z.array(z.string()).default([]),
});

// Alert Threshold Schema
const AlertThresholdSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ABSOLUTE', 'PERCENTAGE', 'ANOMALY', 'TREND', 'BUDGET_FORECAST']),
  condition: z.enum(['GREATER_THAN', 'LESS_THAN', 'EQUALS', 'DEVIATION']),
  value: z.number(),
  timeWindow: z.number(),
  provider: z.string().optional(),
  service: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  enabled: z.boolean(),
});

// Monitoring Configuration Schema
export const MonitoringConfigSchema = z.object({
  enabled: z.boolean().default(false),
  alertThresholds: z.array(AlertThresholdSchema).default([]),
  anomalyDetection: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
});

// Organizations Configuration Schema
export const OrganizationsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  managementAccountId: z.string().optional(),
  accountFilters: z.array(z.string()).optional(),
});

// Profile Configuration Schema
export const ProfileConfigSchema = z.object({
  name: z.string(),
  provider: ProviderConfigSchema.optional(),
  output: OutputConfigSchema.optional(),
  cache: CacheConfigSchema.optional(),
  slack: SlackConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
  chargeback: ChargebackConfigSchema.optional(),
  monitoring: MonitoringConfigSchema.optional(),
  organizations: OrganizationsConfigSchema.optional(),
});

// Main Configuration Schema
export const ConfigSchema = z.object({
  version: z.string().default('1.0'),

  // Default settings
  provider: ProviderConfigSchema.optional(),
  output: OutputConfigSchema.optional(),
  cache: CacheConfigSchema.optional(),
  slack: SlackConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
  chargeback: ChargebackConfigSchema.optional(),
  monitoring: MonitoringConfigSchema.optional(),
  organizations: OrganizationsConfigSchema.optional(),

  // Named profiles
  profiles: z.record(z.string(), ProfileConfigSchema).optional(),

  // Active profile
  activeProfile: z.string().optional(),
});

// Unified Configuration Type
export type UnifiedConfig = z.infer<typeof ConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type OutputConfig = z.infer<typeof OutputConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type ChargebackConfig = z.infer<typeof ChargebackConfigSchema>;
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type OrganizationsConfig = z.infer<typeof OrganizationsConfigSchema>;
export type ProfileConfig = z.infer<typeof ProfileConfigSchema>;

/**
 * Validate configuration against schema
 */
export function validateConfig(config: unknown): UnifiedConfig {
  return ConfigSchema.parse(config);
}

/**
 * Validate configuration with detailed error messages
 */
export function validateConfigSafe(config: unknown): {
  success: boolean;
  data?: UnifiedConfig;
  errors?: z.ZodError
} {
  const result = ConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): UnifiedConfig {
  return ConfigSchema.parse({});
}

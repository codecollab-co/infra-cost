/**
 * Unified Configuration System
 *
 * Central configuration management for infra-cost
 * Consolidates:
 * - src/core/auto-config.ts (file discovery, env vars, CLI priority)
 * - src/config/app-config.ts (profile management)
 * - src/config.ts (AWS-specific config - moved to providers/aws)
 * - src/monitoring/config.ts (merged into unified schema)
 */

// Export all configuration types and schemas
export * from './schema';

// Export configuration loader
export {
  discoverConfigFile,
  loadConfigFile,
  resolveEnvVars,
  mergeConfigs,
  autoLoadConfig,
  generateSampleConfig,
  printConfigStatus,
} from './loader';

// Export profile management
export {
  getProfile,
  listProfiles,
  getActiveProfileName,
  mergeProfileWithBase,
  applyActiveProfile,
  formatProfileList,
  profileExists,
  getProfileSummary,
} from './profiles';

// Export cloud profile discovery
export {
  discoverCloudProfiles,
  getAWSProfiles,
  getGCPProfiles,
  getAzureProfiles,
} from './discovery';

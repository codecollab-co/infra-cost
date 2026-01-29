/**
 * Configuration Profiles Management
 *
 * Manages named configuration profiles (production, staging, development, etc.)
 * Merged from app-config.ts functionality
 */

import { UnifiedConfig, ProfileConfig } from './schema';

/**
 * Get profile from configuration
 */
export function getProfile(config: UnifiedConfig, profileName: string): ProfileConfig | null {
  if (!config.profiles || !config.profiles[profileName]) {
    return null;
  }
  return config.profiles[profileName];
}

/**
 * List all available profiles
 */
export function listProfiles(config: UnifiedConfig): string[] {
  if (!config.profiles) {
    return [];
  }
  return Object.keys(config.profiles);
}

/**
 * Get active profile name
 */
export function getActiveProfileName(config: UnifiedConfig): string | null {
  return config.activeProfile || null;
}

/**
 * Merge profile settings with base configuration
 */
export function mergeProfileWithBase(
  base: UnifiedConfig,
  profileName: string
): UnifiedConfig {
  const profile = getProfile(base, profileName);
  if (!profile) {
    return base;
  }

  // Deep merge profile settings into base
  const merged: UnifiedConfig = {
    ...base,
    provider: { ...base.provider, ...profile.provider },
    output: { ...base.output, ...profile.output },
    cache: { ...base.cache, ...profile.cache },
    slack: { ...base.slack, ...profile.slack },
    logging: { ...base.logging, ...profile.logging },
    chargeback: { ...base.chargeback, ...profile.chargeback },
    monitoring: { ...base.monitoring, ...profile.monitoring },
    organizations: { ...base.organizations, ...profile.organizations },
  };

  return merged;
}

/**
 * Apply active profile if set
 */
export function applyActiveProfile(config: UnifiedConfig): UnifiedConfig {
  const activeProfile = getActiveProfileName(config);
  if (!activeProfile) {
    return config;
  }
  return mergeProfileWithBase(config, activeProfile);
}

/**
 * Format profile list for display
 */
export function formatProfileList(config: UnifiedConfig): string {
  const profiles = listProfiles(config);
  const activeProfile = getActiveProfileName(config);

  if (profiles.length === 0) {
    return 'No profiles configured';
  }

  const lines: string[] = [];
  lines.push('Available Profiles:');
  lines.push('─'.repeat(50));

  for (const profileName of profiles) {
    const profile = getProfile(config, profileName);
    const isActive = profileName === activeProfile;
    const marker = isActive ? '●' : '○';
    const label = isActive ? `${profileName} (active)` : profileName;

    lines.push(`${marker} ${label}`);
    if (profile?.provider?.provider) {
      lines.push(`   Provider: ${profile.provider.provider}`);
    }
    if (profile?.provider?.region) {
      lines.push(`   Region: ${profile.provider.region}`);
    }
  }

  return lines.join('\n');
}

/**
 * Validate profile exists
 */
export function profileExists(config: UnifiedConfig, profileName: string): boolean {
  return listProfiles(config).includes(profileName);
}

/**
 * Get profile summary
 */
export function getProfileSummary(
  config: UnifiedConfig,
  profileName: string
): Record<string, any> | null {
  const profile = getProfile(config, profileName);
  if (!profile) {
    return null;
  }

  return {
    name: profileName,
    provider: profile.provider?.provider || 'default',
    region: profile.provider?.region || 'default',
    cacheEnabled: profile.cache?.enabled ?? true,
    slackEnabled: profile.slack?.enabled ?? false,
    loggingLevel: profile.logging?.level || 'info',
  };
}

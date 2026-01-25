import { fromSSO } from '@aws-sdk/credential-providers';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse as parseIni } from 'ini';
import chalk from 'chalk';

/**
 * SSO Provider for AWS Authentication
 * Issue #9: Add support to SSO login
 *
 * Supports:
 * - AWS IAM Identity Center (SSO) profiles
 * - Automatic SSO session detection
 * - Token refresh handling
 * - Legacy SSO profile support
 */

export interface SSOProfile {
  sso_start_url: string;
  sso_region: string;
  sso_account_id: string;
  sso_role_name: string;
  region?: string;
  output?: string;
  // Legacy SSO session reference
  sso_session?: string;
}

export interface SSOSession {
  sso_start_url: string;
  sso_region: string;
  sso_registration_scopes?: string[];
}

export interface SSOProfileInfo {
  profileName: string;
  isSSO: boolean;
  ssoStartUrl?: string;
  ssoRegion?: string;
  ssoAccountId?: string;
  ssoRoleName?: string;
  ssoSession?: string;
  region?: string;
}

export interface SSOLoginResult {
  success: boolean;
  profileName: string;
  accountId?: string;
  roleName?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Get the filesystem paths for the AWS config and shared credentials files.
 *
 * @returns An object with `configPath` — the path to the AWS config file, and `credentialsPath` — the path to the AWS shared credentials file. Each value uses the corresponding environment variable (`AWS_CONFIG_FILE`, `AWS_SHARED_CREDENTIALS_FILE`) if set; otherwise it defaults to `~/.aws/config` and `~/.aws/credentials`.
 */
function getAwsConfigPaths(): { configPath: string; credentialsPath: string } {
  return {
    configPath: process.env.AWS_CONFIG_FILE || join(homedir(), '.aws', 'config'),
    credentialsPath: process.env.AWS_SHARED_CREDENTIALS_FILE || join(homedir(), '.aws', 'credentials'),
  };
}

/**
 * Read and parse the AWS CLI config file into INI sections.
 *
 * Returns an object whose keys are section names and whose values are key/value maps from that section.
 * If the config file does not exist or cannot be read/parsed, an empty object is returned.
 *
 * @returns An object mapping INI section names to their key/value pairs, or an empty object when missing or unreadable
 */
function parseAwsConfig(): Record<string, Record<string, string>> {
  const { configPath } = getAwsConfigPaths();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf8');
    return parseIni(content);
  } catch (error) {
    console.warn(`Failed to parse AWS config file: ${(error as Error).message}`);
    return {};
  }
}

/**
 * Determine whether an AWS profile is configured to use SSO.
 *
 * @param profileName - The profile name to check; the literal string `default` maps to the `default` config section, other names map to `profile <name>`.
 * @returns `true` if the profile contains SSO configuration (e.g., `sso_start_url`, `sso_session`, or `sso_account_id`), `false` otherwise.
 */
export function isSSOProfile(profileName: string): boolean {
  const config = parseAwsConfig();
  const section = profileName === 'default' ? 'default' : `profile ${profileName}`;
  const profileConfig = config[section];

  if (!profileConfig) {
    return false;
  }

  // Check for SSO configuration indicators
  return !!(
    profileConfig.sso_start_url ||
    profileConfig.sso_session ||
    profileConfig.sso_account_id
  );
}

/**
 * Retrieve SSO-related configuration for an AWS profile.
 *
 * @param profileName - Name of the AWS profile to inspect (use "default" for the default section)
 * @returns The profile's SSO information and derived fields, or `null` if the profile does not exist
 */
export function getSSOProfileInfo(profileName: string): SSOProfileInfo | null {
  const config = parseAwsConfig();
  const section = profileName === 'default' ? 'default' : `profile ${profileName}`;
  const profileConfig = config[section];

  if (!profileConfig) {
    return null;
  }

  const isSSO = !!(
    profileConfig.sso_start_url ||
    profileConfig.sso_session ||
    profileConfig.sso_account_id
  );

  if (!isSSO) {
    return {
      profileName,
      isSSO: false,
      region: profileConfig.region,
    };
  }

  // Check for sso-session reference
  let ssoStartUrl = profileConfig.sso_start_url;
  let ssoRegion = profileConfig.sso_region;

  if (profileConfig.sso_session) {
    const sessionSection = `sso-session ${profileConfig.sso_session}`;
    const sessionConfig = config[sessionSection];
    if (sessionConfig) {
      ssoStartUrl = ssoStartUrl || sessionConfig.sso_start_url;
      ssoRegion = ssoRegion || sessionConfig.sso_region;
    }
  }

  return {
    profileName,
    isSSO: true,
    ssoStartUrl,
    ssoRegion,
    ssoAccountId: profileConfig.sso_account_id,
    ssoRoleName: profileConfig.sso_role_name,
    ssoSession: profileConfig.sso_session,
    region: profileConfig.region || ssoRegion,
  };
}

/**
 * Retrieve all AWS profiles configured for SSO from the current AWS config.
 *
 * @returns An array of `SSOProfileInfo` objects for each profile that is configured for SSO
 */
export function discoverSSOProfiles(): SSOProfileInfo[] {
  const config = parseAwsConfig();
  const profiles: SSOProfileInfo[] = [];

  for (const section of Object.keys(config)) {
    let profileName: string;

    if (section === 'default') {
      profileName = 'default';
    } else if (section.startsWith('profile ')) {
      profileName = section.replace('profile ', '');
    } else {
      continue; // Skip non-profile sections like sso-session
    }

    const info = getSSOProfileInfo(profileName);
    if (info && info.isSSO) {
      profiles.push(info);
    }
  }

  return profiles;
}

/**
 * Creates an AWS SSO credential provider for the given AWS profile.
 *
 * @param profileName - The AWS profile name to use from the shared config
 * @returns An AWS credential provider that sources credentials via SSO for the specified profile
 * @throws Error if the profile does not exist or is not configured for SSO
 */
export function createSSOCredentialProvider(profileName: string): AwsCredentialIdentityProvider {
  const profileInfo = getSSOProfileInfo(profileName);

  if (!profileInfo || !profileInfo.isSSO) {
    throw new Error(`Profile "${profileName}" is not configured for SSO`);
  }

  // Use the AWS SDK's built-in SSO credential provider
  return fromSSO({ profile: profileName });
}

/**
 * Selects and returns an AWS credential provider appropriate for the given profile.
 *
 * @param profileName - The AWS profile name to resolve (use `"default"` to use the default chain)
 * @returns An AWS credential provider configured for the specified profile. Uses the SSO provider if the profile is configured for SSO; otherwise uses the standard Node provider chain.
 */
export function createAutoCredentialProvider(profileName: string): AwsCredentialIdentityProvider {
  const profileInfo = getSSOProfileInfo(profileName);

  if (profileInfo && profileInfo.isSSO) {
    // Use SSO provider for SSO profiles
    return fromSSO({ profile: profileName });
  }

  // Use the standard credential chain for non-SSO profiles
  return fromNodeProviderChain({
    profile: profileName === 'default' ? undefined : profileName,
  });
}

/**
 * Determine whether a cached SSO token exists and is still valid for the given profile.
 *
 * @param profileName - The AWS profile name to check for a cached SSO token
 * @returns An object with `valid: true` and `expiresAt` when a matching cached token is present and not expired; otherwise `{ valid: false }`
 */
export function checkSSOTokenCache(profileName: string): { valid: boolean; expiresAt?: Date } {
  const profileInfo = getSSOProfileInfo(profileName);

  if (!profileInfo || !profileInfo.isSSO) {
    return { valid: false };
  }

  // Check the SSO token cache directory
  const cacheDir = join(homedir(), '.aws', 'sso', 'cache');

  if (!existsSync(cacheDir)) {
    return { valid: false };
  }

  // The cache file is named based on the hash of the SSO start URL
  // We'll try to find a valid token
  try {
    const { readdirSync } = require('fs');
    const files = readdirSync(cacheDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = readFileSync(join(cacheDir, file), 'utf8');
          const tokenData = JSON.parse(content);

          if (tokenData.startUrl === profileInfo.ssoStartUrl && tokenData.expiresAt) {
            const expiresAt = new Date(tokenData.expiresAt);
            const valid = expiresAt > new Date();
            return { valid, expiresAt };
          }
        } catch {
          continue;
        }
      }
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}

/**
 * Produce formatted, user-facing SSO login instructions for the given AWS profile.
 *
 * @param profileName - The AWS profile name to generate instructions for
 * @returns A multi-line string containing profile details and the command to run to authenticate via AWS SSO; if the profile is not configured for SSO, a message indicating that
 */
export function getSSOLoginInstructions(profileName: string): string {
  const profileInfo = getSSOProfileInfo(profileName);

  if (!profileInfo || !profileInfo.isSSO) {
    return `Profile "${profileName}" is not configured for SSO.`;
  }

  const lines: string[] = [
    '',
    chalk.bold('AWS SSO Login Required'),
    chalk.gray('━'.repeat(50)),
    '',
    `Profile: ${chalk.cyan(profileName)}`,
  ];

  if (profileInfo.ssoStartUrl) {
    lines.push(`SSO Start URL: ${chalk.cyan(profileInfo.ssoStartUrl)}`);
  }
  if (profileInfo.ssoAccountId) {
    lines.push(`Account ID: ${chalk.cyan(profileInfo.ssoAccountId)}`);
  }
  if (profileInfo.ssoRoleName) {
    lines.push(`Role: ${chalk.cyan(profileInfo.ssoRoleName)}`);
  }

  lines.push('');
  lines.push(chalk.bold('To authenticate, run:'));
  lines.push('');
  lines.push(chalk.green(`  aws sso login --profile ${profileName}`));
  lines.push('');
  lines.push(chalk.gray('This will open a browser window for authentication.'));
  lines.push(chalk.gray('Once complete, run infra-cost again.'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Validate that an AWS SSO profile can obtain usable credentials.
 *
 * Attempts to resolve credentials for the given AWS profile and reports whether authentication succeeded, including token expiry when available.
 *
 * @param profileName - The name of the AWS profile to validate
 * @returns An `SSOLoginResult` describing the outcome. On success includes `profileName`, `accountId`, `roleName`, and `expiresAt`. On failure includes `profileName` and an `error` message.
 */
export async function validateSSOCredentials(profileName: string): Promise<SSOLoginResult> {
  const profileInfo = getSSOProfileInfo(profileName);

  if (!profileInfo) {
    return {
      success: false,
      profileName,
      error: `Profile "${profileName}" not found in AWS config`,
    };
  }

  if (!profileInfo.isSSO) {
    return {
      success: false,
      profileName,
      error: `Profile "${profileName}" is not configured for SSO`,
    };
  }

  try {
    const credentialProvider = createSSOCredentialProvider(profileName);
    const credentials = await credentialProvider();

    // Check expiration
    const expiresAt = credentials.expiration;

    return {
      success: true,
      profileName,
      accountId: profileInfo.ssoAccountId,
      roleName: profileInfo.ssoRoleName,
      expiresAt,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;

    // Detect specific SSO errors
    if (errorMessage.includes('Token is expired') || errorMessage.includes('token has expired')) {
      return {
        success: false,
        profileName,
        error: 'SSO token has expired. Please run `aws sso login` to refresh.',
      };
    }

    if (errorMessage.includes('No token found') || errorMessage.includes('missing')) {
      return {
        success: false,
        profileName,
        error: 'No SSO token found. Please run `aws sso login` to authenticate.',
      };
    }

    return {
      success: false,
      profileName,
      error: `SSO authentication failed: ${errorMessage}`,
    };
  }
}

/**
 * Display detailed SSO configuration and token status for the named AWS profile to the console.
 *
 * Prints an error if the profile does not exist and a warning if the profile exists but is not configured for SSO.
 *
 * When the profile is an SSO profile, shows profile name, SSO start URL, SSO region, account ID, role name, default region,
 * optional SSO session, and the cached token status including expiration when available. If the token is missing or expired,
 * prints a hint to run the SSO login command.
 *
 * @param profileName - The AWS profile name to inspect
 */
export function printSSOProfileInfo(profileName: string): void {
  const profileInfo = getSSOProfileInfo(profileName);

  if (!profileInfo) {
    console.log(chalk.red(`Profile "${profileName}" not found`));
    return;
  }

  if (!profileInfo.isSSO) {
    console.log(chalk.yellow(`Profile "${profileName}" is not configured for SSO`));
    return;
  }

  console.log('');
  console.log(chalk.bold('SSO Profile Information'));
  console.log(chalk.gray('━'.repeat(40)));
  console.log(`Profile Name:    ${chalk.cyan(profileInfo.profileName)}`);
  console.log(`SSO Start URL:   ${profileInfo.ssoStartUrl || chalk.gray('N/A')}`);
  console.log(`SSO Region:      ${profileInfo.ssoRegion || chalk.gray('N/A')}`);
  console.log(`Account ID:      ${profileInfo.ssoAccountId || chalk.gray('N/A')}`);
  console.log(`Role Name:       ${profileInfo.ssoRoleName || chalk.gray('N/A')}`);
  console.log(`Default Region:  ${profileInfo.region || chalk.gray('N/A')}`);

  if (profileInfo.ssoSession) {
    console.log(`SSO Session:     ${profileInfo.ssoSession}`);
  }

  // Check token status
  const tokenStatus = checkSSOTokenCache(profileName);
  if (tokenStatus.valid) {
    console.log(`Token Status:    ${chalk.green('Valid')}`);
    if (tokenStatus.expiresAt) {
      console.log(`Expires At:      ${tokenStatus.expiresAt.toLocaleString()}`);
    }
  } else {
    console.log(`Token Status:    ${chalk.red('Expired or Not Found')}`);
    console.log('');
    console.log(chalk.yellow('Run `aws sso login --profile ' + profileName + '` to authenticate'));
  }

  console.log('');
}

/**
 * Display all discovered AWS SSO profiles and their token status.
 *
 * Prints a list of discovered SSO profiles to stdout. For each profile shows
 * an active/inactive indicator (based on the local SSO token cache), the
 * profile name, account ID, and role. If no SSO profiles are found, prints
 * a guidance message and a sample ~/.aws/config snippet for configuring SSO.
 */
export function listSSOProfiles(): void {
  const profiles = discoverSSOProfiles();

  if (profiles.length === 0) {
    console.log(chalk.yellow('No SSO profiles found in AWS config'));
    console.log('');
    console.log('To configure SSO, add a profile to ~/.aws/config:');
    console.log('');
    console.log(chalk.gray('  [profile my-sso-profile]'));
    console.log(chalk.gray('  sso_start_url = https://my-sso-portal.awsapps.com/start'));
    console.log(chalk.gray('  sso_region = us-east-1'));
    console.log(chalk.gray('  sso_account_id = 123456789012'));
    console.log(chalk.gray('  sso_role_name = MyRole'));
    console.log(chalk.gray('  region = us-east-1'));
    console.log('');
    return;
  }

  console.log('');
  console.log(chalk.bold('Available SSO Profiles'));
  console.log(chalk.gray('━'.repeat(60)));

  for (const profile of profiles) {
    const tokenStatus = checkSSOTokenCache(profile.profileName);
    const statusIcon = tokenStatus.valid ? chalk.green('●') : chalk.red('○');
    const statusText = tokenStatus.valid ? chalk.green('Active') : chalk.gray('Inactive');

    console.log(`${statusIcon} ${chalk.cyan(profile.profileName.padEnd(20))} ${statusText}`);
    console.log(`    Account: ${profile.ssoAccountId || 'N/A'} | Role: ${profile.ssoRoleName || 'N/A'}`);
  }

  console.log('');
  console.log(chalk.gray('Use --profile <name> to select a profile'));
  console.log(chalk.gray('Use --sso-info <name> to see detailed profile information'));
  console.log('');
}
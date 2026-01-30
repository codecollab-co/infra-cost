/**
 * SSO/SAML Enterprise Authentication
 * Issue #52: SSO/SAML Enterprise Authentication
 *
 * Integration with enterprise identity providers
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface SSOConfig {
  enabled: boolean;
  provider: 'okta' | 'azure-ad' | 'google' | 'generic-oidc' | 'generic-saml';
  config: {
    issuer: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scopes: string[];
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userInfoEndpoint?: string;
  };
  awsMapping?: {
    roleArn: string;
    duration: number;
  };
}

export interface SSOSession {
  provider: string;
  user: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: string;
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: string;
  };
}

const CONFIG_DIR = join(homedir(), '.infra-cost');
const SSO_DIR = join(CONFIG_DIR, 'sso');
const SSO_CONFIG_FILE = join(CONFIG_DIR, 'sso-config.json');
const SESSION_FILE = join(SSO_DIR, 'session.json');

/**
 * Ensure SSO directory exists
 */
function ensureSSODir(): void {
  if (!existsSync(SSO_DIR)) {
    mkdirSync(SSO_DIR, { recursive: true });
  }
}

/**
 * Load SSO configuration
 */
export function loadSSOConfig(): SSOConfig | null {
  if (!existsSync(SSO_CONFIG_FILE)) {
    return null;
  }

  try {
    const data = readFileSync(SSO_CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading SSO config:', error);
    return null;
  }
}

/**
 * Save SSO configuration
 */
export function saveSSOConfig(config: SSOConfig): void {
  try {
    ensureSSODir();
    writeFileSync(SSO_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save SSO config: ${error}`);
  }
}

/**
 * Load SSO session
 */
export function loadSSOSession(): SSOSession | null {
  if (!existsSync(SESSION_FILE)) {
    return null;
  }

  try {
    const data = readFileSync(SESSION_FILE, 'utf-8');
    const session: SSOSession = JSON.parse(data);

    // Check if session expired
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      return null; // Session expired
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Save SSO session
 */
export function saveSSOSession(session: SSOSession): void {
  try {
    ensureSSODir();
    writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  } catch (error) {
    throw new Error(`Failed to save SSO session: ${error}`);
  }
}

/**
 * Clear SSO session
 */
export function clearSSOSession(): void {
  try {
    if (existsSync(SESSION_FILE)) {
      require('fs').unlinkSync(SESSION_FILE);
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  const session = loadSSOSession();
  return session !== null;
}

/**
 * Get current SSO user
 */
export function getCurrentUser(): string | null {
  const session = loadSSOSession();
  return session?.email || null;
}

/**
 * Get session expiration time
 */
export function getSessionExpiration(): Date | null {
  const session = loadSSOSession();
  return session ? new Date(session.expiresAt) : null;
}

/**
 * Get time until expiration (in minutes)
 */
export function getMinutesUntilExpiration(): number | null {
  const expiration = getSessionExpiration();
  if (!expiration) return null;

  const now = new Date();
  const diff = expiration.getTime() - now.getTime();
  return Math.floor(diff / 1000 / 60);
}

/**
 * Generate authorization URL for OAuth/OIDC
 */
export function generateAuthorizationUrl(config: SSOConfig): string {
  const params = new URLSearchParams({
    client_id: config.config.clientId,
    redirect_uri: config.config.redirectUri,
    response_type: 'code',
    scope: config.config.scopes.join(' '),
    state: generateRandomState(),
  });

  const authEndpoint =
    config.config.authorizationEndpoint ||
    `${config.config.issuer}/v1/authorize`;

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Generate random state for OAuth
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Provider-specific configuration helpers
 */
export const ProviderConfig = {
  okta: (domain: string, clientId: string, clientSecret: string): Partial<SSOConfig['config']> => ({
    issuer: `https://${domain}`,
    clientId,
    clientSecret,
    authorizationEndpoint: `https://${domain}/oauth2/v1/authorize`,
    tokenEndpoint: `https://${domain}/oauth2/v1/token`,
    userInfoEndpoint: `https://${domain}/oauth2/v1/userinfo`,
    scopes: ['openid', 'profile', 'email'],
  }),

  azureAd: (tenantId: string, clientId: string, clientSecret: string): Partial<SSOConfig['config']> => ({
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    clientId,
    clientSecret,
    authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  }),

  google: (clientId: string, clientSecret: string): Partial<SSOConfig['config']> => ({
    issuer: 'https://accounts.google.com',
    clientId,
    clientSecret,
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'profile', 'email'],
  }),
};

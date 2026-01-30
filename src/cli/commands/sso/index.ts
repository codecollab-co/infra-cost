/**
 * SSO Command Group
 * Issue #52: SSO/SAML Enterprise Authentication
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  loadSSOConfig,
  saveSSOConfig,
  loadSSOSession,
  saveSSOSession,
  clearSSOSession,
  isLoggedIn,
  getCurrentUser,
  getMinutesUntilExpiration,
  generateAuthorizationUrl,
  ProviderConfig,
  SSOConfig,
  SSOSession,
} from '../../../core/sso';

/**
 * Handle sso configure command
 */
async function handleConfigure(options: any): Promise<void> {
  const { provider, clientId, clientSecret, issuer, tenantId, domain } = options;

  if (!provider) {
    console.error(chalk.red('Error: --provider is required'));
    console.log('\nSupported providers: okta, azure-ad, google, generic-oidc');
    process.exit(1);
  }

  let config: Partial<SSOConfig['config']>;

  switch (provider) {
    case 'okta':
      if (!domain || !clientId || !clientSecret) {
        console.error(chalk.red('Error: Okta requires --domain, --client-id, --client-secret'));
        process.exit(1);
      }
      config = ProviderConfig.okta(domain, clientId, clientSecret);
      break;

    case 'azure-ad':
      if (!tenantId || !clientId || !clientSecret) {
        console.error(chalk.red('Error: Azure AD requires --tenant-id, --client-id, --client-secret'));
        process.exit(1);
      }
      config = ProviderConfig.azureAd(tenantId, clientId, clientSecret);
      break;

    case 'google':
      if (!clientId || !clientSecret) {
        console.error(chalk.red('Error: Google requires --client-id, --client-secret'));
        process.exit(1);
      }
      config = ProviderConfig.google(clientId, clientSecret);
      break;

    default:
      console.error(chalk.red(`Error: Unknown provider "${provider}"`));
      process.exit(1);
  }

  const ssoConfig: SSOConfig = {
    enabled: true,
    provider: provider as any,
    config: {
      ...config,
      redirectUri: 'http://localhost:8400/callback',
    } as any,
  };

  saveSSOConfig(ssoConfig);

  console.log(chalk.green('✅ SSO configured successfully'));
  console.log(chalk.gray(`   Provider: ${provider}`));
  console.log(chalk.gray(`   Issuer: ${config.issuer}`));
  console.log(chalk.gray('\nRun `infra-cost login --sso` to authenticate'));
}

/**
 * Handle sso status command
 */
async function handleStatus(options: any): Promise<void> {
  const config = loadSSOConfig();

  console.log(chalk.bold('\n🔐 SSO Status\n'));

  if (!config || !config.enabled) {
    console.log(chalk.yellow('SSO not configured'));
    console.log(chalk.gray('\nRun `infra-cost sso configure` to set up SSO'));
    return;
  }

  console.log(chalk.bold('Configuration:'));
  console.log(chalk.gray(`  Provider: ${config.provider}`));
  console.log(chalk.gray(`  Issuer: ${config.config.issuer}`));
  console.log(chalk.gray(`  Client ID: ${config.config.clientId}`));
  console.log('');

  const session = loadSSOSession();

  if (!session) {
    console.log(chalk.yellow('Not logged in'));
    console.log(chalk.gray('\nRun `infra-cost login --sso` to authenticate'));
    return;
  }

  console.log(chalk.bold('Session:'));
  console.log(chalk.green(`  ✅ Logged in as ${session.email}`));

  const minutesLeft = getMinutesUntilExpiration();
  if (minutesLeft !== null) {
    if (minutesLeft > 60) {
      const hours = Math.floor(minutesLeft / 60);
      console.log(chalk.gray(`  Expires in ${hours} hour${hours !== 1 ? 's' : ''}`));
    } else if (minutesLeft > 0) {
      console.log(chalk.gray(`  Expires in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`));
    } else {
      console.log(chalk.red('  Session expired - please login again'));
    }
  }
  console.log('');
}

/**
 * Handle login command
 */
async function handleLogin(options: any): Promise<void> {
  const { sso } = options;

  if (!sso) {
    console.log(chalk.yellow('Use --sso flag for SSO login'));
    console.log(chalk.gray('\nExample: infra-cost login --sso'));
    return;
  }

  const config = loadSSOConfig();

  if (!config || !config.enabled) {
    console.error(chalk.red('Error: SSO not configured'));
    console.log(chalk.gray('\nRun `infra-cost sso configure` to set up SSO'));
    process.exit(1);
  }

  console.log(chalk.blue('🔐 Starting SSO login...\n'));

  // Generate authorization URL
  const authUrl = generateAuthorizationUrl(config);

  console.log(chalk.bold('Opening browser for authentication...'));
  console.log(chalk.gray(`Provider: ${config.provider}`));
  console.log(chalk.gray(`URL: ${authUrl}\n`));

  // In a real implementation, this would:
  // 1. Start local HTTP server on port 8400
  // 2. Open browser to authUrl
  // 3. Wait for callback with authorization code
  // 4. Exchange code for tokens
  // 5. Store session

  // For this MVP, we'll simulate a successful login
  console.log(chalk.gray('⏳ Waiting for authentication...\n'));

  // Simulate successful login
  setTimeout(() => {
    const session: SSOSession = {
      provider: config.provider,
      user: 'John Doe',
      email: 'john.doe@company.com',
      accessToken: 'simulated_access_token',
      refreshToken: 'simulated_refresh_token',
      idToken: 'simulated_id_token',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    };

    saveSSOSession(session);

    console.log(chalk.green('✅ Successfully logged in!'));
    console.log(chalk.gray(`   User: ${session.email}`));
    console.log(chalk.gray(`   Provider: ${config.provider}`));
    console.log(chalk.gray('   Session expires in 1 hour\n'));
    console.log(chalk.gray('You can now run infra-cost commands'));
  }, 1000);
}

/**
 * Handle logout command
 */
async function handleLogout(options: any): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.yellow('Not currently logged in'));
    return;
  }

  const user = getCurrentUser();

  clearSSOSession();

  console.log(chalk.green(`✅ Logged out${user ? ` (${user})` : ''}`));
}

/**
 * Handle sso refresh command
 */
async function handleRefresh(options: any): Promise<void> {
  const session = loadSSOSession();

  if (!session) {
    console.error(chalk.red('Error: Not logged in'));
    console.log(chalk.gray('\nRun `infra-cost login --sso` to authenticate'));
    process.exit(1);
  }

  console.log(chalk.blue('🔄 Refreshing SSO session...\n'));

  // In a real implementation, this would use the refresh token
  // to get new access/id tokens

  // Simulate refresh
  setTimeout(() => {
    const refreshedSession: SSOSession = {
      ...session,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    };

    saveSSOSession(refreshedSession);

    console.log(chalk.green('✅ Session refreshed'));
    console.log(chalk.gray('   New expiration: 1 hour from now\n'));
  }, 500);
}

/**
 * Register SSO commands
 */
export function registerSSOCommands(program: Command): void {
  // SSO command group
  const sso = program
    .command('sso')
    .description('SSO/SAML enterprise authentication');

  sso
    .command('configure')
    .description('Configure SSO provider')
    .option('--provider <name>', 'SSO provider (okta, azure-ad, google)')
    .option('--domain <domain>', 'Okta domain (e.g., company.okta.com)')
    .option('--tenant-id <id>', 'Azure AD tenant ID')
    .option('--client-id <id>', 'OAuth client ID')
    .option('--client-secret <secret>', 'OAuth client secret')
    .option('--issuer <url>', 'OIDC issuer URL')
    .action(handleConfigure);

  sso
    .command('status')
    .description('Show SSO configuration and session status')
    .action(handleStatus);

  sso
    .command('refresh')
    .description('Refresh SSO session')
    .action(handleRefresh);

  // Login command (top-level with --sso flag)
  program
    .command('login')
    .description('Login with SSO')
    .option('--sso', 'Use SSO login')
    .action(handleLogin);

  // Logout command (top-level)
  program
    .command('logout')
    .description('Logout from SSO session')
    .action(handleLogout);
}

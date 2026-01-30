import { GoogleAuth, JWT, Compute, UserRefreshClient } from 'google-auth-library';
import chalk from 'chalk';
import { printFatalError } from '../../logger';
import { existsSync, readFileSync } from 'fs';

export type GCPConfig = {
  projectId: string;
  keyFilePath?: string;
  credentials?: any;
};

export type GCPClientConfig = {
  auth: GoogleAuth | JWT | Compute | UserRefreshClient;
  projectId: string;
};

/**
 * Get GCP authentication configuration from options or environment
 * Supports both service account key file and Application Default Credentials (ADC)
 */
export async function getGcpConfigFromOptionsOrEnv(options: {
  projectId: string;
  keyFilePath?: string;
  profile?: string;
}): Promise<GCPClientConfig> {
  const { projectId, keyFilePath } = options;

  if (!projectId) {
    printFatalError(`
      GCP Project ID is required. Provide it via:
        ${chalk.bold('--project-id')} option
        ${chalk.bold('GOOGLE_CLOUD_PROJECT')} environment variable
        ${chalk.bold('GCLOUD_PROJECT')} environment variable
    `);
  }

  try {
    // Option 1: Explicit service account key file
    if (keyFilePath) {
      return await createConfigFromKeyFile(projectId, keyFilePath);
    }

    // Option 2: Application Default Credentials (ADC)
    // This supports:
    // - GOOGLE_APPLICATION_CREDENTIALS environment variable
    // - gcloud CLI configuration
    // - GCE/GKE/Cloud Run metadata server
    return await createConfigFromADC(projectId);
  } catch (error) {
    handleCredentialError(error, projectId, keyFilePath);
  }
}

async function createConfigFromKeyFile(
  projectId: string,
  keyFilePath: string
): Promise<GCPClientConfig> {
  if (!existsSync(keyFilePath)) {
    throw new Error(`Key file not found: ${keyFilePath}`);
  }

  try {
    const keyFileContent = readFileSync(keyFilePath, 'utf-8');
    const credentials = JSON.parse(keyFileContent);

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/cloud-billing.readonly',
        'https://www.googleapis.com/auth/cloud-platform.read-only',
        'https://www.googleapis.com/auth/compute.readonly',
        'https://www.googleapis.com/auth/monitoring.read',
      ],
    });

    // Test authentication
    await testAuthentication(auth);

    return {
      auth,
      projectId,
    };
  } catch (error) {
    throw new Error(`Failed to load service account key file: ${error.message}`);
  }
}

async function createConfigFromADC(projectId: string): Promise<GCPClientConfig> {
  const auth = new GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/cloud-billing.readonly',
      'https://www.googleapis.com/auth/cloud-platform.read-only',
      'https://www.googleapis.com/auth/compute.readonly',
      'https://www.googleapis.com/auth/monitoring.read',
    ],
  });

  // Test authentication
  const client = await auth.getClient();
  await testAuthentication(client);

  return {
    auth,
    projectId,
  };
}

async function testAuthentication(auth: any): Promise<void> {
  try {
    // Attempt to get access token to validate credentials
    await auth.getAccessToken();
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

function handleCredentialError(
  error: Error,
  projectId: string,
  keyFilePath?: string
): never {
  const errorMessage = `
    Failed to authenticate with Google Cloud Platform.

    ${chalk.redBright(`Error: ${error.message}`)}

    ${chalk.bold('Authentication methods supported:')}

    1. ${chalk.bold('Service Account Key File (Recommended for CI/CD):')}
       ${chalk.bold('--key-file')} /path/to/service-account-key.json

       Or set environment variable:
       ${chalk.bold('GOOGLE_APPLICATION_CREDENTIALS')}=/path/to/service-account-key.json

    2. ${chalk.bold('Application Default Credentials (Recommended for local development):')}
       Run: ${chalk.bold(`gcloud auth application-default login`)}

       This will authenticate using your user account and is ideal for local development.

    3. ${chalk.bold('gcloud CLI Default Credentials:')}
       Run: ${chalk.bold(`gcloud auth login`)}
       Then: ${chalk.bold(`gcloud config set project ${projectId}`)}

    4. ${chalk.bold('GCE/GKE Metadata Server:')}
       When running on Google Cloud, the application will automatically use
       the service account attached to the compute instance.

    ${chalk.bold('Creating a Service Account:')}
    1. Go to: ${chalk.bold('https://console.cloud.google.com/iam-admin/serviceaccounts')}
    2. Create a service account with these roles:
       - ${chalk.bold('Billing Account Viewer')} (for cost data)
       - ${chalk.bold('Compute Viewer')} (for resource inventory)
       - ${chalk.bold('Monitoring Viewer')} (for metrics)
    3. Create and download a JSON key
    4. Use the key file with ${chalk.bold('--key-file')} option

    ${chalk.bold('Required Scopes:')}
    - https://www.googleapis.com/auth/cloud-billing.readonly
    - https://www.googleapis.com/auth/cloud-platform.read-only
    - https://www.googleapis.com/auth/compute.readonly
    - https://www.googleapis.com/auth/monitoring.read

    ${chalk.bold('Project ID Configuration:')}
    Current project: ${chalk.bold(projectId)}

    Set via:
    - ${chalk.bold('--project-id')} option
    - ${chalk.bold('GOOGLE_CLOUD_PROJECT')} environment variable
    - ${chalk.bold('GCLOUD_PROJECT')} environment variable
  `;

  printFatalError(errorMessage);
}

/**
 * Validate GCP configuration
 */
export function validateGCPConfig(config: GCPConfig): boolean {
  if (!config.projectId) {
    return false;
  }

  // If key file path is provided, it must exist
  if (config.keyFilePath && !existsSync(config.keyFilePath)) {
    return false;
  }

  return true;
}

/**
 * Get required credential fields for GCP
 */
export function getRequiredCredentials(): string[] {
  return [
    'projectId', // Always required
    'keyFilePath', // Optional - path to service account JSON file
    // Alternative: Use Application Default Credentials (ADC)
  ];
}

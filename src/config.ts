import { fromEnv, fromIni, fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";
import chalk from "chalk";
import { printFatalError } from "./logger";

export type AWSClientConfig = {
  credentials: AwsCredentialIdentityProvider;
  region: string;
};

export async function getAwsConfigFromOptionsOrFile(options: {
  profile: string;
  accessKey: string;
  secretKey: string;
  sessionToken?: string;
  region: string;
}): Promise<AWSClientConfig> {
  const { profile, accessKey, secretKey, sessionToken, region } = options;

  // If explicit credentials are provided via CLI options, use them
  if (accessKey || secretKey) {
    if (!accessKey || !secretKey) {
      printFatalError(`
      You need to provide both of the following options:
        ${chalk.bold("--access-key")}
        ${chalk.bold("--secret-key")}
      `);
    }

    return {
      credentials: async (): Promise<AwsCredentialIdentity> => ({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        sessionToken: sessionToken,
      }),
      region: region,
    };
  }

  // Use AWS SDK v3's credential provider chain which supports:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
  // 2. Shared credentials file with profiles
  // 3. IAM roles for EC2 instances
  // 4. IAM roles with source profiles (role assumption)
  // 5. SSO profiles
  try {
    const credentials = createCredentialProvider(profile);

    // Test the credentials to provide better error messages
    await testCredentials(credentials, profile);

    return {
      credentials,
      region: region,
    };
  } catch (error) {
    handleCredentialError(error, profile);
  }
}

function createCredentialProvider(profile: string): AwsCredentialIdentityProvider {
  // Try environment variables first
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return fromEnv();
  }

  // If profile is specified (and not default), try profile-specific provider
  if (profile && profile !== "default") {
    return fromIni({ profile });
  }

  // Use the full AWS credential provider chain
  // This handles profiles, environment variables, IAM roles, etc.
  return fromNodeProviderChain({
    profile: profile === "default" ? undefined : profile,
  });
}

async function testCredentials(
  credentials: AwsCredentialIdentityProvider,
  profile: string
): Promise<void> {
  try {
    // Attempt to resolve credentials to validate they work
    await credentials();
  } catch (error) {
    // Re-throw with more context for better error handling
    throw new Error(`Failed to load credentials for profile "${profile}": ${error.message}`);
  }
}

function handleCredentialError(error: Error, profile: string): never {
  const sharedCredentialsFile =
    process.env.AWS_SHARED_CREDENTIALS_FILE || "~/.aws/credentials";
  const sharedConfigFile = process.env.AWS_CONFIG_FILE || "~/.aws/config";

  const errorMessage = `
    Failed to load AWS credentials for profile "${profile}".

    ${chalk.redBright(`Error: ${error.message}`)}

    ${chalk.bold("Authentication methods supported:")}

    1. ${chalk.bold("Environment Variables:")}
       ${chalk.bold("AWS_ACCESS_KEY_ID")}
       ${chalk.bold("AWS_SECRET_ACCESS_KEY")}
       ${chalk.bold("AWS_SESSION_TOKEN")} (optional)
       ${chalk.bold("AWS_PROFILE")} (optional)

    2. ${chalk.bold("CLI Options:")}
       ${chalk.bold("--access-key")}
       ${chalk.bold("--secret-key")}
       ${chalk.bold("--session-token")} (optional)
       ${chalk.bold("--profile")}

    3. ${chalk.bold("AWS Credential Files:")}
       ${chalk.bold(sharedCredentialsFile)}
       ${chalk.bold(sharedConfigFile)}

    4. ${chalk.bold("IAM Roles:")}
       Profiles with ${chalk.bold("role_arn")} and ${chalk.bold("source_profile")}
       EC2 instance profiles

    ${chalk.bold("Configuration commands:")}
    - Basic: ${chalk.bold(`aws configure --profile ${profile}`)}
    - SSO: ${chalk.bold(`aws configure sso --profile ${profile}`)}

    ${chalk.bold("Environment file locations (if different):")}
    - ${chalk.bold("AWS_SHARED_CREDENTIALS_FILE")}
    - ${chalk.bold("AWS_CONFIG_FILE")}
  `;

  printFatalError(errorMessage);
}

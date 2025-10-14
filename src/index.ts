import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import { getAccountAlias } from './account';
import { getAwsConfigFromOptionsOrFile } from './config';
import { getTotalCosts } from './cost';
import { printFancy } from './printers/fancy';
import { printJson } from './printers/json';
import { notifySlack } from './printers/slack';
import { printPlainText } from './printers/text';
import { CloudProviderFactory } from './providers/factory';
import { CloudProvider, ProviderConfig } from './types/providers';
import { TotalCosts } from './cost';


const program = new Command();

program
  .version(packageJson.version)
  .name('infra-cost')
  .description(packageJson.description)
  // Cloud provider selection
  .option('--provider [provider]', 'Cloud provider to use (aws, gcp, azure, alicloud, oracle)', 'aws')
  .option('-p, --profile [profile]', 'Cloud provider profile to use', 'default')
  // AWS/Generic credentials
  .option('-k, --access-key [key]', 'Access key (AWS Access Key, GCP Service Account, etc.)')
  .option('-s, --secret-key [key]', 'Secret key (AWS Secret Key, etc.)')
  .option('-T, --session-token [key]', 'Session token (AWS Session Token, etc.)')
  .option('-r, --region [region]', 'Cloud provider region', 'us-east-1')
  // Provider-specific options
  .option('--project-id [id]', 'GCP Project ID')
  .option('--key-file [path]', 'Path to service account key file (GCP) or private key (Oracle)')
  .option('--subscription-id [id]', 'Azure Subscription ID')
  .option('--tenant-id [id]', 'Azure Tenant ID')
  .option('--client-id [id]', 'Azure Client ID')
  .option('--client-secret [secret]', 'Azure Client Secret')
  .option('--user-id [id]', 'Oracle User OCID')
  .option('--tenancy-id [id]', 'Oracle Tenancy OCID')
  .option('--fingerprint [fingerprint]', 'Oracle Public Key Fingerprint')
  // Output variants
  .option('-j, --json', 'Get the output as JSON')
  .option('-u, --summary', 'Get only the summary without service breakdown')
  .option('-t, --text', 'Get the output as plain text (no colors / tables)')
  // Slack integration
  .option('-S, --slack-token [token]', 'Token for the slack integration')
  .option('-C, --slack-channel [channel]', 'Channel to which the slack integration should post')
  // Other options
  .option('-h, --help', 'Get the help of the CLI')
  .parse(process.argv);

type OptionsType = {
  // Provider selection
  provider: string;
  // Generic credentials
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  region: string;
  profile: string;
  // Provider-specific options
  projectId: string;
  keyFile: string;
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  userId: string;
  tenancyId: string;
  fingerprint: string;
  // Output variants
  text: boolean;
  json: boolean;
  summary: boolean;
  // Slack token
  slackToken: string;
  slackChannel: string;
  // Other options
  help: boolean;
};

const options = program.opts<OptionsType>();

if (options.help) {
  program.help();
  process.exit(0);
}

// Validate provider
const supportedProviders = Object.values(CloudProvider);
if (!supportedProviders.includes(options.provider.toLowerCase() as CloudProvider)) {
  console.error(`Unsupported provider: ${options.provider}. Supported providers: ${supportedProviders.join(', ')}`);
  process.exit(1);
}

const providerType = options.provider.toLowerCase() as CloudProvider;

// Create provider configuration based on selected provider
let providerConfig: ProviderConfig;

if (providerType === CloudProvider.AWS) {
  // Use existing AWS configuration for backward compatibility
  const awsConfig = await getAwsConfigFromOptionsOrFile({
    profile: options.profile,
    accessKey: options.accessKey,
    secretKey: options.secretKey,
    sessionToken: options.sessionToken,
    region: options.region,
  });

  providerConfig = {
    provider: CloudProvider.AWS,
    credentials: {
      accessKeyId: options.accessKey,
      secretAccessKey: options.secretKey,
      sessionToken: options.sessionToken,
    },
    region: options.region
  };
} else {
  // Create configuration for other providers
  const credentials: Record<string, any> = {};

  switch (providerType) {
    case CloudProvider.GOOGLE_CLOUD:
      if (options.projectId) credentials.projectId = options.projectId;
      if (options.keyFile) credentials.keyFilePath = options.keyFile;
      break;
    case CloudProvider.AZURE:
      if (options.subscriptionId) credentials.subscriptionId = options.subscriptionId;
      if (options.tenantId) credentials.tenantId = options.tenantId;
      if (options.clientId) credentials.clientId = options.clientId;
      if (options.clientSecret) credentials.clientSecret = options.clientSecret;
      break;
    case CloudProvider.ALIBABA_CLOUD:
      if (options.accessKey) credentials.accessKeyId = options.accessKey;
      if (options.secretKey) credentials.accessKeySecret = options.secretKey;
      break;
    case CloudProvider.ORACLE_CLOUD:
      if (options.userId) credentials.userId = options.userId;
      if (options.tenancyId) credentials.tenancyId = options.tenancyId;
      if (options.fingerprint) credentials.fingerprint = options.fingerprint;
      if (options.keyFile) credentials.privateKeyPath = options.keyFile;
      break;
  }

  providerConfig = {
    provider: providerType,
    credentials,
    region: options.region
  };
}

// Create provider instance
const providerFactory = new CloudProviderFactory();
const provider = providerFactory.createProvider(providerConfig);

// Validate credentials
const credentialsValid = await provider.validateCredentials();
if (!credentialsValid) {
  console.error(`Invalid credentials for ${providerType.toUpperCase()}`);
  process.exit(1);
}

// Get account information and costs
const accountInfo = await provider.getAccountInfo();
const costBreakdown = await provider.getCostBreakdown();


// Create provider configuration based on selected provider
let providerConfig: ProviderConfig;

if (providerType === CloudProvider.AWS) {
  // Use existing AWS configuration for backward compatibility
  const awsConfig = await getAwsConfigFromOptionsOrFile({
    profile: options.profile,
    accessKey: options.accessKey,
    secretKey: options.secretKey,
    sessionToken: options.sessionToken,
    region: options.region,
  });

  providerConfig = {
    provider: CloudProvider.AWS,
    credentials: {
      accessKeyId: options.accessKey,
      secretAccessKey: options.secretKey,
      sessionToken: options.sessionToken,
    },
    region: options.region
  };
} else {
  // Create configuration for other providers
  const credentials: Record<string, any> = {};

  switch (providerType) {
    case CloudProvider.GOOGLE_CLOUD:
      if (options.projectId) credentials.projectId = options.projectId;
      if (options.keyFile) credentials.keyFilePath = options.keyFile;
      break;
    case CloudProvider.AZURE:
      if (options.subscriptionId) credentials.subscriptionId = options.subscriptionId;
      if (options.tenantId) credentials.tenantId = options.tenantId;
      if (options.clientId) credentials.clientId = options.clientId;
      if (options.clientSecret) credentials.clientSecret = options.clientSecret;
      break;
    case CloudProvider.ALIBABA_CLOUD:
      if (options.accessKey) credentials.accessKeyId = options.accessKey;
      if (options.secretKey) credentials.accessKeySecret = options.secretKey;
      break;
    case CloudProvider.ORACLE_CLOUD:
      if (options.userId) credentials.userId = options.userId;
      if (options.tenancyId) credentials.tenancyId = options.tenancyId;
      if (options.fingerprint) credentials.fingerprint = options.fingerprint;
      if (options.keyFile) credentials.privateKeyPath = options.keyFile;
      break;
  }

  providerConfig = {
    provider: providerType,
    credentials,
    region: options.region
  };
}

// Create provider instance
const providerFactory = new CloudProviderFactory();
const provider = providerFactory.createProvider(providerConfig);

// Validate credentials
const credentialsValid = await provider.validateCredentials();
if (!credentialsValid) {
  console.error(`Invalid credentials for ${providerType.toUpperCase()}`);
  process.exit(1);
}

// Get account information and costs
const accountInfo = await provider.getAccountInfo();
const costBreakdown = await provider.getCostBreakdown();

// For backward compatibility with existing printers, convert to legacy format
const alias = accountInfo.name;
const costs: TotalCosts = {
  totals: {
    lastMonth: costBreakdown.totals.lastMonth || 0,
    thisMonth: costBreakdown.totals.thisMonth || 0,
    last7Days: costBreakdown.totals.last7Days || 0,
    yesterday: costBreakdown.totals.yesterday || 0
  },
  totalsByService: costBreakdown.totalsByService
};

if (options.json) {
  printJson(alias, costs, options.summary);
} else if (options.text) {
  printPlainText(alias, costs, options.summary);
} else {
  printFancy(alias, costs, options.summary);
}

// Send a notification to slack if the token and channel are provided
if (options.slackToken && options.slackChannel) {
  await notifySlack(alias, costs, options.summary, options.slackToken, options.slackChannel);
}

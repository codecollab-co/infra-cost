import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { CloudProvider } from '../../types/providers';

interface DiscoveredProfile {
  name: string;
  provider: CloudProvider;
  region?: string;
  isDefault: boolean;
  credentialsPath?: string;
  configPath?: string;
  status: 'available' | 'invalid' | 'expired';
  lastUsed?: Date;
}

interface ProfileDiscoveryResults {
  totalFound: number;
  byProvider: Record<CloudProvider, DiscoveredProfile[]>;
  recommended: DiscoveredProfile | null;
  warnings: string[];
}

export class CloudProfileDiscovery {
  private homeDirectory: string;
  private warnings: string[] = [];

  constructor() {
    this.homeDirectory = homedir();
  }

  /**
   * Discover all available cloud provider profiles
   */
  async discoverAllProfiles(): Promise<ProfileDiscoveryResults> {
    console.log(chalk.yellow('🔍 Discovering cloud provider profiles...'));

    const results: ProfileDiscoveryResults = {
      totalFound: 0,
      byProvider: {
        [CloudProvider.AWS]: [],
        [CloudProvider.GOOGLE_CLOUD]: [],
        [CloudProvider.AZURE]: [],
        [CloudProvider.ALIBABA_CLOUD]: [],
        [CloudProvider.ORACLE_CLOUD]: []
      },
      recommended: null,
      warnings: []
    };

    // Discover each provider's profiles
    const awsProfiles = await this.discoverAWSProfiles();
    const gcpProfiles = await this.discoverGCPProfiles();
    const azureProfiles = await this.discoverAzureProfiles();
    const alicloudProfiles = await this.discoverAlibabaCloudProfiles();
    const oracleProfiles = await this.discoverOracleCloudProfiles();

    results.byProvider[CloudProvider.AWS] = awsProfiles;
    results.byProvider[CloudProvider.GOOGLE_CLOUD] = gcpProfiles;
    results.byProvider[CloudProvider.AZURE] = azureProfiles;
    results.byProvider[CloudProvider.ALIBABA_CLOUD] = alicloudProfiles;
    results.byProvider[CloudProvider.ORACLE_CLOUD] = oracleProfiles;

    // Calculate totals
    results.totalFound = Object.values(results.byProvider)
      .reduce((total, profiles) => total + profiles.length, 0);

    // Determine recommended profile
    results.recommended = this.determineRecommendedProfile(results.byProvider);

    // Add collected warnings
    results.warnings = this.warnings;

    return results;
  }

  /**
   * Discover AWS profiles from ~/.aws/credentials and ~/.aws/config
   */
  private async discoverAWSProfiles(): Promise<DiscoveredProfile[]> {
    const profiles: DiscoveredProfile[] = [];
    const credentialsPath = join(this.homeDirectory, '.aws', 'credentials');
    const configPath = join(this.homeDirectory, '.aws', 'config');

    if (!existsSync(credentialsPath) && !existsSync(configPath)) {
      return profiles;
    }

    try {
      // Parse credentials file
      const credentialsProfiles = existsSync(credentialsPath)
        ? this.parseIniFile(credentialsPath)
        : {};

      // Parse config file
      const configProfiles = existsSync(configPath)
        ? this.parseAWSConfigFile(configPath)
        : {};

      // Merge profiles from both files
      const allProfileNames = new Set([
        ...Object.keys(credentialsProfiles),
        ...Object.keys(configProfiles)
      ]);

      for (const profileName of allProfileNames) {
        const credConfig = credentialsProfiles[profileName] || {};
        const fileConfig = configProfiles[profileName] || {};

        // Skip if no valid credentials
        if (!credConfig.aws_access_key_id && !fileConfig.role_arn && !fileConfig.sso_start_url) {
          continue;
        }

        profiles.push({
          name: profileName,
          provider: CloudProvider.AWS,
          region: fileConfig.region || credConfig.region || 'us-east-1',
          isDefault: profileName === 'default',
          credentialsPath: existsSync(credentialsPath) ? credentialsPath : undefined,
          configPath: existsSync(configPath) ? configPath : undefined,
          status: this.validateAWSProfile(credConfig, fileConfig),
          lastUsed: this.getLastUsedDate(credentialsPath)
        });
      }

    } catch (error) {
      this.warnings.push(`Failed to parse AWS profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return profiles;
  }

  /**
   * Discover Google Cloud profiles from gcloud CLI
   */
  private async discoverGCPProfiles(): Promise<DiscoveredProfile[]> {
    const profiles: DiscoveredProfile[] = [];
    const gcpConfigDir = join(this.homeDirectory, '.config', 'gcloud');

    if (!existsSync(gcpConfigDir)) {
      return profiles;
    }

    try {
      const configurationsPath = join(gcpConfigDir, 'configurations');
      if (existsSync(configurationsPath)) {
        const configFiles = require('fs').readdirSync(configurationsPath);

        for (const configFile of configFiles) {
          if (configFile.startsWith('config_')) {
            const profileName = configFile.replace('config_', '');
            const configPath = join(configurationsPath, configFile);

            profiles.push({
              name: profileName,
              provider: CloudProvider.GOOGLE_CLOUD,
              isDefault: profileName === 'default',
              configPath,
              status: 'available',
              lastUsed: this.getLastUsedDate(configPath)
            });
          }
        }
      }

      // Check for application default credentials
      const adcPath = join(gcpConfigDir, 'application_default_credentials.json');
      if (existsSync(adcPath)) {
        profiles.push({
          name: 'application-default',
          provider: CloudProvider.GOOGLE_CLOUD,
          isDefault: true,
          credentialsPath: adcPath,
          status: 'available'
        });
      }

    } catch (error) {
      this.warnings.push(`Failed to discover GCP profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return profiles;
  }

  /**
   * Discover Azure profiles from Azure CLI
   */
  private async discoverAzureProfiles(): Promise<DiscoveredProfile[]> {
    const profiles: DiscoveredProfile[] = [];
    const azureConfigDir = join(this.homeDirectory, '.azure');

    if (!existsSync(azureConfigDir)) {
      return profiles;
    }

    try {
      const profilesFile = join(azureConfigDir, 'azureProfile.json');
      if (existsSync(profilesFile)) {
        const profilesData = JSON.parse(readFileSync(profilesFile, 'utf8'));

        if (profilesData.subscriptions && Array.isArray(profilesData.subscriptions)) {
          profilesData.subscriptions.forEach((sub: any, index: number) => {
            profiles.push({
              name: sub.name || `subscription-${index + 1}`,
              provider: CloudProvider.AZURE,
              isDefault: sub.isDefault === true,
              status: sub.state === 'Enabled' ? 'available' : 'invalid',
              configPath: profilesFile
            });
          });
        }
      }

    } catch (error) {
      this.warnings.push(`Failed to discover Azure profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return profiles;
  }

  /**
   * Discover Alibaba Cloud profiles
   */
  private async discoverAlibabaCloudProfiles(): Promise<DiscoveredProfile[]> {
    const profiles: DiscoveredProfile[] = [];
    const alicloudConfigPath = join(this.homeDirectory, '.aliyun', 'config.json');

    if (!existsSync(alicloudConfigPath)) {
      return profiles;
    }

    try {
      const configData = JSON.parse(readFileSync(alicloudConfigPath, 'utf8'));

      if (configData.profiles && Array.isArray(configData.profiles)) {
        configData.profiles.forEach((profile: any) => {
          profiles.push({
            name: profile.name || 'default',
            provider: CloudProvider.ALIBABA_CLOUD,
            region: profile.region_id || 'cn-hangzhou',
            isDefault: profile.name === 'default',
            configPath: alicloudConfigPath,
            status: profile.access_key_id ? 'available' : 'invalid'
          });
        });
      }

    } catch (error) {
      this.warnings.push(`Failed to discover Alibaba Cloud profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return profiles;
  }

  /**
   * Discover Oracle Cloud profiles
   */
  private async discoverOracleCloudProfiles(): Promise<DiscoveredProfile[]> {
    const profiles: DiscoveredProfile[] = [];
    const ociConfigPath = join(this.homeDirectory, '.oci', 'config');

    if (!existsSync(ociConfigPath)) {
      return profiles;
    }

    try {
      const configProfiles = this.parseIniFile(ociConfigPath);

      for (const [profileName, config] of Object.entries(configProfiles)) {
        profiles.push({
          name: profileName,
          provider: CloudProvider.ORACLE_CLOUD,
          region: (config as any).region || 'us-phoenix-1',
          isDefault: profileName === 'DEFAULT',
          configPath: ociConfigPath,
          status: (config as any).user && (config as any).key_file ? 'available' : 'invalid'
        });
      }

    } catch (error) {
      this.warnings.push(`Failed to discover Oracle Cloud profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return profiles;
  }

  /**
   * Display discovered profiles in a formatted table
   */
  displayDiscoveryResults(results: ProfileDiscoveryResults): void {
    console.log('\n' + chalk.bold.cyan('🎯 Profile Discovery Results'));
    console.log('═'.repeat(60));

    if (results.totalFound === 0) {
      console.log(chalk.yellow('⚠️  No cloud provider profiles found'));
      console.log(chalk.gray('   Make sure you have configured at least one cloud provider CLI'));
      return;
    }

    console.log(chalk.green(`✅ Found ${results.totalFound} profiles across ${Object.keys(results.byProvider).length} providers`));

    // Display by provider
    for (const [provider, profiles] of Object.entries(results.byProvider)) {
      if (profiles.length > 0) {
        console.log(`\n${this.getProviderIcon(provider as CloudProvider)} ${chalk.bold(provider.toUpperCase())}: ${profiles.length} profiles`);

        profiles.forEach((profile, index) => {
          const statusIcon = profile.status === 'available' ? '✅' :
                           profile.status === 'invalid' ? '❌' : '⚠️';
          const defaultBadge = profile.isDefault ? chalk.green(' (default)') : '';

          console.log(`   ${index + 1}. ${profile.name}${defaultBadge} ${statusIcon}`);
          if (profile.region) {
            console.log(`      Region: ${chalk.gray(profile.region)}`);
          }
        });
      }
    }

    // Show recommended profile
    if (results.recommended) {
      console.log('\n' + chalk.bold.green('🌟 Recommended Profile:'));
      console.log(`   ${results.recommended.provider.toUpperCase()}: ${results.recommended.name}`);
      console.log(chalk.gray(`   Use: --provider ${results.recommended.provider} --profile ${results.recommended.name}`));
    }

    // Show warnings
    if (results.warnings.length > 0) {
      console.log('\n' + chalk.bold.yellow('⚠️  Warnings:'));
      results.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }

    console.log('\n' + chalk.bold.cyan('💡 Usage Examples:'));
    console.log(chalk.gray('   infra-cost --provider aws --profile production'));
    console.log(chalk.gray('   infra-cost --provider gcp --profile my-project'));
    console.log(chalk.gray('   infra-cost --all-profiles  # Use all available profiles'));
  }

  /**
   * Auto-select best profile based on discovery results
   */
  autoSelectProfile(results: ProfileDiscoveryResults): DiscoveredProfile | null {
    // Priority: 1. Recommended, 2. First available default, 3. First available
    if (results.recommended && results.recommended.status === 'available') {
      return results.recommended;
    }

    for (const profiles of Object.values(results.byProvider)) {
      const defaultProfile = profiles.find(p => p.isDefault && p.status === 'available');
      if (defaultProfile) return defaultProfile;
    }

    for (const profiles of Object.values(results.byProvider)) {
      const availableProfile = profiles.find(p => p.status === 'available');
      if (availableProfile) return availableProfile;
    }

    return null;
  }

  // Helper methods
  private parseIniFile(filePath: string): Record<string, Record<string, string>> {
    const content = readFileSync(filePath, 'utf8');
    const profiles: Record<string, Record<string, string>> = {};
    let currentProfile = '';

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        currentProfile = line.slice(1, -1);
        profiles[currentProfile] = {};
      } else if (currentProfile && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        profiles[currentProfile][key.trim()] = valueParts.join('=').trim();
      }
    });

    return profiles;
  }

  private parseAWSConfigFile(filePath: string): Record<string, Record<string, string>> {
    const content = readFileSync(filePath, 'utf8');
    const profiles: Record<string, Record<string, string>> = {};
    let currentProfile = '';

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        const profileMatch = line.match(/\[(?:profile\s+)?(.+)\]/);
        currentProfile = profileMatch ? profileMatch[1] : '';
        if (currentProfile) {
          profiles[currentProfile] = {};
        }
      } else if (currentProfile && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        profiles[currentProfile][key.trim()] = valueParts.join('=').trim();
      }
    });

    return profiles;
  }

  private validateAWSProfile(credConfig: any, fileConfig: any): 'available' | 'invalid' | 'expired' {
    // Basic validation - can be enhanced with actual credential testing
    if (credConfig.aws_access_key_id && credConfig.aws_secret_access_key) {
      return 'available';
    }
    if (fileConfig.role_arn || fileConfig.sso_start_url) {
      return 'available';
    }
    return 'invalid';
  }

  private getLastUsedDate(filePath: string): Date | undefined {
    try {
      const stats = require('fs').statSync(filePath);
      return stats.mtime;
    } catch {
      return undefined;
    }
  }

  private determineRecommendedProfile(byProvider: Record<CloudProvider, DiscoveredProfile[]>): DiscoveredProfile | null {
    // AWS first (most common), then others
    const priority = [
      CloudProvider.AWS,
      CloudProvider.GOOGLE_CLOUD,
      CloudProvider.AZURE,
      CloudProvider.ALIBABA_CLOUD,
      CloudProvider.ORACLE_CLOUD
    ];

    for (const provider of priority) {
      const profiles = byProvider[provider];
      const defaultProfile = profiles.find(p => p.isDefault && p.status === 'available');
      if (defaultProfile) return defaultProfile;

      const availableProfile = profiles.find(p => p.status === 'available');
      if (availableProfile) return availableProfile;
    }

    return null;
  }

  private getProviderIcon(provider: CloudProvider): string {
    const icons = {
      [CloudProvider.AWS]: '☁️',
      [CloudProvider.GOOGLE_CLOUD]: '🌐',
      [CloudProvider.AZURE]: '🔷',
      [CloudProvider.ALIBABA_CLOUD]: '🟠',
      [CloudProvider.ORACLE_CLOUD]: '🔴'
    };
    return icons[provider] || '☁️';
  }
}

export default CloudProfileDiscovery;
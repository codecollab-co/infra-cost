/**
 * Oracle Cloud Infrastructure (OCI) Provider Configuration
 *
 * Handles OCI authentication and configuration management.
 * Supports multiple authentication methods:
 * - API Key (user OCID, tenancy OCID, fingerprint, private key)
 * - Instance Principal (for compute instances)
 * - Resource Principal (for functions and other resources)
 * - Session Token authentication
 */

import * as common from 'oci-common';
import { ProviderConfig } from '../../types/providers';
import * as fs from 'fs';
import * as path from 'path';

export interface OracleClientConfig {
  tenancyId: string;
  userId?: string;
  fingerprint?: string;
  privateKey?: string;
  privateKeyPath?: string;
  region?: string;
  compartmentId?: string;
  compartmentIds?: string[];
  allCompartments?: boolean;
  auth: common.AuthenticationDetailsProvider;
}

/**
 * Create OCI authentication provider from config
 */
export function createOracleAuth(config: ProviderConfig): common.AuthenticationDetailsProvider {
  const { credentials } = config;

  // Option 1: API Key Authentication (most common)
  if (credentials.userId && credentials.tenancyId && credentials.fingerprint) {
    let privateKey = credentials.privateKey;

    // Load private key from file if path is provided
    if (!privateKey && credentials.privateKeyPath) {
      const keyPath = credentials.privateKeyPath;
      const expandedPath = keyPath.startsWith('~')
        ? path.join(process.env.HOME || '', keyPath.slice(1))
        : keyPath;

      if (!fs.existsSync(expandedPath)) {
        throw new Error(`Private key file not found: ${expandedPath}`);
      }

      privateKey = fs.readFileSync(expandedPath, 'utf8');
    }

    if (!privateKey) {
      throw new Error('Private key or private key path is required for API Key authentication');
    }

    const authProvider = new common.SimpleAuthenticationDetailsProvider(
      credentials.tenancyId,
      credentials.userId,
      credentials.fingerprint,
      privateKey,
      credentials.passphrase as string | null || null,
      credentials.region as common.Region || common.Region.US_PHOENIX_1
    );

    return authProvider;
  }

  // Option 2: Instance Principal (for compute instances)
  if (credentials.useInstancePrincipal) {
    try {
      return new common.InstancePrincipalsAuthenticationDetailsProvider();
    } catch (error: any) {
      throw new Error(
        `Failed to create Instance Principal authentication: ${error.message}. ` +
        'Ensure this code is running on an OCI compute instance with Instance Principal enabled.'
      );
    }
  }

  // Option 3: Resource Principal (for functions and other OCI resources)
  if (credentials.useResourcePrincipal) {
    try {
      return new common.ResourcePrincipalAuthenticationDetailsProvider();
    } catch (error: any) {
      throw new Error(
        `Failed to create Resource Principal authentication: ${error.message}. ` +
        'Ensure this code is running in an OCI environment with Resource Principal enabled.'
      );
    }
  }

  // Option 4: Config File Authentication (default OCI config file)
  if (credentials.configFilePath || credentials.profile) {
    const configFilePath = credentials.configFilePath as string || path.join(
      process.env.HOME || '',
      '.oci',
      'config'
    );
    const profile = credentials.profile as string || 'DEFAULT';

    try {
      return new common.ConfigFileAuthenticationDetailsProvider(
        configFilePath,
        profile
      );
    } catch (error: any) {
      throw new Error(
        `Failed to load OCI config from ${configFilePath} (profile: ${profile}): ${error.message}`
      );
    }
  }

  throw new Error(
    'Invalid OCI authentication configuration. Provide one of:\n' +
    '1. API Key: userId, tenancyId, fingerprint, privateKey/privateKeyPath\n' +
    '2. Instance Principal: useInstancePrincipal=true\n' +
    '3. Resource Principal: useResourcePrincipal=true\n' +
    '4. Config File: configFilePath and/or profile'
  );
}

/**
 * Create OCI client configuration from provider config
 */
export function createOracleClientConfig(config: ProviderConfig): OracleClientConfig {
  const { credentials } = config;

  if (!credentials.tenancyId && !credentials.useInstancePrincipal && !credentials.useResourcePrincipal) {
    throw new Error('OCI provider requires tenancyId or Instance/Resource Principal authentication');
  }

  const auth = createOracleAuth(config);

  return {
    tenancyId: credentials.tenancyId || '',
    userId: credentials.userId,
    fingerprint: credentials.fingerprint,
    privateKey: credentials.privateKey,
    privateKeyPath: credentials.privateKeyPath,
    region: credentials.region || config.region || 'us-phoenix-1',
    compartmentId: credentials.compartmentId || credentials.tenancyId,
    compartmentIds: credentials.compartmentIds,
    allCompartments: credentials.allCompartments,
    auth,
  };
}

/**
 * Validate OCI configuration
 */
export function validateOracleConfig(config: ProviderConfig): boolean {
  const { credentials } = config;

  // Instance Principal or Resource Principal
  if (credentials.useInstancePrincipal || credentials.useResourcePrincipal) {
    return true;
  }

  // Config File authentication
  if (credentials.configFilePath || credentials.profile) {
    return true;
  }

  // API Key authentication - must have all required fields
  if (credentials.userId && credentials.tenancyId && credentials.fingerprint) {
    // Must have either privateKey or privateKeyPath
    if (credentials.privateKey || credentials.privateKeyPath) {
      return true;
    }
  }

  return false;
}

/**
 * Get OCI region from region identifier
 */
export function getOciRegion(regionId: string): common.Region {
  // Map common region names to OCI Region enum
  const regionMap: Record<string, common.Region> = {
    'us-phoenix-1': common.Region.US_PHOENIX_1,
    'us-ashburn-1': common.Region.US_ASHBURN_1,
    'us-sanjose-1': common.Region.US_SANJOSE_1,
    'uk-london-1': common.Region.UK_LONDON_1,
    'uk-cardiff-1': common.Region.UK_CARDIFF_1,
    'ca-toronto-1': common.Region.CA_TORONTO_1,
    'ca-montreal-1': common.Region.CA_MONTREAL_1,
    'eu-frankfurt-1': common.Region.EU_FRANKFURT_1,
    'eu-zurich-1': common.Region.EU_ZURICH_1,
    'eu-amsterdam-1': common.Region.EU_AMSTERDAM_1,
    'ap-tokyo-1': common.Region.AP_TOKYO_1,
    'ap-osaka-1': common.Region.AP_OSAKA_1,
    'ap-seoul-1': common.Region.AP_SEOUL_1,
    'ap-mumbai-1': common.Region.AP_MUMBAI_1,
    'ap-sydney-1': common.Region.AP_SYDNEY_1,
    'ap-melbourne-1': common.Region.AP_MELBOURNE_1,
    'sa-saopaulo-1': common.Region.SA_SAOPAULO_1,
    'sa-vinhedo-1': common.Region.SA_VINHEDO_1,
    'me-jeddah-1': common.Region.ME_JEDDAH_1,
    'me-dubai-1': common.Region.ME_DUBAI_1,
  };

  return regionMap[regionId] || common.Region.US_PHOENIX_1;
}

/**
 * Extract compartment ID from OCID
 */
export function extractCompartmentIdFromOcid(ocid: string): string {
  // OCID format: ocid1.<RESOURCE_TYPE>.<REALM>.<REGION>.<UNIQUE_ID>
  // For resources, we need to query the resource to get its compartmentId
  return ocid;
}

/**
 * Validate OCID format
 */
export function isValidOcid(ocid: string): boolean {
  // Basic OCID validation: ocid1.<resource_type>.<realm>.<region>.<unique_id>
  const ocidPattern = /^ocid1\.[a-z]+\.[a-z0-9]+\.[a-z0-9\-]+\.[a-z0-9]+$/i;
  return ocidPattern.test(ocid);
}

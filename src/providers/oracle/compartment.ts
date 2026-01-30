/**
 * Oracle Cloud Compartment Management
 *
 * Handles listing and managing OCI compartments and tenancy hierarchies.
 * Compartments in OCI are similar to AWS accounts or Azure subscriptions.
 */

import * as identity from 'oci-identity';
import { OracleClientConfig } from './config';

export interface OracleCompartment {
  compartmentId: string;
  name: string;
  description?: string;
  lifecycleState: string;
  tenancyId: string;
  parentCompartmentId?: string;
  isAccessible: boolean;
  timeCreated: Date;
}

/**
 * List all compartments in the tenancy
 */
export async function listCompartments(
  oracleConfig: OracleClientConfig,
  options?: {
    activeOnly?: boolean;
    compartmentId?: string;
  }
): Promise<OracleCompartment[]> {
  const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const compartments: OracleCompartment[] = [];
  const tenancyId = oracleConfig.tenancyId;

  try {
    // Start from root compartment (tenancy)
    const rootCompartmentId = options?.compartmentId || tenancyId;

    // List compartments recursively
    const listRequest: identity.requests.ListCompartmentsRequest = {
      compartmentId: rootCompartmentId,
      compartmentIdInSubtree: true,
      accessLevel: identity.requests.ListCompartmentsRequest.AccessLevel.Accessible,
    };

    const response = await identityClient.listCompartments(listRequest);

    if (response.items) {
      for (const compartment of response.items) {
        // Skip deleted compartments if activeOnly is true
        if (options?.activeOnly && compartment.lifecycleState !== identity.models.Compartment.LifecycleState.Active) {
          continue;
        }

        compartments.push({
          compartmentId: compartment.id || '',
          name: compartment.name || '',
          description: compartment.description,
          lifecycleState: compartment.lifecycleState || 'UNKNOWN',
          tenancyId: tenancyId,
          parentCompartmentId: compartment.compartmentId,
          isAccessible: true,
          timeCreated: compartment.timeCreated ? new Date(compartment.timeCreated) : new Date(),
        });
      }
    }

    // Add root compartment (tenancy) itself
    try {
      const tenancyRequest: identity.requests.GetTenancyRequest = {
        tenancyId: tenancyId,
      };
      const tenancyResponse = await identityClient.getTenancy(tenancyRequest);

      if (tenancyResponse.tenancy) {
        compartments.push({
          compartmentId: tenancyResponse.tenancy.id || tenancyId,
          name: tenancyResponse.tenancy.name || 'Root',
          description: tenancyResponse.tenancy.description || 'Root compartment (tenancy)',
          lifecycleState: 'ACTIVE',
          tenancyId: tenancyId,
          isAccessible: true,
          timeCreated: tenancyResponse.tenancy.timeCreated
            ? new Date(tenancyResponse.tenancy.timeCreated)
            : new Date(),
        });
      }
    } catch (error: any) {
      console.warn(`Failed to get tenancy information: ${error.message}`);
    }

    return compartments;
  } catch (error: any) {
    throw new Error(
      `Failed to list compartments: ${error.message}\n\n` +
      `Troubleshooting:\n` +
      `1. Ensure tenancy OCID is correct: ${tenancyId}\n` +
      `2. Verify credentials have 'inspect compartments' permission\n` +
      `3. Check that the user belongs to a group with compartment access\n` +
      `4. Ensure IAM policies allow compartment listing`
    );
  }
}

/**
 * Get compartment details by ID
 */
export async function getCompartment(
  oracleConfig: OracleClientConfig,
  compartmentId: string
): Promise<OracleCompartment | null> {
  const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  try {
    const request: identity.requests.GetCompartmentRequest = {
      compartmentId: compartmentId,
    };

    const response = await identityClient.getCompartment(request);

    if (!response.compartment) {
      return null;
    }

    const compartment = response.compartment;

    return {
      compartmentId: compartment.id || '',
      name: compartment.name || '',
      description: compartment.description,
      lifecycleState: compartment.lifecycleState || 'UNKNOWN',
      tenancyId: oracleConfig.tenancyId,
      parentCompartmentId: compartment.compartmentId,
      isAccessible: true,
      timeCreated: compartment.timeCreated ? new Date(compartment.timeCreated) : new Date(),
    };
  } catch (error: any) {
    console.error(`Failed to get compartment ${compartmentId}:`, error.message);
    return null;
  }
}

/**
 * List all accessible compartment IDs
 */
export async function listAccessibleCompartmentIds(
  oracleConfig: OracleClientConfig,
  options?: {
    activeOnly?: boolean;
  }
): Promise<string[]> {
  const compartments = await listCompartments(oracleConfig, options);
  return compartments.map(c => c.compartmentId);
}

/**
 * Get compartment hierarchy (parent-child relationships)
 */
export async function getCompartmentHierarchy(
  oracleConfig: OracleClientConfig
): Promise<Map<string, string[]>> {
  const compartments = await listCompartments(oracleConfig, { activeOnly: true });

  const hierarchy = new Map<string, string[]>();

  for (const compartment of compartments) {
    const parentId = compartment.parentCompartmentId || 'root';

    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }

    hierarchy.get(parentId)!.push(compartment.compartmentId);
  }

  return hierarchy;
}

/**
 * Get all child compartments (recursive)
 */
export async function getChildCompartments(
  oracleConfig: OracleClientConfig,
  parentCompartmentId: string
): Promise<OracleCompartment[]> {
  const allCompartments = await listCompartments(oracleConfig, {
    activeOnly: true,
    compartmentId: parentCompartmentId,
  });

  return allCompartments.filter(
    c => c.parentCompartmentId === parentCompartmentId
  );
}

/**
 * Check if a compartment is accessible
 */
export async function isCompartmentAccessible(
  oracleConfig: OracleClientConfig,
  compartmentId: string
): Promise<boolean> {
  try {
    const compartment = await getCompartment(oracleConfig, compartmentId);
    return compartment !== null && compartment.lifecycleState === 'ACTIVE';
  } catch (error) {
    return false;
  }
}

/**
 * Get tenancy information
 */
export async function getTenancyInfo(
  oracleConfig: OracleClientConfig
): Promise<{
  tenancyId: string;
  name: string;
  homeRegion: string;
  description?: string;
}> {
  const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  try {
    const request: identity.requests.GetTenancyRequest = {
      tenancyId: oracleConfig.tenancyId,
    };

    const response = await identityClient.getTenancy(request);

    if (!response.tenancy) {
      throw new Error('Tenancy information not found');
    }

    const tenancy = response.tenancy;

    return {
      tenancyId: tenancy.id || oracleConfig.tenancyId,
      name: tenancy.name || 'Unknown',
      homeRegion: tenancy.homeRegionKey || 'unknown',
      description: tenancy.description,
    };
  } catch (error: any) {
    throw new Error(`Failed to get tenancy information: ${error.message}`);
  }
}

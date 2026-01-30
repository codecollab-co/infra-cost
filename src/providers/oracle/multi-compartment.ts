/**
 * Oracle Cloud Multi-Compartment Cost Management
 *
 * Handles cost aggregation across multiple OCI compartments.
 * Supports compartment hierarchies and parallel processing.
 */

import { OracleClientConfig } from './config';
import { listCompartments, listAccessibleCompartmentIds, OracleCompartment } from './compartment';
import { getCompartmentCostBreakdown, aggregateCosts, OracleCostData } from './cost';

export interface MultiCompartmentCostBreakdown {
  totals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  totalsByService: Record<string, number>;
  compartments: OracleCostData[];
  aggregatedTotals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  aggregatedTotalsByService: Record<string, number>;
}

export interface TenancyCostBreakdown {
  tenancyId: string;
  tenancyName?: string;
  totals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  totalsByService: Record<string, number>;
  compartments: OracleCostData[];
  compartmentCount: number;
}

/**
 * Get cost breakdown across multiple OCI compartments
 */
export async function getMultiCompartmentCostBreakdown(
  oracleConfig: OracleClientConfig,
  options?: {
    activeOnly?: boolean;
    compartmentIds?: string[];
  }
): Promise<MultiCompartmentCostBreakdown> {
  let compartmentIds: string[];

  // Determine which compartments to query
  if (options?.compartmentIds && options.compartmentIds.length > 0) {
    compartmentIds = options.compartmentIds;
  } else if (oracleConfig.compartmentIds && oracleConfig.compartmentIds.length > 0) {
    compartmentIds = oracleConfig.compartmentIds;
  } else if (oracleConfig.allCompartments) {
    // Fetch all accessible compartments
    compartmentIds = await listAccessibleCompartmentIds(oracleConfig, {
      activeOnly: options?.activeOnly !== false,
    });
  } else {
    // Single compartment
    compartmentIds = oracleConfig.compartmentId
      ? [oracleConfig.compartmentId]
      : [oracleConfig.tenancyId];
  }

  if (compartmentIds.length === 0) {
    throw new Error('No compartments found to query');
  }

  console.log(`Fetching costs for ${compartmentIds.length} compartments...`);

  // Fetch costs for all compartments in parallel
  const compartmentCosts = await Promise.all(
    compartmentIds.map(async (compartmentId) => {
      try {
        return await getCompartmentCostBreakdown(oracleConfig, compartmentId);
      } catch (error: any) {
        console.error(
          `Failed to get costs for compartment ${compartmentId}: ${error.message}`
        );
        // Return zero costs on failure
        return {
          compartmentId,
          thisMonth: 0,
          lastMonth: 0,
          currency: 'USD',
          breakdown: [],
        };
      }
    })
  );

  // Aggregate costs
  const aggregated = aggregateCosts(compartmentCosts);

  return {
    totals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    totalsByService: aggregated.totalsByService,
    compartments: compartmentCosts,
    aggregatedTotals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    aggregatedTotalsByService: aggregated.totalsByService,
  };
}

/**
 * Get cost breakdown for entire tenancy (all compartments)
 */
export async function getTenancyCostBreakdown(
  oracleConfig: OracleClientConfig
): Promise<TenancyCostBreakdown> {
  const tenancyId = oracleConfig.tenancyId;

  if (!tenancyId) {
    throw new Error('Tenancy ID is required');
  }

  // Get all compartments in the tenancy
  const compartments = await listCompartments(oracleConfig, { activeOnly: true });
  const compartmentIds = compartments.map((c) => c.compartmentId);

  console.log(`Fetching costs for ${compartmentIds.length} compartments in tenancy...`);

  // Fetch costs for all compartments
  const compartmentCosts = await Promise.all(
    compartmentIds.map(async (compartmentId) => {
      try {
        const costs = await getCompartmentCostBreakdown(oracleConfig, compartmentId);

        // Find compartment name
        const compartment = compartments.find(c => c.compartmentId === compartmentId);

        return {
          ...costs,
          compartmentName: compartment?.name,
        };
      } catch (error: any) {
        console.error(
          `Failed to get costs for compartment ${compartmentId}: ${error.message}`
        );
        return {
          compartmentId,
          thisMonth: 0,
          lastMonth: 0,
          currency: 'USD',
          breakdown: [],
        };
      }
    })
  );

  // Aggregate costs
  const aggregated = aggregateCosts(compartmentCosts);

  return {
    tenancyId: tenancyId,
    totals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    totalsByService: aggregated.totalsByService,
    compartments: compartmentCosts,
    compartmentCount: compartmentCosts.length,
  };
}

/**
 * Get detailed cost breakdown with compartment metadata
 */
export async function getDetailedMultiCompartmentCostBreakdown(
  oracleConfig: OracleClientConfig,
  options?: {
    activeOnly?: boolean;
    compartmentIds?: string[];
  }
): Promise<{
  compartments: Array<{
    compartment: OracleCompartment;
    costs: OracleCostData;
  }>;
  aggregatedTotals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  aggregatedTotalsByService: Record<string, number>;
}> {
  // Get compartment list
  let compartments: OracleCompartment[];

  if (options?.compartmentIds && options.compartmentIds.length > 0) {
    // Fetch specific compartments
    const allCompartments = await listCompartments(oracleConfig, { activeOnly: false });
    compartments = allCompartments.filter(c =>
      options.compartmentIds!.includes(c.compartmentId)
    );
  } else {
    // Fetch all compartments
    compartments = await listCompartments(oracleConfig, {
      activeOnly: options?.activeOnly !== false,
    });
  }

  // Fetch costs for each compartment
  const detailedCosts = await Promise.all(
    compartments.map(async (compartment) => {
      try {
        const costs = await getCompartmentCostBreakdown(
          oracleConfig,
          compartment.compartmentId
        );

        return {
          compartment,
          costs: {
            ...costs,
            compartmentName: compartment.name,
          },
        };
      } catch (error: any) {
        console.error(
          `Failed to get costs for compartment ${compartment.compartmentId}: ${error.message}`
        );
        return {
          compartment,
          costs: {
            compartmentId: compartment.compartmentId,
            compartmentName: compartment.name,
            thisMonth: 0,
            lastMonth: 0,
            currency: 'USD',
            breakdown: [],
          },
        };
      }
    })
  );

  // Aggregate costs
  const allCosts = detailedCosts.map((d) => d.costs);
  const aggregated = aggregateCosts(allCosts);

  return {
    compartments: detailedCosts,
    aggregatedTotals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    aggregatedTotalsByService: aggregated.totalsByService,
  };
}

/**
 * Get cost breakdown by compartment hierarchy
 */
export async function getCostsByCompartmentHierarchy(
  oracleConfig: OracleClientConfig
): Promise<Map<string, {
  compartment: OracleCompartment;
  costs: OracleCostData;
  children: Map<string, any>;
}>> {
  const compartments = await listCompartments(oracleConfig, { activeOnly: true });

  // Build hierarchy map
  const hierarchy = new Map<string, {
    compartment: OracleCompartment;
    costs: OracleCostData;
    children: Map<string, any>;
  }>();

  // Fetch costs for all compartments in parallel
  const costsPromises = compartments.map(async (compartment) => {
    try {
      const costs = await getCompartmentCostBreakdown(oracleConfig, compartment.compartmentId);
      return { compartment, costs };
    } catch (error: any) {
      console.error(
        `Failed to get costs for compartment ${compartment.compartmentId}: ${error.message}`
      );
      return {
        compartment,
        costs: {
          compartmentId: compartment.compartmentId,
          compartmentName: compartment.name,
          thisMonth: 0,
          lastMonth: 0,
          currency: 'USD',
          breakdown: [],
        },
      };
    }
  });

  const costsResults = await Promise.all(costsPromises);

  // Build hierarchy
  for (const { compartment, costs } of costsResults) {
    hierarchy.set(compartment.compartmentId, {
      compartment,
      costs,
      children: new Map(),
    });
  }

  // Link children to parents
  for (const { compartment } of costsResults) {
    if (compartment.parentCompartmentId) {
      const parent = hierarchy.get(compartment.parentCompartmentId);
      if (parent) {
        parent.children.set(compartment.compartmentId, hierarchy.get(compartment.compartmentId));
      }
    }
  }

  return hierarchy;
}

/**
 * Get top spending compartments
 */
export async function getTopSpendingCompartments(
  oracleConfig: OracleClientConfig,
  limit: number = 10
): Promise<Array<{
  compartment: OracleCompartment;
  costs: OracleCostData;
}>> {
  const detailed = await getDetailedMultiCompartmentCostBreakdown(oracleConfig, {
    activeOnly: true,
  });

  // Sort by this month's spending
  const sorted = detailed.compartments.sort((a, b) =>
    b.costs.thisMonth - a.costs.thisMonth
  );

  return sorted.slice(0, limit);
}

/**
 * Get compartment cost trend comparison
 */
export async function getCompartmentCostComparison(
  oracleConfig: OracleClientConfig,
  compartmentIds: string[]
): Promise<Array<{
  compartmentId: string;
  compartmentName?: string;
  thisMonth: number;
  lastMonth: number;
  changeAmount: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}>> {
  const costs = await Promise.all(
    compartmentIds.map(async (compartmentId) => {
      try {
        const cost = await getCompartmentCostBreakdown(oracleConfig, compartmentId);

        const changeAmount = cost.thisMonth - cost.lastMonth;
        const changePercentage = cost.lastMonth > 0
          ? (changeAmount / cost.lastMonth) * 100
          : 0;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (Math.abs(changePercentage) > 5) {
          trend = changePercentage > 0 ? 'increasing' : 'decreasing';
        }

        return {
          compartmentId,
          compartmentName: cost.compartmentName,
          thisMonth: cost.thisMonth,
          lastMonth: cost.lastMonth,
          changeAmount,
          changePercentage,
          trend,
        };
      } catch (error: any) {
        console.error(`Failed to get costs for compartment ${compartmentId}: ${error.message}`);
        return {
          compartmentId,
          thisMonth: 0,
          lastMonth: 0,
          changeAmount: 0,
          changePercentage: 0,
          trend: 'stable' as const,
        };
      }
    })
  );

  return costs;
}

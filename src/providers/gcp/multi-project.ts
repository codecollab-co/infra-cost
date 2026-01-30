import { GCPClientConfig } from './config';
import { getTotalCosts, TotalCosts } from './cost';
import { getProjectInfo, listProjects } from './project';
import { CostBreakdown } from '../../types/providers';
import { showSpinner } from '../../logger';

/**
 * Multi-project cost breakdown with per-project details
 */
export interface MultiProjectCostBreakdown extends CostBreakdown {
  projects: Array<{
    projectId: string;
    projectName: string;
    totals: TotalCosts['totals'];
    totalsByService: TotalCosts['totalsByService'];
  }>;
  aggregatedTotals: TotalCosts['totals'];
  aggregatedTotalsByService: TotalCosts['totalsByService'];
}

/**
 * Organization hierarchy node
 */
export interface OrganizationNode {
  id: string;
  name: string;
  type: 'organization' | 'folder' | 'project';
  parent?: string;
  totals?: TotalCosts['totals'];
  totalsByService?: TotalCosts['totalsByService'];
  children?: OrganizationNode[];
}

/**
 * Get cost breakdown for a single project
 */
async function getProjectCostBreakdown(
  baseConfig: GCPClientConfig,
  projectId: string,
  billingDatasetId?: string,
  billingTableId?: string
): Promise<{
  projectId: string;
  projectName: string;
  totals: TotalCosts['totals'];
  totalsByService: TotalCosts['totalsByService'];
}> {
  const projectConfig = { ...baseConfig, projectId };

  try {
    // Get project info
    const projectInfo = await getProjectInfo(projectConfig);

    // Get costs
    const costs = await getTotalCosts(projectConfig, billingDatasetId, billingTableId);

    return {
      projectId,
      projectName: projectInfo.projectName,
      totals: costs.totals,
      totalsByService: costs.totalsByService,
    };
  } catch (error) {
    console.warn(`Failed to get costs for project ${projectId}: ${error.message}`);

    // Return empty costs for failed projects
    return {
      projectId,
      projectName: projectId,
      totals: {
        lastMonth: 0,
        thisMonth: 0,
        last7Days: 0,
        yesterday: 0,
      },
      totalsByService: {
        lastMonth: {},
        thisMonth: {},
        last7Days: {},
        yesterday: {},
      },
    };
  }
}

/**
 * Aggregate costs from multiple projects
 */
function aggregateCosts(
  projects: Array<{
    totals: TotalCosts['totals'];
    totalsByService: TotalCosts['totalsByService'];
  }>
): {
  aggregatedTotals: TotalCosts['totals'];
  aggregatedTotalsByService: TotalCosts['totalsByService'];
} {
  const aggregatedTotals = {
    lastMonth: 0,
    thisMonth: 0,
    last7Days: 0,
    yesterday: 0,
  };

  const aggregatedTotalsByService: TotalCosts['totalsByService'] = {
    lastMonth: {},
    thisMonth: {},
    last7Days: {},
    yesterday: {},
  };

  // Aggregate totals
  for (const project of projects) {
    aggregatedTotals.lastMonth += project.totals.lastMonth;
    aggregatedTotals.thisMonth += project.totals.thisMonth;
    aggregatedTotals.last7Days += project.totals.last7Days;
    aggregatedTotals.yesterday += project.totals.yesterday;

    // Aggregate by service
    for (const period of ['lastMonth', 'thisMonth', 'last7Days', 'yesterday'] as const) {
      const serviceCosts = project.totalsByService[period];
      for (const [service, cost] of Object.entries(serviceCosts)) {
        if (!aggregatedTotalsByService[period][service]) {
          aggregatedTotalsByService[period][service] = 0;
        }
        aggregatedTotalsByService[period][service] += cost;
      }
    }
  }

  return {
    aggregatedTotals,
    aggregatedTotalsByService,
  };
}

/**
 * Get cost breakdown for all accessible projects
 */
export async function getMultiProjectCostBreakdown(
  gcpConfig: GCPClientConfig,
  billingDatasetId?: string,
  billingTableId?: string,
  options?: {
    activeOnly?: boolean;
    projectIds?: string[];
  }
): Promise<MultiProjectCostBreakdown> {
  showSpinner('Fetching costs for multiple projects');

  let projectIds: string[];

  if (options?.projectIds && options.projectIds.length > 0) {
    // Use provided project IDs
    projectIds = options.projectIds;
  } else {
    // List all accessible projects
    const projects = await listProjects(gcpConfig, { activeOnly: options?.activeOnly });
    projectIds = projects.map((p) => p.projectId);
  }

  if (projectIds.length === 0) {
    throw new Error('No projects found. Ensure you have access to at least one project.');
  }

  console.log(`\nFetching costs for ${projectIds.length} projects...`);

  // Fetch costs for all projects in parallel
  const projectCosts = await Promise.all(
    projectIds.map((projectId) =>
      getProjectCostBreakdown(gcpConfig, projectId, billingDatasetId, billingTableId)
    )
  );

  // Aggregate costs
  const { aggregatedTotals, aggregatedTotalsByService } = aggregateCosts(projectCosts);

  return {
    totals: aggregatedTotals,
    totalsByService: aggregatedTotalsByService,
    projects: projectCosts,
    aggregatedTotals,
    aggregatedTotalsByService,
  };
}

/**
 * Get organization-level cost aggregation
 */
export async function getOrganizationCosts(
  gcpConfig: GCPClientConfig,
  organizationId: string,
  billingDatasetId?: string,
  billingTableId?: string
): Promise<{
  organizationId: string;
  hierarchy: OrganizationNode;
  totals: TotalCosts['totals'];
  totalsByService: TotalCosts['totalsByService'];
  projectCount: number;
}> {
  showSpinner(`Fetching organization costs for ${organizationId}`);

  try {
    // Use Resource Manager API to search for projects in organization
    const { google } = await import('googleapis');
    const resourceManager = google.cloudresourcemanager({
      version: 'v3',
      auth: gcpConfig.auth as any,
    });

    // Search for all projects under this organization
    const response = await resourceManager.projects.search({
      query: `parent:organizations/${organizationId}`,
    });

    const projects = response.data.projects || [];
    const projectIds = projects.map((p) => p.projectId).filter(Boolean) as string[];

    if (projectIds.length === 0) {
      throw new Error(
        `No projects found in organization ${organizationId}. ` +
          `Ensure you have 'resourcemanager.projects.list' permission at the organization level.`
      );
    }

    console.log(`\nFound ${projectIds.length} projects in organization ${organizationId}`);

    // Get costs for all projects
    const projectCosts = await Promise.all(
      projectIds.map((projectId) =>
        getProjectCostBreakdown(gcpConfig, projectId, billingDatasetId, billingTableId)
      )
    );

    // Aggregate costs
    const { aggregatedTotals, aggregatedTotalsByService } = aggregateCosts(projectCosts);

    // Build organization hierarchy
    const hierarchy: OrganizationNode = {
      id: organizationId,
      name: `Organization ${organizationId}`,
      type: 'organization',
      totals: aggregatedTotals,
      totalsByService: aggregatedTotalsByService,
      children: projectCosts.map((project) => ({
        id: project.projectId,
        name: project.projectName,
        type: 'project' as const,
        parent: organizationId,
        totals: project.totals,
        totalsByService: project.totalsByService,
      })),
    };

    return {
      organizationId,
      hierarchy,
      totals: aggregatedTotals,
      totalsByService: aggregatedTotalsByService,
      projectCount: projectIds.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get organization costs: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Cloud Resource Manager API is enabled\n` +
        `2. Verify credentials have 'resourcemanager.projects.list' at org level\n` +
        `3. Check organization ID is correct: ${organizationId}\n` +
        `4. Ensure organization has at least one project`
    );
  }
}

/**
 * Get folder-level cost aggregation (nested under organization)
 */
export async function getFolderCosts(
  gcpConfig: GCPClientConfig,
  folderId: string,
  billingDatasetId?: string,
  billingTableId?: string
): Promise<{
  folderId: string;
  totals: TotalCosts['totals'];
  totalsByService: TotalCosts['totalsByService'];
  projectCount: number;
}> {
  showSpinner(`Fetching folder costs for ${folderId}`);

  try {
    const { google } = await import('googleapis');
    const resourceManager = google.cloudresourcemanager({
      version: 'v3',
      auth: gcpConfig.auth as any,
    });

    // Search for all projects under this folder
    const response = await resourceManager.projects.search({
      query: `parent:folders/${folderId}`,
    });

    const projects = response.data.projects || [];
    const projectIds = projects.map((p) => p.projectId).filter(Boolean) as string[];

    if (projectIds.length === 0) {
      console.warn(`No projects found in folder ${folderId}`);
      return {
        folderId,
        totals: { lastMonth: 0, thisMonth: 0, last7Days: 0, yesterday: 0 },
        totalsByService: { lastMonth: {}, thisMonth: {}, last7Days: {}, yesterday: {} },
        projectCount: 0,
      };
    }

    // Get costs for all projects
    const projectCosts = await Promise.all(
      projectIds.map((projectId) =>
        getProjectCostBreakdown(gcpConfig, projectId, billingDatasetId, billingTableId)
      )
    );

    // Aggregate costs
    const { aggregatedTotals, aggregatedTotalsByService } = aggregateCosts(projectCosts);

    return {
      folderId,
      totals: aggregatedTotals,
      totalsByService: aggregatedTotalsByService,
      projectCount: projectIds.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get folder costs: ${error.message}\n\n` +
        `Ensure credentials have 'resourcemanager.projects.list' permission at folder level`
    );
  }
}

import { google } from 'googleapis';
import { GCPClientConfig } from './config';
import { showSpinner } from '../../logger';

/**
 * Get GCP project information including project number and name
 */
export async function getProjectInfo(gcpConfig: GCPClientConfig): Promise<{
  projectId: string;
  projectNumber: string;
  projectName: string;
  state: string;
  labels?: Record<string, string>;
}> {
  showSpinner('Getting GCP project information');

  try {
    const cloudResourceManager = google.cloudresourcemanager({
      version: 'v1',
      auth: gcpConfig.auth,
    });

    const response = await cloudResourceManager.projects.get({
      projectId: gcpConfig.projectId,
    });

    const project = response.data;

    // Check if project is active
    if (project.lifecycleState !== 'ACTIVE') {
      console.warn(
        `Warning: Project ${gcpConfig.projectId} is in state: ${project.lifecycleState}`
      );
    }

    return {
      projectId: project.projectId || gcpConfig.projectId,
      projectNumber: project.projectNumber?.toString() || '',
      projectName: project.name || project.projectId || '',
      state: project.lifecycleState || 'UNKNOWN',
      labels: project.labels || {},
    };
  } catch (error) {
    // Handle specific error cases
    if (error.code === 403) {
      throw new Error(
        `Access denied to project ${gcpConfig.projectId}. ` +
        `Ensure your credentials have 'resourcemanager.projects.get' permission.`
      );
    }

    if (error.code === 404) {
      throw new Error(
        `Project ${gcpConfig.projectId} not found. ` +
        `Please verify the project ID is correct and accessible.`
      );
    }

    throw new Error(`Failed to get GCP project information: ${error.message}`);
  }
}

/**
 * List all projects accessible by the current credentials
 */
export async function listProjects(
  gcpConfig: GCPClientConfig,
  options?: {
    filter?: string; // e.g., "labels.environment=production"
    activeOnly?: boolean;
  }
): Promise<
  Array<{
    projectId: string;
    projectNumber: string;
    name: string;
    state: string;
    labels?: Record<string, string>;
  }>
> {
  showSpinner('Listing GCP projects');

  try {
    const cloudResourceManager = google.cloudresourcemanager({
      version: 'v1',
      auth: gcpConfig.auth,
    });

    // Build filter query
    let filter = options?.filter || '';
    if (options?.activeOnly) {
      filter = filter ? `${filter} AND lifecycleState:ACTIVE` : 'lifecycleState:ACTIVE';
    }

    const response = await cloudResourceManager.projects.list({
      filter: filter || undefined,
    });

    const projects = response.data.projects || [];

    if (projects.length === 0) {
      console.warn('No GCP projects found with current credentials');
    }

    return projects.map((project) => ({
      projectId: project.projectId || '',
      projectNumber: project.projectNumber?.toString() || '',
      name: project.name || project.projectId || '',
      state: project.lifecycleState || 'UNKNOWN',
      labels: project.labels || {},
    }));
  } catch (error) {
    // Handle specific error cases
    if (error.code === 403) {
      throw new Error(
        `Access denied when listing projects. ` +
        `Ensure your credentials have 'resourcemanager.projects.list' permission.`
      );
    }

    throw new Error(`Failed to list GCP projects: ${error.message}`);
  }
}

/**
 * Get multiple projects information by project IDs
 * Useful for multi-project cost aggregation
 */
export async function getMultipleProjects(
  gcpConfig: GCPClientConfig,
  projectIds: string[]
): Promise<
  Array<{
    projectId: string;
    projectNumber: string;
    projectName: string;
    state: string;
    labels?: Record<string, string>;
    error?: string;
  }>
> {
  showSpinner(`Getting information for ${projectIds.length} projects`);

  const results = await Promise.allSettled(
    projectIds.map(async (projectId) => {
      const config = { ...gcpConfig, projectId };
      return getProjectInfo(config);
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        projectId: projectIds[index],
        projectNumber: '',
        projectName: '',
        state: 'ERROR',
        error: result.reason.message,
      };
    }
  });
}

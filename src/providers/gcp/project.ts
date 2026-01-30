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

    return {
      projectId: project.projectId || gcpConfig.projectId,
      projectNumber: project.projectNumber?.toString() || '',
      projectName: project.name || project.projectId || '',
    };
  } catch (error) {
    throw new Error(`Failed to get GCP project information: ${error.message}`);
  }
}

/**
 * List all projects accessible by the current credentials
 */
export async function listProjects(gcpConfig: GCPClientConfig): Promise<
  Array<{
    projectId: string;
    projectNumber: string;
    name: string;
    state: string;
  }>
> {
  showSpinner('Listing GCP projects');

  try {
    const cloudResourceManager = google.cloudresourcemanager({
      version: 'v1',
      auth: gcpConfig.auth,
    });

    const response = await cloudResourceManager.projects.list({});

    const projects = response.data.projects || [];

    return projects.map((project) => ({
      projectId: project.projectId || '',
      projectNumber: project.projectNumber?.toString() || '',
      name: project.name || project.projectId || '',
      state: project.lifecycleState || 'UNKNOWN',
    }));
  } catch (error) {
    throw new Error(`Failed to list GCP projects: ${error.message}`);
  }
}

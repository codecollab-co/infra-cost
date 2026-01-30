import {
  getMultiProjectCostBreakdown,
  getOrganizationCosts,
  getFolderCosts,
} from '../../../../src/providers/gcp/multi-project';

// Mock dependencies
jest.mock('../../../../src/providers/gcp/cost');
jest.mock('../../../../src/providers/gcp/project');
jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));
jest.mock('googleapis');

describe('GCP Multi-Project', () => {
  const mockAuth = {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  };

  const mockGcpConfig = {
    auth: mockAuth as any,
    projectId: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock project info
    const { getProjectInfo } = require('../../../../src/providers/gcp/project');
    getProjectInfo.mockImplementation((config: any) =>
      Promise.resolve({
        projectId: config.projectId,
        projectNumber: '123456789',
        projectName: `Project ${config.projectId}`,
        state: 'ACTIVE',
      })
    );

    // Mock cost data
    const { getTotalCosts } = require('../../../../src/providers/gcp/cost');
    getTotalCosts.mockImplementation((config: any) => {
      // Return different costs based on project ID
      const baseAmount = config.projectId === 'project-1' ? 100 : 200;
      return Promise.resolve({
        totals: {
          lastMonth: baseAmount,
          thisMonth: baseAmount * 1.5,
          last7Days: baseAmount * 0.35,
          yesterday: baseAmount * 0.05,
        },
        totalsByService: {
          lastMonth: {
            'Compute Engine': baseAmount * 0.6,
            'Cloud Storage': baseAmount * 0.4,
          },
          thisMonth: {
            'Compute Engine': baseAmount * 0.9,
            'Cloud Storage': baseAmount * 0.6,
          },
          last7Days: {
            'Compute Engine': baseAmount * 0.21,
            'Cloud Storage': baseAmount * 0.14,
          },
          yesterday: {
            'Compute Engine': baseAmount * 0.03,
            'Cloud Storage': baseAmount * 0.02,
          },
        },
      });
    });
  });

  describe('getMultiProjectCostBreakdown', () => {
    it('should aggregate costs from multiple projects', async () => {
      const { listProjects } = require('../../../../src/providers/gcp/project');
      listProjects.mockResolvedValue([
        { projectId: 'project-1', projectName: 'Project 1', state: 'ACTIVE' },
        { projectId: 'project-2', projectName: 'Project 2', state: 'ACTIVE' },
      ]);

      const result = await getMultiProjectCostBreakdown(mockGcpConfig);

      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].projectId).toBe('project-1');
      expect(result.projects[1].projectId).toBe('project-2');

      // Check aggregated totals (100 + 200 = 300 for lastMonth)
      expect(result.aggregatedTotals.lastMonth).toBe(300);
      // thisMonth: 150 + 300 = 450
      expect(result.aggregatedTotals.thisMonth).toBe(450);

      // Check aggregated by service
      // Compute Engine lastMonth: 60 + 120 = 180
      expect(result.aggregatedTotalsByService.lastMonth['Compute Engine']).toBe(180);
      // Cloud Storage lastMonth: 40 + 80 = 120
      expect(result.aggregatedTotalsByService.lastMonth['Cloud Storage']).toBe(120);
    });

    it('should filter to specific project IDs', async () => {
      const result = await getMultiProjectCostBreakdown(mockGcpConfig, undefined, undefined, {
        projectIds: ['project-1', 'project-3'],
      });

      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].projectId).toBe('project-1');
      expect(result.projects[1].projectId).toBe('project-3');
    });

    it('should handle project cost fetch failures gracefully', async () => {
      const { getTotalCosts } = require('../../../../src/providers/gcp/cost');
      getTotalCosts.mockImplementation((config: any) => {
        if (config.projectId === 'failing-project') {
          return Promise.reject(new Error('Access denied'));
        }
        return Promise.resolve({
          totals: { lastMonth: 100, thisMonth: 150, last7Days: 35, yesterday: 5 },
          totalsByService: {
            lastMonth: { 'Compute Engine': 60 },
            thisMonth: { 'Compute Engine': 90 },
            last7Days: { 'Compute Engine': 21 },
            yesterday: { 'Compute Engine': 3 },
          },
        });
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await getMultiProjectCostBreakdown(mockGcpConfig, undefined, undefined, {
        projectIds: ['working-project', 'failing-project'],
      });

      expect(result.projects).toHaveLength(2);
      // Failed project should have zero costs
      expect(result.projects[1].totals.thisMonth).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get costs for project failing-project')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when no projects found', async () => {
      const { listProjects } = require('../../../../src/providers/gcp/project');
      listProjects.mockResolvedValue([]);

      await expect(getMultiProjectCostBreakdown(mockGcpConfig)).rejects.toThrow(
        'No projects found'
      );
    });

    it('should support activeOnly filter', async () => {
      const { listProjects } = require('../../../../src/providers/gcp/project');
      listProjects.mockResolvedValue([
        { projectId: 'active-project', projectName: 'Active Project', state: 'ACTIVE' },
      ]);

      await getMultiProjectCostBreakdown(mockGcpConfig, undefined, undefined, {
        activeOnly: true,
      });

      expect(listProjects).toHaveBeenCalledWith(mockGcpConfig, { activeOnly: true });
    });
  });

  describe('getOrganizationCosts', () => {
    it('should aggregate costs from all projects in organization', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockResolvedValue({
            data: {
              projects: [
                { projectId: 'org-project-1' },
                { projectId: 'org-project-2' },
                { projectId: 'org-project-3' },
              ],
            },
          }),
        },
      });

      const result = await getOrganizationCosts(mockGcpConfig, '123456789');

      expect(result.organizationId).toBe('123456789');
      expect(result.projectCount).toBe(3);
      expect(result.hierarchy.type).toBe('organization');
      expect(result.hierarchy.children).toHaveLength(3);

      // Check aggregated totals
      expect(result.totals.lastMonth).toBeGreaterThan(0);
      expect(result.hierarchy.totals).toEqual(result.totals);
    });

    it('should build organization hierarchy with project nodes', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockResolvedValue({
            data: {
              projects: [{ projectId: 'child-project-1' }, { projectId: 'child-project-2' }],
            },
          }),
        },
      });

      const result = await getOrganizationCosts(mockGcpConfig, '123456789');

      expect(result.hierarchy.children).toHaveLength(2);
      expect(result.hierarchy.children![0].type).toBe('project');
      expect(result.hierarchy.children![0].parent).toBe('123456789');
      expect(result.hierarchy.children![0].totals).toBeDefined();
    });

    it('should throw error when no projects found in organization', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockResolvedValue({
            data: {
              projects: [],
            },
          }),
        },
      });

      await expect(getOrganizationCosts(mockGcpConfig, '123456789')).rejects.toThrow(
        'No projects found in organization'
      );
    });

    it('should provide helpful error messages', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockRejectedValue(new Error('Permission denied')),
        },
      });

      await expect(getOrganizationCosts(mockGcpConfig, '123456789')).rejects.toThrow(
        'Failed to get organization costs'
      );
    });
  });

  describe('getFolderCosts', () => {
    it('should aggregate costs from all projects in folder', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockResolvedValue({
            data: {
              projects: [{ projectId: 'folder-project-1' }, { projectId: 'folder-project-2' }],
            },
          }),
        },
      });

      const result = await getFolderCosts(mockGcpConfig, '987654321');

      expect(result.folderId).toBe('987654321');
      expect(result.projectCount).toBe(2);
      expect(result.totals.thisMonth).toBeGreaterThan(0);
    });

    it('should handle empty folders gracefully', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockResolvedValue({
            data: {
              projects: [],
            },
          }),
        },
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await getFolderCosts(mockGcpConfig, '987654321');

      expect(result.projectCount).toBe(0);
      expect(result.totals.thisMonth).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No projects found in folder')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error on API failures', async () => {
      const { google } = require('googleapis');
      google.cloudresourcemanager.mockReturnValue({
        projects: {
          search: jest.fn().mockRejectedValue(new Error('API error')),
        },
      });

      await expect(getFolderCosts(mockGcpConfig, '987654321')).rejects.toThrow(
        'Failed to get folder costs'
      );
    });
  });
});

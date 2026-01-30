import { getProjectInfo, listProjects, getMultipleProjects } from '../../../../src/providers/gcp/project';
import { google } from 'googleapis';

// Mock googleapis
jest.mock('googleapis');

// Mock logger
jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));

describe('GCP Project', () => {
  const mockAuth = {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  };

  const mockGcpConfig = {
    auth: mockAuth as any,
    projectId: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectInfo', () => {
    it('should retrieve project information successfully', async () => {
      const mockProjectData = {
        projectId: 'test-project',
        projectNumber: '123456789',
        name: 'Test Project',
        lifecycleState: 'ACTIVE',
        labels: { environment: 'test' },
      };

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockResolvedValue({ data: mockProjectData }),
        },
      });

      const result = await getProjectInfo(mockGcpConfig);

      expect(result).toEqual({
        projectId: 'test-project',
        projectNumber: '123456789',
        projectName: 'Test Project',
        state: 'ACTIVE',
        labels: { environment: 'test' },
      });
    });

    it('should handle missing project (404)', async () => {
      const error: any = new Error('Not found');
      error.code = 404;

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockRejectedValue(error),
        },
      });

      await expect(getProjectInfo(mockGcpConfig)).rejects.toThrow(
        'Project test-project not found'
      );
    });

    it('should handle access denied (403)', async () => {
      const error: any = new Error('Access denied');
      error.code = 403;

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockRejectedValue(error),
        },
      });

      await expect(getProjectInfo(mockGcpConfig)).rejects.toThrow(
        'Access denied to project test-project'
      );
    });

    it('should warn when project is not active', async () => {
      const mockProjectData = {
        projectId: 'test-project',
        projectNumber: '123456789',
        name: 'Test Project',
        lifecycleState: 'DELETE_REQUESTED',
      };

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockResolvedValue({ data: mockProjectData }),
        },
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      await getProjectInfo(mockGcpConfig);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DELETE_REQUESTED')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('listProjects', () => {
    it('should list all accessible projects', async () => {
      const mockProjects = [
        {
          projectId: 'project-1',
          projectNumber: '111',
          name: 'Project 1',
          lifecycleState: 'ACTIVE',
          labels: { env: 'prod' },
        },
        {
          projectId: 'project-2',
          projectNumber: '222',
          name: 'Project 2',
          lifecycleState: 'ACTIVE',
        },
      ];

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          list: jest.fn().mockResolvedValue({ data: { projects: mockProjects } }),
        },
      });

      const result = await listProjects(mockGcpConfig);

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('project-1');
      expect(result[1].projectId).toBe('project-2');
    });

    it('should filter for active projects only', async () => {
      const mockProjects = [
        { projectId: 'p1', lifecycleState: 'ACTIVE' },
      ];

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          list: jest.fn().mockImplementation((params) => {
            expect(params.filter).toContain('lifecycleState:ACTIVE');
            return Promise.resolve({ data: { projects: mockProjects } });
          }),
        },
      });

      await listProjects(mockGcpConfig, { activeOnly: true });
    });

    it('should handle empty project list', async () => {
      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          list: jest.fn().mockResolvedValue({ data: { projects: [] } }),
        },
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await listProjects(mockGcpConfig);

      expect(result).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No GCP projects found')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getMultipleProjects', () => {
    it('should retrieve information for multiple projects', async () => {
      const mockProjectData = (projectId: string) => ({
        projectId,
        projectNumber: '123',
        name: `Project ${projectId}`,
        lifecycleState: 'ACTIVE',
      });

      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockImplementation(({ projectId }) =>
            Promise.resolve({ data: mockProjectData(projectId) })
          ),
        },
      });

      const result = await getMultipleProjects(mockGcpConfig, ['p1', 'p2']);

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('p1');
      expect(result[1].projectId).toBe('p2');
      expect(result[0]).not.toHaveProperty('error');
    });

    it('should handle errors for individual projects', async () => {
      (google.cloudresourcemanager as any).mockReturnValue({
        projects: {
          get: jest.fn().mockImplementation(({ projectId }) => {
            if (projectId === 'bad-project') {
              return Promise.reject(new Error('Not found'));
            }
            return Promise.resolve({
              data: { projectId, lifecycleState: 'ACTIVE' },
            });
          }),
        },
      });

      const result = await getMultipleProjects(mockGcpConfig, [
        'good-project',
        'bad-project',
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('good-project');
      expect(result[0]).not.toHaveProperty('error');
      expect(result[1].projectId).toBe('bad-project');
      expect(result[1].state).toBe('ERROR');
      expect(result[1]).toHaveProperty('error');
    });
  });
});

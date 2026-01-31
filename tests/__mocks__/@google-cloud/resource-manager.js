// Manual mock for @google-cloud/resource-manager
const jestGlobals = require('@jest/globals');

const mockGetProject = jestGlobals.jest.fn().mockResolvedValue([
  {
    name: 'projects/test-project-123',
    projectId: 'test-project-123',
    displayName: 'Test Project',
    lifecycleState: 'ACTIVE',
    createTime: '2024-01-01T00:00:00Z',
  },
]);

const mockSearchProjects = jestGlobals.jest.fn().mockResolvedValue([
  [
    {
      name: 'projects/test-project-123',
      projectId: 'test-project-123',
      displayName: 'Test Project',
      lifecycleState: 'ACTIVE',
    },
    {
      name: 'projects/test-project-456',
      projectId: 'test-project-456',
      displayName: 'Test Project 2',
      lifecycleState: 'ACTIVE',
    },
  ],
]);

class ProjectsClient {
  constructor(options) {
    this.options = options;
  }

  getProject(request) {
    return mockGetProject(request);
  }

  searchProjects(request) {
    return mockSearchProjects(request);
  }
}

module.exports = {
  ProjectsClient,
  mockGetProject,
  mockSearchProjects,
};

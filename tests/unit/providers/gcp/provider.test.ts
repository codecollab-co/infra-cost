import { GCPProvider } from '../../../../src/providers/gcp/provider';
import { CloudProvider, ProviderConfig } from '../../../../src/types/providers';

// Mock all GCP modules
jest.mock('../../../../src/providers/gcp/config');
jest.mock('../../../../src/providers/gcp/project');
jest.mock('../../../../src/providers/gcp/cost');
jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));

describe('GCPProvider', () => {
  let provider: GCPProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: CloudProvider.GOOGLE_CLOUD,
      credentials: {
        projectId: 'test-project',
        keyFilePath: '/path/to/key.json',
      },
      region: 'us-central1',
    };

    provider = new GCPProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(GCPProvider);
    });

    it('should extract billing dataset and table IDs from config', () => {
      const configWithBilling: ProviderConfig = {
        ...mockConfig,
        credentials: {
          ...mockConfig.credentials,
          billingDatasetId: 'custom_billing',
          billingTableId: 'custom_table',
        },
      };

      const providerWithBilling = new GCPProvider(configWithBilling);
      expect(providerWithBilling).toBeDefined();
    });
  });

  describe('validateCredentials', () => {
    it('should validate credentials successfully', async () => {
      const { getGcpConfigFromOptionsOrEnv } = require('../../../../src/providers/gcp/config');
      getGcpConfigFromOptionsOrEnv.mockResolvedValue({
        auth: {},
        projectId: 'test-project',
      });

      const result = await provider.validateCredentials();
      expect(result).toBe(true);
    });

    it('should return false on validation failure', async () => {
      const { getGcpConfigFromOptionsOrEnv } = require('../../../../src/providers/gcp/config');
      getGcpConfigFromOptionsOrEnv.mockRejectedValue(new Error('Auth failed'));

      const result = await provider.validateCredentials();
      expect(result).toBe(false);
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      const { getGcpConfigFromOptionsOrEnv } = require('../../../../src/providers/gcp/config');
      const { getProjectInfo } = require('../../../../src/providers/gcp/project');

      getGcpConfigFromOptionsOrEnv.mockResolvedValue({
        auth: {},
        projectId: 'test-project',
      });

      getProjectInfo.mockResolvedValue({
        projectId: 'test-project',
        projectNumber: '123456',
        projectName: 'Test Project',
        state: 'ACTIVE',
      });

      const result = await provider.getAccountInfo();

      expect(result).toEqual({
        id: 'test-project',
        name: 'Test Project',
        provider: CloudProvider.GOOGLE_CLOUD,
      });
    });
  });

  describe('getCostBreakdown', () => {
    it('should return cost breakdown', async () => {
      const { getGcpConfigFromOptionsOrEnv } = require('../../../../src/providers/gcp/config');
      const { getTotalCosts } = require('../../../../src/providers/gcp/cost');

      getGcpConfigFromOptionsOrEnv.mockResolvedValue({
        auth: {},
        projectId: 'test-project',
      });

      const mockTotalCosts = {
        totals: {
          lastMonth: 100,
          thisMonth: 150,
          last7Days: 35,
          yesterday: 5,
        },
        totalsByService: {
          lastMonth: { 'Compute Engine': 50, 'Cloud Storage': 50 },
          thisMonth: { 'Compute Engine': 75, 'Cloud Storage': 75 },
          last7Days: { 'Compute Engine': 17.5, 'Cloud Storage': 17.5 },
          yesterday: { 'Compute Engine': 2.5, 'Cloud Storage': 2.5 },
        },
      };

      getTotalCosts.mockResolvedValue(mockTotalCosts);

      const result = await provider.getCostBreakdown();

      expect(result.totals).toEqual(mockTotalCosts.totals);
      expect(result.totalsByService).toEqual(mockTotalCosts.totalsByService);
    });
  });

  describe('static methods', () => {
    it('should validate GCP config', () => {
      expect(GCPProvider.validateGCPConfig(mockConfig)).toBe(true);
    });

    it('should return required credentials list', () => {
      const credentials = GCPProvider.getRequiredCredentials();
      expect(credentials).toContain('projectId');
      expect(credentials).toContain('keyFilePath');
    });
  });

  describe('multi-project support', () => {
    it('should list accessible projects', async () => {
      const { getGcpConfigFromOptionsOrEnv } = require('../../../../src/providers/gcp/config');
      const { listProjects } = require('../../../../src/providers/gcp/project');

      getGcpConfigFromOptionsOrEnv.mockResolvedValue({
        auth: {},
        projectId: 'test-project',
      });

      listProjects.mockResolvedValue([
        { projectId: 'project-1', name: 'Project 1', state: 'ACTIVE' },
        { projectId: 'project-2', name: 'Project 2', state: 'ACTIVE' },
      ]);

      const result = await provider.listAccessibleProjects();

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('project-1');
    });
  });
});

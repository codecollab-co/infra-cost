import { jest } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AWS_ACCESS_KEY_ID = 'test-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
  process.env.AWS_REGION = 'us-east-1';

  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

// Global test utilities
(global as any).testUtils = {
  mockAwsResponse: (data: any) => ({
    promise: () => Promise.resolve(data),
  }),

  mockAxiosResponse: (data: any, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }),

  createMockCostData: () => ({
    DimensionKey: 'SERVICE',
    ResultsByTime: [{
      TimePeriod: {
        Start: '2023-01-01',
        End: '2023-01-31'
      },
      Total: {
        UnblendedCost: {
          Amount: '100.00',
          Unit: 'USD'
        }
      },
      Groups: [{
        Keys: ['Amazon Elastic Compute Cloud - Compute'],
        Metrics: {
          UnblendedCost: {
            Amount: '50.00',
            Unit: 'USD'
          }
        }
      }]
    }]
  })
};

// Type declarations for global utilities
declare global {
  const testUtils: {
    mockAwsResponse: (data: any) => any;
    mockAxiosResponse: (data: any, status?: number) => any;
    createMockCostData: () => any;
  };
}
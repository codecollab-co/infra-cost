// @ts-nocheck
import { jest } from '@jest/globals';
import { AWSProvider } from '../../../src/providers/aws.js';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-cost-explorer');
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-rds');
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-budgets');

describe('AWSProvider', () => {
  let awsProvider: AWSProvider;

  beforeEach(() => {
    awsProvider = new AWSProvider();
  });

  describe('getCostData', () => {
    it('should retrieve cost data successfully', async () => {
      const mockCostData = testUtils.createMockCostData();

      // Mock the Cost Explorer client
      const mockGetCostAndUsage = jest.fn().mockResolvedValue(mockCostData);
      (awsProvider as any).costExplorer = {
        getCostAndUsage: mockGetCostAndUsage
      };

      const result = await awsProvider.getCostData();

      expect(mockGetCostAndUsage).toHaveBeenCalledWith({
        TimePeriod: expect.objectContaining({
          Start: expect.any(String),
          End: expect.any(String)
        }),
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
      });

      expect(result).toEqual(expect.objectContaining({
        totalCost: expect.any(Number),
        currency: 'USD',
        services: expect.any(Array),
        timePeriod: expect.objectContaining({
          start: expect.any(String),
          end: expect.any(String)
        })
      }));
    });

    it('should handle cost retrieval errors gracefully', async () => {
      const mockError = new Error('AWS API Error');
      const mockGetCostAndUsage = jest.fn().mockRejectedValue(mockError);

      (awsProvider as any).costExplorer = {
        getCostAndUsage: mockGetCostAndUsage
      };

      await expect(awsProvider.getCostData()).rejects.toThrow('AWS API Error');
    });

    it('should handle custom date range', async () => {
      const mockCostData = testUtils.createMockCostData();
      const mockGetCostAndUsage = jest.fn().mockResolvedValue(mockCostData);

      (awsProvider as any).costExplorer = {
        getCostAndUsage: mockGetCostAndUsage
      };

      const startDate = '2023-01-01';
      const endDate = '2023-01-31';

      await awsProvider.getCostData(startDate, endDate);

      expect(mockGetCostAndUsage).toHaveBeenCalledWith({
        TimePeriod: { Start: startDate, End: endDate },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
      });
    });
  });

  describe('getResourceInventory', () => {
    it('should retrieve EC2 instances', async () => {
      const mockEc2Instances = {
        Reservations: [{
          Instances: [{
            InstanceId: 'i-1234567890abcdef0',
            InstanceType: 't3.micro',
            State: { Name: 'running' },
            LaunchTime: new Date(),
            Tags: [{ Key: 'Environment', Value: 'production' }]
          }]
        }]
      };

      const mockDescribeInstances = jest.fn().mockResolvedValue(mockEc2Instances);
      (awsProvider as any).ec2 = {
        describeInstances: mockDescribeInstances
      };

      const result = await awsProvider.getResourceInventory();

      expect(mockDescribeInstances).toHaveBeenCalled();
      expect(result.ec2.instances).toHaveLength(1);
      expect(result.ec2.instances[0]).toEqual(expect.objectContaining({
        id: 'i-1234567890abcdef0',
        type: 't3.micro',
        state: 'running'
      }));
    });

    it('should handle resource inventory errors', async () => {
      const mockError = new Error('EC2 API Error');
      const mockDescribeInstances = jest.fn().mockRejectedValue(mockError);

      (awsProvider as any).ec2 = {
        describeInstances: mockDescribeInstances
      };

      const result = await awsProvider.getResourceInventory();

      expect(result.ec2.instances).toEqual([]);
      expect(result.ec2.error).toBe('EC2 API Error');
    });
  });

  describe('getBudgets', () => {
    it('should retrieve budget information', async () => {
      const mockBudgets = {
        Budgets: [{
          BudgetName: 'monthly-budget',
          BudgetLimit: { Amount: '1000', Unit: 'USD' },
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          TimePeriod: {
            Start: new Date('2023-01-01'),
            End: new Date('2023-12-31')
          }
        }]
      };

      const mockDescribeBudgets = jest.fn().mockResolvedValue(mockBudgets);
      (awsProvider as any).budgets = {
        describeBudgets: mockDescribeBudgets
      };

      const result = await awsProvider.getBudgets();

      expect(mockDescribeBudgets).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        name: 'monthly-budget',
        limit: 1000,
        currency: 'USD',
        type: 'COST'
      }));
    });
  });

  describe('getCostForecast', () => {
    it('should retrieve cost forecast', async () => {
      const mockForecast = {
        Total: {
          Amount: '1200.00',
          Unit: 'USD'
        },
        ForecastResultsByTime: [{
          TimePeriod: {
            Start: '2023-02-01',
            End: '2023-02-28'
          },
          MeanValue: '1200.00',
          PredictionIntervalLowerBound: '1000.00',
          PredictionIntervalUpperBound: '1400.00'
        }]
      };

      const mockGetCostForecast = jest.fn().mockResolvedValue(mockForecast);
      (awsProvider as any).costExplorer = {
        getCostForecast: mockGetCostForecast
      };

      const result = await awsProvider.getCostForecast(30);

      expect(mockGetCostForecast).toHaveBeenCalledWith({
        TimePeriod: expect.objectContaining({
          Start: expect.any(String),
          End: expect.any(String)
        }),
        Metric: 'UNBLENDED_COST',
        Granularity: 'DAILY'
      });

      expect(result).toEqual(expect.objectContaining({
        totalForecast: 1200.00,
        currency: 'USD',
        period: expect.objectContaining({
          start: expect.any(String),
          end: expect.any(String)
        }),
        dailyForecasts: expect.any(Array)
      }));
    });
  });

  describe('getOptimizationRecommendations', () => {
    it('should retrieve rightsizing recommendations', async () => {
      const mockRecommendations = {
        RightsizingRecommendations: [{
          AccountId: '123456789012',
          CurrentInstance: {
            ResourceId: 'i-1234567890abcdef0',
            InstanceType: 't3.large',
            OnDemandHoursInLookbackPeriod: '744',
            ReservationCoveredHoursInLookbackPeriod: '0',
            SavingsPlansHoursInLookbackPeriod: '0',
            TotalRunningHoursInLookbackPeriod: '744'
          },
          RightsizingType: 'Modify',
          ModifyRecommendationDetail: {
            TargetInstances: [{
              ResourceDetails: {
                EC2ResourceDetails: {
                  InstanceType: 't3.medium'
                }
              }
            }]
          }
        }]
      };

      const mockGetRightsizingRecommendation = jest.fn().mockResolvedValue(mockRecommendations);
      (awsProvider as any).costExplorer = {
        getRightsizingRecommendation: mockGetRightsizingRecommendation
      };

      const result = await awsProvider.getOptimizationRecommendations();

      expect(result.rightsizing).toHaveLength(1);
      expect(result.rightsizing[0]).toEqual(expect.objectContaining({
        resourceId: 'i-1234567890abcdef0',
        currentType: 't3.large',
        recommendedType: 't3.medium',
        type: 'Modify'
      }));
    });
  });

  describe('getUsageMetrics', () => {
    it('should calculate usage metrics from cost data', async () => {
      const mockCostData = testUtils.createMockCostData();
      const mockGetCostAndUsage = jest.fn().mockResolvedValue(mockCostData);

      (awsProvider as any).costExplorer = {
        getCostAndUsage: mockGetCostAndUsage
      };

      const result = await awsProvider.getUsageMetrics();

      expect(result).toEqual(expect.objectContaining({
        totalCost: expect.any(Number),
        serviceBreakdown: expect.any(Array),
        trends: expect.any(Object),
        topServices: expect.any(Array)
      }));
    });
  });

  describe('validateCredentials', () => {
    it('should validate AWS credentials successfully', async () => {
      const mockCallerIdentity = {
        UserId: 'AIDACKCEVSQ6C2EXAMPLE',
        Account: '123456789012',
        Arn: 'arn:aws:iam::123456789012:user/test-user'
      };

      const mockGetCallerIdentity = jest.fn().mockResolvedValue(mockCallerIdentity);
      (awsProvider as any).sts = {
        getCallerIdentity: mockGetCallerIdentity
      };

      const result = await awsProvider.validateCredentials();

      expect(mockGetCallerIdentity).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        isValid: true,
        accountId: '123456789012',
        userId: 'AIDACKCEVSQ6C2EXAMPLE'
      }));
    });

    it('should handle invalid credentials', async () => {
      const mockError = new Error('Invalid credentials');
      const mockGetCallerIdentity = jest.fn().mockRejectedValue(mockError);

      (awsProvider as any).sts = {
        getCallerIdentity: mockGetCallerIdentity
      };

      const result = await awsProvider.validateCredentials();

      expect(result).toEqual(expect.objectContaining({
        isValid: false,
        error: 'Invalid credentials'
      }));
    });
  });
});
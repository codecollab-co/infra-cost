import { CloudProviderAdapter, RawCostData, CostBreakdown, AccountInfo, ResourceInventory, InventoryFilters, BudgetInfo, BudgetAlert, CostTrendAnalysis, FinOpsRecommendation } from '../types/providers';
import { CostCacheManager, CacheConfig, getGlobalCache, parseTTL, formatTTL, formatCacheStats } from './cost-cache';
import chalk from 'chalk';

/**
 * Cached Provider Wrapper
 * Wraps any CloudProviderAdapter to add caching capabilities
 */
export class CachedProviderWrapper extends CloudProviderAdapter {
  private provider: CloudProviderAdapter;
  private cache: CostCacheManager;
  private accountId: string = '';
  private profile: string;
  private region: string;
  private providerName: string;
  private useCache: boolean;
  private writeCache: boolean;
  private verbose: boolean;

  constructor(
    provider: CloudProviderAdapter,
    options: {
      profile: string;
      region: string;
      providerName?: string;
      useCache?: boolean;
      writeCache?: boolean;
      cacheConfig?: Partial<CacheConfig>;
      verbose?: boolean;
    }
  ) {
    super(provider['config']);
    this.provider = provider;
    this.profile = options.profile;
    this.region = options.region;
    this.providerName = options.providerName || 'aws';
    this.useCache = options.useCache ?? true;
    this.writeCache = options.writeCache ?? true;
    this.verbose = options.verbose ?? false;
    this.cache = getGlobalCache(options.cacheConfig);
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray(`[Cache] ${message}`));
    }
  }

  /**
   * Stable JSON stringify to ensure consistent cache keys for objects
   */
  private stableStringify(value: unknown): string {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      return JSON.stringify(
        Object.keys(obj)
          .sort()
          .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
          }, {} as Record<string, unknown>)
      );
    }
    return JSON.stringify(value);
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // Account info is usually fast and changes rarely, cache for 24 hours
    // Use profile-based key initially since account ID is unknown
    const cacheKey = this.cache.generateKey({
      account: `profile-${this.profile}`,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'account-info',
    });

    if (this.useCache) {
      const cached = await this.cache.get<AccountInfo>(cacheKey);
      if (cached) {
        this.log('Account info retrieved from cache');
        this.accountId = cached.id;
        return cached;
      }
    }

    this.log('Fetching account info from provider...');
    const accountInfo = await this.provider.getAccountInfo();
    this.accountId = accountInfo.id;

    // Cache account info for 24 hours with profile-based key
    if (this.writeCache) {
      await this.cache.set(cacheKey, accountInfo, {
        account: accountInfo.id,
        profile: this.profile,
        region: this.region,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        metadata: { dataType: 'account-info' },
      });
    }

    return accountInfo;
  }

  async getRawCostData(): Promise<RawCostData> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'raw-cost-data',
    });

    if (this.useCache) {
      const cached = await this.cache.get<RawCostData>(cacheKey);
      if (cached) {
        this.log('Raw cost data retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching raw cost data from provider...');
    const rawCostData = await this.provider.getRawCostData();

    // Cache raw cost data with default TTL
    if (this.writeCache) {
      await this.cache.set(cacheKey, rawCostData, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        metadata: { dataType: 'raw-cost-data' },
      });
    }

    return rawCostData;
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'cost-breakdown',
    });

    if (this.useCache) {
      const cached = await this.cache.get<CostBreakdown>(cacheKey);
      if (cached) {
        this.log('Cost breakdown retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching cost breakdown from provider...');
    const costBreakdown = await this.provider.getCostBreakdown();

    // Cache cost breakdown with default TTL
    if (this.writeCache) {
      await this.cache.set(cacheKey, costBreakdown, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        metadata: { dataType: 'cost-breakdown' },
      });
    }

    return costBreakdown;
  }

  async validateCredentials(): Promise<boolean> {
    // Don't cache credential validation
    return this.provider.validateCredentials();
  }

  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    // Create a cache key that includes filter parameters with stable serialization
    const filterKey = filters ? this.stableStringify(filters) : 'all';
    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: `inventory-${filterKey}`,
    });

    if (this.useCache) {
      const cached = await this.cache.get<ResourceInventory>(cacheKey);
      if (cached) {
        this.log('Resource inventory retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching resource inventory from provider...');
    const inventory = await this.provider.getResourceInventory(filters);

    // Cache inventory for 1 hour (resources change more frequently)
    if (this.writeCache) {
      await this.cache.set(cacheKey, inventory, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        ttl: 60 * 60 * 1000, // 1 hour
        metadata: { dataType: 'inventory' },
      });
    }

    return inventory;
  }

  async getResourceCosts(resourceId: string): Promise<number> {
    // Resource costs are usually derived from cached data, don't cache separately
    return this.provider.getResourceCosts(resourceId);
  }

  async getOptimizationRecommendations(): Promise<string[]> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'optimization-recommendations',
    });

    if (this.useCache) {
      const cached = await this.cache.get<string[]>(cacheKey);
      if (cached) {
        this.log('Optimization recommendations retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching optimization recommendations from provider...');
    const recommendations = await this.provider.getOptimizationRecommendations();

    // Cache recommendations for 6 hours
    if (this.writeCache) {
      await this.cache.set(cacheKey, recommendations, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        metadata: { dataType: 'optimization-recommendations' },
      });
    }

    return recommendations;
  }

  async getBudgets(): Promise<BudgetInfo[]> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'budgets',
    });

    if (this.useCache) {
      const cached = await this.cache.get<BudgetInfo[]>(cacheKey);
      if (cached) {
        this.log('Budgets retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching budgets from provider...');
    const budgets = await this.provider.getBudgets();

    // Cache budgets for 2 hours
    if (this.writeCache) {
      await this.cache.set(cacheKey, budgets, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        ttl: 2 * 60 * 60 * 1000, // 2 hours
        metadata: { dataType: 'budgets' },
      });
    }

    return budgets;
  }

  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'budget-alerts',
    });

    if (this.useCache) {
      const cached = await this.cache.get<BudgetAlert[]>(cacheKey);
      if (cached) {
        this.log('Budget alerts retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching budget alerts from provider...');
    const alerts = await this.provider.getBudgetAlerts();

    // Cache alerts for 30 minutes (time-sensitive)
    if (this.writeCache) {
      await this.cache.set(cacheKey, alerts, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        ttl: 30 * 60 * 1000, // 30 minutes
        metadata: { dataType: 'budget-alerts' },
      });
    }

    return alerts;
  }

  async getCostTrendAnalysis(months?: number): Promise<CostTrendAnalysis> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: `trend-analysis-${months || 6}`,
    });

    if (this.useCache) {
      const cached = await this.cache.get<CostTrendAnalysis>(cacheKey);
      if (cached) {
        this.log('Cost trend analysis retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching cost trend analysis from provider...');
    const analysis = await this.provider.getCostTrendAnalysis(months);

    // Cache trend analysis for 4 hours
    if (this.writeCache) {
      await this.cache.set(cacheKey, analysis, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        metadata: { dataType: 'trend-analysis' },
      });
    }

    return analysis;
  }

  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    // Ensure we have account ID
    if (!this.accountId) {
      await this.getAccountInfo();
    }

    const cacheKey = this.cache.generateKey({
      account: this.accountId,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'finops-recommendations',
    });

    if (this.useCache) {
      const cached = await this.cache.get<FinOpsRecommendation[]>(cacheKey);
      if (cached) {
        this.log('FinOps recommendations retrieved from cache');
        return cached;
      }
    }

    this.log('Fetching FinOps recommendations from provider...');
    const recommendations = await this.provider.getFinOpsRecommendations();

    // Cache recommendations for 6 hours
    if (this.writeCache) {
      await this.cache.set(cacheKey, recommendations, {
        account: this.accountId,
        profile: this.profile,
        region: this.region,
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        metadata: { dataType: 'finops-recommendations' },
      });
    }

    return recommendations;
  }

  /**
   * Force refresh all cached data for this account
   */
  async refreshCache(): Promise<void> {
    // First, clear the profile-based account-info cache
    const profileAccountKey = this.cache.generateKey({
      account: `profile-${this.profile}`,
      profile: this.profile,
      region: this.region,
      provider: this.providerName,
      dataType: 'account-info',
    });
    await this.cache.invalidate(profileAccountKey);

    if (!this.accountId) {
      await this.getAccountInfo();
    }

    this.log('Refreshing cache for account...');
    const invalidated = await this.cache.invalidateAccount(this.accountId);
    this.log(`Invalidated ${invalidated} cache entries`);

    // Pre-warm cache with fresh data
    await this.getCostBreakdown();
    this.log('Cache refreshed with fresh cost data');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<string> {
    const stats = await this.cache.getStats();
    return formatCacheStats(stats);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Get underlying provider
   */
  getProvider(): CloudProviderAdapter {
    return this.provider;
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.useCache = enabled;
  }

  /**
   * Check if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.useCache;
  }
}

/**
 * Wrap a provider with caching capabilities
 */
export function wrapWithCache(
  provider: CloudProviderAdapter,
  options: {
    profile: string;
    region: string;
    providerName?: string;
    useCache?: boolean;
    writeCache?: boolean;
    cacheTtl?: string;
    cacheType?: 'file' | 'memory' | 'redis';
    verbose?: boolean;
  }
): CachedProviderWrapper {
  const cacheConfig: Partial<CacheConfig> = {
    type: options.cacheType || 'file',
  };

  if (options.cacheTtl) {
    cacheConfig.ttl = parseTTL(options.cacheTtl);
  }

  return new CachedProviderWrapper(provider, {
    profile: options.profile,
    region: options.region,
    providerName: options.providerName,
    useCache: options.useCache,
    writeCache: options.writeCache,
    cacheConfig,
    verbose: options.verbose,
  });
}

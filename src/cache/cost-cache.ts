import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { RawCostData, CostBreakdown } from '../types/providers';

/**
 * Cost Cache Manager
 * Issue #28: Implement caching layer for cost data to improve performance
 *
 * Features:
 * - File-based caching (default)
 * - In-memory caching for CI/CD
 * - Configurable TTL
 * - Cache key based on account, region, date range, profile
 * - Cache invalidation and refresh
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  account: string;
  profile: string;
  region: string;
  metadata?: {
    provider?: string;
    dateRange?: { start: string; end: string };
    dataType?: string;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

export interface CacheConfig {
  type: 'file' | 'memory' | 'redis';
  ttl: number; // TTL in milliseconds
  maxSize?: number; // Max cache size in bytes (for memory cache)
  maxEntries?: number; // Max number of cache entries
  cacheDir?: string; // Directory for file cache
  redisUrl?: string; // Redis connection URL
  prefix?: string; // Cache key prefix
}

export type CacheableData = RawCostData | CostBreakdown | any;

const DEFAULT_CONFIG: CacheConfig = {
  type: 'file',
  ttl: 4 * 60 * 60 * 1000, // 4 hours default
  maxEntries: 1000,
  cacheDir: join(homedir(), '.infra-cost', 'cache'),
  prefix: 'infra-cost',
};

/**
 * Abstract cache storage interface
 */
interface CacheStorage {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  stats(): Promise<CacheStats>;
}

/**
 * File-based cache storage
 */
class FileCacheStorage implements CacheStorage {
  private cacheDir: string;
  private hitCount = 0;
  private missCount = 0;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true, mode: 0o700 });
    } else {
      // Ensure existing directory has correct permissions
      chmodSync(this.cacheDir, 0o700);
    }
  }

  private getFilePath(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex').substring(0, 16);
    return join(this.cacheDir, `${hash}.json`);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const filePath = this.getFilePath(key);

    if (!existsSync(filePath)) {
      this.missCount++;
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf8');
      const entry = JSON.parse(content) as CacheEntry<T>;

      // Verify the key matches (hash collision check)
      if (entry.key !== key) {
        this.missCount++;
        return null;
      }

      // Check if entry is expired
      if (Date.now() > entry.timestamp + entry.ttl) {
        await this.delete(key);
        this.missCount++;
        return null;
      }

      this.hitCount++;
      return entry;
    } catch (error) {
      this.missCount++;
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      writeFileSync(filePath, JSON.stringify(entry, null, 2), { mode: 0o600 });
      // Ensure the file has correct permissions (in case it already existed)
      chmodSync(filePath, 0o600);
    } catch (error) {
      console.warn(`Failed to write cache entry: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async clear(): Promise<void> {
    if (!existsSync(this.cacheDir)) return;

    const files = readdirSync(this.cacheDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          unlinkSync(join(this.cacheDir, file));
        } catch {
          // Ignore errors
        }
      }
    }

    this.hitCount = 0;
    this.missCount = 0;
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!existsSync(this.cacheDir)) return [];

    const keys: string[] = [];
    const files = readdirSync(this.cacheDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = readFileSync(join(this.cacheDir, file), 'utf8');
        const entry = JSON.parse(content) as CacheEntry;

        if (!pattern || entry.key.includes(pattern)) {
          keys.push(entry.key);
        }
      } catch {
        // Ignore corrupted cache files
      }
    }

    return keys;
  }

  async stats(): Promise<CacheStats> {
    const stats: CacheStats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount + this.missCount > 0
        ? this.hitCount / (this.hitCount + this.missCount)
        : 0,
      oldestEntry: null,
      newestEntry: null,
    };

    if (!existsSync(this.cacheDir)) return stats;

    const files = readdirSync(this.cacheDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = join(this.cacheDir, file);
        const fileStat = statSync(filePath);
        const content = readFileSync(filePath, 'utf8');
        const entry = JSON.parse(content) as CacheEntry;

        stats.totalEntries++;
        stats.totalSize += fileStat.size;

        if (stats.oldestEntry === null || entry.timestamp < stats.oldestEntry) {
          stats.oldestEntry = entry.timestamp;
        }
        if (stats.newestEntry === null || entry.timestamp > stats.newestEntry) {
          stats.newestEntry = entry.timestamp;
        }
      } catch {
        // Ignore corrupted cache files
      }
    }

    return stats;
  }
}

/**
 * In-memory cache storage (for CI/CD and testing)
 */
class MemoryCacheStorage implements CacheStorage {
  private cache: Map<string, CacheEntry> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    return keys.filter(key => key.includes(pattern));
  }

  async stats(): Promise<CacheStats> {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      const entrySize = JSON.stringify(entry).length;
      totalSize += entrySize;

      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (newestEntry === null || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount + this.missCount > 0
        ? this.hitCount / (this.hitCount + this.missCount)
        : 0,
      oldestEntry,
      newestEntry,
    };
  }

  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

/**
 * Main Cache Manager class
 */
export class CostCacheManager {
  private storage: CacheStorage;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    switch (this.config.type) {
      case 'memory':
        this.storage = new MemoryCacheStorage(this.config.maxEntries);
        break;
      case 'redis':
        // Redis support would require additional dependency
        // For now, fall back to file-based cache
        console.warn('Redis cache not yet implemented, using file-based cache');
        this.storage = new FileCacheStorage(this.config.cacheDir!);
        break;
      case 'file':
      default:
        this.storage = new FileCacheStorage(this.config.cacheDir!);
        break;
    }
  }

  /**
   * Generate a cache key from parameters
   */
  generateKey(params: {
    account: string;
    profile: string;
    region: string;
    dataType: string;
    provider?: string;
    dateRange?: { start: string; end: string };
  }): string {
    const parts = [
      this.config.prefix,
      params.provider || 'aws', // Default to 'aws' for backward compatibility
      params.account,
      params.profile,
      params.region,
      params.dataType,
    ];

    if (params.dateRange) {
      parts.push(params.dateRange.start, params.dateRange.end);
    }

    return parts.join(':');
  }

  /**
   * Get cached data
   */
  async get<T extends CacheableData>(key: string): Promise<T | null> {
    const entry = await this.storage.get<T>(key);
    return entry ? entry.data : null;
  }

  /**
   * Get cached data with metadata
   */
  async getEntry<T extends CacheableData>(key: string): Promise<CacheEntry<T> | null> {
    return this.storage.get<T>(key);
  }

  /**
   * Set cached data
   */
  async set<T extends CacheableData>(
    key: string,
    data: T,
    options: {
      account: string;
      profile: string;
      region: string;
      ttl?: number;
      metadata?: CacheEntry['metadata'];
    }
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.ttl,
      account: options.account,
      profile: options.profile,
      region: options.region,
      metadata: options.metadata,
    };

    await this.storage.set(key, entry);
  }

  /**
   * Check if data is cached and not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = await this.storage.get(key);
    return entry !== null;
  }

  /**
   * Invalidate a specific cache entry
   */
  async invalidate(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.storage.keys(pattern);
    let count = 0;

    for (const key of keys) {
      if (await this.storage.delete(key)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidate all cache entries for an account
   */
  async invalidateAccount(account: string): Promise<number> {
    return this.invalidatePattern(`:${account}:`);
  }

  /**
   * Invalidate all cache entries for a profile
   */
  async invalidateProfile(profile: string): Promise<number> {
    return this.invalidatePattern(`:${profile}:`);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return this.storage.stats();
  }

  /**
   * Get all cache keys
   */
  async getKeys(pattern?: string): Promise<string[]> {
    return this.storage.keys(pattern);
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Check if cache entry is stale (expired but still present)
   */
  async isStale(key: string): Promise<boolean> {
    const entry = await this.storage.get(key);
    if (!entry) return true;
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * Get time until cache entry expires (in milliseconds)
   */
  async getTimeToLive(key: string): Promise<number | null> {
    const entry = await this.storage.get(key);
    if (!entry) return null;

    const expiresAt = entry.timestamp + entry.ttl;
    const ttl = expiresAt - Date.now();
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Prune expired entries
   */
  async prune(): Promise<number> {
    const keys = await this.storage.keys();
    let pruned = 0;

    for (const key of keys) {
      if (await this.isStale(key)) {
        if (await this.storage.delete(key)) {
          pruned++;
        }
      }
    }

    return pruned;
  }
}

/**
 * Parse TTL string to milliseconds
 * Supports: 30s, 5m, 2h, 1d
 */
export function parseTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 4 hours if invalid
    return 4 * 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 4 * 60 * 60 * 1000;
  }
}

/**
 * Format TTL milliseconds to human-readable string
 */
export function formatTTL(ms: number): string {
  if (ms < 60 * 1000) {
    return `${Math.round(ms / 1000)}s`;
  } else if (ms < 60 * 60 * 1000) {
    return `${Math.round(ms / (60 * 1000))}m`;
  } else if (ms < 24 * 60 * 60 * 1000) {
    return `${Math.round(ms / (60 * 60 * 1000))}h`;
  } else {
    return `${Math.round(ms / (24 * 60 * 60 * 1000))}d`;
  }
}

/**
 * Format cache stats for display
 */
export function formatCacheStats(stats: CacheStats): string {
  const lines: string[] = [];

  lines.push('Cache Statistics');
  lines.push('─'.repeat(40));
  lines.push(`Total Entries: ${stats.totalEntries}`);
  lines.push(`Total Size: ${formatBytes(stats.totalSize)}`);
  lines.push(`Hit Count: ${stats.hitCount}`);
  lines.push(`Miss Count: ${stats.missCount}`);
  lines.push(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);

  if (stats.oldestEntry) {
    const oldestAge = Date.now() - stats.oldestEntry;
    lines.push(`Oldest Entry: ${formatTTL(oldestAge)} ago`);
  }

  if (stats.newestEntry) {
    const newestAge = Date.now() - stats.newestEntry;
    lines.push(`Newest Entry: ${formatTTL(newestAge)} ago`);
  }

  return lines.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Singleton instance for global cache
let globalCacheInstance: CostCacheManager | null = null;

/**
 * Get or create global cache instance
 */
export function getGlobalCache(config?: Partial<CacheConfig>): CostCacheManager {
  if (!globalCacheInstance || config) {
    globalCacheInstance = new CostCacheManager(config);
  }
  return globalCacheInstance;
}

/**
 * Reset global cache instance
 */
export function resetGlobalCache(): void {
  globalCacheInstance = null;
}

/**
 * Polling Cache Manager
 * Manages cached data for graceful degradation when polling fails
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  registrationId: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxEntries: number;
  enablePersistence: boolean;
  storageKey: string;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  totalHits: number;
  totalMisses: number;
}

class PollingCacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxEntries: 100,
      enablePersistence: true,
      storageKey: 'polling-cache',
      ...config
    };

    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Store data in cache
   */
  public set<T>(
    registrationId: string,
    data: T,
    ttl?: number,
    metadata?: Record<string, any>
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.config.defaultTTL));

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      registrationId,
      expiresAt,
      metadata
    };

    // Remove oldest entries if we exceed max
    while (this.cache.size >= this.config.maxEntries) {
      const oldestKey = this.getOldestEntryKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(registrationId, entry);

    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Get data from cache
   */
  public get<T>(registrationId: string): CacheEntry<T> | null {
    const entry = this.cache.get(registrationId) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(registrationId);
      this.stats.misses++;
      
      if (this.config.enablePersistence) {
        this.saveToStorage();
      }
      
      return null;
    }

    this.stats.hits++;
    return entry;
  }

  /**
   * Check if data exists and is not expired
   */
  public has(registrationId: string): boolean {
    return this.get(registrationId) !== null;
  }

  /**
   * Get cached data with age information
   */
  public getWithAge<T>(registrationId: string): {
    data: T;
    age: number;
    isStale: boolean;
    entry: CacheEntry<T>;
  } | null {
    const entry = this.get<T>(registrationId);
    
    if (!entry) {
      return null;
    }

    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    const isStale = age > (this.config.defaultTTL * 0.8); // Consider stale at 80% of TTL

    return {
      data: entry.data,
      age,
      isStale,
      entry
    };
  }

  /**
   * Remove specific entry from cache
   */
  public delete(registrationId: string): boolean {
    const deleted = this.cache.delete(registrationId);
    
    if (deleted && this.config.enablePersistence) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Get all cached entries for a registration
   */
  public getAll(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    
    const timestamps = entries.map(e => e.timestamp);
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined;

    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      oldestEntry,
      newestEntry,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses
    };
  }

  /**
   * Clean up expired entries
   */
  public cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0 && this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Update TTL for existing entry
   */
  public touch(registrationId: string, newTTL?: number): boolean {
    const entry = this.cache.get(registrationId);
    
    if (!entry) {
      return false;
    }

    const now = new Date();
    entry.expiresAt = new Date(now.getTime() + (newTTL || this.config.defaultTTL));

    if (this.config.enablePersistence) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Check if cached data is stale but still valid
   */
  public isStale(registrationId: string, staleThreshold = 0.8): boolean {
    const entry = this.cache.get(registrationId);
    
    if (!entry) {
      return false;
    }

    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    const maxAge = entry.expiresAt.getTime() - entry.timestamp.getTime();
    
    return age > (maxAge * staleThreshold);
  }

  /**
   * Get entries that are about to expire
   */
  public getExpiringEntries(withinMs = 60000): CacheEntry[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinMs);

    return Array.from(this.cache.values()).filter(
      entry => entry.expiresAt <= threshold && entry.expiresAt > now
    );
  }

  private getOldestEntryKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        entry: {
          ...entry,
          timestamp: entry.timestamp.toISOString(),
          expiresAt: entry.expiresAt.toISOString()
        }
      }));

      localStorage.setItem(this.config.storageKey, JSON.stringify({
        data: cacheData,
        stats: this.stats,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      
      if (parsed.data && Array.isArray(parsed.data)) {
        const now = new Date();
        
        parsed.data.forEach(({ key, entry }: any) => {
          const restoredEntry: CacheEntry = {
            ...entry,
            timestamp: new Date(entry.timestamp),
            expiresAt: new Date(entry.expiresAt)
          };

          // Only restore non-expired entries
          if (restoredEntry.expiresAt > now) {
            this.cache.set(key, restoredEntry);
          }
        });
      }

      if (parsed.stats) {
        this.stats = parsed.stats;
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Export cache data for debugging
   */
  public exportData(): {
    entries: Array<{ key: string; entry: CacheEntry }>;
    stats: typeof this.stats;
    config: CacheConfig;
  } {
    return {
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry })),
      stats: this.stats,
      config: this.config
    };
  }
}

// Export singleton instance
export const pollingCacheManager = new PollingCacheManager();

// Export class for testing
export { PollingCacheManager };
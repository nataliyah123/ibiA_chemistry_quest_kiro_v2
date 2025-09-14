/**
 * Tests for Polling Cache Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollingCacheManager } from '../pollingCacheManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  configurable: true
});

describe('PollingCacheManager', () => {
  let cacheManager: PollingCacheManager;

  beforeEach(() => {
    cacheManager = new PollingCacheManager({
      defaultTTL: 60000, // 1 minute
      maxEntries: 3,
      enablePersistence: false // Disable for most tests
    });
    vi.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'test' };
      
      cacheManager.set('test-key', testData);
      const retrieved = cacheManager.get('test-key');
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.data).toEqual(testData);
      expect(retrieved?.registrationId).toBe('test-key');
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cacheManager.set('test-key', 'data');
      
      expect(cacheManager.has('test-key')).toBe(true);
      expect(cacheManager.has('non-existent')).toBe(false);
    });

    it('should delete entries', () => {
      cacheManager.set('test-key', 'data');
      expect(cacheManager.has('test-key')).toBe(true);
      
      const deleted = cacheManager.delete('test-key');
      expect(deleted).toBe(true);
      expect(cacheManager.has('test-key')).toBe(false);
    });

    it('should clear all entries', () => {
      cacheManager.set('key1', 'data1');
      cacheManager.set('key2', 'data2');
      
      expect(cacheManager.getAll()).toHaveLength(2);
      
      cacheManager.clear();
      
      expect(cacheManager.getAll()).toHaveLength(0);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', () => {
      const shortTTL = 100; // 100ms
      cacheManager.set('test-key', 'data', shortTTL);
      
      // Should exist immediately
      expect(cacheManager.has('test-key')).toBe(true);
      
      // Should expire after TTL
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cacheManager.has('test-key')).toBe(false);
          resolve();
        }, 150);
      });
    });

    it('should use default TTL when not specified', () => {
      cacheManager.set('test-key', 'data');
      const entry = cacheManager.get('test-key');
      
      expect(entry).not.toBeNull();
      const expectedExpiry = new Date(entry!.timestamp.getTime() + 60000);
      expect(entry!.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
    });

    it('should remove expired entries on get', () => {
      const shortTTL = 50;
      cacheManager.set('test-key', 'data', shortTTL);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = cacheManager.get('test-key');
          expect(result).toBeNull();
          resolve();
        }, 100);
      });
    });

    it('should update TTL with touch', () => {
      const shortTTL = 100;
      cacheManager.set('test-key', 'data', shortTTL);
      
      // Touch to extend TTL
      const touched = cacheManager.touch('test-key', 60000);
      expect(touched).toBe(true);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should still exist after original TTL
          expect(cacheManager.has('test-key')).toBe(true);
          resolve();
        }, 150);
      });
    });
  });

  describe('Cache Size Management', () => {
    it('should limit entries to maxEntries', () => {
      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key-${i}`, `data-${i}`);
      }
      
      const entries = cacheManager.getAll();
      expect(entries).toHaveLength(3); // maxEntries = 3
      
      // Should keep the most recent entries
      const keys = entries.map(e => e.registrationId);
      expect(keys).toContain('key-2');
      expect(keys).toContain('key-3');
      expect(keys).toContain('key-4');
    });

    it('should remove oldest entries when limit exceeded', () => {
      cacheManager.set('old-key', 'old-data');
      
      // Wait a bit to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Add entries to exceed limit
          cacheManager.set('new-key-1', 'new-data-1');
          cacheManager.set('new-key-2', 'new-data-2');
          cacheManager.set('new-key-3', 'new-data-3');
          
          // Old entry should be removed
          expect(cacheManager.has('old-key')).toBe(false);
          expect(cacheManager.has('new-key-1')).toBe(true);
          expect(cacheManager.has('new-key-2')).toBe(true);
          expect(cacheManager.has('new-key-3')).toBe(true);
          
          resolve();
        }, 10);
      });
    });
  });

  describe('Cache Age and Staleness', () => {
    it('should provide data with age information', () => {
      cacheManager.set('test-key', 'data');
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = cacheManager.getWithAge('test-key');
          
          expect(result).not.toBeNull();
          expect(result!.data).toBe('data');
          expect(result!.age).toBeGreaterThan(0);
          expect(result!.age).toBeLessThan(100); // Should be small
          
          resolve();
        }, 10);
      });
    });

    it('should detect stale data', () => {
      const shortTTL = 1000; // 1 second
      cacheManager.set('test-key', 'data', shortTTL);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = cacheManager.getWithAge('test-key');
          expect(result?.isStale).toBe(true); // Should be stale at 80% of TTL
          
          resolve();
        }, 850); // 85% of TTL
      });
    });

    it('should check staleness with custom threshold', () => {
      cacheManager.set('test-key', 'data', 1000);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cacheManager.isStale('test-key', 0.4)).toBe(true); // 40% threshold
          expect(cacheManager.isStale('test-key', 0.9)).toBe(false); // 90% threshold
          
          resolve();
        }, 500); // 50% of TTL
      });
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit and miss rates', () => {
      cacheManager.set('key1', 'data1');
      
      // Hits
      cacheManager.get('key1');
      cacheManager.get('key1');
      
      // Misses
      cacheManager.get('non-existent-1');
      cacheManager.get('non-existent-2');
      
      const stats = cacheManager.getStats();
      
      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.missRate).toBe(0.5);
      expect(stats.totalEntries).toBe(1);
    });

    it('should provide oldest and newest entry timestamps', () => {
      cacheManager.set('old-key', 'old-data');
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          cacheManager.set('new-key', 'new-data');
          
          const stats = cacheManager.getStats();
          
          expect(stats.oldestEntry).toBeDefined();
          expect(stats.newestEntry).toBeDefined();
          expect(stats.newestEntry!.getTime()).toBeGreaterThan(stats.oldestEntry!.getTime());
          
          resolve();
        }, 10);
      });
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired entries', () => {
      const shortTTL = 50;
      cacheManager.set('expired-key', 'data', shortTTL);
      cacheManager.set('valid-key', 'data', 60000);
      
      expect(cacheManager.getAll()).toHaveLength(2);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          cacheManager.cleanup();
          
          const entries = cacheManager.getAll();
          expect(entries).toHaveLength(1);
          expect(entries[0].registrationId).toBe('valid-key');
          
          resolve();
        }, 100);
      });
    });

    it('should get expiring entries', () => {
      const shortTTL = 200;
      cacheManager.set('expiring-soon', 'data', shortTTL);
      cacheManager.set('expiring-later', 'data', 60000);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const expiring = cacheManager.getExpiringEntries(150); // Within 150ms
          
          expect(expiring).toHaveLength(1);
          expect(expiring[0].registrationId).toBe('expiring-soon');
          
          resolve();
        }, 100);
      });
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage when persistence enabled', () => {
      const persistentCache = new PollingCacheManager({
        enablePersistence: true,
        storageKey: 'test-cache'
      });
      
      persistentCache.set('test-key', 'test-data');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-cache',
        expect.stringContaining('test-key')
      );
    });

    it('should load from localStorage on initialization', () => {
      const cacheData = {
        data: [{
          key: 'restored-key',
          entry: {
            data: 'restored-data',
            timestamp: new Date().toISOString(),
            registrationId: 'restored-key',
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            metadata: {}
          }
        }],
        stats: { hits: 0, misses: 0 },
        savedAt: new Date().toISOString()
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cacheData));
      
      const persistentCache = new PollingCacheManager({
        enablePersistence: true,
        storageKey: 'test-cache'
      });
      
      expect(persistentCache.has('restored-key')).toBe(true);
      expect(persistentCache.get('restored-key')?.data).toBe('restored-data');
    });
  });

  describe('Metadata Support', () => {
    it('should store and retrieve metadata', () => {
      const metadata = { source: 'api', version: 1 };
      
      cacheManager.set('test-key', 'data', undefined, metadata);
      const entry = cacheManager.get('test-key');
      
      expect(entry?.metadata).toEqual(metadata);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      cacheManager.updateConfig({ defaultTTL: 120000 });
      
      cacheManager.set('test-key', 'data');
      const entry = cacheManager.get('test-key');
      
      // Should use new TTL
      const expectedExpiry = new Date(entry!.timestamp.getTime() + 120000);
      expect(entry!.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
    });
  });

  describe('Data Export', () => {
    it('should export cache data for debugging', () => {
      cacheManager.set('key1', 'data1');
      cacheManager.set('key2', 'data2');
      
      const exported = cacheManager.exportData();
      
      expect(exported.entries).toHaveLength(2);
      expect(exported.stats).toBeDefined();
      expect(exported.config).toBeDefined();
      
      const keys = exported.entries.map(e => e.key);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });
});
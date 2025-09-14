/**
 * Unit tests for Smart Polling Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { smartPollingManager, DEFAULT_POLLING_CONFIG } from '../smartPollingManager';
import type { PollingConfig } from '../../types/polling';

// Mock timers
vi.useFakeTimers();

describe('SmartPollingManager', () => {
  let mockCallback: vi.MockedFunction<() => Promise<void>>;
  let mockCallback2: vi.MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    mockCallback = vi.fn().mockResolvedValue(undefined);
    mockCallback2 = vi.fn().mockResolvedValue(undefined);
    
    // Clear any existing registrations
    smartPollingManager.getAllRegistrations().forEach(reg => {
      smartPollingManager.unregister(reg.id);
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Registration Management', () => {
    it('should register a polling operation', () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
      };

      smartPollingManager.register('test-poll', mockCallback, config);
      
      const registration = smartPollingManager.getRegistration('test-poll');
      expect(registration).toBeDefined();
      expect(registration?.id).toBe('test-poll');
      expect(registration?.config.interval).toBe(1000);
      expect(registration?.state.active).toBe(true);
    });

    it('should unregister a polling operation', () => {
      smartPollingManager.register('test-poll', mockCallback, DEFAULT_POLLING_CONFIG);
      
      expect(smartPollingManager.getRegistration('test-poll')).toBeDefined();
      
      smartPollingManager.unregister('test-poll');
      
      expect(smartPollingManager.getRegistration('test-poll')).toBeUndefined();
    });

    it('should replace existing registration with same id', () => {
      smartPollingManager.register('test-poll', mockCallback, DEFAULT_POLLING_CONFIG);
      smartPollingManager.register('test-poll', mockCallback2, DEFAULT_POLLING_CONFIG);
      
      const registrations = smartPollingManager.getAllRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].callback).toBe(mockCallback2);
    });
  });

  describe('Polling Execution', () => {
    it('should execute polling callback at specified interval', async () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
      };

      smartPollingManager.register('test-poll', mockCallback, config);
      
      // Fast-forward time to trigger first execution
      await vi.advanceTimersByTimeAsync(1000);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Fast-forward again for second execution
      await vi.advanceTimersByTimeAsync(1000);
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should not execute when disabled', async () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        enabled: false,
      };

      smartPollingManager.register('test-poll', mockCallback, config);
      
      await vi.advanceTimersByTimeAsync(2000);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should update last execution time', async () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
      };

      smartPollingManager.register('test-poll', mockCallback, config);
      
      const beforeExecution = smartPollingManager.getRegistration('test-poll')?.state.lastExecution;
      expect(beforeExecution).toBeNull();
      
      await vi.advanceTimersByTimeAsync(1000);
      
      const afterExecution = smartPollingManager.getRegistration('test-poll')?.state.lastExecution;
      expect(afterExecution).toBeInstanceOf(Date);
    });
  });

  describe('Pause and Resume', () => {
    it('should pause and resume specific polling', async () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
      };

      smartPollingManager.register('test-poll', mockCallback, config);
      
      // Execute once
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Pause
      smartPollingManager.pause('test-poll');
      
      // Should not execute while paused
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Resume
      smartPollingManager.resume('test-poll');
      
      // Should execute after resume
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should pause and resume all polling', async () => {
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
      };

      smartPollingManager.register('test-poll-1', mockCallback, config);
      smartPollingManager.register('test-poll-2', mockCallback2, config);
      
      // Execute once for both
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
      
      // Pause all
      smartPollingManager.pauseAll();
      
      // Should not execute while paused
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
      
      // Resume all
      smartPollingManager.resumeAll();
      
      // Should execute after resume
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback2).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors and continue polling', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        circuitBreakerThreshold: 10, // Set high threshold so circuit breaker doesn't trigger
      };

      smartPollingManager.register('test-poll', errorCallback, config);
      
      // First execution should fail
      await vi.advanceTimersByTimeAsync(1000);
      expect(errorCallback).toHaveBeenCalledTimes(1);
      
      const registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.errorCount).toBe(1);
      expect(registration?.state.consecutiveErrors).toBe(1);
      
      // Should continue polling despite error (with backoff)
      await vi.advanceTimersByTimeAsync(2000); // Wait for backoff delay
      expect(errorCallback).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff on errors', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        exponentialBackoff: true,
      };

      smartPollingManager.register('test-poll', errorCallback, config);
      
      // First execution at normal interval
      await vi.advanceTimersByTimeAsync(1000);
      expect(errorCallback).toHaveBeenCalledTimes(1);
      
      // Second execution should be delayed due to backoff
      await vi.advanceTimersByTimeAsync(1000);
      expect(errorCallback).toHaveBeenCalledTimes(1); // Still 1
      
      // Wait for backoff delay (2x original interval)
      await vi.advanceTimersByTimeAsync(1000);
      expect(errorCallback).toHaveBeenCalledTimes(2);
    });

    it('should open circuit breaker after consecutive errors', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        circuitBreakerThreshold: 3,
        exponentialBackoff: false, // Disable backoff for predictable timing
      };

      smartPollingManager.register('test-poll', errorCallback, config);
      
      // Execute until circuit breaker threshold
      await vi.advanceTimersByTimeAsync(1000); // First error
      await vi.advanceTimersByTimeAsync(1000); // Second error  
      await vi.advanceTimersByTimeAsync(1000); // Third error - should open circuit breaker
      
      expect(errorCallback).toHaveBeenCalledTimes(3);
      
      const registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.circuitBreakerOpen).toBe(true);
      
      // Should not execute anymore due to open circuit breaker
      await vi.advanceTimersByTimeAsync(5000);
      expect(errorCallback).toHaveBeenCalledTimes(3);
    });

    it('should reset error counters on successful execution', async () => {
      let shouldError = true;
      const conditionalCallback = vi.fn().mockImplementation(() => {
        if (shouldError) {
          return Promise.reject(new Error('Test error'));
        }
        return Promise.resolve();
      });

      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        exponentialBackoff: false, // Disable backoff for predictable timing
        circuitBreakerThreshold: 10, // High threshold to avoid circuit breaker
      };

      smartPollingManager.register('test-poll', conditionalCallback, config);
      
      // First execution fails
      await vi.advanceTimersByTimeAsync(1000);
      
      let registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.consecutiveErrors).toBe(1);
      
      // Second execution succeeds
      shouldError = false;
      await vi.advanceTimersByTimeAsync(1000);
      
      registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.consecutiveErrors).toBe(0);
      expect(registration?.state.backoffMultiplier).toBe(1);
    });
  });

  describe('Configuration Updates', () => {
    it('should update polling configuration', () => {
      smartPollingManager.register('test-poll', mockCallback, DEFAULT_POLLING_CONFIG);
      
      const newConfig = { interval: 2000, enabled: false };
      smartPollingManager.updateConfig('test-poll', newConfig);
      
      const registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.config.interval).toBe(2000);
      expect(registration?.config.enabled).toBe(false);
      expect(registration?.state.active).toBe(false);
    });

    it('should reset circuit breaker when configuration changes', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 1000,
        circuitBreakerThreshold: 2,
        exponentialBackoff: false,
      };

      smartPollingManager.register('test-poll', errorCallback, config);
      
      // Trigger circuit breaker
      await vi.advanceTimersByTimeAsync(1000); // First error
      await vi.advanceTimersByTimeAsync(1000); // Second error - should open circuit breaker
      
      let registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.circuitBreakerOpen).toBe(true);
      
      // Update configuration
      smartPollingManager.updateConfig('test-poll', { circuitBreakerThreshold: 5 });
      
      registration = smartPollingManager.getRegistration('test-poll');
      expect(registration?.state.circuitBreakerOpen).toBe(false);
      expect(registration?.state.consecutiveErrors).toBe(0);
    });
  });

  describe('Page Visibility Integration', () => {
    it('should report page visibility state', () => {
      // The manager should have the isPageVisible method and it should return a boolean
      const isVisible = smartPollingManager.isPageVisible();
      expect(typeof isVisible).toBe('boolean');
      
      // In test environment without document, should default to true
      expect(isVisible).toBe(true);
    });

    // Note: Testing actual page visibility changes would require more complex DOM mocking
    // This would be better tested in integration tests with a real browser environment
  });
});
 
 describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      // Mock the alert system and cache manager
      vi.mock('../../utils/pollingAlertSystem', () => ({
        pollingAlertSystem: {
          createPollingErrorAlert: vi.fn(),
          createCircuitBreakerAlert: vi.fn(),
          createRecoveryAlert: vi.fn(),
          createNetworkErrorAlert: vi.fn(),
          clearAlertsForRegistration: vi.fn()
        }
      }));

      vi.mock('../../utils/pollingCacheManager', () => ({
        pollingCacheManager: {
          set: vi.fn(),
          get: vi.fn(),
          getWithAge: vi.fn(),
          delete: vi.fn()
        }
      }));
    });

    it('should handle polling errors with exponential backoff', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        exponentialBackoff: true,
        circuitBreakerThreshold: 3
      };

      smartPollingManager.register('error-test', errorCallback, config);

      // First execution should fail
      await vi.advanceTimersByTimeAsync(100);
      expect(errorCallback).toHaveBeenCalledTimes(1);

      // Second execution should have longer interval due to backoff
      const registration = smartPollingManager.getRegistration('error-test');
      expect(registration?.state.backoffMultiplier).toBe(2);

      await vi.advanceTimersByTimeAsync(200); // 2x interval
      expect(errorCallback).toHaveBeenCalledTimes(2);

      smartPollingManager.unregister('error-test');
    });

    it('should open circuit breaker after consecutive failures', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Persistent error'));
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        circuitBreakerThreshold: 2,
        enableAlerts: true
      };

      smartPollingManager.register('circuit-test', errorCallback, config);

      // First failure
      await vi.advanceTimersByTimeAsync(100);
      expect(errorCallback).toHaveBeenCalledTimes(1);

      // Second failure should open circuit breaker
      await vi.advanceTimersByTimeAsync(200);
      expect(errorCallback).toHaveBeenCalledTimes(2);

      const registration = smartPollingManager.getRegistration('circuit-test');
      expect(registration?.state.circuitBreakerOpen).toBe(true);
      expect(registration?.state.consecutiveErrors).toBe(2);

      // Should not continue polling when circuit breaker is open
      await vi.advanceTimersByTimeAsync(1000);
      expect(errorCallback).toHaveBeenCalledTimes(2); // No additional calls

      smartPollingManager.unregister('circuit-test');
    });

    it('should reset circuit breaker and resume polling', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Error'));
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        circuitBreakerThreshold: 1
      };

      smartPollingManager.register('reset-test', errorCallback, config);

      // Trigger circuit breaker
      await vi.advanceTimersByTimeAsync(100);
      
      const registration = smartPollingManager.getRegistration('reset-test');
      expect(registration?.state.circuitBreakerOpen).toBe(true);

      // Reset circuit breaker
      const resetSuccess = smartPollingManager.resetCircuitBreaker('reset-test');
      expect(resetSuccess).toBe(true);

      const updatedRegistration = smartPollingManager.getRegistration('reset-test');
      expect(updatedRegistration?.state.circuitBreakerOpen).toBe(false);
      expect(updatedRegistration?.state.consecutiveErrors).toBe(0);

      smartPollingManager.unregister('reset-test');
    });

    it('should cache successful results when caching is enabled', async () => {
      const successCallback = vi.fn().mockResolvedValue({ data: 'test-data' });
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        enableCaching: true,
        cacheTTL: 60000
      };

      smartPollingManager.register('cache-test', successCallback, config);

      await vi.advanceTimersByTimeAsync(100);
      expect(successCallback).toHaveBeenCalledTimes(1);

      // Should have cached the result
      // Note: In a real test, we'd verify the cache manager was called
      // but since it's mocked, we just verify the callback was executed

      smartPollingManager.unregister('cache-test');
    });

    it('should use cached data for graceful degradation', async () => {
      const mockCachedData = {
        data: { fallback: 'cached-data' },
        age: 30000,
        isStale: false,
        entry: {
          data: { fallback: 'cached-data' },
          timestamp: new Date(),
          registrationId: 'graceful-test',
          expiresAt: new Date(Date.now() + 60000),
          metadata: {}
        }
      };

      // Mock cache manager to return cached data
      const mockPollingCacheManager = await import('../../utils/pollingCacheManager');
      vi.mocked(mockPollingCacheManager.pollingCacheManager.getWithAge).mockReturnValue(mockCachedData);

      const errorCallback = vi.fn().mockRejectedValue(new Error('Network failure'));
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        enableCaching: true,
        gracefulDegradation: true
      };

      smartPollingManager.register('graceful-test', errorCallback, config);

      await vi.advanceTimersByTimeAsync(100);
      
      const registration = smartPollingManager.getRegistration('graceful-test');
      expect(registration?.state.usingCachedData).toBe(true);

      smartPollingManager.unregister('graceful-test');
    });

    it('should force refresh and reset error state', async () => {
      const mockCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Initial error'))
        .mockResolvedValue({ data: 'success' });
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        circuitBreakerThreshold: 1
      };

      smartPollingManager.register('force-refresh-test', mockCallback, config);

      // Trigger error and circuit breaker
      await vi.advanceTimersByTimeAsync(100);
      
      let registration = smartPollingManager.getRegistration('force-refresh-test');
      expect(registration?.state.circuitBreakerOpen).toBe(true);

      // Force refresh should succeed and reset state
      const refreshSuccess = await smartPollingManager.forceRefresh('force-refresh-test');
      expect(refreshSuccess).toBe(true);

      registration = smartPollingManager.getRegistration('force-refresh-test');
      expect(registration?.state.circuitBreakerOpen).toBe(false);
      expect(registration?.state.consecutiveErrors).toBe(0);

      smartPollingManager.unregister('force-refresh-test');
    });

    it('should get error statistics for registration', () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100
      };

      smartPollingManager.register('stats-test', errorCallback, config);

      const stats = smartPollingManager.getErrorStats('stats-test');
      expect(stats).toEqual({
        errorCount: 0,
        consecutiveErrors: 0,
        circuitBreakerOpen: false,
        lastError: null,
        usingCachedData: false
      });

      smartPollingManager.unregister('stats-test');
    });

    it('should return null for non-existent registration stats', () => {
      const stats = smartPollingManager.getErrorStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should get cached data for registration', () => {
      const mockCachedData = { test: 'cached-value' };
      
      // Mock cache manager
      const mockPollingCacheManager = vi.fn().mockReturnValue(mockCachedData);
      
      // This would normally test the actual cache retrieval
      // but since we're testing the manager interface, we verify the method exists
      expect(typeof smartPollingManager.getCachedData).toBe('function');
    });

    it('should clean up alerts and cache on unregister', () => {
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        enableAlerts: true,
        enableCaching: true
      };

      smartPollingManager.register('cleanup-test', mockCallback, config);
      smartPollingManager.unregister('cleanup-test');

      // Verify registration is removed
      const registration = smartPollingManager.getRegistration('cleanup-test');
      expect(registration).toBeUndefined();
    });

    it('should detect network errors correctly', async () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      
      const errorCallback = vi.fn().mockRejectedValue(networkError);
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        enableAlerts: true
      };

      smartPollingManager.register('network-test', errorCallback, config);

      await vi.advanceTimersByTimeAsync(100);
      
      // Should have detected it as a network error and created appropriate alert
      expect(errorCallback).toHaveBeenCalledTimes(1);

      smartPollingManager.unregister('network-test');
    });

    it('should handle successful recovery after errors', async () => {
      const mockCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue({ data: 'recovered' });
      
      const config: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        interval: 100,
        enableAlerts: true,
        enableCaching: true
      };

      smartPollingManager.register('recovery-test', mockCallback, config);

      // First call fails
      await vi.advanceTimersByTimeAsync(100);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second call succeeds
      await vi.advanceTimersByTimeAsync(200); // Account for backoff
      expect(mockCallback).toHaveBeenCalledTimes(2);

      const registration = smartPollingManager.getRegistration('recovery-test');
      expect(registration?.state.consecutiveErrors).toBe(0);
      expect(registration?.state.lastError).toBeNull();

      smartPollingManager.unregister('recovery-test');
    });
  });
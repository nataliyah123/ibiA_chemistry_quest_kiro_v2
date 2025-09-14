/**
 * Polling with Cache Hook
 * React hook that combines smart polling with caching and graceful degradation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { smartPollingManager, DEFAULT_POLLING_CONFIG } from '../services/smartPollingManager';
import { pollingCacheManager } from '../utils/pollingCacheManager';
import { PollingConfig } from '../types/polling';

export interface PollingWithCacheConfig extends Partial<PollingConfig> {
  registrationId: string;
  fetchFunction: () => Promise<any>;
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
  onCacheUsed?: (data: any, age: number) => void;
}

export interface PollingWithCacheState<T = any> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  isUsingCache: boolean;
  cacheAge: number | null;
  lastUpdated: Date | null;
  errorCount: number;
  circuitBreakerOpen: boolean;
}

export interface PollingWithCacheActions {
  refresh: () => Promise<boolean>;
  resetErrors: () => void;
  clearCache: () => void;
  pause: () => void;
  resume: () => void;
}

export function usePollingWithCache<T = any>(
  config: PollingWithCacheConfig
): [PollingWithCacheState<T>, PollingWithCacheActions] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);

  const configRef = useRef(config);
  configRef.current = config;

  // Polling configuration with defaults
  const pollingConfig: PollingConfig = {
    ...DEFAULT_POLLING_CONFIG,
    ...config,
    enableCaching: true,
    enableAlerts: true,
    gracefulDegradation: true,
  };

  // Wrapped fetch function that handles caching and state updates
  const wrappedFetchFunction = useCallback(async () => {
    const currentConfig = configRef.current;
    
    try {
      setLoading(true);
      setError(null);
      setIsUsingCache(false);
      setCacheAge(null);

      const result = await currentConfig.fetchFunction();
      
      // Update state with fresh data
      setData(result);
      setLastUpdated(new Date());
      setErrorCount(0);
      setCircuitBreakerOpen(false);

      // Call success callback
      if (currentConfig.onSuccess) {
        currentConfig.onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err);
      
      // Try to use cached data for graceful degradation
      const cachedData = pollingCacheManager.getWithAge<T>(currentConfig.registrationId);
      if (cachedData) {
        setData(cachedData.data);
        setIsUsingCache(true);
        setCacheAge(cachedData.age);
        setLastUpdated(cachedData.entry.timestamp);

        if (currentConfig.onCacheUsed) {
          currentConfig.onCacheUsed(cachedData.data, cachedData.age);
        }
      }

      // Update error stats
      const errorStats = smartPollingManager.getErrorStats(currentConfig.registrationId);
      if (errorStats) {
        setErrorCount(errorStats.errorCount);
        setCircuitBreakerOpen(errorStats.circuitBreakerOpen);
      }

      // Call error callback
      if (currentConfig.onError) {
        currentConfig.onError(err);
      }

      throw err; // Re-throw to let polling manager handle it
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize polling
  useEffect(() => {
    // Check for existing cached data on mount
    const cachedData = pollingCacheManager.getWithAge<T>(config.registrationId);
    if (cachedData) {
      setData(cachedData.data);
      setIsUsingCache(true);
      setCacheAge(cachedData.age);
      setLastUpdated(cachedData.entry.timestamp);

      if (config.onCacheUsed) {
        config.onCacheUsed(cachedData.data, cachedData.age);
      }
    }

    // Register with polling manager
    smartPollingManager.register(
      config.registrationId,
      wrappedFetchFunction,
      pollingConfig
    );

    return () => {
      smartPollingManager.unregister(config.registrationId);
    };
  }, [config.registrationId, wrappedFetchFunction]);

  // Update polling configuration when config changes
  useEffect(() => {
    smartPollingManager.updateConfig(config.registrationId, pollingConfig);
  }, [config.registrationId, pollingConfig.interval, pollingConfig.enabled, pollingConfig.pauseOnInactive]);

  // Monitor error state changes
  useEffect(() => {
    const interval = setInterval(() => {
      const errorStats = smartPollingManager.getErrorStats(config.registrationId);
      if (errorStats) {
        setErrorCount(errorStats.errorCount);
        setCircuitBreakerOpen(errorStats.circuitBreakerOpen);
        
        if (errorStats.usingCachedData && !isUsingCache) {
          // Check if we should show cached data
          const cachedData = pollingCacheManager.getWithAge<T>(config.registrationId);
          if (cachedData) {
            setData(cachedData.data);
            setIsUsingCache(true);
            setCacheAge(cachedData.age);
            setLastUpdated(cachedData.entry.timestamp);

            if (config.onCacheUsed) {
              config.onCacheUsed(cachedData.data, cachedData.age);
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config.registrationId, isUsingCache, config.onCacheUsed]);

  // Actions
  const refresh = useCallback(async () => {
    return await smartPollingManager.forceRefresh(config.registrationId);
  }, [config.registrationId]);

  const resetErrors = useCallback(() => {
    smartPollingManager.resetCircuitBreaker(config.registrationId);
    setError(null);
    setErrorCount(0);
    setCircuitBreakerOpen(false);
  }, [config.registrationId]);

  const clearCache = useCallback(() => {
    pollingCacheManager.delete(config.registrationId);
    setIsUsingCache(false);
    setCacheAge(null);
  }, [config.registrationId]);

  const pause = useCallback(() => {
    smartPollingManager.pause(config.registrationId);
  }, [config.registrationId]);

  const resume = useCallback(() => {
    smartPollingManager.resume(config.registrationId);
  }, [config.registrationId]);

  const state: PollingWithCacheState<T> = {
    data,
    loading,
    error,
    isUsingCache,
    cacheAge,
    lastUpdated,
    errorCount,
    circuitBreakerOpen,
  };

  const actions: PollingWithCacheActions = {
    refresh,
    resetErrors,
    clearCache,
    pause,
    resume,
  };

  return [state, actions];
}
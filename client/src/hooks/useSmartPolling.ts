/**
 * React Hook for Smart Polling Manager Integration
 * Provides easy-to-use React integration with the Smart Polling Manager service
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { smartPollingManager, DEFAULT_POLLING_CONFIG } from '../services/smartPollingManager';
import type { PollingConfig, PollingRegistration } from '../types/polling';

export interface UseSmartPollingOptions extends Partial<PollingConfig> {
  id: string;
  enabled?: boolean;
  dependencies?: React.DependencyList;
}

export interface UseSmartPollingReturn {
  isActive: boolean;
  isPaused: boolean;
  errorCount: number;
  consecutiveErrors: number;
  circuitBreakerOpen: boolean;
  lastExecution: Date | null;
  nextExecution: Date | null;
  pause: () => void;
  resume: () => void;
  updateConfig: (config: Partial<PollingConfig>) => void;
  executeNow: () => Promise<void>;
}

/**
 * Hook for integrating with Smart Polling Manager
 */
export function useSmartPolling(
  callback: () => Promise<void>,
  options: UseSmartPollingOptions
): UseSmartPollingReturn {
  const {
    id,
    enabled = true,
    dependencies = [],
    ...configOptions
  } = options;

  const callbackRef = useRef(callback);
  const [registration, setRegistration] = useState<PollingRegistration | undefined>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create stable callback that uses the ref
  const stableCallback = useCallback(async () => {
    return callbackRef.current();
  }, []);

  // Register/unregister polling
  useEffect(() => {
    if (!enabled) {
      smartPollingManager.unregister(id);
      setRegistration(undefined);
      return;
    }

    const config: PollingConfig = {
      ...DEFAULT_POLLING_CONFIG,
      ...configOptions,
      enabled,
    };

    smartPollingManager.register(id, stableCallback, config);
    
    // Update local registration state
    const updateRegistration = () => {
      setRegistration(smartPollingManager.getRegistration(id));
    };
    
    updateRegistration();
    
    // Set up periodic updates to track registration state
    const updateInterval = setInterval(updateRegistration, 1000);

    return () => {
      clearInterval(updateInterval);
      smartPollingManager.unregister(id);
      setRegistration(undefined);
    };
  }, [id, enabled, stableCallback, ...dependencies]);

  // Update configuration when options change
  useEffect(() => {
    if (enabled && registration) {
      const newConfig: Partial<PollingConfig> = {
        ...configOptions,
        enabled,
      };
      
      smartPollingManager.updateConfig(id, newConfig);
    }
  }, [id, enabled, registration, ...Object.values(configOptions)]);

  const pause = useCallback(() => {
    smartPollingManager.pause(id);
  }, [id]);

  const resume = useCallback(() => {
    smartPollingManager.resume(id);
  }, [id]);

  const updateConfig = useCallback((config: Partial<PollingConfig>) => {
    smartPollingManager.updateConfig(id, config);
  }, [id]);

  const executeNow = useCallback(async () => {
    return callbackRef.current();
  }, []);

  return {
    isActive: registration?.state.active ?? false,
    isPaused: registration?.state.paused ?? false,
    errorCount: registration?.state.errorCount ?? 0,
    consecutiveErrors: registration?.state.consecutiveErrors ?? 0,
    circuitBreakerOpen: registration?.state.circuitBreakerOpen ?? false,
    lastExecution: registration?.state.lastExecution ?? null,
    nextExecution: registration?.state.nextExecution ?? null,
    pause,
    resume,
    updateConfig,
    executeNow,
  };
}

/**
 * Hook for managing multiple polling operations
 */
export function useMultiplePolling(
  pollingConfigs: Array<{
    id: string;
    callback: () => Promise<void>;
    config: Partial<PollingConfig>;
  }>
): {
  pauseAll: () => void;
  resumeAll: () => void;
  getRegistration: (id: string) => PollingRegistration | undefined;
  getAllRegistrations: () => PollingRegistration[];
} {
  useEffect(() => {
    // Register all polling operations
    pollingConfigs.forEach(({ id, callback, config }) => {
      const fullConfig: PollingConfig = {
        ...DEFAULT_POLLING_CONFIG,
        ...config,
      };
      smartPollingManager.register(id, callback, fullConfig);
    });

    return () => {
      // Unregister all polling operations
      pollingConfigs.forEach(({ id }) => {
        smartPollingManager.unregister(id);
      });
    };
  }, [pollingConfigs]);

  const pauseAll = useCallback(() => {
    smartPollingManager.pauseAll();
  }, []);

  const resumeAll = useCallback(() => {
    smartPollingManager.resumeAll();
  }, []);

  const getRegistration = useCallback((id: string) => {
    return smartPollingManager.getRegistration(id);
  }, []);

  const getAllRegistrations = useCallback(() => {
    return smartPollingManager.getAllRegistrations();
  }, []);

  return {
    pauseAll,
    resumeAll,
    getRegistration,
    getAllRegistrations,
  };
}

/**
 * Hook for monitoring page visibility and polling state
 */
export function usePageVisibilityPolling(): {
  isPageVisible: boolean;
  activePollingCount: number;
  pausedPollingCount: number;
} {
  const [isPageVisible, setIsPageVisible] = useState(smartPollingManager.isPageVisible());
  const [activePollingCount, setActivePollingCount] = useState(0);
  const [pausedPollingCount, setPausedPollingCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      const registrations = smartPollingManager.getAllRegistrations();
      const active = registrations.filter(r => r.state.active && !r.state.paused).length;
      const paused = registrations.filter(r => r.state.paused).length;
      
      setActivePollingCount(active);
      setPausedPollingCount(paused);
      setIsPageVisible(smartPollingManager.isPageVisible());
    };

    // Update counts periodically
    const interval = setInterval(updateCounts, 1000);
    updateCounts(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return {
    isPageVisible,
    activePollingCount,
    pausedPollingCount,
  };
}
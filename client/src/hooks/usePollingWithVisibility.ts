/**
 * usePollingWithVisibility Hook
 * Integrates Page Visibility API with Smart Polling Manager
 * Automatically pauses/resumes polling based on tab visibility and user activity
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePageVisibility, UsePageVisibilityOptions } from './usePageVisibility';
import { smartPollingManager, PollingConfig } from '../services/smartPollingManager';

export interface UsePollingWithVisibilityOptions extends UsePageVisibilityOptions {
  /**
   * Polling configuration
   */
  pollingConfig?: Partial<PollingConfig>;
  
  /**
   * Whether to use reduced polling frequency for background tabs
   * @default true
   */
  useReducedBackgroundPolling?: boolean;
  
  /**
   * Multiplier for background polling frequency (e.g., 2 = half frequency)
   * @default 3
   */
  backgroundPollingMultiplier?: number;
  
  /**
   * Whether to automatically pause polling when user is inactive
   * @default true
   */
  pauseOnUserInactive?: boolean;
}

export interface UsePollingWithVisibilityReturn {
  /**
   * Register a polling operation with visibility integration
   */
  registerPolling: (id: string, callback: () => Promise<void>, config?: Partial<PollingConfig>) => void;
  
  /**
   * Unregister a polling operation
   */
  unregisterPolling: (id: string) => void;
  
  /**
   * Pause all registered polling operations
   */
  pauseAllPolling: () => void;
  
  /**
   * Resume all registered polling operations
   */
  resumeAllPolling: () => void;
  
  /**
   * Check if page is visible
   */
  isPageVisible: boolean;
  
  /**
   * Check if user is active
   */
  isUserActive: boolean;
  
  /**
   * Get current polling state for debugging
   */
  getPollingState: () => {
    registeredPollingIds: string[];
    pageVisible: boolean;
    userActive: boolean;
    backgroundPollingActive: boolean;
  };
}

/**
 * Hook that combines Page Visibility API with Smart Polling Manager
 */
export function usePollingWithVisibility(
  options: UsePollingWithVisibilityOptions = {}
): UsePollingWithVisibilityReturn {
  const {
    pollingConfig = {},
    useReducedBackgroundPolling = true,
    backgroundPollingMultiplier = 3,
    pauseOnUserInactive = true,
    ...visibilityOptions
  } = options;

  const registeredPollingIds = useRef<Set<string>>(new Set());
  const originalConfigs = useRef<Map<string, PollingConfig>>(new Map());
  const backgroundPollingActive = useRef<boolean>(false);

  // Use page visibility hook with integrated callbacks
  const pageVisibility = usePageVisibility({
    ...visibilityOptions,
    onVisibilityChange: useCallback((isVisible: boolean) => {
      handleVisibilityChange(isVisible);
      // Call original callback if provided
      if (visibilityOptions.onVisibilityChange) {
        visibilityOptions.onVisibilityChange(isVisible);
      }
    }, [visibilityOptions.onVisibilityChange]),
    
    onActivityChange: useCallback((isActive: boolean) => {
      handleActivityChange(isActive);
      // Call original callback if provided
      if (visibilityOptions.onActivityChange) {
        visibilityOptions.onActivityChange(isActive);
      }
    }, [visibilityOptions.onActivityChange]),
  });

  /**
   * Handle page visibility changes
   */
  const handleVisibilityChange = useCallback((isVisible: boolean) => {
    if (isVisible) {
      // Page became visible - resume normal polling
      resumeNormalPolling();
    } else {
      // Page became hidden - switch to background polling or pause
      if (useReducedBackgroundPolling) {
        switchToBackgroundPolling();
      } else {
        pauseVisibilityBasedPolling();
      }
    }
  }, [useReducedBackgroundPolling, backgroundPollingMultiplier]);

  /**
   * Handle user activity changes
   */
  const handleActivityChange = useCallback((isActive: boolean) => {
    if (!pauseOnUserInactive) return;

    if (isActive && pageVisibility.isVisible) {
      // User became active and page is visible - resume normal polling
      resumeNormalPolling();
    } else if (!isActive) {
      // User became inactive - pause or reduce polling
      if (useReducedBackgroundPolling && pageVisibility.isVisible) {
        switchToBackgroundPolling();
      } else {
        pauseVisibilityBasedPolling();
      }
    }
  }, [pauseOnUserInactive, useReducedBackgroundPolling, pageVisibility.isVisible]);

  /**
   * Resume normal polling frequency
   */
  const resumeNormalPolling = useCallback(() => {
    if (backgroundPollingActive.current) {
      // Restore original configurations
      registeredPollingIds.current.forEach(id => {
        const originalConfig = originalConfigs.current.get(id);
        if (originalConfig) {
          smartPollingManager.updateConfig(id, originalConfig);
        }
      });
      backgroundPollingActive.current = false;
    }

    // Resume all registered polling
    registeredPollingIds.current.forEach(id => {
      smartPollingManager.resume(id);
    });
  }, []);

  /**
   * Switch to background polling with reduced frequency
   */
  const switchToBackgroundPolling = useCallback(() => {
    if (!backgroundPollingActive.current) {
      // Store original configurations and apply background multiplier
      registeredPollingIds.current.forEach(id => {
        const registration = smartPollingManager.getRegistration(id);
        if (registration) {
          // Store original config if not already stored
          if (!originalConfigs.current.has(id)) {
            originalConfigs.current.set(id, { ...registration.config });
          }

          // Apply background polling multiplier
          const backgroundConfig = {
            ...registration.config,
            interval: registration.config.interval * backgroundPollingMultiplier,
          };
          
          smartPollingManager.updateConfig(id, backgroundConfig);
        }
      });
      backgroundPollingActive.current = true;
    }
  }, [backgroundPollingMultiplier]);

  /**
   * Pause polling based on visibility/activity
   */
  const pauseVisibilityBasedPolling = useCallback(() => {
    registeredPollingIds.current.forEach(id => {
      const registration = smartPollingManager.getRegistration(id);
      if (registration && registration.config.pauseOnInactive) {
        smartPollingManager.pause(id);
      }
    });
  }, []);

  /**
   * Register a polling operation with visibility integration
   */
  const registerPolling = useCallback((
    id: string,
    callback: () => Promise<void>,
    config: Partial<PollingConfig> = {}
  ) => {
    const finalConfig: PollingConfig = {
      interval: 30000,
      enabled: true,
      pauseOnInactive: true,
      maxRetries: 3,
      exponentialBackoff: true,
      circuitBreakerThreshold: 5,
      ...pollingConfig,
      ...config,
    };

    // Register with smart polling manager
    smartPollingManager.register(id, callback, finalConfig);
    
    // Track this polling registration
    registeredPollingIds.current.add(id);
    
    // Store original config
    originalConfigs.current.set(id, { ...finalConfig });

    // Apply current visibility/activity state
    if (!pageVisibility.isVisible || (pauseOnUserInactive && !pageVisibility.isUserActive)) {
      if (useReducedBackgroundPolling && pageVisibility.isVisible) {
        // Apply background polling immediately if page is visible but user inactive
        const backgroundConfig = {
          ...finalConfig,
          interval: finalConfig.interval * backgroundPollingMultiplier,
        };
        smartPollingManager.updateConfig(id, backgroundConfig);
        backgroundPollingActive.current = true;
      } else if (finalConfig.pauseOnInactive) {
        // Pause if page is not visible or user is inactive
        smartPollingManager.pause(id);
      }
    }
  }, [
    pollingConfig,
    pageVisibility.isVisible,
    pageVisibility.isUserActive,
    pauseOnUserInactive,
    useReducedBackgroundPolling,
    backgroundPollingMultiplier,
  ]);

  /**
   * Unregister a polling operation
   */
  const unregisterPolling = useCallback((id: string) => {
    smartPollingManager.unregister(id);
    registeredPollingIds.current.delete(id);
    originalConfigs.current.delete(id);
  }, []);

  /**
   * Pause all registered polling operations
   */
  const pauseAllPolling = useCallback(() => {
    registeredPollingIds.current.forEach(id => {
      smartPollingManager.pause(id);
    });
  }, []);

  /**
   * Resume all registered polling operations
   */
  const resumeAllPolling = useCallback(() => {
    registeredPollingIds.current.forEach(id => {
      smartPollingManager.resume(id);
    });
  }, []);

  /**
   * Get current polling state for debugging
   */
  const getPollingState = useCallback(() => {
    return {
      registeredPollingIds: Array.from(registeredPollingIds.current),
      pageVisible: pageVisibility.isVisible,
      userActive: pageVisibility.isUserActive,
      backgroundPollingActive: backgroundPollingActive.current,
    };
  }, [pageVisibility.isVisible, pageVisibility.isUserActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unregister all polling operations
      registeredPollingIds.current.forEach(id => {
        smartPollingManager.unregister(id);
      });
      registeredPollingIds.current.clear();
      originalConfigs.current.clear();
    };
  }, []);

  return {
    registerPolling,
    unregisterPolling,
    pauseAllPolling,
    resumeAllPolling,
    isPageVisible: pageVisibility.isVisible,
    isUserActive: pageVisibility.isUserActive,
    getPollingState,
  };
}
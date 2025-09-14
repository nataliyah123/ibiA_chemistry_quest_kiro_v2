import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshState } from '../types/polling';
import { useRefreshPreferences } from './useRefreshPreferences';

interface UseRefreshControlOptions {
  initialInterval?: number;
  initialAutoRefresh?: boolean;
  onRefresh: () => Promise<void>;
  pauseOnInactive?: boolean;
  useUserPreferences?: boolean;
}

/**
 * Hook to manage refresh control state and auto-refresh functionality
 */
export const useRefreshControl = ({
  initialInterval = 30000,
  initialAutoRefresh = false,
  onRefresh,
  pauseOnInactive = true,
  useUserPreferences = true
}: UseRefreshControlOptions) => {
  const { 
    preferences, 
    getOptimalInterval 
  } = useRefreshPreferences();
  const [state, setState] = useState<RefreshState>(() => {
    if (useUserPreferences) {
      return {
        isRefreshing: false,
        autoRefreshEnabled: initialAutoRefresh ?? preferences.autoRefreshEnabled,
        interval: initialInterval ?? preferences.defaultInterval,
        lastRefresh: null,
        error: null,
        refreshCount: 0
      };
    }
    return {
      isRefreshing: false,
      autoRefreshEnabled: initialAutoRefresh,
      interval: initialInterval,
      lastRefresh: null,
      error: null,
      refreshCount: 0
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisible = useRef(true);

  // Get effective pause behavior from preferences
  const effectivePauseOnInactive = useUserPreferences ? preferences.pauseOnInactive : pauseOnInactive;

  // Handle page visibility changes
  useEffect(() => {
    if (!effectivePauseOnInactive) return;

    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (document.hidden) {
        // Page is hidden, pause auto-refresh
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Page is visible, resume auto-refresh if enabled
        if (state.autoRefreshEnabled) {
          startAutoRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.autoRefreshEnabled, state.interval, effectivePauseOnInactive]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Use bandwidth-aware interval if preferences are enabled
    const effectiveInterval = useUserPreferences && preferences.bandwidthAware 
      ? getOptimalInterval(state.interval)
      : state.interval;

    intervalRef.current = setInterval(async () => {
      if (isPageVisible.current || !effectivePauseOnInactive) {
        try {
          setState(prev => ({ ...prev, isRefreshing: true, error: null }));
          await onRefresh();
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            lastRefresh: new Date(),
            refreshCount: prev.refreshCount + 1,
            error: null
          }));
        } catch (error) {
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            error: error instanceof Error ? error.message : 'Refresh failed'
          }));
        }
      }
    }, effectiveInterval);
  }, [onRefresh, state.interval, effectivePauseOnInactive, useUserPreferences, preferences.bandwidthAware, getOptimalInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle auto-refresh toggle
  useEffect(() => {
    if (state.autoRefreshEnabled && (isPageVisible.current || !effectivePauseOnInactive)) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [state.autoRefreshEnabled, state.interval, startAutoRefresh, stopAutoRefresh, effectivePauseOnInactive]);

  const handleManualRefresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      await onRefresh();
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        refreshCount: prev.refreshCount + 1,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      }));
    }
  }, [onRefresh]);

  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoRefreshEnabled: enabled }));
  }, []);

  const changeInterval = useCallback((interval: number) => {
    setState(prev => ({ ...prev, interval }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    handleManualRefresh,
    toggleAutoRefresh,
    changeInterval,
    clearError,
    isPageVisible: isPageVisible.current
  };
};

export default useRefreshControl;
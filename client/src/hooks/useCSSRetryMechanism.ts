import { useState, useEffect, useCallback } from 'react';
import { 
  getCSSRetryMechanism, 
  RetryState, 
  RetryConfig,
  retryFailedCSS,
  refreshAllCSS,
  getCSSRetryStats
} from '../utils/cssRetryMechanism';

/**
 * React hook for CSS retry mechanism
 */
export function useCSSRetryMechanism(config?: Partial<RetryConfig>) {
  const [state, setState] = useState<RetryState>(() => 
    getCSSRetryMechanism(config).getState()
  );

  useEffect(() => {
    const retryMechanism = getCSSRetryMechanism(config);
    
    // Set initial state
    setState(retryMechanism.getState());
    
    // Subscribe to changes
    const unsubscribe = retryMechanism.addListener((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const manualRetry = useCallback(async (href?: string) => {
    const retryMechanism = getCSSRetryMechanism();
    return await retryMechanism.manualRetry(href);
  }, []);

  const manualRefreshAll = useCallback(async () => {
    const retryMechanism = getCSSRetryMechanism();
    return await retryMechanism.manualRefreshAllCSS();
  }, []);

  const updateConfig = useCallback((newConfig: Partial<RetryConfig>) => {
    const retryMechanism = getCSSRetryMechanism();
    retryMechanism.updateConfig(newConfig);
  }, []);

  const cancelAllRetries = useCallback(() => {
    const retryMechanism = getCSSRetryMechanism();
    retryMechanism.cancelAllRetries();
  }, []);

  const clearHistory = useCallback(() => {
    const retryMechanism = getCSSRetryMechanism();
    retryMechanism.clearRetryHistory();
  }, []);

  return {
    ...state,
    manualRetry,
    manualRefreshAll,
    updateConfig,
    cancelAllRetries,
    clearHistory,
    stats: getCSSRetryStats(),
  };
}

/**
 * Hook for simple retry actions
 */
export function useCSSRetryActions() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRetryResult, setLastRetryResult] = useState<boolean[] | null>(null);

  const retryFailed = useCallback(async () => {
    setIsRetrying(true);
    try {
      const results = await retryFailedCSS();
      setLastRetryResult(results);
      return results;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRetrying(true);
    try {
      const results = await refreshAllCSS();
      setLastRetryResult(results);
      return results;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return {
    retryFailed,
    refreshAll,
    isRetrying,
    lastRetryResult,
  };
}

/**
 * Hook for retry statistics
 */
export function useCSSRetryStats() {
  const [stats, setStats] = useState(() => getCSSRetryStats());

  useEffect(() => {
    const retryMechanism = getCSSRetryMechanism();
    
    const updateStats = () => {
      setStats(getCSSRetryStats());
    };

    // Update stats when retry state changes
    const unsubscribe = retryMechanism.addListener(() => {
      updateStats();
    });

    // Update stats initially
    updateStats();

    return unsubscribe;
  }, []);

  return stats;
}
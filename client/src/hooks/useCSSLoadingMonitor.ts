import { useState, useEffect } from 'react';
import { getCSSLoadingMonitor, CSSLoadingState, StylesheetInfo } from '../utils/cssLoadingMonitor';

/**
 * React hook for monitoring CSS loading state
 */
export function useCSSLoadingMonitor() {
  const [state, setState] = useState<CSSLoadingState>(() => 
    getCSSLoadingMonitor().getState()
  );

  useEffect(() => {
    const monitor = getCSSLoadingMonitor();
    
    // Set initial state
    setState(monitor.getState());
    
    // Subscribe to changes
    const unsubscribe = monitor.addListener((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    hasErrors: state.failedStylesheets > 0,
    isLoading: state.totalStylesheets > state.loadedStylesheets + state.failedStylesheets,
    isComplete: state.totalStylesheets > 0 && state.loadedStylesheets + state.failedStylesheets === state.totalStylesheets,
    loadingProgress: state.totalStylesheets > 0 ? (state.loadedStylesheets / state.totalStylesheets) * 100 : 0,
  };
}

/**
 * Hook to get failed stylesheets
 */
export function useFailedStylesheets(): StylesheetInfo[] {
  const [failedStylesheets, setFailedStylesheets] = useState<StylesheetInfo[]>([]);

  useEffect(() => {
    const monitor = getCSSLoadingMonitor();
    
    const updateFailedStylesheets = () => {
      setFailedStylesheets(monitor.getFailedStylesheets());
    };

    // Set initial state
    updateFailedStylesheets();
    
    // Subscribe to changes
    const unsubscribe = monitor.addListener(() => {
      updateFailedStylesheets();
    });

    return unsubscribe;
  }, []);

  return failedStylesheets;
}

/**
 * Hook to get loading summary string
 */
export function useCSSLoadingSummary(): string {
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    const monitor = getCSSLoadingMonitor();
    
    const updateSummary = () => {
      setSummary(monitor.getLoadingSummary());
    };

    // Set initial state
    updateSummary();
    
    // Subscribe to changes
    const unsubscribe = monitor.addListener(() => {
      updateSummary();
    });

    return unsubscribe;
  }, []);

  return summary;
}
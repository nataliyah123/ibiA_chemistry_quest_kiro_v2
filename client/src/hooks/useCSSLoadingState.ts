import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import {
  initializeCSSMonitoring,
  retryCSSLoading,
  activateFallbackCSS,
  clearLoadErrors,
  resetCSSLoadingState,
  StylesheetInfo,
} from '../store/cssLoadingSlice';

/**
 * Hook for managing CSS loading state through Redux
 */
export function useCSSLoadingState() {
  const dispatch = useDispatch<AppDispatch>();
  const cssLoadingState = useSelector((state: RootState) => state.cssLoading);

  // Initialize CSS monitoring on mount
  useEffect(() => {
    if (!cssLoadingState.isMonitoring) {
      dispatch(initializeCSSMonitoring());
    }
  }, [dispatch, cssLoadingState.isMonitoring]);

  // Action creators
  const retryFailedStylesheets = useCallback((stylesheetHref?: string) => {
    dispatch(retryCSSLoading(stylesheetHref));
  }, [dispatch]);

  const activateFallback = useCallback(() => {
    dispatch(activateFallbackCSS());
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearLoadErrors());
  }, [dispatch]);

  const resetState = useCallback(() => {
    dispatch(resetCSSLoadingState());
  }, [dispatch]);

  // Computed values
  const hasErrors = cssLoadingState.failedStylesheets > 0;
  const isLoading = cssLoadingState.totalStylesheets > 
    cssLoadingState.loadedStylesheets + cssLoadingState.failedStylesheets;
  const isComplete = cssLoadingState.totalStylesheets > 0 && 
    cssLoadingState.loadedStylesheets + cssLoadingState.failedStylesheets === cssLoadingState.totalStylesheets;
  const loadingProgress = cssLoadingState.totalStylesheets > 0 ? 
    (cssLoadingState.loadedStylesheets / cssLoadingState.totalStylesheets) * 100 : 0;

  const failedStylesheets: StylesheetInfo[] = Object.values(cssLoadingState.stylesheets)
    .filter(sheet => sheet.loadStatus === 'error');

  const loadingStylesheets: StylesheetInfo[] = Object.values(cssLoadingState.stylesheets)
    .filter(sheet => sheet.loadStatus === 'loading');

  const loadedStylesheets: StylesheetInfo[] = Object.values(cssLoadingState.stylesheets)
    .filter(sheet => sheet.loadStatus === 'loaded');

  return {
    // State
    ...cssLoadingState,
    
    // Computed values
    hasErrors,
    isLoading,
    isComplete,
    loadingProgress,
    failedStylesheets,
    loadingStylesheets,
    loadedStylesheets,
    
    // Actions
    retryFailedStylesheets,
    activateFallback,
    clearErrors,
    resetState,
  };
}

/**
 * Hook for getting CSS loading summary information
 */
export function useCSSLoadingSummary() {
  const cssLoadingState = useSelector((state: RootState) => state.cssLoading);
  
  const { totalStylesheets, loadedStylesheets, failedStylesheets } = cssLoadingState;
  const loadingStylesheets = totalStylesheets - loadedStylesheets - failedStylesheets;
  
  const summary = `CSS Loading Status: ${loadedStylesheets}/${totalStylesheets} loaded, ${failedStylesheets} failed, ${loadingStylesheets} loading`;
  
  const status: 'loading' | 'complete' | 'error' | 'idle' = 
    totalStylesheets === 0 ? 'idle' :
    failedStylesheets > 0 ? 'error' :
    loadingStylesheets > 0 ? 'loading' : 'complete';

  return {
    summary,
    status,
    totalStylesheets,
    loadedStylesheets,
    failedStylesheets,
    loadingStylesheets,
    loadingProgress: totalStylesheets > 0 ? (loadedStylesheets / totalStylesheets) * 100 : 0,
  };
}

/**
 * Hook for getting only failed stylesheets
 */
export function useFailedStylesheets() {
  const cssLoadingState = useSelector((state: RootState) => state.cssLoading);
  
  return Object.values(cssLoadingState.stylesheets)
    .filter(sheet => sheet.loadStatus === 'error');
}

/**
 * Hook for checking if CSS loading has critical errors
 */
export function useCSSLoadingHealth() {
  const cssLoadingState = useSelector((state: RootState) => state.cssLoading);
  
  const hasCriticalErrors = cssLoadingState.failedStylesheets > 0;
  const needsFallback = hasCriticalErrors && !cssLoadingState.fallbackActive;
  const canRetry = hasCriticalErrors && !cssLoadingState.retryInProgress;
  
  return {
    hasCriticalErrors,
    needsFallback,
    canRetry,
    fallbackActive: cssLoadingState.fallbackActive,
    retryInProgress: cssLoadingState.retryInProgress,
    errorCount: cssLoadingState.failedStylesheets,
    lastUpdateTime: cssLoadingState.lastUpdateTime,
  };
}
/**
 * React hook for CSS Fallback System
 * Provides access to fallback state and controls
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getCSSFallbackSystem, 
  FallbackState, 
  activateCSSFallback, 
  deactivateCSSFallback 
} from '../utils/cssFallbackSystem';

export interface UseCSSFallbackSystemReturn {
  // State
  fallbackState: FallbackState;
  isActive: boolean;
  
  // Actions
  activateFallback: (reason?: string) => void;
  deactivateFallback: (reason?: string) => void;
  retryCSS: () => Promise<void>;
  dismissNotification: () => void;
  
  // Utilities
  getActivationTime: () => number | null;
  getTimeSinceActivation: () => number | null;
}

export function useCSSFallbackSystem(): UseCSSFallbackSystemReturn {
  const [fallbackState, setFallbackState] = useState<FallbackState>(() => 
    getCSSFallbackSystem().getState()
  );

  useEffect(() => {
    const fallbackSystem = getCSSFallbackSystem();
    
    // Subscribe to state changes
    const unsubscribe = fallbackSystem.addListener((newState) => {
      setFallbackState(newState);
    });

    // Get initial state
    setFallbackState(fallbackSystem.getState());

    return unsubscribe;
  }, []);

  const activateFallback = useCallback((reason?: string) => {
    activateCSSFallback(reason);
  }, []);

  const deactivateFallback = useCallback((reason?: string) => {
    deactivateCSSFallback(reason);
  }, []);

  const retryCSS = useCallback(async () => {
    const fallbackSystem = getCSSFallbackSystem();
    await fallbackSystem.retryCSS();
  }, []);

  const dismissNotification = useCallback(() => {
    const fallbackSystem = getCSSFallbackSystem();
    fallbackSystem.dismissNotification();
  }, []);

  const getActivationTime = useCallback(() => {
    return fallbackState.activatedAt || null;
  }, [fallbackState.activatedAt]);

  const getTimeSinceActivation = useCallback(() => {
    if (!fallbackState.activatedAt) {
      return null;
    }
    return Date.now() - fallbackState.activatedAt;
  }, [fallbackState.activatedAt]);

  return {
    // State
    fallbackState,
    isActive: fallbackState.isActive,
    
    // Actions
    activateFallback,
    deactivateFallback,
    retryCSS,
    dismissNotification,
    
    // Utilities
    getActivationTime,
    getTimeSinceActivation,
  };
}

export default useCSSFallbackSystem;
/**
 * usePageVisibility Hook
 * Detects tab visibility changes and provides user activity detection
 * to integrate with Smart Polling Manager for pause/resume functionality
 */

import { useState, useEffect, useCallback } from 'react';

export interface PageVisibilityState {
  isVisible: boolean;
  isUserActive: boolean;
  lastActivityTime: Date | null;
  visibilityChangeCount: number;
}

export interface UsePageVisibilityOptions {
  /**
   * Time in milliseconds to consider user inactive after no activity
   * @default 300000 (5 minutes)
   */
  inactivityTimeout?: number;
  
  /**
   * Whether to track user activity (mouse, keyboard, touch events)
   * @default true
   */
  trackUserActivity?: boolean;
  
  /**
   * Callback when page visibility changes
   */
  onVisibilityChange?: (isVisible: boolean) => void;
  
  /**
   * Callback when user activity state changes
   */
  onActivityChange?: (isActive: boolean) => void;
}

export interface UsePageVisibilityReturn extends PageVisibilityState {
  /**
   * Manually mark user as active
   */
  markUserActive: () => void;
  
  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceLastActivity: () => number | null;
}

/**
 * Hook to detect page visibility changes and user activity
 */
export function usePageVisibility(options: UsePageVisibilityOptions = {}): UsePageVisibilityReturn {
  const {
    inactivityTimeout = 300000, // 5 minutes
    trackUserActivity = true,
    onVisibilityChange,
    onActivityChange,
  } = options;

  const [state, setState] = useState<PageVisibilityState>({
    isVisible: !document.hidden,
    isUserActive: true,
    lastActivityTime: new Date(),
    visibilityChangeCount: 0,
  });

  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Mark user as active and reset inactivity timer
   */
  const markUserActive = useCallback(() => {
    const now = new Date();
    
    setState(prev => {
      const wasActive = prev.isUserActive;
      const newState = {
        ...prev,
        isUserActive: true,
        lastActivityTime: now,
      };
      
      // Call activity change callback if state changed
      if (!wasActive && onActivityChange) {
        onActivityChange(true);
      }
      
      return newState;
    });

    // Clear existing timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Set new inactivity timer
    if (trackUserActivity && inactivityTimeout > 0) {
      const timer = setTimeout(() => {
        setState(prev => {
          const newState = {
            ...prev,
            isUserActive: false,
          };
          
          if (onActivityChange) {
            onActivityChange(false);
          }
          
          return newState;
        });
      }, inactivityTimeout);
      
      setInactivityTimer(timer);
    }
  }, [inactivityTimeout, trackUserActivity, onActivityChange, inactivityTimer]);

  /**
   * Handle page visibility changes
   */
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    
    setState(prev => {
      const newState = {
        ...prev,
        isVisible,
        visibilityChangeCount: prev.visibilityChangeCount + 1,
      };
      
      return newState;
    });

    // Mark user as active when page becomes visible
    if (isVisible && trackUserActivity) {
      markUserActive();
    }

    // Call visibility change callback
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [markUserActive, trackUserActivity, onVisibilityChange]);

  /**
   * Handle user activity events
   */
  const handleUserActivity = useCallback(() => {
    if (trackUserActivity && state.isVisible) {
      markUserActive();
    }
  }, [markUserActive, trackUserActivity, state.isVisible]);

  /**
   * Get time since last activity
   */
  const getTimeSinceLastActivity = useCallback((): number | null => {
    if (!state.lastActivityTime) return null;
    return Date.now() - state.lastActivityTime.getTime();
  }, [state.lastActivityTime]);

  /**
   * Get browser-specific visibility change event name
   */
  const getVisibilityChangeEvent = useCallback((): string | null => {
    if ('hidden' in document) return 'visibilitychange';
    if ('webkitHidden' in document) return 'webkitvisibilitychange';
    if ('mozHidden' in document) return 'mozvisibilitychange';
    if ('msHidden' in document) return 'msvisibilitychange';
    return null;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const visibilityEvent = getVisibilityChangeEvent();
    
    // Add visibility change listener
    if (visibilityEvent) {
      document.addEventListener(visibilityEvent, handleVisibilityChange, false);
    }

    // Add user activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    if (trackUserActivity) {
      activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });
      
      // Initialize activity timer
      markUserActive();
    }

    // Cleanup function
    return () => {
      if (visibilityEvent) {
        document.removeEventListener(visibilityEvent, handleVisibilityChange);
      }
      
      if (trackUserActivity) {
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
      }
      
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [
    handleVisibilityChange,
    handleUserActivity,
    trackUserActivity,
    markUserActive,
    getVisibilityChangeEvent,
    inactivityTimer,
  ]);

  return {
    ...state,
    markUserActive,
    getTimeSinceLastActivity,
  };
}
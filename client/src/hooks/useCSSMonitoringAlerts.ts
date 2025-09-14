/**
 * CSS Monitoring Alerts Hook
 * React hook for managing CSS monitoring alerts and error reporting
 * Uses event-driven monitoring instead of polling
 */

import { useState, useEffect, useCallback } from 'react';
import { cssErrorReporter, CSSError } from '../utils/cssErrorReporting';
import { cssAlertSystem, CSSAlert } from '../utils/cssAlertSystem';
import { cssEventEmitter, CSSEventType, CSSMonitoringEvents } from '../utils/cssEventEmitter';

export interface CSSMonitoringState {
  alerts: CSSAlert[];
  errorCount: number;
  isMonitoring: boolean;
  lastError?: CSSError;
}

export interface CSSMonitoringActions {
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  retryFailedCSS: (url: string) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getErrorSummary: () => { totalErrors: number; errorsByType: Record<string, number> };
}

export function useCSSMonitoringAlerts(): [CSSMonitoringState, CSSMonitoringActions] {
  const [alerts, setAlerts] = useState<CSSAlert[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastError, setLastError] = useState<CSSError | undefined>();

  // Subscribe to alert system updates
  useEffect(() => {
    const unsubscribe = cssAlertSystem.subscribe((newAlerts) => {
      setAlerts(newAlerts);
    });

    // Initialize with current alerts
    setAlerts(cssAlertSystem.getActiveAlerts());

    return unsubscribe;
  }, []);

  // Event-driven CSS monitoring - replaces polling
  useEffect(() => {
    if (!isMonitoring) {
      // Clean up any existing listeners when monitoring is disabled
      return;
    }

    // Event handlers for different CSS events
    const handleLoadError = (event: CSSMonitoringEvents['css-load-error']) => {
      setLastError({
        type: 'load_failure',
        url: event.url,
        timestamp: event.timestamp,
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        retryCount: 0,
        errorMessage: event.error.message
      });

      setErrorCount(prev => prev + 1);

      cssAlertSystem.createCSSLoadFailureAlert(
        event.url,
        () => {
          // Create a new link element and try to reload it
          const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
          const targetLink = Array.from(linkElements).find(
            (link) => (link as HTMLLinkElement).href === event.url
          ) as HTMLLinkElement;

          if (targetLink) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.type = 'text/css';
            
            const urlObj = new URL(event.url);
            urlObj.searchParams.set('retry', Date.now().toString());
            newLink.href = urlObj.toString();

            targetLink.parentNode?.insertBefore(newLink, targetLink);
            targetLink.remove();
          }
        }
      );
    };

    const handleParseError = (event: CSSMonitoringEvents['css-parse-error']) => {
      setLastError({
        type: 'parse_error',
        url: event.url,
        timestamp: event.timestamp,
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        retryCount: 0,
        errorMessage: event.error.message
      });

      setErrorCount(prev => prev + 1);
      cssAlertSystem.createCSSParseErrorAlert(event.url);
    };

    const handleNetworkError = (event: CSSMonitoringEvents['css-network-error']) => {
      setLastError({
        type: 'network_error',
        url: event.url,
        timestamp: event.timestamp,
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        retryCount: 0,
        errorMessage: event.error.message
      });

      setErrorCount(prev => prev + 1);
      cssAlertSystem.createCSSNetworkErrorAlert(event.url);
    };

    const handleMultipleFailures = (event: CSSMonitoringEvents['multiple-failures']) => {
      cssAlertSystem.createMultipleFailuresAlert(event.urls);
    };

    const handleLoadSuccess = (event: CSSMonitoringEvents['css-load-success']) => {
      // Optional: Handle successful CSS loads for positive feedback
      // Could be used to clear previous error states for the same URL
    };

    // Register event listeners
    cssEventEmitter.addEventListener('css-load-error', handleLoadError);
    cssEventEmitter.addEventListener('css-parse-error', handleParseError);
    cssEventEmitter.addEventListener('css-network-error', handleNetworkError);
    cssEventEmitter.addEventListener('multiple-failures', handleMultipleFailures);
    cssEventEmitter.addEventListener('css-load-success', handleLoadSuccess);

    // Initialize error count from existing errors
    const summary = cssErrorReporter.getErrorSummary();
    setErrorCount(summary.totalErrors);

    return () => {
      // Clean up event listeners
      cssEventEmitter.removeEventListener('css-load-error', handleLoadError);
      cssEventEmitter.removeEventListener('css-parse-error', handleParseError);
      cssEventEmitter.removeEventListener('css-network-error', handleNetworkError);
      cssEventEmitter.removeEventListener('multiple-failures', handleMultipleFailures);
      cssEventEmitter.removeEventListener('css-load-success', handleLoadSuccess);
    };
  }, [isMonitoring]);



  const dismissAlert = useCallback((alertId: string) => {
    cssAlertSystem.dismissAlert(alertId);
  }, []);

  const retryFailedCSS = useCallback((url: string) => {
    // Find the link element and try to reload it
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const targetLink = Array.from(linkElements).find(
      (link) => (link as HTMLLinkElement).href === url
    ) as HTMLLinkElement;

    if (targetLink) {
      // Create a new link element with cache-busting parameter
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.type = 'text/css';
      
      // Add cache-busting parameter
      const urlObj = new URL(url);
      urlObj.searchParams.set('retry', Date.now().toString());
      newLink.href = urlObj.toString();

      // Replace the old link
      targetLink.parentNode?.insertBefore(newLink, targetLink);
      targetLink.remove();

      // Create success alert if it loads
      newLink.onload = () => {
        cssAlertSystem.createAlert(
          'info',
          'low',
          'CSS Retry Successful',
          `Successfully reloaded stylesheet: ${getAssetName(url)}`,
          [
            {
              label: 'Dismiss',
              action: () => cssAlertSystem.dismissAlert(alert.id),
              type: 'secondary'
            }
          ]
        );
      };

      // Create failure alert if it fails again
      newLink.onerror = () => {
        cssAlertSystem.createAlert(
          'error',
          'high',
          'CSS Retry Failed',
          `Failed to reload stylesheet after retry: ${getAssetName(url)}`,
          [
            {
              label: 'Refresh Page',
              action: () => window.location.reload(),
              type: 'primary'
            },
            {
              label: 'Dismiss',
              action: () => cssAlertSystem.dismissAlert(alert.id),
              type: 'secondary'
            }
          ]
        );
      };
    }
  }, []);

  const clearAllAlerts = useCallback(() => {
    cssAlertSystem.clearAllAlerts();
    cssErrorReporter.clearErrors();
    setErrorCount(0);
    setLastError(undefined);
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getErrorSummary = useCallback(() => {
    return cssErrorReporter.getErrorSummary();
  }, []);

  const state: CSSMonitoringState = {
    alerts,
    errorCount,
    isMonitoring,
    lastError
  };

  const actions: CSSMonitoringActions = {
    dismissAlert,
    clearAllAlerts,
    retryFailedCSS,
    startMonitoring,
    stopMonitoring,
    getErrorSummary
  };

  return [state, actions];
}

// Helper functions
function getAssetName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop() || url;
  } catch {
    return url;
  }
}
import { getCSSLoadingMonitor, logCSSLoadingStatus } from './cssLoadingMonitor';
import { getCSSRetryMechanism } from './cssRetryMechanism';
import { getCSSFallbackSystem } from './cssFallbackSystem';

/**
 * Initialize CSS loading monitoring for the application
 */
export function initializeCSSMonitor(): void {
  // Get the monitor instance (creates it if it doesn't exist)
  const monitor = getCSSLoadingMonitor();

  // Initialize the retry mechanism
  const retryMechanism = getCSSRetryMechanism({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableAutoRetry: true,
  });

  // Initialize the fallback system
  const fallbackSystem = getCSSFallbackSystem({
    enableAutoFallback: true,
    fallbackDelay: 5000, // 5 seconds
    showUserNotification: true,
    criticalCSSSelector: 'css-fallback-active',
  });

  // Log initial status
  console.log('CSS Loading Monitor, Retry Mechanism, and Fallback System initialized');
  logCSSLoadingStatus();

  // Set up periodic logging in development
  if (process.env.NODE_ENV === 'development') {
    const logInterval = setInterval(() => {
      const state = monitor.getState();
      const hasLoadingStylesheets = state.totalStylesheets > state.loadedStylesheets + state.failedStylesheets;
      
      // Only log if there are loading stylesheets or errors
      if (hasLoadingStylesheets || state.failedStylesheets > 0) {
        logCSSLoadingStatus();
      }
      
      // Stop logging once everything is loaded and no errors
      if (state.totalStylesheets > 0 && !hasLoadingStylesheets && state.failedStylesheets === 0) {
        clearInterval(logInterval);
        console.log('CSS Loading Monitor: All stylesheets loaded successfully');
      }
    }, 2000); // Check every 2 seconds

    // Clean up after 30 seconds to avoid infinite logging
    setTimeout(() => {
      clearInterval(logInterval);
    }, 30000);
  }

  // Add global error handler for CSS loading issues
  monitor.addListener((state) => {
    if (state.failedStylesheets > 0) {
      // Dispatch custom event for CSS loading errors
      const event = new CustomEvent('css-loading-error', {
        detail: {
          failedCount: state.failedStylesheets,
          errors: state.loadErrors,
          failedStylesheets: monitor.getFailedStylesheets(),
        }
      });
      window.dispatchEvent(event);
    }
  });
}

/**
 * Add CSS loading error handler
 */
export function addCSSLoadingErrorHandler(handler: (errorDetails: any) => void): () => void {
  const eventHandler = (event: CustomEvent) => {
    handler(event.detail);
  };

  window.addEventListener('css-loading-error', eventHandler as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('css-loading-error', eventHandler as EventListener);
  };
}

/**
 * Check if CSS is properly loaded and log results
 */
export function checkCSSLoadingHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const monitor = getCSSLoadingMonitor();
    const state = monitor.getState();

    // If no stylesheets detected, wait a bit and check again
    if (state.totalStylesheets === 0) {
      setTimeout(() => {
        const newState = monitor.getState();
        const isHealthy = newState.totalStylesheets > 0 && newState.failedStylesheets === 0;
        
        console.log('CSS Health Check:', {
          healthy: isHealthy,
          totalStylesheets: newState.totalStylesheets,
          loadedStylesheets: newState.loadedStylesheets,
          failedStylesheets: newState.failedStylesheets,
        });
        
        resolve(isHealthy);
      }, 1000);
    } else {
      const isHealthy = state.failedStylesheets === 0;
      
      console.log('CSS Health Check:', {
        healthy: isHealthy,
        totalStylesheets: state.totalStylesheets,
        loadedStylesheets: state.loadedStylesheets,
        failedStylesheets: state.failedStylesheets,
      });
      
      resolve(isHealthy);
    }
  });
}
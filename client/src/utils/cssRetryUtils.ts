/**
 * CSS Retry Utilities
 * Simple utility functions for CSS retry operations
 */

import { getCSSRetryMechanism, retryFailedCSS, refreshAllCSS } from './cssRetryMechanism';

/**
 * Initialize CSS retry mechanism with default configuration
 */
export function initializeCSSRetry() {
  const retryMechanism = getCSSRetryMechanism({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableAutoRetry: true,
  });

  console.log('CSS Retry Mechanism initialized');
  return retryMechanism;
}

/**
 * Manually trigger retry for failed CSS assets
 */
export async function triggerCSSRetry(): Promise<void> {
  try {
    console.log('Triggering CSS retry...');
    const results = await retryFailedCSS();
    const successCount = results.filter(Boolean).length;
    console.log(`CSS retry completed: ${successCount}/${results.length} successful`);
  } catch (error) {
    console.error('CSS retry failed:', error);
  }
}

/**
 * Manually refresh all CSS assets
 */
export async function triggerCSSRefresh(): Promise<void> {
  try {
    console.log('Triggering CSS refresh...');
    const results = await refreshAllCSS();
    const successCount = results.filter(Boolean).length;
    console.log(`CSS refresh completed: ${successCount}/${results.length} successful`);
  } catch (error) {
    console.error('CSS refresh failed:', error);
  }
}

/**
 * Get current retry statistics
 */
export function getCSSRetryInfo() {
  const retryMechanism = getCSSRetryMechanism();
  const state = retryMechanism.getState();
  const stats = retryMechanism.getRetryStats();

  return {
    isRetrying: state.isRetrying,
    activeRetries: stats.activeRetries,
    totalAttempts: stats.totalAttempts,
    successfulRetries: stats.successfulRetries,
    failedRetries: stats.failedRetries,
    config: state.config,
  };
}

/**
 * Enable or disable automatic retry
 */
export function setAutoRetry(enabled: boolean): void {
  const retryMechanism = getCSSRetryMechanism();
  retryMechanism.updateConfig({ enableAutoRetry: enabled });
  console.log(`CSS auto-retry ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Update retry configuration
 */
export function updateRetryConfig(config: {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}): void {
  const retryMechanism = getCSSRetryMechanism();
  retryMechanism.updateConfig(config);
  console.log('CSS retry configuration updated:', config);
}

// Export for global access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cssRetryUtils = {
    initializeCSSRetry,
    triggerCSSRetry,
    triggerCSSRefresh,
    getCSSRetryInfo,
    setAutoRetry,
    updateRetryConfig,
  };
}
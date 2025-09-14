/**
 * CSS Loading Retry Mechanism
 * Implements automatic retry logic with exponential backoff for failed CSS loads
 */

import { getCSSLoadingMonitor, StylesheetInfo } from './cssLoadingMonitor';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableAutoRetry: boolean;
}

export interface RetryAttempt {
  href: string;
  attemptNumber: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface RetryState {
  activeRetries: Map<string, number>; // href -> current attempt count
  retryHistory: RetryAttempt[];
  config: RetryConfig;
  isRetrying: boolean;
}

export class CSSRetryMechanism {
  private state: RetryState;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Array<(state: RetryState) => void> = [];
  private monitorUnsubscribe: (() => void) | null = null;

  constructor(config: Partial<RetryConfig> = {}) {
    this.state = {
      activeRetries: new Map(),
      retryHistory: [],
      config: {
        maxRetries: 3,
        initialDelay: 1000, // 1 second
        maxDelay: 30000, // 30 seconds
        backoffMultiplier: 2,
        enableAutoRetry: true,
        ...config,
      },
      isRetrying: false,
    };

    this.initialize();
  }

  private initialize(): void {
    // Subscribe to CSS loading monitor for failed stylesheets
    const monitor = getCSSLoadingMonitor();
    this.monitorUnsubscribe = monitor.addListener((cssState) => {
      if (this.state.config.enableAutoRetry) {
        const failedStylesheets = monitor.getFailedStylesheets();
        failedStylesheets.forEach(stylesheet => {
          this.scheduleRetry(stylesheet);
        });
      }
    });
  }

  private scheduleRetry(stylesheet: StylesheetInfo): void {
    const { href } = stylesheet;
    const currentAttempts = this.state.activeRetries.get(href) || 0;

    // Check if we've exceeded max retries
    if (currentAttempts >= this.state.config.maxRetries) {
      console.warn(`CSS retry limit reached for: ${href}`);
      return;
    }

    // Check if already scheduled for retry
    if (this.retryTimeouts.has(href)) {
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.state.config.initialDelay * Math.pow(this.state.config.backoffMultiplier, currentAttempts),
      this.state.config.maxDelay
    );

    console.log(`Scheduling CSS retry for ${href} (attempt ${currentAttempts + 1}/${this.state.config.maxRetries}) in ${delay}ms`);

    // Schedule the retry
    const timeout = setTimeout(() => {
      this.executeRetry(href);
    }, delay);

    this.retryTimeouts.set(href, timeout);
    this.state.activeRetries.set(href, currentAttempts + 1);
    this.state.isRetrying = true;
    this.notifyListeners();
  }

  private async executeRetry(href: string): Promise<void> {
    const attemptNumber = this.state.activeRetries.get(href) || 1;
    
    console.log(`Executing CSS retry for ${href} (attempt ${attemptNumber})`);

    try {
      // Remove the timeout reference
      this.retryTimeouts.delete(href);

      // Create new link element for retry
      const success = await this.reloadStylesheet(href);
      
      // Record the attempt
      const attempt: RetryAttempt = {
        href,
        attemptNumber,
        timestamp: Date.now(),
        success,
      };

      if (success) {
        console.log(`CSS retry successful for: ${href}`);
        // Clear retry state for this stylesheet
        this.state.activeRetries.delete(href);
        attempt.success = true;
      } else {
        console.warn(`CSS retry failed for: ${href}`);
        attempt.success = false;
        attempt.error = 'Reload failed';
        
        // Schedule next retry if we haven't exceeded max attempts
        const currentAttempts = this.state.activeRetries.get(href) || 0;
        if (currentAttempts < this.state.config.maxRetries) {
          // Create a mock stylesheet info for the next retry
          const mockStylesheet: StylesheetInfo = {
            href,
            element: document.createElement('link') as HTMLLinkElement,
            loadStatus: 'error',
            errorMessage: 'Retry failed',
          };
          setTimeout(() => this.scheduleRetry(mockStylesheet), 100);
        } else {
          this.state.activeRetries.delete(href);
        }
      }

      this.state.retryHistory.push(attempt);
      
      // Update retry state
      this.state.isRetrying = this.state.activeRetries.size > 0;
      this.notifyListeners();

    } catch (error) {
      console.error(`CSS retry error for ${href}:`, error);
      
      const attempt: RetryAttempt = {
        href,
        attemptNumber,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.state.retryHistory.push(attempt);
      this.notifyListeners();
    }
  }

  private reloadStylesheet(href: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Find existing link element
      const existingLink = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement;
      
      if (!existingLink) {
        resolve(false);
        return;
      }

      // Create new link element
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.type = 'text/css';
      
      // Add cache-busting parameter
      const url = new URL(href, window.location.origin);
      url.searchParams.set('retry', Date.now().toString());
      newLink.href = url.toString();

      // Set up load/error handlers
      const cleanup = () => {
        newLink.removeEventListener('load', onLoad);
        newLink.removeEventListener('error', onError);
      };

      const onLoad = () => {
        cleanup();
        // Replace the old link with the new one
        if (existingLink.parentNode) {
          existingLink.parentNode.replaceChild(newLink, existingLink);
        }
        resolve(true);
      };

      const onError = () => {
        cleanup();
        // Remove the failed new link
        if (newLink.parentNode) {
          newLink.parentNode.removeChild(newLink);
        }
        resolve(false);
      };

      newLink.addEventListener('load', onLoad);
      newLink.addEventListener('error', onError);

      // Add timeout
      setTimeout(() => {
        if (newLink.parentNode) {
          cleanup();
          if (newLink.parentNode) {
            newLink.parentNode.removeChild(newLink);
          }
          resolve(false);
        }
      }, 10000); // 10 second timeout

      // Insert the new link element
      document.head.appendChild(newLink);
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in CSS retry mechanism listener:', error);
      }
    });
  }

  // Public API
  public getState(): RetryState {
    return { ...this.state };
  }

  public addListener(listener: (state: RetryState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public updateConfig(newConfig: Partial<RetryConfig>): void {
    this.state.config = { ...this.state.config, ...newConfig };
    this.notifyListeners();
  }

  public manualRetry(href?: string): Promise<boolean[]> {
    if (href) {
      // Retry specific stylesheet
      return this.reloadStylesheet(href).then(success => [success]);
    } else {
      // Retry all failed stylesheets
      const monitor = getCSSLoadingMonitor();
      const failedStylesheets = monitor.getFailedStylesheets();
      
      console.log(`Manual retry triggered for ${failedStylesheets.length} failed stylesheets`);
      
      const retryPromises = failedStylesheets.map(stylesheet => 
        this.reloadStylesheet(stylesheet.href)
      );
      
      return Promise.all(retryPromises);
    }
  }

  public manualRefreshAllCSS(): Promise<boolean[]> {
    // Refresh all CSS assets, not just failed ones
    const monitor = getCSSLoadingMonitor();
    const allStylesheets = Array.from(monitor.getState().stylesheets.values());
    
    console.log(`Manual refresh triggered for ${allStylesheets.length} stylesheets`);
    
    const refreshPromises = allStylesheets.map(stylesheet => 
      this.reloadStylesheet(stylesheet.href)
    );
    
    return Promise.all(refreshPromises);
  }

  public clearRetryHistory(): void {
    this.state.retryHistory = [];
    this.notifyListeners();
  }

  public cancelAllRetries(): void {
    // Clear all pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    // Clear retry state
    this.state.activeRetries.clear();
    this.state.isRetrying = false;
    
    this.notifyListeners();
  }

  public getRetryStats(): {
    totalAttempts: number;
    successfulRetries: number;
    failedRetries: number;
    activeRetries: number;
  } {
    const totalAttempts = this.state.retryHistory.length;
    const successfulRetries = this.state.retryHistory.filter(attempt => attempt.success).length;
    const failedRetries = totalAttempts - successfulRetries;
    const activeRetries = this.state.activeRetries.size;

    return {
      totalAttempts,
      successfulRetries,
      failedRetries,
      activeRetries,
    };
  }

  public destroy(): void {
    // Cancel all pending retries
    this.cancelAllRetries();
    
    // Unsubscribe from CSS monitor
    if (this.monitorUnsubscribe) {
      this.monitorUnsubscribe();
      this.monitorUnsubscribe = null;
    }
    
    // Clear listeners
    this.listeners = [];
  }
}

// Singleton instance
let cssRetryInstance: CSSRetryMechanism | null = null;

export function getCSSRetryMechanism(config?: Partial<RetryConfig>): CSSRetryMechanism {
  if (!cssRetryInstance) {
    cssRetryInstance = new CSSRetryMechanism(config);
  }
  return cssRetryInstance;
}

// Utility functions for easy access
export function retryFailedCSS(): Promise<boolean[]> {
  return getCSSRetryMechanism().manualRetry();
}

export function refreshAllCSS(): Promise<boolean[]> {
  return getCSSRetryMechanism().manualRefreshAllCSS();
}

export function getCSSRetryStats() {
  return getCSSRetryMechanism().getRetryStats();
}

export function onCSSRetryChange(listener: (state: RetryState) => void): () => void {
  return getCSSRetryMechanism().addListener(listener);
}
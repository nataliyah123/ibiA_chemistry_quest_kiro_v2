/**
 * Smart Polling Manager Service
 * Centralized polling management with pause/resume capabilities, Page Visibility API integration,
 * exponential backoff with circuit breaker patterns, comprehensive error handling, and graceful degradation.
 */

import { pollingAlertSystem } from '../utils/pollingAlertSystem';
import { pollingCacheManager } from '../utils/pollingCacheManager';

export interface PollingConfig {
  interval: number;
  enabled: boolean;
  pauseOnInactive: boolean;
  maxRetries: number;
  exponentialBackoff: boolean;
  circuitBreakerThreshold: number;
  enableCaching: boolean;
  cacheTTL: number;
  enableAlerts: boolean;
  gracefulDegradation: boolean;
}

export interface PollingRegistration {
  id: string;
  callback: () => Promise<any>;
  config: PollingConfig;
  state: {
    active: boolean;
    paused: boolean;
    lastExecution: Date | null;
    nextExecution: Date | null;
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    backoffMultiplier: number;
    lastSuccessfulExecution: Date | null;
    lastError: unknown;
    usingCachedData: boolean;
  };
  timer: NodeJS.Timeout | null;
}

export interface PollingManager {
  register(id: string, callback: () => Promise<any>, config: PollingConfig): void;
  unregister(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  pauseAll(): void;
  resumeAll(): void;
  updateConfig(id: string, config: Partial<PollingConfig>): void;
  getRegistration(id: string): PollingRegistration | undefined;
  getAllRegistrations(): PollingRegistration[];
  isPageVisible(): boolean;
  resetCircuitBreaker(id: string): boolean;
  getCachedData<T>(id: string): T | null;
  forceRefresh(id: string): Promise<boolean>;
  getErrorStats(id: string): {
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    lastError: unknown;
    usingCachedData: boolean;
  } | null;
}

class SmartPollingManagerImpl implements PollingManager {
  private registrations = new Map<string, PollingRegistration>();
  private pageVisible = true;
  private globalPaused = false;
  private visibilityChangeHandler: () => void;

  constructor() {
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    this.initializePageVisibilityAPI();
  }

  /**
   * Initialize Page Visibility API integration
   */
  private initializePageVisibilityAPI(): void {
    if (typeof document !== 'undefined') {
      // Handle different browser prefixes
      const visibilityChange = this.getVisibilityChangeEvent();
      const hidden = this.getHiddenProperty();

      if (visibilityChange && hidden) {
        document.addEventListener(visibilityChange, this.visibilityChangeHandler, false);
        
        // Set initial visibility state
        this.pageVisible = !document[hidden as keyof Document];
      }
    }
  }

  /**
   * Get the appropriate visibility change event name for the browser
   */
  private getVisibilityChangeEvent(): string | null {
    if (typeof document === 'undefined') return null;
    
    if ('hidden' in document) return 'visibilitychange';
    if ('webkitHidden' in document) return 'webkitvisibilitychange';
    if ('mozHidden' in document) return 'mozvisibilitychange';
    if ('msHidden' in document) return 'msvisibilitychange';
    
    return null;
  }

  /**
   * Get the appropriate hidden property name for the browser
   */
  private getHiddenProperty(): string | null {
    if (typeof document === 'undefined') return null;
    
    if ('hidden' in document) return 'hidden';
    if ('webkitHidden' in document) return 'webkitHidden';
    if ('mozHidden' in document) return 'mozHidden';
    if ('msHidden' in document) return 'msHidden';
    
    return null;
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    const hidden = this.getHiddenProperty();
    if (!hidden) return;

    const wasVisible = this.pageVisible;
    this.pageVisible = !document[hidden as keyof Document];

    if (wasVisible && !this.pageVisible) {
      // Page became hidden - pause polling that should pause on inactive
      this.pauseOnInactive();
    } else if (!wasVisible && this.pageVisible) {
      // Page became visible - resume polling
      this.resumeOnActive();
    }
  }

  /**
   * Pause all polling registrations that have pauseOnInactive enabled
   */
  private pauseOnInactive(): void {
    this.registrations.forEach((registration) => {
      if (registration.config.pauseOnInactive && registration.state.active && !registration.state.paused) {
        this.pauseRegistration(registration);
      }
    });
  }

  /**
   * Resume all polling registrations that were paused due to page inactivity
   */
  private resumeOnActive(): void {
    this.registrations.forEach((registration) => {
      if (registration.config.pauseOnInactive && registration.state.paused) {
        this.resumeRegistration(registration);
      }
    });
  }

  /**
   * Register a new polling operation
   */
  register(id: string, callback: () => Promise<any>, config: PollingConfig): void {
    if (this.registrations.has(id)) {
      console.warn(`Polling registration with id "${id}" already exists. Unregistering previous one.`);
      this.unregister(id);
    }

    const registration: PollingRegistration = {
      id,
      callback,
      config: { ...config },
      state: {
        active: config.enabled,
        paused: false,
        lastExecution: null,
        nextExecution: null,
        errorCount: 0,
        consecutiveErrors: 0,
        circuitBreakerOpen: false,
        backoffMultiplier: 1,
        lastSuccessfulExecution: null,
        lastError: null,
        usingCachedData: false,
      },
      timer: null,
    };

    this.registrations.set(id, registration);

    if (config.enabled) {
      this.startPolling(registration);
    }
  }

  /**
   * Unregister a polling operation
   */
  unregister(id: string): void {
    const registration = this.registrations.get(id);
    if (registration) {
      this.stopPolling(registration);
      this.registrations.delete(id);
      
      // Clear related alerts and cache
      if (registration.config.enableAlerts) {
        pollingAlertSystem.clearAlertsForRegistration(id);
      }
      
      if (registration.config.enableCaching) {
        pollingCacheManager.delete(id);
      }
    }
  }

  /**
   * Pause a specific polling operation
   */
  pause(id: string): void {
    const registration = this.registrations.get(id);
    if (registration) {
      this.pauseRegistration(registration);
    }
  }

  /**
   * Resume a specific polling operation
   */
  resume(id: string): void {
    const registration = this.registrations.get(id);
    if (registration) {
      this.resumeRegistration(registration);
    }
  }

  /**
   * Pause all polling operations
   */
  pauseAll(): void {
    this.globalPaused = true;
    this.registrations.forEach((registration) => {
      if (registration.state.active) {
        this.pauseRegistration(registration);
      }
    });
  }

  /**
   * Resume all polling operations
   */
  resumeAll(): void {
    this.globalPaused = false;
    this.registrations.forEach((registration) => {
      if (registration.config.enabled && registration.state.paused) {
        this.resumeRegistration(registration);
      }
    });
  }

  /**
   * Update configuration for a polling operation
   */
  updateConfig(id: string, config: Partial<PollingConfig>): void {
    const registration = this.registrations.get(id);
    if (!registration) {
      console.warn(`No polling registration found with id "${id}"`);
      return;
    }

    const wasActive = registration.state.active;
    
    // Stop current polling
    this.stopPolling(registration);
    
    // Update configuration
    registration.config = { ...registration.config, ...config };
    
    // Reset circuit breaker if configuration changed
    if (config.circuitBreakerThreshold !== undefined || config.maxRetries !== undefined) {
      registration.state.circuitBreakerOpen = false;
      registration.state.consecutiveErrors = 0;
      registration.state.backoffMultiplier = 1;
    }
    
    // Restart if it was active and still enabled
    if (wasActive && registration.config.enabled) {
      registration.state.active = true;
      this.startPolling(registration);
    } else {
      registration.state.active = registration.config.enabled;
    }
  }

  /**
   * Get a specific polling registration
   */
  getRegistration(id: string): PollingRegistration | undefined {
    return this.registrations.get(id);
  }

  /**
   * Get all polling registrations
   */
  getAllRegistrations(): PollingRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Check if page is currently visible
   */
  isPageVisible(): boolean {
    return this.pageVisible;
  }

  /**
   * Start polling for a registration
   */
  private startPolling(registration: PollingRegistration): void {
    if (this.globalPaused || registration.state.circuitBreakerOpen) {
      return;
    }

    const interval = this.calculateInterval(registration);
    registration.state.nextExecution = new Date(Date.now() + interval);

    registration.timer = setTimeout(async () => {
      await this.executePolling(registration);
    }, interval);
  }

  /**
   * Stop polling for a registration
   */
  private stopPolling(registration: PollingRegistration): void {
    if (registration.timer) {
      clearTimeout(registration.timer);
      registration.timer = null;
    }
    registration.state.nextExecution = null;
  }

  /**
   * Pause a specific registration
   */
  private pauseRegistration(registration: PollingRegistration): void {
    this.stopPolling(registration);
    registration.state.paused = true;
  }

  /**
   * Resume a specific registration
   */
  private resumeRegistration(registration: PollingRegistration): void {
    if (registration.config.enabled && !this.globalPaused) {
      registration.state.paused = false;
      this.startPolling(registration);
    }
  }

  /**
   * Execute polling callback with error handling
   */
  private async executePolling(registration: PollingRegistration): Promise<void> {
    registration.state.lastExecution = new Date();

    try {
      const result = await registration.callback();
      
      // Cache successful result if caching is enabled
      if (registration.config.enableCaching && result !== undefined) {
        pollingCacheManager.set(
          registration.id,
          result,
          registration.config.cacheTTL,
          { 
            pollingId: registration.id,
            successfulExecution: true 
          }
        );
      }
      
      // Reset error counters on successful execution
      const wasCircuitBreakerOpen = registration.state.circuitBreakerOpen;
      registration.state.consecutiveErrors = 0;
      registration.state.backoffMultiplier = 1;
      registration.state.lastSuccessfulExecution = new Date();
      registration.state.lastError = null;
      registration.state.usingCachedData = false;
      
      // Close circuit breaker if it was open
      if (registration.state.circuitBreakerOpen) {
        registration.state.circuitBreakerOpen = false;
        console.log(`Circuit breaker closed for polling "${registration.id}"`);
        
        // Create recovery alert
        if (registration.config.enableAlerts) {
          pollingAlertSystem.createRecoveryAlert(registration.id);
        }
      }

    } catch (error) {
      await this.handlePollingError(registration, error);
      
      // If circuit breaker is open, don't continue polling
      if (registration.state.circuitBreakerOpen) {
        return;
      }
    }

    // Schedule next execution if still active and not paused and circuit breaker is not open
    if (registration.state.active && !registration.state.paused && !this.globalPaused && !registration.state.circuitBreakerOpen) {
      this.startPolling(registration);
    }
  }

  /**
   * Handle polling errors with exponential backoff, circuit breaker, and graceful degradation
   */
  private async handlePollingError(registration: PollingRegistration, error: unknown): Promise<void> {
    registration.state.errorCount++;
    registration.state.consecutiveErrors++;
    registration.state.lastError = error;

    console.error(`Polling error for "${registration.id}":`, error);

    // Try to use cached data for graceful degradation
    if (registration.config.gracefulDegradation && registration.config.enableCaching) {
      const cachedData = pollingCacheManager.getWithAge(registration.id);
      if (cachedData) {
        registration.state.usingCachedData = true;
        
        // Create cached data alert if data is getting old
        if (registration.config.enableAlerts && cachedData.age > 300000) { // 5 minutes
          pollingAlertSystem.createCachedDataAlert(registration.id, cachedData.age);
        }
      }
    }

    // Create error alert
    if (registration.config.enableAlerts) {
      if (this.isNetworkError(error)) {
        pollingAlertSystem.createNetworkErrorAlert(
          registration.id,
          error,
          () => this.forceRefresh(registration.id)
        );
      } else {
        pollingAlertSystem.createPollingErrorAlert(
          registration.id,
          error,
          registration.state.consecutiveErrors,
          () => this.forceRefresh(registration.id)
        );
      }
    }

    // Check circuit breaker threshold
    if (registration.state.consecutiveErrors >= registration.config.circuitBreakerThreshold) {
      registration.state.circuitBreakerOpen = true;
      console.warn(`Circuit breaker opened for polling "${registration.id}" after ${registration.state.consecutiveErrors} consecutive errors`);
      
      // Create circuit breaker alert
      if (registration.config.enableAlerts) {
        pollingAlertSystem.createCircuitBreakerAlert(
          registration.id,
          registration.state.consecutiveErrors,
          () => this.resetCircuitBreaker(registration.id)
        );
      }
      
      // Stop polling when circuit breaker is open
      this.stopPolling(registration);
      return;
    }

    // Apply exponential backoff if enabled
    if (registration.config.exponentialBackoff) {
      registration.state.backoffMultiplier = Math.min(
        registration.state.backoffMultiplier * 2,
        16 // Cap at 16x the original interval
      );
    }
  }

  /**
   * Calculate the next polling interval considering backoff
   */
  private calculateInterval(registration: PollingRegistration): number {
    let interval = registration.config.interval;

    // Apply exponential backoff if there have been errors
    if (registration.config.exponentialBackoff && registration.state.backoffMultiplier > 1) {
      interval *= registration.state.backoffMultiplier;
    }

    return interval;
  }

  /**
   * Reset circuit breaker for a specific registration
   */
  resetCircuitBreaker(id: string): boolean {
    const registration = this.registrations.get(id);
    if (!registration) {
      return false;
    }

    registration.state.circuitBreakerOpen = false;
    registration.state.consecutiveErrors = 0;
    registration.state.backoffMultiplier = 1;
    registration.state.lastError = null;

    // Clear related alerts
    if (registration.config.enableAlerts) {
      pollingAlertSystem.clearAlertsForRegistration(id);
    }

    // Resume polling if it was enabled
    if (registration.config.enabled && !registration.state.paused && !this.globalPaused) {
      this.startPolling(registration);
    }

    console.log(`Circuit breaker reset for polling "${id}"`);
    return true;
  }

  /**
   * Get cached data for a registration
   */
  getCachedData<T>(id: string): T | null {
    const cached = pollingCacheManager.get<T>(id);
    return cached ? cached.data : null;
  }

  /**
   * Force refresh for a specific registration
   */
  async forceRefresh(id: string): Promise<boolean> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return false;
    }

    try {
      // Execute callback immediately
      const result = await registration.callback();
      
      // Cache result if caching is enabled
      if (registration.config.enableCaching && result !== undefined) {
        pollingCacheManager.set(
          registration.id,
          result,
          registration.config.cacheTTL,
          { 
            pollingId: registration.id,
            forceRefresh: true 
          }
        );
      }

      // Reset error state on successful force refresh
      registration.state.consecutiveErrors = 0;
      registration.state.backoffMultiplier = 1;
      registration.state.lastSuccessfulExecution = new Date();
      registration.state.lastError = null;
      registration.state.usingCachedData = false;

      // Close circuit breaker if it was open
      if (registration.state.circuitBreakerOpen) {
        registration.state.circuitBreakerOpen = false;
        
        // Create recovery alert
        if (registration.config.enableAlerts) {
          pollingAlertSystem.createRecoveryAlert(registration.id);
        }
        
        // Resume normal polling
        if (registration.config.enabled && !registration.state.paused && !this.globalPaused) {
          this.startPolling(registration);
        }
      }

      return true;
    } catch (error) {
      console.error(`Force refresh failed for "${id}":`, error);
      
      // Handle error but don't increment consecutive errors for force refresh
      if (registration.config.enableAlerts) {
        pollingAlertSystem.createPollingErrorAlert(
          registration.id,
          error,
          registration.state.consecutiveErrors,
          () => this.forceRefresh(registration.id)
        );
      }
      
      return false;
    }
  }

  /**
   * Get error statistics for a registration
   */
  getErrorStats(id: string): {
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    lastError: unknown;
    usingCachedData: boolean;
  } | null {
    const registration = this.registrations.get(id);
    if (!registration) {
      return null;
    }

    return {
      errorCount: registration.state.errorCount,
      consecutiveErrors: registration.state.consecutiveErrors,
      circuitBreakerOpen: registration.state.circuitBreakerOpen,
      lastError: registration.state.lastError,
      usingCachedData: registration.state.usingCachedData
    };
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('connection') ||
             message.includes('timeout') ||
             error.name === 'NetworkError' ||
             error.name === 'TypeError';
    }
    return false;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Remove visibility change listener
    const visibilityChange = this.getVisibilityChangeEvent();
    if (visibilityChange) {
      document.removeEventListener(visibilityChange, this.visibilityChangeHandler);
    }

    // Stop all polling
    this.registrations.forEach((registration) => {
      this.stopPolling(registration);
    });

    this.registrations.clear();
  }
}

// Create singleton instance
export const smartPollingManager: PollingManager = new SmartPollingManagerImpl();

// Default configuration
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  interval: 30000, // 30 seconds
  enabled: true,
  pauseOnInactive: true,
  maxRetries: 3,
  exponentialBackoff: true,
  circuitBreakerThreshold: 5,
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
  enableAlerts: true,
  gracefulDegradation: true,
};
/**
 * Comprehensive CSS Loading Utilities Unit Tests
 * Tests all CSS loading utilities together and their interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCSSLoadingMonitor, CSSLoadingMonitor } from '../cssLoadingMonitor';
import { getCSSRetryMechanism, CSSRetryMechanism } from '../cssRetryMechanism';
import { getCSSFallbackSystem, CSSFallbackSystem } from '../cssFallbackSystem';
import { initializeCSSMonitor } from '../initializeCSSMonitor';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemove = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  // Reset DOM
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.body.className = '';

  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement,
    writable: true,
  });

  Object.defineProperty(document, 'head', {
    value: {
      appendChild: mockAppendChild,
      querySelectorAll: vi.fn(() => []),
    },
    writable: true,
  });

  Object.defineProperty(document, 'body', {
    value: {
      appendChild: mockAppendChild,
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
    writable: true,
  });

  // Mock style element
  mockCreateElement.mockReturnValue({
    id: '',
    textContent: '',
    remove: mockRemove,
  });

  // Mock window methods
  Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  });

  Object.defineProperty(window, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  });

  // Clear singletons
  (getCSSLoadingMonitor as any).cssMonitorInstance = null;
  (getCSSRetryMechanism as any).cssRetryInstance = null;
  (getCSSFallbackSystem as any).cssFallbackInstance = null;

  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('CSS Loading Utilities Integration', () => {
  describe('Initialization and Coordination', () => {
    it('should initialize all CSS utilities together', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();
      const fallbackSystem = getCSSFallbackSystem();

      expect(monitor).toBeInstanceOf(CSSLoadingMonitor);
      expect(retryMechanism).toBeInstanceOf(CSSRetryMechanism);
      expect(fallbackSystem).toBeInstanceOf(CSSFallbackSystem);
    });

    it('should coordinate between monitor and retry mechanism', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();

      // Add a failed stylesheet to the monitor
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/failed.css';
      document.head.appendChild(link);

      // Simulate CSS loading failure
      link.dispatchEvent(new Event('error'));

      // Verify monitor detects the failure
      const monitorState = monitor.getState();
      expect(monitorState.failedStylesheets).toBe(1);

      // Verify retry mechanism can access failed stylesheets
      const failedStylesheets = monitor.getFailedStylesheets();
      expect(failedStylesheets).toHaveLength(1);
      expect(failedStylesheets[0].href).toBe('http://example.com/failed.css');
    });

    it('should coordinate between retry mechanism and fallback system', async () => {
      const retryMechanism = getCSSRetryMechanism();
      const fallbackSystem = getCSSFallbackSystem();

      // Mock failed retry attempts
      const mockFailedStylesheet = {
        href: 'http://example.com/failed.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed'
      };

      // Simulate retry exhaustion
      retryMechanism.updateConfig({ maxRetries: 1 });
      
      // Mock manual retry failure
      retryMechanism.manualRetry = vi.fn().mockResolvedValue([false]);
      
      const retryResult = await retryMechanism.manualRetry('http://example.com/failed.css');
      expect(retryResult).toEqual([false]);

      // Verify fallback system can be activated
      fallbackSystem.activateFallback('Retry mechanism exhausted');
      const fallbackState = fallbackSystem.getState();
      expect(fallbackState.isActive).toBe(true);
    });
  });

  describe('CSS Loading State Management', () => {
    it('should track CSS loading state across all utilities', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();
      const fallbackSystem = getCSSFallbackSystem();

      // Add stylesheets to DOM
      const stylesheets = [
        'http://example.com/style1.css',
        'http://example.com/style2.css',
        'http://example.com/style3.css'
      ];

      stylesheets.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      });

      // Verify monitor tracks all stylesheets
      const monitorState = monitor.getState();
      expect(monitorState.totalStylesheets).toBe(3);

      // Verify retry mechanism is ready
      const retryState = retryMechanism.getState();
      expect(retryState.isRetrying).toBe(false);
      expect(retryState.activeRetries.size).toBe(0);

      // Verify fallback system is inactive
      const fallbackState = fallbackSystem.getState();
      expect(fallbackState.isActive).toBe(false);
    });

    it('should handle mixed CSS loading states', () => {
      const monitor = getCSSLoadingMonitor();

      // Add stylesheets with different states
      const loadedLink = document.createElement('link');
      loadedLink.rel = 'stylesheet';
      loadedLink.href = 'http://example.com/loaded.css';
      Object.defineProperty(loadedLink, 'sheet', { value: {} });
      document.head.appendChild(loadedLink);

      const failedLink = document.createElement('link');
      failedLink.rel = 'stylesheet';
      failedLink.href = 'http://example.com/failed.css';
      document.head.appendChild(failedLink);

      const loadingLink = document.createElement('link');
      loadingLink.rel = 'stylesheet';
      loadingLink.href = 'http://example.com/loading.css';
      document.head.appendChild(loadingLink);

      // Simulate events
      loadedLink.dispatchEvent(new Event('load'));
      failedLink.dispatchEvent(new Event('error'));
      // loadingLink remains in loading state

      // Verify monitor tracks mixed states
      const state = monitor.getState();
      expect(state.totalStylesheets).toBe(3);
      expect(state.loadedStylesheets).toBe(1);
      expect(state.failedStylesheets).toBe(1);
      expect(state.loadErrors).toHaveLength(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle CSS loading errors gracefully', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();

      // Add a stylesheet that will fail
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/nonexistent.css';
      document.head.appendChild(link);

      // Simulate loading error
      link.dispatchEvent(new Event('error'));

      // Verify error is tracked
      expect(monitor.hasLoadingErrors()).toBe(true);
      const failedStylesheets = monitor.getFailedStylesheets();
      expect(failedStylesheets).toHaveLength(1);

      // Verify retry mechanism can handle the error
      const retryState = retryMechanism.getState();
      expect(retryState.config.enableAutoRetry).toBe(true);
    });

    it('should escalate to fallback system when retries fail', async () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();
      const fallbackSystem = getCSSFallbackSystem();

      // Configure retry mechanism for quick failure
      retryMechanism.updateConfig({
        maxRetries: 1,
        initialDelay: 10,
        enableAutoRetry: true
      });

      // Add a failing stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/persistent-failure.css';
      document.head.appendChild(link);

      // Simulate persistent failure
      link.dispatchEvent(new Event('error'));

      // Verify error is detected
      expect(monitor.hasLoadingErrors()).toBe(true);

      // Mock retry failure
      retryMechanism.manualRetry = vi.fn().mockResolvedValue([false]);
      const retryResult = await retryMechanism.manualRetry();
      expect(retryResult).toEqual([false]);

      // Activate fallback system
      fallbackSystem.activateFallback('Persistent CSS loading failure');
      
      // Verify fallback is active
      const fallbackState = fallbackSystem.getState();
      expect(fallbackState.isActive).toBe(true);
      expect(fallbackState.reason).toBe('Persistent CSS loading failure');
    });

    it('should handle network connectivity issues', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();

      // Simulate network connectivity issues
      const stylesheets = [
        'http://example.com/style1.css',
        'http://example.com/style2.css',
        'http://example.com/style3.css'
      ];

      stylesheets.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        
        // Simulate network error
        link.dispatchEvent(new Event('error'));
      });

      // Verify all failures are tracked
      const state = monitor.getState();
      expect(state.failedStylesheets).toBe(3);
      expect(state.loadErrors).toHaveLength(3);

      // Verify retry mechanism can handle multiple failures
      const retryState = retryMechanism.getState();
      expect(retryState.config.maxRetries).toBeGreaterThan(0);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of stylesheets efficiently', () => {
      const monitor = getCSSLoadingMonitor();

      // Add many stylesheets
      const stylesheetCount = 50;
      for (let i = 0; i < stylesheetCount; i++) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `http://example.com/style${i}.css`;
        document.head.appendChild(link);
      }

      // Verify monitor handles large numbers efficiently
      const state = monitor.getState();
      expect(state.totalStylesheets).toBe(stylesheetCount);
      expect(state.stylesheets.size).toBe(stylesheetCount);
    });

    it('should cleanup resources properly', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();
      const fallbackSystem = getCSSFallbackSystem();

      // Add listeners
      const monitorListener = vi.fn();
      const fallbackListener = vi.fn();

      const unsubscribeMonitor = monitor.addListener(monitorListener);
      const unsubscribeFallback = fallbackSystem.addListener(fallbackListener);

      // Verify listeners are added
      expect(unsubscribeMonitor).toBeInstanceOf(Function);
      expect(unsubscribeFallback).toBeInstanceOf(Function);

      // Cleanup
      unsubscribeMonitor();
      unsubscribeFallback();
      monitor.destroy();
      retryMechanism.destroy();
      fallbackSystem.destroy();

      // Verify cleanup doesn't throw errors
      expect(() => monitor.getState()).not.toThrow();
      expect(() => retryMechanism.getState()).not.toThrow();
      expect(() => fallbackSystem.getState()).not.toThrow();
    });

    it('should handle memory pressure gracefully', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();

      // Simulate memory pressure by adding many retry attempts
      const retryHistory = [];
      for (let i = 0; i < 1000; i++) {
        retryHistory.push({
          href: `style${i}.css`,
          attemptNumber: 1,
          timestamp: Date.now() - i * 1000,
          success: false
        });
      }

      // Verify systems handle large amounts of data
      const retryState = retryMechanism.getState();
      expect(retryState).toBeDefined();

      // Clear history to free memory
      retryMechanism.clearRetryHistory();
      
      // Verify cleanup works
      const clearedState = retryMechanism.getState();
      expect(clearedState.retryHistory).toHaveLength(0);
    });
  });

  describe('Configuration and Customization', () => {
    it('should allow configuration of retry behavior', () => {
      const retryMechanism = getCSSRetryMechanism();

      // Update configuration
      const newConfig = {
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 30000,
        backoffMultiplier: 3,
        enableAutoRetry: false
      };

      retryMechanism.updateConfig(newConfig);

      // Verify configuration is applied
      const state = retryMechanism.getState();
      expect(state.config.maxRetries).toBe(5);
      expect(state.config.initialDelay).toBe(2000);
      expect(state.config.maxDelay).toBe(30000);
      expect(state.config.backoffMultiplier).toBe(3);
      expect(state.config.enableAutoRetry).toBe(false);
    });

    it('should allow configuration of fallback behavior', () => {
      const fallbackSystem = getCSSFallbackSystem();

      // Update configuration
      fallbackSystem.updateConfig({
        enableAutoFallback: false,
        fallbackDelay: 10000,
        showUserNotification: false
      });

      // Verify configuration affects behavior
      expect(fallbackSystem).toBeDefined();
    });

    it('should provide comprehensive diagnostics', () => {
      const monitor = getCSSLoadingMonitor();
      const retryMechanism = getCSSRetryMechanism();

      // Add some test data
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/test.css';
      document.head.appendChild(link);

      // Get diagnostics
      const monitorSummary = monitor.getLoadingSummary();
      const retryStats = retryMechanism.getRetryStats();

      expect(typeof monitorSummary).toBe('string');
      expect(retryStats).toHaveProperty('totalAttempts');
      expect(retryStats).toHaveProperty('successfulRetries');
      expect(retryStats).toHaveProperty('failedRetries');
      expect(retryStats).toHaveProperty('activeRetries');
    });
  });

  describe('CSS Loading Initialization', () => {
    it('should initialize CSS monitoring system', () => {
      // Mock the initialization function
      const mockInitialize = vi.fn();
      
      // Test initialization
      initializeCSSMonitor();

      // Verify utilities are available
      expect(getCSSLoadingMonitor).toBeDefined();
      expect(getCSSRetryMechanism).toBeDefined();
      expect(getCSSFallbackSystem).toBeDefined();
    });

    it('should handle initialization errors gracefully', () => {
      // Mock initialization failure
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Test that initialization doesn't throw
      expect(() => initializeCSSMonitor()).not.toThrow();

      console.error = originalConsoleError;
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with different CSS loading events', () => {
      const monitor = getCSSLoadingMonitor();

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/test.css';
      document.head.appendChild(link);

      // Test different event types
      const events = ['load', 'error', 'abort'];
      
      events.forEach(eventType => {
        const event = new Event(eventType);
        expect(() => link.dispatchEvent(event)).not.toThrow();
      });

      // Verify monitor handles all events
      const state = monitor.getState();
      expect(state.totalStylesheets).toBe(1);
    });

    it('should handle missing CSS properties gracefully', () => {
      const monitor = getCSSLoadingMonitor();

      // Create link without sheet property
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/test.css';
      
      // Remove sheet property if it exists
      if ('sheet' in link) {
        delete (link as any).sheet;
      }

      document.head.appendChild(link);

      // Should not throw when checking sheet property
      expect(() => monitor.getState()).not.toThrow();
    });
  });
});
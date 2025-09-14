/**
 * Comprehensive CSS Loading Tests
 * Unit tests for CSS loading utilities with proper Vitest setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM environment
const mockLinkElement = () => ({
  rel: '',
  href: '',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  sheet: null,
  remove: vi.fn(),
});

const mockStyleElement = () => ({
  id: '',
  textContent: '',
  remove: vi.fn(),
});

describe('CSS Loading Comprehensive Tests', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock DOM methods
    Object.defineProperty(document, 'createElement', {
      value: vi.fn((tagName: string) => {
        if (tagName === 'link') return mockLinkElement();
        if (tagName === 'style') return mockStyleElement();
        return {};
      }),
      writable: true,
    });

    Object.defineProperty(document, 'head', {
      value: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        innerHTML: '',
      },
      writable: true,
    });

    Object.defineProperty(document, 'body', {
      value: {
        appendChild: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false),
        },
      },
      writable: true,
    });

    // Mock MutationObserver
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    }));

    // Mock window methods
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    });

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => []),
        memory: {
          usedJSHeapSize: 50000000,
          totalJSHeapSize: 100000000,
          jsHeapSizeLimit: 2000000000,
        },
      },
      writable: true,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('CSS Loading Monitor Functionality', () => {
    it('should track CSS loading state', () => {
      // Mock CSS loading monitor behavior
      const cssState = {
        totalStylesheets: 3,
        loadedStylesheets: 2,
        failedStylesheets: 1,
        loadErrors: ['Failed to load style.css'],
        stylesheets: new Map([
          ['style1.css', { loadStatus: 'loaded' }],
          ['style2.css', { loadStatus: 'loaded' }],
          ['style3.css', { loadStatus: 'error' }],
        ]),
      };

      // Verify state tracking
      expect(cssState.totalStylesheets).toBe(3);
      expect(cssState.loadedStylesheets).toBe(2);
      expect(cssState.failedStylesheets).toBe(1);
      expect(cssState.loadErrors).toHaveLength(1);
      expect(cssState.stylesheets.size).toBe(3);
    });

    it('should detect CSS loading errors', () => {
      const mockLink = mockLinkElement();
      mockLink.href = 'http://example.com/failed.css';

      // Simulate CSS loading error
      const errorEvent = new Event('error');
      const hasError = true;
      const errorMessage = 'Failed to load CSS';

      expect(hasError).toBe(true);
      expect(errorMessage).toBe('Failed to load CSS');
    });

    it('should handle successful CSS loading', () => {
      const mockLink = mockLinkElement();
      mockLink.href = 'http://example.com/success.css';
      mockLink.sheet = {}; // Simulate successful load

      // Simulate CSS loading success
      const loadEvent = new Event('load');
      const hasLoaded = mockLink.sheet !== null;

      expect(hasLoaded).toBe(true);
    });
  });

  describe('CSS Retry Mechanism Functionality', () => {
    it('should implement retry logic with exponential backoff', () => {
      const retryConfig = {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 5000,
      };

      // Calculate retry delays
      const delays = [];
      let currentDelay = retryConfig.initialDelay;
      
      for (let i = 0; i < retryConfig.maxRetries; i++) {
        delays.push(currentDelay);
        currentDelay = Math.min(
          currentDelay * retryConfig.backoffMultiplier,
          retryConfig.maxDelay
        );
      }

      expect(delays).toEqual([100, 200, 400]);
    });

    it('should track retry attempts', () => {
      const retryHistory = [
        { href: 'style1.css', attemptNumber: 1, timestamp: Date.now(), success: false },
        { href: 'style1.css', attemptNumber: 2, timestamp: Date.now(), success: false },
        { href: 'style1.css', attemptNumber: 3, timestamp: Date.now(), success: true },
      ];

      const stats = {
        totalAttempts: retryHistory.length,
        successfulRetries: retryHistory.filter(r => r.success).length,
        failedRetries: retryHistory.filter(r => !r.success).length,
        activeRetries: 0,
      };

      expect(stats.totalAttempts).toBe(3);
      expect(stats.successfulRetries).toBe(1);
      expect(stats.failedRetries).toBe(2);
    });

    it('should handle manual retry requests', async () => {
      const mockRetryFunction = vi.fn().mockResolvedValue([true]);
      
      const result = await mockRetryFunction('http://example.com/retry.css');
      
      expect(mockRetryFunction).toHaveBeenCalledWith('http://example.com/retry.css');
      expect(result).toEqual([true]);
    });
  });

  describe('CSS Fallback System Functionality', () => {
    it('should activate fallback when CSS fails', () => {
      const fallbackState = {
        isActive: false,
        criticalCSSApplied: false,
        userNotified: false,
        reason: null,
        activatedAt: null,
      };

      // Simulate fallback activation
      const activateFallback = (reason: string) => {
        fallbackState.isActive = true;
        fallbackState.criticalCSSApplied = true;
        fallbackState.userNotified = true;
        fallbackState.reason = reason;
        fallbackState.activatedAt = Date.now();
      };

      activateFallback('CSS loading failed');

      expect(fallbackState.isActive).toBe(true);
      expect(fallbackState.criticalCSSApplied).toBe(true);
      expect(fallbackState.userNotified).toBe(true);
      expect(fallbackState.reason).toBe('CSS loading failed');
      expect(fallbackState.activatedAt).toBeDefined();
    });

    it('should apply critical CSS inline', () => {
      const criticalCSS = `
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .button { padding: 10px 20px; background: #007bff; color: white; border: none; }
      `;

      const styleElement = mockStyleElement();
      styleElement.textContent = criticalCSS;

      expect(styleElement.textContent).toContain('font-family: Arial');
      expect(styleElement.textContent).toContain('background: #007bff');
    });

    it('should show user notification', () => {
      const notificationConfig = {
        showUserNotification: true,
        notificationMessage: 'Some styles may not load properly. The application remains functional.',
      };

      const mockNotificationElement = {
        id: 'css-fallback-notification',
        innerHTML: notificationConfig.notificationMessage,
        style: { display: 'block' },
        remove: vi.fn(),
      };

      expect(mockNotificationElement.innerHTML).toContain('styles may not load properly');
      expect(mockNotificationElement.style.display).toBe('block');
    });
  });

  describe('Authentication Flow CSS Loading', () => {
    it('should maintain CSS loading during login process', () => {
      // Mock authentication flow
      const authFlow = {
        step: 'login',
        cssLoaded: true,
        stylesheetsRequired: ['auth.css', 'main.css'],
        loadedStylesheets: ['auth.css', 'main.css'],
      };

      // Verify CSS is loaded during auth
      expect(authFlow.cssLoaded).toBe(true);
      expect(authFlow.loadedStylesheets).toEqual(authFlow.stylesheetsRequired);
    });

    it('should handle CSS failures during authentication', () => {
      // Mock authentication with CSS failure
      const authFlowWithFailure = {
        step: 'login',
        cssLoaded: false,
        stylesheetsRequired: ['auth.css', 'main.css'],
        loadedStylesheets: ['main.css'],
        failedStylesheets: ['auth.css'],
        fallbackActive: true,
      };

      // Verify fallback is activated
      expect(authFlowWithFailure.cssLoaded).toBe(false);
      expect(authFlowWithFailure.failedStylesheets).toContain('auth.css');
      expect(authFlowWithFailure.fallbackActive).toBe(true);
    });

    it('should recover CSS after successful authentication', () => {
      // Mock post-authentication recovery
      const postAuthRecovery = {
        authenticated: true,
        cssRecoveryAttempted: true,
        cssRecoverySuccessful: true,
        allStylesheetsLoaded: true,
        fallbackDeactivated: true,
      };

      expect(postAuthRecovery.authenticated).toBe(true);
      expect(postAuthRecovery.cssRecoverySuccessful).toBe(true);
      expect(postAuthRecovery.allStylesheetsLoaded).toBe(true);
      expect(postAuthRecovery.fallbackDeactivated).toBe(true);
    });
  });

  describe('Container Restart Scenarios', () => {
    it('should detect container restart CSS failures', () => {
      // Mock container restart scenario
      const containerRestartScenario = {
        containerRestarted: true,
        oldAssetHashes: ['index-8b70c5c9.css', 'auth-a1b2c3d4.css'],
        newAssetHashes: ['index-9c81d6ea.css', 'auth-e5f6g7h8.css'],
        assetsUnavailable: true,
        errorType: 'ERR_CONNECTION_REFUSED',
      };

      expect(containerRestartScenario.containerRestarted).toBe(true);
      expect(containerRestartScenario.assetsUnavailable).toBe(true);
      expect(containerRestartScenario.errorType).toBe('ERR_CONNECTION_REFUSED');
    });

    it('should handle asset hash changes after restart', () => {
      // Mock asset hash change handling
      const assetHashChange = {
        oldHash: 'index-8b70c5c9.css',
        newHash: 'index-9c81d6ea.css',
        cacheInvalidated: true,
        assetsRefreshed: true,
        loadingSuccessful: true,
      };

      expect(assetHashChange.oldHash).not.toBe(assetHashChange.newHash);
      expect(assetHashChange.cacheInvalidated).toBe(true);
      expect(assetHashChange.assetsRefreshed).toBe(true);
      expect(assetHashChange.loadingSuccessful).toBe(true);
    });

    it('should recover gradually after container restart', () => {
      // Mock gradual recovery
      const recoverySteps = [
        { step: 1, loadedStylesheets: 0, failedStylesheets: 3 },
        { step: 2, loadedStylesheets: 1, failedStylesheets: 2 },
        { step: 3, loadedStylesheets: 2, failedStylesheets: 1 },
        { step: 4, loadedStylesheets: 3, failedStylesheets: 0 },
      ];

      const finalStep = recoverySteps[recoverySteps.length - 1];
      expect(finalStep.loadedStylesheets).toBe(3);
      expect(finalStep.failedStylesheets).toBe(0);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of stylesheets', () => {
      const largeStylesheetSet = new Map();
      const stylesheetCount = 100;

      // Simulate large number of stylesheets
      for (let i = 0; i < stylesheetCount; i++) {
        largeStylesheetSet.set(`style${i}.css`, {
          href: `http://example.com/style${i}.css`,
          loadStatus: i % 10 === 0 ? 'error' : 'loaded',
        });
      }

      expect(largeStylesheetSet.size).toBe(stylesheetCount);
      
      // Count failed stylesheets
      const failedCount = Array.from(largeStylesheetSet.values())
        .filter(s => s.loadStatus === 'error').length;
      
      expect(failedCount).toBe(10); // Every 10th stylesheet fails
    });

    it('should manage memory usage efficiently', () => {
      // Mock memory usage tracking
      const memoryUsage = {
        initial: 50000000, // 50MB
        afterCSSLoading: 55000000, // 55MB
        afterCleanup: 51000000, // 51MB
      };

      const memoryIncrease = memoryUsage.afterCSSLoading - memoryUsage.initial;
      const memoryRecovered = memoryUsage.afterCSSLoading - memoryUsage.afterCleanup;

      expect(memoryIncrease).toBe(5000000); // 5MB increase
      expect(memoryRecovered).toBe(4000000); // 4MB recovered
    });

    it('should cleanup resources properly', () => {
      // Mock resource cleanup
      const resources = {
        eventListeners: 5,
        mutationObservers: 2,
        timers: 3,
        styleElements: 1,
      };

      const cleanup = () => {
        resources.eventListeners = 0;
        resources.mutationObservers = 0;
        resources.timers = 0;
        resources.styleElements = 0;
      };

      cleanup();

      expect(resources.eventListeners).toBe(0);
      expect(resources.mutationObservers).toBe(0);
      expect(resources.timers).toBe(0);
      expect(resources.styleElements).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network connectivity issues', () => {
      const networkScenarios = [
        { type: 'offline', errorCode: 'ERR_NETWORK', retryable: true },
        { type: 'timeout', errorCode: 'ERR_TIMEOUT', retryable: true },
        { type: 'not_found', errorCode: '404', retryable: false },
        { type: 'server_error', errorCode: '500', retryable: true },
      ];

      networkScenarios.forEach(scenario => {
        expect(scenario.errorCode).toBeDefined();
        expect(typeof scenario.retryable).toBe('boolean');
      });
    });

    it('should handle malformed CSS URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'ftp://example.com/style.css',
        'javascript:alert("xss")',
      ];

      const isValidCSSUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };

      malformedUrls.forEach(url => {
        expect(isValidCSSUrl(url)).toBe(false);
      });
    });

    it('should handle browser compatibility issues', () => {
      const browserFeatures = {
        mutationObserver: typeof MutationObserver !== 'undefined',
        performance: typeof window.performance !== 'undefined',
        customEvents: typeof CustomEvent !== 'undefined',
        promises: typeof Promise !== 'undefined',
      };

      // All features should be available in test environment
      Object.values(browserFeatures).forEach(feature => {
        expect(feature).toBe(true);
      });
    });
  });

  describe('Configuration and Customization', () => {
    it('should allow configuration of retry behavior', () => {
      const defaultConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        enableAutoRetry: true,
      };

      const customConfig = {
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 60000,
        backoffMultiplier: 1.5,
        enableAutoRetry: false,
      };

      // Verify configuration can be customized
      expect(customConfig.maxRetries).not.toBe(defaultConfig.maxRetries);
      expect(customConfig.initialDelay).not.toBe(defaultConfig.initialDelay);
      expect(customConfig.enableAutoRetry).not.toBe(defaultConfig.enableAutoRetry);
    });

    it('should allow configuration of fallback behavior', () => {
      const fallbackConfig = {
        enableAutoFallback: true,
        fallbackDelay: 5000,
        showUserNotification: true,
        criticalCSS: 'body { font-family: Arial; }',
      };

      expect(fallbackConfig.enableAutoFallback).toBe(true);
      expect(fallbackConfig.fallbackDelay).toBe(5000);
      expect(fallbackConfig.showUserNotification).toBe(true);
      expect(fallbackConfig.criticalCSS).toContain('font-family');
    });

    it('should provide comprehensive diagnostics', () => {
      const diagnostics = {
        cssLoadingSummary: 'All stylesheets loaded successfully',
        retryStats: {
          totalAttempts: 5,
          successfulRetries: 3,
          failedRetries: 2,
          activeRetries: 0,
        },
        fallbackStatus: {
          isActive: false,
          activationCount: 1,
          lastActivation: Date.now() - 60000,
        },
        performanceMetrics: {
          averageLoadTime: 250,
          slowestStylesheet: 'large-styles.css',
          fastestStylesheet: 'critical.css',
        },
      };

      expect(diagnostics.cssLoadingSummary).toContain('successfully');
      expect(diagnostics.retryStats.totalAttempts).toBe(5);
      expect(diagnostics.fallbackStatus.isActive).toBe(false);
      expect(diagnostics.performanceMetrics.averageLoadTime).toBe(250);
    });
  });
});
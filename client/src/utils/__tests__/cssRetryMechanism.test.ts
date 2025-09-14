import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CSSRetryMechanism, getCSSRetryMechanism } from '../cssRetryMechanism';
import { getCSSLoadingMonitor } from '../cssLoadingMonitor';

// Mock the CSS loading monitor
vi.mock('../cssLoadingMonitor', () => ({
  getCSSLoadingMonitor: vi.fn(),
}));

describe('CSSRetryMechanism', () => {
  let retryMechanism: CSSRetryMechanism;
  let mockMonitor: any;
  let mockAddListener: Mock;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    
    // Mock CSS loading monitor
    mockAddListener = vi.fn();
    mockMonitor = {
      addListener: mockAddListener,
      getFailedStylesheets: vi.fn(() => []),
      getState: vi.fn(() => ({
        stylesheets: new Map(),
        loadErrors: [],
        totalStylesheets: 0,
        loadedStylesheets: 0,
        failedStylesheets: 0,
      })),
    };
    
    (getCSSLoadingMonitor as Mock).mockReturnValue(mockMonitor);

    // Create fresh instance
    retryMechanism = new CSSRetryMechanism({
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      enableAutoRetry: true,
    });
  });

  afterEach(() => {
    retryMechanism?.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const state = retryMechanism.getState();
      expect(state.config.maxRetries).toBe(2);
      expect(state.config.initialDelay).toBe(100);
      expect(state.config.enableAutoRetry).toBe(true);
    });

    it('should subscribe to CSS loading monitor', () => {
      expect(mockAddListener).toHaveBeenCalled();
    });
  });

  describe('retry scheduling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should schedule retry for failed stylesheet', () => {
      const mockStylesheet = {
        href: 'http://example.com/test.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed',
      };

      // Simulate CSS monitor detecting failed stylesheet
      const monitorCallback = mockAddListener.mock.calls[0][0];
      mockMonitor.getFailedStylesheets.mockReturnValue([mockStylesheet]);
      
      monitorCallback({});

      const state = retryMechanism.getState();
      expect(state.activeRetries.has(mockStylesheet.href)).toBe(true);
      expect(state.isRetrying).toBe(true);
    });

    it('should implement exponential backoff', () => {
      const mockStylesheet = {
        href: 'http://example.com/test.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed',
      };

      // First retry
      const monitorCallback = mockAddListener.mock.calls[0][0];
      mockMonitor.getFailedStylesheets.mockReturnValue([mockStylesheet]);
      monitorCallback({});

      let state = retryMechanism.getState();
      expect(state.activeRetries.get(mockStylesheet.href)).toBe(1);

      // Advance time to trigger first retry
      vi.advanceTimersByTime(100);

      // Second retry should be scheduled with longer delay
      state = retryMechanism.getState();
      expect(state.activeRetries.get(mockStylesheet.href)).toBe(2);
    });

    it('should respect max retry limit', () => {
      const mockStylesheet = {
        href: 'http://example.com/test.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed',
      };

      // Trigger retries up to the limit
      const monitorCallback = mockAddListener.mock.calls[0][0];
      mockMonitor.getFailedStylesheets.mockReturnValue([mockStylesheet]);
      
      // First failure
      monitorCallback({});
      vi.advanceTimersByTime(100);
      
      // Second failure
      vi.advanceTimersByTime(200);
      
      // Third failure should not schedule another retry
      vi.advanceTimersByTime(400);

      const state = retryMechanism.getState();
      expect(state.activeRetries.has(mockStylesheet.href)).toBe(false);
    });
  });

  describe('manual retry', () => {
    it('should manually retry specific stylesheet', async () => {
      // Create a mock link element in DOM
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://example.com/test.css';
      document.head.appendChild(link);

      // Mock successful load
      setTimeout(() => {
        const event = new Event('load');
        link.dispatchEvent(event);
      }, 50);

      const result = await retryMechanism.manualRetry('http://example.com/test.css');
      expect(result).toEqual([true]);
    });

    it('should manually retry all failed stylesheets', async () => {
      const mockFailedStylesheets = [
        {
          href: 'http://example.com/test1.css',
          element: document.createElement('link') as HTMLLinkElement,
          loadStatus: 'error' as const,
        },
        {
          href: 'http://example.com/test2.css',
          element: document.createElement('link') as HTMLLinkElement,
          loadStatus: 'error' as const,
        },
      ];

      mockMonitor.getFailedStylesheets.mockReturnValue(mockFailedStylesheets);

      // Create mock link elements
      mockFailedStylesheets.forEach(stylesheet => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet.href;
        document.head.appendChild(link);
      });

      const results = await retryMechanism.manualRetry();
      expect(results).toHaveLength(2);
    });
  });

  describe('manual refresh', () => {
    it('should refresh all CSS assets', async () => {
      const mockAllStylesheets = [
        {
          href: 'http://example.com/test1.css',
          element: document.createElement('link') as HTMLLinkElement,
          loadStatus: 'loaded' as const,
        },
        {
          href: 'http://example.com/test2.css',
          element: document.createElement('link') as HTMLLinkElement,
          loadStatus: 'error' as const,
        },
      ];

      mockMonitor.getState.mockReturnValue({
        stylesheets: new Map(mockAllStylesheets.map(s => [s.href, s])),
        loadErrors: [],
        totalStylesheets: 2,
        loadedStylesheets: 1,
        failedStylesheets: 1,
      });

      // Create mock link elements
      mockAllStylesheets.forEach(stylesheet => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet.href;
        document.head.appendChild(link);
      });

      const results = await retryMechanism.manualRefreshAllCSS();
      expect(results).toHaveLength(2);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      retryMechanism.updateConfig({
        maxRetries: 5,
        enableAutoRetry: false,
      });

      const state = retryMechanism.getState();
      expect(state.config.maxRetries).toBe(5);
      expect(state.config.enableAutoRetry).toBe(false);
    });

    it('should disable auto retry when configured', () => {
      retryMechanism.updateConfig({ enableAutoRetry: false });

      const mockStylesheet = {
        href: 'http://example.com/test.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed',
      };

      const monitorCallback = mockAddListener.mock.calls[0][0];
      mockMonitor.getFailedStylesheets.mockReturnValue([mockStylesheet]);
      monitorCallback({});

      const state = retryMechanism.getState();
      expect(state.activeRetries.size).toBe(0);
    });
  });

  describe('retry statistics', () => {
    it('should track retry statistics', () => {
      const stats = retryMechanism.getRetryStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulRetries).toBe(0);
      expect(stats.failedRetries).toBe(0);
      expect(stats.activeRetries).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should cancel all retries', () => {
      vi.useFakeTimers();
      
      const mockStylesheet = {
        href: 'http://example.com/test.css',
        element: document.createElement('link') as HTMLLinkElement,
        loadStatus: 'error' as const,
        errorMessage: 'Load failed',
      };

      // Schedule a retry
      const monitorCallback = mockAddListener.mock.calls[0][0];
      mockMonitor.getFailedStylesheets.mockReturnValue([mockStylesheet]);
      monitorCallback({});

      expect(retryMechanism.getState().isRetrying).toBe(true);

      retryMechanism.cancelAllRetries();

      const state = retryMechanism.getState();
      expect(state.isRetrying).toBe(false);
      expect(state.activeRetries.size).toBe(0);
    });

    it('should clear retry history', () => {
      // Add some history manually for testing
      const state = retryMechanism.getState();
      state.retryHistory.push({
        href: 'test.css',
        attemptNumber: 1,
        timestamp: Date.now(),
        success: false,
      });

      retryMechanism.clearRetryHistory();

      expect(retryMechanism.getState().retryHistory).toHaveLength(0);
    });

    it('should destroy properly', () => {
      retryMechanism.destroy();

      // Should not throw when calling methods after destroy
      expect(() => retryMechanism.getState()).not.toThrow();
    });
  });
});

describe('utility functions', () => {
  beforeEach(() => {
    // Reset singleton
    (getCSSRetryMechanism as any).cssRetryInstance = null;
  });

  it('should create singleton instance', () => {
    const instance1 = getCSSRetryMechanism();
    const instance2 = getCSSRetryMechanism();
    expect(instance1).toBe(instance2);
  });
});
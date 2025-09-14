/**
 * Tests for CSS Error Reporting utility
 */

import { CSSErrorReporter, cssErrorReporter, CSSError } from '../cssErrorReporting';

// Mock fetch
global.fetch = jest.fn();

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-route'
  }
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'test-user-agent'
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('CSSErrorReporter', () => {
  let reporter: CSSErrorReporter;

  beforeEach(() => {
    reporter = new CSSErrorReporter();
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Error Reporting', () => {
    it('should create and report CSS load failure error', async () => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: true });

      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0,
        errorMessage: 'CSS file failed to load'
      };

      reporter.reportError(error);

      // Wait for debounced send
      await new Promise(resolve => setTimeout(resolve, 2100));

      expect(mockFetch).toHaveBeenCalledWith('/api/css-monitoring/report-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('load_failure')
      });
    });

    it('should batch multiple errors', async () => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: true });

      const error1: CSSError = {
        type: 'parse_error',
        url: 'https://example.com/styles1.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      const error2: CSSError = {
        type: 'network_error',
        url: 'https://example.com/styles2.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 1
      };

      reporter.reportError(error1);
      reporter.reportError(error2);

      // Wait for debounced send
      await new Promise(resolve => setTimeout(resolve, 2100));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.errors).toHaveLength(2);
    });

    it('should send critical errors immediately', async () => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: true });

      const criticalError: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/critical.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0,
        errorMessage: 'Critical CSS failed to load'
      };

      reporter.reportError(criticalError);

      // Should send immediately, not wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Summary', () => {
    it('should provide error summary', () => {
      const error1: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles1.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      const error2: CSSError = {
        type: 'parse_error',
        url: 'https://example.com/styles2.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error1);
      reporter.reportError(error2);

      const summary = reporter.getErrorSummary();

      expect(summary.totalErrors).toBe(2);
      expect(summary.errorsByType).toEqual({
        load_failure: 1,
        parse_error: 1
      });
    });

    it('should clear errors', () => {
      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error);
      expect(reporter.getErrorSummary().totalErrors).toBe(1);

      reporter.clearErrors();
      expect(reporter.getErrorSummary().totalErrors).toBe(0);
    });
  });

  describe('Authentication Detection', () => {
    it('should detect authenticated user from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('fake-token');

      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error);

      // The authentication check happens during error reporting
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });

    it('should detect authenticated user from sessionStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue('session-token');

      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error);

      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('token');
    });
  });

  describe('DOM Monitoring', () => {
    it('should monitor existing stylesheets on initialization', () => {
      // Mock document.querySelectorAll
      const mockLink = {
        addEventListener: jest.fn(),
        href: 'https://example.com/styles.css'
      };

      const querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll');
      querySelectorAllSpy.mockReturnValue([mockLink] as any);

      // Create new reporter to trigger initialization
      new CSSErrorReporter();

      expect(querySelectorAllSpy).toHaveBeenCalledWith('link[rel="stylesheet"]');
      expect(mockLink.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockLink.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));

      querySelectorAllSpy.mockRestore();
    });
  });

  describe('Network Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error);

      // Wait for immediate send (load_failure)
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('Error sending CSS error report:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle non-ok responses', async () => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Server Error' });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const error: CSSError = {
        type: 'load_failure',
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: 'test-user-agent',
        route: '/test-route',
        retryCount: 0
      };

      reporter.reportError(error);

      // Wait for immediate send
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send CSS error report:', 'Server Error');

      consoleSpy.mockRestore();
    });
  });
});

describe('cssErrorReporter singleton', () => {
  it('should export a singleton instance', () => {
    expect(cssErrorReporter).toBeInstanceOf(CSSErrorReporter);
  });

  it('should maintain state across imports', () => {
    const error: CSSError = {
      type: 'load_failure',
      url: 'https://example.com/singleton-test.css',
      timestamp: new Date(),
      userAgent: 'test-user-agent',
      route: '/test-route',
      retryCount: 0
    };

    cssErrorReporter.reportError(error);
    expect(cssErrorReporter.getErrorSummary().totalErrors).toBe(1);
  });
});
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import AssetHealthDiagnostic from '../assetHealthDiagnostic';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as Mock;

// Mock performance
global.performance = {
  now: vi.fn(() => 1000)
} as any;

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    onLine: true,
    cookieEnabled: true
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    styleSheets: [],
    querySelectorAll: vi.fn(() => [])
  },
  writable: true
});

describe('AssetHealthDiagnostic', () => {
  let diagnostic: AssetHealthDiagnostic;

  beforeEach(() => {
    vi.clearAllMocks();
    diagnostic = new AssetHealthDiagnostic('http://localhost:3000', 5000);
  });

  describe('diagnoseAsset', () => {
    it('should return healthy result for successful CSS asset', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'text/css'],
          ['content-length', '1024'],
          ['cache-control', 'public, max-age=31536000']
        ])
      };

      mockResponse.headers.forEach = vi.fn((callback) => {
        callback('text/css', 'content-type');
        callback('1024', 'content-length');
        callback('public, max-age=31536000', 'cache-control');
      });

      mockResponse.headers.get = vi.fn((key: string) => {
        const headers: Record<string, string> = {
          'content-type': 'text/css',
          'content-length': '1024',
          'cache-control': 'public, max-age=31536000'
        };
        return headers[key] || null;
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await diagnostic.diagnoseAsset('/assets/index.css');

      expect(result.checks.networkConnectivity).toBe(true);
      expect(result.checks.dnsResolution).toBe(true);
      expect(result.checks.httpResponse).toBe(true);
      expect(result.checks.contentType).toBe(true);
      expect(result.checks.contentSize).toBe(true);
      expect(result.checks.cacheHeaders).toBe(true);
      expect(result.details.responseStatus).toBe(200);
      expect(result.details.contentLength).toBe(1024);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should detect 404 errors and provide recommendations', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Map()
      };

      mockResponse.headers.forEach = vi.fn();
      mockResponse.headers.get = vi.fn(() => null);

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await diagnostic.diagnoseAsset('/assets/missing.css');

      expect(result.checks.httpResponse).toBe(false);
      expect(result.details.responseStatus).toBe(404);
      expect(result.recommendations).toContain('Asset file not found - check build output');
    });

    it('should detect incorrect content type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'text/html']
        ])
      };

      mockResponse.headers.forEach = vi.fn((callback) => {
        callback('text/html', 'content-type');
      });

      mockResponse.headers.get = vi.fn((key: string) => {
        return key === 'content-type' ? 'text/html' : null;
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await diagnostic.diagnoseAsset('/assets/index.css');

      expect(result.checks.contentType).toBe(false);
      expect(result.recommendations).toContain("Expected content-type 'text/css', got 'text/html'");
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await diagnostic.diagnoseAsset('/assets/index.css');

      expect(result.checks.dnsResolution).toBe(false);
      expect(result.checks.httpResponse).toBe(false);
      expect(result.details.errorMessage).toBe('Failed to fetch');
      expect(result.recommendations).toContain('Network error - check CORS configuration or network connectivity');
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await diagnostic.diagnoseAsset('/assets/index.css');

      expect(result.details.errorMessage).toBe('The operation was aborted');
      expect(result.recommendations).toContain('Request timeout - check network speed or server response time');
    });

    it('should detect offline status', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const result = await diagnostic.diagnoseAsset('/assets/index.css');

      expect(result.checks.networkConnectivity).toBe(false);
      expect(result.recommendations).toContain('Check internet connection');
    });
  });

  describe('getSystemDiagnostic', () => {
    beforeEach(() => {
      // Reset navigator to online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });
    });

    it('should return comprehensive system information', () => {
      const mockStyleSheets = [
        { cssRules: [{ selectorText: '.test' }] },
        { cssRules: [{ selectorText: '.test2' }] }
      ];

      const mockLinkElements = [
        { href: 'http://localhost:3000/assets/index.css', sheet: {} },
        { href: 'http://localhost:3000/assets/vendor.css', sheet: null }
      ];

      Object.defineProperty(document, 'styleSheets', {
        value: mockStyleSheets
      });

      document.querySelectorAll = vi.fn(() => mockLinkElements as any);

      const result = diagnostic.getSystemDiagnostic();

      expect(result.browser.name).toBe('Chrome');
      expect(result.browser.cookiesEnabled).toBe(true);
      expect(result.browser.localStorageEnabled).toBe(true);
      expect(result.network.online).toBe(true);
      expect(result.css.totalStylesheets).toBe(2);
      expect(result.css.loadedStylesheets).toBe(2);
      expect(result.css.failedStylesheets).toBe(1);
      expect(result.css.stylesheetUrls).toEqual([
        'http://localhost:3000/assets/index.css',
        'http://localhost:3000/assets/vendor.css'
      ]);
    });

    it('should detect browser type correctly', () => {
      // Test Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      });

      let result = diagnostic.getSystemDiagnostic();
      expect(result.browser.name).toBe('Firefox');

      // Test Safari
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      });

      result = diagnostic.getSystemDiagnostic();
      expect(result.browser.name).toBe('Safari');
    });

    it('should handle localStorage access errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      const result = diagnostic.getSystemDiagnostic();
      expect(result.browser.localStorageEnabled).toBe(false);
    });
  });

  describe('diagnoseAllAssets', () => {
    it('should diagnose all CSS assets in document', async () => {
      const mockLinkElements = [
        { href: 'http://localhost:3000/assets/index.css' },
        { href: 'http://localhost:3000/assets/vendor.css' },
        { href: 'http://localhost:3000/favicon.ico' } // Should be filtered out
      ];

      document.querySelectorAll = vi.fn(() => mockLinkElements as any);

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/css']])
      };

      mockResponse.headers.forEach = vi.fn((callback) => {
        callback('text/css', 'content-type');
      });

      mockResponse.headers.get = vi.fn((key: string) => {
        return key === 'content-type' ? 'text/css' : null;
      });

      mockFetch.mockResolvedValue(mockResponse);

      const results = await diagnostic.diagnoseAllAssets();

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe('http://localhost:3000/assets/index.css');
      expect(results[1].url).toBe('http://localhost:3000/assets/vendor.css');
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive diagnostic report', async () => {
      const mockLinkElements = [
        { href: 'http://localhost:3000/assets/index.css', sheet: {} }
      ];

      document.querySelectorAll = vi.fn(() => mockLinkElements as any);

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'text/css'],
          ['content-length', '1024']
        ])
      };

      mockResponse.headers.forEach = vi.fn((callback) => {
        callback('text/css', 'content-type');
        callback('1024', 'content-length');
      });

      mockResponse.headers.get = vi.fn((key: string) => {
        const headers: Record<string, string> = {
          'content-type': 'text/css',
          'content-length': '1024'
        };
        return headers[key] || null;
      });

      mockFetch.mockResolvedValue(mockResponse);

      const report = await diagnostic.generateReport();

      expect(report.system).toBeDefined();
      expect(report.assets).toHaveLength(1);
      expect(report.summary.totalAssets).toBe(1);
      expect(report.summary.healthyAssets).toBe(1);
      expect(report.summary.issues).toHaveLength(0);
    });

    it('should identify issues and provide recommendations', async () => {
      const mockLinkElements = [
        { href: 'http://localhost:3000/assets/broken.css', sheet: null }
      ];

      document.querySelectorAll = vi.fn(() => mockLinkElements as any);
      Object.defineProperty(document, 'styleSheets', { value: [] });

      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Map()
      };

      mockResponse.headers.forEach = vi.fn();
      mockResponse.headers.get = vi.fn(() => null);

      mockFetch.mockResolvedValue(mockResponse);

      const report = await diagnostic.generateReport();

      expect(report.summary.healthyAssets).toBe(0);
      expect(report.summary.issues.length).toBeGreaterThan(0);
      expect(report.summary.recommendations.length).toBeGreaterThan(0);
      expect(report.system.css.failedStylesheets).toBe(1);
    });
  });
});
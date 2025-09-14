import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  generateCacheBustParam,
  addCacheBustingToUrl,
  extractAssetHash,
  getCurrentAssetVersion,
  hasAssetVersionChanged,
  CacheClearingUtility,
  AssetVersionChecker,
  CacheInvalidationManager,
  AssetVersion
} from '../cacheInvalidation';

// Mock DOM methods
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

const mockSessionStorage = {
  removeItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn()
  },
  writable: true
});

// Mock document methods
const mockQuerySelectorAll = vi.fn();
Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll
});

const mockCreateElement = vi.fn();
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
});

const mockHead = {
  appendChild: vi.fn()
};
Object.defineProperty(document, 'head', {
  value: mockHead
});

// Mock fetch
global.fetch = vi.fn();

describe('Cache Invalidation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCacheBustParam', () => {
    it('should generate unique cache bust parameters', () => {
      const param1 = generateCacheBustParam();
      const param2 = generateCacheBustParam();
      
      expect(param1).toMatch(/^cb=\d+_[a-z0-9]+$/);
      expect(param2).toMatch(/^cb=\d+_[a-z0-9]+$/);
      expect(param1).not.toBe(param2);
    });
  });

  describe('addCacheBustingToUrl', () => {
    it('should add cache busting parameter to URL without query string', () => {
      const url = 'https://example.com/style.css';
      const result = addCacheBustingToUrl(url, { cacheBustParam: 'cb=123_abc' });
      
      expect(result).toBe('https://example.com/style.css?cb=123_abc');
    });

    it('should add cache busting parameter to URL with existing query string', () => {
      const url = 'https://example.com/style.css?version=1';
      const result = addCacheBustingToUrl(url, { cacheBustParam: 'cb=123_abc' });
      
      expect(result).toBe('https://example.com/style.css?version=1&cb=123_abc');
    });

    it('should generate cache bust param if not provided', () => {
      const url = 'https://example.com/style.css';
      const result = addCacheBustingToUrl(url);
      
      expect(result).toMatch(/^https:\/\/example\.com\/style\.css\?cb=\d+_[a-z0-9]+$/);
    });
  });

  describe('extractAssetHash', () => {
    it('should extract hash from bundled CSS filename', () => {
      const filename = '/assets/index-abc123def.css';
      const hash = extractAssetHash(filename);
      
      expect(hash).toBe('abc123def');
    });

    it('should return null for non-bundled CSS filename', () => {
      const filename = '/assets/style.css';
      const hash = extractAssetHash(filename);
      
      expect(hash).toBeNull();
    });

    it('should return null for invalid filename', () => {
      const filename = 'invalid-filename';
      const hash = extractAssetHash(filename);
      
      expect(hash).toBeNull();
    });
  });

  describe('getCurrentAssetVersion', () => {
    it('should return asset version for valid CSS path', () => {
      const cssPath = '/assets/index-abc123def.css';
      const version = getCurrentAssetVersion(cssPath);
      
      expect(version).toMatchObject({
        path: cssPath,
        hash: 'abc123def',
        timestamp: expect.any(Number),
        version: expect.stringMatching(/^abc123def-\d+$/)
      });
    });

    it('should return null for invalid CSS path', () => {
      const cssPath = '/assets/style.css';
      const version = getCurrentAssetVersion(cssPath);
      
      expect(version).toBeNull();
    });
  });

  describe('hasAssetVersionChanged', () => {
    it('should detect hash changes', () => {
      const version1: AssetVersion = {
        path: '/assets/index-abc123.css',
        hash: 'abc123',
        timestamp: 1000,
        version: 'abc123-1000'
      };
      
      const version2: AssetVersion = {
        path: '/assets/index-def456.css',
        hash: 'def456',
        timestamp: 2000,
        version: 'def456-2000'
      };
      
      expect(hasAssetVersionChanged(version2, version1)).toBe(true);
    });

    it('should detect path changes', () => {
      const version1: AssetVersion = {
        path: '/assets/index-abc123.css',
        hash: 'abc123',
        timestamp: 1000,
        version: 'abc123-1000'
      };
      
      const version2: AssetVersion = {
        path: '/assets/main-abc123.css',
        hash: 'abc123',
        timestamp: 2000,
        version: 'abc123-2000'
      };
      
      expect(hasAssetVersionChanged(version2, version1)).toBe(true);
    });

    it('should return false for identical versions', () => {
      const version1: AssetVersion = {
        path: '/assets/index-abc123.css',
        hash: 'abc123',
        timestamp: 1000,
        version: 'abc123-1000'
      };
      
      const version2: AssetVersion = {
        path: '/assets/index-abc123.css',
        hash: 'abc123',
        timestamp: 2000,
        version: 'abc123-2000'
      };
      
      expect(hasAssetVersionChanged(version2, version1)).toBe(false);
    });
  });

  describe('CacheClearingUtility', () => {
    describe('clearStoredVersions', () => {
      it('should clear localStorage and sessionStorage', () => {
        CacheClearingUtility.clearStoredVersions();
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('css_asset_versions');
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('css_asset_versions');
      });

      it('should handle storage errors gracefully', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        expect(() => CacheClearingUtility.clearStoredVersions()).not.toThrow();
      });
    });

    describe('storeAssetVersion', () => {
      it('should store asset version in localStorage', () => {
        const version: AssetVersion = {
          path: '/assets/index-abc123.css',
          hash: 'abc123',
          timestamp: 1000,
          version: 'abc123-1000'
        };
        
        mockLocalStorage.getItem.mockReturnValue('{}');
        
        CacheClearingUtility.storeAssetVersion(version);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'css_asset_versions',
          JSON.stringify({ [version.path]: version })
        );
      });

      it('should handle storage errors gracefully', () => {
        const version: AssetVersion = {
          path: '/assets/index-abc123.css',
          hash: 'abc123',
          timestamp: 1000,
          version: 'abc123-1000'
        };
        
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        expect(() => CacheClearingUtility.storeAssetVersion(version)).not.toThrow();
      });
    });

    describe('getStoredVersions', () => {
      it('should return stored versions from localStorage', () => {
        const storedData = {
          '/assets/index-abc123.css': {
            path: '/assets/index-abc123.css',
            hash: 'abc123',
            timestamp: 1000,
            version: 'abc123-1000'
          }
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
        
        const result = CacheClearingUtility.getStoredVersions();
        
        expect(result).toEqual(storedData);
      });

      it('should return empty object if no stored data', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const result = CacheClearingUtility.getStoredVersions();
        
        expect(result).toEqual({});
      });

      it('should handle storage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        const result = CacheClearingUtility.getStoredVersions();
        
        expect(result).toEqual({});
      });
    });

    describe('forceHardRefresh', () => {
      it('should clear stored versions and reload page', () => {
        CacheClearingUtility.forceHardRefresh();
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('css_asset_versions');
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    describe('clearCSSCache', () => {
      it('should reload CSS stylesheets with cache busting', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css',
          parentNode: {
            replaceChild: vi.fn()
          }
        };
        
        const mockNewLink = {
          rel: '',
          type: '',
          href: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        mockCreateElement.mockReturnValue(mockNewLink);
        
        const promise = CacheClearingUtility.clearCSSCache();
        
        // Simulate successful load
        if (mockNewLink.onload) {
          mockNewLink.onload();
        }
        
        await promise;
        
        expect(mockCreateElement).toHaveBeenCalledWith('link');
        expect(mockHead.appendChild).toHaveBeenCalledWith(mockNewLink);
      });
    });
  });

  describe('AssetVersionChecker', () => {
    describe('verifyAssetVersions', () => {
      it('should verify asset accessibility', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css'
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        (global.fetch as Mock).mockResolvedValue({ ok: true });
        
        const result = await AssetVersionChecker.verifyAssetVersions();
        
        expect(result.upToDate).toBe(true);
        expect(result.outdatedAssets).toEqual([]);
        expect(result.errors).toEqual([]);
      });

      it('should detect inaccessible assets', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css'
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        (global.fetch as Mock).mockResolvedValue({ ok: false });
        
        const result = await AssetVersionChecker.verifyAssetVersions();
        
        expect(result.upToDate).toBe(false);
        expect(result.outdatedAssets).toContain(mockLink.href);
      });

      it('should handle fetch errors', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css'
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        (global.fetch as Mock).mockRejectedValue(new Error('Network error'));
        
        const result = await AssetVersionChecker.verifyAssetVersions();
        
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Network error');
      });
    });
  });

  describe('CacheInvalidationManager', () => {
    describe('handleCacheInvalidation', () => {
      it('should handle cache invalidation process', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css',
          parentNode: {
            replaceChild: vi.fn()
          }
        };
        
        const mockNewLink = {
          rel: '',
          type: '',
          href: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        mockCreateElement.mockReturnValue(mockNewLink);
        (global.fetch as Mock).mockResolvedValue({ ok: true });
        
        const promise = CacheInvalidationManager.handleCacheInvalidation();
        
        // Simulate successful load
        if (mockNewLink.onload) {
          mockNewLink.onload();
        }
        
        await promise;
        
        expect(mockCreateElement).toHaveBeenCalled();
      });

      it('should force hard refresh when assets still have issues', async () => {
        const mockLink = {
          href: 'https://example.com/assets/index-abc123.css',
          parentNode: {
            replaceChild: vi.fn()
          }
        };
        
        const mockNewLink = {
          rel: '',
          type: '',
          href: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null
        };
        
        mockQuerySelectorAll.mockReturnValue([mockLink]);
        mockCreateElement.mockReturnValue(mockNewLink);
        (global.fetch as Mock).mockResolvedValue({ ok: false });
        
        const promise = CacheInvalidationManager.handleCacheInvalidation({ forceReload: true });
        
        // Simulate successful load
        if (mockNewLink.onload) {
          mockNewLink.onload();
        }
        
        await promise;
        
        expect(window.location.reload).toHaveBeenCalled();
      });
    });
  });
});
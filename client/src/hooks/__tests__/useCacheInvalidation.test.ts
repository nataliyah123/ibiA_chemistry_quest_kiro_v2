import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCacheInvalidation } from '../useCacheInvalidation';
import * as CacheInvalidationModule from '../../utils/cacheInvalidation';

// Mock the cache invalidation utilities
vi.mock('../../utils/cacheInvalidation', () => ({
  CacheInvalidationManager: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    handleCacheInvalidation: vi.fn()
  },
  CacheClearingUtility: {
    clearCSSCache: vi.fn(),
    forceHardRefresh: vi.fn(),
    getStoredVersions: vi.fn()
  },
  AssetVersionChecker: {
    verifyAssetVersions: vi.fn(),
    startVersionChecking: vi.fn(),
    stopVersionChecking: vi.fn()
  }
}));

describe('useCacheInvalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (CacheInvalidationModule.CacheClearingUtility.getStoredVersions as any).mockReturnValue({});
    (CacheInvalidationModule.CacheInvalidationManager.handleCacheInvalidation as any).mockResolvedValue(undefined);
    (CacheInvalidationModule.CacheClearingUtility.clearCSSCache as any).mockResolvedValue(undefined);
    (CacheInvalidationModule.AssetVersionChecker.verifyAssetVersions as any).mockResolvedValue({
      upToDate: true,
      outdatedAssets: [],
      errors: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    expect(result.current.state).toMatchObject({
      isInvalidating: false,
      lastInvalidation: null,
      versionCheckEnabled: true, // Enabled by default during initialization
      assetVersions: {},
      errors: []
    });
  });

  it('should initialize cache invalidation manager on mount', () => {
    renderHook(() => useCacheInvalidation());

    expect(CacheInvalidationModule.CacheInvalidationManager.initialize).toHaveBeenCalledWith({
      enableVersionChecking: true,
      onVersionChange: expect.any(Function)
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useCacheInvalidation());

    unmount();

    expect(CacheInvalidationModule.CacheInvalidationManager.cleanup).toHaveBeenCalled();
  });

  it('should handle cache invalidation successfully', async () => {
    const { result } = renderHook(() => useCacheInvalidation());

    await act(async () => {
      await result.current.invalidateCache();
    });

    expect(CacheInvalidationModule.CacheInvalidationManager.handleCacheInvalidation).toHaveBeenCalled();
    expect(result.current.state.isInvalidating).toBe(false);
    expect(result.current.state.lastInvalidation).toBeInstanceOf(Date);
  });

  it('should handle cache invalidation errors', async () => {
    const error = new Error('Cache invalidation failed');
    (CacheInvalidationModule.CacheInvalidationManager.handleCacheInvalidation as any).mockRejectedValue(error);

    const { result } = renderHook(() => useCacheInvalidation());

    await act(async () => {
      try {
        await result.current.invalidateCache();
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.state.isInvalidating).toBe(false);
    expect(result.current.state.errors).toContain('Cache invalidation failed');
  });

  it('should handle cache clearing successfully', async () => {
    const { result } = renderHook(() => useCacheInvalidation());

    await act(async () => {
      await result.current.clearCache();
    });

    expect(CacheInvalidationModule.CacheClearingUtility.clearCSSCache).toHaveBeenCalled();
    expect(result.current.state.isInvalidating).toBe(false);
    expect(result.current.state.lastInvalidation).toBeInstanceOf(Date);
  });

  it('should handle cache clearing errors', async () => {
    const error = new Error('Cache clearing failed');
    (CacheInvalidationModule.CacheClearingUtility.clearCSSCache as any).mockRejectedValue(error);

    const { result } = renderHook(() => useCacheInvalidation());

    await act(async () => {
      try {
        await result.current.clearCache();
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.state.isInvalidating).toBe(false);
    expect(result.current.state.errors).toContain('Cache clearing failed');
  });

  it('should handle force refresh', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    act(() => {
      result.current.forceRefresh();
    });

    expect(CacheInvalidationModule.CacheClearingUtility.forceHardRefresh).toHaveBeenCalled();
  });

  it('should verify assets', async () => {
    const mockResult = {
      upToDate: false,
      outdatedAssets: ['/assets/test.css'],
      errors: []
    };
    (CacheInvalidationModule.AssetVersionChecker.verifyAssetVersions as any).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCacheInvalidation());

    let verificationResult;
    await act(async () => {
      verificationResult = await result.current.verifyAssets();
    });

    expect(verificationResult).toEqual(mockResult);
    expect(CacheInvalidationModule.AssetVersionChecker.verifyAssetVersions).toHaveBeenCalled();
  });

  it('should enable version checking', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    act(() => {
      result.current.enableVersionChecking();
    });

    expect(CacheInvalidationModule.AssetVersionChecker.startVersionChecking).toHaveBeenCalled();
    expect(result.current.state.versionCheckEnabled).toBe(true);
  });

  it('should disable version checking', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    act(() => {
      result.current.disableVersionChecking();
    });

    expect(CacheInvalidationModule.AssetVersionChecker.stopVersionChecking).toHaveBeenCalled();
    expect(result.current.state.versionCheckEnabled).toBe(false);
  });

  it('should handle version changes', () => {
    const { result } = renderHook(() => useCacheInvalidation());

    const newVersion = {
      path: '/assets/test.css',
      hash: 'newhash',
      timestamp: Date.now(),
      version: 'newhash-123'
    };

    const oldVersion = {
      path: '/assets/test.css',
      hash: 'oldhash',
      timestamp: Date.now() - 1000,
      version: 'oldhash-122'
    };

    // Get the onVersionChange callback that was passed to initialize
    const initializeCall = (CacheInvalidationModule.CacheInvalidationManager.initialize as any).mock.calls[0];
    const onVersionChange = initializeCall[0].onVersionChange;

    act(() => {
      onVersionChange(newVersion, oldVersion);
    });

    expect(result.current.state.assetVersions[newVersion.path]).toEqual(newVersion);
  });

  it('should set invalidating state during operations', async () => {
    let resolveInvalidation: () => void;
    const invalidationPromise = new Promise<void>((resolve) => {
      resolveInvalidation = resolve;
    });
    
    (CacheInvalidationModule.CacheInvalidationManager.handleCacheInvalidation as any).mockReturnValue(invalidationPromise);

    const { result } = renderHook(() => useCacheInvalidation());

    // Start invalidation
    act(() => {
      result.current.invalidateCache();
    });

    // Should be invalidating
    expect(result.current.state.isInvalidating).toBe(true);

    // Complete invalidation
    await act(async () => {
      resolveInvalidation!();
      await invalidationPromise;
    });

    // Should no longer be invalidating
    expect(result.current.state.isInvalidating).toBe(false);
  });
});
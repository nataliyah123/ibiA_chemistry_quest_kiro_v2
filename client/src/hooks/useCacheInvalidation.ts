import { useEffect, useCallback, useState } from 'react';
import { 
  CacheInvalidationManager, 
  AssetVersionChecker, 
  CacheClearingUtility,
  AssetVersion,
  CacheInvalidationOptions 
} from '../utils/cacheInvalidation';

export interface CacheInvalidationState {
  isInvalidating: boolean;
  lastInvalidation: Date | null;
  versionCheckEnabled: boolean;
  assetVersions: Record<string, AssetVersion>;
  errors: string[];
}

export interface UseCacheInvalidationReturn {
  state: CacheInvalidationState;
  invalidateCache: (options?: CacheInvalidationOptions) => Promise<void>;
  clearCache: () => Promise<void>;
  forceRefresh: () => void;
  verifyAssets: () => Promise<{ upToDate: boolean; outdatedAssets: string[]; errors: string[] }>;
  enableVersionChecking: () => void;
  disableVersionChecking: () => void;
}

/**
 * React hook for managing CSS cache invalidation
 */
export function useCacheInvalidation(): UseCacheInvalidationReturn {
  const [state, setState] = useState<CacheInvalidationState>({
    isInvalidating: false,
    lastInvalidation: null,
    versionCheckEnabled: false,
    assetVersions: {},
    errors: []
  });

  // Handle version changes
  const handleVersionChange = useCallback((newVersion: AssetVersion, oldVersion: AssetVersion) => {
    console.log('Asset version changed:', { newVersion, oldVersion });
    
    setState(prev => ({
      ...prev,
      assetVersions: {
        ...prev.assetVersions,
        [newVersion.path]: newVersion
      }
    }));
  }, []);

  // Initialize cache invalidation system
  useEffect(() => {
    CacheInvalidationManager.initialize({
      enableVersionChecking: true,
      onVersionChange: handleVersionChange
    });

    setState(prev => ({
      ...prev,
      versionCheckEnabled: true,
      assetVersions: CacheClearingUtility.getStoredVersions()
    }));

    return () => {
      CacheInvalidationManager.cleanup();
    };
  }, [handleVersionChange]);

  // Invalidate cache
  const invalidateCache = useCallback(async (options: CacheInvalidationOptions = {}) => {
    setState(prev => ({ ...prev, isInvalidating: true, errors: [] }));
    
    try {
      await CacheInvalidationManager.handleCacheInvalidation(options);
      
      setState(prev => ({
        ...prev,
        isInvalidating: false,
        lastInvalidation: new Date(),
        assetVersions: CacheClearingUtility.getStoredVersions()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isInvalidating: false,
        errors: [...prev.errors, errorMessage]
      }));
      
      throw error;
    }
  }, []);

  // Clear cache only
  const clearCache = useCallback(async () => {
    setState(prev => ({ ...prev, isInvalidating: true, errors: [] }));
    
    try {
      await CacheClearingUtility.clearCSSCache();
      
      setState(prev => ({
        ...prev,
        isInvalidating: false,
        lastInvalidation: new Date(),
        assetVersions: CacheClearingUtility.getStoredVersions()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isInvalidating: false,
        errors: [...prev.errors, errorMessage]
      }));
      
      throw error;
    }
  }, []);

  // Force refresh
  const forceRefresh = useCallback(() => {
    CacheClearingUtility.forceHardRefresh();
  }, []);

  // Verify assets
  const verifyAssets = useCallback(async () => {
    return await AssetVersionChecker.verifyAssetVersions();
  }, []);

  // Enable version checking
  const enableVersionChecking = useCallback(() => {
    AssetVersionChecker.startVersionChecking(handleVersionChange);
    setState(prev => ({ ...prev, versionCheckEnabled: true }));
  }, [handleVersionChange]);

  // Disable version checking
  const disableVersionChecking = useCallback(() => {
    AssetVersionChecker.stopVersionChecking();
    setState(prev => ({ ...prev, versionCheckEnabled: false }));
  }, []);

  return {
    state,
    invalidateCache,
    clearCache,
    forceRefresh,
    verifyAssets,
    enableVersionChecking,
    disableVersionChecking
  };
}
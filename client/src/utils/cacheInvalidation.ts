/**
 * Cache Invalidation Utilities
 * 
 * Provides functionality to handle CSS asset cache invalidation,
 * including cache-busting parameters, programmatic cache clearing,
 * and asset versioning checks.
 */

export interface AssetVersion {
  path: string;
  hash: string;
  timestamp: number;
  version: string;
}

export interface CacheInvalidationOptions {
  forceReload?: boolean;
  cacheBustParam?: string;
  maxRetries?: number;
}

/**
 * Generates cache-busting parameters for CSS assets
 */
export function generateCacheBustParam(): string {
  return `cb=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Adds cache-busting parameters to a CSS asset URL
 */
export function addCacheBustingToUrl(url: string, options: CacheInvalidationOptions = {}): string {
  const { cacheBustParam = generateCacheBustParam() } = options;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${cacheBustParam}`;
}

/**
 * Extracts asset hash from bundled CSS filename
 */
export function extractAssetHash(filename: string): string | null {
  const match = filename.match(/index-([a-f0-9]+)\.css$/);
  return match ? match[1] : null;
}

/**
 * Gets current asset version information
 */
export function getCurrentAssetVersion(cssPath: string): AssetVersion | null {
  const hash = extractAssetHash(cssPath);
  if (!hash) return null;

  return {
    path: cssPath,
    hash,
    timestamp: Date.now(),
    version: `${hash}-${Date.now()}`
  };
}

/**
 * Compares two asset versions to detect changes
 */
export function hasAssetVersionChanged(current: AssetVersion, previous: AssetVersion): boolean {
  return current.hash !== previous.hash || current.path !== previous.path;
}
/**

 * Programmatically clears browser cache for CSS assets
 */
export class CacheClearingUtility {
  private static readonly STORAGE_KEY = 'css_asset_versions';

  /**
   * Clears CSS from browser cache by reloading stylesheets with cache-busting
   */
  static async clearCSSCache(options: CacheInvalidationOptions = {}): Promise<void> {
    const { forceReload = true, maxRetries = 3 } = options;
    
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const clearPromises: Promise<void>[] = [];

    stylesheets.forEach((link) => {
      const linkElement = link as HTMLLinkElement;
      const originalHref = linkElement.href;
      
      if (originalHref.includes('/assets/') && originalHref.includes('.css')) {
        clearPromises.push(this.reloadStylesheet(linkElement, originalHref, maxRetries));
      }
    });

    await Promise.all(clearPromises);
    
    if (forceReload) {
      this.clearStoredVersions();
    }
  }

  /**
   * Reloads a specific stylesheet with cache-busting
   */
  private static async reloadStylesheet(
    linkElement: HTMLLinkElement, 
    originalHref: string, 
    maxRetries: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let retryCount = 0;

      const attemptReload = () => {
        const newHref = addCacheBustingToUrl(originalHref);
        const newLink = document.createElement('link');
        
        newLink.rel = 'stylesheet';
        newLink.type = 'text/css';
        newLink.href = newHref;

        newLink.onload = () => {
          // Replace old link with new one
          if (linkElement.parentNode) {
            linkElement.parentNode.replaceChild(newLink, linkElement);
          }
          resolve();
        };

        newLink.onerror = () => {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(attemptReload, 1000 * retryCount); // Exponential backoff
          } else {
            reject(new Error(`Failed to reload stylesheet after ${maxRetries} attempts: ${originalHref}`));
          }
        };

        document.head.appendChild(newLink);
      };

      attemptReload();
    });
  }

  /**
   * Clears stored asset version information
   */
  static clearStoredVersions(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear stored asset versions:', error);
    }
  }

  /**
   * Stores current asset version information
   */
  static storeAssetVersion(version: AssetVersion): void {
    try {
      const stored = this.getStoredVersions();
      stored[version.path] = version;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store asset version:', error);
    }
  }

  /**
   * Gets stored asset version information
   */
  static getStoredVersions(): Record<string, AssetVersion> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to get stored asset versions:', error);
      return {};
    }
  }

  /**
   * Forces a hard refresh of the page to clear all caches
   */
  static forceHardRefresh(): void {
    // Clear all stored data
    this.clearStoredVersions();
    
    // Force hard refresh
    window.location.reload();
  }
}

/**
 * Asset Versioning Check Utility
 */
export class AssetVersionChecker {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static readonly CHECK_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Starts periodic asset version checking
   */
  static startVersionChecking(onVersionChange?: (newVersion: AssetVersion, oldVersion: AssetVersion) => void): void {
    if (this.checkInterval) {
      this.stopVersionChecking();
    }

    this.checkInterval = setInterval(() => {
      this.checkForVersionChanges(onVersionChange);
    }, this.CHECK_INTERVAL_MS);

    // Initial check
    this.checkForVersionChanges(onVersionChange);
  }

  /**
   * Stops periodic asset version checking
   */
  static stopVersionChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Checks for asset version changes
   */
  static async checkForVersionChanges(
    onVersionChange?: (newVersion: AssetVersion, oldVersion: AssetVersion) => void
  ): Promise<void> {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const storedVersions = CacheClearingUtility.getStoredVersions();

    for (const link of stylesheets) {
      const linkElement = link as HTMLLinkElement;
      const href = linkElement.href;

      if (href.includes('/assets/') && href.includes('.css')) {
        const currentVersion = getCurrentAssetVersion(href);
        if (!currentVersion) continue;

        const storedVersion = storedVersions[href];
        
        if (storedVersion && hasAssetVersionChanged(currentVersion, storedVersion)) {
          onVersionChange?.(currentVersion, storedVersion);
        }

        // Update stored version
        CacheClearingUtility.storeAssetVersion(currentVersion);
      }
    }
  }

  /**
   * Manually checks if assets are up to date
   */
  static async verifyAssetVersions(): Promise<{
    upToDate: boolean;
    outdatedAssets: string[];
    errors: string[];
  }> {
    const result = {
      upToDate: true,
      outdatedAssets: [] as string[],
      errors: [] as string[]
    };

    try {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      const storedVersions = CacheClearingUtility.getStoredVersions();

      for (const link of stylesheets) {
        const linkElement = link as HTMLLinkElement;
        const href = linkElement.href;

        if (href.includes('/assets/') && href.includes('.css')) {
          try {
            // Test if asset is accessible
            const response = await fetch(href, { method: 'HEAD', cache: 'no-cache' });
            
            if (!response.ok) {
              result.upToDate = false;
              result.outdatedAssets.push(href);
              continue;
            }

            // Check version
            const currentVersion = getCurrentAssetVersion(href);
            const storedVersion = storedVersions[href];

            if (currentVersion && storedVersion && hasAssetVersionChanged(currentVersion, storedVersion)) {
              result.upToDate = false;
              result.outdatedAssets.push(href);
            }
          } catch (error) {
            result.errors.push(`Failed to verify ${href}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`Asset verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
}

/**
 * Main cache invalidation manager
 */
export class CacheInvalidationManager {
  private static isInitialized = false;

  /**
   * Initializes cache invalidation system
   */
  static initialize(options: {
    enableVersionChecking?: boolean;
    onVersionChange?: (newVersion: AssetVersion, oldVersion: AssetVersion) => void;
  } = {}): void {
    if (this.isInitialized) return;

    const { enableVersionChecking = true, onVersionChange } = options;

    if (enableVersionChecking) {
      AssetVersionChecker.startVersionChecking(onVersionChange);
    }

    // Store initial versions
    this.storeInitialVersions();
    
    this.isInitialized = true;
  }

  /**
   * Stores initial asset versions
   */
  private static storeInitialVersions(): void {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    stylesheets.forEach((link) => {
      const linkElement = link as HTMLLinkElement;
      const href = linkElement.href;
      
      if (href.includes('/assets/') && href.includes('.css')) {
        const version = getCurrentAssetVersion(href);
        if (version) {
          CacheClearingUtility.storeAssetVersion(version);
        }
      }
    });
  }

  /**
   * Handles cache invalidation when problems are detected
   */
  static async handleCacheInvalidation(options: CacheInvalidationOptions = {}): Promise<void> {
    try {
      console.log('Starting cache invalidation...');
      
      // First, try clearing CSS cache
      await CacheClearingUtility.clearCSSCache(options);
      
      // Verify assets are working
      const verification = await AssetVersionChecker.verifyAssetVersions();
      
      if (!verification.upToDate || verification.errors.length > 0) {
        console.warn('Cache invalidation may not have resolved all issues:', verification);
        
        // If still having issues, force hard refresh as last resort
        if (options.forceReload) {
          CacheClearingUtility.forceHardRefresh();
        }
      } else {
        console.log('Cache invalidation completed successfully');
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup when component unmounts or page unloads
   */
  static cleanup(): void {
    AssetVersionChecker.stopVersionChecking();
    this.isInitialized = false;
  }
}
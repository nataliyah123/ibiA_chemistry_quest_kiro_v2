/**
 * Asset Health Diagnostic Tools
 * Comprehensive diagnostic utilities for CSS asset serving issues
 */

export interface AssetDiagnosticResult {
  timestamp: string;
  userAgent: string;
  url: string;
  checks: {
    networkConnectivity: boolean;
    dnsResolution: boolean;
    httpResponse: boolean;
    contentType: boolean;
    contentSize: boolean;
    cacheHeaders: boolean;
  };
  details: {
    responseStatus?: number;
    responseHeaders?: Record<string, string>;
    contentLength?: number;
    loadTime?: number;
    errorMessage?: string;
  };
  recommendations: string[];
}

export interface SystemDiagnostic {
  timestamp: string;
  browser: {
    name: string;
    version: string;
    cookiesEnabled: boolean;
    localStorageEnabled: boolean;
  };
  network: {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
  };
  cache: {
    cacheStorageSupported: boolean;
    serviceWorkerActive: boolean;
  };
  css: {
    totalStylesheets: number;
    loadedStylesheets: number;
    failedStylesheets: number;
    stylesheetUrls: string[];
  };
}

class AssetHealthDiagnostic {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = window.location.origin, timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Perform comprehensive diagnostic on a CSS asset
   */
  async diagnoseAsset(assetPath: string): Promise<AssetDiagnosticResult> {
    const url = `${this.baseUrl}${assetPath}`;
    const startTime = performance.now();
    
    const result: AssetDiagnosticResult = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url,
      checks: {
        networkConnectivity: false,
        dnsResolution: false,
        httpResponse: false,
        contentType: false,
        contentSize: false,
        cacheHeaders: false
      },
      details: {},
      recommendations: []
    };

    try {
      // Test network connectivity
      result.checks.networkConnectivity = navigator.onLine;
      
      if (!result.checks.networkConnectivity) {
        result.recommendations.push('Check internet connection');
        return result;
      }

      // Test DNS resolution and HTTP response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        
        result.checks.dnsResolution = true;
        result.checks.httpResponse = response.ok;
        result.details.responseStatus = response.status;
        result.details.loadTime = performance.now() - startTime;

        // Extract response headers
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        result.details.responseHeaders = headers;

        // Check content type
        const contentType = response.headers.get('content-type');
        result.checks.contentType = contentType?.includes('text/css') || false;
        
        if (!result.checks.contentType) {
          result.recommendations.push(`Expected content-type 'text/css', got '${contentType}'`);
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          result.details.contentLength = parseInt(contentLength, 10);
          result.checks.contentSize = result.details.contentLength > 0;
        }

        // Check cache headers
        const cacheControl = response.headers.get('cache-control');
        const etag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');
        
        result.checks.cacheHeaders = !!(cacheControl || etag || lastModified);
        
        if (!result.checks.cacheHeaders) {
          result.recommendations.push('Add cache headers for better performance');
        }

        // Status-specific recommendations
        if (!response.ok) {
          switch (response.status) {
            case 404:
              result.recommendations.push('Asset file not found - check build output');
              break;
            case 403:
              result.recommendations.push('Access forbidden - check server permissions');
              break;
            case 500:
              result.recommendations.push('Server error - check server logs');
              break;
            default:
              result.recommendations.push(`HTTP ${response.status} error - check server configuration`);
          }
        }

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          result.details.errorMessage = fetchError.message;
          
          if (fetchError.name === 'AbortError') {
            result.recommendations.push('Request timeout - check network speed or server response time');
          } else if (fetchError.message.includes('Failed to fetch')) {
            result.recommendations.push('Network error - check CORS configuration or network connectivity');
          } else {
            result.recommendations.push(`Fetch error: ${fetchError.message}`);
          }
        }
      }

    } catch (error) {
      result.details.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.recommendations.push('Unexpected error during diagnostic');
    }

    return result;
  }

  /**
   * Get comprehensive system diagnostic information
   */
  getSystemDiagnostic(): SystemDiagnostic {
    const stylesheets = Array.from(document.styleSheets);
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    
    return {
      timestamp: new Date().toISOString(),
      browser: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        cookiesEnabled: navigator.cookieEnabled,
        localStorageEnabled: this.isLocalStorageEnabled()
      },
      network: {
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.type,
        effectiveType: (navigator as any).connection?.effectiveType
      },
      cache: {
        cacheStorageSupported: 'caches' in window,
        serviceWorkerActive: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller
      },
      css: {
        totalStylesheets: stylesheets.length,
        loadedStylesheets: stylesheets.filter(sheet => {
          try {
            return sheet.cssRules && sheet.cssRules.length > 0;
          } catch {
            return false;
          }
        }).length,
        failedStylesheets: linkElements.filter(link => 
          link.sheet === null && link.href
        ).length,
        stylesheetUrls: linkElements.map(link => link.href).filter(Boolean)
      }
    };
  }

  /**
   * Test all CSS assets found in the document
   */
  async diagnoseAllAssets(): Promise<AssetDiagnosticResult[]> {
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const assetPaths = linkElements
      .map(link => link.href)
      .filter(href => href && href.includes('/assets/'))
      .map(href => new URL(href).pathname);

    const results: AssetDiagnosticResult[] = [];
    
    for (const assetPath of assetPaths) {
      const result = await this.diagnoseAsset(assetPath);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate diagnostic report
   */
  async generateReport(): Promise<{
    system: SystemDiagnostic;
    assets: AssetDiagnosticResult[];
    summary: {
      totalAssets: number;
      healthyAssets: number;
      issues: string[];
      recommendations: string[];
    };
  }> {
    const system = this.getSystemDiagnostic();
    const assets = await this.diagnoseAllAssets();
    
    const healthyAssets = assets.filter(asset => 
      asset.checks.httpResponse && 
      asset.checks.contentType && 
      asset.checks.contentSize
    );

    const allIssues = new Set<string>();
    const allRecommendations = new Set<string>();

    assets.forEach(asset => {
      if (!asset.checks.httpResponse) {
        allIssues.add(`Asset not accessible: ${asset.url}`);
      }
      if (!asset.checks.contentType) {
        allIssues.add(`Incorrect content type: ${asset.url}`);
      }
      if (!asset.checks.contentSize) {
        allIssues.add(`Empty or missing content: ${asset.url}`);
      }
      
      asset.recommendations.forEach(rec => allRecommendations.add(rec));
    });

    // System-level recommendations
    if (!system.network.online) {
      allRecommendations.add('Check internet connection');
    }
    
    if (system.css.failedStylesheets > 0) {
      allRecommendations.add('Some stylesheets failed to load - check network and server configuration');
    }

    return {
      system,
      assets,
      summary: {
        totalAssets: assets.length,
        healthyAssets: healthyAssets.length,
        issues: Array.from(allIssues),
        recommendations: Array.from(allRecommendations)
      }
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private isLocalStorageEnabled(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

export default AssetHealthDiagnostic;
/**
 * Client-side CSS Loading Diagnostic Utility
 * 
 * This utility provides functions to test and monitor CSS loading
 * from within the browser environment.
 * 
 * Requirements addressed:
 * - 1.1: Verify CSS styling remains consistent after login
 * - 2.2: Test CSS accessibility through nginx configuration
 */

export interface CSSLoadingTest {
  testName: string;
  timestamp: string;
  success: boolean;
  error?: string;
  details?: any;
}

export interface CSSAssetInfo {
  href: string;
  loaded: boolean;
  error?: string;
  loadTime?: number;
  sheet?: CSSStyleSheet;
}

export interface CSSLoadingDiagnosticResult {
  timestamp: string;
  userAgent: string;
  url: string;
  tests: CSSLoadingTest[];
  stylesheets: CSSAssetInfo[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalStylesheets: number;
    loadedStylesheets: number;
  };
}

export class CSSLoadingDiagnostic {
  private results: CSSLoadingDiagnosticResult;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      tests: [],
      stylesheets: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalStylesheets: 0,
        loadedStylesheets: 0
      }
    };
  }

  /**
   * Run comprehensive CSS loading diagnostic
   */
  async runDiagnostic(): Promise<CSSLoadingDiagnosticResult> {
    console.log('🔍 Starting Client-side CSS Loading Diagnostic...');

    try {
      // Test 1: Check existing stylesheets
      await this.testExistingStylesheets();

      // Test 2: Test CSS asset accessibility
      await this.testCSSAssetAccessibility();

      // Test 3: Test CSS loading with different methods
      await this.testCSSLoadingMethods();

      // Test 4: Test CSS loading after navigation
      await this.testCSSAfterNavigation();

      // Test 5: Test CSS loading with cache scenarios
      await this.testCSSCacheScenarios();

      // Generate summary
      this.generateSummary();

      console.log('✅ CSS Loading Diagnostic Complete');
      return this.results;

    } catch (error) {
      console.error('❌ CSS Loading Diagnostic Failed:', error);
      this.addTest('DIAGNOSTIC_EXECUTION', false, error.message);
      return this.results;
    }
  }

  /**
   * Test existing stylesheets in the document
   */
  private async testExistingStylesheets(): Promise<void> {
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      const assetInfo: CSSAssetInfo = {
        href: stylesheet.href || 'inline',
        loaded: false,
        sheet: stylesheet
      };

      try {
        // Try to access CSS rules to verify the stylesheet is loaded
        const rules = stylesheet.cssRules || stylesheet.rules;
        assetInfo.loaded = rules !== null && rules.length > 0;
        assetInfo.details = {
          rulesCount: rules ? rules.length : 0,
          disabled: stylesheet.disabled,
          media: stylesheet.media ? Array.from(stylesheet.media) : []
        };
      } catch (error) {
        assetInfo.loaded = false;
        assetInfo.error = error.message;
      }

      this.results.stylesheets.push(assetInfo);
    }

    // Test link elements
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of linkElements) {
      const href = (link as HTMLLinkElement).href;
      const existing = this.results.stylesheets.find(s => s.href === href);
      
      if (!existing) {
        this.results.stylesheets.push({
          href,
          loaded: false,
          error: 'Stylesheet link found but not in document.styleSheets'
        });
      }
    }

    const loadedCount = this.results.stylesheets.filter(s => s.loaded).length;
    const success = this.results.stylesheets.length > 0 && loadedCount > 0;
    
    this.addTest('EXISTING_STYLESHEETS', success, 
      success ? `Found ${loadedCount}/${this.results.stylesheets.length} loaded stylesheets` 
               : 'No loaded stylesheets found');
  }

  /**
   * Test CSS asset accessibility by attempting to fetch them
   */
  private async testCSSAssetAccessibility(): Promise<void> {
    const cssAssets = this.results.stylesheets
      .filter(s => s.href && s.href !== 'inline' && !s.href.startsWith('data:'))
      .map(s => s.href);

    for (const assetUrl of cssAssets) {
      try {
        const startTime = performance.now();
        const response = await fetch(assetUrl, { method: 'HEAD' });
        const loadTime = performance.now() - startTime;

        const success = response.ok;
        const details = {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          cacheControl: response.headers.get('cache-control'),
          loadTime: Math.round(loadTime)
        };

        this.addTest(`CSS_ASSET_FETCH_${this.getAssetName(assetUrl)}`, success, 
          success ? `Asset accessible (${details.status}, ${details.loadTime}ms)` 
                   : `Asset not accessible (${details.status})`, 
          details);

      } catch (error) {
        this.addTest(`CSS_ASSET_FETCH_${this.getAssetName(assetUrl)}`, false, error.message);
      }
    }
  }

  /**
   * Test different CSS loading methods
   */
  private async testCSSLoadingMethods(): Promise<void> {
    const testAsset = this.getMainCSSAsset();
    if (!testAsset) {
      this.addTest('CSS_LOADING_METHODS', false, 'No CSS asset found to test');
      return;
    }

    // Test 1: Load via link element
    await this.testLoadViaLinkElement(testAsset);

    // Test 2: Load via fetch and style element
    await this.testLoadViaFetchAndStyle(testAsset);

    // Test 3: Load with cache busting
    await this.testLoadWithCacheBusting(testAsset);
  }

  /**
   * Test CSS loading via link element
   */
  private async testLoadViaLinkElement(assetUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = assetUrl + '?test=link';
      
      const startTime = performance.now();
      let resolved = false;

      const cleanup = () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      link.onload = () => {
        const loadTime = performance.now() - startTime;
        this.addTest('CSS_LOAD_VIA_LINK', true, `Loaded via link element (${Math.round(loadTime)}ms)`);
        cleanup();
      };

      link.onerror = () => {
        const loadTime = performance.now() - startTime;
        this.addTest('CSS_LOAD_VIA_LINK', false, `Failed to load via link element (${Math.round(loadTime)}ms)`);
        cleanup();
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          this.addTest('CSS_LOAD_VIA_LINK', false, 'Timeout loading via link element');
          cleanup();
        }
      }, 5000);

      document.head.appendChild(link);
    });
  }

  /**
   * Test CSS loading via fetch and style element
   */
  private async testLoadViaFetchAndStyle(assetUrl: string): Promise<void> {
    try {
      const startTime = performance.now();
      const response = await fetch(assetUrl + '?test=fetch');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const cssText = await response.text();
      const loadTime = performance.now() - startTime;

      // Create style element
      const style = document.createElement('style');
      style.textContent = cssText;
      document.head.appendChild(style);

      // Clean up
      setTimeout(() => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 100);

      this.addTest('CSS_LOAD_VIA_FETCH', true, 
        `Loaded via fetch and style element (${Math.round(loadTime)}ms, ${cssText.length} chars)`);

    } catch (error) {
      this.addTest('CSS_LOAD_VIA_FETCH', false, error.message);
    }
  }

  /**
   * Test CSS loading with cache busting
   */
  private async testLoadWithCacheBusting(assetUrl: string): Promise<void> {
    const cacheBustUrl = `${assetUrl}?cb=${Date.now()}`;
    
    try {
      const startTime = performance.now();
      const response = await fetch(cacheBustUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const loadTime = performance.now() - startTime;

      const success = response.ok;
      this.addTest('CSS_LOAD_CACHE_BUST', success, 
        success ? `Cache-busted load successful (${Math.round(loadTime)}ms)` 
                 : `Cache-busted load failed (${response.status})`);

    } catch (error) {
      this.addTest('CSS_LOAD_CACHE_BUST', false, error.message);
    }
  }

  /**
   * Test CSS loading after simulated navigation
   */
  private async testCSSAfterNavigation(): Promise<void> {
    // Simulate navigation by changing the URL hash and testing CSS accessibility
    const originalHash = window.location.hash;
    
    try {
      // Test different route hashes
      const testRoutes = ['#/dashboard', '#/profile', '#/login'];
      
      for (const route of testRoutes) {
        window.location.hash = route;
        
        // Wait a bit for any route-based logic to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test if CSS is still accessible
        const mainAsset = this.getMainCSSAsset();
        if (mainAsset) {
          try {
            const response = await fetch(mainAsset, { method: 'HEAD' });
            const success = response.ok;
            
            this.addTest(`CSS_AFTER_NAV_${route.replace('#/', '')}`, success,
              success ? `CSS accessible after navigation to ${route}` 
                       : `CSS not accessible after navigation to ${route} (${response.status})`);
          } catch (error) {
            this.addTest(`CSS_AFTER_NAV_${route.replace('#/', '')}`, false, error.message);
          }
        }
      }
    } finally {
      // Restore original hash
      window.location.hash = originalHash;
    }
  }

  /**
   * Test CSS loading with different cache scenarios
   */
  private async testCSSCacheScenarios(): Promise<void> {
    const mainAsset = this.getMainCSSAsset();
    if (!mainAsset) return;

    const cacheScenarios = [
      { name: 'DEFAULT', init: {} },
      { name: 'NO_CACHE', init: { cache: 'no-cache' } },
      { name: 'RELOAD', init: { cache: 'reload' } },
      { name: 'FORCE_CACHE', init: { cache: 'force-cache' } }
    ];

    for (const scenario of cacheScenarios) {
      try {
        const startTime = performance.now();
        const response = await fetch(mainAsset, { 
          method: 'HEAD',
          ...scenario.init
        });
        const loadTime = performance.now() - startTime;

        const success = response.ok;
        this.addTest(`CSS_CACHE_${scenario.name}`, success,
          success ? `Cache scenario ${scenario.name} successful (${Math.round(loadTime)}ms)`
                   : `Cache scenario ${scenario.name} failed (${response.status})`);

      } catch (error) {
        this.addTest(`CSS_CACHE_${scenario.name}`, false, error.message);
      }
    }
  }

  /**
   * Get the main CSS asset URL
   */
  private getMainCSSAsset(): string | null {
    // Look for the main bundled CSS asset
    const mainAsset = this.results.stylesheets.find(s => 
      s.href && 
      s.href.includes('/assets/') && 
      s.href.includes('.css') &&
      !s.href.includes('data:')
    );
    
    return mainAsset ? mainAsset.href : null;
  }

  /**
   * Get asset name from URL for test naming
   */
  private getAssetName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'unknown';
      return filename.replace(/[^a-zA-Z0-9]/g, '_');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Add a test result
   */
  private addTest(testName: string, success: boolean, message?: string, details?: any): void {
    this.results.tests.push({
      testName,
      timestamp: new Date().toISOString(),
      success,
      error: success ? undefined : message,
      details
    });
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): void {
    this.results.summary = {
      totalTests: this.results.tests.length,
      passedTests: this.results.tests.filter(t => t.success).length,
      failedTests: this.results.tests.filter(t => !t.success).length,
      totalStylesheets: this.results.stylesheets.length,
      loadedStylesheets: this.results.stylesheets.filter(s => s.loaded).length
    };
  }

  /**
   * Get diagnostic results
   */
  getResults(): CSSLoadingDiagnosticResult {
    return this.results;
  }

  /**
   * Print diagnostic results to console
   */
  printResults(): void {
    console.group('🔍 CSS Loading Diagnostic Results');
    
    console.log('📊 Summary:');
    console.log(`  Tests: ${this.results.summary.passedTests}/${this.results.summary.totalTests} passed`);
    console.log(`  Stylesheets: ${this.results.summary.loadedStylesheets}/${this.results.summary.totalStylesheets} loaded`);
    
    console.log('\n📋 Test Results:');
    this.results.tests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      console.log(`  ${status} ${test.testName}: ${test.error || 'Success'}`);
    });

    console.log('\n📄 Stylesheets:');
    this.results.stylesheets.forEach(sheet => {
      const status = sheet.loaded ? '✅' : '❌';
      console.log(`  ${status} ${sheet.href}: ${sheet.error || 'Loaded'}`);
    });

    console.groupEnd();
  }
}

/**
 * Convenience function to run diagnostic and return results
 */
export async function runCSSLoadingDiagnostic(): Promise<CSSLoadingDiagnosticResult> {
  const diagnostic = new CSSLoadingDiagnostic();
  const results = await diagnostic.runDiagnostic();
  diagnostic.printResults();
  return results;
}

/**
 * Monitor CSS loading in real-time
 */
export function monitorCSSLoading(): void {
  console.log('🔍 Starting CSS Loading Monitor...');

  // Monitor stylesheet changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
              console.log('📄 New stylesheet added:', element.getAttribute('href'));
            } else if (element.tagName === 'STYLE') {
              console.log('📄 New style element added');
            }
          }
        });
      }
    });
  });

  observer.observe(document.head, {
    childList: true,
    subtree: true
  });

  // Monitor for CSS loading errors
  window.addEventListener('error', (event) => {
    if (event.target && (event.target as any).tagName === 'LINK') {
      const link = event.target as HTMLLinkElement;
      if (link.rel === 'stylesheet') {
        console.error('❌ CSS loading error:', link.href, event.error);
      }
    }
  }, true);

  console.log('✅ CSS Loading Monitor active');
}
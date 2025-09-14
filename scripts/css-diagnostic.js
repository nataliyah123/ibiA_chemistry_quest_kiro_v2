#!/usr/bin/env node

/**
 * CSS Asset Diagnostic Script
 * 
 * This script tests CSS asset loading from different routes and verifies
 * asset accessibility through nginx configuration.
 * 
 * Requirements addressed:
 * - 1.1: Verify CSS styling remains consistent after login
 * - 2.2: Test CSS accessibility through nginx configuration
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class CSSAssetDiagnostic {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:80';
    this.timeout = options.timeout || 5000;
    this.results = {
      assetTests: [],
      routeTests: [],
      mimeTypeTests: [],
      cacheHeaderTests: [],
      errors: [],
      summary: {}
    };
  }

  /**
   * Main diagnostic function
   */
  async runDiagnostic() {
    console.log('🔍 Starting CSS Asset Diagnostic...\n');
    
    try {
      // Test 1: Verify CSS asset accessibility
      await this.testCSSAssetAccessibility();
      
      // Test 2: Test CSS loading from different routes
      await this.testCSSFromDifferentRoutes();
      
      // Test 3: Verify MIME types and headers
      await this.testMimeTypesAndHeaders();
      
      // Test 4: Test cache behavior
      await this.testCacheHeaders();
      
      // Generate summary
      this.generateSummary();
      
      // Output results
      this.outputResults();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
      this.results.errors.push({
        type: 'DIAGNOSTIC_FAILURE',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test CSS asset accessibility
   */
  async testCSSAssetAccessibility() {
    console.log('📋 Testing CSS Asset Accessibility...');
    
    // Get the actual CSS asset path from built index.html
    const cssAssetPath = await this.extractCSSAssetPath();
    
    if (!cssAssetPath) {
      this.results.errors.push({
        type: 'ASSET_PATH_NOT_FOUND',
        message: 'Could not extract CSS asset path from index.html',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`   Found CSS asset: ${cssAssetPath}`);
    
    // Test direct asset access
    const assetUrl = `${this.baseUrl}${cssAssetPath}`;
    const assetTest = await this.testHttpRequest(assetUrl, 'CSS_ASSET_DIRECT');
    this.results.assetTests.push(assetTest);
    
    // Test asset with different base paths
    const testPaths = [
      cssAssetPath,
      cssAssetPath.replace('/assets/', '/assets/'),
      `/client${cssAssetPath}`,
      cssAssetPath.substring(1) // Remove leading slash
    ];
    
    for (const testPath of testPaths) {
      const testUrl = `${this.baseUrl}/${testPath.replace(/^\/+/, '')}`;
      const test = await this.testHttpRequest(testUrl, `CSS_ASSET_PATH_${testPath}`);
      this.results.assetTests.push(test);
    }
  }

  /**
   * Test CSS loading from different routes
   */
  async testCSSFromDifferentRoutes() {
    console.log('🛣️  Testing CSS from Different Routes...');
    
    const routes = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/profile',
      '/demo',
      '/content-management',
      '/nonexistent-route'
    ];
    
    for (const route of routes) {
      const routeUrl = `${this.baseUrl}${route}`;
      const test = await this.testHttpRequest(routeUrl, `ROUTE_${route.replace('/', 'ROOT')}`);
      
      // For HTML responses, check if CSS is referenced
      if (test.success && test.contentType && test.contentType.includes('text/html')) {
        test.cssReferences = this.extractCSSReferences(test.body);
      }
      
      this.results.routeTests.push(test);
    }
  }

  /**
   * Test MIME types and headers
   */
  async testMimeTypesAndHeaders() {
    console.log('📄 Testing MIME Types and Headers...');
    
    const cssAssetPath = await this.extractCSSAssetPath();
    if (!cssAssetPath) return;
    
    const assetUrl = `${this.baseUrl}${cssAssetPath}`;
    const test = await this.testHttpRequest(assetUrl, 'MIME_TYPE_TEST', {
      checkHeaders: true
    });
    
    // Verify expected headers
    const expectedHeaders = {
      'content-type': 'text/css',
      'cache-control': /public.*immutable/i,
      'access-control-allow-origin': '*'
    };
    
    test.headerValidation = {};
    for (const [header, expected] of Object.entries(expectedHeaders)) {
      const actual = test.headers && test.headers[header];
      if (expected instanceof RegExp) {
        test.headerValidation[header] = {
          expected: expected.toString(),
          actual,
          valid: expected.test(actual || '')
        };
      } else {
        test.headerValidation[header] = {
          expected,
          actual,
          valid: actual === expected
        };
      }
    }
    
    this.results.mimeTypeTests.push(test);
  }

  /**
   * Test cache headers
   */
  async testCacheHeaders() {
    console.log('💾 Testing Cache Headers...');
    
    const cssAssetPath = await this.extractCSSAssetPath();
    if (!cssAssetPath) return;
    
    const assetUrl = `${this.baseUrl}${cssAssetPath}`;
    
    // Test with different cache scenarios
    const cacheTests = [
      { name: 'NORMAL_REQUEST', headers: {} },
      { name: 'WITH_CACHE_CONTROL', headers: { 'Cache-Control': 'no-cache' } },
      { name: 'WITH_PRAGMA', headers: { 'Pragma': 'no-cache' } },
      { name: 'WITH_IF_MODIFIED_SINCE', headers: { 'If-Modified-Since': new Date().toUTCString() } }
    ];
    
    for (const cacheTest of cacheTests) {
      const test = await this.testHttpRequest(assetUrl, `CACHE_${cacheTest.name}`, {
        headers: cacheTest.headers,
        checkHeaders: true
      });
      this.results.cacheHeaderTests.push(test);
    }
  }

  /**
   * Extract CSS asset path from built index.html
   */
  async extractCSSAssetPath() {
    try {
      const indexPath = path.join(process.cwd(), 'client', 'dist', 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.log('   ⚠️  Built index.html not found, checking for CSS pattern...');
        
        // Try to find CSS files in assets directory
        const assetsPath = path.join(process.cwd(), 'client', 'dist', 'assets');
        if (fs.existsSync(assetsPath)) {
          const files = fs.readdirSync(assetsPath);
          const cssFile = files.find(file => file.endsWith('.css'));
          if (cssFile) {
            return `/assets/${cssFile}`;
          }
        }
        return null;
      }
      
      const content = fs.readFileSync(indexPath, 'utf8');
      const cssMatch = content.match(/href="([^"]*\.css)"/);
      
      return cssMatch ? cssMatch[1] : null;
    } catch (error) {
      console.error('   ❌ Error extracting CSS asset path:', error.message);
      return null;
    }
  }

  /**
   * Extract CSS references from HTML content
   */
  extractCSSReferences(html) {
    if (!html) return [];
    
    const cssRefs = [];
    const linkMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
    const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    
    linkMatches.forEach(link => {
      const hrefMatch = link.match(/href=["']([^"']*\.css)["']/);
      if (hrefMatch) {
        cssRefs.push({
          type: 'external',
          href: hrefMatch[1]
        });
      }
    });
    
    styleMatches.forEach(style => {
      cssRefs.push({
        type: 'inline',
        content: style.length
      });
    });
    
    return cssRefs;
  }

  /**
   * Test HTTP request
   */
  async testHttpRequest(url, testName, options = {}) {
    const startTime = Date.now();
    const test = {
      testName,
      url,
      timestamp: new Date().toISOString(),
      success: false,
      statusCode: null,
      contentType: null,
      contentLength: null,
      responseTime: null,
      headers: null,
      error: null,
      body: null
    };

    try {
      const response = await this.makeHttpRequest(url, options);
      
      test.success = response.statusCode >= 200 && response.statusCode < 400;
      test.statusCode = response.statusCode;
      test.contentType = response.headers['content-type'];
      test.contentLength = response.headers['content-length'];
      test.responseTime = Date.now() - startTime;
      
      if (options.checkHeaders) {
        test.headers = response.headers;
      }
      
      // Store body for HTML responses (for CSS reference extraction)
      if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
        test.body = response.body;
      }
      
      console.log(`   ${test.success ? '✅' : '❌'} ${testName}: ${test.statusCode} (${test.responseTime}ms)`);
      
    } catch (error) {
      test.error = error.message;
      test.responseTime = Date.now() - startTime;
      console.log(`   ❌ ${testName}: ${error.message} (${test.responseTime}ms)`);
    }

    return test;
  }

  /**
   * Make HTTP request with timeout
   */
  makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'CSS-Diagnostic-Script/1.0',
          ...options.headers
        },
        timeout: this.timeout
      };

      const req = httpModule.request(requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Generate summary of results
   */
  generateSummary() {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      categories: {}
    };

    const allTests = [
      ...this.results.assetTests,
      ...this.results.routeTests,
      ...this.results.mimeTypeTests,
      ...this.results.cacheHeaderTests
    ];

    summary.totalTests = allTests.length;
    summary.passedTests = allTests.filter(test => test.success).length;
    summary.failedTests = summary.totalTests - summary.passedTests;

    // Categorize results
    summary.categories = {
      assetTests: {
        total: this.results.assetTests.length,
        passed: this.results.assetTests.filter(test => test.success).length
      },
      routeTests: {
        total: this.results.routeTests.length,
        passed: this.results.routeTests.filter(test => test.success).length
      },
      mimeTypeTests: {
        total: this.results.mimeTypeTests.length,
        passed: this.results.mimeTypeTests.filter(test => test.success).length
      },
      cacheHeaderTests: {
        total: this.results.cacheHeaderTests.length,
        passed: this.results.cacheHeaderTests.filter(test => test.success).length
      }
    };

    this.results.summary = summary;
  }

  /**
   * Output diagnostic results
   */
  outputResults() {
    console.log('\n📊 DIAGNOSTIC RESULTS');
    console.log('='.repeat(50));
    
    const { summary } = this.results;
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} ✅`);
    console.log(`Failed: ${summary.failedTests} ❌`);
    console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Test Categories:');
    Object.entries(summary.categories).forEach(([category, stats]) => {
      const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });

    // Show critical failures
    const criticalFailures = [
      ...this.results.assetTests.filter(test => !test.success),
      ...this.results.mimeTypeTests.filter(test => !test.success)
    ];

    if (criticalFailures.length > 0) {
      console.log('\n🚨 Critical Failures:');
      criticalFailures.forEach(test => {
        console.log(`  ❌ ${test.testName}: ${test.error || `HTTP ${test.statusCode}`}`);
      });
    }

    // Show header validation results
    const headerTests = this.results.mimeTypeTests.filter(test => test.headerValidation);
    if (headerTests.length > 0) {
      console.log('\n📄 Header Validation:');
      headerTests.forEach(test => {
        Object.entries(test.headerValidation).forEach(([header, validation]) => {
          const status = validation.valid ? '✅' : '❌';
          console.log(`  ${status} ${header}: ${validation.actual || 'missing'}`);
        });
      });
    }

    // Save detailed results to file
    this.saveResultsToFile();
    
    console.log('\n📁 Detailed results saved to: css-diagnostic-results.json');
    console.log('\n🏁 Diagnostic Complete!');
  }

  /**
   * Save results to JSON file
   */
  saveResultsToFile() {
    try {
      const resultsPath = path.join(process.cwd(), 'css-diagnostic-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    } catch (error) {
      console.error('Failed to save results file:', error.message);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    switch (key) {
      case 'url':
        options.baseUrl = value;
        break;
      case 'timeout':
        options.timeout = parseInt(value, 10);
        break;
    }
  }
  
  const diagnostic = new CSSAssetDiagnostic(options);
  diagnostic.runDiagnostic().catch(console.error);
}

module.exports = CSSAssetDiagnostic;
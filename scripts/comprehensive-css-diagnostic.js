#!/usr/bin/env node

/**
 * Comprehensive CSS Asset Diagnostic
 * 
 * This script tests CSS asset loading in both development and production environments
 * and provides detailed analysis of the CSS loading issues.
 * 
 * Requirements addressed:
 * - 1.1: Verify CSS styling remains consistent after login
 * - 2.2: Test CSS accessibility through nginx configuration
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveCSSAssetDiagnostic {
  constructor() {
    this.results = {
      environment: this.detectEnvironment(),
      containerInfo: this.getContainerInfo(),
      tests: [],
      summary: {},
      recommendations: []
    };
  }

  /**
   * Detect the current environment (development/production)
   */
  detectEnvironment() {
    try {
      const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
      const hasDevContainers = containers.includes('chemquest-client-dev');
      const hasProdContainers = containers.includes('chemquest-client') && !containers.includes('chemquest-client-dev');
      
      return {
        development: hasDevContainers,
        production: hasProdContainers,
        detected: hasDevContainers ? 'development' : (hasProdContainers ? 'production' : 'unknown')
      };
    } catch (error) {
      return {
        development: false,
        production: false,
        detected: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get container information
   */
  getContainerInfo() {
    try {
      const containers = execSync('docker ps --format "{{.Names}}:{{.Ports}}"', { encoding: 'utf8' });
      const containerInfo = {};
      
      containers.split('\n').forEach(line => {
        if (line.trim()) {
          const [name, ports] = line.split(':');
          containerInfo[name] = ports;
        }
      });
      
      return containerInfo;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Run comprehensive diagnostic
   */
  async runDiagnostic() {
    console.log('🔍 Starting Comprehensive CSS Asset Diagnostic...\n');
    
    // Environment detection
    console.log('🌍 Environment Detection:');
    console.log(`  Detected: ${this.results.environment.detected}`);
    console.log(`  Development: ${this.results.environment.development}`);
    console.log(`  Production: ${this.results.environment.production}\n`);
    
    // Container information
    console.log('🐳 Container Information:');
    Object.entries(this.results.containerInfo).forEach(([name, ports]) => {
      if (name.includes('client')) {
        console.log(`  ${name}: ${ports}`);
      }
    });
    console.log('');
    
    // Test based on environment
    if (this.results.environment.development) {
      await this.testDevelopmentEnvironment();
    }
    
    if (this.results.environment.production) {
      await this.testProductionEnvironment();
    }
    
    if (this.results.environment.detected === 'unknown') {
      console.log('⚠️  No containers detected, testing local development...\n');
      await this.testLocalDevelopment();
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Output results
    this.outputResults();
    
    return this.results;
  }

  /**
   * Test development environment
   */
  async testDevelopmentEnvironment() {
    console.log('🛠️  Testing Development Environment...\n');
    
    const devPort = 3000;
    const baseUrl = `http://localhost:${devPort}`;
    
    // Test 1: Check if Vite dev server is accessible
    await this.testViteDevServer(baseUrl);
    
    // Test 2: Check CSS handling in development
    await this.testDevelopmentCSSHandling(baseUrl);
    
    // Test 3: Test container internal access
    await this.testContainerInternalAccess();
  }

  /**
   * Test production environment
   */
  async testProductionEnvironment() {
    console.log('🏭 Testing Production Environment...\n');
    
    const prodPort = 80;
    const baseUrl = `http://localhost:${prodPort}`;
    
    // Test 1: Check nginx server
    await this.testNginxServer(baseUrl);
    
    // Test 2: Check static asset serving
    await this.testStaticAssetServing(baseUrl);
    
    // Test 3: Check cache headers
    await this.testCacheHeaders(baseUrl);
  }

  /**
   * Test local development (no containers)
   */
  async testLocalDevelopment() {
    const commonPorts = [3000, 5173, 8080];
    
    for (const port of commonPorts) {
      const baseUrl = `http://localhost:${port}`;
      console.log(`Testing port ${port}...`);
      
      const result = await this.testHttpRequest(baseUrl, `LOCAL_DEV_${port}`);
      if (result.success) {
        console.log(`✅ Found server on port ${port}`);
        await this.testDevelopmentCSSHandling(baseUrl);
        break;
      }
    }
  }

  /**
   * Test Vite dev server
   */
  async testViteDevServer(baseUrl) {
    console.log('  Testing Vite Dev Server...');
    
    // Test root access
    const rootTest = await this.testHttpRequest(baseUrl, 'VITE_ROOT');
    this.results.tests.push(rootTest);
    
    if (rootTest.success) {
      console.log('  ✅ Vite dev server accessible');
      
      // Extract CSS imports from HTML
      const cssRefs = this.extractCSSReferences(rootTest.body);
      console.log(`  Found ${cssRefs.length} CSS references`);
      
      // Test each CSS reference
      for (const cssRef of cssRefs) {
        if (cssRef.type === 'external') {
          const cssUrl = cssRef.href.startsWith('http') ? cssRef.href : `${baseUrl}${cssRef.href}`;
          const cssTest = await this.testHttpRequest(cssUrl, `VITE_CSS_${cssRef.href}`);
          this.results.tests.push(cssTest);
          
          if (cssTest.success) {
            console.log(`  ✅ CSS accessible: ${cssRef.href}`);
          } else {
            console.log(`  ❌ CSS not accessible: ${cssRef.href}`);
          }
        }
      }
    } else {
      console.log('  ❌ Vite dev server not accessible');
      console.log(`  Error: ${rootTest.error || `HTTP ${rootTest.statusCode}`}`);
    }
  }

  /**
   * Test development CSS handling
   */
  async testDevelopmentCSSHandling(baseUrl) {
    console.log('  Testing Development CSS Handling...');
    
    // In development, CSS is typically served as JavaScript modules
    const commonCSSPaths = [
      '/src/index.css',
      '/src/App.css',
      '/src/styles/main.css'
    ];
    
    for (const cssPath of commonCSSPaths) {
      const cssTest = await this.testHttpRequest(`${baseUrl}${cssPath}`, `DEV_CSS_${cssPath}`);
      this.results.tests.push(cssTest);
      
      if (cssTest.success) {
        console.log(`  ✅ CSS module accessible: ${cssPath}`);
        
        // Check if it's served as JavaScript (normal for Vite)
        if (cssTest.contentType && cssTest.contentType.includes('javascript')) {
          console.log(`    📄 Served as JavaScript module (normal for Vite)`);
        }
      }
    }
  }

  /**
   * Test container internal access
   */
  async testContainerInternalAccess() {
    console.log('  Testing Container Internal Access...');
    
    try {
      // Test if we can access the server from inside the container
      const result = execSync('docker exec chemquest-client-dev wget -q -O - http://localhost:3000 2>/dev/null || echo "FAILED"', 
        { encoding: 'utf8', timeout: 5000 });
      
      if (result.includes('<!DOCTYPE html') || result.includes('<html')) {
        console.log('  ✅ Container internal access working');
        this.results.tests.push({
          testName: 'CONTAINER_INTERNAL_ACCESS',
          success: true,
          details: 'HTML content received from internal container access'
        });
      } else {
        console.log('  ❌ Container internal access failed');
        this.results.tests.push({
          testName: 'CONTAINER_INTERNAL_ACCESS',
          success: false,
          error: 'No HTML content received'
        });
      }
    } catch (error) {
      console.log('  ❌ Container internal access test failed');
      this.results.tests.push({
        testName: 'CONTAINER_INTERNAL_ACCESS',
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test nginx server
   */
  async testNginxServer(baseUrl) {
    console.log('  Testing Nginx Server...');
    
    const rootTest = await this.testHttpRequest(baseUrl, 'NGINX_ROOT');
    this.results.tests.push(rootTest);
    
    if (rootTest.success) {
      console.log('  ✅ Nginx server accessible');
    } else {
      console.log('  ❌ Nginx server not accessible');
    }
  }

  /**
   * Test static asset serving
   */
  async testStaticAssetServing(baseUrl) {
    console.log('  Testing Static Asset Serving...');
    
    // Try to find CSS assets in the built distribution
    const distPath = path.join(process.cwd(), 'client', 'dist');
    
    if (fs.existsSync(distPath)) {
      const assetsPath = path.join(distPath, 'assets');
      
      if (fs.existsSync(assetsPath)) {
        const files = fs.readdirSync(assetsPath);
        const cssFiles = files.filter(file => file.endsWith('.css'));
        
        console.log(`  Found ${cssFiles.length} CSS files in dist/assets`);
        
        for (const cssFile of cssFiles) {
          const cssUrl = `${baseUrl}/assets/${cssFile}`;
          const cssTest = await this.testHttpRequest(cssUrl, `STATIC_CSS_${cssFile}`);
          this.results.tests.push(cssTest);
          
          if (cssTest.success) {
            console.log(`  ✅ Static CSS accessible: ${cssFile}`);
          } else {
            console.log(`  ❌ Static CSS not accessible: ${cssFile}`);
          }
        }
      }
    }
  }

  /**
   * Test cache headers
   */
  async testCacheHeaders(baseUrl) {
    console.log('  Testing Cache Headers...');
    
    // This would be implemented similar to the previous cache header tests
    // but adapted for the production environment
  }

  /**
   * Test HTTP request
   */
  async testHttpRequest(url, testName) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const test = {
        testName,
        url,
        timestamp: new Date().toISOString(),
        success: false,
        statusCode: null,
        contentType: null,
        responseTime: null,
        error: null,
        body: null
      };

      const req = http.get(url, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          test.success = res.statusCode >= 200 && res.statusCode < 400;
          test.statusCode = res.statusCode;
          test.contentType = res.headers['content-type'];
          test.responseTime = Date.now() - startTime;
          test.body = body;
          
          resolve(test);
        });
      });

      req.on('error', (error) => {
        test.error = error.message;
        test.responseTime = Date.now() - startTime;
        resolve(test);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        test.error = 'Timeout';
        test.responseTime = Date.now() - startTime;
        resolve(test);
      });
    });
  }

  /**
   * Extract CSS references from HTML
   */
  extractCSSReferences(html) {
    if (!html) return [];
    
    const cssRefs = [];
    const linkMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
    
    linkMatches.forEach(link => {
      const hrefMatch = link.match(/href=["']([^"']*)["']/);
      if (hrefMatch) {
        cssRefs.push({
          type: 'external',
          href: hrefMatch[1]
        });
      }
    });
    
    return cssRefs;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const failedTests = this.results.tests.filter(test => !test.success);
    
    if (this.results.environment.development && failedTests.length > 0) {
      this.results.recommendations.push(
        'Development environment detected with failed tests. This is often normal as Vite serves CSS as JavaScript modules.'
      );
    }
    
    if (failedTests.some(test => test.testName.includes('CONTAINER_INTERNAL'))) {
      this.results.recommendations.push(
        'Container internal access failed. Check if the development server is running inside the container.'
      );
    }
    
    if (failedTests.some(test => test.error === 'Timeout')) {
      this.results.recommendations.push(
        'Request timeouts detected. Check network connectivity and server responsiveness.'
      );
    }
  }

  /**
   * Output results
   */
  outputResults() {
    console.log('\n📊 COMPREHENSIVE DIAGNOSTIC RESULTS');
    console.log('='.repeat(50));
    
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Environment: ${this.results.environment.detected}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    
    if (failedTests > 0) {
      console.log('\n🚨 Failed Tests:');
      this.results.tests.filter(test => !test.success).forEach(test => {
        console.log(`  ❌ ${test.testName}: ${test.error || `HTTP ${test.statusCode}`}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    // Save results
    const resultsPath = path.join(process.cwd(), 'comprehensive-css-diagnostic-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Detailed results saved to: ${resultsPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const diagnostic = new ComprehensiveCSSAssetDiagnostic();
  diagnostic.runDiagnostic().catch(console.error);
}

module.exports = ComprehensiveCSSAssetDiagnostic;
#!/usr/bin/env node

/**
 * Container Health Check for Static Assets
 * Verifies that containers are properly serving CSS and static assets
 * Requirements: 4.3
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

class ContainerHealthChecker {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  async performHealthCheck() {
    console.log('🐳 Performing container health check for static assets...\n');
    
    try {
      await this.checkContainerStatus();
      await this.checkApplicationHealth();
      await this.checkStaticAssetServing();
      await this.checkCSSAssetAccessibility();
      await this.checkAssetHeaders();
      await this.checkVolumeIntegrity();
      
      this.generateReport();
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Container health check failed:', error.message);
      this.errors.push(`Health check failed: ${error.message}`);
      return false;
    }
  }

  async checkContainerStatus() {
    const check = {
      name: 'Container Status',
      description: 'Verifies that containers are running',
      type: 'critical'
    };

    try {
      // Check if docker is available
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      check.dockerVersion = dockerVersion;

      // Check running containers
      const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { encoding: 'utf8' });
      check.containers = containers;

      // Look for client container
      const clientRunning = containers.includes('client') || containers.includes('3000');
      if (clientRunning) {
        check.status = 'pass';
        check.details = 'Client container is running';
      } else {
        check.status = 'fail';
        check.details = 'Client container not found or not running';
        this.errors.push('Client container is not running');
      }

    } catch (error) {
      check.status = 'fail';
      check.details = `Docker command failed: ${error.message}`;
      this.errors.push(`Cannot check container status: ${error.message}`);
    }

    this.checks.push(check);
  }

  async checkApplicationHealth() {
    const check = {
      name: 'Application Health',
      description: 'Verifies that the application is responding',
      type: 'critical'
    };

    try {
      const response = await this.makeRequest(`${this.baseUrl}/`);
      
      if (response.statusCode === 200) {
        check.status = 'pass';
        check.details = `Application responding (${response.statusCode})`;
        check.responseTime = response.responseTime;
      } else {
        check.status = 'fail';
        check.details = `Application not responding properly (${response.statusCode})`;
        this.errors.push(`Application health check failed: ${response.statusCode}`);
      }

    } catch (error) {
      check.status = 'fail';
      check.details = `Application not accessible: ${error.message}`;
      this.errors.push(`Application not accessible: ${error.message}`);
    }

    this.checks.push(check);
  }

  async checkStaticAssetServing() {
    const check = {
      name: 'Static Asset Serving',
      description: 'Verifies that static assets are being served',
      type: 'critical'
    };

    try {
      // Try to access the assets directory
      const response = await this.makeRequest(`${this.baseUrl}/assets/`);
      
      // 200 (directory listing) or 403 (forbidden but exists) are both OK
      if (response.statusCode === 200 || response.statusCode === 403) {
        check.status = 'pass';
        check.details = `Assets directory accessible (${response.statusCode})`;
        check.headers = response.headers;
      } else if (response.statusCode === 404) {
        check.status = 'fail';
        check.details = 'Assets directory not found (404)';
        this.errors.push('Static assets directory not accessible');
      } else {
        check.status = 'warn';
        check.details = `Unexpected response for assets directory (${response.statusCode})`;
        this.warnings.push(`Unexpected assets directory response: ${response.statusCode}`);
      }

    } catch (error) {
      check.status = 'fail';
      check.details = `Cannot access assets directory: ${error.message}`;
      this.errors.push(`Static asset serving check failed: ${error.message}`);
    }

    this.checks.push(check);
  }

  async checkCSSAssetAccessibility() {
    const check = {
      name: 'CSS Asset Accessibility',
      description: 'Verifies that CSS files are accessible',
      type: 'critical'
    };

    try {
      // First, try to get the main page to find CSS references
      const mainPageResponse = await this.makeRequest(`${this.baseUrl}/`);
      
      if (mainPageResponse.statusCode !== 200) {
        throw new Error('Cannot access main page to find CSS references');
      }

      // Extract CSS file references from the HTML
      const cssFiles = this.extractCSSReferences(mainPageResponse.body);
      
      if (cssFiles.length === 0) {
        check.status = 'fail';
        check.details = 'No CSS files found in HTML';
        this.errors.push('No CSS file references found in main page');
        this.checks.push(check);
        return;
      }

      check.cssFiles = [];
      let allAccessible = true;

      for (const cssFile of cssFiles) {
        const cssUrl = cssFile.startsWith('http') ? cssFile : `${this.baseUrl}${cssFile}`;
        
        try {
          const cssResponse = await this.makeRequest(cssUrl);
          const fileCheck = {
            url: cssFile,
            fullUrl: cssUrl,
            statusCode: cssResponse.statusCode,
            accessible: cssResponse.statusCode === 200,
            size: cssResponse.headers['content-length'] || 'unknown',
            contentType: cssResponse.headers['content-type'] || 'unknown'
          };

          if (cssResponse.statusCode !== 200) {
            allAccessible = false;
            this.errors.push(`CSS file not accessible: ${cssFile} (${cssResponse.statusCode})`);
          }

          check.cssFiles.push(fileCheck);

        } catch (error) {
          allAccessible = false;
          this.errors.push(`Error accessing CSS file ${cssFile}: ${error.message}`);
          check.cssFiles.push({
            url: cssFile,
            accessible: false,
            error: error.message
          });
        }
      }

      if (allAccessible) {
        check.status = 'pass';
        check.details = `All ${cssFiles.length} CSS files accessible`;
      } else {
        check.status = 'fail';
        check.details = `Some CSS files not accessible`;
      }

    } catch (error) {
      check.status = 'fail';
      check.details = `CSS accessibility check failed: ${error.message}`;
      this.errors.push(`CSS accessibility check failed: ${error.message}`);
    }

    this.checks.push(check);
  }

  async checkAssetHeaders() {
    const check = {
      name: 'Asset Headers',
      description: 'Verifies that assets have proper HTTP headers',
      type: 'performance'
    };

    try {
      // Test with a known asset path pattern
      const testAssetUrl = `${this.baseUrl}/assets/index.css`;
      
      try {
        const response = await this.makeRequest(testAssetUrl);
        
        const headers = response.headers;
        const headerChecks = {
          contentType: headers['content-type'] === 'text/css',
          cacheControl: !!headers['cache-control'],
          expires: !!headers['expires'],
          cors: !!headers['access-control-allow-origin'],
          contentEncoding: !!headers['content-encoding']
        };

        check.headers = headers;
        check.headerChecks = headerChecks;

        const goodHeaders = Object.values(headerChecks).filter(Boolean).length;
        
        if (goodHeaders >= 2) {
          check.status = 'pass';
          check.details = `Asset headers properly configured (${goodHeaders}/5 checks passed)`;
        } else {
          check.status = 'warn';
          check.details = `Asset headers could be improved (${goodHeaders}/5 checks passed)`;
          this.warnings.push('Consider improving asset headers for better performance');
        }

      } catch (error) {
        // If we can't find a specific CSS file, try the assets directory
        const response = await this.makeRequest(`${this.baseUrl}/assets/`);
        check.status = 'warn';
        check.details = 'Could not test specific CSS file headers, but assets directory is accessible';
        this.warnings.push('Could not verify CSS file headers - no specific CSS file found');
      }

    } catch (error) {
      check.status = 'fail';
      check.details = `Asset header check failed: ${error.message}`;
      this.errors.push(`Asset header check failed: ${error.message}`);
    }

    this.checks.push(check);
  }

  async checkVolumeIntegrity() {
    const check = {
      name: 'Volume Integrity',
      description: 'Verifies that volume mounts are working correctly',
      type: 'infrastructure'
    };

    try {
      // Check if we can access container filesystem info
      const containerInfo = execSync('docker ps --format "{{.Names}}" | grep -E "(client|web|nginx)"', { encoding: 'utf8' }).trim();
      
      if (containerInfo) {
        const containerName = containerInfo.split('\n')[0];
        
        try {
          // Check if the assets directory exists in the container
          const assetCheck = execSync(`docker exec ${containerName} ls -la /usr/share/nginx/html/assets/ 2>/dev/null || echo "not found"`, { encoding: 'utf8' });
          
          if (assetCheck.includes('not found')) {
            check.status = 'fail';
            check.details = 'Assets directory not found in container';
            this.errors.push('Assets directory not mounted or accessible in container');
          } else {
            check.status = 'pass';
            check.details = 'Volume mount appears to be working correctly';
            check.assetListing = assetCheck.trim();
          }

        } catch (error) {
          check.status = 'warn';
          check.details = `Could not verify volume integrity: ${error.message}`;
          this.warnings.push('Could not verify container volume integrity');
        }

      } else {
        check.status = 'warn';
        check.details = 'No client container found for volume check';
        this.warnings.push('Could not find client container for volume integrity check');
      }

    } catch (error) {
      check.status = 'warn';
      check.details = `Volume integrity check failed: ${error.message}`;
      this.warnings.push(`Volume integrity check failed: ${error.message}`);
    }

    this.checks.push(check);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;
      
      const request = client.get(url, (response) => {
        let body = '';
        
        response.on('data', chunk => {
          body += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: body,
            responseTime: Date.now() - startTime
          });
        });
      });

      request.on('error', reject);
      
      request.setTimeout(this.timeout, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  extractCSSReferences(html) {
    const cssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    const matches = [];
    let match;

    while ((match = cssRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  generateReport() {
    console.log('📊 Container Health Check Report');
    console.log('=================================\n');

    // Summary by type
    const critical = this.checks.filter(c => c.type === 'critical');
    const performance = this.checks.filter(c => c.type === 'performance');
    const infrastructure = this.checks.filter(c => c.type === 'infrastructure');

    console.log('🔴 Critical Checks:');
    critical.forEach(check => this.printCheck(check));

    console.log('\n🟡 Performance Checks:');
    performance.forEach(check => this.printCheck(check));

    console.log('\n🔵 Infrastructure Checks:');
    infrastructure.forEach(check => this.printCheck(check));

    // Summary
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warn').length;

    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    // Detailed issues
    if (this.errors.length > 0) {
      console.log('\n❌ Critical Issues:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    const success = this.errors.length === 0;
    console.log(`\n${success ? '✅ Container health check PASSED' : '❌ Container health check FAILED'}`);
    
    return success;
  }

  printCheck(check) {
    let icon;
    switch (check.status) {
      case 'pass': icon = '✅'; break;
      case 'fail': icon = '❌'; break;
      case 'warn': icon = '⚠️'; break;
      default: icon = '❓';
    }

    console.log(`  ${icon} ${check.name}: ${check.details}`);
    
    if (check.responseTime) {
      console.log(`     Response time: ${check.responseTime}ms`);
    }
    
    if (check.cssFiles && check.cssFiles.length > 0) {
      console.log(`     CSS files checked: ${check.cssFiles.length}`);
      check.cssFiles.forEach(file => {
        const fileIcon = file.accessible ? '✅' : '❌';
        console.log(`       ${fileIcon} ${file.url} (${file.size} bytes)`);
      });
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    if (value && !value.startsWith('--')) {
      options[key] = value;
    }
  }

  const checker = new ContainerHealthChecker(options);
  
  checker.performHealthCheck()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

module.exports = ContainerHealthChecker;
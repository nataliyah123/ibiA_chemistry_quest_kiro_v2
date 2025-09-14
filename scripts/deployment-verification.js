#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies CSS assets and configuration after deployment
 * Requirements: 4.1, 4.2, 4.3
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class DeploymentVerifier {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.clientDistPath = options.clientDistPath || path.join(__dirname, '../client/dist');
    this.nginxConfigPath = options.nginxConfigPath || path.join(__dirname, '../client/nginx.conf');
    this.results = {
      cssAssets: [],
      nginxConfig: {},
      containerHealth: {},
      errors: [],
      warnings: []
    };
  }

  async verifyDeployment() {
    console.log('🚀 Starting deployment verification...\n');
    
    try {
      await this.verifyCSSAssets();
      await this.verifyNginxConfiguration();
      await this.verifyContainerHealth();
      
      this.generateReport();
      return this.results.errors.length === 0;
    } catch (error) {
      console.error('❌ Deployment verification failed:', error.message);
      this.results.errors.push(`Verification failed: ${error.message}`);
      return false;
    }
  }

  async verifyCSSAssets() {
    console.log('📋 Verifying CSS assets...');
    
    // Check if dist directory exists
    if (!fs.existsSync(this.clientDistPath)) {
      this.results.errors.push('Client dist directory not found');
      return;
    }

    // Find CSS assets in dist
    const assetsPath = path.join(this.clientDistPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      this.results.errors.push('Assets directory not found in dist');
      return;
    }

    const cssFiles = fs.readdirSync(assetsPath)
      .filter(file => file.endsWith('.css'))
      .map(file => ({
        filename: file,
        path: path.join(assetsPath, file),
        size: fs.statSync(path.join(assetsPath, file)).size,
        url: `${this.baseUrl}/assets/${file}`
      }));

    if (cssFiles.length === 0) {
      this.results.errors.push('No CSS files found in assets directory');
      return;
    }

    // Verify each CSS file
    for (const cssFile of cssFiles) {
      try {
        // Check file accessibility
        const accessible = await this.checkAssetAccessibility(cssFile.url);
        cssFile.accessible = accessible;
        
        if (!accessible) {
          this.results.errors.push(`CSS file not accessible: ${cssFile.filename}`);
        }

        // Check file content
        const content = fs.readFileSync(cssFile.path, 'utf8');
        cssFile.hasContent = content.length > 0;
        cssFile.hasImportantStyles = this.checkForImportantStyles(content);
        
        if (!cssFile.hasContent) {
          this.results.errors.push(`CSS file is empty: ${cssFile.filename}`);
        }

        this.results.cssAssets.push(cssFile);
        console.log(`  ✅ ${cssFile.filename} (${cssFile.size} bytes)`);
      } catch (error) {
        this.results.errors.push(`Error verifying CSS file ${cssFile.filename}: ${error.message}`);
        console.log(`  ❌ ${cssFile.filename} - ${error.message}`);
      }
    }
  }

  async verifyNginxConfiguration() {
    console.log('\n🔧 Verifying nginx configuration...');
    
    try {
      if (!fs.existsSync(this.nginxConfigPath)) {
        this.results.errors.push('Nginx configuration file not found');
        return;
      }

      const nginxConfig = fs.readFileSync(this.nginxConfigPath, 'utf8');
      
      // Check for CSS-specific configurations
      const checks = {
        hasStaticLocation: /location\s+\/assets/.test(nginxConfig) || /location\s+~\*?\s*\\?\.\([^)]*css[^)]*\)/.test(nginxConfig),
        hasCSSMimeType: /text\/css/.test(nginxConfig),
        hasCacheHeaders: /expires|Cache-Control/.test(nginxConfig),
        hasCORSHeaders: /Access-Control-Allow-Origin/.test(nginxConfig),
        hasGzipCompression: /gzip/.test(nginxConfig)
      };

      this.results.nginxConfig = checks;

      // Report findings
      Object.entries(checks).forEach(([check, passed]) => {
        if (passed) {
          console.log(`  ✅ ${check}`);
        } else {
          console.log(`  ⚠️  ${check}`);
          this.results.warnings.push(`Nginx configuration missing: ${check}`);
        }
      });

      // Critical checks
      if (!checks.hasStaticLocation) {
        this.results.errors.push('Nginx configuration missing static assets location');
      }

    } catch (error) {
      this.results.errors.push(`Error verifying nginx configuration: ${error.message}`);
      console.log(`  ❌ Error reading nginx config: ${error.message}`);
    }
  }

  async verifyContainerHealth() {
    console.log('\n🐳 Verifying container health...');
    
    try {
      // Check if application is responding
      const healthCheck = await this.checkHealthEndpoint();
      this.results.containerHealth.healthEndpoint = healthCheck;

      if (healthCheck.accessible) {
        console.log('  ✅ Health endpoint accessible');
      } else {
        this.results.errors.push('Health endpoint not accessible');
        console.log('  ❌ Health endpoint not accessible');
      }

      // Check static asset serving
      const staticAssetCheck = await this.checkStaticAssetServing();
      this.results.containerHealth.staticAssets = staticAssetCheck;

      if (staticAssetCheck.working) {
        console.log('  ✅ Static assets being served correctly');
      } else {
        this.results.errors.push('Static assets not being served correctly');
        console.log('  ❌ Static assets not being served correctly');
      }

    } catch (error) {
      this.results.errors.push(`Error verifying container health: ${error.message}`);
      console.log(`  ❌ Container health check failed: ${error.message}`);
    }
  }

  async checkAssetAccessibility(url) {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const request = client.get(url, (response) => {
        resolve(response.statusCode === 200);
      });
      
      request.on('error', () => resolve(false));
      request.setTimeout(5000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  async checkHealthEndpoint() {
    const healthUrl = `${this.baseUrl}/api/health`;
    
    return new Promise((resolve) => {
      const client = healthUrl.startsWith('https') ? https : http;
      const request = client.get(healthUrl, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            accessible: response.statusCode === 200,
            statusCode: response.statusCode,
            response: data
          });
        });
      });
      
      request.on('error', (error) => {
        resolve({
          accessible: false,
          error: error.message
        });
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        resolve({
          accessible: false,
          error: 'Timeout'
        });
      });
    });
  }

  async checkStaticAssetServing() {
    // Try to access a known static asset
    const testUrl = `${this.baseUrl}/assets/`;
    
    return new Promise((resolve) => {
      const client = testUrl.startsWith('https') ? https : http;
      const request = client.get(testUrl, (response) => {
        resolve({
          working: response.statusCode === 200 || response.statusCode === 403, // 403 is OK for directory listing
          statusCode: response.statusCode,
          headers: response.headers
        });
      });
      
      request.on('error', (error) => {
        resolve({
          working: false,
          error: error.message
        });
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        resolve({
          working: false,
          error: 'Timeout'
        });
      });
    });
  }

  checkForImportantStyles(cssContent) {
    // Check for common important styles that indicate proper CSS loading
    const importantPatterns = [
      /\.app/i,
      /body/i,
      /html/i,
      /button/i,
      /input/i,
      /\.container/i,
      /\.header/i,
      /\.nav/i
    ];

    return importantPatterns.some(pattern => pattern.test(cssContent));
  }

  generateReport() {
    console.log('\n📊 Deployment Verification Report');
    console.log('=====================================');
    
    console.log(`\n📋 CSS Assets: ${this.results.cssAssets.length} found`);
    this.results.cssAssets.forEach(asset => {
      const status = asset.accessible ? '✅' : '❌';
      console.log(`  ${status} ${asset.filename} (${asset.size} bytes)`);
    });

    console.log('\n🔧 Nginx Configuration:');
    Object.entries(this.results.nginxConfig).forEach(([check, passed]) => {
      const status = passed ? '✅' : '⚠️';
      console.log(`  ${status} ${check}`);
    });

    console.log('\n🐳 Container Health:');
    if (this.results.containerHealth.healthEndpoint) {
      const status = this.results.containerHealth.healthEndpoint.accessible ? '✅' : '❌';
      console.log(`  ${status} Health endpoint`);
    }
    if (this.results.containerHealth.staticAssets) {
      const status = this.results.containerHealth.staticAssets.working ? '✅' : '❌';
      console.log(`  ${status} Static asset serving`);
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }

    const success = this.results.errors.length === 0;
    console.log(`\n${success ? '✅ Deployment verification PASSED' : '❌ Deployment verification FAILED'}`);
    
    return success;
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
    options[key] = value;
  }

  const verifier = new DeploymentVerifier(options);
  
  verifier.verifyDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentVerifier;
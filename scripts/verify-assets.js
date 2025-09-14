#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

/**
 * Container startup asset verification script
 * Verifies CSS assets are properly available after container startup
 */

const STATIC_PATH = process.env.STATIC_PATH || '/usr/share/nginx/html';
const ASSETS_PATH = path.join(STATIC_PATH, 'assets');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

class AssetVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      staticFiles: [],
      httpChecks: [],
      errors: [],
      summary: {
        totalFiles: 0,
        validFiles: 0,
        httpSuccess: 0,
        httpFailed: 0
      }
    };
  }

  async verifyStaticFiles() {
    console.log('🔍 Verifying static CSS files...');
    
    try {
      // Check if assets directory exists
      await fs.access(ASSETS_PATH);
      
      // Get all files in assets directory
      const files = await fs.readdir(ASSETS_PATH);
      const cssFiles = files.filter(file => file.endsWith('.css'));
      
      console.log(`Found ${cssFiles.length} CSS files`);
      
      for (const file of cssFiles) {
        const filePath = path.join(ASSETS_PATH, file);
        
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          
          const fileResult = {
            name: file,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            valid: content.length > 0 && content.includes('css'),
            contentPreview: content.substring(0, 100) + '...'
          };
          
          this.results.staticFiles.push(fileResult);
          
          if (fileResult.valid) {
            this.results.summary.validFiles++;
            console.log(`✅ ${file} - ${stats.size} bytes`);
          } else {
            console.log(`❌ ${file} - Invalid content`);
          }
          
        } catch (error) {
          const errorResult = {
            name: file,
            path: filePath,
            valid: false,
            error: error.message
          };
          
          this.results.staticFiles.push(errorResult);
          this.results.errors.push(`File error: ${file} - ${error.message}`);
          console.log(`❌ ${file} - ${error.message}`);
        }
      }
      
      this.results.summary.totalFiles = cssFiles.length;
      
    } catch (error) {
      this.results.errors.push(`Assets directory error: ${error.message}`);
      console.log(`❌ Assets directory not accessible: ${error.message}`);
    }
  }

  async verifyHttpAccess() {
    console.log('🌐 Verifying HTTP access to CSS assets...');
    
    // Test CSS files via HTTP
    for (const file of this.results.staticFiles) {
      if (file.valid) {
        const assetUrl = `${CLIENT_URL}/assets/${file.name}`;
        
        try {
          const success = await this.checkHttpAsset(assetUrl);
          
          const httpResult = {
            url: assetUrl,
            success,
            timestamp: new Date().toISOString()
          };
          
          this.results.httpChecks.push(httpResult);
          
          if (success) {
            this.results.summary.httpSuccess++;
            console.log(`✅ HTTP: ${assetUrl}`);
          } else {
            this.results.summary.httpFailed++;
            console.log(`❌ HTTP: ${assetUrl}`);
          }
          
        } catch (error) {
          this.results.httpChecks.push({
            url: assetUrl,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          this.results.summary.httpFailed++;
          this.results.errors.push(`HTTP error: ${assetUrl} - ${error.message}`);
          console.log(`❌ HTTP: ${assetUrl} - ${error.message}`);
        }
      }
    }
  }

  checkHttpAsset(url) {
    return new Promise((resolve) => {
      const request = http.get(url, (res) => {
        resolve(res.statusCode === 200 && res.headers['content-type']?.includes('text/css'));
      });
      
      request.on('error', () => {
        resolve(false);
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  async verifyHealthEndpoint() {
    console.log('🏥 Verifying health check endpoint...');
    
    const healthUrl = `${SERVER_URL}/api/health/assets/css`;
    
    try {
      const success = await this.checkHttpAsset(healthUrl);
      
      if (success) {
        console.log(`✅ Health endpoint: ${healthUrl}`);
      } else {
        console.log(`❌ Health endpoint: ${healthUrl}`);
        this.results.errors.push(`Health endpoint not accessible: ${healthUrl}`);
      }
      
    } catch (error) {
      console.log(`❌ Health endpoint error: ${error.message}`);
      this.results.errors.push(`Health endpoint error: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n📊 Asset Verification Summary');
    console.log('================================');
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Total CSS files: ${this.results.summary.totalFiles}`);
    console.log(`Valid files: ${this.results.summary.validFiles}`);
    console.log(`HTTP success: ${this.results.summary.httpSuccess}`);
    console.log(`HTTP failed: ${this.results.summary.httpFailed}`);
    console.log(`Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    const isHealthy = this.results.errors.length === 0 && 
                     this.results.summary.validFiles > 0 && 
                     this.results.summary.httpSuccess > 0;
    
    console.log(`\n${isHealthy ? '✅' : '❌'} Overall Status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    return isHealthy;
  }

  async saveResults() {
    const resultsPath = '/tmp/asset-verification-results.json';
    
    try {
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Results saved to: ${resultsPath}`);
    } catch (error) {
      console.log(`❌ Failed to save results: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting container asset verification...\n');
  
  const verifier = new AssetVerifier();
  
  try {
    await verifier.verifyStaticFiles();
    await verifier.verifyHttpAccess();
    await verifier.verifyHealthEndpoint();
    
    const isHealthy = verifier.printSummary();
    await verifier.saveResults();
    
    // Exit with appropriate code
    process.exit(isHealthy ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { AssetVerifier };
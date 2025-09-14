#!/usr/bin/env node

/**
 * Nginx Configuration Checker
 * Automated checks for nginx configuration related to CSS serving
 * Requirements: 4.2
 */

const fs = require('fs');
const path = require('path');

class NginxConfigChecker {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '../client/nginx.conf');
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  async checkConfiguration() {
    console.log('🔧 Checking nginx configuration for CSS serving...\n');
    
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Nginx configuration file not found: ${this.configPath}`);
      }

      const config = fs.readFileSync(this.configPath, 'utf8');
      
      this.checkStaticAssetLocation(config);
      this.checkMimeTypes(config);
      this.checkCacheHeaders(config);
      this.checkCORSHeaders(config);
      this.checkGzipCompression(config);
      this.checkSecurityHeaders(config);
      this.checkErrorHandling(config);
      
      this.generateReport();
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Failed to check nginx configuration:', error.message);
      this.errors.push(error.message);
      return false;
    }
  }

  checkStaticAssetLocation(config) {
    const check = {
      name: 'Static Asset Location',
      description: 'Checks for proper static asset location configuration',
      required: true
    };

    // Look for assets location block (specific /assets path)
    const assetLocationRegex = /location\s+\/assets\s*\{[^}]*\}/gs;
    const assetMatch = config.match(assetLocationRegex);
    
    // Look for regex-based static asset location (covers CSS, JS, images, etc.)
    const staticAssetRegex = /location\s+~\*?\s*\\?\.\([^)]*css[^)]*\)[^{]*\{[^}]*\}/gs;
    const staticMatch = config.match(staticAssetRegex);
    
    if (assetMatch) {
      check.status = 'pass';
      check.details = 'Found /assets location block';
      
      // Check if it has proper configuration
      const locationBlock = assetMatch[0];
      if (locationBlock.includes('try_files')) {
        check.details += ' with try_files directive';
      }
      if (locationBlock.includes('expires')) {
        check.details += ' and cache expiration';
      }
    } else if (staticMatch) {
      check.status = 'pass';
      check.details = 'Found regex-based static asset location block for CSS files';
      
      // Check if it has proper configuration
      const locationBlock = staticMatch[0];
      if (locationBlock.includes('try_files')) {
        check.details += ' with try_files directive';
      }
      if (locationBlock.includes('expires')) {
        check.details += ' and cache expiration';
      }
    } else {
      check.status = 'fail';
      check.details = 'No static asset location configuration found';
      this.errors.push('Missing static asset location block in nginx configuration');
    }

    this.checks.push(check);
  }

  checkMimeTypes(config) {
    const check = {
      name: 'MIME Types',
      description: 'Checks for proper CSS MIME type configuration',
      required: true
    };

    // Check for mime types inclusion
    if (config.includes('include /etc/nginx/mime.types') || config.includes('mime.types')) {
      check.status = 'pass';
      check.details = 'MIME types included';
    } else if (config.includes('text/css')) {
      check.status = 'pass';
      check.details = 'CSS MIME type explicitly configured';
    } else {
      check.status = 'fail';
      check.details = 'No MIME type configuration found';
      this.errors.push('Missing MIME type configuration for CSS files');
    }

    this.checks.push(check);
  }

  checkCacheHeaders(config) {
    const check = {
      name: 'Cache Headers',
      description: 'Checks for proper cache control headers',
      required: false
    };

    const cachePatterns = [
      /expires\s+\d+[dhmy]/i,
      /add_header\s+Cache-Control/i,
      /add_header\s+["']Cache-Control/i
    ];

    const hasCacheConfig = cachePatterns.some(pattern => pattern.test(config));
    
    if (hasCacheConfig) {
      check.status = 'pass';
      check.details = 'Cache headers configured';
      
      // Check for immutable cache for assets
      if (config.includes('immutable')) {
        check.details += ' with immutable directive';
      }
    } else {
      check.status = 'warn';
      check.details = 'No cache headers found - may impact performance';
      this.warnings.push('Consider adding cache headers for better performance');
    }

    this.checks.push(check);
  }

  checkCORSHeaders(config) {
    const check = {
      name: 'CORS Headers',
      description: 'Checks for Cross-Origin Resource Sharing headers',
      required: false
    };

    const corsPatterns = [
      /add_header\s+["']?Access-Control-Allow-Origin/i,
      /add_header\s+Access-Control-Allow-Origin/i
    ];

    const hasCORS = corsPatterns.some(pattern => pattern.test(config));
    
    if (hasCORS) {
      check.status = 'pass';
      check.details = 'CORS headers configured';
    } else {
      check.status = 'warn';
      check.details = 'No CORS headers found - may cause issues with cross-origin requests';
      this.warnings.push('Consider adding CORS headers if serving assets cross-origin');
    }

    this.checks.push(check);
  }

  checkGzipCompression(config) {
    const check = {
      name: 'Gzip Compression',
      description: 'Checks for gzip compression configuration',
      required: false
    };

    if (config.includes('gzip on') || config.includes('gzip_static on')) {
      check.status = 'pass';
      check.details = 'Gzip compression enabled';
      
      // Check if CSS is included in gzip types
      if (config.includes('text/css')) {
        check.details += ' for CSS files';
      }
    } else {
      check.status = 'warn';
      check.details = 'Gzip compression not configured - may impact performance';
      this.warnings.push('Consider enabling gzip compression for better performance');
    }

    this.checks.push(check);
  }

  checkSecurityHeaders(config) {
    const check = {
      name: 'Security Headers',
      description: 'Checks for security-related headers',
      required: false
    };

    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy'
    ];

    const foundHeaders = securityHeaders.filter(header => 
      config.includes(header)
    );

    if (foundHeaders.length > 0) {
      check.status = 'pass';
      check.details = `Security headers found: ${foundHeaders.join(', ')}`;
    } else {
      check.status = 'warn';
      check.details = 'No security headers found';
      this.warnings.push('Consider adding security headers for better protection');
    }

    this.checks.push(check);
  }

  checkErrorHandling(config) {
    const check = {
      name: 'Error Handling',
      description: 'Checks for proper error page configuration',
      required: false
    };

    const errorPatterns = [
      /error_page\s+404/i,
      /try_files.*404/i,
      /try_files.*\/index\.html/i
    ];

    const hasErrorHandling = errorPatterns.some(pattern => pattern.test(config));
    
    if (hasErrorHandling) {
      check.status = 'pass';
      check.details = 'Error handling configured';
    } else {
      check.status = 'warn';
      check.details = 'No specific error handling found';
      this.warnings.push('Consider adding error handling for missing assets');
    }

    this.checks.push(check);
  }

  generateReport() {
    console.log('📊 Nginx Configuration Check Report');
    console.log('====================================\n');

    // Summary
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warn').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}\n`);

    // Detailed results
    this.checks.forEach(check => {
      let icon;
      switch (check.status) {
        case 'pass': icon = '✅'; break;
        case 'fail': icon = '❌'; break;
        case 'warn': icon = '⚠️'; break;
        default: icon = '❓';
      }

      console.log(`${icon} ${check.name}`);
      console.log(`   ${check.details}`);
      if (check.required && check.status === 'fail') {
        console.log('   ⚠️  This is a required configuration');
      }
      console.log();
    });

    // Recommendations
    if (this.warnings.length > 0) {
      console.log('💡 Recommendations:');
      this.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
      console.log();
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('❌ Critical Issues:');
      this.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log();
    }

    const success = this.errors.length === 0;
    console.log(`${success ? '✅ Configuration check PASSED' : '❌ Configuration check FAILED'}`);
    
    return success;
  }

  // Generate nginx configuration suggestions
  generateSuggestions() {
    console.log('\n💡 Nginx Configuration Suggestions:');
    console.log('=====================================\n');

    const suggestions = `
# Recommended nginx configuration for CSS assets
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Include MIME types
    include /etc/nginx/mime.types;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Static assets with long-term caching
    location /assets/ {
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        
        # No cache for HTML files
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Error handling
    error_page 404 /index.html;
}`;

    console.log(suggestions);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find(arg => !arg.startsWith('--')) || null;
  const showSuggestions = args.includes('--suggestions');

  const checker = new NginxConfigChecker(configPath);
  
  checker.checkConfiguration()
    .then(success => {
      if (showSuggestions) {
        checker.generateSuggestions();
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Configuration check failed:', error);
      process.exit(1);
    });
}

module.exports = NginxConfigChecker;
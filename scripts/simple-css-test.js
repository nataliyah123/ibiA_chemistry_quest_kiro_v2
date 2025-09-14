#!/usr/bin/env node

/**
 * Simple CSS Asset Test
 * 
 * A simplified test to verify CSS asset accessibility in development mode
 */

const http = require('http');

async function testUrl(url, description) {
  return new Promise((resolve) => {
    console.log(`Testing: ${description}`);
    console.log(`URL: ${url}`);
    
    const req = http.get(url, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Content-Length: ${res.headers['content-length'] || body.length}`);
        
        if (res.statusCode === 200 && body.length > 0) {
          console.log('✅ Success');
          if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
            // Extract CSS references from HTML
            const cssMatches = body.match(/href="([^"]*\.css)"/g) || [];
            console.log(`CSS references found: ${cssMatches.length}`);
            cssMatches.forEach(match => {
              const href = match.match(/href="([^"]*)"/)[1];
              console.log(`  - ${href}`);
            });
          }
        } else {
          console.log('❌ Failed');
        }
        
        console.log('---');
        resolve({ success: res.statusCode === 200, body, headers: res.headers });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      console.log('---');
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Timeout');
      console.log('---');
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function main() {
  console.log('🔍 Simple CSS Asset Test\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Root page
  const rootResult = await testUrl(baseUrl, 'Root page');
  
  if (rootResult.success && rootResult.body) {
    // Extract CSS asset paths from the HTML
    const cssMatches = rootResult.body.match(/href="([^"]*\.css)"/g) || [];
    
    if (cssMatches.length > 0) {
      console.log(`Found ${cssMatches.length} CSS references, testing accessibility...\n`);
      
      for (const match of cssMatches) {
        const href = match.match(/href="([^"]*)"/)[1];
        const cssUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        
        await testUrl(cssUrl, `CSS Asset: ${href}`);
      }
    } else {
      console.log('No CSS references found in HTML\n');
    }
  }
  
  // Test 2: Try common asset paths
  const commonPaths = [
    '/assets/index.css',
    '/src/index.css',
    '/src/App.css',
    '/dist/assets/index.css'
  ];
  
  console.log('Testing common CSS paths...\n');
  for (const path of commonPaths) {
    await testUrl(`${baseUrl}${path}`, `Common path: ${path}`);
  }
  
  console.log('🏁 Test complete!');
}

main().catch(console.error);
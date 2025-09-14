# Vite Docker Configuration Fix

This document describes the fix for Vite development server issues in Docker containers, specifically addressing WebSocket connection failures and CSS asset serving problems.

## Problem Description

When running the Vite development server in Docker containers, the following issues were observed:

1. **WebSocket Connection Failures**: HMR (Hot Module Replacement) WebSocket connections fail with errors like:
   ```
   WebSocket connection to 'ws://localhost:3000/?token=...' failed
   ```

2. **CSS Asset 503 Errors**: CSS assets return 503 Service Unavailable errors:
   ```
   Failed to load resource: the server responded with a status of 503 ()
   ```

3. **Missing Styles**: Users lose all styling after login/navigation, resulting in unstyled content.

## Root Cause Analysis

The issues stem from:

1. **Incorrect HMR Configuration**: Vite's HMR WebSocket server wasn't properly configured for Docker networking
2. **File Watching Issues**: Docker volume mounts on Windows/macOS don't trigger file system events properly
3. **Network Binding**: Vite server wasn't bound to the correct host for container access
4. **Missing Fallback**: No fallback mechanism when WebSocket connections fail

## Solution Implementation

### 1. Vite Configuration Updates

Updated `client/vite.config.ts`:

```typescript
export default defineConfig({
  // ... other config
  server: {
    port: 3000,
    host: '0.0.0.0',           // Bind to all interfaces for Docker
    hmr: {
      port: 3000,
      host: 'localhost'        // HMR WebSocket host
    },
    watch: {
      usePolling: true         // Enable polling for Docker volumes
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 2. Docker Environment Variables

Added to `docker-compose.dev.yml`:

```yaml
client:
  environment:
    VITE_API_URL: http://localhost:5000/api
    CHOKIDAR_USEPOLLING: true    # Enable file watching polling
    WATCHPACK_POLLING: true      # Enable webpack polling
```

### 3. CSS Fallback System

Created `client/src/utils/cssLoadingFallback.ts` with:

- **WebSocket Monitoring**: Detects WebSocket connection failures
- **CSS Load Monitoring**: Monitors stylesheet loading status
- **Automatic Retry**: Retries failed CSS loads with exponential backoff
- **Fallback Styles**: Applies basic styling when CSS fails
- **User Notification**: Shows notification when fallback is active

### 4. Integration with App

Updated `client/src/App.tsx` to initialize the fallback system in development mode:

```typescript
// Initialize CSS fallback system for development mode
if (process.env.NODE_ENV === 'development') {
  try {
    initializeCSSFallback({
      retryAttempts: 3,
      retryDelay: 1000
    });
    console.log('CSS fallback system initialized for development mode');
  } catch (error) {
    console.warn('CSS fallback initialization failed:', error);
  }
}
```

## Features of the CSS Fallback System

### 1. WebSocket Failure Detection

```typescript
// Monitors WebSocket connections and applies fallback when they fail
window.WebSocket = class extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    
    this.addEventListener('error', (event) => {
      console.warn('WebSocket connection failed:', event);
      // Apply fallback for development mode
      setTimeout(() => {
        this.checkForMissingStyles();
      }, 2000);
    });
  }
}
```

### 2. CSS Load Retry Mechanism

```typescript
private async handleCSSLoadFailure(link: HTMLLinkElement): Promise<void> {
  const href = link.href;
  
  for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
    try {
      await this.reloadStylesheet(link);
      return; // Success
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
      }
    }
  }
  
  // All retries failed, apply fallback
  this.applyFallbackStyles();
}
```

### 3. Fallback Styles

Provides basic styling to maintain application functionality:

```css
/* Basic fallback styles for ChemQuest */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  color: #333;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  /* ... more styles */
}
```

### 4. User Notification

Shows a notification when fallback styles are applied:

```typescript
private showFallbackNotification(): void {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: #ff6b35;">
      <strong>Styling Issue Detected</strong><br>
      Some styles failed to load. Using fallback styles.
      <button onclick="window.location.reload()">Refresh</button>
    </div>
  `;
  document.body.appendChild(notification);
}
```

## Testing

### 1. Test Page

Created `client/src/pages/CSSFallbackDevTestPage.tsx` for testing:

- WebSocket failure simulation
- CSS load failure testing
- Fallback styles verification
- Current stylesheet status checking

### 2. Integration Tests

Created `client/src/test/integration/viteDockerConfiguration.test.tsx`:

- Vite configuration validation
- WebSocket error handling
- CSS loading failure detection
- Fallback system functionality

### 3. Test Scripts

Created test scripts for validation:

- `scripts/test-vite-docker.sh` (Linux/macOS)
- `scripts/test-vite-docker.ps1` (Windows)

## Usage

### Development Mode

1. Start the development environment:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. Access the application at `http://localhost:3000`

3. If WebSocket connections fail, the fallback system will:
   - Detect the failure
   - Retry CSS loading
   - Apply fallback styles if needed
   - Show a notification to the user

### Testing the Fix

1. Visit the CSS Dev Test page: `http://localhost:3000/css-dev-test`
2. Use the test buttons to simulate failures
3. Check browser console for fallback system logs
4. Run the test script: `./scripts/test-vite-docker.ps1`

## Configuration Options

The CSS fallback system can be configured:

```typescript
initializeCSSFallback({
  retryAttempts: 3,        // Number of retry attempts
  retryDelay: 1000,        // Base delay between retries (ms)
  fallbackStyles: '...'    // Custom fallback CSS
});
```

## Troubleshooting

### Common Issues

1. **WebSocket Still Failing**: 
   - Check Windows Firewall settings
   - Verify Docker networking configuration
   - Try restarting Docker containers

2. **CSS Still Not Loading**:
   - Check browser console for errors
   - Verify Vite configuration
   - Try clearing browser cache

3. **Fallback Not Activating**:
   - Check if development mode is detected
   - Verify fallback system initialization
   - Look for JavaScript errors

### Debug Commands

```bash
# Check container logs
docker-compose -f docker-compose.dev.yml logs client

# Check container environment
docker exec chemquest-client-dev env

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000

# Check CSS asset serving
curl -I http://localhost:3000/src/App.css
```

## Benefits

1. **Improved Development Experience**: Developers can continue working even when HMR fails
2. **Graceful Degradation**: Application remains functional with basic styling
3. **Automatic Recovery**: System attempts to recover from CSS loading failures
4. **User Feedback**: Clear notification when issues occur
5. **Cross-Platform**: Works on Windows, macOS, and Linux Docker environments

## Future Improvements

1. **Enhanced Fallback Styles**: More comprehensive fallback CSS
2. **Better Error Reporting**: Integration with error tracking services
3. **Performance Monitoring**: Track CSS loading performance
4. **Automatic Refresh**: Smart page refresh when issues are resolved
5. **Configuration UI**: Settings panel for fallback system options

## Related Files

- `client/vite.config.ts` - Vite configuration
- `client/src/utils/cssLoadingFallback.ts` - Fallback system
- `client/src/App.tsx` - Integration point
- `docker-compose.dev.yml` - Docker configuration
- `client/src/pages/CSSFallbackDevTestPage.tsx` - Test page
- `scripts/test-vite-docker.ps1` - Test script
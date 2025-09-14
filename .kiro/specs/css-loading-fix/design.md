# Design Document

## Overview

The CSS loading issue occurs when users navigate from login to authenticated pages, resulting in loss of styling. Based on analysis of the current setup, the problem appears to be related to how static assets are served and cached in the containerized environment, particularly after authentication state changes.

The current architecture uses:
- React SPA with client-side routing
- Nginx serving static assets from `/usr/share/nginx/html`
- CSS bundled as `index-8b70c5c9.css` in the `/assets/` directory
- Docker containers with the client container recently restarted

## Architecture

### Current Asset Serving Flow
```
Browser Request → Nginx → Static Assets (/assets/*.css)
                      ↓
                 Cache Headers (1 year expiry)
                      ↓
                 CSS Applied to DOM
```

### Problem Areas Identified
1. **Container State**: Recent container restart may have caused asset cache invalidation
2. **Authentication Routing**: Navigation between public/private routes may trigger asset reloading
3. **Cache Headers**: Aggressive caching (1 year) may cause stale asset issues
4. **Asset Path Resolution**: Potential issues with absolute vs relative paths after authentication

## Components and Interfaces

### 1. Nginx Configuration Component
- **Purpose**: Serve static CSS assets with proper headers
- **Current State**: Configured with 1-year cache expiry and CORS headers
- **Interface**: HTTP requests to `/assets/*.css` paths

### 2. React Application Component
- **Purpose**: Load and apply CSS through bundled assets
- **Current State**: CSS imported in App.tsx and bundled by Vite
- **Interface**: CSS link tags in index.html

### 3. Docker Container Component
- **Purpose**: Host the built application and serve assets
- **Current State**: Recently restarted, may have cache issues
- **Interface**: Volume mounts and port mappings

### 4. Build System Component
- **Purpose**: Bundle CSS and generate asset hashes
- **Current State**: Vite bundling with hash-based filenames
- **Interface**: Build output in `/dist/assets/` directory

## Data Models

### Asset Reference Model
```typescript
interface AssetReference {
  path: string;           // e.g., "/assets/index-8b70c5c9.css"
  hash: string;           // e.g., "8b70c5c9"
  mimeType: string;       // "text/css"
  cachePolicy: string;    // "public, immutable"
  loadStatus: 'loading' | 'loaded' | 'error';
}
```

### CSS Loading State Model
```typescript
interface CSSLoadingState {
  stylesheets: AssetReference[];
  loadErrors: string[];
  retryCount: number;
  lastLoadTime: Date;
}
```

## Error Handling

### 1. CSS Load Failure Detection
- Monitor `link` element `onerror` events
- Track failed asset requests in browser network tab
- Implement retry mechanism for failed CSS loads

### 2. Fallback Strategies
- Inline critical CSS for basic styling
- Graceful degradation with unstyled but functional content
- User notification of styling issues

### 3. Cache Invalidation
- Implement cache-busting for problematic assets
- Provide manual refresh mechanism
- Clear browser cache programmatically when needed

### 4. Container Recovery
- Automatic container health checks
- Asset verification on container startup
- Rebuild triggers for asset corruption

### 5. Vite Development Server Configuration
- **Purpose**: Serve development assets and enable HMR in Docker environment
- **Current Issue**: WebSocket connections failing, 503 errors for CSS assets
- **Required Changes**: 
  - Configure HMR for Docker networking
  - Set proper host and port bindings
  - Enable WebSocket proxy configuration
  - Add fallback for failed WebSocket connections

## Testing Strategy

### 1. Asset Loading Tests
- Verify CSS files are accessible at expected paths
- Test asset loading across different authentication states
- Validate cache headers and MIME types

### 2. Authentication Flow Tests
- Test styling persistence through login/logout cycles
- Verify CSS loading on protected route navigation
- Test page refresh scenarios on authenticated pages

### 3. Container Integration Tests
- Test asset serving after container restarts
- Verify nginx configuration serves CSS correctly
- Test volume mount integrity for static assets

### 4. Browser Compatibility Tests
- Test CSS loading across different browsers
- Verify cache behavior consistency
- Test with various network conditions

### 5. Performance Tests
- Measure CSS load times
- Test with cache enabled/disabled
- Monitor asset loading under load

## Implementation Approach

### Phase 1: Immediate Fixes
1. Verify current asset accessibility
2. Check nginx configuration for CSS serving
3. Test CSS loading in different authentication states
4. Implement basic error detection

### Phase 2: Robust Solutions
1. Add CSS loading monitoring and retry logic
2. Implement fallback styling mechanisms
3. Add cache invalidation strategies
4. Create asset health check endpoints

### Phase 3: Prevention
1. Add automated tests for CSS loading
2. Implement monitoring and alerting
3. Create deployment verification scripts
4. Add container health checks for assets
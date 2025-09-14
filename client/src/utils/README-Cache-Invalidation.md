# Cache Invalidation System

This module provides comprehensive cache invalidation strategies for CSS assets to handle browser caching issues that can prevent updated styles from loading properly.

## Features

### 1. Cache-Busting Parameters
- Generates unique cache-busting parameters using timestamps and random strings
- Adds cache-busting parameters to CSS asset URLs to bypass browser cache
- Supports both URLs with and without existing query parameters

### 2. Programmatic Cache Clearing
- Reloads CSS stylesheets with fresh URLs containing cache-busting parameters
- Creates new link elements to replace existing ones
- Handles retry logic with exponential backoff for failed loads
- Provides fallback to hard page refresh when other methods fail

### 3. Asset Versioning Checks
- Extracts version hashes from bundled CSS filenames
- Tracks asset versions in localStorage for persistence
- Monitors for asset version changes automatically
- Provides periodic version checking with configurable intervals

### 4. Browser Cache Management
- Clears stored version information from localStorage and sessionStorage
- Forces hard refresh when cache invalidation fails
- Handles storage errors gracefully

## Core Components

### `cacheInvalidation.ts`
Main utility module containing:
- `generateCacheBustParam()` - Creates unique cache-busting parameters
- `addCacheBustingToUrl()` - Adds cache-busting to URLs
- `extractAssetHash()` - Extracts version hash from filenames
- `CacheClearingUtility` - Manages cache clearing operations
- `AssetVersionChecker` - Handles version monitoring
- `CacheInvalidationManager` - Orchestrates the entire system

### `useCacheInvalidation.ts`
React hook providing:
- State management for cache invalidation operations
- Methods for triggering cache operations
- Version checking controls
- Error handling and status tracking

### `CacheInvalidationControls.tsx`
Diagnostic component offering:
- Manual cache invalidation controls
- Asset version display
- Verification tools
- Status monitoring

## Usage

### Basic Usage with React Hook

```typescript
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';

function MyComponent() {
  const {
    state,
    invalidateCache,
    clearCache,
    forceRefresh,
    verifyAssets
  } = useCacheInvalidation();

  const handleCacheIssue = async () => {
    try {
      await invalidateCache({ forceReload: false });
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  };

  return (
    <div>
      <p>Cache Status: {state.isInvalidating ? 'Invalidating...' : 'Ready'}</p>
      <button onClick={handleCacheIssue}>Clear Cache</button>
    </div>
  );
}
```

### Direct Utility Usage

```typescript
import { CacheInvalidationManager } from '../utils/cacheInvalidation';

// Initialize the system
CacheInvalidationManager.initialize({
  enableVersionChecking: true,
  onVersionChange: (newVersion, oldVersion) => {
    console.log('Asset version changed:', { newVersion, oldVersion });
  }
});

// Handle cache invalidation
await CacheInvalidationManager.handleCacheInvalidation({
  forceReload: false,
  maxRetries: 3
});
```

### Manual Cache Operations

```typescript
import { 
  CacheClearingUtility, 
  AssetVersionChecker 
} from '../utils/cacheInvalidation';

// Clear CSS cache
await CacheClearingUtility.clearCSSCache();

// Verify asset status
const verification = await AssetVersionChecker.verifyAssetVersions();
console.log('Assets up to date:', verification.upToDate);

// Force hard refresh
CacheClearingUtility.forceHardRefresh();
```

## Configuration Options

### CacheInvalidationOptions
```typescript
interface CacheInvalidationOptions {
  forceReload?: boolean;     // Force hard refresh if cache clearing fails
  cacheBustParam?: string;   // Custom cache-busting parameter
  maxRetries?: number;       // Maximum retry attempts for failed loads
}
```

### Initialization Options
```typescript
CacheInvalidationManager.initialize({
  enableVersionChecking: true,  // Enable automatic version monitoring
  onVersionChange: (newVersion, oldVersion) => {
    // Handle version changes
  }
});
```

## Asset Version Tracking

The system automatically tracks CSS asset versions by:

1. **Hash Extraction**: Extracts version hashes from bundled CSS filenames (e.g., `index-abc123def.css`)
2. **Version Storage**: Stores version information in localStorage for persistence
3. **Change Detection**: Compares current versions with stored versions to detect updates
4. **Automatic Monitoring**: Periodically checks for version changes (every 30 seconds by default)

## Error Handling

The system includes comprehensive error handling:

- **Storage Errors**: Gracefully handles localStorage/sessionStorage access issues
- **Network Errors**: Retries failed CSS loads with exponential backoff
- **Asset Verification**: Provides detailed error reporting for asset accessibility issues
- **Fallback Mechanisms**: Falls back to hard refresh when other methods fail

## Testing

Comprehensive test suites are provided:

- **Unit Tests**: `__tests__/cacheInvalidation.test.ts` - Tests all utility functions
- **Hook Tests**: `__tests__/useCacheInvalidation.test.ts` - Tests React hook functionality
- **Integration Tests**: Available through the diagnostic test page

## Requirements Addressed

This implementation addresses the following requirements:

- **Requirement 2.1**: Cache-busting parameters for problematic CSS assets
- **Requirement 2.3**: Programmatic cache clearing and asset versioning checks

## Browser Compatibility

The system is compatible with modern browsers that support:
- ES6+ features (async/await, Promises)
- localStorage/sessionStorage
- DOM manipulation APIs
- Fetch API for asset verification

## Performance Considerations

- **Minimal Overhead**: Version checking runs at 30-second intervals
- **Efficient Storage**: Uses localStorage for persistence with minimal data
- **Lazy Loading**: Only processes CSS assets matching specific patterns
- **Graceful Degradation**: Continues to function even if storage is unavailable
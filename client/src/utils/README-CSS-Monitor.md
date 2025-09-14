# CSS Loading Monitor

The CSS Loading Monitor is a comprehensive system for detecting and handling CSS loading issues in the ChemQuest application.

## Features

- **Real-time monitoring** of all stylesheet loading events
- **Error detection** for failed CSS loads
- **Retry mechanisms** for handling temporary failures
- **React integration** with hooks and components
- **Automatic initialization** on app startup
- **Development logging** for debugging

## Components

### Core Monitor (`cssLoadingMonitor.ts`)

The main monitoring class that:
- Tracks all `<link rel="stylesheet">` elements
- Monitors load/error events
- Provides state management for CSS loading status
- Uses MutationObserver to detect dynamically added stylesheets

### React Integration

#### Hooks
- `useCSSLoadingMonitor()` - Main hook for CSS loading state
- `useFailedStylesheets()` - Hook for failed stylesheet information
- `useCSSLoadingSummary()` - Hook for loading summary string

#### Components
- `CSSLoadingStatus` - Visual component showing CSS loading status
- Can be used with `showDetails={true}` for comprehensive information

### Initialization (`initializeCSSMonitor.ts`)

Provides:
- Automatic monitor setup on app start
- Development logging
- Global error event dispatching
- Health check utilities

## Usage

### Basic Setup

The monitor is automatically initialized in `App.tsx`:

```typescript
import { initializeCSSMonitor } from './utils/initializeCSSMonitor';

useEffect(() => {
  initializeCSSMonitor();
}, []);
```

### Using in Components

```typescript
import { useCSSLoadingMonitor } from '../hooks/useCSSLoadingMonitor';

function MyComponent() {
  const cssState = useCSSLoadingMonitor();
  
  if (cssState.hasErrors) {
    return <div>CSS loading errors detected!</div>;
  }
  
  if (cssState.isLoading) {
    return <div>Loading CSS... {cssState.loadingProgress}%</div>;
  }
  
  return <div>CSS loaded successfully</div>;
}
```

### Manual Monitoring

```typescript
import { getCSSLoadingMonitor } from '../utils/cssLoadingMonitor';

const monitor = getCSSLoadingMonitor();

// Get current state
const state = monitor.getState();

// Listen for changes
const unsubscribe = monitor.addListener((newState) => {
  console.log('CSS state changed:', newState);
});

// Check for errors
if (monitor.hasLoadingErrors()) {
  const failedStylesheets = monitor.getFailedStylesheets();
  console.error('Failed stylesheets:', failedStylesheets);
}
```

### Error Handling

```typescript
import { addCSSLoadingErrorHandler } from '../utils/initializeCSSMonitor';

const removeHandler = addCSSLoadingErrorHandler((errorDetails) => {
  console.error('CSS Loading Error:', errorDetails);
  
  // Could trigger retry logic, show user notification, etc.
  if (errorDetails.failedCount > 0) {
    // Handle the error appropriately
  }
});
```

## API Reference

### CSSLoadingMonitor Class

#### Methods
- `getState()` - Returns current loading state
- `addListener(callback)` - Adds state change listener
- `getFailedStylesheets()` - Returns array of failed stylesheets
- `getLoadingStylesheets()` - Returns array of currently loading stylesheets
- `hasLoadingErrors()` - Returns boolean if there are errors
- `getLoadingSummary()` - Returns human-readable summary string
- `destroy()` - Cleans up listeners and observers

#### State Interface
```typescript
interface CSSLoadingState {
  stylesheets: Map<string, StylesheetInfo>;
  loadErrors: string[];
  totalStylesheets: number;
  loadedStylesheets: number;
  failedStylesheets: number;
}
```

### Utility Functions

- `getCSSLoadingMonitor()` - Gets singleton monitor instance
- `getCSSLoadingState()` - Quick access to current state
- `onCSSLoadingChange(listener)` - Quick listener setup
- `logCSSLoadingStatus()` - Logs current status to console
- `checkCSSLoadingHealth()` - Returns Promise<boolean> for health check

## Testing

The monitor includes comprehensive tests:

```bash
npm test -- cssLoadingMonitor
```

Tests cover:
- Basic initialization and state management
- Load and error event handling
- React hook integration
- Component rendering
- Cleanup and memory management

## Debugging

### Development Mode

In development, the monitor automatically:
- Logs CSS loading status to console
- Provides detailed error information
- Monitors loading progress every 2 seconds
- Stops logging once all CSS is loaded

### Manual Debugging

```typescript
import { logCSSLoadingStatus, checkCSSLoadingHealth } from '../utils/initializeCSSMonitor';

// Log current status
logCSSLoadingStatus();

// Check overall health
checkCSSLoadingHealth().then(isHealthy => {
  console.log('CSS is healthy:', isHealthy);
});
```

### CSS Test Page

Visit `/css-test` in the application to see:
- Real-time CSS loading status
- Detailed error information
- Loading progress indicators
- Failed stylesheet details

## Integration with Existing Code

The monitor integrates with:
- Existing CSS diagnostic tools
- React Router navigation
- Authentication state changes
- Container restart scenarios

It's designed to work alongside existing CSS loading tests and diagnostic scripts without conflicts.
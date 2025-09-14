# CSS Loading State Management

This document describes the Redux-based CSS loading state management system implemented for tracking and managing CSS asset loading status throughout the application.

## Overview

The CSS loading state management system provides:
- Redux state for tracking CSS loading status
- Actions and reducers for CSS loading events
- React hooks for easy state access
- UI indicators for CSS loading states
- Integration with existing CSS monitoring utilities

## Architecture

### Redux Store Structure

```typescript
interface CSSLoadingState {
  stylesheets: Record<string, StylesheetInfo>;
  loadErrors: string[];
  totalStylesheets: number;
  loadedStylesheets: number;
  failedStylesheets: number;
  isMonitoring: boolean;
  lastUpdateTime: number;
  retryInProgress: boolean;
  fallbackActive: boolean;
}
```

### Key Components

1. **Redux Slice** (`cssLoadingSlice.ts`)
   - Manages CSS loading state
   - Provides actions for state updates
   - Handles async operations (retry, fallback)

2. **React Hooks** (`useCSSLoadingState.ts`)
   - `useCSSLoadingState()` - Main hook for CSS loading state
   - `useCSSLoadingSummary()` - Summary information
   - `useFailedStylesheets()` - Failed stylesheets only
   - `useCSSLoadingHealth()` - Health check information

3. **UI Components**
   - `CSSLoadingIndicator` - Detailed loading indicator
   - `CSSLoadingBadge` - Minimal status badge
   - `CSSLoadingProgressBar` - Progress visualization
   - `GlobalCSSLoadingStatus` - Global status overlay

4. **Provider** (`CSSLoadingProvider.tsx`)
   - Initializes CSS monitoring on app start
   - Connects Redux state with CSS monitoring utilities

## Usage

### Basic Setup

1. **Add to Redux Store**
```typescript
import cssLoadingReducer from './store/cssLoadingSlice';

export const store = configureStore({
  reducer: {
    // ... other reducers
    cssLoading: cssLoadingReducer,
  },
});
```

2. **Wrap App with Provider**
```tsx
import { CSSLoadingProvider } from './providers/CSSLoadingProvider';

function App() {
  return (
    <Provider store={store}>
      <CSSLoadingProvider>
        {/* Your app components */}
      </CSSLoadingProvider>
    </Provider>
  );
}
```

### Using Hooks

```tsx
import { useCSSLoadingState } from './hooks/useCSSLoadingState';

function MyComponent() {
  const {
    hasErrors,
    isLoading,
    loadingProgress,
    failedStylesheets,
    retryFailedStylesheets,
    activateFallback,
  } = useCSSLoadingState();

  if (hasErrors) {
    return (
      <div>
        <p>CSS loading errors detected!</p>
        <button onClick={() => retryFailedStylesheets()}>
          Retry Failed CSS
        </button>
        <button onClick={() => activateFallback()}>
          Activate Fallback
        </button>
      </div>
    );
  }

  return <div>CSS loaded successfully!</div>;
}
```

### Using UI Components

```tsx
import { 
  CSSLoadingIndicator, 
  CSSLoadingBadge,
  GlobalCSSLoadingStatus 
} from './components/ui/CSSLoadingIndicator';

function Layout() {
  return (
    <div>
      {/* Global status overlay */}
      <GlobalCSSLoadingStatus position="top-right" />
      
      {/* Header with status badge */}
      <header>
        <h1>My App</h1>
        <CSSLoadingBadge />
      </header>
      
      {/* Detailed indicator in sidebar */}
      <aside>
        <CSSLoadingIndicator 
          showDetails={true}
          showRetryButton={true}
          showFallbackButton={true}
        />
      </aside>
    </div>
  );
}
```

## Actions

### Synchronous Actions

- `updateCSSLoadingState(payload)` - Update entire CSS loading state
- `addStylesheet(stylesheet)` - Add new stylesheet to tracking
- `updateStylesheetStatus(update)` - Update specific stylesheet status
- `updateStylesheetRetryCount(update)` - Update retry count
- `clearLoadErrors()` - Clear all load errors
- `setMonitoring(boolean)` - Set monitoring status
- `setRetryInProgress(boolean)` - Set retry status
- `setFallbackActive(boolean)` - Set fallback status
- `resetCSSLoadingState()` - Reset to initial state

### Async Actions

- `initializeCSSMonitoring()` - Initialize CSS monitoring system
- `retryCSSLoading(href?)` - Retry failed CSS loads
- `activateFallbackCSS()` - Activate fallback CSS system

## Integration with Existing Systems

The CSS loading state management integrates with:

1. **CSS Loading Monitor** (`cssLoadingMonitor.ts`)
   - Listens to CSS loading events
   - Updates Redux state automatically

2. **CSS Retry Mechanism** (`cssRetryMechanism.ts`)
   - Triggered by retry actions
   - Updates retry counts in state

3. **CSS Fallback System** (`cssFallbackSystem.ts`)
   - Activated by fallback actions
   - Updates fallback status in state

## State Flow

```
CSS Loading Event → CSS Monitor → Redux Action → State Update → UI Update
                                      ↓
                              Component Re-render
```

## Testing

The system includes comprehensive tests:

- **Unit Tests** - Redux slice and hooks
- **Integration Tests** - Component integration with Redux
- **E2E Tests** - Full user interaction flows

Run tests:
```bash
npm test -- --run src/store/__tests__/cssLoadingSlice.test.ts
npm test -- --run src/hooks/__tests__/useCSSLoadingStateSimple.test.ts
npm test -- --run src/test/integration/cssLoadingStateIntegration.test.tsx
```

## Performance Considerations

- State updates are batched to prevent excessive re-renders
- Computed values are memoized in hooks
- UI components only render when necessary
- Monitoring can be disabled if not needed

## Error Handling

The system handles various error scenarios:
- Failed CSS loads
- Network timeouts
- Invalid CSS files
- Container restarts
- Cache invalidation issues

## Future Enhancements

Potential improvements:
- Persistent state across page reloads
- Advanced retry strategies
- CSS loading analytics
- Performance metrics
- Custom fallback themes
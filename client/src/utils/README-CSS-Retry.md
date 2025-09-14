# CSS Loading Retry Mechanism

This module implements an automatic retry mechanism for failed CSS loads with exponential backoff and manual controls.

## Features

- **Automatic Retry**: Automatically retries failed CSS loads with configurable limits
- **Exponential Backoff**: Uses exponential backoff to avoid overwhelming the server
- **Manual Controls**: Provides manual retry and refresh functionality
- **Configuration**: Fully configurable retry parameters
- **Statistics**: Tracks retry attempts and success rates
- **React Integration**: Includes React hooks and components

## Core Components

### CSSRetryMechanism
The main class that handles retry logic:
- Monitors CSS loading failures
- Schedules retries with exponential backoff
- Tracks retry attempts and statistics
- Provides manual retry functionality

### Configuration Options
```typescript
interface RetryConfig {
  maxRetries: number;        // Maximum retry attempts (default: 3)
  initialDelay: number;      // Initial delay in ms (default: 1000)
  maxDelay: number;          // Maximum delay in ms (default: 30000)
  backoffMultiplier: number; // Backoff multiplier (default: 2)
  enableAutoRetry: boolean;  // Enable automatic retries (default: true)
}
```

## Usage

### Basic Setup
```typescript
import { initializeCSSRetry } from './utils/cssRetryUtils';

// Initialize with default configuration
initializeCSSRetry();
```

### Manual Retry Operations
```typescript
import { triggerCSSRetry, triggerCSSRefresh } from './utils/cssRetryUtils';

// Retry only failed CSS assets
await triggerCSSRetry();

// Refresh all CSS assets
await triggerCSSRefresh();
```

### React Integration
```typescript
import { useCSSRetryMechanism } from './hooks/useCSSRetryMechanism';
import { CSSRetryControls } from './components/diagnostics/CSSRetryControls';

function MyComponent() {
  const retryState = useCSSRetryMechanism();
  
  return (
    <div>
      <p>Active retries: {retryState.stats.activeRetries}</p>
      <CSSRetryControls showAdvanced={true} />
    </div>
  );
}
```

### Configuration Updates
```typescript
import { updateRetryConfig, setAutoRetry } from './utils/cssRetryUtils';

// Update retry configuration
updateRetryConfig({
  maxRetries: 5,
  initialDelay: 2000,
  backoffMultiplier: 1.5
});

// Toggle auto-retry
setAutoRetry(false);
```

## How It Works

1. **Detection**: The CSS loading monitor detects failed stylesheet loads
2. **Scheduling**: Failed loads are scheduled for retry with exponential backoff
3. **Retry Logic**: Creates new link elements with cache-busting parameters
4. **Success/Failure**: Tracks results and schedules additional retries if needed
5. **Limits**: Respects maximum retry limits to prevent infinite loops

## Exponential Backoff

The retry mechanism uses exponential backoff to space out retry attempts:

- First retry: `initialDelay` ms (default: 1000ms)
- Second retry: `initialDelay * backoffMultiplier` ms (default: 2000ms)
- Third retry: `initialDelay * backoffMultiplier^2` ms (default: 4000ms)
- Maximum delay is capped at `maxDelay` ms (default: 30000ms)

## Cache Busting

When retrying CSS loads, the mechanism adds a timestamp parameter to bypass browser cache:
```
original: /assets/styles.css
retry:    /assets/styles.css?retry=1640995200000
```

## Testing

Visit `/css-retry-test` in the application to test the retry mechanism:
1. Create failed CSS links to trigger retries
2. Monitor retry attempts in the browser console
3. Use manual controls to test retry functionality
4. Adjust configuration to test different backoff strategies

## Development Tools

In development mode, the retry utilities are available globally:
```javascript
// Available in browser console
window.cssRetryUtils.triggerCSSRetry();
window.cssRetryUtils.getCSSRetryInfo();
window.cssRetryUtils.setAutoRetry(false);
```

## Integration with CSS Loading Monitor

The retry mechanism works in conjunction with the CSS loading monitor:
- Monitor detects failed CSS loads
- Retry mechanism automatically schedules retries
- Both systems share state and provide unified diagnostics

## Error Handling

The retry mechanism includes comprehensive error handling:
- Timeout protection for retry attempts
- Graceful degradation when retries fail
- Detailed error logging for debugging
- Cleanup of failed retry attempts

## Performance Considerations

- Retry attempts are throttled with exponential backoff
- Maximum retry limits prevent infinite loops
- Cache-busting parameters help avoid stale cache issues
- Failed retries are cleaned up to prevent memory leaks
# CSS Monitoring and Alerting System

This system provides comprehensive monitoring and alerting for CSS loading issues in the application. It consists of client-side error detection, server-side monitoring, and a user-friendly alert system.

## Overview

The CSS monitoring and alerting system addresses the core issue where users lose styling after authentication by:

1. **Detecting CSS loading failures** in real-time
2. **Reporting errors** to the server for analysis
3. **Creating user-friendly alerts** with recovery actions
4. **Providing monitoring dashboards** for developers
5. **Enabling automatic recovery** mechanisms

## Components

### 1. CSS Error Reporter (`cssErrorReporting.ts`)

Monitors CSS loading events and reports failures to the server.

**Features:**
- Detects CSS load failures, parse errors, and network issues
- Monitors both existing and dynamically added stylesheets
- Batches non-critical errors for efficient reporting
- Sends critical errors immediately
- Tracks user authentication state and route context

**Usage:**
```typescript
import { cssErrorReporter } from '../utils/cssErrorReporting';

// The reporter automatically initializes and monitors CSS loading
// Manual error reporting (if needed):
cssErrorReporter.reportError({
  type: 'load_failure',
  url: 'https://example.com/styles.css',
  timestamp: new Date(),
  userAgent: navigator.userAgent,
  route: window.location.pathname,
  retryCount: 0,
  errorMessage: 'CSS file failed to load'
});

// Get error summary
const summary = cssErrorReporter.getErrorSummary();
console.log(`Total errors: ${summary.totalErrors}`);
```

### 2. CSS Alert System (`cssAlertSystem.ts`)

Creates and manages user-facing alerts for CSS issues.

**Features:**
- Creates different alert types (error, warning, info)
- Supports severity levels (low, medium, high, critical)
- Provides action buttons for user recovery
- Shows browser notifications for critical issues
- Auto-hides non-critical alerts
- Manages alert lifecycle and subscriptions

**Usage:**
```typescript
import { cssAlertSystem } from '../utils/cssAlertSystem';

// Create a CSS load failure alert with retry action
const alert = cssAlertSystem.createCSSLoadFailureAlert(
  'https://example.com/styles.css',
  () => retryLoadingCSS()
);

// Create custom alert
cssAlertSystem.createAlert(
  'error',
  'high',
  'Custom CSS Error',
  'Something went wrong with CSS loading',
  [
    {
      label: 'Retry',
      action: () => window.location.reload(),
      type: 'primary'
    }
  ]
);

// Subscribe to alert changes
const unsubscribe = cssAlertSystem.subscribe((alerts) => {
  console.log(`Active alerts: ${alerts.length}`);
});
```

### 3. CSS Monitoring Hook (`useCSSMonitoringAlerts.ts`)

React hook that integrates error reporting and alerting.

**Features:**
- Provides monitoring state and controls
- Integrates error detection with alert creation
- Offers retry mechanisms for failed CSS
- Manages monitoring lifecycle

**Usage:**
```typescript
import { useCSSMonitoringAlerts } from '../hooks/useCSSMonitoringAlerts';

function MyComponent() {
  const [state, actions] = useCSSMonitoringAlerts();
  
  return (
    <div>
      <p>Errors: {state.errorCount}</p>
      <p>Monitoring: {state.isMonitoring ? 'Active' : 'Inactive'}</p>
      
      <button onClick={() => actions.clearAllAlerts()}>
        Clear Alerts
      </button>
      
      {state.alerts.map(alert => (
        <div key={alert.id}>
          {alert.title}: {alert.message}
        </div>
      ))}
    </div>
  );
}
```

### 4. CSS Alert Display Component (`CSSAlertDisplay.tsx`)

React component that displays CSS alerts to users.

**Features:**
- Configurable positioning and appearance
- Interactive alert dismissal and actions
- Error count badge
- Responsive design with animations
- Debug information in development mode

**Usage:**
```typescript
import { CSSAlertDisplay } from '../components/diagnostics/CSSAlertDisplay';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* CSS alerts will appear in top-right corner */}
      <CSSAlertDisplay 
        position="top-right"
        maxVisible={5}
        showErrorCount={true}
      />
    </div>
  );
}
```

### 5. Server-Side Monitoring (`css-monitoring.ts`)

Express routes for receiving error reports and providing monitoring data.

**Endpoints:**
- `POST /api/css-monitoring/report-error` - Receive error reports
- `GET /api/css-monitoring/error-stats` - Get error statistics
- `GET /api/css-monitoring/verify-assets` - Verify CSS asset availability
- `GET /api/css-monitoring/health` - Health check for monitoring system
- `DELETE /api/css-monitoring/clear-reports` - Clear error reports

**Usage:**
```typescript
// Add to your Express app
import cssMonitoringRouter from './routes/css-monitoring';
app.use('/api/css-monitoring', cssMonitoringRouter);
```

## Error Types

### Load Failure
CSS file completely failed to load (404, network error, etc.)
- **Severity:** Critical
- **Actions:** Retry loading, refresh page
- **Notification:** Browser notification shown

### Parse Error
CSS file loaded but has parsing issues or no rules
- **Severity:** Medium
- **Actions:** Dismiss alert
- **Notification:** None

### Network Error
Network-related issues during CSS loading
- **Severity:** High
- **Actions:** Refresh page, dismiss
- **Notification:** None

### Multiple Failures
Multiple CSS files failed to load simultaneously
- **Severity:** Critical
- **Actions:** Reload page, clear cache & reload
- **Notification:** Browser notification shown

## Alert Severity Levels

### Critical
- Immediate user impact
- Browser notifications enabled
- No auto-hide
- Prominent visual styling

### High
- Significant user impact
- No browser notifications
- No auto-hide
- Warning visual styling

### Medium
- Moderate user impact
- Auto-hide after delay
- Standard visual styling

### Low
- Minor user impact
- Auto-hide after delay
- Subtle visual styling

## Configuration

### Alert System Configuration
```typescript
const alertSystem = new CSSAlertSystem({
  maxAlerts: 10,           // Maximum alerts to keep
  autoHideDelay: 5000,     // Auto-hide delay in ms
  enableNotifications: true, // Browser notifications
  enableConsoleLogging: true // Console logging
});
```

### Error Reporter Configuration
The error reporter automatically configures itself, but you can customize:
- Reporting endpoint URL
- Debounce delay for batched errors
- Authentication detection logic

## Integration Guide

### 1. Basic Setup
```typescript
// In your main App component
import { CSSAlertDisplay } from './components/diagnostics/CSSAlertDisplay';

function App() {
  return (
    <div>
      {/* Your app content */}
      <CSSAlertDisplay />
    </div>
  );
}
```

### 2. Custom Monitoring
```typescript
// In a component that needs CSS monitoring
import { useCSSMonitoringAlerts } from './hooks/useCSSMonitoringAlerts';

function Dashboard() {
  const [state, actions] = useCSSMonitoringAlerts();
  
  // Custom error handling
  useEffect(() => {
    if (state.errorCount > 5) {
      // Take action for many errors
      actions.clearAllAlerts();
      window.location.reload();
    }
  }, [state.errorCount]);
  
  return (
    <div>
      <h2>CSS Health: {state.errorCount === 0 ? 'Good' : 'Issues Detected'}</h2>
    </div>
  );
}
```

### 3. Server Integration
```typescript
// In your Express server
import express from 'express';
import cssMonitoringRouter from './routes/css-monitoring';

const app = express();
app.use(express.json());
app.use('/api/css-monitoring', cssMonitoringRouter);

// Optional: Add monitoring middleware
app.use((req, res, next) => {
  // Log CSS asset requests
  if (req.path.endsWith('.css')) {
    console.log(`CSS asset requested: ${req.path}`);
  }
  next();
});
```

## Testing

The system includes comprehensive tests:

- **Unit tests** for individual components
- **Integration tests** for complete workflows
- **Server tests** for API endpoints
- **React component tests** for UI interactions

Run tests with:
```bash
# Client-side tests
npm test -- --testPathPattern=css

# Server-side tests
cd server && npm test -- --testPathPattern=css-monitoring
```

## Monitoring Dashboard

Access monitoring data through the server endpoints:

```bash
# Get error statistics
curl http://localhost:3001/api/css-monitoring/error-stats

# Verify CSS assets
curl http://localhost:3001/api/css-monitoring/verify-assets

# Check system health
curl http://localhost:3001/api/css-monitoring/health
```

## Troubleshooting

### Common Issues

1. **Alerts not appearing**
   - Check that `CSSAlertDisplay` is rendered in your app
   - Verify monitoring is enabled
   - Check browser console for errors

2. **Server not receiving reports**
   - Verify server routes are properly mounted
   - Check network requests in browser dev tools
   - Ensure CORS is configured if needed

3. **False positive errors**
   - Check CSS file accessibility
   - Verify MIME types are correct
   - Review nginx configuration

### Debug Mode

Enable debug information in development:
```typescript
// The CSSAlertDisplay component shows debug info in development mode
// Check browser console for detailed error logs
```

## Performance Considerations

- Error reporting is debounced to avoid excessive server requests
- Alerts are limited to prevent memory leaks
- Non-critical alerts auto-hide to reduce UI clutter
- Server-side reports are stored in memory (use database in production)

## Security Considerations

- Error reports include minimal user information
- No sensitive data is logged in error messages
- Server endpoints include input validation
- Rate limiting should be implemented in production

## Future Enhancements

- Database storage for error reports
- Advanced analytics and trending
- Integration with external monitoring services
- Automated recovery mechanisms
- Performance metrics collection
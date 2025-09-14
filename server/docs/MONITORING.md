# Monitoring and Error Tracking System

This document describes the comprehensive monitoring and error tracking system implemented for ChemQuest: Alchemist Academy.

## Overview

The monitoring system provides:
- **Performance Monitoring**: Request timing, memory usage, and system metrics
- **Error Tracking**: Structured error logging with categorization and alerting
- **User Behavior Analytics**: User action tracking and session management
- **Health Checks**: System health status and service availability
- **Automated Backups**: Data backup and recovery procedures

## Components

### 1. Performance Monitoring (`middleware/monitoring.ts`)

Tracks system performance and resource usage:

```typescript
// Automatic request timing
app.use(performanceMonitoring);

// Memory monitoring (every 5 minutes)
memoryMonitoring();
```

**Features:**
- Request/response timing
- Memory usage tracking
- Slow request detection (>1000ms)
- Unique request ID generation

### 2. Error Tracking (`middleware/errorTracking.ts`)

Comprehensive error handling and categorization:

```typescript
// Custom error types
const error = new AppError(
  'User not found',
  ErrorType.AUTHENTICATION,
  ErrorSeverity.MEDIUM,
  401
);

// Global error handler
app.use(errorHandler);
```

**Error Categories:**
- `VALIDATION`: Input validation errors
- `AUTHENTICATION`: Auth-related errors
- `AUTHORIZATION`: Permission errors
- `DATABASE`: Database connection/query errors
- `EXTERNAL_API`: Third-party service errors
- `BUSINESS_LOGIC`: Application logic errors
- `SYSTEM`: System-level errors
- `UNKNOWN`: Uncategorized errors

**Severity Levels:**
- `LOW`: Minor issues, user can continue
- `MEDIUM`: Moderate issues, some functionality affected
- `HIGH`: Serious issues, major functionality affected
- `CRITICAL`: System-threatening issues, immediate attention required

### 3. User Behavior Analytics (`services/userBehaviorAnalytics.ts`)

Tracks user interactions and behavior patterns:

```typescript
// Track user actions
userBehaviorAnalytics.trackAction({
  userId: 'user123',
  sessionId: 'session456',
  action: 'challenge_completed',
  category: 'game',
  path: '/game/mathmage-trials',
  metadata: { score: 95, duration: 30000 }
});

// Track game-specific actions
userBehaviorAnalytics.trackGameAction(
  userId, 
  sessionId, 
  'equation_solved', 
  'mathmage-trials',
  'equation-duels-001',
  95,
  30000
);
```

### 4. Backup Service (`services/backupService.ts`)

Automated backup and recovery system:

```typescript
// Create manual backup
const backup = await backupService.createBackup('full');

// Schedule automatic backups
backupService.scheduleBackups();

// Restore from backup
await backupService.restoreBackup(backupId);
```

## API Endpoints

### Health and Metrics

```bash
# System health check
GET /api/monitoring/health

# System metrics (memory, CPU, process info)
GET /api/monitoring/metrics
```

### Error Tracking

```bash
# Get recent errors
GET /api/monitoring/errors?limit=50&type=database&severity=high

# Get error statistics
GET /api/monitoring/errors/stats
```

### Analytics

```bash
# Get analytics overview
GET /api/monitoring/analytics?start=2024-01-01&end=2024-01-31

# Get active sessions
GET /api/monitoring/analytics/sessions

# Get user journey
GET /api/monitoring/analytics/user/:userId/journey?limit=50

# Track user action
POST /api/monitoring/analytics/track
{
  "userId": "user123",
  "sessionId": "session456",
  "action": "page_view",
  "category": "navigation",
  "path": "/dashboard",
  "metadata": { "referrer": "/login" }
}

# Start session
POST /api/monitoring/analytics/session/start
{
  "userId": "user123",
  "deviceType": "desktop",
  "browser": "chrome",
  "os": "windows"
}

# End session
POST /api/monitoring/analytics/session/end
{
  "sessionId": "session456"
}
```

## Configuration

### Environment Variables

```bash
# Backup configuration
BACKUP_PATH=./backups
NODE_ENV=production

# Monitoring settings
MONITORING_ENABLED=true
ERROR_TRACKING_ENABLED=true
ANALYTICS_ENABLED=true
```

### Backup Configuration

```typescript
const backupConfig: BackupConfig = {
  enabled: true,
  schedule: '0 2 * * *', // Daily at 2 AM
  retentionDays: 30,
  backupPath: './backups',
  includeUserData: true,
  includeAnalytics: true,
  includeContent: true
};
```

## Monitoring Dashboard

A React-based monitoring dashboard is available at `/admin/monitoring` (when implemented in routing):

**Features:**
- Real-time system health status
- Memory and CPU usage graphs
- Error statistics and trends
- User analytics overview
- Active sessions monitoring

## Alerting

### Critical Error Alerts

The system automatically alerts for critical errors:

```typescript
// Critical errors trigger immediate alerts
if (error.severity === ErrorSeverity.CRITICAL) {
  // TODO: Implement email/Slack notifications
  console.error('🚨 CRITICAL ERROR ALERT 🚨', errorDetails);
}
```

### Performance Alerts

- **Slow Requests**: Requests taking >1000ms are logged as warnings
- **High Memory Usage**: Heap usage >500MB triggers warnings
- **System Health**: Degraded services are flagged in health checks

## Best Practices

### Error Handling

```typescript
// Use structured errors with context
throw new AppError(
  'Failed to process payment',
  ErrorType.EXTERNAL_API,
  ErrorSeverity.HIGH,
  503,
  { 
    userId: user.id,
    paymentId: payment.id,
    provider: 'stripe'
  }
);
```

### Analytics Tracking

```typescript
// Track meaningful user actions
userBehaviorAnalytics.trackAction({
  userId,
  sessionId,
  action: 'challenge_completed',
  category: 'learning',
  path: req.path,
  duration: challengeDuration,
  metadata: {
    realmId: 'mathmage-trials',
    challengeId: 'equation-001',
    score: 95,
    attempts: 2,
    hintsUsed: 1
  }
});
```

### Performance Monitoring

```typescript
// Monitor critical operations
const startTime = performance.now();
try {
  const result = await expensiveOperation();
  const duration = performance.now() - startTime;
  
  if (duration > 1000) {
    console.warn(`Slow operation: ${duration}ms`);
  }
  
  return result;
} catch (error) {
  const duration = performance.now() - startTime;
  throw new AppError(
    'Operation failed',
    ErrorType.SYSTEM,
    ErrorSeverity.HIGH,
    500,
    { duration, operation: 'expensiveOperation' }
  );
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks in user sessions
   - Review analytics data retention policies
   - Monitor garbage collection patterns

2. **Slow Response Times**
   - Review database query performance
   - Check for blocking operations
   - Analyze request patterns

3. **Error Spikes**
   - Check error logs for patterns
   - Review recent deployments
   - Monitor external service status

### Log Analysis

```bash
# Filter logs by error type
grep "DATABASE" server.log

# Find slow requests
grep "SLOW REQUEST" server.log

# Monitor memory warnings
grep "HIGH MEMORY" server.log
```

## Future Enhancements

1. **Real-time Dashboards**: WebSocket-based live monitoring
2. **Advanced Alerting**: Email/Slack integration for critical issues
3. **Metrics Export**: Prometheus/Grafana integration
4. **Log Aggregation**: ELK stack or similar for centralized logging
5. **Distributed Tracing**: Request tracing across microservices
6. **Automated Recovery**: Self-healing mechanisms for common issues

## Testing

Run monitoring system tests:

```bash
# Run all monitoring tests
npm test -- --testPathPattern=monitoring.test.ts

# Run specific test suites
npm test -- --testNamePattern="Health Check"
npm test -- --testNamePattern="Error Tracking"
```

The monitoring system is designed to be lightweight, comprehensive, and easily extensible for future needs.
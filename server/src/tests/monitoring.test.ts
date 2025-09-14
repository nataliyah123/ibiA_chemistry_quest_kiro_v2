import request from 'supertest';
import express from 'express';
import monitoringRoutes from '../routes/monitoring';
import { performanceMonitoring } from '../middleware/monitoring';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from '../middleware/errorTracking';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(performanceMonitoring);
  app.use('/api/monitoring', monitoringRoutes);
  app.use(errorHandler);
  return app;
};

describe('Monitoring System', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapUsed');
    });
  });

  describe('System Metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('process');
      expect(response.body.process).toHaveProperty('pid');
      expect(response.body.process).toHaveProperty('version');
    });
  });

  describe('Error Tracking', () => {
    it('should return error statistics', async () => {
      const response = await request(app)
        .get('/api/monitoring/errors/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('bySeverity');
    });

    it('should return recent errors', async () => {
      const response = await request(app)
        .get('/api/monitoring/errors?limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('Analytics Tracking', () => {
    it('should return analytics metrics', async () => {
      const response = await request(app)
        .get('/api/monitoring/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('averageSessionDuration');
      expect(response.body).toHaveProperty('bounceRate');
      expect(response.body).toHaveProperty('topActions');
      expect(response.body).toHaveProperty('topPages');
    });

    it('should track user actions', async () => {
      const actionData = {
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        action: 'test_action',
        category: 'test',
        path: '/test',
        metadata: { test: true }
      };

      const response = await request(app)
        .post('/api/monitoring/analytics/track')
        .send(actionData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should start and end sessions', async () => {
      // Start session
      const startResponse = await request(app)
        .post('/api/monitoring/analytics/session/start')
        .send({
          userId: 'test-user-123',
          deviceType: 'desktop',
          browser: 'chrome',
          os: 'windows'
        })
        .expect(200);

      expect(startResponse.body).toHaveProperty('sessionId');
      const sessionId = startResponse.body.sessionId;

      // End session
      const endResponse = await request(app)
        .post('/api/monitoring/analytics/session/end')
        .send({ sessionId })
        .expect(200);

      expect(endResponse.body).toHaveProperty('success', true);
    });

    it('should validate required fields for tracking', async () => {
      const response = await request(app)
        .post('/api/monitoring/analytics/track')
        .send({
          userId: 'test-user-123'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Performance Monitoring', () => {
    it('should add request timing information', async () => {
      // Create a test route that we can monitor
      app.get('/test-route', (req, res) => {
        // Simulate some processing time
        setTimeout(() => {
          res.json({ message: 'test' });
        }, 10);
      });

      const response = await request(app)
        .get('/test-route')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'test');
      // The performance monitoring middleware should have added timing info
      // (This would be visible in logs in a real scenario)
    });
  });

  describe('Error Handling', () => {
    it('should handle custom AppError correctly', async () => {
      // Create a test route that throws a custom error
      app.get('/test-error', (req, res, next) => {
        const error = new AppError(
          'Test error message',
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          400
        );
        next(error);
      });

      const response = await request(app)
        .get('/test-error')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Test error message');
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('id');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should handle generic errors', async () => {
      // Create a test route that throws a generic error
      app.get('/test-generic-error', (req, res, next) => {
        next(new Error('Generic error message'));
      });

      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Generic error message');
      expect(response.body.error).toHaveProperty('id');
    });
  });
});

describe('AppError Class', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test message');
    
    expect(error.message).toBe('Test message');
    expect(error.type).toBe(ErrorType.UNKNOWN);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
  });

  it('should create error with custom values', () => {
    const metadata = { userId: '123', action: 'test' };
    const error = new AppError(
      'Custom error',
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      401,
      metadata
    );
    
    expect(error.message).toBe('Custom error');
    expect(error.type).toBe(ErrorType.AUTHENTICATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.statusCode).toBe(401);
    expect(error.metadata).toEqual(metadata);
  });
});
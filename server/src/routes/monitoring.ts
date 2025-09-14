import { Router } from 'express';
import { getHealthStatus } from '../middleware/monitoring';
import { errorTracker } from '../middleware/errorTracking';
import { userBehaviorAnalytics } from '../services/userBehaviorAnalytics';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to get health status'
    });
  }
});

// System metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system metrics'
    });
  }
});

// Error tracking endpoints
router.get('/errors', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    const severity = req.query.severity as string;

    let errors;
    if (type) {
      errors = errorTracker.getErrorsByType(type as any, limit);
    } else if (severity) {
      errors = errorTracker.getErrorsBySeverity(severity as any, limit);
    } else {
      errors = errorTracker.getRecentErrors(limit);
    }

    res.json({
      errors,
      total: errors.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get error data'
    });
  }
});

router.get('/errors/stats', (req, res) => {
  try {
    const stats = errorTracker.getErrorStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get error statistics'
    });
  }
});

// Analytics endpoints
router.get('/analytics', (req, res) => {
  try {
    const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
    const endDate = req.query.end ? new Date(req.query.end as string) : undefined;

    const timeRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
    const metrics = userBehaviorAnalytics.getAnalyticsMetrics(timeRange);

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get analytics data'
    });
  }
});

router.get('/analytics/sessions', (req, res) => {
  try {
    const activeSessions = userBehaviorAnalytics.getActiveSessions();
    res.json({
      activeSessions,
      count: activeSessions.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get session data'
    });
  }
});

router.get('/analytics/user/:userId/journey', (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const journey = userBehaviorAnalytics.getUserJourney(userId, limit);
    res.json({
      userId,
      journey,
      total: journey.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user journey data'
    });
  }
});

// Track user action endpoint (for client-side analytics)
router.post('/analytics/track', (req, res): void => {
  try {
    const { userId, sessionId, action, category, path, metadata, duration } = req.body;

    if (!userId || !sessionId || !action || !category || !path) {
      res.status(400).json({
        error: 'Missing required fields: userId, sessionId, action, category, path'
      });
      return;
    }

    userBehaviorAnalytics.trackAction({
      userId,
      sessionId,
      action,
      category,
      path,
      metadata,
      duration,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to track user action'
    });
  }
});

// Start session endpoint
router.post('/analytics/session/start', (req, res): void => {
  try {
    const { userId, deviceType, browser, os, referrer } = req.body;

    if (!userId) {
      res.status(400).json({
        error: 'Missing required field: userId'
      });
      return;
    }

    const sessionId = userBehaviorAnalytics.startSession(userId, {
      deviceType,
      browser,
      os,
      referrer
    });

    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start session'
    });
  }
});

// End session endpoint
router.post('/analytics/session/end', (req, res): void => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        error: 'Missing required field: sessionId'
      });
      return;
    }

    userBehaviorAnalytics.endSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to end session'
    });
  }
});

export default router;
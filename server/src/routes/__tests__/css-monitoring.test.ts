/**
 * Tests for CSS Monitoring Routes
 */

import request from 'supertest';
import express from 'express';
import cssMonitoringRouter from '../css-monitoring';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

const app = express();
app.use(express.json());
app.use('/api/css-monitoring', cssMonitoringRouter);

describe('CSS Monitoring Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored reports between tests
    // Note: In a real implementation, you'd want to clear the actual storage
  });

  describe('POST /report-error', () => {
    const validErrorReport = {
      sessionId: 'test-session-123',
      errors: [
        {
          type: 'load_failure',
          url: 'https://example.com/styles.css',
          timestamp: new Date().toISOString(),
          userAgent: 'test-user-agent',
          route: '/test-route',
          retryCount: 0,
          errorMessage: 'CSS file failed to load'
        }
      ],
      userContext: {
        authenticated: true,
        route: '/test-route',
        timestamp: new Date().toISOString()
      }
    };

    it('should accept valid error report', async () => {
      const response = await request(app)
        .post('/api/css-monitoring/report-error')
        .send(validErrorReport)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        reportId: 'test-session-123'
      });
    });

    it('should reject invalid error report - missing sessionId', async () => {
      const invalidReport = { ...validErrorReport };
      delete (invalidReport as any).sessionId;

      const response = await request(app)
        .post('/api/css-monitoring/report-error')
        .send(invalidReport)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid error report - invalid errors array', async () => {
      const invalidReport = {
        ...validErrorReport,
        errors: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/css-monitoring/report-error')
        .send(invalidReport)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid error report - missing userContext', async () => {
      const invalidReport = { ...validErrorReport };
      delete (invalidReport as any).userContext;

      const response = await request(app)
        .post('/api/css-monitoring/report-error')
        .send(invalidReport)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle multiple errors in single report', async () => {
      const multiErrorReport = {
        ...validErrorReport,
        errors: [
          ...validErrorReport.errors,
          {
            type: 'parse_error',
            url: 'https://example.com/styles2.css',
            timestamp: new Date().toISOString(),
            userAgent: 'test-user-agent',
            route: '/test-route',
            retryCount: 1,
            errorMessage: 'CSS parse error'
          }
        ]
      };

      const response = await request(app)
        .post('/api/css-monitoring/report-error')
        .send(multiErrorReport)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /error-stats', () => {
    it('should return error statistics', async () => {
      // First, submit some error reports
      await request(app)
        .post('/api/css-monitoring/report-error')
        .send({
          sessionId: 'session-1',
          errors: [
            {
              type: 'load_failure',
              url: 'https://example.com/styles1.css',
              timestamp: new Date().toISOString(),
              userAgent: 'test-user-agent',
              route: '/route1',
              retryCount: 0
            }
          ],
          userContext: {
            authenticated: true,
            route: '/route1',
            timestamp: new Date().toISOString()
          }
        });

      await request(app)
        .post('/api/css-monitoring/report-error')
        .send({
          sessionId: 'session-2',
          errors: [
            {
              type: 'parse_error',
              url: 'https://example.com/styles2.css',
              timestamp: new Date().toISOString(),
              userAgent: 'test-user-agent',
              route: '/route2',
              retryCount: 0
            }
          ],
          userContext: {
            authenticated: false,
            route: '/route2',
            timestamp: new Date().toISOString()
          }
        });

      const response = await request(app)
        .get('/api/css-monitoring/error-stats')
        .expect(200);

      expect(response.body).toMatchObject({
        totalReports: expect.any(Number),
        recentReports: expect.any(Number),
        dailyReports: expect.any(Number),
        errorsByType: expect.any(Object),
        errorsByUrl: expect.any(Object),
        mostProblematicAssets: expect.any(Array)
      });

      expect(response.body.errorsByType.load_failure).toBeGreaterThan(0);
      expect(response.body.errorsByType.parse_error).toBeGreaterThan(0);
    });

    it('should handle empty error stats', async () => {
      // Clear any existing reports first by making a fresh request
      const response = await request(app)
        .get('/api/css-monitoring/error-stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalReports');
      expect(response.body).toHaveProperty('errorsByType');
      expect(response.body).toHaveProperty('mostProblematicAssets');
    });
  });

  describe('GET /verify-assets', () => {
    it('should verify CSS assets when directory exists', async () => {
      // Mock fs.readdir to return CSS files
      mockFs.readdir.mockResolvedValue(['index-abc123.css', 'vendor-def456.css'] as any);
      
      // Mock fs.stat for each file
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
        isFile: () => true
      } as any);

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(200);

      expect(response.body).toMatchObject({
        staticPath: expect.any(String),
        assetsPath: expect.any(String),
        assets: expect.any(Array),
        summary: {
          total: 2,
          accessible: 2,
          missing: 0
        }
      });

      expect(response.body.assets).toHaveLength(2);
      expect(response.body.assets[0]).toMatchObject({
        path: '/assets/index-abc123.css',
        exists: true,
        size: 1024,
        accessible: true
      });
    });

    it('should handle missing assets directory', async () => {
      // Mock fs.readdir to throw error (directory doesn't exist)
      mockFs.readdir.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(200);

      expect(response.body.assets).toHaveLength(0);
      expect(response.body.summary.total).toBe(0);
    });

    it('should handle missing individual assets', async () => {
      mockFs.readdir.mockResolvedValue(['missing-file.css'] as any);
      mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(200);

      expect(response.body.assets).toHaveLength(1);
      expect(response.body.assets[0]).toMatchObject({
        path: '/assets/missing-file.css',
        exists: false,
        accessible: false
      });
      expect(response.body.summary.missing).toBe(1);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status with no recent errors', async () => {
      const response = await request(app)
        .get('/api/css-monitoring/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        recentErrorReports: expect.any(Number),
        criticalErrors: expect.any(Number),
        totalReports: expect.any(Number)
      });
    });

    it('should return unhealthy status with many critical errors', async () => {
      // Submit multiple critical error reports
      const criticalReport = {
        sessionId: 'critical-session',
        errors: [
          {
            type: 'load_failure',
            url: 'https://example.com/critical.css',
            timestamp: new Date().toISOString(),
            userAgent: 'test-user-agent',
            route: '/critical-route',
            retryCount: 0
          }
        ],
        userContext: {
          authenticated: true,
          route: '/critical-route',
          timestamp: new Date().toISOString()
        }
      };

      // Submit 6 critical reports (threshold is 5)
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/css-monitoring/report-error')
          .send({
            ...criticalReport,
            sessionId: `critical-session-${i}`
          });
      }

      const response = await request(app)
        .get('/api/css-monitoring/health')
        .expect(200);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.criticalErrors).toBeGreaterThanOrEqual(6);
    });
  });

  describe('DELETE /clear-reports', () => {
    it('should clear all error reports', async () => {
      // First, submit some reports
      await request(app)
        .post('/api/css-monitoring/report-error')
        .send({
          sessionId: 'test-session',
          errors: [
            {
              type: 'load_failure',
              url: 'https://example.com/styles.css',
              timestamp: new Date().toISOString(),
              userAgent: 'test-user-agent',
              route: '/test-route',
              retryCount: 0
            }
          ],
          userContext: {
            authenticated: true,
            route: '/test-route',
            timestamp: new Date().toISOString()
          }
        });

      // Clear reports
      const response = await request(app)
        .delete('/api/css-monitoring/clear-reports')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        clearedReports: expect.any(Number),
        message: 'All error reports cleared'
      });

      // Verify reports are cleared
      const statsResponse = await request(app)
        .get('/api/css-monitoring/error-stats')
        .expect(200);

      expect(statsResponse.body.totalReports).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock fs.readdir to throw an unexpected error
      mockFs.readdir.mockRejectedValue(new Error('Unexpected filesystem error'));

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });

  describe('Asset Verification', () => {
    it('should filter only CSS files', async () => {
      mockFs.readdir.mockResolvedValue([
        'index-abc123.css',
        'script.js',
        'image.png',
        'vendor-def456.css',
        'README.md'
      ] as any);

      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
        isFile: () => true
      } as any);

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(200);

      expect(response.body.assets).toHaveLength(2);
      expect(response.body.assets.every((asset: any) => asset.path.endsWith('.css'))).toBe(true);
    });

    it('should handle zero-byte CSS files', async () => {
      mockFs.readdir.mockResolvedValue(['empty.css'] as any);
      mockFs.stat.mockResolvedValue({
        size: 0,
        mtime: new Date(),
        isFile: () => true
      } as any);

      const response = await request(app)
        .get('/api/css-monitoring/verify-assets')
        .expect(200);

      expect(response.body.assets[0]).toMatchObject({
        path: '/assets/empty.css',
        exists: true,
        size: 0,
        accessible: false // Zero-byte files are not accessible
      });
      expect(response.body.summary.accessible).toBe(0);
    });
  });
});
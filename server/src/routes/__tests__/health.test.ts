import request from 'supertest';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import healthRoutes from '../health';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock the database and Redis setup to avoid connection issues
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../config/redis', () => ({
  connectRedis: jest.fn()
}));

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Set default environment
    process.env.STATIC_PATH = '/usr/share/nginx/html';
  });

  afterEach(() => {
    delete process.env.STATIC_PATH;
  });

  describe('GET /api/health/assets/css', () => {
    it('should return healthy status when CSS assets are available', async () => {
      const mockFiles = ['index-abc123.css', 'vendor-def456.css'];
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01T00:00:00Z')
      };

      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        summary: {
          total: 2,
          healthy: 2,
          missing: 0
        }
      });

      expect(response.body.assets).toHaveLength(2);
      expect(response.body.assets[0]).toMatchObject({
        path: '/assets/index-abc123.css',
        exists: true,
        size: 1024,
        mimeType: 'text/css'
      });
    });

    it('should return degraded status when some assets are missing', async () => {
      const mockFiles = ['index-abc123.css', 'vendor-def456.css'];
      
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat
        .mockResolvedValueOnce({
          size: 1024,
          mtime: new Date('2023-01-01T00:00:00Z')
        } as any)
        .mockRejectedValueOnce(new Error('File not found'));

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(503);

      expect(response.body).toMatchObject({
        status: 'degraded',
        summary: {
          total: 2,
          healthy: 1,
          missing: 1
        }
      });

      expect(response.body.assets).toHaveLength(2);
      expect(response.body.assets[0].exists).toBe(true);
      expect(response.body.assets[1].exists).toBe(false);
      expect(response.body.assets[1].error).toBe('File not found');
    });

    it('should return unhealthy status when no assets are available', async () => {
      const mockFiles = ['index-abc123.css'];
      
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(503);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        summary: {
          total: 1,
          healthy: 0,
          missing: 1
        }
      });
    });

    it('should return unhealthy status when assets directory is not accessible', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(500);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        error: 'Directory not found',
        assets: [],
        summary: {
          total: 0,
          healthy: 0,
          missing: 0
        }
      });
    });

    it('should filter only CSS files', async () => {
      const mockFiles = [
        'index-abc123.css',
        'vendor-def456.css',
        'app.js',
        'favicon.ico',
        'manifest.json'
      ];
      
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01T00:00:00Z')
      };

      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(200);

      expect(response.body.summary.total).toBe(2);
      expect(response.body.assets).toHaveLength(2);
      expect(response.body.assets.every((asset: any) => asset.path.endsWith('.css'))).toBe(true);
    });

    it('should use custom static path from environment', async () => {
      process.env.STATIC_PATH = '/custom/static/path';
      
      const mockFiles = ['test.css'];
      const mockStats = {
        size: 512,
        mtime: new Date('2023-01-01T00:00:00Z')
      };

      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);

      await request(app)
        .get('/api/health/assets/css')
        .expect(200);

      expect(mockFs.readdir).toHaveBeenCalledWith('/custom/static/path/assets');
    });

    it('should include timestamp in response', async () => {
      const mockFiles = ['test.css'];
      const mockStats = {
        size: 512,
        mtime: new Date('2023-01-01T00:00:00Z')
      };

      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);

      const beforeRequest = new Date();
      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(200);
      const afterRequest = new Date();

      expect(response.body.timestamp).toBeDefined();
      const responseTime = new Date(response.body.timestamp);
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });

    it('should include lastModified timestamp for assets', async () => {
      const mockFiles = ['test.css'];
      const mockDate = new Date('2023-06-15T10:30:00Z');
      const mockStats = {
        size: 512,
        mtime: mockDate
      };

      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/health/assets/css')
        .expect(200);

      expect(response.body.assets[0].lastModified).toBe(mockDate.toISOString());
    });
  });
});
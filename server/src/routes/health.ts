import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

interface AssetHealthCheck {
  path: string;
  exists: boolean;
  size?: number;
  mimeType: string;
  lastModified?: string;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  assets: AssetHealthCheck[];
  summary: {
    total: number;
    healthy: number;
    missing: number;
  };
}

// CSS asset health check endpoint
router.get('/assets/css', async (req: Request, res: Response) => {
  try {
    const staticPath = process.env.STATIC_PATH || '/usr/share/nginx/html';
    const assetsPath = path.join(staticPath, 'assets');
    
    // Get all CSS files in assets directory
    const files = await fs.readdir(assetsPath);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    const assetChecks: AssetHealthCheck[] = [];
    
    for (const file of cssFiles) {
      const filePath = path.join(assetsPath, file);
      const assetPath = `/assets/${file}`;
      
      try {
        const stats = await fs.stat(filePath);
        assetChecks.push({
          path: assetPath,
          exists: true,
          size: stats.size,
          mimeType: 'text/css',
          lastModified: stats.mtime.toISOString()
        });
      } catch (error) {
        assetChecks.push({
          path: assetPath,
          exists: false,
          mimeType: 'text/css',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const summary = {
      total: assetChecks.length,
      healthy: assetChecks.filter(asset => asset.exists).length,
      missing: assetChecks.filter(asset => !asset.exists).length
    };
    
    const status = summary.missing === 0 ? 'healthy' : 
                  summary.healthy > 0 ? 'degraded' : 'unhealthy';
    
    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      assets: assetChecks,
      summary
    };
    
    res.status(status === 'healthy' ? 200 : 503).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      assets: [],
      summary: { total: 0, healthy: 0, missing: 0 }
    });
  }
});

export default router;
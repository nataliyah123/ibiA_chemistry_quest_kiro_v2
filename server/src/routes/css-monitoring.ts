/**
 * CSS Monitoring Routes
 * Server-side monitoring for CSS asset serving and error reporting
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

interface CSSError {
  type: 'load_failure' | 'parse_error' | 'network_error';
  url: string;
  timestamp: Date;
  userAgent: string;
  route: string;
  retryCount: number;
  errorMessage?: string;
}

interface CSSErrorReport {
  sessionId: string;
  errors: CSSError[];
  userContext: {
    authenticated: boolean;
    route: string;
    timestamp: Date;
  };
}

interface CSSAssetStatus {
  path: string;
  exists: boolean;
  size: number;
  lastModified: Date;
  mimeType: string;
  accessible: boolean;
}

// Store error reports in memory (in production, use a proper database)
const errorReports: CSSErrorReport[] = [];
const assetCache = new Map<string, CSSAssetStatus>();

/**
 * Receive CSS error reports from clients
 */
router.post('/report-error', [
  body('sessionId').isString().notEmpty(),
  body('errors').isArray(),
  body('userContext').isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report: CSSErrorReport = req.body;
    
    // Store the error report
    errorReports.push({
      ...report,
      errors: report.errors.map(error => ({
        ...error,
        timestamp: new Date(error.timestamp)
      })),
      userContext: {
        ...report.userContext,
        timestamp: new Date(report.userContext.timestamp)
      }
    });

    // Log critical errors
    const criticalErrors = report.errors.filter(error => error.type === 'load_failure');
    if (criticalErrors.length > 0) {
      console.error('Critical CSS loading errors reported:', {
        sessionId: report.sessionId,
        route: report.userContext.route,
        errors: criticalErrors.map(e => ({ url: e.url, message: e.errorMessage }))
      });
    }

    // Trigger asset verification for failed URLs
    const failedUrls = report.errors.map(error => error.url);
    await verifyAssets(failedUrls);

    return res.json({ success: true, reportId: report.sessionId });
  } catch (error) {
    console.error('Error processing CSS error report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get CSS error statistics
 */
router.get('/error-stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentReports = errorReports.filter(
      report => new Date(report.userContext.timestamp) > oneHourAgo
    );

    const dailyReports = errorReports.filter(
      report => new Date(report.userContext.timestamp) > oneDayAgo
    );

    const errorsByType = errorReports.reduce((acc, report) => {
      report.errors.forEach(error => {
        acc[error.type] = (acc[error.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const errorsByUrl = errorReports.reduce((acc, report) => {
      report.errors.forEach(error => {
        acc[error.url] = (acc[error.url] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalReports: errorReports.length,
      recentReports: recentReports.length,
      dailyReports: dailyReports.length,
      errorsByType,
      errorsByUrl,
      mostProblematicAssets: Object.entries(errorsByUrl)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([url, count]) => ({ url, errorCount: count }))
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error getting CSS error stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify CSS asset availability
 */
router.get('/verify-assets', async (req: Request, res: Response) => {
  try {
    const staticPath = process.env.STATIC_PATH || '/usr/share/nginx/html';
    const assetsPath = path.join(staticPath, 'assets');

    const assetStatuses = await getAssetStatuses(assetsPath);
    
    return res.json({
      staticPath,
      assetsPath,
      assets: assetStatuses,
      summary: {
        total: assetStatuses.length,
        accessible: assetStatuses.filter(a => a.accessible).length,
        missing: assetStatuses.filter(a => !a.exists).length
      }
    });
  } catch (error) {
    console.error('Error verifying CSS assets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check for CSS monitoring system
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentErrors = errorReports.filter(
      report => new Date(report.userContext.timestamp) > fiveMinutesAgo
    );

    const criticalErrors = recentErrors.filter(
      report => report.errors.some(error => error.type === 'load_failure')
    );

    const status = criticalErrors.length > 5 ? 'unhealthy' : 'healthy';
    
    return res.json({
      status,
      timestamp: now,
      recentErrorReports: recentErrors.length,
      criticalErrors: criticalErrors.length,
      totalReports: errorReports.length
    });
  } catch (error) {
    console.error('Error checking CSS monitoring health:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clear error reports (for testing/maintenance)
 */
router.delete('/clear-reports', async (req: Request, res: Response) => {
  try {
    const clearedCount = errorReports.length;
    errorReports.length = 0;
    assetCache.clear();
    
    return res.json({ 
      success: true, 
      clearedReports: clearedCount,
      message: 'All error reports cleared'
    });
  } catch (error) {
    console.error('Error clearing CSS error reports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper function to verify specific assets
 */
async function verifyAssets(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      // Extract asset path from URL
      const urlPath = new URL(url).pathname;
      const staticPath = process.env.STATIC_PATH || '/usr/share/nginx/html';
      const fullPath = path.join(staticPath, urlPath);

      const status = await getAssetStatus(fullPath, urlPath);
      assetCache.set(url, status);

      if (!status.accessible) {
        console.warn(`CSS asset not accessible: ${url} -> ${fullPath}`);
      }
    } catch (error) {
      console.error(`Error verifying asset ${url}:`, error);
    }
  }
}

/**
 * Get status of all CSS assets in the assets directory
 */
async function getAssetStatuses(assetsPath: string): Promise<CSSAssetStatus[]> {
  try {
    const files = await fs.readdir(assetsPath);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    const statuses = await Promise.all(
      cssFiles.map(async (file) => {
        const fullPath = path.join(assetsPath, file);
        const urlPath = `/assets/${file}`;
        return getAssetStatus(fullPath, urlPath);
      })
    );

    return statuses;
  } catch (error) {
    console.error('Error reading assets directory:', error);
    return [];
  }
}

/**
 * Get status of a single asset
 */
async function getAssetStatus(fullPath: string, urlPath: string): Promise<CSSAssetStatus> {
  try {
    const stats = await fs.stat(fullPath);
    
    return {
      path: urlPath,
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
      mimeType: 'text/css',
      accessible: stats.size > 0
    };
  } catch (error) {
    return {
      path: urlPath,
      exists: false,
      size: 0,
      lastModified: new Date(0),
      mimeType: 'text/css',
      accessible: false
    };
  }
}

export default router;
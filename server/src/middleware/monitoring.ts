import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Extend Request interface to include monitoring data
interface MonitoredRequest extends Request {
  startTime?: number;
  requestId?: string;
}

// Performance monitoring middleware
export const performanceMonitoring = (req: MonitoredRequest, res: Response, next: NextFunction) => {
  req.startTime = performance.now();
  req.requestId = generateRequestId();

  // Log request start
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${req.requestId}`);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = ((chunk?: any, encoding?: any, cb?: () => void): Response => {
    const endTime = performance.now();
    const responseTime = req.startTime ? endTime - req.startTime : 0;
    
    // Log response
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${responseTime.toFixed(2)}ms - Request ID: ${req.requestId}`);
    
    // Track slow requests (>1000ms)
    if (responseTime > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms - Request ID: ${req.requestId}`);
    }
    
    return originalEnd.call(res, chunk, encoding, cb);
  }) as any;

  next();
};

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Memory usage monitoring
export const memoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memoryInfo = {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
    };
    
    // Log memory usage every 5 minutes
    console.log(`[MEMORY] RSS: ${memoryInfo.rss}MB, Heap Used: ${memoryInfo.heapUsed}MB, Heap Total: ${memoryInfo.heapTotal}MB`);
    
    // Alert if memory usage is high (>500MB heap used)
    if (memoryInfo.heapUsed > 500) {
      console.warn(`HIGH MEMORY USAGE: Heap used ${memoryInfo.heapUsed}MB`);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

// Health check endpoint data
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'error';
}

// Get system health status
export const getHealthStatus = async (): Promise<HealthStatus> => {
  const memUsage = process.memoryUsage();
  
  return {
    status: 'healthy', // TODO: Implement actual health checks
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
    },
    database: 'connected', // TODO: Implement actual database health check
    redis: 'connected', // TODO: Implement actual Redis health check
  };
};
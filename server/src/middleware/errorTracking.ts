import { Request, Response, NextFunction } from 'express';

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Structured error interface
export interface StructuredError {
  id: string;
  timestamp: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  requestId?: string;
  userId?: string;
  path: string;
  method: string;
  statusCode: number;
  metadata?: Record<string, any>;
}

// Custom error class
export class AppError extends Error {
  public type: ErrorType;
  public severity: ErrorSeverity;
  public statusCode: number;
  public metadata?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.metadata = metadata;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error tracking service
class ErrorTracker {
  private errors: StructuredError[] = [];
  private maxErrors = 1000; // Keep last 1000 errors in memory

  logError(error: StructuredError): void {
    // Add to in-memory store
    this.errors.unshift(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with appropriate level
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel](`[ERROR] ${error.id} - ${error.type.toUpperCase()} - ${error.message}`, {
      requestId: error.requestId,
      userId: error.userId,
      path: error.path,
      method: error.method,
      statusCode: error.statusCode,
      stack: error.stack,
      metadata: error.metadata
    });

    // Alert for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.alertCriticalError(error);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  private alertCriticalError(error: StructuredError): void {
    // TODO: Implement alerting mechanism (email, Slack, etc.)
    console.error('🚨 CRITICAL ERROR ALERT 🚨', {
      id: error.id,
      message: error.message,
      path: error.path,
      timestamp: error.timestamp
    });
  }

  getRecentErrors(limit: number = 50): StructuredError[] {
    return this.errors.slice(0, limit);
  }

  getErrorsByType(type: ErrorType, limit: number = 50): StructuredError[] {
    return this.errors.filter(error => error.type === type).slice(0, limit);
  }

  getErrorsBySeverity(severity: ErrorSeverity, limit: number = 50): StructuredError[] {
    return this.errors.filter(error => error.severity === severity).slice(0, limit);
  }

  getErrorStats(): { total: number; byType: Record<string, number>; bySeverity: Record<string, number> } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Generate unique error ID
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Categorize error based on message and context
function categorizeError(error: Error, req: Request): { type: ErrorType; severity: ErrorSeverity } {
  const message = error.message.toLowerCase();
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('token') || message.includes('authentication')) {
    return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.MEDIUM };
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
    return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
  }
  
  // Database errors
  if (message.includes('database') || message.includes('connection') || message.includes('query')) {
    return { type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH };
  }
  
  // System errors
  if (message.includes('memory') || message.includes('timeout') || message.includes('system')) {
    return { type: ErrorType.SYSTEM, severity: ErrorSeverity.CRITICAL };
  }
  
  // Default
  return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM };
}

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Determine error details
  let statusCode = 500;
  let type = ErrorType.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let metadata: Record<string, any> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    type = error.type;
    severity = error.severity;
    metadata = error.metadata;
  } else {
    const categorized = categorizeError(error, req);
    type = categorized.type;
    severity = categorized.severity;
    
    // Set status code based on error type
    switch (type) {
      case ErrorType.AUTHENTICATION:
        statusCode = 401;
        break;
      case ErrorType.AUTHORIZATION:
        statusCode = 403;
        break;
      case ErrorType.VALIDATION:
        statusCode = 400;
        break;
      case ErrorType.DATABASE:
        statusCode = 503;
        break;
      default:
        statusCode = 500;
    }
  }

  // Create structured error
  const structuredError: StructuredError = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    type,
    severity,
    message: error.message,
    stack: error.stack,
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
    path: req.path,
    method: req.method,
    statusCode,
    metadata
  };

  // Log the error
  errorTracker.logError(structuredError);

  // Send response
  const response = {
    error: {
      id: structuredError.id,
      message: error.message,
      type: type,
      timestamp: structuredError.timestamp
    }
  };

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'development') {
    (response.error as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Unhandled promise rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = new AppError(
      `Unhandled Promise Rejection: ${reason}`,
      ErrorType.SYSTEM,
      ErrorSeverity.CRITICAL,
      500,
      { promise: promise.toString() }
    );

    const structuredError: StructuredError = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      stack: error.stack,
      path: 'N/A',
      method: 'N/A',
      statusCode: 500,
      metadata: error.metadata
    };

    errorTracker.logError(structuredError);
    
    // Exit process for critical unhandled rejections
    console.error('Unhandled Promise Rejection. Shutting down...');
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    const appError = new AppError(
      `Uncaught Exception: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.CRITICAL,
      500
    );

    const structuredError: StructuredError = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      type: appError.type,
      severity: appError.severity,
      message: appError.message,
      stack: error.stack,
      path: 'N/A',
      method: 'N/A',
      statusCode: 500
    };

    errorTracker.logError(structuredError);
    
    // Exit process for uncaught exceptions
    console.error('Uncaught Exception. Shutting down...');
    process.exit(1);
  });
};
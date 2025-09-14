import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisUtils } from '../config/redis';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: 'JWT secret not configured' });
      return;
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redisUtils.getCache(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ message: 'Token has been invalidated' });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }
    
    res.status(500).json({ message: 'Token verification failed' });
    return;
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check if token is blacklisted
    const isBlacklisted = await redisUtils.getCache(`blacklist:${token}`);
    if (!isBlacklisted) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

export const generateTokens = (user: { id: string; email: string; username: string }) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    jwtRefreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtRefreshSecret) {
    throw new Error('JWT refresh secret not configured');
  }
  
  try {
    return jwt.verify(token, jwtRefreshSecret) as any;
  } catch (error) {
    throw error;
  }
};
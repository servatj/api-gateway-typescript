import { Request, Response, NextFunction } from 'express';
import { AuthContext } from '../types';
import { createError } from './errorHandler';
import { logger } from '../services/logger';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('Authorization header missing', 401);
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw createError('Token missing', 401);
    }

    // Here you would validate the token
    // For now, we'll just pass it through to the auth service
    req.auth = {
      token,
      // You can add more context here after token validation
    };

    logger.info('Auth middleware passed', { 
      path: req.path, 
      method: req.method,
      hasToken: !!token 
    });

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      
      if (token) {
        req.auth = { token };
      }
    }
    
    next();
  } catch (error) {
    // In optional auth, we don't fail on auth errors
    logger.warn('Optional auth failed', { error: error.message });
    next();
  }
};

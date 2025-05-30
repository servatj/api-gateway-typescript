import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getServiceConfig } from '../services/serviceRegistry';
import { logger } from '../services/logger';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const serviceConfig = getServiceConfig('auth');

if (!serviceConfig) {
  throw new Error('Auth service not configured');
}

// Proxy configuration for auth service
const authProxy = createProxyMiddleware({
  target: serviceConfig.baseUrl,
  changeOrigin: true,
  timeout: serviceConfig.timeout,
  pathRewrite: {
    '^/auth': '', // Remove /auth prefix when forwarding
  },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', {
      error: err.message,
      path: req.url,
      target: serviceConfig.baseUrl
    });
    
    res.status(502).json({
      success: false,
      error: 'Auth service unavailable',
      timestamp: new Date().toISOString()
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying to auth service', {
      method: req.method,
      path: req.url,
      target: `${serviceConfig.baseUrl}${req.url?.replace('/auth', '')}`
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Auth service response', {
      statusCode: proxyRes.statusCode,
      path: req.url
    });
  }
});

// Public endpoints (no auth required)
router.use([
  '/signup',
  '/signin', 
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email'
], authProxy);

// Protected endpoints (optional auth for some cases)
router.use([
  '/profile',
  '/logout',
  '/refresh-token',
  '/change-password'
], optionalAuth, authProxy);

// Catch all other auth routes
router.use('*', authProxy);

export { router as authRoutes };

import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getServiceConfig } from '../services/serviceRegistry';
import { logger } from '../services/logger';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const serviceConfig = getServiceConfig('compliance');

if (!serviceConfig) {
  throw new Error('Compliance service not configured');
}

// Proxy configuration for compliance service
const complianceProxy = createProxyMiddleware({
  target: serviceConfig.baseUrl,
  changeOrigin: true,
  timeout: serviceConfig.timeout,
  pathRewrite: {
    '^/compliance': '', // Remove /compliance prefix when forwarding
  },
  onError: (err, req, res) => {
    logger.error('Compliance service proxy error', {
      error: err.message,
      path: req.url,
      target: serviceConfig.baseUrl
    });
    
    res.status(502).json({
      success: false,
      error: 'Compliance service unavailable',
      timestamp: new Date().toISOString()
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward auth token if available
    if (req.auth?.token) {
      proxyReq.setHeader('Authorization', `Bearer ${req.auth.token}`);
    }
    
    logger.info('Proxying to compliance service', {
      method: req.method,
      path: req.url,
      target: `${serviceConfig.baseUrl}${req.url?.replace('/compliance', '')}`,
      hasAuth: !!req.auth?.token
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Compliance service response', {
      statusCode: proxyRes.statusCode,
      path: req.url
    });
  }
});

// All compliance endpoints require authentication
router.use('*', authMiddleware, complianceProxy);

export { router as complianceRoutes };

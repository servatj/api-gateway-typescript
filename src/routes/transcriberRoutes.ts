import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getServiceConfig } from '../services/serviceRegistry';
import { logger } from '../services/logger';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const serviceConfig = getServiceConfig('transcriber');

if (!serviceConfig) {
  throw new Error('Transcriber service not configured');
}

// Proxy configuration for transcriber service
const transcriberProxy = createProxyMiddleware({
  target: serviceConfig.baseUrl,
  changeOrigin: true,
  timeout: serviceConfig.timeout,
  pathRewrite: {
    '^/transcriber': '', // Remove /transcriber prefix when forwarding
  },
  onError: (err, req, res) => {
    logger.error('Transcriber service proxy error', {
      error: err.message,
      path: req.url,
      target: serviceConfig.baseUrl
    });
    
    res.status(502).json({
      success: false,
      error: 'Transcriber service unavailable',
      timestamp: new Date().toISOString()
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward auth token if available
    if (req.auth?.token) {
      proxyReq.setHeader('Authorization', `Bearer ${req.auth.token}`);
    }
    
    logger.info('Proxying to transcriber service', {
      method: req.method,
      path: req.url,
      target: `${serviceConfig.baseUrl}${req.url?.replace('/transcriber', '')}`,
      hasAuth: !!req.auth?.token
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Transcriber service response', {
      statusCode: proxyRes.statusCode,
      path: req.url
    });
  }
});

// All transcriber endpoints require authentication
router.use('*', authMiddleware, transcriberProxy);

export { router as transcriberRoutes };

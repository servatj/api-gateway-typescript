import { Application } from 'express';
import { authRoutes } from './authRoutes';
import { transcriberRoutes } from './transcriberRoutes';
import { complianceRoutes } from './complianceRoutes';
import { logger } from '../services/logger';

export const setupRoutes = (app: Application): void => {
  logger.info('Setting up API Gateway routes...');

  // Auth service routes
  app.use('/auth', authRoutes);

  // Transcriber service routes  
  app.use('/transcriber', transcriberRoutes);

  // Compliance service routes
  app.use('/compliance', complianceRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'API Gateway is running',
      version: '1.0.0',
      services: [
        'auth',
        'transcriber', 
        'compliance'
      ],
      endpoints: {
        auth: '/auth/*',
        transcriber: '/transcriber/*',
        compliance: '/compliance/*',
        health: '/health'
      }
    });
  });

  logger.info('Routes setup completed');
};

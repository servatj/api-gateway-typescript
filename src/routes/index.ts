import { Application } from 'express';
import { authRoutes } from './authRoutes';
import { transcriberRoutes } from './transcriberRoutes';
import { logger } from '../services/logger';

export const setupRoutes = (app: Application): void => {
  logger.info('Setting up API Gateway routes...');

  // Auth service routes
  app.use('/auth', authRoutes);

  // Transcriber service routes  
  app.use('/transcriber', transcriberRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'API Gateway is running',
      version: '1.0.0',
      services: [
        'auth',
        'transcriber'
      ],
      endpoints: {
        auth: '/auth/*',
        transcriber: '/transcriber/*',
        health: '/health'
      }
    });
  });

  logger.info('Routes setup completed');
};

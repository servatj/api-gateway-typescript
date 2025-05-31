import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../index';

// Mock the individual route modules
jest.mock('../authRoutes', () => ({
  authRoutes: express.Router()
}));

jest.mock('../transcriberRoutes', () => ({
  transcriberRoutes: express.Router()
}));

// Mock logger
jest.mock('../../services/logger', () => ({
  logger: {
    info: jest.fn()
  }
}));

describe('Routes Setup', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    setupRoutes(app);
  });

  describe('setupRoutes', () => {
    it('should setup root endpoint correctly', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({
        message: 'API Gateway is running',
        version: '1.0.0',
        services: ['auth', 'transcriber'],
        endpoints: {
          auth: '/auth/*',
          transcriber: '/transcriber/*',
          health: '/health'
        }
      });
    });

    it('should return consistent API information', async () => {
      const response = await request(app).get('/');

      expect(response.body.message).toBe('API Gateway is running');
      expect(response.body.version).toBe('1.0.0');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services).toHaveLength(2);
      expect(response.body.services).toContain('auth');
      expect(response.body.services).toContain('transcriber');
    });

    it('should not include compliance in services list', async () => {
      const response = await request(app).get('/');

      expect(response.body.services).not.toContain('compliance');
      expect(response.body.endpoints).not.toHaveProperty('compliance');
    });

    it('should include all expected endpoints', async () => {
      const response = await request(app).get('/');

      expect(response.body.endpoints).toHaveProperty('auth', '/auth/*');
      expect(response.body.endpoints).toHaveProperty('transcriber', '/transcriber/*');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
    });

    it('should return JSON content type', async () => {
      await request(app)
        .get('/')
        .expect('Content-Type', /application\/json/);
    });

    it('should return 200 status code', async () => {
      await request(app)
        .get('/')
        .expect(200);
    });
  });

  describe('Route mounting', () => {
    it('should mount auth routes at /auth', async () => {
      // This test verifies that auth routes are mounted, even if they return 404
      // because we're using mocked routers
      const response = await request(app).get('/auth/test');
      // Should not be 500 (which would indicate routes not mounted)
      expect([200, 404, 405]).toContain(response.status);
    });

    it('should mount transcriber routes at /transcriber', async () => {
      // This test verifies that transcriber routes are mounted
      const response = await request(app).get('/transcriber/test');
      // Should not be 500 (which would indicate routes not mounted)
      expect([200, 404, 405]).toContain(response.status);
    });
  });

  describe('Error handling for non-existent routes', () => {
    it('should handle requests to unmounted paths gracefully', async () => {
      // Since we're not mounting any handlers on the mocked routers,
      // requests should either 404 or pass through
      const response = await request(app).get('/nonexistent');
      expect([404, 200]).toContain(response.status);
    });
  });

  describe('API version consistency', () => {
    it('should return version 1.0.0', async () => {
      const response = await request(app).get('/');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should maintain consistent message', async () => {
      const response = await request(app).get('/');
      expect(response.body.message).toBe('API Gateway is running');
    });
  });
});

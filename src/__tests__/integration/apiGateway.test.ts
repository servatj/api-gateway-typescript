import request from 'supertest';
import app from '../../index';

// Mock logger to avoid console output during tests
jest.mock('../../services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock healthChecker to avoid real service calls
jest.mock('../../services/healthChecker', () => ({
  healthChecker: {
    getOverallHealth: jest.fn(() => ({
      status: 'healthy',
      services: [
        {
          service: 'auth',
          status: 'healthy',
          responseTime: 50,
          lastCheck: '2025-05-31T00:00:00.000Z'
        },
        {
          service: 'transcriber',
          status: 'healthy',
          responseTime: 75,
          lastCheck: '2025-05-31T00:00:00.000Z'
        }
      ],
      summary: {
        total: 2,
        healthy: 2,
        unhealthy: 0
      }
    })),
    getAllHealthStatuses: jest.fn(() => [
      {
        service: 'auth',
        status: 'healthy',
        responseTime: 50,
        lastCheck: '2025-05-31T00:00:00.000Z'
      },
      {
        service: 'transcriber',
        status: 'healthy',
        responseTime: 75,
        lastCheck: '2025-05-31T00:00:00.000Z'
      }
    ])
  }
}));

// Mock service registry to avoid real service dependencies
jest.mock('../../services/serviceRegistry', () => ({
  getServiceConfig: jest.fn((serviceName: string) => {
    const configs = {
      auth: {
        name: 'auth',
        baseUrl: 'http://localhost:3001',
        timeout: 30000,
        retries: 3,
        healthCheck: '/health'
      },
      transcriber: {
        name: 'transcriber',
        baseUrl: 'http://localhost:3002',
        timeout: 60000,
        retries: 2,
        healthCheck: '/health'
      }
    };
    return configs[serviceName] || null;
  }),
  getAllServices: jest.fn(() => [
    {
      name: 'auth',
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
      retries: 3,
      healthCheck: '/health'
    },
    {
      name: 'transcriber',
      baseUrl: 'http://localhost:3002',
      timeout: 60000,
      retries: 2,
      healthCheck: '/health'
    }
  ])
}));

describe('API Gateway Integration Tests', () => {
  describe('Health Endpoints', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('summary');
      
      expect(response.body.services).toHaveLength(2);
      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.healthy).toBe(2);
      expect(response.body.summary.unhealthy).toBe(0);
    });

    it('should return detailed services health', async () => {
      const response = await request(app)
        .get('/health/services')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services).toHaveLength(2);

      const authService = response.body.services.find(s => s.service === 'auth');
      const transcriberService = response.body.services.find(s => s.service === 'transcriber');

      expect(authService).toBeDefined();
      expect(authService.status).toBe('healthy');
      expect(transcriberService).toBeDefined();
      expect(transcriberService.status).toBe('healthy');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API Gateway information', async () => {
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

    it('should not expose compliance service', async () => {
      const response = await request(app).get('/');

      expect(response.body.services).not.toContain('compliance');
      expect(response.body.endpoints).not.toHaveProperty('compliance');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/non-existent-route');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('should handle POST to non-existent routes', async () => {
      const response = await request(app)
        .post('/non-existent-post')
        .send({ test: 'data' })
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/non-existent-post');
      expect(response.body).toHaveProperty('method', 'POST');
    });

    it('should handle PUT to non-existent routes', async () => {
      const response = await request(app)
        .put('/non-existent-put')
        .send({ test: 'data' })
        .expect(404);

      expect(response.body.method).toBe('PUT');
    });

    it('should handle DELETE to non-existent routes', async () => {
      const response = await request(app)
        .delete('/non-existent-delete')
        .expect(404);

      expect(response.body.method).toBe('DELETE');
    });
  });

  describe('Content-Type Handling', () => {
    it('should accept JSON content', async () => {
      const response = await request(app)
        .post('/non-existent')
        .send({ test: 'json data' })
        .set('Content-Type', 'application/json')
        .expect(404);

      expect(response.body.method).toBe('POST');
    });

    it('should accept URL-encoded content', async () => {
      const response = await request(app)
        .post('/non-existent')
        .send('test=urlencoded')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(404);

      expect(response.body.method).toBe('POST');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
      const response = await request(app).get('/');

      // Check for common security headers that Helmet adds
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Rate Limiting', () => {
    it('should not block requests under rate limit', async () => {
      // Make a few requests that should all succeed
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/')
          .expect(200);
      }
    });
  });

  describe('Compression', () => {
    it('should accept gzip encoding', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Encoding', 'gzip');

      expect(response.status).toBe(200);
    });
  });

  describe('Request Size Limits', () => {
    it('should accept reasonable JSON payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(1000), // 1KB of data
        nested: {
          field1: 'test',
          field2: 'test',
          field3: 'test'
        }
      };

      const response = await request(app)
        .post('/non-existent')
        .send(largePayload)
        .expect(404);

      expect(response.body.method).toBe('POST');
    });
  });

  describe('API Consistency', () => {
    it('should maintain consistent response format for errors', async () => {
      const response = await request(app)
        .get('/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.path).toBe('string');
      expect(typeof response.body.method).toBe('string');
    });

    it('should maintain consistent response format for success', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('endpoints');
    });
  });
});

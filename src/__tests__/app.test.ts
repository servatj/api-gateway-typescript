import request from 'supertest';
import app from '../index';

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toContain('auth');
      expect(response.body.services).toContain('transcriber');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/nonexistent');
      expect(response.body).toHaveProperty('method', 'GET');
    });
  });
});

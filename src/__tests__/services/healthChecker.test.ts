import axios from 'axios';
import { HealthChecker } from '../healthChecker';
import { ServiceConfig } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock getAllServices
jest.mock('../serviceRegistry', () => ({
  getAllServices: jest.fn(() => [
    {
      name: 'auth',
      baseUrl: 'http://localhost:3001',
      healthCheck: '/health'
    },
    {
      name: 'transcriber', 
      baseUrl: 'http://localhost:3002',
      healthCheck: '/health'
    }
  ])
}));

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    healthChecker = new HealthChecker(5000); // 5 second interval for testing
  });

  afterEach(() => {
    healthChecker.stopHealthChecks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default interval', () => {
      const hc = new HealthChecker();
      expect(hc).toBeDefined();
      hc.stopHealthChecks();
    });

    it('should initialize with custom interval', () => {
      const hc = new HealthChecker(10000);
      expect(hc).toBeDefined();
      hc.stopHealthChecks();
    });
  });

  describe('checkServiceHealth', () => {
    it('should mark service as healthy when request succeeds', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'OK' }
      });

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const authHealth = healthChecker.getServiceHealth('auth');
      expect(authHealth?.status).toBe('healthy');
      expect(authHealth?.service).toBe('auth');
      expect(authHealth?.responseTime).toBeDefined();
      expect(authHealth?.lastCheck).toBeDefined();
    });

    it('should mark service as unhealthy when request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const authHealth = healthChecker.getServiceHealth('auth');
      expect(authHealth?.status).toBe('unhealthy');
      expect(authHealth?.error).toBe('Connection refused');
    });

    it('should mark service as unhealthy when status >= 500', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 503,
        data: { error: 'Service Unavailable' }
      });

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const authHealth = healthChecker.getServiceHealth('auth');
      expect(authHealth?.status).toBe('unhealthy');
      expect(authHealth?.error).toBe('HTTP 503');
    });
  });

  describe('getAllHealthStatuses', () => {
    it('should return array of all health statuses', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'OK' }
      });

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const statuses = healthChecker.getAllHealthStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe('getOverallHealth', () => {
    it('should return healthy when all services are healthy', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'OK' }
      });

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const overall = healthChecker.getOverallHealth();
      expect(overall.status).toBe('healthy');
      expect(overall.summary.total).toBe(2);
      expect(overall.summary.healthy).toBe(2);
      expect(overall.summary.unhealthy).toBe(0);
    });

    it('should return degraded when some services are unhealthy', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { status: 'OK' } })
        .mockRejectedValueOnce(new Error('Connection failed'));

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const overall = healthChecker.getOverallHealth();
      expect(overall.status).toBe('degraded');
      expect(overall.summary.total).toBe(2);
      expect(overall.summary.healthy).toBe(1);
      expect(overall.summary.unhealthy).toBe(1);
    });

    it('should return unhealthy when all services are unhealthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('All services down'));

      // Trigger initial health check
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setImmediate(resolve));

      const overall = healthChecker.getOverallHealth();
      expect(overall.status).toBe('unhealthy');
      expect(overall.summary.total).toBe(2);
      expect(overall.summary.healthy).toBe(0);
      expect(overall.summary.unhealthy).toBe(2);
    });
  });

  describe('getServiceHealth', () => {
    it('should return null for non-existent service', () => {
      const health = healthChecker.getServiceHealth('nonexistent');
      expect(health).toBeNull();
    });
  });

  describe('stopHealthChecks', () => {
    it('should stop the health check interval', () => {
      expect(healthChecker.stopHealthChecks).not.toThrow();
    });
  });
});

import { serviceRegistry, getServiceConfig, getAllServices, isServiceRegistered } from '../serviceRegistry';

describe('Service Registry', () => {
  describe('serviceRegistry', () => {
    it('should contain auth service configuration', () => {
      expect(serviceRegistry.auth).toBeDefined();
      expect(serviceRegistry.auth.name).toBe('auth');
      expect(serviceRegistry.auth.baseUrl).toBe(process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
      expect(serviceRegistry.auth.timeout).toBe(30000);
      expect(serviceRegistry.auth.retries).toBe(3);
      expect(serviceRegistry.auth.healthCheck).toBe('/health');
    });

    it('should contain transcriber service configuration', () => {
      expect(serviceRegistry.transcriber).toBeDefined();
      expect(serviceRegistry.transcriber.name).toBe('transcriber');
      expect(serviceRegistry.transcriber.baseUrl).toBe(process.env.TRANSCRIBER_SERVICE_URL || 'http://localhost:3002');
      expect(serviceRegistry.transcriber.timeout).toBe(60000);
      expect(serviceRegistry.transcriber.retries).toBe(2);
      expect(serviceRegistry.transcriber.healthCheck).toBe('/health');
    });

    it('should not contain compliance service', () => {
      expect(serviceRegistry.compliance).toBeUndefined();
    });
  });

  describe('getServiceConfig', () => {
    it('should return auth service config when requested', () => {
      const config = getServiceConfig('auth');
      expect(config).toBeDefined();
      expect(config?.name).toBe('auth');
      expect(config?.baseUrl).toBe(process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
    });

    it('should return transcriber service config when requested', () => {
      const config = getServiceConfig('transcriber');
      expect(config).toBeDefined();
      expect(config?.name).toBe('transcriber');
      expect(config?.baseUrl).toBe(process.env.TRANSCRIBER_SERVICE_URL || 'http://localhost:3002');
    });

    it('should return null for non-existent service', () => {
      const config = getServiceConfig('nonexistent');
      expect(config).toBeNull();
    });

    it('should return null for compliance service', () => {
      const config = getServiceConfig('compliance');
      expect(config).toBeNull();
    });
  });

  describe('getAllServices', () => {
    it('should return array of all service configurations', () => {
      const services = getAllServices();
      expect(Array.isArray(services)).toBe(true);
      expect(services).toHaveLength(2);
      
      const serviceNames = services.map(s => s.name);
      expect(serviceNames).toContain('auth');
      expect(serviceNames).toContain('transcriber');
      expect(serviceNames).not.toContain('compliance');
    });

    it('should return services with all required properties', () => {
      const services = getAllServices();
      services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('baseUrl');
        expect(service).toHaveProperty('timeout');
        expect(service).toHaveProperty('retries');
        expect(service).toHaveProperty('healthCheck');
      });
    });
  });

  describe('isServiceRegistered', () => {
    it('should return true for registered services', () => {
      expect(isServiceRegistered('auth')).toBe(true);
      expect(isServiceRegistered('transcriber')).toBe(true);
    });

    it('should return false for unregistered services', () => {
      expect(isServiceRegistered('compliance')).toBe(false);
      expect(isServiceRegistered('nonexistent')).toBe(false);
      expect(isServiceRegistered('')).toBe(false);
    });
  });
});

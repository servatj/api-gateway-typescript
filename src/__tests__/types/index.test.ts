import { 
  ServiceConfig, 
  ProxyOptions, 
  RouteConfig, 
  AuthContext, 
  ApiResponse 
} from '../index';

describe('TypeScript Types', () => {
  describe('ServiceConfig', () => {
    it('should accept valid service configuration', () => {
      const config: ServiceConfig = {
        name: 'test-service',
        baseUrl: 'http://localhost:3001',
        timeout: 30000,
        retries: 3,
        healthCheck: '/health'
      };

      expect(config.name).toBe('test-service');
      expect(config.baseUrl).toBe('http://localhost:3001');
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
      expect(config.healthCheck).toBe('/health');
    });

    it('should accept minimal service configuration', () => {
      const config: ServiceConfig = {
        name: 'minimal-service',
        baseUrl: 'http://localhost:3002'
      };

      expect(config.name).toBe('minimal-service');
      expect(config.baseUrl).toBe('http://localhost:3002');
      expect(config.timeout).toBeUndefined();
      expect(config.retries).toBeUndefined();
      expect(config.healthCheck).toBeUndefined();
    });
  });

  describe('ProxyOptions', () => {
    it('should accept valid proxy options', () => {
      const options: ProxyOptions = {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 30000,
        retries: 3,
        onError: jest.fn(),
        onProxyReq: jest.fn(),
        onProxyRes: jest.fn()
      };

      expect(options.target).toBe('http://localhost:3001');
      expect(options.changeOrigin).toBe(true);
      expect(options.timeout).toBe(30000);
      expect(options.retries).toBe(3);
      expect(typeof options.onError).toBe('function');
      expect(typeof options.onProxyReq).toBe('function');
      expect(typeof options.onProxyRes).toBe('function');
    });

    it('should accept minimal proxy options', () => {
      const options: ProxyOptions = {
        target: 'http://localhost:3001',
        changeOrigin: true
      };

      expect(options.target).toBe('http://localhost:3001');
      expect(options.changeOrigin).toBe(true);
      expect(options.timeout).toBeUndefined();
    });
  });

  describe('RouteConfig', () => {
    it('should accept complete route configuration', () => {
      const route: RouteConfig = {
        path: '/api/users',
        service: 'user-service',
        methods: ['GET', 'POST'],
        auth: true,
        rateLimit: {
          windowMs: 900000,
          max: 100
        }
      };

      expect(route.path).toBe('/api/users');
      expect(route.service).toBe('user-service');
      expect(route.methods).toEqual(['GET', 'POST']);
      expect(route.auth).toBe(true);
      expect(route.rateLimit?.windowMs).toBe(900000);
      expect(route.rateLimit?.max).toBe(100);
    });

    it('should accept minimal route configuration', () => {
      const route: RouteConfig = {
        path: '/api/simple',
        service: 'simple-service'
      };

      expect(route.path).toBe('/api/simple');
      expect(route.service).toBe('simple-service');
      expect(route.methods).toBeUndefined();
      expect(route.auth).toBeUndefined();
      expect(route.rateLimit).toBeUndefined();
    });
  });

  describe('AuthContext', () => {
    it('should accept complete auth context', () => {
      const auth: AuthContext = {
        userId: 'user123',
        roles: ['admin', 'user'],
        permissions: ['read', 'write'],
        token: 'jwt-token-here'
      };

      expect(auth.userId).toBe('user123');
      expect(auth.roles).toEqual(['admin', 'user']);
      expect(auth.permissions).toEqual(['read', 'write']);
      expect(auth.token).toBe('jwt-token-here');
    });

    it('should accept minimal auth context', () => {
      const auth: AuthContext = {
        token: 'jwt-token-only'
      };

      expect(auth.token).toBe('jwt-token-only');
      expect(auth.userId).toBeUndefined();
      expect(auth.roles).toBeUndefined();
      expect(auth.permissions).toBeUndefined();
    });

    it('should accept empty auth context', () => {
      const auth: AuthContext = {};

      expect(auth.userId).toBeUndefined();
      expect(auth.roles).toBeUndefined();
      expect(auth.permissions).toBeUndefined();
      expect(auth.token).toBeUndefined();
    });
  });

  describe('ApiResponse', () => {
    it('should accept successful response with data', () => {
      const response: ApiResponse<{ id: number; name: string }> = {
        success: true,
        data: { id: 1, name: 'Test User' },
        timestamp: '2025-05-31T00:00:00.000Z'
      };

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe(1);
      expect(response.data?.name).toBe('Test User');
      expect(response.timestamp).toBe('2025-05-31T00:00:00.000Z');
      expect(response.error).toBeUndefined();
    });

    it('should accept error response', () => {
      const response: ApiResponse = {
        success: false,
        error: 'Something went wrong',
        timestamp: '2025-05-31T00:00:00.000Z'
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.timestamp).toBe('2025-05-31T00:00:00.000Z');
      expect(response.data).toBeUndefined();
    });

    it('should accept response with string data', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'Simple string response',
        timestamp: '2025-05-31T00:00:00.000Z'
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('Simple string response');
      expect(typeof response.data).toBe('string');
    });

    it('should accept response with array data', () => {
      const response: ApiResponse<number[]> = {
        success: true,
        data: [1, 2, 3, 4, 5],
        timestamp: '2025-05-31T00:00:00.000Z'
      };

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toEqual([1, 2, 3, 4, 5]);
    });

    it('should accept response without data field', () => {
      const response: ApiResponse = {
        success: true,
        timestamp: '2025-05-31T00:00:00.000Z'
      };

      expect(response.success).toBe(true);
      expect(response.timestamp).toBe('2025-05-31T00:00:00.000Z');
      expect(response.data).toBeUndefined();
      expect(response.error).toBeUndefined();
    });
  });

  describe('Type compatibility', () => {
    it('should allow ServiceConfig to be used in arrays', () => {
      const services: ServiceConfig[] = [
        { name: 'auth', baseUrl: 'http://localhost:3001' },
        { name: 'transcriber', baseUrl: 'http://localhost:3002' }
      ];

      expect(services).toHaveLength(2);
      expect(services[0].name).toBe('auth');
      expect(services[1].name).toBe('transcriber');
    });

    it('should allow AuthContext to be used in Request extension', () => {
      interface ExtendedRequest {
        auth?: AuthContext;
        body: any;
      }

      const req: ExtendedRequest = {
        auth: { token: 'test-token', userId: 'user123' },
        body: { test: 'data' }
      };

      expect(req.auth?.token).toBe('test-token');
      expect(req.auth?.userId).toBe('user123');
      expect(req.body.test).toBe('data');
    });
  });
});

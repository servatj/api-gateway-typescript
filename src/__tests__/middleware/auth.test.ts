import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuth } from '../auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/test',
      method: 'GET'
    };
    mockResponse = {};
    mockNext = jest.fn();
    
    // Suppress console logs during tests
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('authMiddleware', () => {
    it('should pass with valid Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token-123'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: 'valid-token-123' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with valid token without Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'valid-token-123'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: 'valid-token-123' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail with missing authorization header', () => {
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authorization header missing',
          statusCode: 401,
          isOperational: true
        })
      );
      expect(mockRequest.auth).toBeUndefined();
    });

    it('should fail with empty authorization header', () => {
      mockRequest.headers = {
        authorization: ''
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token missing',
          statusCode: 401,
          isOperational: true
        })
      );
      expect(mockRequest.auth).toBeUndefined();
    });

    it('should fail with Bearer prefix but no token', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token missing',
          statusCode: 401,
          isOperational: true
        })
      );
      expect(mockRequest.auth).toBeUndefined();
    });

    it('should handle authorization header with only spaces', () => {
      mockRequest.headers = {
        authorization: '   '
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: '   ' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract token correctly from Bearer format', () => {
      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ 
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' 
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle case-sensitive Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'bearer token-123'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: 'bearer token-123' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle multiple spaces after Bearer', () => {
      mockRequest.headers = {
        authorization: 'Bearer    token-with-spaces'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: '   token-with-spaces' });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('optionalAuth', () => {
    it('should pass with valid Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token-123'
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: 'valid-token-123' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with valid token without Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'valid-token-123'
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: 'valid-token-123' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass without authorization header', () => {
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with empty authorization header', () => {
      mockRequest.headers = {
        authorization: ''
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass with Bearer prefix but no token', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle undefined authorization header gracefully', () => {
      mockRequest.headers = {};

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not call next with error even if token parsing fails', () => {
      // Simulate an error scenario
      Object.defineProperty(mockRequest, 'headers', {
        get: () => { throw new Error('Headers error'); }
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.auth).toBeUndefined();
    });

    it('should extract JWT token correctly', () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      mockRequest.headers = {
        authorization: `Bearer ${jwtToken}`
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth).toEqual({ token: jwtToken });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Type Extensions', () => {
    it('should properly extend Request interface with auth property', () => {
      mockRequest.headers = {
        authorization: 'Bearer test-token'
      };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // TypeScript should recognize auth property
      expect(mockRequest.auth?.token).toBe('test-token');
    });
  });
});

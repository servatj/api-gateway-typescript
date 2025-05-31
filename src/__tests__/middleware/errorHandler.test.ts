import { Request, Response, NextFunction } from 'express';
import { errorHandler, createError, asyncHandler, ApiError } from '../errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn((header: string) => header === 'User-Agent' ? 'Jest Test Agent' : undefined)
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Suppress console.error during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    it('should handle operational errors with custom status code', () => {
      const error: ApiError = new Error('Test error');
      error.statusCode = 400;
      error.isOperational = true;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle non-operational errors with 500 status', () => {
      const error = new Error('Internal error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal error',
          timestamp: expect.any(String)
        })
      );
    });

    it('should hide internal errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal error');
      // Non-operational error

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
          timestamp: expect.any(String)
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should show stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
          timestamp: expect.any(String),
          stack: expect.any(String)
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should use default 500 status code when none provided', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should include request information in response', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      );
    });
  });

  describe('createError', () => {
    it('should create an operational error with custom status code', () => {
      const error = createError('Custom error', 422);

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(422);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create an error with default 500 status code', () => {
      const error = createError('Default error');

      expect(error.message).toBe('Default error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create an Error instance', () => {
      const error = createError('Test');
      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('Error');
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle sync functions that return promises', async () => {
      const syncFn = jest.fn(() => Promise.resolve('sync success'));
      const wrappedFn = asyncHandler(syncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(syncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle sync functions that throw', async () => {
      const error = new Error('Sync error');
      const syncFn = jest.fn(() => { throw error; });
      const wrappedFn = asyncHandler(syncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(syncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

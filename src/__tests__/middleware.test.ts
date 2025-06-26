/// <reference types="jest" />

import { build } from '../index';
import { 
  correlationIdMiddleware, 
  logThirdPartyApiCall, 
  responseLoggingHook 
} from '../middleware';

describe('Middleware', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('correlationIdMiddleware', () => {
    it('should generate correlation ID when not provided', async () => {
      // Arrange
      const request = {
        headers: {},
        id: 'test-request-id',
        log: {
          child: jest.fn().mockReturnValue({
            info: jest.fn()
          }),
          info: jest.fn()
        }
      } as any;

      const reply = {
        header: jest.fn()
      } as any;

      // Act
      await correlationIdMiddleware(request, reply);

      // Assert
      expect(request.correlationId).toBeDefined();
      expect(request.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(reply.header).toHaveBeenCalledWith('x-correlation-id', request.correlationId);
    });

    it('should use provided correlation ID', async () => {
      // Arrange
      const providedCorrelationId = 'provided-correlation-id-12345';
      const request = {
        headers: {
          'x-correlation-id': providedCorrelationId
        },
        id: 'test-request-id',
        log: {
          child: jest.fn().mockReturnValue({
            info: jest.fn()
          }),
          info: jest.fn()
        }
      } as any;

      const reply = {
        header: jest.fn()
      } as any;

      // Act
      await correlationIdMiddleware(request, reply);

      // Assert
      expect(request.correlationId).toBe(providedCorrelationId);
      expect(reply.header).toHaveBeenCalledWith('x-correlation-id', providedCorrelationId);
    });

    it('should handle case-insensitive correlation ID header', async () => {
      // Arrange
      const providedCorrelationId = 'provided-correlation-id-12345';
      const request = {
        headers: {
          'X-Correlation-ID': providedCorrelationId
        },
        id: 'test-request-id',
        log: {
          child: jest.fn().mockReturnValue({
            info: jest.fn()
          }),
          info: jest.fn()
        }
      } as any;

      const reply = {
        header: jest.fn()
      } as any;

      // Act
      await correlationIdMiddleware(request, reply);

      // Assert
      expect(request.correlationId).toBe(providedCorrelationId);
      expect(reply.header).toHaveBeenCalledWith('x-correlation-id', providedCorrelationId);
    });
  });

  describe('logThirdPartyApiCall', () => {
    it('should log API call with correlation ID', () => {
      // Arrange
      const correlationId = 'test-correlation-id';
      const service = 'Smarty API';
      const method = 'GET';
      const url = 'https://api.smarty.com/street-address';
      const requestData = { street: '123 Main St' };
      const responseData = { addresses: [] };
      const duration = 150;

      // Mock console.info to capture output
      const originalInfo = console.info;
      const infoSpy = jest.fn();
      console.info = infoSpy;

      try {
        // Act
        logThirdPartyApiCall(correlationId, service, method, url, requestData, responseData, undefined, duration);

        // Assert
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('API Call Success:'),
          expect.any(String)
        );
      } finally {
        // Restore console.info
        console.info = originalInfo;
      }
    });

    it('should handle missing correlation ID', () => {
      // Arrange
      const service = 'Smarty API';
      const method = 'GET';
      const url = 'https://api.smarty.com/street-address';
      const requestData = { street: '123 Main St' };
      const responseData = { addresses: [] };
      const duration = 150;

      // Mock console.info to capture output
      const originalInfo = console.info;
      const infoSpy = jest.fn();
      console.info = infoSpy;

      try {
        // Act
        logThirdPartyApiCall('unknown', service, method, url, requestData, responseData, undefined, duration);

        // Assert
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('API Call Success:'),
          expect.any(String)
        );
      } finally {
        // Restore console.info
        console.info = originalInfo;
      }
    });
  });

  describe('responseLoggingHook', () => {
    it('should log response with correlation ID', async () => {
      // Arrange
      const request = {
        correlationId: 'test-correlation-id',
        method: 'POST',
        url: '/api/v1/addresses/validate',
        id: 'test-request-id',
        headers: {
          'user-agent': 'test-agent'
        },
        log: {
          info: jest.fn()
        }
      } as any;

      const reply = {
        statusCode: 200,
        getResponseTime: jest.fn().mockReturnValue(150),
        getHeader: jest.fn().mockReturnValue('application/json'),
        elapsedTime: 150
      } as any;

      const done = jest.fn();

      // Act
      responseLoggingHook(request, reply, done);

      // Assert
      expect(request.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          method: 'POST',
          url: '/api/v1/addresses/validate',
          statusCode: 200,
          responseTime: 150,
          timestamp: expect.any(String),
          userAgent: 'test-agent'
        })
      );
      expect(done).toHaveBeenCalled();
    });

    it('should handle missing correlation ID in response logging', async () => {
      // Arrange
      const request = {
        method: 'GET',
        url: '/health',
        id: 'test-request-id',
        headers: {
          'user-agent': 'test-agent'
        },
        log: {
          info: jest.fn()
        }
      } as any;

      const reply = {
        statusCode: 200,
        getResponseTime: jest.fn().mockReturnValue(100),
        getHeader: jest.fn().mockReturnValue('application/json'),
        elapsedTime: 100
      } as any;

      const done = jest.fn();

      // Act
      responseLoggingHook(request, reply, done);

      // Assert
      expect(request.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: undefined,
          method: 'GET',
          url: '/health',
          statusCode: 200,
          responseTime: 100,
          timestamp: expect.any(String),
          userAgent: 'test-agent'
        })
      );
      expect(done).toHaveBeenCalled();
    });
  });

  describe('Integration tests', () => {
    it('should include correlation ID in response headers for all routes', async () => {
      // Test health endpoint
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-correlation-id': 'test-correlation-id'
        }
      });

      expect(healthResponse.headers['x-correlation-id']).toBe('test-correlation-id');

      // Test address validation endpoint
      const addressResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/addresses/validate',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'test-correlation-id'
        },
        payload: {
          correlationId: 'test-correlation-id',
          street: '1600 Amphitheatre Parkway',
          city: 'Mountain View',
          state: 'CA'
        }
      });

      expect(addressResponse.headers['x-correlation-id']).toBe('test-correlation-id');
    });

    it('should generate correlation ID when not provided in headers', async () => {
      // Test health endpoint without correlation ID
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(healthResponse.headers['x-correlation-id']).toBeDefined();
      expect(healthResponse.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Test address validation endpoint without correlation ID in headers but with it in body
      const addressResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/addresses/validate',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          correlationId: 'body-correlation-id',
          street: '1600 Amphitheatre Parkway',
          city: 'Mountain View',
          state: 'CA'
        }
      });

      // Should still get a correlation ID in headers (generated by middleware)
      expect(addressResponse.headers['x-correlation-id']).toBeDefined();
      expect(addressResponse.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
}); 
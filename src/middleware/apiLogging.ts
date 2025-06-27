import { FastifyReply } from 'fastify';
import { CorrelationIdRequest } from './correlationId';

export interface ApiCallLog {
  correlationId: string;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration: number;
  error?: string;
  service: string;
}

export interface ApiLoggingContext {
  startTime: number;
  correlationId: string;
  service: string;
}

/**
 * Creates a logging context for API calls
 */
export function createApiLoggingContext(
  request: CorrelationIdRequest,
  service: string
): ApiLoggingContext {
  return {
    startTime: Date.now(),
    correlationId: request.correlationId,
    service
  };
}

/**
 * Logs an API call with correlation ID and performance metrics
 */
export function logApiCall(
  context: ApiLoggingContext,
  method: string,
  url: string,
  requestHeaders?: Record<string, string>,
  requestBody?: any,
  responseStatus?: number,
  responseHeaders?: Record<string, string>,
  responseBody?: any,
  error?: string
): void {
  const duration = Date.now() - context.startTime;
  
  const logData: ApiCallLog = {
    correlationId: context.correlationId,
    timestamp: new Date().toISOString(),
    method,
    url,
    duration,
    service: context.service,
    ...(requestHeaders && { requestHeaders }),
    ...(requestBody && { requestBody }),
    ...(responseStatus && { responseStatus }),
    ...(responseHeaders && { responseHeaders }),
    ...(responseBody && { responseBody }),
    ...(error && { error })
  };

  // Log based on success/failure
  if (error || (responseStatus && responseStatus >= 400)) {
    console.error('API Call Error:', JSON.stringify(logData, null, 2));
  } else {
    console.info('API Call Success:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Middleware to log outgoing HTTP requests to 3rd party APIs
 */
export function createApiLoggingMiddleware(service: string) {
  return function apiLoggingMiddleware(
    request: CorrelationIdRequest,
    _reply: FastifyReply
  ): void {
    const context = createApiLoggingContext(request, service);
    
    // Store context in request for later use
    (request as any).apiLoggingContext = context;
    
    // Log the outgoing request
    logApiCall(
      context,
      request.method,
      request.url,
      request.headers as Record<string, string>,
      request.body
    );
  };
}

/**
 * Utility function to log 3rd party API calls from services
 */
export function logThirdPartyApiCall(
  correlationId: string,
  service: string,
  method: string,
  url: string,
  requestData?: any,
  responseData?: any,
  error?: string,
  duration?: number
): void {
  const context: ApiLoggingContext = {
    startTime: Date.now() - (duration || 0),
    correlationId,
    service
  };

  logApiCall(
    context,
    method,
    url,
    undefined,
    requestData,
    responseData?.status,
    undefined,
    responseData?.body,
    error
  );
} 
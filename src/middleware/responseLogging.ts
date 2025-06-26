import { FastifyRequest, FastifyReply } from 'fastify';
import { CorrelationIdRequest } from './correlationId';

export interface ResponseLog {
  correlationId: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  error?: string;
}

/**
 * Hook to log response details with correlation ID
 * This should be registered as a global onResponse hook in the Fastify instance
 */
export function responseLoggingHook(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const responseTime = (reply as any).elapsedTime ?? 0;
  const correlationId = (request as CorrelationIdRequest).correlationId;
  
  const logData: ResponseLog = {
    correlationId,
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime,
    ...(request.headers['user-agent'] && { userAgent: request.headers['user-agent'] }),
    ...(request.ip && { ip: request.ip })
  };

  // Add error information if status code indicates an error
  if (reply.statusCode >= 400) {
    logData.error = `HTTP ${reply.statusCode}`;
  }

  // Log based on status code
  if (reply.statusCode >= 500) {
    request.log.error(logData);
  } else if (reply.statusCode >= 400) {
    request.log.warn(logData);
  } else {
    request.log.info(logData);
  }

  done();
} 
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export interface CorrelationIdRequest extends FastifyRequest {
  correlationId: string;
}

export interface CorrelationIdReply extends FastifyReply {
  // Add any reply-specific properties if needed
}

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const CORRELATION_ID_PROPERTY = 'correlationId';

/**
 * Helper function to safely extract correlation ID from headers
 */
function getCorrelationIdFromHeaders(headers: any): string | undefined {
  const value = headers['x-correlation-id'] || headers['X-Correlation-ID'];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Middleware to handle correlation IDs for request tracking
 * This should be registered as a global preHandler hook in the Fastify instance
 */
export async function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get correlation ID from headers or generate a new one
  const headerValue = getCorrelationIdFromHeaders(request.headers);
  let correlationId: string;
  
  if (headerValue) {
    correlationId = headerValue;
  } else {
    correlationId = uuidv4();
  }
  
  // Attach correlation ID to request and reply objects
  (request as CorrelationIdRequest).correlationId = correlationId;
  reply.header('x-correlation-id', correlationId);
  
  // Add correlation ID to request logging context
  request.log = request.log.child({ correlationId });
  
  // Log incoming request with correlation ID
  request.log.info({
    correlationId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip
  });
} 
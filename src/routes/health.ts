import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'address-service',
      version: '1.0.0',
    };
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    // Add any readiness checks here (database connection, etc.)
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'address-service',
    };
  });

  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    // Add any liveness checks here
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'address-service',
    };
  });
} 
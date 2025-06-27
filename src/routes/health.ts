import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import packageJson from '../../package.json';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'address-service',
      version: packageJson.version,
    };
  });

  fastify.get('/ready', async (_request: FastifyRequest, _reply: FastifyReply) => {
    // Add any readiness checks here (database connection, etc.)
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'address-service',
    };
  });

  fastify.get('/live', async (_request: FastifyRequest, _reply: FastifyReply) => {
    // Add any liveness checks here
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'address-service',
    };
  });
} 
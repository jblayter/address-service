import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import pino from 'pino';

import { addressRoutes } from './routes/address';
import { healthRoutes } from './routes/health';
import { 
  correlationIdMiddleware, 
  responseLoggingHook 
} from './middleware';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

export async function build() {
  // Create logger configuration
  const loggerConfig: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
  };

  // Add transport only in development
  if (process.env.NODE_ENV === 'development') {
    loggerConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    };
  }

  const logger = pino(loggerConfig);

  const fastify = Fastify({
    logger,
  });

  // Register global middleware hooks
  fastify.addHook('preHandler', correlationIdMiddleware);
  fastify.addHook('onResponse', responseLoggingHook);

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Address Service API',
        description: 'API for managing addresses',
        version: '1.0.0',
      },
      host: `${HOST}:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(addressRoutes, { prefix: '/api/v1/addresses' });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  });

  return fastify;
}

async function startServer() {
  const fastify = await build();

  try {
    await fastify.listen({ port: Number(PORT), host: HOST });
    fastify.log.info(`Server is running on http://${HOST}:${PORT}`);
    fastify.log.info(`API documentation available at http://${HOST}:${PORT}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  startServer();
} 
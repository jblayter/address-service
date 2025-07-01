import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressService } from '../services/addressService';
import { AddressValidationRequest } from '../interfaces/addressProvider';

// Request/Response schemas for validation
const addressValidationSchema = {
  type: 'object',
  properties: {
    correlationId: { type: 'string', minLength: 1 },
    street: { type: 'string', maxLength: 100 },
    street2: { type: 'string', maxLength: 100 },
    city: { type: 'string', maxLength: 64 },
    state: { type: 'string', maxLength: 32 },
    zipcode: { type: 'string', maxLength: 10 },
    addressee: { type: 'string', maxLength: 64 },
    candidates: { type: 'number', minimum: 1, maximum: 10 },
    match: { type: 'string', enum: ['strict', 'range', 'invalid'] },
    format: { type: 'string' }
  },
  required: ['correlationId'],
  additionalProperties: false
};

const addressValidationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    correlationId: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        validated: { type: 'boolean' },
        deliverable: { type: 'boolean' },
        primaryAddress: {
          type: 'object',
          properties: {
            deliveryLine1: { type: 'string' },
            deliveryLine2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipcode: { type: 'string' },
            plus4Code: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            metadata: { type: 'object' }
          }
        },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliveryLine1: { type: 'string' },
              deliveryLine2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipcode: { type: 'string' },
              plus4Code: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        },
        validationNotes: {
          type: 'array',
          items: { type: 'string' }
        },
        providerData: { type: 'object' }
      },
      required: ['validated', 'deliverable', 'validationNotes']
    },
    error: { type: 'string' }
  },
  required: ['success', 'correlationId']
};

export async function addressRoutes(fastify: FastifyInstance) {
  // POST /api/v1/addresses/validate - Validate an address
  fastify.post('/validate', {
    schema: {
      body: addressValidationSchema,
      response: {
        200: addressValidationResponseSchema,
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            correlationId: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                validated: { type: 'boolean' },
                deliverable: { type: 'boolean' },
                validationNotes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            correlationId: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: AddressValidationRequest }>, reply: FastifyReply) => {
    try {
      const correlationId = request.body.correlationId;
      
      // Log the incoming validation request
      request.log.info({
        msg: 'Address validation request',
        correlationId,
        requestBody: request.body
      });

      // Validate the address using the abstracted service
      const result = await AddressService.validateAddress(request.body, correlationId);

      // Log the validation result
      request.log.info({
        msg: 'Address validation completed',
        correlationId,
        validated: result.data?.validated,
        deliverable: result.data?.deliverable,
        hasSuggestions: result.data?.suggestions && result.data.suggestions.length > 0,
        provider: result.data?.providerData ? 'provider-data-available' : 'no-provider-data'
      });

      // Return appropriate status code based on result
      if (result.success) {
        return reply.status(200).send(result);
      } else {
        return reply.status(400).send(result);
      }

    } catch (error) {
      const correlationId = request.body?.correlationId || 'unknown';
      
      request.log.error({
        msg: 'Address validation error',
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        error: 'Internal server error during address validation',
        correlationId
      });
    }
  });

  // GET /api/v1/addresses/validate - Validate an address using query parameters
  fastify.get('/validate', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          correlationId: { type: 'string', minLength: 1 },
          street: { type: 'string', maxLength: 100 },
          street2: { type: 'string', maxLength: 100 },
          city: { type: 'string', maxLength: 64 },
          state: { type: 'string', maxLength: 32 },
          zipcode: { type: 'string', maxLength: 10 },
          addressee: { type: 'string', maxLength: 64 },
          candidates: { type: 'number', minimum: 1, maximum: 10 },
          match: { type: 'string', enum: ['strict', 'range', 'invalid'] },
          format: { type: 'string' }
        },
        required: ['correlationId'],
        additionalProperties: false
      },
      response: {
        200: addressValidationResponseSchema,
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            correlationId: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                validated: { type: 'boolean' },
                deliverable: { type: 'boolean' },
                validationNotes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            correlationId: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: AddressValidationRequest }>, reply: FastifyReply) => {
    try {
      const correlationId = request.query.correlationId;
      
      // Log the incoming validation request
      request.log.info({
        msg: 'Address validation request (GET)',
        correlationId,
        queryParams: request.query
      });

      // Validate the address using the abstracted service
      const result = await AddressService.validateAddress(request.query, correlationId);

      // Log the validation result
      request.log.info({
        msg: 'Address validation completed (GET)',
        correlationId,
        validated: result.data?.validated,
        deliverable: result.data?.deliverable,
        hasSuggestions: result.data?.suggestions && result.data.suggestions.length > 0,
        provider: result.data?.providerData ? 'provider-data-available' : 'no-provider-data'
      });

      // Return appropriate status code based on result
      if (result.success) {
        return reply.status(200).send(result);
      } else {
        return reply.status(400).send(result);
      }

    } catch (error) {
      const correlationId = request.query?.correlationId || 'unknown';
      
      request.log.error({
        msg: 'Address validation error (GET)',
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        error: 'Internal server error during address validation',
        correlationId
      });
    }
  });
} 
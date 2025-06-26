# Middleware Layer

This directory contains the middleware components for the Address Service API, providing correlation ID tracking and comprehensive logging for request/response cycles and 3rd party API calls.

## Components

### 1. Correlation ID Middleware (`correlationId.ts`)

**Purpose**: Generates and tracks correlation IDs for request/response tracking across the entire request lifecycle.

**Features**:
- Automatically generates correlation IDs if not provided in request headers
- Accepts correlation IDs via `x-correlation-id` header
- Attaches correlation ID to both request and response objects
- Includes correlation ID in response headers
- Enhances logging context with correlation ID

**Usage**:
```typescript
import { correlationIdMiddleware, CorrelationIdRequest } from './middleware';

// In your route handler
async function handler(request: FastifyRequest, reply: FastifyReply) {
  const correlationId = (request as CorrelationIdRequest).correlationId;
  // Use correlationId for logging and service calls
}
```

### 2. API Logging Middleware (`apiLogging.ts`)

**Purpose**: Tracks and logs 3rd party API calls with correlation IDs and performance metrics.

**Features**:
- Logs request/response details for external API calls
- Includes correlation ID in all API call logs
- Tracks performance metrics (duration, status codes)
- Provides structured logging for debugging and monitoring
- Supports both success and error scenarios

**Usage**:
```typescript
import { logThirdPartyApiCall } from './middleware';

// In your service methods
try {
  const startTime = Date.now();
  const response = await externalApiCall();
  const duration = Date.now() - startTime;
  
  logThirdPartyApiCall(
    correlationId,
    'external-service-name',
    'GET',
    '/api/endpoint',
    requestData,
    response,
    undefined,
    duration
  );
} catch (error) {
  const duration = Date.now() - startTime;
  logThirdPartyApiCall(
    correlationId,
    'external-service-name',
    'GET',
    '/api/endpoint',
    requestData,
    undefined,
    error.message,
    duration
  );
}
```

### 3. Response Logging Middleware (`responseLogging.ts`)

**Purpose**: Logs response details including status codes, response times, and correlation IDs.

**Features**:
- Automatically logs all responses with correlation IDs
- Tracks response times and status codes
- Provides structured logging for monitoring and debugging
- Different log levels based on response status (error, warn, info)

## Integration

### Global Middleware Registration

The middleware is automatically registered in the main application (`src/index.ts`):

```typescript
// Register global middleware hooks
fastify.addHook('preHandler', correlationIdMiddleware);
fastify.addHook('onResponse', responseLoggingHook);
```

### Service Layer Integration

All service methods have been updated to accept correlation IDs:

```typescript
// Before
const address = await AddressService.createAddress(addressData);

// After
const address = await AddressService.createAddress(addressData, correlationId);
```

### Route Handler Integration

Route handlers automatically have access to correlation IDs:

```typescript
async function handler(request: FastifyRequest, reply: FastifyReply) {
  const correlationId = (request as CorrelationIdRequest).correlationId;
  const result = await AddressService.someMethod(data, correlationId);
}
```

## Log Output Examples

### Request Log
```json
{
  "level": "info",
  "msg": "Incoming request",
  "method": "POST",
  "url": "/api/v1/addresses",
  "userAgent": "curl/7.68.0",
  "ip": "127.0.0.1",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response Log
```json
{
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "method": "POST",
  "url": "/api/v1/addresses",
  "statusCode": 201,
  "responseTime": 156,
  "userAgent": "curl/7.68.0",
  "ip": "127.0.0.1"
}
```

### 3rd Party API Call Log
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:45.100Z",
  "method": "POST",
  "url": "/api/validate",
  "requestBody": { "street": "123 Main St", "city": "Anytown" },
  "responseStatus": 200,
  "responseBody": { "valid": true },
  "duration": 45,
  "service": "address-validation-service"
}
```

## Benefits

1. **Request Tracing**: Track requests across multiple services using correlation IDs
2. **Debugging**: Easily correlate logs from different parts of the system
3. **Performance Monitoring**: Track response times and identify bottlenecks
4. **Error Tracking**: Correlate errors with specific requests and external API calls
5. **Observability**: Comprehensive logging for monitoring and alerting

## Configuration

The middleware can be configured through environment variables:

- `LOG_LEVEL`: Set the logging level (default: 'info')
- `NODE_ENV`: Enable pretty logging in development mode

## Testing

To test the middleware functionality:

1. Start the server: `npm run dev`
2. Make requests with or without `x-correlation-id` header
3. Check the logs to see correlation ID tracking in action
4. Monitor 3rd party API call logs when external services are called 
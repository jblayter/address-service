# Address Service API

A modern, TypeScript-based REST API for managing addresses, built with Fastify and Docker.

## Features

- 🚀 **Fast & Lightweight**: Built with Fastify for high performance
- 🔒 **Type Safe**: Full TypeScript support with strict type checking
- 📚 **Auto-generated Documentation**: Swagger/OpenAPI documentation
- 🐳 **Docker Ready**: Multi-stage Docker build with production optimization
- 🏥 **Health Checks**: Built-in health, readiness, and liveness endpoints
- 🔍 **Search & Filter**: Advanced filtering and search capabilities
- ✅ **Validation**: Request validation with detailed error messages
- 🛡️ **Security**: CORS, Helmet, and other security headers
- 📊 **Observability**: OpenTelemetry integration with Grafana stack

## Quick Start

### Prerequisites

- Node.js 22+ 
- Docker and Docker Compose
- npm 10+ or yarn

### Development (Docker-based)

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server with Docker:**
   ```bash
   npm run dev
   ```

3. **Access the API:**
   - API: http://localhost:3001
   - Documentation: http://localhost:3001/documentation
   - Health Check: http://localhost:3001/health

4. **Development commands:**
   ```bash
   # View logs
   npm run dev:logs
   
   # Stop development environment
   npm run dev:down
   ```

### Production Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Or build manually:**
   ```bash
   docker build -t address-service .
   docker run -p 3000:3000 address-service
   ```

## Observability & Monitoring

The address service includes comprehensive observability with OpenTelemetry and the Grafana stack.

### Quick Start with Observability

1. **Start the full observability stack:**
   ```bash
   docker-compose --profile dev --profile observability up --build
   ```

2. **Access monitoring tools:**
   - **Grafana**: http://localhost:3002 (admin/admin)
   - **Prometheus**: http://localhost:9090
   - **Loki**: http://localhost:3100
   - **Tempo**: http://localhost:3200

3. **View telemetry data:**
   - **Metrics**: Prometheus queries and Grafana dashboards
   - **Logs**: Loki for log aggregation and search
   - **Traces**: Tempo for distributed tracing

### Grafana Cloud (Alternative)

For production, consider using Grafana Cloud:

1. **Sign up for Grafana Cloud** at https://grafana.com/auth/sign-up/create-user

2. **Update environment variables:**
   ```env
   OTEL_ENDPOINT=https://your-instance.grafana.net:443
   OTEL_API_KEY=your-api-key
   ```

3. **Configure Grafana Cloud endpoints** in your Grafana Cloud dashboard

### What's Monitored

- **HTTP Metrics**: Request rate, response times, error rates
- **Application Logs**: Structured logging with correlation IDs
- **Distributed Traces**: Request flow through the application
- **Custom Metrics**: Business metrics for address operations
- **Health Checks**: Service availability and readiness

### Custom Dashboards

The service includes pre-configured Grafana dashboards:
- Request rate and response times
- Error rates and status codes
- Service logs with filtering
- Distributed traces visualization

## API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Address Management

#### Get All Addresses
```http
GET /api/v1/addresses?type=home&country=US&limit=10&offset=0
```

#### Get Address by ID
```http
GET /api/v1/addresses/{id}
```

#### Create Address
```http
POST /api/v1/addresses
Content-Type: application/json

{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "US",
  "type": "home",
  "isPrimary": true
}
```

#### Update Address
```http
PUT /api/v1/addresses/{id}
Content-Type: application/json

{
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90210",
  "country": "US",
  "type": "work"
}
```

#### Delete Address
```http
DELETE /api/v1/addresses/{id}
```

#### Get Primary Address by Type
```http
GET /api/v1/addresses/type/{type}/primary
```

#### Search Addresses
```http
GET /api/v1/addresses/search?q=New York
```

## Address Types

- `home` - Home address
- `work` - Work address
- `billing` - Billing address
- `shipping` - Shipping address
- `other` - Other address type

## Query Parameters

### Filtering
- `type` - Filter by address type
- `country` - Filter by country
- `state` - Filter by state
- `city` - Filter by city

### Pagination
- `limit` - Number of results (1-100, default: 10)
- `offset` - Number of results to skip (default: 0)

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "success": false,
  "error": "Error description",
  "details": ["Validation error details"]
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with Docker (hot reload)
- `npm run dev:down` - Stop development environment
- `npm run dev:logs` - View development logs
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
SMARTY_AUTHTOKEN=your_smarty_token_here
OTEL_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=address-service
OTEL_SERVICE_VERSION=1.0.0
```

### Development Workflow

The development environment uses Docker with volume mounting for hot reloading:

1. **Code Changes**: Edit files in the `src/` directory
2. **Auto Reload**: Changes are automatically detected and the server restarts
3. **Logs**: View real-time logs with `npm run dev:logs`
4. **Environment**: All environment variables from `.env` are available
5. **Observability**: Telemetry data is automatically collected and sent to Grafana Agent

### Project Structure

```
src/
├── index.ts              # Application entry point
├── telemetry.ts          # OpenTelemetry configuration
├── routes/               # API routes
│   ├── address.ts        # Address endpoints
│   └── health.ts         # Health check endpoints
├── services/             # Business logic
│   └── addressService.ts # Address service
└── types/                # TypeScript type definitions
    └── address.ts        # Address-related types
```

## Docker Configuration

The project includes multiple Docker configurations:

- **Dockerfile**: Production-optimized multi-stage build
- **Dockerfile.dev**: Development-focused build with hot reload support
- **docker-compose.yml**: Orchestration for development, production, and observability

### Development vs Production

- **Development**: Uses `Dockerfile.dev` with volume mounting for hot reload
- **Production**: Uses multi-stage `Dockerfile` for optimized runtime
- **Observability**: Grafana stack for monitoring and alerting

### Observability Stack

- **Grafana Agent**: Collects telemetry data (logs, metrics, traces)
- **Prometheus**: Stores and queries metrics
- **Loki**: Log aggregation and search
- **Tempo**: Distributed tracing
- **Grafana**: Visualization and dashboards

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details. 
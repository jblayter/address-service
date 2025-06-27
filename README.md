# Address Service

A Node.js microservice for address validation using the Smarty US Street Address API.

## Features

- Address validation using Smarty US Street Address API
- Correlation ID tracking for request tracing
- Comprehensive logging and monitoring
- Health check endpoint
- Docker support
- Grafana Cloud integration for observability
- **Automated CI/CD with GitHub Actions**
- **Docker Hub publishing**
- **Digital Ocean App Platform deployment**

## Quick Start

### Prerequisites

- Node.js 22+
- Docker and Docker Compose
- Smarty API credentials
- Grafana Cloud account (for observability)

### Environment Setup

1. Create a `.env` file in the root directory:

```bash
SMARTY_AUTH_ID=your_smarty_auth_id
SMARTY_AUTH_TOKEN=your_smarty_auth_token
SMARTY_LICENSE=us-core-cloud
PORT=3000
NODE_ENV=production
```

### Running the Service

#### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

#### Docker

```bash
# Development mode (local only, no observability)
npm run dev:start

# Production mode (with Grafana Cloud observability)
npm run prod:start

# Stop development
npm run dev:stop

# Stop production
npm run prod:stop

# View development logs
npm run dev:logs

# View production logs
npm run prod:logs
```

### API Endpoints

- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/documentation
- **Health Check**: http://localhost:3000/health

## CI/CD Pipeline

This project includes automated CI/CD pipelines using GitHub Actions:

### Automated Workflows

- **CI Pipeline**: Runs on pull requests and feature branches
  - Unit tests and linting
  - Docker image building
  - Security vulnerability scanning

- **Deploy Pipeline**: Runs on main branch pushes
  - Automatic version bumping and tagging
  - Docker image building and publishing to Docker Hub
  - GitHub release creation
  - Deployment to Digital Ocean App Platform

### Quick Setup

1. **Fork or clone this repository**
2. **Set up required secrets** (see [GitHub Actions Setup](GITHUB_ACTIONS_README.md))
3. **Push to main branch** to trigger automatic deployment

### Manual Deployment

```bash
# Bump version manually
./scripts/version.sh patch  # or minor, major

# Test deployment locally
./scripts/deploy-local.sh
```

For detailed setup instructions, see [GitHub Actions Setup](GITHUB_ACTIONS_README.md).

## API Documentation

### Validate Address

**POST** `/api/v1/addresses/validate`

Request body:
```json
{
  "correlationId": "req-123",
  "street": "1600 Amphitheatre Parkway",
  "city": "Mountain View",
  "state": "CA",
  "zipcode": "94043"
}
```

Response:
```json
{
  "correlationId": "req-123",
  "success": true,
  "data": {
    "valid": true,
    "addresses": [...]
  }
}
```

### Health Check

**GET** `/health`

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run dev:start` - Start development server in Docker container with hot reloading
- `npm run dev:stop` - Stop development Docker container
- `npm run dev:logs` - View development container logs
- `npm run dev:restart` - Restart development Docker container
- `npm run prod:start` - Start production server with Grafana Cloud observability
- `npm run prod:stop` - Stop production Docker container
- `npm run prod:logs` - View production container logs
- `npm run prod:restart` - Restart production Docker container
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Docker Commands

```bash
# Build production image
docker build -t address-service .

# Run production container
docker run -p 3000:3000 address-service

# Build development image
docker build -f Dockerfile.dev -t address-service:dev .

# Run development container
docker run -p 3000:3000 address-service:dev
```

## Observability with Grafana Cloud

The service includes comprehensive observability features using Grafana Cloud:

- **Metrics**: Prometheus metrics collection
- **Logs**: Structured logging with correlation IDs
- **Traces**: Distributed tracing with OpenTelemetry

### Setting Up Grafana Cloud

1. Run the setup script:
   ```bash
   ./setup-grafana-cloud.sh
   ```

2. Start services with Grafana Cloud:
   ```bash
   docker-compose -f docker-compose.cloud.yml --profile cloud up -d
   ```

For detailed setup instructions, see [GRAFANA_CLOUD_SETUP.md](GRAFANA_CLOUD_SETUP.md).

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | production |
| `SMARTY_AUTH_ID` | Smarty Auth ID | Required |
| `SMARTY_AUTH_TOKEN` | Smarty Auth Token | Required |
| `SMARTY_LICENSE` | Smarty License | us-core-cloud |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- addressService.test.ts
```

## Monitoring

The service includes health checks and monitoring endpoints:

- Health check at `/health`
- Correlation ID tracking for all requests
- Telemetry data sent to Grafana Cloud

## License

MIT
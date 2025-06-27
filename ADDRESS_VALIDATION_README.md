# Address Validation Service

A Node.js/TypeScript service that validates US addresses using the Smarty US Street Address API.

## Features

- **Address Validation**: Validate US addresses using Smarty's US Street Address API
- **Correlation ID Tracking**: Every request requires a correlation ID for tracking
- **Comprehensive Logging**: Detailed logging of API calls, requests, and responses
- **Error Handling**: Robust error handling with detailed error messages
- **TypeScript**: Full TypeScript support with type safety
- **Testing**: Comprehensive test suite with Jest
- **Docker Support**: Containerized deployment with Docker and Docker Compose
- **Observability**: Integration with Grafana, Prometheus, Loki, and Tempo

## Setup

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for containerized deployment)
- Smarty US Street Address API credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Smarty US Street Address API Credentials
# Get your credentials from: https://www.smarty.com/account/keys
SMARTY_AUTH_ID=your_smarty_auth_id_here
SMARTY_AUTH_TOKEN=your_smarty_auth_token_here

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 3. Get Smarty API Credentials

1. Sign up for a Smarty account at [https://www.smarty.com/](https://www.smarty.com/)
2. Navigate to your account dashboard
3. Go to the "Keys" section
4. Copy your Auth ID and Auth Token
5. Update the `.env` file with your credentials

## Usage

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Production with Docker

```bash
# Build and start the service
docker-compose up --build

# Start with observability stack
docker-compose --profile observability up --build
```

## API Endpoints

### POST /api/validate-address

Validate a US address using Smarty's US Street Address API.

**Request Body:**
```json
{
  "correlationId": "req-12345",
  "street": "1600 Pennsylvania Avenue NW",
  "city": "Washington",
  "state": "DC",
  "zipcode": "20500",
  "addressee": "John Doe",
  "candidates": 1,
  "match": "range"
}
```

**Response:**
```json
{
  "success": true,
  "correlationId": "req-12345",
  "data": {
    "validated": true,
    "deliverable": true,
    "validation_notes": [
      "Address found in USPS database",
      "Address is deliverable by USPS"
    ],
    "address": {
      "input_index": 0,
      "candidate_index": 0,
      "delivery_line_1": "1600 Pennsylvania Avenue NW",
      "last_line": "Washington DC 20500-0003",
      "components": {
        "primary_number": "1600",
        "street_name": "Pennsylvania",
        "city_name": "Washington",
        "state_abbreviation": "DC",
        "zipcode": "20500"
      },
      "metadata": {
        "record_type": "S",
        "latitude": 38.8977,
        "longitude": -77.0365
      },
      "analysis": {
        "dpv_match_code": "Y",
        "enhanced_match": "postal-match",
        "dpv_vacant": "N",
        "dpv_no_stat": "N"
      }
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "correlationId": "health-check-123"
}
```

## Validation Logic

The service uses a comprehensive validation approach that handles different response formats from the Smarty API:

### Primary Validation (enhanced_match field)
When the `enhanced_match` field is available in the API response:
- `postal-match`: Address found in USPS database
- `non-postal-match`: Address found in Smarty proprietary data
- `missing-secondary`: Secondary information (apartment/suite) is missing
- `unknown-secondary`: Secondary information provided but not recognized

### Fallback Validation (DPV match codes)
When `enhanced_match` is not available, the service falls back to DPV (Delivery Point Validation) codes:
- `Y`: Address validated and deliverable
- `N`: Address not found in USPS database
- `S`: Address validated but secondary information missing
- `D`: Address validated but secondary information missing (different format)

### Deliverability Assessment
The service determines deliverability based on:
- `dpv_vacant`: Whether the address is vacant
- `dpv_no_stat`: Whether the address is a "no-stat" address
- `dpv_footnotes`: Additional delivery information
- `record_type`: Type of address (S=Street, P=PO Box, etc.)

## Error Handling

The service provides detailed error responses:

```json
{
  "success": false,
  "correlationId": "req-12345",
  "error": "Validation failed",
  "data": {
    "validated": false,
    "deliverable": false,
    "validation_notes": [
      "Street address is required",
      "City is required"
    ]
  }
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Service tests
npm test -- addressService.test.ts

# Route tests
npm test -- addressRoutes.test.ts

# Middleware tests
npm test -- middleware.test.ts
```

### Test Coverage
```bash
npm run test:coverage
```

## Observability

### Logging
- **Request Logging**: All incoming requests are logged with correlation IDs
- **Response Logging**: All responses are logged with status and duration
- **API Call Logging**: Third-party API calls to Smarty are logged
- **Axios Logging**: HTTP requests and responses are logged with detailed information

### Metrics
- Request count and duration
- Error rates
- API call metrics

### Tracing
- Distributed tracing with correlation IDs
- Request flow tracking

### Monitoring
- Health checks
- Service status monitoring
- API endpoint monitoring

## Docker Deployment

### Development
```bash
docker-compose --profile dev up --build
```

### Production
```bash
docker-compose up --build
```

### With Observability Stack
```bash
docker-compose --profile observability up --build
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SMARTY_AUTH_ID` | Smarty API Auth ID | Yes | - |
| `SMARTY_AUTH_TOKEN` | Smarty API Auth Token | Yes | - |
| `NODE_ENV` | Environment | No | `development` |
| `PORT` | Server port | No | `3000` |

### Smarty API Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `street` | Street address | Yes | - |
| `city` | City name | Yes | - |
| `state` | State abbreviation | Yes | - |
| `zipcode` | ZIP code | No | - |
| `addressee` | Recipient name | No | - |
| `candidates` | Number of candidates (1-10) | No | `1` |
| `match` | Match strategy | No | `range` |

## Troubleshooting

### Common Issues

1. **"No matching addresses found" despite valid address**
   - Check if Smarty credentials are correctly set
   - Verify the address format matches US standards
   - Check API response logs for detailed error information

2. **API authentication errors**
   - Verify `SMARTY_AUTH_ID` and `SMARTY_AUTH_TOKEN` are set correctly
   - Check if your Smarty account has sufficient credits
   - Ensure your account is active

3. **Validation always returns false**
   - The service now handles responses both with and without `enhanced_match` field
   - Check the logs for detailed validation reasoning
   - Verify the address exists in USPS database

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`. This will show:
- Detailed API request/response logs
- Validation logic steps
- Processing decisions

## Recent Fixes

### Enhanced Match Field Handling
**Issue**: The service was returning "No matching addresses found" even when Smarty API returned valid addresses, because the `enhanced_match` field was missing from the response.

**Solution**: Updated the validation logic to:
1. Use `enhanced_match` field when available (primary validation)
2. Fall back to DPV match codes when `enhanced_match` is missing
3. Provide detailed logging of validation decisions
4. Handle various response formats from Smarty API

**Result**: The service now correctly validates addresses regardless of whether the `enhanced_match` field is present in the API response.

## License

MIT License 
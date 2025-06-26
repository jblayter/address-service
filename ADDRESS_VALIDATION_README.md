# Address Validation Service

A comprehensive address validation service built with TypeScript, Fastify, and Smarty's US Street Address API. This service provides real-time address validation, standardization, and deliverability assessment for US addresses.

## 🚀 Features

- **Real-time Address Validation**: Validate addresses against USPS database and Smarty's proprietary data
- **Address Standardization**: Automatically correct and standardize address formats
- **Deliverability Assessment**: Determine if addresses are deliverable by USPS and other carriers
- **Secondary Address Support**: Handle apartment numbers, suite numbers, and other secondary information
- **Multiple Candidates**: Get multiple address suggestions for fuzzy matches
- **Comprehensive Logging**: Full request/response logging with correlation IDs
- **Type Safety**: Fully typed with TypeScript for better development experience

## 📋 API Endpoints

### POST `/api/v1/addresses/validate`

Validate an address using a JSON request body.

**Request Body:**
```json
{
  "street": "1600 Amphitheatre Parkway",
  "street2": "Suite 100",
  "city": "Mountain View",
  "state": "CA",
  "zipcode": "94043",
  "addressee": "John Doe",
  "candidates": 3,
  "match": "range"
}
```

**Response:**
```json
{
  "success": true,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "validated": true,
    "deliverable": true,
    "address": {
      "input_index": 0,
      "candidate_index": 0,
      "delivery_line_1": "1600 Amphitheatre Pkwy",
      "delivery_line_2": "Ste 100",
      "last_line": "Mountain View CA 94043-1351",
      "components": {
        "primary_number": "1600",
        "street_name": "Amphitheatre",
        "street_suffix": "Pkwy",
        "city_name": "Mountain View",
        "state_abbreviation": "CA",
        "zipcode": "94043",
        "plus4_code": "1351"
      },
      "metadata": {
        "latitude": 37.422,
        "longitude": -122.084,
        "precision": "Rooftop"
      },
      "analysis": {
        "enhanced_match": "postal-match",
        "dpv_match_code": "Y",
        "dpv_footnotes": "AABB"
      }
    },
    "suggestions": [],
    "validation_notes": [
      "Address found in USPS database",
      "Address is deliverable by USPS"
    ]
  }
}
```

### GET `/api/v1/addresses/validate`

Validate an address using query parameters (for simple cases).

**Query Parameters:**
- `street` (optional): Street address (max 100 characters)
- `street2` (optional): Secondary address (max 100 characters)
- `city` (optional): City name (max 64 characters)
- `state` (optional): State abbreviation (max 32 characters)
- `zipcode` (optional): ZIP code (max 10 characters)
- `addressee` (optional): Recipient name (max 64 characters)
- `candidates` (optional): Number of suggestions (1-10, default 1)
- `match` (optional): Match type: `strict`, `range`, or `invalid` (default `range`)
- `format` (optional): Output format: `project-usa`

**Example:**
```
GET /api/v1/addresses/validate?street=1600+Amphitheatre+Parkway&city=Mountain+View&state=CA&zipcode=94043
```

## 🔧 Configuration

### Environment Variables

Set the following environment variables for Smarty API access:

```bash
# Smarty API Credentials
SMARTY_AUTH_ID=your_auth_id_here
SMARTY_AUTH_TOKEN=your_auth_token_here

# Optional: Logging level
LOG_LEVEL=info
```

### Getting Smarty Credentials

1. Sign up for a Smarty account at [smarty.com](https://www.smarty.com/)
2. Navigate to your account dashboard
3. Copy your Auth ID and Auth Token
4. Add them to your environment variables

## 🏃‍♂️ Running the Service

### Development Mode

```bash
# Start the development server
npm run dev

# Test the validation service
npm run test:validation
```

### Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Docker

```bash
# Build and run with Docker
docker-compose up address-service-dev

# Or for production
docker-compose up address-service
```

## 📊 Validation Logic

The service implements comprehensive validation logic based on Smarty's documentation:

### Enhanced Match Types

- **`postal-match`**: Address found in USPS database
- **`non-postal-match`**: Address found in Smarty proprietary data (non-USPS)
- **`missing-secondary`**: Secondary information (apartment/suite) is missing
- **`unknown-secondary`**: Secondary information provided but not recognized

### Deliverability Assessment

**USPS Deliverability:**
- `dpv_vacant = 'N'` (not vacant)
- `dpv_no_stat = 'N'` (not no-stat)
- `dpv_footnotes` does not contain 'R7'

**Non-USPS Carrier Deliverability:**
- `record_type` is not 'P' (not a PO Box)

### Validation Notes

The service provides detailed validation notes explaining:
- Whether the address was found in USPS or Smarty data
- Secondary information requirements
- Deliverability status
- Any issues that need user attention

## 🔍 Logging and Observability

### Correlation ID Tracking

Every request gets a unique correlation ID that's used throughout the request lifecycle:

```json
{
  "level": "info",
  "msg": "Address validation request",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "requestBody": { "street": "1600 Amphitheatre Parkway" }
}
```

### Smarty API Logging

All Smarty API calls are logged with correlation IDs:

```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:45.100Z",
  "method": "GET",
  "url": "https://us-street.api.smarty.com/street-address",
  "requestBody": { "street": "1600 Amphitheatre Parkway" },
  "responseStatus": 200,
  "duration": 45,
  "service": "smarty-us-street-api"
}
```

### Grafana Integration

The service is configured to work with Grafana for monitoring:
- Request/response metrics
- API call performance
- Error rates and validation success rates
- Correlation ID tracking across services

## 🧪 Testing

### Manual Testing

Use the provided test script:

```bash
npm run test:validation
```

This will test various scenarios:
- Valid addresses
- Addresses with secondary information
- Invalid addresses
- Partial addresses
- Multiple candidates

### API Testing

Test with curl:

```bash
# POST validation
curl -X POST http://localhost:3001/api/v1/addresses/validate \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: test-123" \
  -d '{
    "street": "1600 Amphitheatre Parkway",
    "city": "Mountain View",
    "state": "CA",
    "zipcode": "94043"
  }'

# GET validation
curl "http://localhost:3001/api/v1/addresses/validate?street=1600+Amphitheatre+Parkway&city=Mountain+View&state=CA&zipcode=94043"
```

## 📚 Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "validated": false,
    "deliverable": false,
    "validation_notes": [
      "At least one of street, city, state, or zipcode must be provided"
    ]
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Smarty API error: 401 Unauthorized - Invalid credentials",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🔒 Security

- All API calls use HTTPS
- Authentication credentials are stored as environment variables
- Input validation prevents injection attacks
- Field length limits prevent buffer overflow attacks

## 📈 Performance

- Response times typically under 100ms
- Automatic retry logic for transient failures
- Connection pooling for API calls
- Efficient JSON parsing and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Smarty US Street Address API Documentation](https://www.smarty.com/docs/cloud/us-street-api)
- [Fastify Documentation](https://www.fastify.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 
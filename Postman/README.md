# Address Service API - Postman Collection

This Postman collection provides a comprehensive set of requests to test the Address Service API, which validates US addresses using the Smarty US Street Address API.

## Collection Overview

The collection includes:
- **Health Check**: Verify service status
- **Address Validation**: Validate addresses via POST requests (Complete and Minimal variants)
- **Error Handling**: Test various error scenarios including malformed JSON, invalid content types, and empty requests
- **Correlation ID Tracking**: Test request tracing functionality

## Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Address_Service_API.postman_collection.json` file
4. The collection will be imported with all requests

### 2. Configure Environment Variables

The collection uses environment variables for easy configuration:

- **`baseUrl`**: The base URL for your Address Service API (default: `http://localhost:3000`)
- **`correlationId`**: A unique identifier for request tracing (auto-generated)

### 3. Set Up Environment

1. In Postman, click the "Environments" tab
2. Create a new environment or use the "Address Service" environment
3. Add the following variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` | Base URL for the API |
| `correlationId` | `{{$guid}}` | `{{$guid}}` | Auto-generated correlation ID |

### 4. Start Your Service

Before running the requests, ensure your Address Service is running:

```bash
# Development mode
npm run dev

# Or with Docker
docker-compose up --build
```

## Request Descriptions

### 1. Health Check
- **Method**: GET
- **URL**: `{{baseUrl}}/health`
- **Description**: Verifies the service is running and healthy
- **Headers**: `X-Correlation-ID: {{correlationId}}`
- **Expected Response**: 200 OK with service status

### 2. Address Validation

#### POST Validate Address - Complete
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Validates a complete address with all fields including correlationId
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: JSON with complete address details including street, city, state, zipcode, addressee, candidates, and match parameters

#### POST Validate Address - Minimal
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Validates an address with minimal required fields
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: JSON with minimal address fields (street, city, state, correlationId)

### 3. Error Scenarios

#### POST Malformed JSON
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Tests error handling for malformed JSON (trailing comma)
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: JSON with syntax error (trailing comma)
- **Expected**: 400 Bad Request

#### POST Invalid Content-Type
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Tests error handling for invalid Content-Type
- **Headers**: 
  - `Content-Type: text/plain`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: URL-encoded form data
- **Expected**: 400 Bad Request

#### POST Empty Body
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Tests error handling for empty request body
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: Empty string
- **Expected**: 400 Bad Request

## Usage Examples

### Basic Address Validation

1. Select the "POST Validate Address - Complete" request
2. The request body is pre-filled with example data:
   ```json
   {
     "correlationId": "{{correlationId}}",
     "street": "6902 Silver Springs Dr NW",
     "city": "Gig Harbor",
     "state": "WA",
     "zipcode": "98335",
     "addressee": "John Blayter",
     "candidates": 3,
     "match": "range"
   }
   ```
3. Click "Send"
4. Check the response for validation results

### Testing Minimal Address Validation

1. Select the "POST Validate Address - Minimal" request
2. The request body contains only required fields:
   ```json
   {
     "correlationId": "{{correlationId}}",
     "street": "6902 Silver Springs",
     "city": "Gig Harbor",
     "state": "WA"
   }
   ```
3. Click "Send"
4. Verify the validation works with minimal data

### Testing Error Handling

1. Select any of the error scenario requests
2. Click "Send"
3. Verify the error response format and status code

### Using Different Addresses

1. Modify the request body in any validation request
2. Update the address fields as needed
3. The correlationId will be automatically generated

## Response Format

### Success Response
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

### Error Response
```json
{
  "correlationId": "req-123",
  "success": false,
  "error": "Error description",
  "details": ["Error details"]
}
```

## Testing Workflow

### 1. Health Check
Always start by running the health check to ensure the service is available.

### 2. Basic Validation
Test with a known valid address using the "Complete" request to verify the API is working correctly.

### 3. Minimal Validation
Test with minimal required fields to ensure the API handles partial data appropriately.

### 4. Error Scenarios
Test various error conditions to ensure proper error handling:
- Malformed JSON syntax
- Invalid content types
- Empty request bodies

### 5. Correlation ID Tracking
Verify that correlation IDs are properly returned in all responses.

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the Address Service is running
   - Check the `baseUrl` environment variable
   - Verify the service is running on the correct port

2. **401 Unauthorized**
   - Check your Smarty API credentials in the `.env` file
   - Verify the credentials are valid

3. **400 Bad Request**
   - Check the request format
   - Ensure all required fields are provided
   - Verify the correlationId is included
   - Check for JSON syntax errors

4. **500 Internal Server Error**
   - Check the service logs for detailed error information
   - Verify the Smarty API service is accessible

### Debugging Tips

1. **Check Service Logs**
   ```bash
   # If running with Docker
   docker-compose logs address-service
   
   # If running locally
   npm run dev:logs
   ```

2. **Verify Environment Variables**
   ```bash
   # Check if .env file exists and has correct values
   cat .env
   ```

3. **Test with curl**
   ```bash
   curl -X GET http://localhost:3000/health
   ```

## Environment Configuration

### Development
- **baseUrl**: `http://localhost:3000`
- **Service Port**: 3000

### Production
- **baseUrl**: `https://your-production-domain.com`
- **Service Port**: 3000

## Collection Features

- **Pre-request Scripts**: Automatically generate correlation IDs for each request
- **Environment Variables**: Easy configuration management
- **Structured Organization**: Requests organized by functionality (Health, Validation, Errors)
- **Comprehensive Error Testing**: Multiple error scenarios to test edge cases

## Request Body Examples

### Complete Address Validation
```json
{
  "correlationId": "{{correlationId}}",
  "street": "6902 Silver Springs Dr NW",
  "city": "Gig Harbor",
  "state": "WA",
  "zipcode": "98335",
  "addressee": "John Blayter",
  "candidates": 3,
  "match": "range"
}
```

### Minimal Address Validation
```json
{
  "correlationId": "{{correlationId}}",
  "street": "6902 Silver Springs",
  "city": "Gig Harbor",
  "state": "WA"
}
```

## Contributing

To add new requests or modify existing ones:

1. Create a new request in the collection
2. Add appropriate tests and pre-request scripts
3. Update this README with the new request description
4. Export the updated collection

## Support

For issues with the Postman collection:
1. Check the request configuration
2. Verify environment variables
3. Test with curl to isolate the issue
4. Check the service logs for detailed error information

The service will be available at `http://localhost:3000` by default. 
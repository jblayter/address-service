# Address Service API - Postman Collection

This Postman collection provides a comprehensive set of requests to test the Address Service API, which validates US addresses using the Smarty US Street Address API.

## Collection Overview

The collection includes:
- **Health Check**: Verify service status
- **Address Validation**: Validate addresses via POST and GET requests
- **Error Handling**: Test various error scenarios
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
- **Expected Response**: 200 OK with service status

### 2. Validate Address (POST)
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Validates an address using JSON request body
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Correlation-ID: {{correlationId}}`
- **Body**: JSON with address details and correlationId

### 3. Validate Address (GET)
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/addresses/validate`
- **Description**: Validates an address using query parameters
- **Query Params**: All address fields and correlationId

### 4. Error Scenarios

#### Missing Correlation ID
- Tests validation when correlationId is missing from request body
- Expected: 400 Bad Request

#### Invalid Address
- Tests with an invalid/non-existent address
- Expected: 200 OK with validation failure

#### Missing Required Fields
- Tests with missing required address fields
- Expected: 400 Bad Request

## Usage Examples

### Basic Address Validation

1. Select the "Validate Address (POST)" request
2. The request body is pre-filled with example data
3. Click "Send"
4. Check the response for validation results

### Testing Error Handling

1. Select any of the error scenario requests
2. Click "Send"
3. Verify the error response format and status code

### Using Different Addresses

1. Modify the request body or query parameters
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
Test with a known valid address to verify the API is working correctly.

### 3. Error Scenarios
Test various error conditions to ensure proper error handling.

### 4. Correlation ID Tracking
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

- **Pre-request Scripts**: Automatically generate correlation IDs
- **Tests**: Basic response validation
- **Environment Variables**: Easy configuration management
- **Request Chaining**: Use previous request results in subsequent requests

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
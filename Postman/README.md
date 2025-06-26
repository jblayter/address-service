# Address Service API - Postman Collection

This Postman collection provides comprehensive testing for the Address Service API, which validates US addresses using the Smarty US Street Address API.

## Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Address_Service_API.postman_collection.json` file
4. The collection will be imported with all test requests

### 2. Configure Environment Variables

The collection uses the following variables:

- **`baseUrl`**: The base URL for your Address Service API (default: `http://localhost:3000`)
- **`correlationId`**: Correlation ID for request tracking (auto-generated if empty)

To configure these:

1. Click on the collection name in Postman
2. Go to the "Variables" tab
3. Update the `baseUrl` if your service is running on a different port or host
4. The `correlationId` will be automatically generated for each request

### 3. Set Up Smarty API Credentials

Before testing address validation endpoints, you need to configure Smarty API credentials:

1. Set the following environment variables in your Address Service:
   - `SMARTY_AUTH_ID`: Your Smarty authentication ID
   - `SMARTY_AUTH_TOKEN`: Your Smarty authentication token

2. Or set them in your shell:
   ```bash
   export SMARTY_AUTH_ID="your-auth-id"
   export SMARTY_AUTH_TOKEN="your-auth-token"
   ```

## Collection Structure

### Health Check
- **GET Health Check**: Verifies the service is running

### Address Validation
The collection includes comprehensive tests for address validation:

#### POST Endpoints
- **POST Validate Address - Complete**: Full address validation with all fields
- **POST Validate Address - Minimal**: Minimal required fields only
- **POST Validate Address - With Secondary**: Address with secondary info (apartment, suite)
- **POST Validate Address - PO Box**: PO Box address validation
- **POST Validate Address - Invalid (Missing correlationId)**: Tests required correlationId validation
- **POST Validate Address - Invalid (Field Length)**: Tests field length validation
- **POST Validate Address - Invalid (Candidates Range)**: Tests candidates parameter validation

#### GET Endpoints
- **GET Validate Address - Complete**: GET request with all query parameters
- **GET Validate Address - Minimal**: GET request with minimal parameters
- **GET Validate Address - Invalid (Missing correlationId)**: Tests required correlationId in query
- **GET Validate Address - Special Characters**: Tests URL encoding with special characters

### Error Scenarios
- **POST Malformed JSON**: Tests JSON parsing errors
- **POST Invalid Content-Type**: Tests content-type validation
- **POST Empty Body**: Tests empty request body handling

## Key Features

### Correlation ID Tracking
- Every request automatically includes a correlation ID
- Correlation ID is required in request body/query parameters
- Correlation ID is returned in response headers and body
- Auto-generated if not provided

### Request Validation
- All requests include proper Content-Type headers
- Required fields are validated
- Field length limits are enforced
- Parameter ranges are validated

### Response Validation
- All responses include correlation ID
- Success/error status is properly indicated
- Validation results include detailed information
- Error messages are descriptive

## Testing Workflow

1. **Start with Health Check**: Verify the service is running
2. **Test Valid Addresses**: Use the complete and minimal address validation requests
3. **Test Edge Cases**: Try PO Box addresses and addresses with secondary information
4. **Test Error Handling**: Use the invalid request scenarios
5. **Test Both Methods**: Try both POST and GET endpoints

## Expected Responses

### Successful Address Validation
```json
{
  "success": true,
  "correlationId": "your-correlation-id",
  "data": {
    "validated": true,
    "deliverable": true,
    "address": {
      "delivery_line_1": "1600 Amphitheatre Pkwy",
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
        "dpv_vacant": "N"
      }
    },
    "validation_notes": [
      "Address found in USPS database",
      "Address is deliverable by USPS"
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "correlationId": "your-correlation-id",
  "error": "Smarty authentication credentials not configured",
  "data": {
    "validated": false,
    "deliverable": false,
    "validation_notes": []
  }
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your Smarty API credentials
2. **400 Bad Request**: Verify request body format and required fields
3. **500 Internal Server Error**: Check server logs for detailed error information
4. **Connection Refused**: Ensure the Address Service is running on the correct port

### Debugging Tips

1. Check the response headers for correlation ID
2. Review the response body for detailed error messages
3. Verify all required fields are present in requests
4. Ensure proper JSON formatting in request bodies

## Running the Service

To run the Address Service for testing:

```bash
# Development mode
npm run dev

# Production mode
npm start

# With Docker
docker-compose up
```

The service will be available at `http://localhost:3000` by default. 
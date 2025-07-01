# Third-Party Address Validation Providers

This directory contains implementations of third-party address validation services that can be plugged into the main AddressService through the `IAddressValidationProvider` interface.

## Architecture Overview

The address service is designed with a pluggable provider architecture that decouples the main service logic from specific third-party implementations. This provides several benefits:

1. **Separation of Concerns**: Third-party API logic is isolated from business logic
2. **Testability**: Easy to mock providers for testing
3. **Flexibility**: Can switch between providers or support multiple providers
4. **Maintainability**: Changes to third-party APIs don't affect the main service

## Current Providers

### SmartyAddressProvider (`smarty/`)
- **Implementation**: `smartyAddressProvider.ts`
- **Types**: `types/smartyTypes.ts`
- **Service**: Smarty US Street Address API
- **Features**: 
  - USPS address validation
  - Deliverability checking
  - Address standardization
  - Geographic coordinates

## Adding a New Provider

To add a new address validation provider (e.g., Google Maps, Melissa Data, etc.):

### 1. Create Provider Directory Structure
```
src/thirdparty/[provider-name]/
├── [provider-name]AddressProvider.ts
├── types/
│   └── [provider-name]Types.ts
└── README.md (optional)
```

### 2. Implement the Provider Interface
```typescript
import { IAddressValidationProvider } from '../../interfaces/addressProvider';

export class NewProviderAddressProvider implements IAddressValidationProvider {
  getProviderName(): string {
    return 'new-provider-api';
  }

  isConfigured(): boolean {
    // Check for required credentials/configuration
    return !!process.env.NEW_PROVIDER_API_KEY;
  }

  async validateAddress(request, correlationId): Promise<AddressValidationResponse> {
    // Implement the address validation logic
    // Convert provider-specific response to our standard format
  }
}
```

### 3. Update the Main Service
In `src/services/addressService.ts`, you can:
- Change the default provider in the constructor
- Add provider factory methods
- Support multiple providers with selection logic

### 4. Environment Configuration
Add any required environment variables for the new provider to your `.env` file and documentation.

## Interface Contract

All providers must implement the `IAddressValidationProvider` interface, which includes:

- `validateAddress()`: Core validation method
- `getProviderName()`: Returns provider identifier for logging
- `isConfigured()`: Checks if provider credentials are available

The provider should convert its specific response format to our standardized `AddressValidationResult` format, ensuring consistent responses regardless of the underlying provider.

## Provider-Specific Data

Providers can include their raw response data in the `providerData` field of the result, allowing consumers to access provider-specific information when needed while maintaining the standardized interface.

## Best Practices

1. **Error Handling**: Always provide meaningful error messages
2. **Logging**: Use the provided logging middleware for consistent API call tracking
3. **Configuration**: Check configuration in `isConfigured()` method
4. **Testing**: Create unit tests for your provider implementation
5. **Documentation**: Document any provider-specific features or limitations
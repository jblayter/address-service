import { 
  IAddressValidationProvider,
  AddressValidationRequest, 
  AddressValidationResponse
} from '../interfaces/addressProvider';
import { SmartyAddressProvider } from '../thirdparty/smarty/smartyAddressProvider';

export class AddressService {
  private provider: IAddressValidationProvider;

  constructor(provider?: IAddressValidationProvider) {
    // Default to SmartyAddressProvider, but allow injection for testing/flexibility
    this.provider = provider || new SmartyAddressProvider();
  }

  /**
   * Validate an address using the configured provider
   */
  static async validateAddress(
    request: AddressValidationRequest, 
    correlationId?: string
  ): Promise<AddressValidationResponse> {
    const service = new AddressService();
    return service.validateAddressWithProvider(request, correlationId);
  }

  /**
   * Validate an address using the provider instance
   */
  async validateAddressWithProvider(
    request: AddressValidationRequest, 
    correlationId?: string
  ): Promise<AddressValidationResponse> {
    // Check if provider is configured
    if (!this.provider.isConfigured()) {
      return {
        success: false,
        correlationId: correlationId || request.correlationId,
        error: `${this.provider.getProviderName()} is not properly configured`,
        data: { 
          validated: false, 
          deliverable: false,
          validationNotes: ['Provider configuration missing']
        }
      };
    }

    try {
      const result = await this.provider.validateAddress(request, correlationId);
      return result;
    } catch (error) {
      return {
        success: false,
        correlationId: correlationId || request.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          validated: false,
          deliverable: false,
          validationNotes: ['Service error occurred']
        }
      };
    }
  }

  /**
   * Get the name of the current provider
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }

  /**
   * Check if the current provider is configured
   */
  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Set a different provider (useful for testing or switching providers)
   */
  setProvider(provider: IAddressValidationProvider): void {
    this.provider = provider;
  }
} 
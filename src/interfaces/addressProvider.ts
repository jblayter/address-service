// Interface for address validation providers
// This abstracts away the implementation details of specific third-party APIs

export interface AddressValidationRequest {
  correlationId: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  addressee?: string;
  candidates?: number;
  match?: 'strict' | 'range' | 'invalid';
  format?: string;
}

export interface ValidatedAddress {
  deliveryLine1?: string | undefined;
  deliveryLine2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipcode?: string | undefined;
  plus4Code?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  metadata?: Record<string, any>;
}

export interface AddressValidationResult {
  validated: boolean;
  deliverable: boolean;
  primaryAddress?: ValidatedAddress;
  suggestions?: ValidatedAddress[];
  validationNotes: string[];
  providerData?: any; // Raw provider data for debugging/advanced use cases
}

export interface AddressValidationResponse {
  success: boolean;
  correlationId: string;
  data?: AddressValidationResult;
  error?: string;
}

// Abstract interface for address validation providers
export interface IAddressValidationProvider {
  /**
   * Validate an address using the provider's implementation
   */
  validateAddress(
    request: AddressValidationRequest, 
    correlationId?: string
  ): Promise<AddressValidationResponse>;

  /**
   * Get the provider name for logging/identification
   */
  getProviderName(): string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
}
// DEPRECATED: This file is maintained for backward compatibility only
// For new development, use:
// - src/interfaces/addressProvider.ts for service interfaces
// - src/thirdparty/smarty/types/smartyTypes.ts for Smarty-specific types

// Re-export the new standardized interfaces for backward compatibility
export type {
  AddressValidationRequest,
  AddressValidationResponse as NewAddressValidationResponse,
  ValidatedAddress as AddressValidationResult // Renamed for consistency
} from '../interfaces/addressProvider';

// Legacy Smarty types - now moved to thirdparty folder
export type {
  SmartyAddress,
  SmartyApiResponse,
  SmartyAddressComponent,
  SmartyMetadata,
  SmartyAnalysis,
  SmartyApiError
} from '../thirdparty/smarty/types/smartyTypes';

// Legacy type for backward compatibility
/** @deprecated Use AddressValidationResponse from interfaces/addressProvider.ts */
export interface AddressValidationResponse {
  success: boolean;
  data?: {
    validated: boolean;
    deliverable: boolean;
    address?: any; // Legacy field - use primaryAddress in new format
    suggestions?: any[];
    validation_notes?: string[]; // Legacy field - use validationNotes in new format
  };
  error?: string;
  correlationId: string;
} 
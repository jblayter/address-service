import { SmartyAddressProvider } from './smarty/smartyAddressProvider';

// Export all available address validation providers
export { SmartyAddressProvider };

// Export provider interfaces
export type { 
  IAddressValidationProvider,
  AddressValidationRequest,
  AddressValidationResponse,
  AddressValidationResult,
  ValidatedAddress
} from '../interfaces/addressProvider';

// Provider factory function (for future use)
export function createAddressProvider(providerName: string) {
  switch (providerName.toLowerCase()) {
    case 'smarty':
    case 'smarty-us-street':
      return new SmartyAddressProvider();
    default:
      throw new Error(`Unknown address provider: ${providerName}`);
  }
}
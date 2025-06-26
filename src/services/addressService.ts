import { 
  AddressValidationRequest, 
  AddressValidationResponse, 
  SmartyApiResponse, 
  SmartyAddress,
  SmartyApiError 
} from '../types/address';
import { logThirdPartyApiCall } from '../middleware';
import axios from 'axios';

export class AddressService {
  private static readonly SMARTY_BASE_URL = 'https://us-street.api.smarty.com/street-address';

  /**
   * Validate an address using Smarty US Street Address API
   */
  static async validateAddress(
    request: AddressValidationRequest, 
    correlationId?: string
  ): Promise<AddressValidationResponse> {
    // Check for Smarty credentials before making any fetch call
    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;
    if (!authId || !authToken) {
      return {
        success: false,
        correlationId: correlationId || '',
        error: 'Smarty authentication credentials not configured',
        data: { validated: false, deliverable: false }
      };
    }

    const startTime = Date.now();
    
    try {
      // Validate required fields
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          correlationId: correlationId || '',
          error: 'Validation failed',
          data: {
            validated: false,
            deliverable: false,
            validation_notes: validationErrors
          }
        };
      }

      // Build Smarty API request
      const smartyRequest = this.buildSmartyRequest(request);
      
      // Log the outgoing request
      logThirdPartyApiCall(
        correlationId || '',
        'smarty-us-street-api',
        'GET',
        this.SMARTY_BASE_URL,
        smartyRequest,
        undefined,
        undefined,
        undefined
      );

      // Make API call to Smarty
      const response = await this.callSmartyApi(smartyRequest);
      const duration = Date.now() - startTime;

      // Log the successful response
      logThirdPartyApiCall(
        correlationId || '',
        'smarty-us-street-api',
        'GET',
        this.SMARTY_BASE_URL,
        smartyRequest,
        { status: 200, body: response },
        undefined,
        duration
      );

      // Process the response
      const validationResult = this.processSmartyResponse(response, request);

      return {
        success: true,
        correlationId: correlationId || '',
        data: validationResult!
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log the error
      logThirdPartyApiCall(
        correlationId || '',
        'smarty-us-street-api',
        'GET',
        this.SMARTY_BASE_URL,
        request,
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );

      return {
        success: false,
        correlationId: correlationId || '',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          validated: false,
          deliverable: false,
          validation_notes: ['API call failed']
        }
      };
    }
  }

  /**
   * Validate the input request
   */
  private static validateRequest(request: AddressValidationRequest): string[] {
    const errors: string[] = [];

    // Check if at least one of the required fields is provided
    if (!request.street && !request.city && !request.state && !request.zipcode) {
      errors.push('At least one of street, city, state, or zipcode must be provided');
    }

    // Validate field lengths
    if (request.street && request.street.length > 100) {
      errors.push('Street field exceeds maximum length of 100 characters');
    }

    if (request.street2 && request.street2.length > 100) {
      errors.push('Street2 field exceeds maximum length of 100 characters');
    }

    if (request.city && request.city.length > 64) {
      errors.push('City field exceeds maximum length of 64 characters');
    }

    if (request.state && request.state.length > 32) {
      errors.push('State field exceeds maximum length of 32 characters');
    }

    if (request.zipcode && request.zipcode.length > 10) {
      errors.push('Zipcode field exceeds maximum length of 10 characters');
    }

    if (request.addressee && request.addressee.length > 64) {
      errors.push('Addressee field exceeds maximum length of 64 characters');
    }

    // Validate candidates range
    if (request.candidates && (request.candidates < 1 || request.candidates > 10)) {
      errors.push('Candidates must be between 1 and 10');
    }

    // Validate match parameter
    if (request.match && !['strict', 'range', 'invalid'].includes(request.match)) {
      errors.push('Match parameter must be one of: strict, range, invalid');
    }

    return errors;
  }

  /**
   * Build the Smarty API request
   */
  private static buildSmartyRequest(request: AddressValidationRequest): Record<string, string> {
    const params: Record<string, string> = {
      'auth-id': process.env.SMARTY_AUTH_ID!,
      'auth-token': process.env.SMARTY_AUTH_TOKEN!
    };

    // Add address fields
    if (request.street) params.street = request.street;
    if (request.street2) params.street2 = request.street2;
    if (request.city) params.city = request.city;
    if (request.state) params.state = request.state;
    if (request.zipcode) params.zipcode = request.zipcode;
    if (request.addressee) params.addressee = request.addressee;

    // Add optional parameters
    if (request.candidates) params.candidates = request.candidates.toString();
    if (request.match) params.match = request.match;
    if (request.format) params.format = request.format;

    return params;
  }

  /**
   * Make the API call to Smarty
   */
  private static async callSmartyApi(params: Record<string, string>): Promise<SmartyApiResponse> {
    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;
    if (!authId || !authToken) {
      throw new Error('Smarty authentication credentials not configured');
    }

    const url = new URL(this.SMARTY_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await axios.get(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AddressService/1.0.0'
        }
      });

      return response.data as SmartyApiResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const errorText = error.response?.data || error.message;
        throw new Error(`Smarty API error: ${status} ${statusText} - ${errorText}`);
      }
      throw error;
    }
  }

  /**
   * Process the Smarty API response and determine validation results
   */
  private static processSmartyResponse(
    response: SmartyApiResponse, 
    originalRequest: AddressValidationRequest
  ): AddressValidationResponse['data'] {
    const addresses = response.addresses || [];
    
    if (addresses.length === 0) {
      return {
        validated: false,
        deliverable: false,
        validation_notes: ['No matching addresses found']
      };
    }

    // Get the best match (first candidate)
    const bestMatch = addresses[0];
    const suggestions = addresses.slice(1);

    // Determine validation status based on Smarty documentation
    if (!bestMatch) {
      return {
        validated: false,
        deliverable: false,
        validation_notes: ['No valid address match found']
      };
    }

    const validationResult = this.interpretValidationResult(bestMatch);

    const result: AddressValidationResponse['data'] = {
      validated: validationResult.validated,
      deliverable: validationResult.deliverable,
      validation_notes: validationResult.notes
    };

    // Add optional fields only if they exist
    if (bestMatch) {
      result.address = bestMatch;
    }
    
    if (suggestions.length > 0) {
      result.suggestions = suggestions;
    }

    return result;
  }

  /**
   * Interpret the validation result based on Smarty's enhanced_match field
   */
  private static interpretValidationResult(address: SmartyAddress): {
    validated: boolean;
    deliverable: boolean;
    notes: string[];
  } {
    const notes: string[] = [];
    let validated = false;
    let deliverable = false;

    const enhancedMatch = address.analysis?.enhanced_match;
    const dpvFootnotes = address.analysis?.dpv_footnotes;
    const recordType = address.metadata?.record_type;

    if (!enhancedMatch) {
      notes.push('Address not found in USPS database or Smarty proprietary data');
      return { validated: false, deliverable: false, notes };
    }

    // Check for postal match
    if (enhancedMatch.includes('postal-match')) {
      validated = true;
      notes.push('Address found in USPS database');

      // Check for missing secondary information
      if (enhancedMatch.includes('missing-secondary')) {
        if (dpvFootnotes?.includes('N1')) {
          notes.push('Secondary information (apartment/suite) is required for delivery');
        } else {
          notes.push('Secondary information is available but not required');
        }
      }

      // Check for unknown secondary information
      if (enhancedMatch.includes('unknown-secondary')) {
        if (dpvFootnotes?.includes('C1')) {
          notes.push('Secondary information provided but not recognized - correction needed');
        } else if (dpvFootnotes?.includes('CC')) {
          notes.push('Secondary information provided but not needed for delivery');
        }
      }

      // Check deliverability
      if (address.analysis?.dpv_vacant === 'N' && 
          address.analysis?.dpv_no_stat === 'N' && 
          !dpvFootnotes?.includes('R7')) {
        deliverable = true;
        notes.push('Address is deliverable by USPS');
      } else {
        notes.push('Address may not be deliverable by USPS');
      }

    } else if (enhancedMatch.includes('non-postal-match')) {
      validated = true;
      notes.push('Address found in Smarty proprietary data (non-USPS)');
      
      // Non-USPS addresses are not deliverable by USPS
      if (enhancedMatch.includes('missing-secondary')) {
        notes.push('Secondary information might be needed for delivery');
      }
      if (enhancedMatch.includes('unknown-secondary')) {
        notes.push('Secondary information provided but not recognized');
      }
    }

    // Check for PO Box (not deliverable by non-USPS carriers)
    if (recordType === 'P') {
      notes.push('PO Box address - not deliverable by FedEx, UPS, or other non-USPS carriers');
    }

    return { validated, deliverable, notes };
  }
} 
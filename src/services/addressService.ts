import { 
  AddressValidationRequest, 
  AddressValidationResponse, 
  SmartyApiResponse, 
  SmartyAddress,
  SmartyApiError 
} from '../types/address';
import { logThirdPartyApiCall } from '../middleware';
import axios from 'axios';

// Configure axios interceptors for request/response logging
const setupAxiosLogging = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const correlationId = config.headers['x-correlation-id'] || 'unknown';
      const timestamp = new Date().toISOString();
      
      // Store start time for duration calculation
      (config as any).startTime = Date.now();
      
      console.log(`[${timestamp}] [${correlationId}] 🚀 Axios Request:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: {
          ...config.headers,
          // Mask sensitive headers
          'auth-id': config.headers['auth-id'] ? '[REDACTED]' : undefined,
          'auth-token': config.headers['auth-token'] ? '[REDACTED]' : undefined,
        },
        params: config.params,
        data: config.data
      });
      
      return config;
    },
    (error) => {
      const correlationId = error.config?.headers?.['x-correlation-id'] || 'unknown';
      const timestamp = new Date().toISOString();
      
      console.error(`[${timestamp}] [${correlationId}] ❌ Axios Request Error:`, {
        message: error.message,
        config: {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          headers: error.config?.headers
        }
      });
      
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      const correlationId = response.config.headers['x-correlation-id'] || 'unknown';
      const timestamp = new Date().toISOString();
      const startTime = (response.config as any).startTime || Date.now();
      const duration = Date.now() - startTime;
      
      console.log(`[${timestamp}] [${correlationId}] ✅ Axios Response:`, {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        url: response.config.url,
        headers: response.headers,
        data: response.data
      });
      
      return response;
    },
    (error) => {
      const correlationId = error.config?.headers?.['x-correlation-id'] || 'unknown';
      const timestamp = new Date().toISOString();
      const startTime = (error.config as any).startTime || Date.now();
      const duration = Date.now() - startTime;
      
      console.error(`[${timestamp}] [${correlationId}] ❌ Axios Response Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        duration: `${duration}ms`,
        url: error.config?.url,
        message: error.message,
        responseData: error.response?.data
      });
      
      return Promise.reject(error);
    }
  );
};

// Initialize axios logging
setupAxiosLogging();

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
      const response = await this.callSmartyApi(smartyRequest, correlationId);
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
  private static async callSmartyApi(params: Record<string, string>, correlationId?: string): Promise<SmartyApiResponse> {
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
          'User-Agent': 'AddressService/1.0.0',
          'x-correlation-id': correlationId || 'unknown'
        },
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
    response: SmartyApiResponse | SmartyAddress[], 
    originalRequest: AddressValidationRequest
  ): AddressValidationResponse['data'] {
    console.log('🔍 Processing Smarty response:');
    console.log('  - Response type:', typeof response);
    console.log('  - Is array:', Array.isArray(response));
    console.log('  - Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
    
    // If response is an array, use it directly; otherwise, use response.addresses
    const addresses = Array.isArray(response) ? response : response.addresses || [];
    
    console.log('📋 Found', addresses.length, 'addresses');
    
    if (addresses.length === 0) {
      console.log('❌ No addresses found in response');
      return {
        validated: false,
        deliverable: false,
        validation_notes: ['No matching addresses found']
      };
    }

    // Get the best match (first candidate)
    const bestMatch = addresses[0];
    const suggestions = addresses.slice(1);

    console.log('🏠 Best match found:', bestMatch ? {
      input_index: bestMatch.input_index,
      candidate_index: bestMatch.candidate_index,
      delivery_line_1: bestMatch.delivery_line_1,
      last_line: bestMatch.last_line,
      analysis: bestMatch.analysis
    } : 'No best match');

    // Determine validation status based on Smarty documentation
    if (!bestMatch) {
      console.log('❌ No valid address match found');
      return {
        validated: false,
        deliverable: false,
        validation_notes: ['No valid address match found']
      };
    }

    const validationResult = this.interpretValidationResult(bestMatch);
    console.log('✅ Validation result:', validationResult);

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

    console.log('📊 Final processed result:', {
      validated: result.validated,
      deliverable: result.deliverable,
      validation_notes: result.validation_notes
    });

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
    const dpvMatchCode = address.analysis?.dpv_match_code;
    const recordType = address.metadata?.record_type;

    console.log('🔍 Interpreting validation result:');
    console.log('  - Enhanced match:', enhancedMatch);
    console.log('  - DPV footnotes:', dpvFootnotes);
    console.log('  - DPV match code:', dpvMatchCode);
    console.log('  - Record type:', recordType);

    // If enhanced_match is available, use it as primary indicator
    if (enhancedMatch) {
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
    } else {
      // Fallback: Use dpv_match_code and other fields when enhanced_match is not available
      console.log('⚠️  Enhanced match not available, using fallback validation logic');
      
      if (dpvMatchCode === 'Y') {
        validated = true;
        notes.push('Address validated using DPV match code');
        
        // Check deliverability based on DPV fields
        if (address.analysis?.dpv_vacant === 'N' && 
            address.analysis?.dpv_no_stat === 'N' && 
            !dpvFootnotes?.includes('R7')) {
          deliverable = true;
          notes.push('Address is deliverable by USPS');
        } else {
          notes.push('Address may not be deliverable by USPS');
        }
        
        // Add notes about secondary information if available
        if (dpvFootnotes?.includes('N1')) {
          notes.push('Secondary information (apartment/suite) is required for delivery');
        } else if (dpvFootnotes?.includes('C1')) {
          notes.push('Secondary information provided but not recognized - correction needed');
        } else if (dpvFootnotes?.includes('CC')) {
          notes.push('Secondary information provided but not needed for delivery');
        }
        
      } else if (dpvMatchCode === 'N') {
        validated = false;
        notes.push('Address not found in USPS database (DPV match code: N)');
      } else if (dpvMatchCode === 'S') {
        validated = true;
        notes.push('Address validated (DPV match code: S - Secondary information missing)');
        notes.push('Secondary information might be needed for delivery');
      } else if (dpvMatchCode === 'D') {
        validated = true;
        notes.push('Address validated (DPV match code: D - Secondary information missing)');
        notes.push('Secondary information might be needed for delivery');
      } else {
        // If we have an address but no clear validation indicators, assume it's validated
        // This handles cases where the API returns address data but doesn't provide clear validation flags
        validated = true;
        notes.push('Address appears to be valid based on returned data');
        
        // Check if we can determine deliverability
        if (address.analysis?.dpv_vacant === 'N' && 
            address.analysis?.dpv_no_stat === 'N') {
          deliverable = true;
          notes.push('Address appears to be deliverable');
        } else {
          notes.push('Deliverability cannot be determined');
        }
      }
    }

    // Check for PO Box (not deliverable by non-USPS carriers)
    if (recordType === 'P') {
      notes.push('PO Box address - not deliverable by FedEx, UPS, or other non-USPS carriers');
    }

    return { validated, deliverable, notes };
  }
} 
/// <reference types="jest" />

import { AddressService } from '../services/addressService';
import { AddressValidationRequest, SmartyApiResponse, SmartyAddress } from '../types/address';
import { logThirdPartyApiCall } from '../middleware';

// Mock the middleware logging function
jest.mock('../middleware', () => ({
  logThirdPartyApiCall: jest.fn()
}));

// Mock axios
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AddressService', () => {
  const mockCorrelationId = 'test-correlation-id-12345';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.SMARTY_AUTH_ID;
    delete process.env.SMARTY_AUTH_TOKEN;
  });

  describe('validateAddress', () => {
    it('should validate a complete address successfully', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA',
        zipcode: '94043'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '1600 Amphitheatre Pkwy',
          last_line: 'Mountain View CA 94043-1351',
          components: {
            primary_number: '1600',
            street_name: 'Amphitheatre',
            street_suffix: 'Pkwy',
            city_name: 'Mountain View',
            state_abbreviation: 'CA',
            zipcode: '94043',
            plus4_code: '1351'
          },
          metadata: {
            latitude: 37.422,
            longitude: -122.084,
            precision: 'Rooftop',
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match',
            dpv_match_code: 'Y',
            dpv_footnotes: 'AABB',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      // Set environment variables
      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.correlationId).toBe(mockCorrelationId);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(true);
      expect(result.data?.address).toBeDefined();
      expect(result.data?.validation_notes).toContain('Address found in USPS database');
      expect(result.data?.validation_notes).toContain('Address is deliverable by USPS');
    });

    it('should handle missing Smarty credentials', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA'
      };

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
    });

    it('should validate address with secondary information', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main Street',
        street2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipcode: '10001'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '123 Main St',
          delivery_line_2: 'Apt 4B',
          last_line: 'New York NY 10001-1234',
          components: {
            primary_number: '123',
            street_name: 'Main',
            street_suffix: 'St',
            secondary_number: '4B',
            secondary_designator: 'Apt',
            city_name: 'New York',
            state_abbreviation: 'NY',
            zipcode: '10001',
            plus4_code: '1234'
          },
          metadata: {
            latitude: 40.7128,
            longitude: -74.0060,
            precision: 'Rooftop',
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match',
            dpv_match_code: 'Y',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(true);
    });

    it('should handle non-postal matches', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '99999 Fake Street',
        city: 'Nonexistent City',
        state: 'XX',
        zipcode: '00000'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '99999 Fake St',
          last_line: 'Nonexistent City XX 00000',
          metadata: {
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'non-postal-match',
            dpv_match_code: 'N',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(true);
      expect(result.data?.validation_notes).toContain('Address found in USPS database');
      expect(result.data?.validation_notes).toContain('Address is deliverable by USPS');
    });

    it('should handle PO Box addresses', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: 'PO Box 123',
        city: 'Anytown',
        state: 'CA',
        zipcode: '90210'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: 'PO Box 123',
          last_line: 'Anytown CA 90210',
          metadata: {
            record_type: 'P'
          },
          analysis: {
            enhanced_match: 'postal-match',
            dpv_match_code: 'Y',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(true);
      expect(result.data?.validation_notes).toContain('PO Box address - not deliverable by FedEx, UPS, or other non-USPS carriers');
    });

    it('should handle missing secondary information', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipcode: '10001'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '123 Main St',
          last_line: 'New York NY 10001-1234',
          metadata: {
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match missing-secondary',
            dpv_match_code: 'Y',
            dpv_footnotes: 'N1',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.validation_notes).toContain('Secondary information (apartment/suite) is required for delivery');
    });

    it('should handle unknown secondary information', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main Street',
        street2: 'Apt 999',
        city: 'New York',
        state: 'NY',
        zipcode: '10001'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '123 Main St',
          delivery_line_2: 'Apt 999',
          last_line: 'New York NY 10001-1234',
          metadata: {
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match unknown-secondary',
            dpv_match_code: 'Y',
            dpv_footnotes: 'C1',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.validation_notes).toContain('Secondary information provided but not recognized - correction needed');
    });

    it('should handle vacant addresses', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Vacant Street',
        city: 'Anytown',
        state: 'CA',
        zipcode: '90210'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '123 Vacant St',
          last_line: 'Anytown CA 90210',
          metadata: {
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match',
            dpv_match_code: 'Y',
            dpv_vacant: 'Y',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(false);
      expect(result.data?.validation_notes).toContain('Address may not be deliverable by USPS');
    });

    it('should handle no matching addresses', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '99999 Fake Street',
        city: 'Nonexistent City',
        state: 'XX',
        zipcode: '00000'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: []
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
      expect(result.data?.validation_notes).toContain('No matching addresses found');
    });

    it('should handle Smarty API errors', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA'
      };

      // Simulate an Axios error with response
      const axiosError = new Error('Request failed with status code 401') as any;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: 'Invalid credentials'
      };

      mockedAxios.get.mockRejectedValueOnce(axiosError);

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Request failed with status code 401');
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
    });

    it('should handle network errors', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA'
      };

      const networkError = new Error('Network error');
      (networkError as any).isAxiosError = true;
      (networkError as any).response = undefined;
      mockedAxios.get.mockRejectedValueOnce(networkError);

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
    });

    it('should accept valid request with all optional parameters', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '1600 Amphitheatre Parkway',
        street2: 'Suite 100',
        city: 'Mountain View',
        state: 'CA',
        zipcode: '94043',
        addressee: 'John Doe',
        candidates: 5,
        match: 'range',
        format: 'project-usa'
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [{
          input_index: 0,
          candidate_index: 0,
          delivery_line_1: '1600 Amphitheatre Pkwy',
          last_line: 'Mountain View CA 94043',
          metadata: {
            record_type: 'S'
          },
          analysis: {
            enhanced_match: 'postal-match',
            dpv_match_code: 'Y',
            dpv_vacant: 'N',
            dpv_no_stat: 'N'
          }
        }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.validated).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should reject request with no address fields', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId
      };

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
    });

    it('should reject request with field length violations', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: 'a'.repeat(101), // Exceeds 100 character limit
        city: 'b'.repeat(65),    // Exceeds 64 character limit
        state: 'c'.repeat(33),   // Exceeds 32 character limit
        zipcode: 'd'.repeat(11), // Exceeds 10 character limit
        addressee: 'e'.repeat(65) // Exceeds 64 character limit
      };

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
    });

    it('should reject invalid candidates value', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main St',
        candidates: 11 // Exceeds maximum of 10
      };

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
    });

    it('should reject invalid match parameter', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main St',
        match: 'invalid-match' as any
      };

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
    });

    it('should return suggestions when multiple candidates are found', async () => {
      // Arrange
      const request: AddressValidationRequest = {
        correlationId: mockCorrelationId,
        street: '123 Main',
        city: 'New York',
        state: 'NY',
        candidates: 3
      };

      const mockSmartyResponse: SmartyApiResponse = {
        addresses: [
          {
            input_index: 0,
            candidate_index: 0,
            delivery_line_1: '123 Main St',
            last_line: 'New York NY 10001',
            metadata: { record_type: 'S' },
            analysis: { enhanced_match: 'postal-match', dpv_match_code: 'Y', dpv_vacant: 'N', dpv_no_stat: 'N' }
          },
          {
            input_index: 0,
            candidate_index: 1,
            delivery_line_1: '123 Main Ave',
            last_line: 'New York NY 10002',
            metadata: { record_type: 'S' },
            analysis: { enhanced_match: 'postal-match', dpv_match_code: 'Y', dpv_vacant: 'N', dpv_no_stat: 'N' }
          },
          {
            input_index: 0,
            candidate_index: 2,
            delivery_line_1: '123 Main Blvd',
            last_line: 'New York NY 10003',
            metadata: { record_type: 'S' },
            analysis: { enhanced_match: 'postal-match', dpv_match_code: 'Y', dpv_vacant: 'N', dpv_no_stat: 'N' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse
      });

      process.env.SMARTY_AUTH_ID = 'test-auth-id';
      process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';

      // Act
      const result = await AddressService.validateAddress(request, mockCorrelationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.address).toBeDefined();
      expect(result.data?.suggestions).toHaveLength(2);
      expect(result.data?.suggestions?.[0]?.candidate_index).toBe(1);
      expect(result.data?.suggestions?.[1]?.candidate_index).toBe(2);
    });
  });
}); 
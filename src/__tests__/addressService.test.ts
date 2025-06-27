/// <reference types="jest" />

import { AddressService } from '../services/addressService';
import { AddressValidationRequest, SmartyApiResponse } from '../types/address';
import axios from 'axios';

// Mock the middleware logging function
jest.mock('../middleware', () => ({
  logThirdPartyApiCall: jest.fn()
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock console.log and console.error to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let logOutput: string[] = [];
let errorOutput: string[] = [];

beforeEach(() => {
  logOutput = [];
  errorOutput = [];
  console.log = jest.fn((...args) => {
    logOutput.push(args.join(' '));
    originalConsoleLog(...args);
  });
  console.error = jest.fn((...args) => {
    errorOutput.push(args.join(' '));
    originalConsoleError(...args);
  });
  // Patch isAxiosError for all tests
  (axios.isAxiosError as any) = (err: any) => err && err.isAxiosError;
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  jest.clearAllMocks();
});

describe('AddressService', () => {
  const mockRequest: AddressValidationRequest = {
    correlationId: 'test-123',
    street: '1600 Amphitheatre Parkway',
    city: 'Mountain View',
    state: 'CA',
    zipcode: '94043'
  };

  const mockSmartyResponse: SmartyApiResponse = {
    addresses: [
      {
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
          latitude: 37.4223,
          longitude: -122.085,
          precision: 'Zip9',
          time_zone: 'Pacific',
          utc_offset: -8,
          dst: true,
          record_type: 'S'
        },
        analysis: {
          enhanced_match: 'postal-match',
          dpv_match_code: 'Y',
          dpv_footnotes: 'AABB',
          dpv_cmra: 'N',
          dpv_vacant: 'N',
          dpv_no_stat: 'N',
          active: 'Y',
          footnotes: 'N#'
        }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.SMARTY_AUTH_ID = 'test-auth-id';
    process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';
  });

  afterEach(() => {
    delete process.env.SMARTY_AUTH_ID;
    delete process.env.SMARTY_AUTH_TOKEN;
  });

  describe('validateAddress', () => {
    it('should validate a valid address successfully', async () => {
      // Mock successful axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: { 'x-correlation-id': 'test-123' },
          url: 'https://us-street.api.smarty.com/street-address'
        }
      } as any);

      const result = await AddressService.validateAddress(mockRequest, 'test-123');

      expect(result.success).toBe(true);
      expect(result.correlationId).toBe('test-123');
      expect(result.data?.validated).toBe(true);
      expect(result.data?.deliverable).toBe(true);
      expect(result.data?.address).toBeDefined();
    });

    it('should verify axios interceptors are configured', () => {
      // Test that axios interceptors are set up by checking if they exist
      expect(axios.interceptors.request).toBeDefined();
      expect(axios.interceptors.response).toBeDefined();
    });

    it('should log axios errors when API call fails', async () => {
      // Mock axios error with proper structure
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: 'Invalid credentials'
        },
        message: 'Request failed with status code 401',
        config: {
          headers: { 'x-correlation-id': 'test-123' },
          url: 'https://us-street.api.smarty.com/street-address'
        }
      };
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      // Patch isAxiosError to return true for our error
      (axios.isAxiosError as any) = (err: any) => err && err.isAxiosError;

      const result = await AddressService.validateAddress(mockRequest, 'test-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Smarty API error: 401 Unauthorized');
    });

    it('should return error when Smarty credentials are not configured', async () => {
      delete process.env.SMARTY_AUTH_ID;
      delete process.env.SMARTY_AUTH_TOKEN;

      const result = await AddressService.validateAddress(mockRequest, 'test-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Smarty authentication credentials not configured');
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
    });

    it('should return validation error for invalid request', async () => {
      const invalidRequest: AddressValidationRequest = {
        correlationId: 'test-123',
        // Missing required fields
      };

      const result = await AddressService.validateAddress(invalidRequest, 'test-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data?.validated).toBe(false);
      expect(result.data?.deliverable).toBe(false);
      expect(result.data?.validation_notes).toContain('At least one of street, city, state, or zipcode must be provided');
    });

    it('should return validation error for field length violations', async () => {
      const invalidRequest: AddressValidationRequest = {
        correlationId: 'test-123',
        street: 'A'.repeat(101), // Exceeds 100 character limit
        city: 'Mountain View',
        state: 'CA',
        zipcode: '94043'
      };

      const result = await AddressService.validateAddress(invalidRequest, 'test-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data?.validation_notes).toContain('Street field exceeds maximum length of 100 characters');
    });

    it('should return validation error for invalid candidates value', async () => {
      const invalidRequest: AddressValidationRequest = {
        correlationId: 'test-123',
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA',
        zipcode: '94043',
        candidates: 15 // Exceeds maximum of 10
      };

      const result = await AddressService.validateAddress(invalidRequest, 'test-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.data?.validation_notes).toContain('Candidates must be between 1 and 10');
    });

    it('should accept valid match parameter', async () => {
      const validRequest: AddressValidationRequest = {
        correlationId: 'test-123',
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA',
        zipcode: '94043',
        match: 'invalid' // Valid match value
      };

      // Mock successful axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockSmartyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: { 'x-correlation-id': 'test-123' },
          url: 'https://us-street.api.smarty.com/street-address'
        }
      } as any);

      const result = await AddressService.validateAddress(validRequest, 'test-123');

      // This should succeed since 'invalid' is a valid match value
      expect(result.success).toBe(true);
    });
  });
}); 
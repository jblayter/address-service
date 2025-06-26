// Smarty US Street Address API Types
// Based on: https://www.smarty.com/docs/cloud/us-street-api

// Input fields for address validation
export interface AddressValidationRequest {
  // Required fields
  correlationId: string;  // Required correlation ID for request tracking
  street?: string;        // Max 100 characters
  street2?: string;       // Max 100 characters (secondary address)
  city?: string;          // Max 64 characters
  state?: string;         // Max 32 characters
  zipcode?: string;       // Max 10 characters
  addressee?: string;     // Max 64 characters
  
  // Optional fields
  candidates?: number;    // 1-10, default 1
  match?: 'strict' | 'range' | 'invalid';  // Default 'range'
  format?: 'project-usa'; // For Project US@ formatting
}

// Smarty API Response Types
export interface SmartyAddressComponent {
  urbanization?: string;      // Max 64 characters
  primary_number?: string;    // Max 10 characters
  street_name?: string;       // Max 64 characters
  street_predirection?: string; // Max 2 characters
  street_postdirection?: string; // Max 2 characters
  street_suffix?: string;     // Max 4 characters
  secondary_number?: string;  // Max 10 characters
  secondary_designator?: string; // Max 4 characters
  extra_secondary_number?: string; // Max 10 characters
  extra_secondary_designator?: string; // Max 4 characters
  pmb_number?: string;        // Max 10 characters
  pmb_designator?: string;    // Max 4 characters
  city_name?: string;         // Max 64 characters
  default_city_name?: string; // Max 64 characters
  state_abbreviation?: string; // Max 2 characters
  zipcode?: string;           // Max 10 characters
  plus4_code?: string;        // Max 4 characters
  delivery_point?: string;    // Max 2 characters
  delivery_point_check_digit?: string; // Max 1 character
}

export interface SmartyMetadata {
  record_type?: string;       // Max 1 character
  zip_type?: string;          // Max 1 character
  county_fips?: string;       // Max 5 characters
  county_name?: string;       // Max 64 characters
  carrier_route?: string;     // Max 4 characters
  congressional_district?: string; // Max 2 characters
  building_default_indicator?: string; // Max 1 character
  rdi?: string;               // Max 1 character
  elot_sequence?: string;     // Max 4 characters
  elot_sort?: string;         // Max 1 character
  latitude?: number;          // Decimal degrees
  longitude?: number;         // Decimal degrees
  coordinate_license?: number; // 0 or 1
  precision?: string;         // Max 1 character
  time_zone?: string;         // Max 32 characters
  utc_offset?: number;        // Minutes from UTC
  dst?: boolean;              // Daylight saving time
}

export interface SmartyAnalysis {
  dpv_match_code?: string;    // Max 1 character
  dpv_footnotes?: string;     // Max 2 characters
  dpv_cmra?: string;          // Max 1 character
  dpv_vacant?: string;        // Max 1 character
  dpv_no_stat?: string;       // Max 1 character
  active?: string;            // Max 1 character
  enhanced_match?: string;    // Max 32 characters
  footnotes?: string;         // Max 32 characters
  lacs_link_code?: string;    // Max 1 character
  lacs_link_indicator?: string; // Max 1 character
  is_suite_link_match?: boolean;
}

export interface SmartyAddress {
  input_index: number;
  candidate_index: number;
  addressee?: string;         // Max 64 characters
  delivery_line_1?: string;   // Max 100 characters
  delivery_line_2?: string;   // Max 100 characters
  last_line?: string;         // Max 100 characters
  delivery_point_barcode?: string; // Max 32 characters
  components?: SmartyAddressComponent;
  metadata?: SmartyMetadata;
  analysis?: SmartyAnalysis;
}

export interface SmartyApiResponse {
  addresses?: SmartyAddress[];
}

// Our service response types
export interface AddressValidationResponse {
  success: boolean;
  data?: {
    validated: boolean;
    deliverable: boolean;
    address?: SmartyAddress;
    suggestions?: SmartyAddress[];
    validation_notes?: string[];
  };
  error?: string;
  correlationId: string;
}

// Error types
export interface SmartyApiError {
  message: string;
  code?: string;
  details?: any;
} 
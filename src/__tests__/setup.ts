/// <reference types="jest" />

// Jest setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not present
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error'; // Reduce log noise in tests

// Mock environment variables for testing
if (!process.env.SMARTY_AUTH_ID) {
  process.env.SMARTY_AUTH_ID = 'test-auth-id';
}
if (!process.env.SMARTY_AUTH_TOKEN) {
  process.env.SMARTY_AUTH_TOKEN = 'test-auth-token';
}

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console output
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 
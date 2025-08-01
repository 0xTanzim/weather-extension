import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.OPEN_WEATHER_API_KEYS =
  'test-api-key-1,test-api-key-2,test-api-key-3';
process.env.OPEN_WEATHER_API_KEY = 'test-api-key';
// Don't override NODE_ENV as it's read-only in some environments

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js request/response objects
export const createMockRequest = (overrides = {}) => ({
  headers: new Map(),
  nextUrl: new URL('http://localhost:3000/api/test'),
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    headers: new Map(),
  };
  return res;
};

// Mock rate limiting
export const mockRateLimit = {
  checkLimit: jest.fn().mockReturnValue(true),
  recordRequest: jest.fn(),
};

// Mock API key manager
export const mockApiKeyManager = {
  getActiveKey: jest.fn().mockReturnValue('test-api-key'),
  recordError: jest.fn(),
  getActiveKeyCount: jest.fn().mockReturnValue(1),
};

// Mock cache
export const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

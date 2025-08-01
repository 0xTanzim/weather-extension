// Mock the API key manager FIRST, before any other imports
jest.mock('../../../utils/apiKeyManager', () => ({
  default: {
    getNextKey: jest.fn().mockReturnValue('test-api-key'),
    recordError: jest.fn(),
    recordSuccess: jest.fn(),
    getActiveKeyCount: jest.fn().mockReturnValue(1),
  },
}));

// Mock environment variables
process.env.OPEN_WEATHER_API_KEYS = 'test-key-1,test-key-2';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, OPTIONS } from '../weather/route';

// Note: checkRateLimit is no longer exported, so we don't need to mock it

describe('Weather API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();

    // Reset the API key manager mock for each test
    const apiKeyManagerModule = require('../../../utils/apiKeyManager');
    apiKeyManagerModule.default.getNextKey.mockReturnValue('test-api-key');
    apiKeyManagerModule.default.recordError.mockClear();
    apiKeyManagerModule.default.recordSuccess.mockClear();
    apiKeyManagerModule.default.getActiveKeyCount.mockReturnValue(1);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns weather data for valid city', async () => {
    const mockWeatherData = {
      name: 'Dhaka',
      main: { temp: 30 },
      weather: [
        { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherData,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWeatherData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://api.openweathermap.org/data/2.5/weather'
      ),
      expect.objectContaining({
        headers: expect.any(Object),
        signal: expect.any(Object),
      })
    );
  });

  it('handles missing city parameter', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('City parameter is required');
  });

  it('handles empty city parameter', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('City parameter is required');
  });

  it('validates city name length', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=A&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('City name must be at least 2 characters long');
  });

  it('validates city name characters', async () => {
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/weather?city=Dhaka<script>&units=metric'
      )
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid characters in city name');
  });

  it('handles OpenWeather API errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'city not found' }),
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=InvalidCity&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe(
      'City "InvalidCity" not found. Please check the spelling.'
    );
  });

  it('handles network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch weather data');
  });

  it('handles malformed JSON response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to parse weather data');
  });

  it('handles different temperature units', async () => {
    const mockWeatherData = {
      name: 'Dhaka',
      main: { temp: 86 },
      weather: [
        { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
    };

    // Ensure fetch is properly mocked for this test
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherData,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=imperial')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWeatherData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('units=imperial'),
      expect.objectContaining({
        headers: expect.any(Object),
        signal: expect.any(Object),
      })
    );
  });

  it('sanitizes city name input', async () => {
    const mockWeatherData = {
      name: 'Dhaka',
      main: { temp: 30 },
      weather: [
        { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
    };

    // Ensure fetch is properly mocked for this test
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherData,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=  Dhaka  &units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWeatherData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Dhaka'),
      expect.objectContaining({
        headers: expect.any(Object),
        signal: expect.any(Object),
      })
    );
  });

  it('handles timeout errors', async () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
    );

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Request timeout');
  });

  it('handles CORS preflight requests', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather'),
      { method: 'OPTIONS' }
    );

    const response = await OPTIONS(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, POST, OPTIONS'
    );
  });

  it('includes security headers in response', async () => {
    const mockWeatherData = {
      name: 'Dhaka',
      main: { temp: 30 },
      weather: [
        { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
    };

    // Ensure fetch is properly mocked for this test
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherData,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
  });

  it('handles API key rotation', async () => {
    const mockApiKeyManager = {
      getNextKey: jest
        .fn()
        .mockReturnValueOnce('key1')
        .mockReturnValueOnce('key2'),
      recordError: jest.fn(),
      recordSuccess: jest.fn(),
      getActiveKeyCount: jest.fn().mockReturnValue(2),
    };

    // Update the global mock for this test
    const apiKeyManagerModule = require('../../../utils/apiKeyManager');
    apiKeyManagerModule.default.getNextKey = mockApiKeyManager.getNextKey;
    apiKeyManagerModule.default.recordError = mockApiKeyManager.recordError;
    apiKeyManagerModule.default.recordSuccess = mockApiKeyManager.recordSuccess;
    apiKeyManagerModule.default.getActiveKeyCount =
      mockApiKeyManager.getActiveKeyCount;

    const mockWeatherData = {
      name: 'Dhaka',
      main: { temp: 30 },
      weather: [
        { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
    };

    // Mock fetch to return 401 first (invalid key), then success
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherData,
      });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    console.log('API rotation test - Response status:', response.status);
    console.log('API rotation test - Response data:', data);
    console.log(
      'API rotation test - Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    // The first API key fails with 401, so it should try the second key
    expect(response.status).toBe(200);
    expect(data).toEqual(mockWeatherData);
    expect(mockApiKeyManager.getNextKey).toHaveBeenCalledTimes(2);
  });

  it('handles rate limiting', async () => {
    // Mock the API key manager to simulate an error
    const apiKeyManagerModule = require('../../../utils/apiKeyManager');
    apiKeyManagerModule.default.getNextKey.mockImplementation(() => {
      throw new Error('No API keys available');
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
    );

    const response = await GET(request);
    const data = await response.json();

    console.log('Rate limiting test - Response status:', response.status);
    console.log('Rate limiting test - Response data:', data);

    expect(response.status).toBe(503);
    expect(data.error).toBe('Weather service temporarily unavailable');
  });
});

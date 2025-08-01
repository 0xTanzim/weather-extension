// Mock the API key manager FIRST, before any other imports
jest.mock('../../../utils/apiKeyManager', () => ({
  default: {
    getNextKey: jest.fn().mockReturnValue('test-api-key'),
    recordError: jest.fn(),
    recordSuccess: jest.fn(),
    getActiveKeyCount: jest.fn().mockReturnValue(1),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '../weather/route';

describe('Debug Test', () => {
  beforeEach(() => {
    // Mock fetch
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle a simple request', async () => {
    try {
      // Mock successful response with proper weather data structure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Dhaka',
          main: { temp: 30 },
          weather: [
            { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
          ],
        }),
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
      );

      const response = await GET(request);
      console.log('Response status:', response.status);

      try {
        const data = await response.json();
        console.log('Response data:', data);
      } catch (error) {
        console.log('Failed to parse response:', error);
      }

      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});

import { NextRequest } from 'next/server';
import { GET } from '../weather/route';

describe('Simple Weather API Test', () => {
  beforeEach(() => {
    // Mock fetch
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle a basic request', async () => {
    try {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Dhaka',
          main: { temp: 30 },
          weather: [{ description: 'clear sky', icon: '01d' }],
        }),
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/weather?city=Dhaka&units=metric')
      );

      const response = await GET(request);
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});

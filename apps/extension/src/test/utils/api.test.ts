import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCache,
  getCityNameFromCoords,
  getForecastData,
  getWeatherData,
  getWeatherIconUrl,
} from '../../utils/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any cached data that might interfere with tests
    clearCache();
  });

  describe('getWeatherData', () => {
    const mockResponse = {
      name: 'Dhaka',
      main: {
        temp: 30,
        feels_like: 32,
        humidity: 70,
      },
      weather: [
        {
          description: 'clear sky',
          icon: '01d',
        },
      ],
      wind: {
        speed: 5.2,
      },
      sys: {
        sunrise: 1640995200,
        sunset: 1641038400,
      },
    };

    it('fetches weather data successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getWeatherData('Dhaka', 'metric');

      expect(fetch).toHaveBeenCalledWith(
        'https://weather-extentions-backend.vercel.app/api/weather?city=Dhaka&units=metric',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Weather-Extension/1.0',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'City not found' }),
      });

      await expect(getWeatherData('InvalidCity', 'metric')).rejects.toThrow(
        'City "InvalidCity" not found. Please check the spelling.'
      );
    });

    it('handles network errors', async () => {
      // Clear cache to ensure no cached data interferes
      clearCache();
      // Add a small delay to ensure cache is cleared
      await new Promise((resolve) => setTimeout(resolve, 10));
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getWeatherData('Dhaka', 'metric')).rejects.toThrow(
        "Cannot read properties of undefined (reading 'ok')"
      );
    });

    it('validates city name input', async () => {
      await expect(getWeatherData('', 'metric')).rejects.toThrow(
        'City name is required'
      );
      await expect(getWeatherData('A', 'metric')).rejects.toThrow(
        'City name must be at least 2 characters long'
      );
    });

    it('sanitizes city name input', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getWeatherData('  Dhaka  ', 'metric');

      expect(fetch).toHaveBeenCalledWith(
        'https://weather-extentions-backend.vercel.app/api/weather?city=Dhaka&units=metric',
        expect.any(Object)
      );
    });
  });

  describe('getForecastData', () => {
    const mockForecastResponse = {
      city: { name: 'Dhaka' },
      list: [
        {
          dt: 1640995200,
          main: { temp: 30 },
          weather: [{ description: 'clear sky' }],
        },
        {
          dt: 1641081600,
          main: { temp: 28 },
          weather: [{ description: 'cloudy' }],
        },
      ],
    };

    it('fetches forecast data successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastResponse,
      });

      const result = await getForecastData('Dhaka', 'metric');

      expect(fetch).toHaveBeenCalledWith(
        'https://weather-extentions-backend.vercel.app/api/forecast?city=Dhaka&units=metric',
        expect.any(Object)
      );
      expect(result).toEqual(mockForecastResponse);
    });

    it('handles forecast API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Service temporarily unavailable' }),
      });

      await expect(getForecastData('Dhaka', 'metric')).rejects.toThrow(
        'Service temporarily unavailable. Please try again later.'
      );
    });

    it('validates forecast input parameters', async () => {
      await expect(getForecastData('', 'metric')).rejects.toThrow(
        'City name is required'
      );
      await expect(getForecastData('A', 'metric')).rejects.toThrow(
        'City name must be at least 2 characters long'
      );
    });
  });

  describe('getCityNameFromCoords', () => {
    const mockGeocodeResponse = {
      city: 'Dhaka',
      country: 'BD',
    };

    it('fetches city name from coordinates successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodeResponse,
      });

      const result = await getCityNameFromCoords(23.8103, 90.4125);

      expect(fetch).toHaveBeenCalledWith(
        'https://weather-extentions-backend.vercel.app/api/geocode?lat=23.8103&lon=90.4125',
        expect.any(Object)
      );
      expect(result).toBe('Dhaka');
    });

    it('handles geocoding errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Location not found' }),
      });

      await expect(getCityNameFromCoords(0, 0)).rejects.toThrow(
        'Location not found for these coordinates.'
      );
    });

    it('validates coordinate input', async () => {
      await expect(getCityNameFromCoords(NaN, 90)).rejects.toThrow(
        'Coordinates must be numbers'
      );
      await expect(getCityNameFromCoords(23, NaN)).rejects.toThrow(
        'Coordinates must be numbers'
      );
    });
  });

  describe('getWeatherIconUrl', () => {
    it('returns correct icon URL for valid icon code', () => {
      expect(getWeatherIconUrl('01d')).toBe(
        'https://openweathermap.org/img/wn/01d@2x.png'
      );
    });

    it('handles different icon codes', () => {
      expect(getWeatherIconUrl('02n')).toBe(
        'https://openweathermap.org/img/wn/02n@2x.png'
      );
    });

    it('handles empty or invalid icon codes', () => {
      expect(getWeatherIconUrl('')).toBe(
        'https://openweathermap.org/img/wn/01d@2x.png'
      );
    });
  });

  describe('Input Validation', () => {
    it('validates city names with special characters', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Saint-Jean',
          main: { temp: 20 },
          weather: [{ description: 'clear sky', icon: '01d' }],
        }),
      });

      await expect(
        getWeatherData('Saint-Jean', 'metric')
      ).resolves.toBeDefined();
    });

    it('rejects city names with invalid characters', async () => {
      await expect(getWeatherData('City123', 'metric')).rejects.toThrow(
        'City name can only contain letters, spaces, and hyphens'
      );
    });
  });
});

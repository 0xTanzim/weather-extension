import { OpenWeatherData, OpenWeatherTempScale } from '../types/open_weather';
import { clientCache } from './cache';

// Your Vercel backend URL - replace with your actual URL after deployment
// const BACKEND_URL = 'https://weather-extentions-backend.vercel.app';
const BACKEND_URL = 'http://localhost:3000';

// Security configuration
const SECURITY_CONFIG = {
  MAX_CITY_LENGTH: 100,
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  ALLOWED_UNITS: ['metric', 'imperial', 'standard'] as const,
};

// Input validation and sanitization
function validateAndSanitizeCity(city: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: 'City name is required' };
  }

  const trimmed = city.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'City name cannot be empty' };
  }

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'City name must be at least 2 characters long',
    };
  }

  if (trimmed.length > SECURITY_CONFIG.MAX_CITY_LENGTH) {
    return { valid: false, error: 'City name too long' };
  }

  // Check for potentially malicious characters
  const maliciousPattern =
    /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (maliciousPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid characters in city name' };
  }

  // Check for invalid characters (only letters, spaces, and hyphens allowed)
  const validPattern = /^[a-zA-Z\s\-]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'City name can only contain letters, spaces, and hyphens',
    };
  }

  // Sanitize input
  const sanitized = trimmed
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, SECURITY_CONFIG.MAX_CITY_LENGTH);

  return { valid: true, sanitized };
}

function validateUnits(units: OpenWeatherTempScale): boolean {
  return SECURITY_CONFIG.ALLOWED_UNITS.includes(units);
}

function validateCoordinates(
  lat: number,
  lon: number
): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { valid: false, error: 'Invalid coordinate types' };
  }

  if (isNaN(lat) || isNaN(lon)) {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
}

// Secure fetch with timeout and retry logic
async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SECURITY_CONFIG.REQUEST_TIMEOUT
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Weather-Extension/1.0',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = SECURITY_CONFIG.MAX_RETRIES
): Promise<Response> {
  try {
    return await secureFetch(url, options);
  } catch (error) {
    if (retries > 0) {
      const delay = Math.pow(2, SECURITY_CONFIG.MAX_RETRIES - retries) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const getWeatherData = async (
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> => {
  try {
    // Input validation
    const cityValidation = validateAndSanitizeCity(city);
    if (!cityValidation.valid) {
      throw new Error(cityValidation.error);
    }

    if (!validateUnits(tempScale)) {
      throw new Error('Invalid temperature scale');
    }

    if (!cityValidation.sanitized) {
      throw new Error('City validation failed');
    }
    const sanitized = cityValidation.sanitized!;

    // Check client-side cache first
    const cacheKey = clientCache.getWeatherKey(sanitized, tempScale);
    const cachedData = clientCache.getWeather(cacheKey);
    if (cachedData) {
      console.log(`Using cached weather data for ${sanitized}`);
      return cachedData;
    }

    // Construct URL with proper encoding
    const url = new URL(`${BACKEND_URL}/api/weather`);
    url.searchParams.set('city', sanitized);
    url.searchParams.set('units', tempScale);

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid request');
      }

      if (response.status === 404) {
        throw new Error(
          `City "${sanitized}" not found. Please check the spelling.`
        );
      }

      if (response.status >= 500) {
        throw new Error(
          'Service temporarily unavailable. Please try again later.'
        );
      }

      throw new Error(
        errorData.error || `Failed to fetch weather data (${response.status})`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from weather service');
    }

    // Check for required fields
    if (!data.name || !data.main || !data.weather) {
      throw new Error('Incomplete weather data received');
    }

    // Cache the successful response
    clientCache.setWeather(cacheKey, data);

    return data;
  } catch (error) {
    // Preserve the original error message for network errors
    if (error instanceof Error) {
      if (
        !error.message.includes('City') &&
        !error.message.includes('not found')
      ) {
        console.error('Weather API error:', error); // Log only critical errors
      }
      throw error; // Re-throw the original error
    }
    throw error;
  }
};

export const getForecastData = async (
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<any> => {
  try {
    // Input validation
    const cityValidation = validateAndSanitizeCity(city);
    if (!cityValidation.valid) {
      throw new Error(cityValidation.error);
    }

    if (!validateUnits(tempScale)) {
      throw new Error('Invalid temperature scale');
    }

    if (!cityValidation.sanitized) {
      throw new Error('City validation failed');
    }
    const sanitized = cityValidation.sanitized!;

    // Check client-side cache first
    const cacheKey = clientCache.getForecastKey(sanitized, tempScale);
    const cachedData = clientCache.getForecast(cacheKey);
    if (cachedData) {
      console.log(`Using cached forecast data for ${sanitized}`);
      return cachedData;
    }

    // Construct URL with proper encoding
    const url = new URL(`${BACKEND_URL}/api/forecast`);
    url.searchParams.set('city', sanitized);
    url.searchParams.set('units', tempScale);

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid request');
      }

      if (response.status === 404) {
        throw new Error(
          `City "${sanitized}" not found. Please check the spelling.`
        );
      }

      if (response.status >= 500) {
        throw new Error(
          'Service temporarily unavailable. Please try again later.'
        );
      }

      throw new Error(
        errorData.error || `Failed to fetch forecast data (${response.status})`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from forecast service');
    }

    // Check for required fields
    if (!data.list || !Array.isArray(data.list)) {
      throw new Error('Incomplete forecast data received');
    }

    // Cache the successful response
    clientCache.setForecast(cacheKey, data);

    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('City') &&
      !error.message.includes('not found')
    ) {
      console.error('Forecast API error:', error); // Log only critical errors
    }
    throw error;
  }
};

export const getCityNameFromCoords = async (
  lat: number,
  lon: number
): Promise<string> => {
  try {
    // Input validation
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      throw new Error(coordValidation.error);
    }

    // Check client-side cache first
    const cacheKey = clientCache.getGeocodeKey(lat, lon);
    const cachedData = clientCache.getGeocode(cacheKey);
    if (cachedData) {
      console.log(`Using cached geocode data for (${lat}, ${lon})`);
      return cachedData.city;
    }

    // Construct URL with proper encoding
    const url = new URL(`${BACKEND_URL}/api/geocode`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid coordinates');
      }

      if (response.status === 404) {
        throw new Error('Location not found for these coordinates.');
      }

      if (response.status >= 500) {
        throw new Error(
          'Service temporarily unavailable. Please try again later.'
        );
      }

      throw new Error(
        errorData.error || `Failed to get city name (${response.status})`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object' || !data.city) {
      throw new Error('Invalid response from geocoding service');
    }

    // Cache the successful response
    clientCache.setGeocode(cacheKey, data);

    return data.city;
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('Location') &&
      !error.message.includes('not found')
    ) {
      console.error('Geocoding API error:', error); // Log only critical errors
    }
    throw error;
  }
};

export const fetchWeatherData = async (
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> => {
  return getWeatherData(city, tempScale);
};

export function getWeatherIconUrl(iconCode: string): string {
  // Default to clear sky icon if no icon code provided
  const defaultIcon = '01d';
  const icon = iconCode && iconCode.trim() ? iconCode.trim() : defaultIcon;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Export cache utilities for debugging
export const getCacheStats = () => clientCache.getStats();
export const clearCache = () => clientCache.clear();
export const exportCache = () => clientCache.exportCache();

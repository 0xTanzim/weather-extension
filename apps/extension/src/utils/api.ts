import { OpenWeatherData, OpenWeatherTempScale } from '../types/open_weather';

// Your Vercel backend URL - replace with your actual URL after deployment
const BACKEND_URL = 'https://weather-extentions-backend.vercel.app';

// Security configuration
const SECURITY_CONFIG = {
  MAX_CITY_LENGTH: 100,
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  ALLOWED_UNITS: ['metric', 'imperial', 'standard'] as const,
};

// Input validation and sanitization
function validateAndSanitizeCity(city: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: 'City name is required' };
  }

  const trimmed = city.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'City name cannot be empty' };
  }

  if (trimmed.length > SECURITY_CONFIG.MAX_CITY_LENGTH) {
    return { valid: false, error: 'City name too long' };
  }

  // Check for potentially malicious characters
  const maliciousPattern = /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (maliciousPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid characters in city name' };
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

// Validate coordinates
function validateCoordinates(lat: number, lon: number): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  if (isNaN(lat) || isNaN(lon)) {
    return { valid: false, error: 'Invalid coordinates' };
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
async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), SECURITY_CONFIG.REQUEST_TIMEOUT);
  });

  const fetchPromise = fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Weather-Extension/1.0',
      ...options.headers,
    },
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= SECURITY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await secureFetch(url, options);
    } catch (error) {
      lastError = error as Error;

      if (attempt === SECURITY_CONFIG.MAX_RETRIES) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
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

    const sanitizedCity = cityValidation.sanitized!;

    // Construct URL with proper encoding
    const url = new URL(`${BACKEND_URL}/api/weather`);
    url.searchParams.set('city', sanitizedCity);
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
        throw new Error(`City "${sanitizedCity}" not found. Please check the spelling.`);
      }

      if (response.status >= 500) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }

      throw new Error(errorData.error || `Failed to fetch weather data (${response.status})`);
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

    return data;
  } catch (error) {
    // Only log critical errors, not user-facing ones
    if (error instanceof Error && !error.message.includes('City') && !error.message.includes('not found')) {
      console.error('Weather API error:', error);
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
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export const getCityNameFromCoords = async (lat: number, lon: number): Promise<string | null> => {
  try {
    // Input validation
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return null;
    }

    // Construct URL with proper encoding
    const url = new URL(`${BACKEND_URL}/api/geocode`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return null;
      }

      if (response.status === 404) {
        return null;
      }

      return null;
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      return null;
    }

    return data.city || null;
  } catch (error) {
    // Only log critical errors
    if (error instanceof Error && !error.message.includes('timeout')) {
      console.error('Geocoding error:', error);
    }
    return null;
  }
};

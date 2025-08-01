import { NextRequest, NextResponse } from 'next/server';
import apiKeyManager from '../../../utils/apiKeyManager';

// Rate limiting in memory (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cache configuration for HTTP headers
const CACHE_CONFIG = {
  // Forecast data cache duration (in seconds)
  FORECAST_CACHE_DURATION: 3600, // 1 hour - forecast doesn't change frequently
  // Error cache duration (cache errors briefly to avoid hammering bad keys)
  ERROR_CACHE_DURATION: 300, // 5 minutes
  // Rate limit cache duration
  RATE_LIMIT_CACHE: 60, // 1 minute
};

// Security configuration
const SECURITY_CONFIG = {
  MAX_CITY_LENGTH: 100,
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RATE_LIMIT: 60, // requests per minute
  RATE_LIMIT_WINDOW: 60000, // 1 minute
};

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= SECURITY_CONFIG.RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Input validation
function validateInput(
  city: string | null,
  units: string | null
): { valid: boolean; error?: string } {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: 'City parameter is required' };
  }

  const trimmed = city.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'City cannot be empty' };
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

  if (!units || !['metric', 'imperial', 'standard'].includes(units)) {
    return { valid: false, error: 'Invalid units parameter' };
  }

  return { valid: true };
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, SECURITY_CONFIG.MAX_CITY_LENGTH);
}

// HTTP Cache headers helper - This is what Vercel's CDN will use
function getCacheHeaders(
  cacheDuration: number = CACHE_CONFIG.FORECAST_CACHE_DURATION
) {
  const now = new Date();
  const expires = new Date(now.getTime() + cacheDuration * 1000);

  return {
    'Cache-Control': `public, max-age=${cacheDuration}, s-maxage=${cacheDuration}, stale-while-revalidate=300`,
    Expires: expires.toUTCString(),
    'Last-Modified': now.toUTCString(),
    ETag: `"forecast-${now.getTime()}"`,
    'X-Cache-Duration': cacheDuration.toString(),
  };
}

// No-cache headers for errors
function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': SECURITY_CONFIG.RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW
            ).toISOString(),
            ...getNoCacheHeaders(),
          },
        }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const units = searchParams.get('units');

    // Input validation
    const validation = validateInput(city, units);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        {
          status: 400,
          headers: getNoCacheHeaders(),
        }
      );
    }

    // Sanitize inputs
    const sanitizedCity = sanitizeInput(city!);
    const sanitizedUnits = units!;

    // Get API key using round-robin rotation
    const apiKey = apiKeyManager.getNextKey();

    // Build OpenWeather API URL for 5-day forecast
    const forecastUrl = new URL(
      'https://api.openweathermap.org/data/2.5/forecast'
    );
    forecastUrl.searchParams.set('q', sanitizedCity);
    forecastUrl.searchParams.set('units', sanitizedUnits);
    forecastUrl.searchParams.set('appid', apiKey);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SECURITY_CONFIG.REQUEST_TIMEOUT
    );

    const response = await fetch(forecastUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Weather-Extension-Backend/1.0',
      },
    });

    clearTimeout(timeoutId);

    // Handle different response status codes
    if (response.status === 401) {
      apiKeyManager.recordError(apiKey, 'Invalid API key');
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        {
          status: 503,
          headers: getNoCacheHeaders(),
        }
      );
    }

    if (response.status === 404) {
      // Cache 404 responses briefly to avoid hammering
      return NextResponse.json(
        { error: 'City not found' },
        {
          status: 404,
          headers: {
            ...getCacheHeaders(CACHE_CONFIG.ERROR_CACHE_DURATION),
            'X-Cache-Source': 'error-cache',
          },
        }
      );
    }

    if (response.status === 429) {
      apiKeyManager.recordError(apiKey, 'Rate limit exceeded');
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        {
          status: 503,
          headers: getNoCacheHeaders(),
        }
      );
    }

    if (response.status === 500) {
      apiKeyManager.recordError(apiKey, 'OpenWeather API error');
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        {
          status: 503,
          headers: getNoCacheHeaders(),
        }
      );
    }

    if (!response.ok) {
      apiKeyManager.recordError(apiKey, `HTTP ${response.status}`);
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        {
          status: 503,
          headers: getNoCacheHeaders(),
        }
      );
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (
      !data ||
      typeof data !== 'object' ||
      !data.list ||
      !Array.isArray(data.list)
    ) {
      apiKeyManager.recordError(apiKey, 'Invalid response structure');
      return NextResponse.json(
        { error: 'Invalid forecast data received' },
        {
          status: 500,
          headers: getNoCacheHeaders(),
        }
      );
    }

    // Process forecast data to get daily forecasts (every 24 hours)
    const dailyForecasts = [];
    const processedDays = new Set<string>();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();

      // Only include one forecast per day (around noon)
      if (
        !processedDays.has(dayKey) &&
        date.getHours() >= 12 &&
        date.getHours() <= 14
      ) {
        dailyForecasts.push({
          dt: item.dt,
          main: item.main,
          weather: item.weather,
          clouds: item.clouds,
          wind: item.wind,
          visibility: item.visibility,
          pop: item.pop,
          sys: item.sys,
          dt_txt: item.dt_txt,
        });
        processedDays.add(dayKey);
      }

      // Limit to 5 days
      if (dailyForecasts.length >= 5) {
        break;
      }
    }

    // If we don't have 5 days, fill with available data
    while (
      dailyForecasts.length < 5 &&
      data.list.length > dailyForecasts.length
    ) {
      const remainingItems = data.list.filter((item: any) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        return !processedDays.has(dayKey);
      });

      if (remainingItems.length > 0) {
        const item = remainingItems[0];
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();

        dailyForecasts.push({
          dt: item.dt,
          main: item.main,
          weather: item.weather,
          clouds: item.clouds,
          wind: item.wind,
          visibility: item.visibility,
          pop: item.pop,
          sys: item.sys,
          dt_txt: item.dt_txt,
        });
        processedDays.add(dayKey);
      } else {
        break;
      }
    }

    // Record successful request
    apiKeyManager.recordSuccess(apiKey);

    // Add security headers and timing info
    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        city: data.city,
        list: dailyForecasts,
      },
      {
        headers: {
          ...getCacheHeaders(),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Processing-Time': processingTime.toString(),
          'X-Cache-Source': 'vercel-cdn',
          'X-API-Keys-Available': apiKeyManager.getActiveKeyCount().toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      }
    );
  } catch (error) {
    console.error('Forecast API error:', error);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        {
          status: 408,
          headers: getNoCacheHeaders(),
        }
      );
    }

    // Generic error response (don't expose internal details)
    return NextResponse.json(
      { error: 'Weather service temporarily unavailable' },
      {
        status: 503,
        headers: getNoCacheHeaders(),
      }
    );
  }
}

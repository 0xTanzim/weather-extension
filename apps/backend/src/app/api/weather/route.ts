import { NextRequest, NextResponse } from 'next/server';
import apiKeyManager from '../../../utils/apiKeyManager';

// Rate limiting in memory (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
    rateLimitMap.set(ip, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= SECURITY_CONFIG.RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Input validation
function validateInput(city: string | null, units: string | null): { valid: boolean; error?: string } {
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
  const maliciousPattern = /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (maliciousPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid characters in city name' };
  }

  if (!units || !['metric', 'imperial', 'standard'].includes(units)) {
    return { valid: false, error: 'Invalid units parameter' };
  }

  return { valid: true };
}

// Sanitize input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, SECURITY_CONFIG.MAX_CITY_LENGTH);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

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
            'X-RateLimit-Reset': new Date(Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW).toISOString(),
          }
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
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedCity = sanitizeInput(city!);
    const sanitizedUnits = units!;

    // Get API key using round-robin rotation
    const apiKey = apiKeyManager.getNextKey();

    // Build OpenWeather API URL
    const weatherUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
    weatherUrl.searchParams.set('q', sanitizedCity);
    weatherUrl.searchParams.set('units', sanitizedUnits);
    weatherUrl.searchParams.set('appid', apiKey);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(weatherUrl.toString(), {
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
        { status: 503 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    if (response.status === 429) {
      apiKeyManager.recordError(apiKey, 'Rate limit exceeded');
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        { status: 503 }
      );
    }

    if (response.status === 500) {
      apiKeyManager.recordError(apiKey, 'OpenWeather API error');
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      apiKeyManager.recordError(apiKey, `HTTP ${response.status}`);
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object' || !data.main || !data.weather) {
      apiKeyManager.recordError(apiKey, 'Invalid response structure');
      return NextResponse.json(
        { error: 'Invalid weather data received' },
        { status: 500 }
      );
    }

    // Record successful request
    apiKeyManager.recordSuccess(apiKey);

    // Add security headers and timing info
    const processingTime = Date.now() - startTime;

    return NextResponse.json(data, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Processing-Time': processingTime.toString(),
        'X-API-Keys-Available': apiKeyManager.getActiveKeyCount().toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });

  } catch (error) {
    console.error('Weather API error:', error);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    // Generic error response (don't expose internal details)
    return NextResponse.json(
      { error: 'Weather service temporarily unavailable' },
      { status: 503 }
    );
  }
}

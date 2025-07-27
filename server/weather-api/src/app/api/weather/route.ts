import { NextRequest } from 'next/server';

// Rate limiting in memory (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_CITY_LENGTH: 100,
  MAX_UNITS_LENGTH: 10,
  ALLOWED_UNITS: ['metric', 'imperial', 'kelvin'],
  REQUEST_TIMEOUT: 10000, // 10 seconds
};

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}

// Input validation
function validateInput(city: string | null, units: string | null): { valid: boolean; error?: string } {
  if (!city) {
    return { valid: false, error: 'City parameter is required' };
  }

  if (typeof city !== 'string') {
    return { valid: false, error: 'City must be a string' };
  }

  if (city.length > SECURITY_CONFIG.MAX_CITY_LENGTH) {
    return { valid: false, error: 'City name too long' };
  }

  // Check for potentially malicious characters
  const maliciousPattern = /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (maliciousPattern.test(city)) {
    return { valid: false, error: 'Invalid characters in city name' };
  }

  if (units && !SECURITY_CONFIG.ALLOWED_UNITS.includes(units)) {
    return { valid: false, error: 'Invalid units parameter' };
  }

  return { valid: true };
}

// Sanitize input
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, SECURITY_CONFIG.MAX_CITY_LENGTH);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Enable CORS for Chrome extension
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=()',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || 
               'unknown';
    
    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...corsHeaders,
          },
        }
      );
    }

    // Request timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), SECURITY_CONFIG.REQUEST_TIMEOUT);
    });

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const units = searchParams.get('units') || 'metric';

    // Input validation
    const validation = validateInput(city, units);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Sanitize inputs
    const sanitizedCity = sanitizeInput(city!);
    const sanitizedUnits = SECURITY_CONFIG.ALLOWED_UNITS.includes(units) ? units : 'metric';

    const API_KEY = process.env.OPEN_WEATHER_API_KEY;
    
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Construct URL with proper encoding
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('q', sanitizedCity);
    url.searchParams.set('units', sanitizedUnits);
    url.searchParams.set('appid', API_KEY);
    
    // Fetch with timeout
    const fetchPromise = fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Weather-Extension-Backend/1.0',
        'Accept': 'application/json',
      },
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Don't expose internal errors to client
      const clientError = response.status === 401 ? 'Invalid API key' :
                         response.status === 404 ? 'City not found' :
                         'Failed to fetch weather data';
      
      return new Response(
        JSON.stringify({
          error: clientError,
          status: response.status,
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from weather API');
    }

    // Add security headers and timing info
    const responseTime = Date.now() - startTime;
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`,
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Weather API error:', error);
    
    // Don't expose internal errors
    const clientMessage = error instanceof Error && error.message.includes('timeout') 
      ? 'Request timeout' 
      : 'Internal server error';
    
    return new Response(
      JSON.stringify({
        error: clientMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
} 
import { NextRequest } from 'next/server';

// Rate limiting in memory (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_COORD_LENGTH: 20,
  MIN_LAT: -90,
  MAX_LAT: 90,
  MIN_LON: -180,
  MAX_LON: 180,
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

// Input validation for coordinates
function validateCoordinates(lat: string | null, lon: string | null): { valid: boolean; error?: string } {
  if (!lat || !lon) {
    return { valid: false, error: 'Latitude and longitude parameters are required' };
  }

  if (typeof lat !== 'string' || typeof lon !== 'string') {
    return { valid: false, error: 'Coordinates must be strings' };
  }

  if (lat.length > SECURITY_CONFIG.MAX_COORD_LENGTH || lon.length > SECURITY_CONFIG.MAX_COORD_LENGTH) {
    return { valid: false, error: 'Coordinates too long' };
  }

  // Check for potentially malicious characters
  const maliciousPattern = /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (maliciousPattern.test(lat) || maliciousPattern.test(lon)) {
    return { valid: false, error: 'Invalid characters in coordinates' };
  }

  // Validate coordinate ranges
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return { valid: false, error: 'Invalid coordinate format' };
  }

  if (latNum < SECURITY_CONFIG.MIN_LAT || latNum > SECURITY_CONFIG.MAX_LAT) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lonNum < SECURITY_CONFIG.MIN_LON || lonNum > SECURITY_CONFIG.MAX_LON) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
}

// Sanitize coordinate input
function sanitizeCoordinate(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, SECURITY_CONFIG.MAX_COORD_LENGTH);
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
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Input validation
    const validation = validateCoordinates(lat, lon);
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
    const sanitizedLat = sanitizeCoordinate(lat!);
    const sanitizedLon = sanitizeCoordinate(lon!);

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
    const url = new URL('https://api.openweathermap.org/geo/1.0/reverse');
    url.searchParams.set('lat', sanitizedLat);
    url.searchParams.set('lon', sanitizedLon);
    url.searchParams.set('limit', '1');
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
                         response.status === 404 ? 'Location not found' :
                         'Failed to get city name';
      
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
    if (!Array.isArray(data)) {
      throw new Error('Invalid response from geocoding API');
    }

    if (data.length > 0) {
      const location = data[0];
      
      // Validate location data
      if (!location || typeof location !== 'object') {
        throw new Error('Invalid location data');
      }

      const responseTime = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({ 
          city: location.name || null,
          country: location.country || null,
          state: location.state || null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${responseTime}ms`,
            ...corsHeaders,
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'City not found for these coordinates' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    
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
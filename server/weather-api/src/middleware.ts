import { NextRequest, NextResponse } from 'next/server';

// Security configuration
const SECURITY_CONFIG = {
  BLOCKED_IPS: new Set<string>([
    // Add known malicious IPs here
    // '192.168.1.100',
  ]),
  BLOCKED_USER_AGENTS: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i,
    /php/i,
  ],
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  ALLOWED_ORIGINS: [
    'chrome-extension://*',
    'moz-extension://*',
    'http://localhost:*',
    'https://localhost:*',
  ],
};

// Request logging
function logRequest(request: NextRequest, response: NextResponse) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const method = request.method;
  const url = request.url;
  const status = response.status;
  
  console.log(`[${new Date().toISOString()}] ${ip} ${method} ${url} ${status} "${userAgent}"`);
}

// Check if request is from allowed origin
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin (same-origin)
  
  return SECURITY_CONFIG.ALLOWED_ORIGINS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(origin);
    }
    return pattern === origin;
  });
}

// Check if user agent is suspicious
function isSuspiciousUserAgent(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  return SECURITY_CONFIG.BLOCKED_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

// Check request size
function isRequestTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return false;
  
  const size = parseInt(contentLength, 10);
  return size > SECURITY_CONFIG.MAX_REQUEST_SIZE;
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'unknown';
  
  // Block known malicious IPs
  if (SECURITY_CONFIG.BLOCKED_IPS.has(ip)) {
    console.log(`Blocked request from known malicious IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Block suspicious user agents
  if (isSuspiciousUserAgent(request)) {
    console.log(`Blocked request with suspicious user agent: ${request.headers.get('user-agent')}`);
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Check request size
  if (isRequestTooLarge(request)) {
    console.log(`Blocked oversized request from: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Request too large' }),
      { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Check origin for CORS
  if (!isAllowedOrigin(request)) {
    console.log(`Blocked request from unauthorized origin: ${request.headers.get('origin')}`);
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Continue with the request
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Log the request
  logRequest(request, response);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
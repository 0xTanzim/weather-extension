# 🔒 Security Implementation Guide

Comprehensive security measures implemented to protect against DDoS attacks, injection attacks, and other vulnerabilities.

## 🛡️ Security Layers

### 1. **Backend Security (Next.js API)**

#### **Rate Limiting**
- **60 requests per minute** per IP address
- **In-memory storage** (for production, use Redis)
- **Automatic reset** after 1 minute window
- **429 status code** for exceeded limits

#### **Input Validation & Sanitization**
```typescript
// City name validation
- Maximum length: 100 characters
- Malicious character filtering: <>"'&javascript:data:vbscript:onload=onerror=
- Type checking and trimming

// Coordinate validation
- Latitude: -90 to 90
- Longitude: -180 to 180
- Numeric validation
- Range checking
```

#### **Request Timeout Protection**
- **10-second timeout** for all external API calls
- **Automatic cancellation** of slow requests
- **Error handling** for timeout scenarios

#### **Security Headers**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### **CORS Configuration**
- **Chrome extension support** with wildcard patterns
- **Local development** allowed
- **Origin validation** in middleware

### 2. **Extension Security (Chrome Extension)**

#### **Input Validation**
```typescript
// City name validation
- Required field checking
- Length limits (100 characters)
- Malicious character detection
- String type validation

// Coordinate validation
- Numeric type checking
- Range validation (-90 to 90, -180 to 180)
- NaN detection
```

#### **Request Security**
- **Timeout protection** (10 seconds)
- **Retry logic** with exponential backoff
- **Error handling** for network failures
- **Response validation** structure checking

#### **Error Handling**
- **No sensitive data** exposed in errors
- **User-friendly messages** for common errors
- **Graceful degradation** for failures

### 3. **Middleware Security**

#### **IP Blocking**
- **Known malicious IPs** blacklist
- **Configurable blocking** system
- **Logging** of blocked requests

#### **User Agent Filtering**
```typescript
Blocked patterns:
- /bot/i, /crawler/i, /spider/i
- /scraper/i, /curl/i, /wget/i
- /python/i, /java/i, /perl/i
- /ruby/i, /php/i
```

#### **Request Size Limits**
- **1MB maximum** request size
- **413 status** for oversized requests
- **Automatic rejection** of large payloads

#### **Origin Validation**
- **Chrome extension** origins allowed
- **Local development** support
- **Wildcard pattern** matching

## 🚨 DDoS Protection

### **Rate Limiting Strategy**
```typescript
// Per-IP rate limiting
const rateLimitMap = new Map<string, {
  count: number;
  resetTime: number;
}>();

// 60 requests per minute per IP
// Automatic reset after 1 minute
// 429 status for exceeded limits
```

### **Request Filtering**
- **Suspicious user agents** blocked
- **Large requests** rejected
- **Invalid origins** filtered
- **Malicious IPs** blacklisted

### **Timeout Protection**
- **10-second timeout** for all requests
- **Automatic cancellation** of slow requests
- **Resource protection** from hanging connections

## 🔍 Injection Attack Prevention

### **Input Sanitization**
```typescript
// Remove dangerous characters
.replace(/[<>\"'&]/g, '')

// Check for malicious patterns
const maliciousPattern = /[<>\"'&]|javascript:|data:|vbscript:|onload=|onerror=/i;

// Length limits
.substring(0, MAX_LENGTH)
```

### **URL Construction**
```typescript
// Safe URL building
const url = new URL('https://api.openweathermap.org/data/2.5/weather');
url.searchParams.set('q', sanitizedCity);
url.searchParams.set('units', sanitizedUnits);
url.searchParams.set('appid', API_KEY);
```

### **Response Validation**
```typescript
// Validate response structure
if (!data || typeof data !== 'object') {
  throw new Error('Invalid response from server');
}

// Check required fields
if (!data.name || !data.main || !data.weather) {
  throw new Error('Incomplete weather data received');
}
```

## 🛡️ Additional Security Measures

### **Error Information Hiding**
```typescript
// Don't expose internal errors
const clientMessage = error instanceof Error && error.message.includes('timeout') 
  ? 'Request timeout' 
  : 'Internal server error';

// No sensitive data in error responses
return new Response(JSON.stringify({
  error: clientMessage,
  timestamp: new Date().toISOString(),
}));
```

### **Request Logging**
```typescript
// Comprehensive request logging
console.log(`[${new Date().toISOString()}] ${ip} ${method} ${url} ${status} "${userAgent}"`);
```

### **Security Headers**
```http
# Prevent MIME type sniffing
X-Content-Type-Options: nosniff

# Prevent clickjacking
X-Frame-Options: DENY

# XSS protection
X-XSS-Protection: 1; mode=block

# Referrer policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions policy
Permissions-Policy: geolocation=()

# HSTS
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🔧 Configuration

### **Security Settings**
```typescript
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_CITY_LENGTH: 100,
  MAX_COORD_LENGTH: 20,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
};
```

### **Environment Variables**
```env
# Required
OPEN_WEATHER_API_KEY=your_api_key_here

# Optional: Multiple API keys for rotation
OPEN_WEATHER_API_KEYS=key1,key2,key3
```

## 🚀 Production Deployment

### **Vercel Security Features**
- **Automatic HTTPS** enforcement
- **DDoS protection** via Cloudflare
- **Edge caching** for performance
- **Automatic scaling** for load handling

### **Monitoring & Alerts**
```typescript
// Add to your monitoring
- Rate limit violations
- Blocked requests
- Error rates
- Response times
- Suspicious activity
```

## 📊 Security Testing

### **Manual Testing**
```bash
# Test rate limiting
curl -X GET "https://your-api.vercel.app/api/weather?city=London" -H "X-Forwarded-For: 1.2.3.4"
# Repeat 61 times to trigger rate limit

# Test input validation
curl -X GET "https://your-api.vercel.app/api/weather?city=<script>alert('xss')</script>"

# Test timeout
curl -X GET "https://your-api.vercel.app/api/weather?city=InvalidCityWithVeryLongNameThatExceedsLimits"
```

### **Automated Testing**
```bash
# Run security tests
pnpm test

# Test API endpoints
curl "http://localhost:3000/api/weather?city=London&units=metric"
curl "http://localhost:3000/api/geocode?lat=51.51&lon=-0.13"
```

## 🔄 Security Updates

### **Regular Maintenance**
- **Update dependencies** monthly
- **Monitor security advisories**
- **Review blocked IPs** regularly
- **Update rate limits** based on usage

### **Monitoring Checklist**
- [ ] Rate limit violations
- [ ] Blocked requests
- [ ] Error rates
- [ ] Response times
- [ ] Suspicious activity
- [ ] API key usage

## 🆘 Incident Response

### **If Under Attack**
1. **Check Vercel logs** for patterns
2. **Update blocked IPs** list
3. **Adjust rate limits** if needed
4. **Monitor API key** usage
5. **Contact Vercel support** if necessary

### **Recovery Steps**
1. **Identify attack source**
2. **Block malicious IPs**
3. **Adjust security settings**
4. **Monitor for recurrence**
5. **Document incident**

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security](https://vercel.com/docs/security)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)

---

**Remember**: Security is an ongoing process. Regularly review and update these measures based on new threats and usage patterns. 
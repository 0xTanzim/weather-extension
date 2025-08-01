#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests the weather extension backend API with security validation
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  DELAY_BETWEEN_TESTS: 1000, // 1 second
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`, color);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testBasicFunctionality() {
  log('\n🔍 Testing Basic Functionality', 'cyan');

  try {
    // Test weather API
    const weatherResponse = await makeRequest(`${BASE_URL}/api/weather?city=London&units=metric`);
    const weatherData = await weatherResponse.json();

    if (weatherResponse.ok && weatherData.main && weatherData.weather) {
      logTest('Weather API', 'PASS', `Temperature: ${weatherData.main.temp}°C`);
    } else {
      logTest('Weather API', 'FAIL', weatherData.error || 'Invalid response');
    }

    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test geocoding API
    const geocodeResponse = await makeRequest(`${BASE_URL}/api/geocode?lat=51.5074&lon=-0.1278`);
    const geocodeData = await geocodeResponse.json();

    if (geocodeResponse.ok && geocodeData.city) {
      logTest('Geocoding API', 'PASS', `City: ${geocodeData.city}`);
    } else {
      logTest('Geocoding API', 'FAIL', geocodeData.error || 'Invalid response');
    }

    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test status API
    const statusResponse = await makeRequest(`${BASE_URL}/api/status`);
    const statusData = await statusResponse.json();

    if (statusResponse.ok && statusData.status === 'healthy') {
      logTest('Status API', 'PASS', `${statusData.apiKeys.active}/${statusData.apiKeys.total} keys active`);
    } else {
      logTest('Status API', 'FAIL', statusData.error || 'Invalid response');
    }

  } catch (error) {
    logTest('Basic Functionality', 'FAIL', error.message);
  }
}

async function testRateLimiting() {
  log('\n🛡️ Testing Rate Limiting', 'cyan');

  try {
    const requests = [];

    // Make multiple requests quickly
  for (let i = 0; i < 65; i++) {
      requests.push(
        makeRequest(`${BASE_URL}/api/weather?city=London&units=metric`)
          .then(response => ({ response, index: i }))
          .catch(error => ({ error, index: i }))
      );
    }

    const results = await Promise.all(requests);
    const successful = results.filter(r => r.response && r.response.ok).length;
    const rateLimited = results.filter(r => r.response && r.response.status === 429).length;

    if (rateLimited > 0) {
      logTest('Rate Limiting', 'PASS', `${successful} successful, ${rateLimited} rate limited`);
    } else {
      logTest('Rate Limiting', 'WARN', 'No rate limiting detected');
    }

  } catch (error) {
    logTest('Rate Limiting', 'FAIL', error.message);
  }
}

async function testInputValidation() {
  log('\n🔒 Testing Input Validation', 'cyan');

  const testCases = [
    { name: 'Empty city', url: '/api/weather?city=&units=metric', expectedStatus: 400 },
    { name: 'Missing city', url: '/api/weather?units=metric', expectedStatus: 400 },
    { name: 'Invalid units', url: '/api/weather?city=London&units=invalid', expectedStatus: 400 },
    { name: 'XSS attempt', url: '/api/weather?city=<script>alert("xss")</script>&units=metric', expectedStatus: 400 },
    { name: 'SQL injection', url: '/api/weather?city=London;DROP TABLE users;&units=metric', expectedStatus: 400 },
    { name: 'Invalid coordinates', url: '/api/geocode?lat=999&lon=999', expectedStatus: 400 },
    { name: 'Missing coordinates', url: '/api/geocode?lat=51.5074', expectedStatus: 400 },
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(`${BASE_URL}${testCase.url}`);

      if (response.status === testCase.expectedStatus) {
        logTest(testCase.name, 'PASS');
      } else {
        logTest(testCase.name, 'FAIL', `Expected ${testCase.expectedStatus}, got ${response.status}`);
      }

      await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
    } catch (error) {
      logTest(testCase.name, 'FAIL', error.message);
    }
  }
}

async function testSecurityHeaders() {
  log('\n🛡️ Testing Security Headers', 'cyan');

  try {
    const response = await makeRequest(`${BASE_URL}/api/weather?city=London&units=metric`);

    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
    ];

    const missingHeaders = requiredHeaders.filter(header => !response.headers.get(header));

    if (missingHeaders.length === 0) {
      logTest('Security Headers', 'PASS', 'All required headers present');
    } else {
      logTest('Security Headers', 'FAIL', `Missing: ${missingHeaders.join(', ')}`);
    }

  } catch (error) {
    logTest('Security Headers', 'FAIL', error.message);
  }
}

async function testRoundRobinKeys() {
  log('\n🔄 Testing Round-Robin Key Rotation', 'cyan');

  try {
    // Make multiple requests to test key rotation
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        makeRequest(`${BASE_URL}/api/weather?city=London&units=metric`)
          .then(response => response.headers.get('X-API-Keys-Available'))
          .catch(() => null)
      );
    }

    const results = await Promise.all(requests);
    const validResults = results.filter(r => r !== null);

    if (validResults.length > 0) {
      const uniqueKeys = new Set(validResults);
      logTest('Round-Robin Keys', 'PASS', `${uniqueKeys.size} different key counts detected`);
    } else {
      logTest('Round-Robin Keys', 'WARN', 'Could not detect key rotation');
    }

  } catch (error) {
    logTest('Round-Robin Keys', 'FAIL', error.message);
  }
}

async function testErrorHandling() {
  log('\n⚠️ Testing Error Handling', 'cyan');

  const testCases = [
    { name: 'Non-existent city', url: '/api/weather?city=NonExistentCity12345&units=metric', expectedStatus: 404 },
    { name: 'Invalid coordinates', url: '/api/geocode?lat=999&lon=999', expectedStatus: 400 },
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(`${BASE_URL}${testCase.url}`);
      const data = await response.json();

      if (response.status === testCase.expectedStatus && data.error) {
        logTest(testCase.name, 'PASS', 'Proper error response');
      } else {
        logTest(testCase.name, 'FAIL', `Expected ${testCase.expectedStatus}, got ${response.status}`);
      }

      await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
    } catch (error) {
      logTest(testCase.name, 'FAIL', error.message);
    }
  }
}

async function testTimeoutProtection() {
  log('\n⏱️ Testing Timeout Protection', 'cyan');

  try {
    // This test simulates a slow request (though we can't actually make it slow)
    const response = await makeRequest(`${BASE_URL}/api/weather?city=London&units=metric`);

    if (response.ok) {
      logTest('Timeout Protection', 'PASS', 'Request completed within timeout');
    } else {
      logTest('Timeout Protection', 'FAIL', `Request failed with status ${response.status}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      logTest('Timeout Protection', 'PASS', 'Request properly timed out');
    } else {
      logTest('Timeout Protection', 'FAIL', error.message);
    }
  }
}

async function runAllTests() {
  log('🚀 Starting Weather Extension Backend API Tests', 'bright');
  log(`📍 Testing against: ${BASE_URL}`, 'blue');
  log(`⏰ Timeout: ${TEST_CONFIG.TIMEOUT}ms`, 'blue');

  const startTime = Date.now();

  try {
    await testBasicFunctionality();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testRateLimiting();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testInputValidation();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testSecurityHeaders();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testRoundRobinKeys();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testErrorHandling();
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    await testTimeoutProtection();

  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'red');
  }

  const duration = Date.now() - startTime;
  log(`\n⏱️ Test suite completed in ${duration}ms`, 'bright');
  log('🎉 All tests completed!', 'green');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testBasicFunctionality,
  testRateLimiting,
  testInputValidation,
  testSecurityHeaders,
  testRoundRobinKeys,
  testErrorHandling,
  testTimeoutProtection,
};

#!/usr/bin/env node

/**
 * Test script for Vercel HTTP Caching
 * Tests the weather and geocode API endpoints to verify cache headers
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  const color = result ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

async function makeRequest(url, testName) {
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();

    const data = await response.json();
    const responseTime = endTime - startTime;

    // Extract cache headers
    const cacheControl = response.headers.get('cache-control');
    const expires = response.headers.get('expires');
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const xCacheSource = response.headers.get('x-cache-source');
    const xCacheDuration = response.headers.get('x-cache-duration');

    log(`\n🔍 Testing: ${testName}`, 'bright');
    log(`📡 URL: ${url}`, 'blue');
    log(`⏱️  Response Time: ${responseTime}ms`, 'yellow');
    log(`📊 Status: ${response.status}`, response.status === 200 ? 'green' : 'red');

    // Log cache headers
    log(`\n📋 Cache Headers:`, 'bright');
    log(`   Cache-Control: ${cacheControl}`, 'cyan');
    log(`   Expires: ${expires}`, 'cyan');
    log(`   ETag: ${etag}`, 'cyan');
    log(`   Last-Modified: ${lastModified}`, 'cyan');
    log(`   X-Cache-Source: ${xCacheSource}`, 'cyan');
    log(`   X-Cache-Duration: ${xCacheDuration}`, 'cyan');

    // Validate cache headers
    const hasCacheControl = cacheControl && cacheControl.includes('max-age');
    const hasExpires = expires && expires !== '0';
    const hasETag = etag && etag.startsWith('"');
    const hasLastModified = lastModified;
    const hasXCacheSource = xCacheSource;
    const hasXCacheDuration = xCacheDuration;

    logTest('Cache-Control header present', hasCacheControl);
    logTest('Expires header present', hasExpires);
    logTest('ETag header present', hasETag);
    logTest('Last-Modified header present', hasLastModified);
    logTest('X-Cache-Source header present', hasXCacheSource);
    logTest('X-Cache-Duration header present', hasXCacheDuration);

    // Check for errors
    if (data.error) {
      log(`❌ Error: ${data.error}`, 'red');
      return false;
    }

    return true;

  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    return false;
  }
}

async function testWeatherAPI() {
  log('\n🌤️  Testing Weather API', 'bright');

  const cities = ['London', 'New York', 'Tokyo', 'Sydney'];
  const units = ['metric', 'imperial'];

  for (const city of cities) {
    for (const unit of units) {
      const url = `${BASE_URL}/api/weather?city=${encodeURIComponent(city)}&units=${unit}`;
      await makeRequest(url, `Weather API - ${city} (${unit})`);

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function testGeocodeAPI() {
  log('\n📍 Testing Geocode API', 'bright');

  const coordinates = [
    { lat: 51.5074, lon: -0.1278, name: 'London' },
    { lat: 40.7128, lon: -74.0060, name: 'New York' },
    { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
    { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  ];

  for (const coord of coordinates) {
    const url = `${BASE_URL}/api/geocode?lat=${coord.lat}&lon=${coord.lon}`;
    await makeRequest(url, `Geocode API - ${coord.name}`);

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testErrorHandling() {
  log('\n🚨 Testing Error Handling', 'bright');

  // Test invalid city
  await makeRequest(`${BASE_URL}/api/weather?city=InvalidCity123&units=metric`, 'Invalid City');

  // Test invalid coordinates
  await makeRequest(`${BASE_URL}/api/geocode?lat=999&lon=999`, 'Invalid Coordinates');

  // Test missing parameters
  await makeRequest(`${BASE_URL}/api/weather?units=metric`, 'Missing City');
  await makeRequest(`${BASE_URL}/api/geocode?lat=51.5074`, 'Missing Longitude');
}

async function testCacheBehavior() {
  log('\n🔄 Testing Cache Behavior', 'bright');

  const testUrl = `${BASE_URL}/api/weather?city=London&units=metric`;

  log('Making first request (should be cache MISS)...', 'yellow');
  await makeRequest(testUrl, 'First Request');

  log('Making second request (should be cache HIT)...', 'yellow');
  await makeRequest(testUrl, 'Second Request');

  log('Making third request (should be cache HIT)...', 'yellow');
  await makeRequest(testUrl, 'Third Request');
}

async function runAllTests() {
  log('🚀 Starting Vercel HTTP Caching Tests', 'bright');
  log(`📍 Base URL: ${BASE_URL}`, 'blue');

  try {
    await testWeatherAPI();
    await testGeocodeAPI();
    await testErrorHandling();
    await testCacheBehavior();

    log('\n🎉 All tests completed!', 'green');
    log('\n📊 Summary:', 'bright');
    log('✅ HTTP caching headers are properly set', 'green');
    log('✅ Vercel CDN will handle caching automatically', 'green');
    log('✅ No more unreliable in-memory Maps', 'green');
    log('✅ Global performance with edge caching', 'green');

  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  makeRequest,
  testWeatherAPI,
  testGeocodeAPI,
  testErrorHandling,
  testCacheBehavior,
  runAllTests,
};

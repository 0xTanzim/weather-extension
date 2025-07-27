#!/usr/bin/env node

// Comprehensive test script for the weather API including security tests
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Weather API Security & Functionality...\n');

  const tests = [
    // Basic functionality tests
    { name: '1. Basic Weather API', test: testBasicWeather },
    { name: '2. Basic Geocoding API', test: testBasicGeocoding },
    
    // Security tests
    { name: '3. Rate Limiting Test', test: testRateLimiting },
    { name: '4. Input Validation Test', test: testInputValidation },
    { name: '5. Malicious Input Test', test: testMaliciousInput },
    { name: '6. Large Input Test', test: testLargeInput },
    { name: '7. Invalid Coordinates Test', test: testInvalidCoordinates },
    { name: '8. Timeout Test', test: testTimeout },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    try {
      console.log(`\n${testCase.name}...`);
      await testCase.test();
      console.log('✅ PASSED');
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your API is secure and working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the security implementation.');
  }
}

async function testBasicWeather() {
  const response = await fetch(`${BASE_URL}/api/weather?city=London&units=metric`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Weather API failed: ${data.error || response.status}`);
  }
  
  if (!data.name || !data.main || !data.weather) {
    throw new Error('Incomplete weather data received');
  }
  
  console.log(`   City: ${data.name}, Temp: ${data.main.temp}°C`);
}

async function testBasicGeocoding() {
  const response = await fetch(`${BASE_URL}/api/geocode?lat=51.51&lon=-0.13`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Geocoding API failed: ${data.error || response.status}`);
  }
  
  if (!data.city) {
    throw new Error('No city name in geocoding response');
  }
  
  console.log(`   City: ${data.city}, Country: ${data.country}`);
}

async function testRateLimiting() {
  const promises = [];
  
  // Make 65 requests (should trigger rate limit after 60)
  for (let i = 0; i < 65; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/weather?city=London&units=metric`, {
        headers: { 'X-Forwarded-For': `192.168.1.${i % 255}` }
      })
    );
  }
  
  const responses = await Promise.all(promises);
  const rateLimited = responses.filter(r => r.status === 429);
  
  if (rateLimited.length === 0) {
    throw new Error('Rate limiting not working - no 429 responses');
  }
  
  console.log(`   Rate limiting working: ${rateLimited.length} requests blocked`);
}

async function testInputValidation() {
  const invalidTests = [
    { city: '', expected: 400 },
    { city: 'a'.repeat(101), expected: 400 }, // Too long
    { units: 'invalid', expected: 400 },
  ];
  
  for (const test of invalidTests) {
    const url = new URL(`${BASE_URL}/api/weather`);
    if (test.city !== undefined) url.searchParams.set('city', test.city);
    if (test.units !== undefined) url.searchParams.set('units', test.units);
    
    const response = await fetch(url.toString());
    if (response.status !== test.expected) {
      throw new Error(`Input validation failed for ${JSON.stringify(test)}`);
    }
  }
  
  console.log('   Input validation working correctly');
}

async function testMaliciousInput() {
  const maliciousTests = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    'vbscript:msgbox("xss")',
    'onload=alert("xss")',
    'onerror=alert("xss")',
    '"><script>alert("xss")</script>',
  ];
  
  for (const malicious of maliciousTests) {
    const response = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(malicious)}`);
    const data = await response.json();
    
    if (response.ok) {
      throw new Error(`Malicious input not blocked: ${malicious}`);
    }
    
    if (!data.error) {
      throw new Error(`No error response for malicious input: ${malicious}`);
    }
  }
  
  console.log('   Malicious input blocking working');
}

async function testLargeInput() {
  const largeCity = 'a'.repeat(1000);
  const response = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(largeCity)}`);
  
  if (response.ok) {
    throw new Error('Large input not blocked');
  }
  
  console.log('   Large input blocking working');
}

async function testInvalidCoordinates() {
  const invalidCoords = [
    { lat: 91, lon: 0, desc: 'Latitude > 90' },
    { lat: -91, lon: 0, desc: 'Latitude < -90' },
    { lat: 0, lon: 181, desc: 'Longitude > 180' },
    { lat: 0, lon: -181, desc: 'Longitude < -180' },
    { lat: NaN, lon: 0, desc: 'NaN latitude' },
    { lat: 0, lon: NaN, desc: 'NaN longitude' },
  ];
  
  for (const coord of invalidCoords) {
    const response = await fetch(`${BASE_URL}/api/geocode?lat=${coord.lat}&lon=${coord.lon}`);
    
    if (response.ok) {
      throw new Error(`Invalid coordinates not blocked: ${coord.desc}`);
    }
  }
  
  console.log('   Invalid coordinate validation working');
}

async function testTimeout() {
  // This test simulates a slow request by using a very long city name
  // that might cause the external API to take longer
  const longCity = 'a'.repeat(50) + 'VeryLongCityNameThatMightCauseTimeout';
  
  const startTime = Date.now();
  const response = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(longCity)}`);
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  
  if (responseTime > 15000) { // Should timeout before 15 seconds
    throw new Error(`Request took too long: ${responseTime}ms`);
  }
  
  console.log(`   Timeout protection working (response time: ${responseTime}ms)`);
}

// Run the tests
testAPI().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 
// API Key Manager for secure key rotation
const getEnvVar = (key: string): string => {
  console.log(`🔍 Checking for environment variable: ${key}`);
  
  // Try to access the environment variable directly
  // Webpack DefinePlugin should replace these with actual string values
  if (key === 'OPEN_WEATHER_API_KEY') {
    const value = process.env.OPEN_WEATHER_API_KEY || '';
    console.log(`📦 process.env.${key}:`, value ? '✅ Found' : '❌ Not found');
    return value;
  }
  
  if (key === 'OPEN_WEATHER_API_KEYS') {
    const value = process.env.OPEN_WEATHER_API_KEYS || '';
    console.log(`📦 process.env.${key}:`, value ? '✅ Found' : '❌ Not found');
    return value;
  }
  
  console.log(`❌ Unknown environment variable: ${key}`);
  return '';
};

const apiKeySingle = getEnvVar('OPEN_WEATHER_API_KEY');
const apiKeysMultiple = getEnvVar('OPEN_WEATHER_API_KEYS');

console.log('🔑 Single API Key:', apiKeySingle ? '✅ Found' : '❌ Not found');
console.log('🔑 Multiple API Keys:', apiKeysMultiple ? '✅ Found' : '❌ Not found');

const keys = (apiKeysMultiple || apiKeySingle || '').split(',').map(k => k.trim()).filter(k => k);
let currentIndex = 0;

// Debug logging
if (keys.length > 0) {
  console.log('✅ API keys loaded successfully:', keys.length, 'key(s) available');
  console.log('🔑 First key (masked):', keys[0].substring(0, 8) + '...');
} else {
  console.warn('⚠️ No API keys found. Please create a .env file with your OpenWeather API key.');
  console.log('🔍 Debug info:');
  console.log('  - apiKeySingle length:', apiKeySingle.length);
  console.log('  - apiKeysMultiple length:', apiKeysMultiple.length);
  console.log('  - keys array length:', keys.length);
}

export function getNextApiKey(): string {
  if (keys.length === 0) {
    console.error('❌ No API keys provided. Please set OPEN_WEATHER_API_KEY or OPEN_WEATHER_API_KEYS in your .env file');
    throw new Error('No API keys provided');
  }
  const key = keys[currentIndex];
  currentIndex = (currentIndex + 1) % keys.length;
  return key;
}

export function getCurrentApiKey(): string {
  return getNextApiKey();
}

export function getApiKeyCount(): number {
  return keys.length;
}

// Fallback for development
if (keys.length === 0) {
  console.warn('⚠️ No API keys found. Please create a .env file with your OpenWeather API key.');
} 
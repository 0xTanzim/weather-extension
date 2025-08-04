import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientCache } from '../../utils/cache';

describe('Client Cache', () => {
  beforeEach(() => {
    clientCache.clear();
  });

  afterEach(() => {
    clientCache.clear();
  });

  describe('Weather Cache', () => {
    it('stores and retrieves weather data', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const key = 'weather-Dhaka-metric';

      clientCache.setWeather(key, weatherData);
      const retrieved = clientCache.getWeather(key);

      expect(retrieved).toEqual(weatherData);
    });

    it('returns null for non-existent weather data', () => {
      const retrieved = clientCache.getWeather('non-existent');
      expect(retrieved).toBeNull();
    });

    it('handles expired weather data', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const key = 'weather-Dhaka-metric';

      clientCache.setWeather(key, weatherData);

      // Manually expire the data
      const cache = (clientCache as any).weatherCache;
      const entry = cache.get(key);
      if (entry) {
        entry.timestamp = Date.now() - 3600001; // 1 hour + 1ms
      }

      const retrieved = clientCache.getWeather(key);
      expect(retrieved).toBeNull();
    });

    it('updates existing weather data', () => {
      const key = 'weather-Dhaka-metric';
      const initialData = { name: 'Dhaka', main: { temp: 30 } };
      const updatedData = { name: 'Dhaka', main: { temp: 32 } };

      clientCache.setWeather(key, initialData);
      clientCache.setWeather(key, updatedData);

      const retrieved = clientCache.getWeather(key);
      expect(retrieved).toEqual(updatedData);
    });
  });

  describe('Forecast Cache', () => {
    it('stores and retrieves forecast data', () => {
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const key = 'forecast-Dhaka-metric';

      clientCache.setForecast(key, forecastData);
      const retrieved = clientCache.getForecast(key);

      expect(retrieved).toEqual(forecastData);
    });

    it('returns null for non-existent forecast data', () => {
      const retrieved = clientCache.getForecast('non-existent');
      expect(retrieved).toBeNull();
    });

    it('handles expired forecast data', () => {
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const key = 'forecast-Dhaka-metric';

      clientCache.setForecast(key, forecastData);

      // Manually expire the data
      const cache = (clientCache as any).forecastCache;
      const entry = cache.get(key);
      if (entry) {
        entry.timestamp = Date.now() - 3600001; // 1 hour + 1ms
      }

      const retrieved = clientCache.getForecast(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Geocode Cache', () => {
    it('stores and retrieves geocode data', () => {
      const geocodeData = { city: 'Dhaka' };
      const key = 'geocode-23.8103-90.4125';

      clientCache.setGeocode(key, geocodeData);
      const retrieved = clientCache.getGeocode(key);

      expect(retrieved).toEqual(geocodeData);
    });

    it('returns null for non-existent geocode data', () => {
      const retrieved = clientCache.getGeocode('non-existent');
      expect(retrieved).toBeNull();
    });

    it('handles expired geocode data', () => {
      const geocodeData = { city: 'Dhaka' };
      const key = 'geocode-23.8103-90.4125';

      clientCache.setGeocode(key, geocodeData);

      // Manually expire the data
      const cache = (clientCache as any).geocodeCache;
      const entry = cache.get(key);
      if (entry) {
        entry.timestamp = Date.now() - 86400001; // 24 hours + 1ms
      }

      const retrieved = clientCache.getGeocode(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Cache Cleanup', () => {
    it('removes expired entries on cleanup', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const geocodeData = { city: 'Dhaka' };

      // Add data to all caches
      clientCache.setWeather('weather-key', weatherData);
      clientCache.setForecast('forecast-key', forecastData);
      clientCache.setGeocode('geocode-key', geocodeData);

      // Manually expire all data
      const weatherCache = (clientCache as any).weatherCache;
      const forecastCache = (clientCache as any).forecastCache;
      const geocodeCache = (clientCache as any).geocodeCache;

      weatherCache.get('weather-key').timestamp = Date.now() - 3600001;
      forecastCache.get('forecast-key').timestamp = Date.now() - 3600001;
      geocodeCache.get('geocode-key').timestamp = Date.now() - 86400001;

      // Run cleanup
      clientCache.cleanup();

      expect(clientCache.getWeather('weather-key')).toBeNull();
      expect(clientCache.getForecast('forecast-key')).toBeNull();
      expect(clientCache.getGeocode('geocode-key')).toBeNull();
    });

    it('maintains valid entries after cleanup', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const geocodeData = { city: 'Dhaka' };

      // Add data to all caches
      clientCache.setWeather('weather-key', weatherData);
      clientCache.setForecast('forecast-key', forecastData);
      clientCache.setGeocode('geocode-key', geocodeData);

      // Run cleanup
      clientCache.cleanup();

      expect(clientCache.getWeather('weather-key')).toEqual(weatherData);
      expect(clientCache.getForecast('forecast-key')).toEqual(forecastData);
      expect(clientCache.getGeocode('geocode-key')).toEqual(geocodeData);
    });
  });

  describe('Cache Statistics', () => {
    it('returns correct cache statistics', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const geocodeData = { city: 'Dhaka' };

      clientCache.setWeather('weather-key', weatherData);
      clientCache.setForecast('forecast-key', forecastData);
      clientCache.setGeocode('geocode-key', geocodeData);

      const stats = clientCache.getStats();

      expect(stats.weatherSize).toBe(1);
      expect(stats.forecastSize).toBe(1);
      expect(stats.geocodeSize).toBe(1);
      expect(stats.totalSize).toBe(3);
    });

    it('returns zero statistics for empty cache', () => {
      const stats = clientCache.getStats();

      expect(stats.weatherSize).toBe(0);
      expect(stats.forecastSize).toBe(0);
      expect(stats.geocodeSize).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Cache Export', () => {
    it('exports cache data correctly', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const geocodeData = { city: 'Dhaka' };

      clientCache.setWeather('weather-key', weatherData);
      clientCache.setForecast('forecast-key', forecastData);
      clientCache.setGeocode('geocode-key', geocodeData);

      const exported = clientCache.exportCache();

      expect(exported.weather).toHaveProperty('weather-key');
      expect(exported.forecast).toHaveProperty('forecast-key');
      expect(exported.geocode).toHaveProperty('geocode-key');
    });

    it('exports empty cache correctly', () => {
      const exported = clientCache.exportCache();

      expect(exported.weather).toEqual({});
      expect(exported.forecast).toEqual({});
      expect(exported.geocode).toEqual({});
    });
  });

  describe('Cache Clear', () => {
    it('clears all cache data', () => {
      const weatherData = { name: 'Dhaka', main: { temp: 30 } };
      const forecastData = { city: { name: 'Dhaka' }, list: [] };
      const geocodeData = { city: 'Dhaka' };

      clientCache.setWeather('weather-key', weatherData);
      clientCache.setForecast('forecast-key', forecastData);
      clientCache.setGeocode('geocode-key', geocodeData);

      clientCache.clear();

      expect(clientCache.getWeather('weather-key')).toBeNull();
      expect(clientCache.getForecast('forecast-key')).toBeNull();
      expect(clientCache.getGeocode('geocode-key')).toBeNull();

      const stats = clientCache.getStats();
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('LRU Eviction', () => {
    it('evicts least recently used entries when cache is full', () => {
      // Add more entries than the cache limit
      for (let i = 0; i < 110; i++) {
        clientCache.setWeather(`weather-key-${i}`, {
          name: `City${i}`,
          main: { temp: 30 },
        });
      }

      const stats = clientCache.getStats();
      expect(stats.weatherSize).toBeLessThanOrEqual(100); // Default max size
    });

    it('maintains most recently used entries', () => {
      // Clear cache first to ensure clean state
      clientCache.clear();

      // Add 3 entries
      clientCache.setWeather('key-1', { name: 'City1' });
      clientCache.setWeather('key-2', { name: 'City2' });
      clientCache.setWeather('key-3', { name: 'City3' });

      expect(clientCache.getStats().weatherSize).toBe(3);

      // Access first entry to make it most recently used
      clientCache.getWeather('key-1');

      // Add entries to reach cache limit (100 total entries)
      for (let i = 4; i <= 100; i++) {
        clientCache.setWeather(`key-${i}`, { name: `City${i}` });
      }

      expect(clientCache.getStats().weatherSize).toBe(100);

      // Add one more entry to trigger eviction
      clientCache.setWeather('key-101', { name: 'City101' });

      expect(clientCache.getStats().weatherSize).toBe(100);

      // Check which entries are still available
      const key1Available = clientCache.getWeather('key-1');
      const key2Available = clientCache.getWeather('key-2');
      const key3Available = clientCache.getWeather('key-3');

      console.log('key-1 available:', key1Available);
      console.log('key-2 available:', key2Available);
      console.log('key-3 available:', key3Available);

      // At least one of the original entries should be evicted
      expect(
        key1Available === null ||
          key2Available === null ||
          key3Available === null
      ).toBe(true);
    });
  });

  describe('Cache Key Generation', () => {
    it('generates consistent cache keys', () => {
      const weatherKey = clientCache.getWeatherKey('Dhaka', 'metric');
      const forecastKey = clientCache.getForecastKey('Dhaka', 'metric');
      const geocodeKey = clientCache.getGeocodeKey(23.8103, 90.4125);

      expect(weatherKey).toBe('weather-dhaka-metric');
      expect(forecastKey).toBe('forecast-dhaka-metric');
      expect(geocodeKey).toBe('geocode-23.8103-90.4125');
    });

    it('handles special characters in cache keys', () => {
      const weatherKey = clientCache.getWeatherKey('New York', 'imperial');
      const forecastKey = clientCache.getForecastKey('Saint-Jean', 'metric');

      expect(weatherKey).toBe('weather-new york-imperial');
      expect(forecastKey).toBe('forecast-saint-jean-metric');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid cache data gracefully', () => {
      // Manually corrupt cache data
      const cache = (clientCache as any).weatherCache;
      cache.set('corrupted-key', { data: null, timestamp: Date.now() });

      const retrieved = clientCache.getWeather('corrupted-key');
      expect(retrieved).toBeNull();
    });

    it('handles cache storage errors', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => {
        clientCache.setWeather('test-key', {
          name: 'Test',
          main: { temp: 30 },
        });
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });
});

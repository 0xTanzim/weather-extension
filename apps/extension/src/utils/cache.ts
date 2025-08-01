// Client-side caching utility for weather extension
// Reduces API calls and improves performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  weatherTTL: number; // 30 minutes
  forecastTTL: number; // 1 hour
  geocodeTTL: number; // 24 hours
  maxSize: number; // 100 entries
}

class ClientCache {
  private weatherCache = new Map<string, CacheEntry<any>>();
  private forecastCache = new Map<string, CacheEntry<any>>();
  private geocodeCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      weatherTTL: 30 * 60 * 1000, // 30 minutes
      forecastTTL: 60 * 60 * 1000, // 1 hour
      geocodeTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100,
      ...config,
    };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Weather cache methods
  getWeather(key: string): any | null {
    const entry = this.weatherCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.weatherCache.delete(key);
      return null;
    }

    // Update timestamp to mark as most recently used
    entry.timestamp = Date.now();

    console.log(`Client cache HIT for ${key} (timestamp: ${entry.timestamp})`);
    return entry.data;
  }

  setWeather(key: string, data: any): void {
    // LRU eviction - remove oldest entry if cache is full
    if (this.weatherCache.size >= this.config.maxSize) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;

      for (const [k, entry] of this.weatherCache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        console.log(
          `LRU eviction: removing ${oldestKey} (timestamp: ${oldestTime})`
        );
        this.weatherCache.delete(oldestKey);
      }
    }

    this.weatherCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.weatherTTL,
    });

    console.log(
      `Client cache SET for ${key} (size: ${this.weatherCache.size})`
    );
  }

  // Forecast cache methods
  getForecast(key: string): any | null {
    const entry = this.forecastCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.forecastCache.delete(key);
      return null;
    }

    // Update timestamp to mark as most recently used
    entry.timestamp = Date.now();

    console.log(`Client cache HIT for forecast ${key}`);
    return entry.data;
  }

  setForecast(key: string, data: any): void {
    // LRU eviction - remove oldest entry if cache is full
    if (this.forecastCache.size >= this.config.maxSize) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;

      for (const [k, entry] of this.forecastCache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.forecastCache.delete(oldestKey);
      }
    }

    this.forecastCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.forecastTTL,
    });

    console.log(`Client cache SET for forecast ${key}`);
  }

  // Geocode cache methods
  getGeocode(key: string): any | null {
    const entry = this.geocodeCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.geocodeCache.delete(key);
      return null;
    }

    // Update timestamp to mark as most recently used
    entry.timestamp = Date.now();

    console.log(`Client cache HIT for geocode ${key}`);
    return entry.data;
  }

  setGeocode(key: string, data: any): void {
    // LRU eviction - remove oldest entry if cache is full
    if (this.geocodeCache.size >= this.config.maxSize) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;

      for (const [k, entry] of this.geocodeCache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.geocodeCache.delete(oldestKey);
      }
    }

    this.geocodeCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.geocodeTTL,
    });

    console.log(`Client cache SET for geocode ${key}`);
  }

  // Key generation methods for external use
  getWeatherKey(city: string, units: string): string {
    return `weather-${city}-${units}`;
  }

  getForecastKey(city: string, units: string): string {
    return `forecast-${city}-${units}`;
  }

  getGeocodeKey(lat: number, lon: number): string {
    // Round to 4 decimal places for cache efficiency
    const latRounded = Number(lat).toFixed(4);
    const lonRounded = Number(lon).toFixed(4);
    return `geocode-${latRounded}-${lonRounded}`;
  }

  // Cache management
  clear(): void {
    this.weatherCache.clear();
    this.forecastCache.clear();
    this.geocodeCache.clear();
    console.log('Client cache cleared');
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    // Clean weather cache
    for (const [key, entry] of this.weatherCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.weatherCache.delete(key);
        cleaned++;
      }
    }

    // Clean forecast cache
    for (const [key, entry] of this.forecastCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.forecastCache.delete(key);
        cleaned++;
      }
    }

    // Clean geocode cache
    for (const [key, entry] of this.geocodeCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.geocodeCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Client cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  // Cache statistics
  getStats(): {
    weatherSize: number;
    forecastSize: number;
    geocodeSize: number;
    totalSize: number;
  } {
    return {
      weatherSize: this.weatherCache.size,
      forecastSize: this.forecastCache.size,
      geocodeSize: this.geocodeCache.size,
      totalSize:
        this.weatherCache.size +
        this.forecastCache.size +
        this.geocodeCache.size,
    };
  }

  // Export cache for debugging (compatible with older TypeScript targets)
  exportCache(): any {
    const weatherObj: Record<string, any> = {};
    const forecastObj: Record<string, any> = {};
    const geocodeObj: Record<string, any> = {};

    // Convert Maps to objects manually
    for (const [key, value] of this.weatherCache.entries()) {
      weatherObj[key] = value;
    }

    for (const [key, value] of this.forecastCache.entries()) {
      forecastObj[key] = value;
    }

    for (const [key, value] of this.geocodeCache.entries()) {
      geocodeObj[key] = value;
    }

    return {
      weather: weatherObj,
      forecast: forecastObj,
      geocode: geocodeObj,
      stats: this.getStats(),
    };
  }
}

// Create global cache instance
export const clientCache = new ClientCache();

// Export cache class for testing
export { ClientCache };
export type { CacheConfig, CacheEntry };

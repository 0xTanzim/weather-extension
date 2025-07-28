// Client-side caching utility for weather extension
// Reduces API calls and improves performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  weatherTTL: number; // 30 minutes
  geocodeTTL: number; // 24 hours
  maxSize: number; // 100 entries
}

class ClientCache {
  private weatherCache = new Map<string, CacheEntry<any>>();
  private geocodeCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      weatherTTL: 30 * 60 * 1000, // 30 minutes
      geocodeTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100,
      ...config,
    };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Weather cache methods
  getWeather(city: string, units: string): any | null {
    const key = this.getWeatherKey(city, units);
    const entry = this.weatherCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.weatherCache.delete(key);
      return null;
    }

    console.log(`Client cache HIT for ${city} (${units})`);
    return entry.data;
  }

  setWeather(city: string, units: string, data: any): void {
    const key = this.getWeatherKey(city, units);

    // LRU eviction
    if (this.weatherCache.size >= this.config.maxSize) {
      const oldestKey = this.weatherCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.weatherCache.delete(oldestKey);
      }
    }

    this.weatherCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.weatherTTL,
    });

    console.log(`Client cache SET for ${city} (${units})`);
  }

  // Geocoding cache methods
  getGeocode(lat: number, lon: number): any | null {
    const key = this.getGeocodeKey(lat, lon);
    const entry = this.geocodeCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.geocodeCache.delete(key);
      return null;
    }

    console.log(`Client cache HIT for coordinates (${lat}, ${lon})`);
    return entry.data;
  }

  setGeocode(lat: number, lon: number, data: any): void {
    const key = this.getGeocodeKey(lat, lon);

    // LRU eviction
    if (this.geocodeCache.size >= this.config.maxSize) {
      const oldestKey = this.geocodeCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.geocodeCache.delete(oldestKey);
      }
    }

    this.geocodeCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.geocodeTTL,
    });

    console.log(`Client cache SET for coordinates (${lat}, ${lon})`);
  }

  // Cache key generation
  private getWeatherKey(city: string, units: string): string {
    return `weather_${city.toLowerCase().trim()}_${units}`;
  }

  private getGeocodeKey(lat: number, lon: number): string {
    // Round to 3 decimal places for cache efficiency
    const latRounded = lat.toFixed(3);
    const lonRounded = lon.toFixed(3);
    return `geocode_${latRounded}_${lonRounded}`;
  }

  // Cache management
  clear(): void {
    this.weatherCache.clear();
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
    geocodeSize: number;
    totalSize: number;
  } {
    return {
      weatherSize: this.weatherCache.size,
      geocodeSize: this.geocodeCache.size,
      totalSize: this.weatherCache.size + this.geocodeCache.size,
    };
  }

  // Export cache for debugging (compatible with older TypeScript targets)
  exportCache(): any {
    const weatherObj: Record<string, any> = {};
    const geocodeObj: Record<string, any> = {};

    // Convert Maps to objects manually
    for (const [key, value] of this.weatherCache.entries()) {
      weatherObj[key] = value;
    }

    for (const [key, value] of this.geocodeCache.entries()) {
      geocodeObj[key] = value;
    }

    return {
      weather: weatherObj,
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

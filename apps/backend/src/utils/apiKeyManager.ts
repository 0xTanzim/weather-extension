/**
 * API Key Manager for Round-Robin Rotation
 *
 * This module provides secure API key management with round-robin rotation
 * to distribute load across multiple OpenWeather API keys.
 */

interface ApiKeyStats {
  key: string;
  requests: number;
  lastUsed: number;
  errors: number;
  isActive: boolean;
}

class ApiKeyManager {
  private keys: ApiKeyStats[] = [];
  private currentIndex = 0;
  private readonly maxErrors = 5; // Max errors before marking key as inactive
  private readonly errorWindow = 60000; // 1 minute window for error counting

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    const apiKeys = process.env.OPEN_WEATHER_API_KEYS || process.env.OPEN_WEATHER_API_KEY || '';

    if (!apiKeys) {
      console.error('❌ No API keys provided. Please set OPEN_WEATHER_API_KEYS or OPEN_WEATHER_API_KEY');
      throw new Error('No API keys provided');
    }

    // Split by comma and clean up
    const keyArray = apiKeys
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (keyArray.length === 0) {
      console.error('❌ No valid API keys found');
      throw new Error('No valid API keys found');
    }

    // Initialize key stats
    this.keys = keyArray.map(key => ({
      key,
      requests: 0,
      lastUsed: 0,
      errors: 0,
      isActive: true
    }));

    console.log(`✅ API Key Manager initialized with ${this.keys.length} key(s)`);
    console.log(`🔑 First key (masked): ${this.keys[0].key.substring(0, 8)}...`);
  }

  /**
   * Get the next API key using round-robin rotation
   */
  public getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No API keys available');
    }

    // Find the next active key
    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      const keyStats = this.keys[this.currentIndex];

      if (keyStats.isActive) {
        // Update stats
        keyStats.requests++;
        keyStats.lastUsed = Date.now();

        // Move to next key
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;

        console.log(`🔑 Using API key ${this.currentIndex + 1}/${this.keys.length} (${keyStats.requests} requests)`);
        return keyStats.key;
      }

      // Try next key
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }

    // If no active keys found, reactivate all keys and try again
    console.warn('⚠️ No active keys found, reactivating all keys');
    this.reactivateAllKeys();
    return this.getNextKey();
  }

  /**
   * Record a successful request for a key
   */
  public recordSuccess(key: string): void {
    const keyStats = this.keys.find(k => k.key === key);
    if (keyStats) {
      // Reset error count on success
      keyStats.errors = 0;
    }
  }

  /**
   * Record an error for a key
   */
  public recordError(key: string, error: string): void {
    const keyStats = this.keys.find(k => k.key === key);
    if (keyStats) {
      keyStats.errors++;

      console.warn(`⚠️ API key error (${keyStats.errors}/${this.maxErrors}): ${error}`);

      // Deactivate key if too many errors
      if (keyStats.errors >= this.maxErrors) {
        keyStats.isActive = false;
        console.error(`❌ API key deactivated due to ${keyStats.errors} errors`);
      }
    }
  }

  /**
   * Reactivate all keys (useful for recovery)
   */
  public reactivateAllKeys(): void {
    this.keys.forEach(keyStats => {
      keyStats.isActive = true;
      keyStats.errors = 0;
    });
    console.log('✅ All API keys reactivated');
  }

  /**
   * Get current key statistics
   */
  public getStats(): {
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    keyStats: Array<{
      index: number;
      requests: number;
      errors: number;
      isActive: boolean;
      lastUsed: number;
    }>;
  } {
    const totalRequests = this.keys.reduce((sum, key) => sum + key.requests, 0);
    const activeKeys = this.keys.filter(key => key.isActive).length;

    return {
      totalKeys: this.keys.length,
      activeKeys,
      totalRequests,
      keyStats: this.keys.map((key, index) => ({
        index: index + 1,
        requests: key.requests,
        errors: key.errors,
        isActive: key.isActive,
        lastUsed: key.lastUsed
      }))
    };
  }

  /**
   * Get the current key count
   */
  public getKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Get the active key count
   */
  public getActiveKeyCount(): number {
    return this.keys.filter(key => key.isActive).length;
  }

  /**
   * Check if any keys are available
   */
  public hasKeys(): boolean {
    return this.keys.length > 0 && this.keys.some(key => key.isActive);
  }
}

// Create singleton instance
const apiKeyManager = new ApiKeyManager();

export default apiKeyManager;
export { ApiKeyManager };

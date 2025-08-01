/**
 * Rate Limiting Utility
 *
 * This module provides rate limiting functionality for API endpoints.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }) {
    this.config = config;
  }

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  recordRequest(identifier: string): void {
    const entry = this.store.get(identifier);
    if (entry) {
      entry.count++;
    }
  }

  clear(): void {
    this.store.clear();
  }
}

// Create a default instance
const rateLimiter = new RateLimiter();

export const rateLimit = {
  checkLimit: (identifier: string) => rateLimiter.checkLimit(identifier),
  recordRequest: (identifier: string) => rateLimiter.recordRequest(identifier),
  clear: () => rateLimiter.clear(),
};

export default rateLimiter;

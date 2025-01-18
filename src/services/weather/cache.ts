interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class WeatherCache {
  private static instance: WeatherCache;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_ENTRIES = 100;

  private constructor() {}

  static getInstance(): WeatherCache {
    if (!WeatherCache.instance) {
      WeatherCache.instance = new WeatherCache();
    }
    return WeatherCache.instance;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    // Clean up old entries if cache is too large
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}
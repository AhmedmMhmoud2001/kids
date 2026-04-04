const NodeCache = require('node-cache');

/**
 * In-Memory Cache Service
 * Uses node-cache for simple caching of API responses
 */
class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, // Default 5 minutes
            checkperiod: 60, // Check for expired keys every 60 seconds
            useClones: false // Better performance, but be careful with object mutation
        });

        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0
        };
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or undefined
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.stats.hits++;
            return value;
        }
        this.stats.misses++;
        return undefined;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     */
    set(key, value, ttl = undefined) {
        if (ttl) {
            this.cache.set(key, value, ttl);
        } else {
            this.cache.set(key, value);
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     */
    del(key) {
        this.cache.del(key);
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'products:*')
     */
    delByPattern(pattern) {
        const keys = this.cache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        const matchingKeys = keys.filter(key => regex.test(key));
        matchingKeys.forEach(key => this.cache.del(key));
    }

    /**
     * Clear all cache
     */
    flush() {
        this.cache.flushAll();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            keys: this.cache.keys().length,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }
}

// Singleton instance
const cacheService = new CacheService();

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `api:${req.originalUrl}`;
        const cachedResponse = cacheService.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheService.set(key, data, ttl);
            }
            return originalJson(data);
        };

        next();
    };
};

module.exports = {
    cache: cacheService,
    cacheMiddleware
};

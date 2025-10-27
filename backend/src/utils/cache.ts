import Redis from 'ioredis';
import logger from './logger';

// Redis client instance
let redisClient: Redis | null = null;

// Initialize Redis connection
export const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Try to connect
    redisClient.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      redisClient = null; // Disable cache if Redis is not available
    });

  } catch (error) {
    logger.error('Error initializing Redis:', error);
    redisClient = null;
  }
};

// Get value from cache
export const getCache = async (key: string): Promise<any | null> => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    logger.error('Error getting from cache:', error);
    return null;
  }
};

// Set value in cache with expiration (in seconds)
export const setCache = async (
  key: string,
  value: any,
  expirationInSeconds: number = 300 // Default 5 minutes
): Promise<boolean> => {
  if (!redisClient) return false;

  try {
    await redisClient.setex(key, expirationInSeconds, JSON.stringify(value));
    logger.debug(`Cache set for key: ${key}, expires in ${expirationInSeconds}s`);
    return true;
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
};

// Delete value from cache
export const deleteCache = async (key: string): Promise<boolean> => {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    logger.debug(`Cache deleted for key: ${key}`);
    return true;
  } catch (error) {
    logger.error('Error deleting from cache:', error);
    return false;
  }
};

// Delete multiple cache entries by pattern
export const deleteCacheByPattern = async (pattern: string): Promise<boolean> => {
  if (!redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug(`Cache deleted for pattern: ${pattern}, count: ${keys.length}`);
    }
    return true;
  } catch (error) {
    logger.error('Error deleting cache by pattern:', error);
    return false;
  }
};

// Clear all cache
export const clearCache = async (): Promise<boolean> => {
  if (!redisClient) return false;

  try {
    await redisClient.flushdb();
    logger.info('All cache cleared');
    return true;
  } catch (error) {
    logger.error('Error clearing cache:', error);
    return false;
  }
};

// Close Redis connection
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Cache middleware for express routes
export const cacheMiddleware = (expirationInSeconds: number = 300) => {
  return async (req: any, res: any, next: any) => {
    if (!redisClient) {
      return next();
    }

    const key = `cache:${req.method}:${req.originalUrl}`;

    try {
      const cachedResponse = await getCache(key);

      if (cachedResponse) {
        logger.debug(`Serving from cache: ${key}`);
        return res.json(cachedResponse);
      }

      // Store the original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (body: any) => {
        if (res.statusCode === 200) {
          setCache(key, body, expirationInSeconds).catch((err) => {
            logger.error('Error caching response:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

export default {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  clearCache,
  closeRedis,
  cacheMiddleware,
};

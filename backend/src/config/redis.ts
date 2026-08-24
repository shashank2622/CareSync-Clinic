import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      // Exponential backoff, capping at 3 seconds
      if (times > 5 && env.NODE_ENV === 'development') {
        return null; // Stop retrying repeatedly in local dev if Redis is not running
      }
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    logger.info('📦 Redis connection established for background queues');
  });

  redisClient.on('error', (err) => {
    redisAvailable = false;
    if (env.NODE_ENV === 'development') {
      logger.warn(`⚠️  Redis offline (${err.message}). Background jobs will run via in-memory scheduler fallback.`);
    } else {
      logger.error(`❌ Redis error: ${err.message}`);
    }
  });

  // Attempt initial non-blocking connection
  redisClient.connect().catch(() => {
    redisAvailable = false;
  });
} catch (e: any) {
  redisAvailable = false;
  logger.warn(`⚠️  Could not initialize Redis client: ${e.message}`);
}

export const getRedisClient = (): Redis | null => redisClient;
export const isRedisAvailable = (): boolean => redisAvailable;

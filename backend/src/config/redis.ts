import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
let redisAvailable = false;

// Only initialize Redis client if not in test environment or if test explicitly enabled it
if (env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3 && env.NODE_ENV === 'development') {
          return null; // Stop retrying repeatedly in dev
        }
        return Math.min(times * 500, 2000);
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
      }
    });

    redisClient.connect().catch(() => {
      redisAvailable = false;
    });
  } catch (e: any) {
    redisAvailable = false;
  }
}

export const getRedisClient = (): Redis | null => redisClient;
export const isRedisAvailable = (): boolean => redisAvailable;

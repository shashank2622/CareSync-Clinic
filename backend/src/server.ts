import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma, checkDatabaseConnection } from './config/database.js';
import { reminderWorker } from './workers/reminder.worker.js';

const PORT = env.PORT || 5000;

async function bootstrap() {
  // Check Database Connectivity
  const isDbConnected = await checkDatabaseConnection();
  if (isDbConnected) {
    logger.info('📦 PostgreSQL Database connected successfully');
  } else {
    logger.warn('⚠️  PostgreSQL Database connection failed or database is not reachable yet.');
  }

  // Start background reminder worker
  reminderWorker.startScheduler(60000); // Polls every 60 seconds

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Healthcare Backend Server running in [${env.NODE_ENV}] mode on http://localhost:${PORT}`);
    logger.info(`🔗 Health Check available at: http://localhost:${PORT}/api/health`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
    reminderWorker.stopScheduler();

    server.close(async () => {
      logger.info('🛑 HTTP server closed.');
      await prisma.$disconnect();
      logger.info('🛑 Prisma connection disconnected. Exiting process.');
      process.exit(0);
    });

    // Force shutdown if taking too long
    setTimeout(() => {
      logger.error('⚠️  Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logger.error('💥 Unhandled Rejection detected:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('💥 Uncaught Exception detected:', error);
    process.exit(1);
  });
}

bootstrap();

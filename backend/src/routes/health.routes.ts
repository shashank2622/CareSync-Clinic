import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseConnection();
  const uptimeSeconds = process.uptime();

  res.status(dbHealthy ? 200 : 503).json({
    success: dbHealthy,
    message: dbHealthy ? 'Healthcare Appointment Service is operational' : 'Database connection unavailable',
    data: {
      status: dbHealthy ? 'healthy' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptimeSeconds),
      version: '1.0.0',
    },
  });
});

export default router;

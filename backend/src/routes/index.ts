import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Health Check
router.use('/health', healthRoutes);

export default router;

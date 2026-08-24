import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

// Health Check
router.use('/health', healthRoutes);

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;

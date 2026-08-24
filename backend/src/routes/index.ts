import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import doctorRoutes from './doctor.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Health Check
router.use('/health', healthRoutes);

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Doctors & Admin
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);

export default router;

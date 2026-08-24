import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createDoctorSchema, updateDoctorSchema } from '../validators/doctor.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Guard all admin routes with requireAuth & requireRole(ADMIN)
router.use(requireAuth);
router.use(requireRole([Role.ADMIN]));

// Doctor Management
router.post('/doctors', validateRequest({ body: createDoctorSchema }), adminController.createDoctor);
router.patch('/doctors/:id', validateRequest({ body: updateDoctorSchema }), adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// Analytics / Dashboard Overview
router.get('/dashboard', adminController.getDashboardStats);

export default router;

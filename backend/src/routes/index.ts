import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import doctorRoutes from './doctor.routes.js';
import adminRoutes from './admin.routes.js';
import appointmentRoutes from './appointment.routes.js';
import prescriptionRoutes from './prescription.routes.js';
import reminderRoutes from './reminder.routes.js';
import calendarRoutes from './calendar.routes.js';

const router = Router();

// Health Check
router.use('/health', healthRoutes);

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Doctors & Admin
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);

// Appointments & Slot Holds
router.use('/appointments', appointmentRoutes);

// Prescriptions & Reminders
router.use('/prescriptions', prescriptionRoutes);
router.use('/reminders', reminderRoutes);

// Google Calendar Integration
router.use('/calendar', calendarRoutes);

export default router;

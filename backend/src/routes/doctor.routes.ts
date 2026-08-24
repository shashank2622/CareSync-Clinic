import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { slotController } from '../controllers/slot.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { doctorQuerySchema, setWorkingHoursSchema } from '../validators/doctor.validator.js';
import { availabilityQuerySchema, monthAvailabilityQuerySchema } from '../validators/slot.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Public doctor discovery
router.get('/', validateRequest({ query: doctorQuerySchema }), doctorController.getDoctors);
router.get('/specializations', doctorController.getSpecializations);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/working-hours', doctorController.getWorkingHours);

// Slot Availability Endpoints (supports optionalAuth to recognize user's own holds)
router.get(
  '/:id/availability',
  optionalAuth,
  validateRequest({ query: availabilityQuerySchema }),
  slotController.getAvailability
);

router.get(
  '/:id/available-dates',
  validateRequest({ query: monthAvailabilityQuerySchema }),
  slotController.getMonthAvailableDates
);

// Doctor or Admin working hours configuration
router.post(
  '/:id/working-hours',
  requireAuth,
  requireRole([Role.DOCTOR, Role.ADMIN]),
  validateRequest({ body: setWorkingHoursSchema }),
  doctorController.setWorkingHours
);

export default router;

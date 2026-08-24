import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createHoldSchema,
  confirmAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentQuerySchema,
} from '../validators/appointment.validator.js';

const router = Router();

// All appointment actions require authenticated session
router.use(requireAuth);

// Slot Holds
router.post('/hold', validateRequest({ body: createHoldSchema }), appointmentController.createHold);
router.delete('/hold/:holdToken', appointmentController.releaseHold);

// Appointment Booking & Management
router.post('/', validateRequest({ body: confirmAppointmentSchema }), appointmentController.confirmAppointment);
router.get('/', validateRequest({ query: appointmentQuerySchema }), appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.patch('/:id/cancel', validateRequest({ body: cancelAppointmentSchema }), appointmentController.cancelAppointment);
router.patch('/:id/reschedule', validateRequest({ body: rescheduleAppointmentSchema }), appointmentController.rescheduleAppointment);

export default router;

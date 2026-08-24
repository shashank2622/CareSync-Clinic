import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { symptomController } from '../controllers/symptom.controller.js';
import { preVisitController } from '../controllers/previsit.controller.js';
import { clinicalController } from '../controllers/clinical.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createHoldSchema,
  confirmAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentQuerySchema,
} from '../validators/appointment.validator.js';
import { submitSymptomsSchema } from '../validators/symptom.validator.js';
import { submitVisitNotesSchema } from '../validators/clinical.validator.js';

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

// Symptoms Intake & Retrieval
router.post('/:id/symptoms', validateRequest({ body: submitSymptomsSchema }), symptomController.submitSymptoms);
router.get('/:id/symptoms', symptomController.getSymptoms);

// Pre-Visit AI Clinical Summary
router.get('/:id/previsit-summary', preVisitController.getSummary);
router.post('/:id/previsit-summary/generate', preVisitController.generateSummary);
router.post('/:id/previsit-summary/retry', preVisitController.retrySummary);

// Clinical Visit Notes & Prescription
router.post('/:id/visit-notes', validateRequest({ body: submitVisitNotesSchema }), clinicalController.submitVisitNotes);
router.get('/:id/visit-notes', clinicalController.getVisitNotes);
router.get('/:id/prescription', clinicalController.getPrescription);

export default router;

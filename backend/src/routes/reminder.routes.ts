import { Router } from 'express';
import { reminderController } from '../controllers/reminder.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/active', reminderController.getActiveReminders);
router.patch('/:id/toggle', reminderController.toggleReminder);
router.post('/generate/:prescriptionId', reminderController.generateForPrescription);
router.post('/process-due', reminderController.triggerProcess);

export default router;

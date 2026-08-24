import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// OAuth callback does not require bearer header as it is redirected from Google
router.get('/callback', calendarController.handleCallback);

// Authenticated Google Calendar actions
router.get('/connect', requireAuth, calendarController.getConnectUrl);
router.delete('/disconnect', requireAuth, calendarController.disconnect);
router.get('/status', requireAuth, calendarController.getStatus);
router.post('/sync/:appointmentId', requireAuth, calendarController.manualSync);

export default router;

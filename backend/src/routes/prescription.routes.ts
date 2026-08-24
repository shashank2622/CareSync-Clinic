import { Router } from 'express';
import { clinicalController } from '../controllers/clinical.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

// Patient Prescription History
router.get('/my-prescriptions', clinicalController.getMyPrescriptions);

export default router;

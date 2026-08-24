import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

router.get('/me', requireAuth, authController.getMe);
router.patch('/me', requireAuth, validateRequest({ body: updateProfileSchema }), authController.updateProfile);

export default router;

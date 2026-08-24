import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for authentication endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

export default router;

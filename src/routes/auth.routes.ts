import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { loginSchema, signupSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), AuthController.signup);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;

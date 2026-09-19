import { Router } from 'express';
import { login, refreshToken, logout, me } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { loginSchema } from '../validations/authValidation';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;

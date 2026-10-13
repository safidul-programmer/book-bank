import { Router } from 'express';
import { registerUser, adminRegisterUser, loginUser, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, registerUser);
router.post('/admin-register', authLimiter, adminRegisterUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', authenticate, getMe);

export default router;

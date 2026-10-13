import { Router } from 'express';
import { getUserCountHandler } from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireAdmin, getUserCountHandler);

export default router;

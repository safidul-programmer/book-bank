import { Router } from 'express';
import { borrowBookHandler, getMyBorrowHistoryHandler, returnBookHandler, getBorrowStatsHandler } from '../controllers/borrowController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, borrowBookHandler);
router.get('/my', authenticate, getMyBorrowHistoryHandler);
router.get('/stats', authenticate, requireAdmin, getBorrowStatsHandler);
router.post('/:id/return', authenticate, returnBookHandler);

export default router;

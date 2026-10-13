import { Router } from 'express';
import { getAllBooks, createNewBook, updateExistingBook, deleteExistingBook } from '../controllers/bookController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllBooks);
router.post('/', authenticate, requireAdmin, createNewBook);
router.put('/:id', authenticate, requireAdmin, updateExistingBook);
router.delete('/:id', authenticate, requireAdmin, deleteExistingBook);

export default router;

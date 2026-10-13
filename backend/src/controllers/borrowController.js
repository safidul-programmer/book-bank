import { borrowBook, getMyBorrowHistory, returnBook, getBorrowStats } from '../models/borrowModel.js';

export async function getBorrowStatsHandler(req, res) {
  try {
    const stats = await getBorrowStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch borrow statistics' });
  }
}

export async function getMyBorrowHistoryHandler(req, res) {
  try {
    const records = await getMyBorrowHistory(req.user.id);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch borrow history' });
  }
}

export async function borrowBookHandler(req, res) {
  try {
    const { book_id } = req.body;

    if (book_id === undefined || book_id === null) {
      return res.status(400).json({
        success: false,
        message: 'book_id is required'
      });
    }

    if (!Number.isInteger(book_id) || book_id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'book_id must be a valid positive integer'
      });
    }

    const result = await borrowBook(req.user.id, book_id);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (result.error === 'UNAVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Book is currently unavailable'
      });
    }

    res.status(201).json({ success: true, data: result.borrow });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to borrow book' });
  }
}

export async function returnBookHandler(req, res) {
  try {
    const { id } = req.params;
    const recordId = Number(id);

    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'id must be a valid positive integer'
      });
    }

    const result = await returnBook(recordId, req.user.id);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    if (result.error === 'ALREADY_RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'Book has already been returned'
      });
    }

    res.json({ success: true, message: 'Book returned successfully', data: result.record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to return book' });
  }
}

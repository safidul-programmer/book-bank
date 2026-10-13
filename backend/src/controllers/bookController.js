import { findAllBooks, findBookByIsbn, findBookById, createBook, updateBook, deleteBook } from '../models/bookModel.js';

const LIMITS = {
  title: 255,
  author: 150,
  isbn: 13,
  genre: 100,
  descriptionBytes: 65535,
  totalQuantity: 4294967295
};

export function validateBookPayload(body) {
  const data = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const invalid = (message) => ({ error: message });

  const readRequiredString = (field, max) => {
    const raw = data[field];
    if (raw === undefined || raw === null) return invalid(`${field} is required`);
    if (typeof raw !== 'string') return invalid(`${field} must be a string`);
    const value = raw.trim();
    if (!value) return invalid(`${field} must be a non-empty string`);
    if (value.length > max) return invalid(`${field} must be at most ${max} characters`);
    return { value };
  };

  const title = readRequiredString('title', LIMITS.title);
  if (title.error) return title;

  const author = readRequiredString('author', LIMITS.author);
  if (author.error) return author;

  const isbn = readRequiredString('isbn', LIMITS.isbn);
  if (isbn.error) return isbn;

  let genre = null;
  if (data.genre !== undefined && data.genre !== null) {
    if (typeof data.genre !== 'string') return invalid('genre must be a string');
    genre = data.genre.trim() || null;
    if (genre && genre.length > LIMITS.genre) {
      return invalid(`genre must be at most ${LIMITS.genre} characters`);
    }
  }

  let description = null;
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') return invalid('description must be a string');
    description = data.description.trim() || null;
    if (description && Buffer.byteLength(description, 'utf8') > LIMITS.descriptionBytes) {
      return invalid(`description must be at most ${LIMITS.descriptionBytes} bytes`);
    }
  }

  const quantity = data.total_quantity;
  if (quantity === undefined || quantity === null) return invalid('total_quantity is required');
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return invalid('total_quantity must be a number');
  if (!Number.isInteger(quantity)) return invalid('total_quantity must be a whole number');
  if (quantity <= 0) return invalid('total_quantity must be a positive integer');
  if (quantity > LIMITS.totalQuantity) return invalid(`total_quantity must be at most ${LIMITS.totalQuantity}`);

  return {
    value: {
      title: title.value,
      author: author.value,
      isbn: isbn.value,
      genre,
      description,
      total_quantity: quantity
    }
  };
}

export async function getAllBooks(req, res) {
  try {
    const books = await findAllBooks();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
}

export async function createNewBook(req, res) {
  try {
    const input = validateBookPayload(req.body);
    if (input.error) {
      return res.status(400).json({ success: false, message: input.error });
    }

    const { title, author, isbn, genre, description, total_quantity } = input.value;

    const existing = await findBookByIsbn(isbn);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }

    const book = await createBook({ title, author, isbn, genre, description, total_quantity });
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create book' });
  }
}

export async function updateExistingBook(req, res) {
  try {
    const { id } = req.params;

    const book = await findBookById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const input = validateBookPayload(req.body);
    if (input.error) {
      return res.status(400).json({ success: false, message: input.error });
    }

    const { title, author, isbn, genre, description, total_quantity } = input.value;

    const duplicate = await findBookByIsbn(isbn, id);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Another book with this ISBN already exists'
      });
    }

    const updated = await updateBook(id, { title, author, isbn, genre, description, total_quantity });

    if (updated.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (updated.error === 'INSUFFICIENT_TOTAL') {
      return res.status(400).json({
        success: false,
        message: 'total_quantity cannot be less than the number of outstanding borrowed copies'
      });
    }

    res.json({ success: true, data: updated.book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update book' });
  }
}

export async function deleteExistingBook(req, res) {
  try {
    const { id } = req.params;

    const book = await findBookById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    await deleteBook(id);
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    if (err.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete book: it has active borrow records'
      });
    }
    res.status(500).json({ success: false, message: 'Failed to delete book' });
  }
}

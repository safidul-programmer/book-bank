import { db } from '../../config/db.js';

const BOOK_COLUMNS = 'id, title, author, isbn, genre, description, total_quantity, available_quantity, created_at, updated_at';

export async function findAllBooks() {
  const [rows] = await db.query(`SELECT ${BOOK_COLUMNS} FROM books`);
  return rows;
}

export async function findBookByIsbn(isbn, excludeId = null) {
  if (excludeId) {
    const [rows] = await db.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn, excludeId]);
    return rows[0];
  }
  const [rows] = await db.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
  return rows[0];
}

export async function findBookById(id) {
  const [rows] = await db.query(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = ?`, [id]);
  return rows[0];
}

export async function createBook({ title, author, isbn, genre, description, total_quantity }) {
  const [result] = await db.query(
    `INSERT INTO books (title, author, isbn, genre, description, total_quantity, available_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, author, isbn, genre || null, description || null, total_quantity, total_quantity]
  );
  const [rows] = await db.query(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = ?`, [result.insertId]);
  return rows[0];
}

export async function updateBook(id, { title, author, isbn, genre, description, total_quantity }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [bookRows] = await connection.query(
      'SELECT id, total_quantity, available_quantity FROM books WHERE id = ? FOR UPDATE',
      [id]
    );
    const book = bookRows[0];

    if (!book) {
      await connection.rollback();
      connection.release();
      return { error: 'NOT_FOUND' };
    }

    const [[{ count: outstanding }]] = await connection.query(
      'SELECT COUNT(*) AS count FROM borrow_records WHERE book_id = ? AND return_date IS NULL',
      [id]
    );

    if (total_quantity < outstanding) {
      await connection.rollback();
      connection.release();
      return { error: 'INSUFFICIENT_TOTAL' };
    }

    await connection.query(
      `UPDATE books
       SET title = ?, author = ?, isbn = ?, genre = ?, description = ?,
           total_quantity = ?, available_quantity = ?
       WHERE id = ?`,
      [title, author, isbn, genre || null, description || null, total_quantity, total_quantity - outstanding, id]
    );

    await connection.commit();

    const [rows] = await db.query(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = ?`, [id]);

    connection.release();
    return { book: rows[0] };
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
}

export async function deleteBook(id) {
  await db.query('DELETE FROM books WHERE id = ?', [id]);
}

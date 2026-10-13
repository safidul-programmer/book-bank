import { db } from '../../config/db.js';

export async function getBorrowStats() {
  const [[active]] = await db.query(
    'SELECT COUNT(*) AS count FROM borrow_records WHERE return_date IS NULL'
  );
  const [[returned]] = await db.query(
    'SELECT COUNT(*) AS count FROM borrow_records WHERE return_date IS NOT NULL'
  );
  return { active: active.count, returned: returned.count };
}

export async function findBookById(id) {
  const [rows] = await db.query('SELECT id, available_quantity FROM books WHERE id = ?', [id]);
  return rows[0];
}

export async function getMyBorrowHistory(userId) {
  const [rows] = await db.query(
    `SELECT br.id, br.book_id, b.title, b.author, b.isbn,
            br.borrow_date, br.due_date, br.return_date
     FROM borrow_records br
     JOIN books b ON br.book_id = b.id
     WHERE br.user_id = ?
     ORDER BY br.borrow_date DESC`,
    [userId]
  );
  return rows;
}

export async function borrowBook(userId, bookId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [bookRows] = await connection.query(
      'SELECT id, available_quantity FROM books WHERE id = ? FOR UPDATE',
      [bookId]
    );
    const book = bookRows[0];

    if (!book) {
      await connection.rollback();
      connection.release();
      return { error: 'NOT_FOUND' };
    }

    if (book.available_quantity <= 0) {
      await connection.rollback();
      connection.release();
      return { error: 'UNAVAILABLE' };
    }

    const [result] = await connection.query(
      `INSERT INTO borrow_records (user_id, book_id, due_date)
       VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
      [userId, bookId]
    );

    await connection.query(
      'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?',
      [bookId]
    );

    await connection.commit();

    const [borrowRows] = await db.query(
      'SELECT id, user_id, book_id, borrow_date, due_date, return_date FROM borrow_records WHERE id = ?',
      [result.insertId]
    );

    connection.release();
    return { borrow: borrowRows[0] };
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
}

export async function returnBook(recordId, userId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, user_id, book_id, borrow_date, due_date, return_date FROM borrow_records WHERE id = ? AND user_id = ? FOR UPDATE',
      [recordId, userId]
    );
    const record = rows[0];

    if (!record) {
      await connection.rollback();
      connection.release();
      return { error: 'NOT_FOUND' };
    }

    if (record.return_date !== null) {
      await connection.rollback();
      connection.release();
      return { error: 'ALREADY_RETURNED' };
    }

    await connection.query(
      'UPDATE borrow_records SET return_date = CURRENT_TIMESTAMP WHERE id = ?',
      [recordId]
    );

    await connection.query(
      'UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?',
      [record.book_id]
    );

    await connection.commit();

    const [updated] = await db.query(
      'SELECT id, user_id, book_id, borrow_date, due_date, return_date FROM borrow_records WHERE id = ?',
      [recordId]
    );

    connection.release();
    return { record: updated[0] };
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
}

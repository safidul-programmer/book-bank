import { db } from '../../config/db.js';

export async function findUserByEmail(email) {
  const [rows] = await db.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
}

export async function findUserById(id) {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

export async function getUserCount() {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM users');
  return rows[0].count;
}

export async function createUser({ name, email, password_hash, role }) {
  if (role) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  }

  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, password_hash]
  );
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
}

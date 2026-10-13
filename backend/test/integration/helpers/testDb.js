import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DB_NAME = 'book_bank_test';
export const PRODUCTION_DB_NAME = 'book_bank';
export const MARKER = 'book_bank_test:integration-suite:v1';
export const FIXTURE_ISBN_PREFIX = 'IT-FIX';
export const FIXTURE_EMAIL_PREFIX = 'itfix-';
export const FIXTURE_EMAIL_DOMAIN = 'book-bank.test';
export const CONTROL_ISBN = 'CONTROL00001';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCHEMA_PATH = path.join(BACKEND_ROOT, 'db', 'schema.sql');

let ctx = null;

async function assertDatabaseName(query, label) {
  const [[row]] = await query('SELECT DATABASE() AS name');
  const active = row ? row.name : null;
  if (active !== TEST_DB_NAME) {
    throw new Error(
      `ABORT [${label}]: active database is ${JSON.stringify(active)}, expected "${TEST_DB_NAME}". No write was executed.`
    );
  }
  return active;
}

async function readProductionCounts(query) {
  const [[books]] = await query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.books`);
  const [[users]] = await query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.users`);
  const [[records]] = await query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.borrow_records`);
  return { books: books.c, users: users.c, borrow_records: records.c };
}

function statementsFromSchema() {
  const raw = readFileSync(SCHEMA_PATH, 'utf8');
  const withoutComments = raw
    .split(/\r?\n/)
    .filter((line) => !/^\s*--/.test(line))
    .join('\n');
  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function ensureTestDatabase(bootstrap) {
  const [[existing]] = await bootstrap.query(
    'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [TEST_DB_NAME]
  );

  let createdNow = false;
  if (!existing) {
    await bootstrap.query(`CREATE DATABASE \`${TEST_DB_NAME}\``);
    createdNow = true;
  }

  await bootstrap.query(`USE \`${TEST_DB_NAME}\``);
  await assertDatabaseName((sql, params) => bootstrap.query(sql, params), 'after USE');

  await bootstrap.query(
    'CREATE TABLE IF NOT EXISTS `_test_db_marker` (marker VARCHAR(64) NOT NULL PRIMARY KEY) ENGINE=InnoDB'
  );
  const [[markerRow]] = await bootstrap.query('SELECT marker FROM `_test_db_marker` WHERE marker = ?', [
    MARKER
  ]);

  if (!markerRow) {
    if (!createdNow) {
      throw new Error(
        `ABORT: "${TEST_DB_NAME}" already exists but does not carry this suite's marker, so it cannot ` +
          'be positively identified as the disposable test database. It will NOT be dropped or reused. ' +
          `Drop it manually if it is stale, then re-run.`
      );
    }
    await bootstrap.query('INSERT INTO `_test_db_marker` (marker) VALUES (?)', [MARKER]);
  }

  const skipped = [];
  for (const statement of statementsFromSchema()) {
    if (/^\s*USE\b/i.test(statement)) {
      skipped.push(statement.replace(/\s+/g, ' ').trim());
      continue;
    }
    await bootstrap.query(statement);
  }
  await assertDatabaseName((sql, params) => bootstrap.query(sql, params), 'after schema apply');

  return { createdNow, skippedUseStatements: skipped };
}

export async function setup() {
  if (ctx) return ctx;

  // Gate 1: force the disposable database name BEFORE config/db.js is evaluated.
  process.env.DB_NAME = TEST_DB_NAME;

  const { db } = await import('../../../config/db.js');

  if (process.env.DB_NAME !== TEST_DB_NAME) {
    throw new Error(
      `ABORT: DB_NAME changed to ${JSON.stringify(process.env.DB_NAME)} while loading config. Refusing to continue.`
    );
  }

  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectTimeout: 10000
  });

  let dbInfo;
  let productionBaseline;
  try {
    productionBaseline = await readProductionCounts((sql, params) => bootstrap.query(sql, params));
    dbInfo = await ensureTestDatabase(bootstrap);
  } finally {
    await bootstrap.end();
  }

  const borrowModel = await import('../../../src/models/borrowModel.js');
  const bookModel = await import('../../../src/models/bookModel.js');
  const bookController = await import('../../../src/controllers/bookController.js');

  // Gate 2: the application pool itself must be bound to the disposable database.
  await assertDatabaseName((sql, params) => db.query(sql, params), 'application pool');

  ctx = {
    db,
    borrowModel,
    bookModel,
    bookController,
    dbInfo,
    productionBaseline,
    fixtures: null
  };
  return ctx;
}

export async function assertActiveDatabase() {
  if (!ctx) throw new Error('ABORT: setup() has not run.');
  await assertDatabaseName((sql, params) => ctx.db.query(sql, params), 'pre-write guard');
}

export async function sweepLeftoverFixtures() {
  await ctx.db.query(
    `DELETE br FROM borrow_records br
     JOIN books b ON b.id = br.book_id
     WHERE b.isbn LIKE '${FIXTURE_ISBN_PREFIX}%'`
  );
  await ctx.db.query(
    `DELETE FROM borrow_records WHERE user_id IN (
       SELECT id FROM (SELECT id FROM users WHERE email LIKE '${FIXTURE_EMAIL_PREFIX}%@${FIXTURE_EMAIL_DOMAIN}') AS t
     )`
  );
  await ctx.db.query(`DELETE FROM books WHERE isbn LIKE '${FIXTURE_ISBN_PREFIX}%'`);
  await ctx.db.query(`DELETE FROM users WHERE email LIKE '${FIXTURE_EMAIL_PREFIX}%@${FIXTURE_EMAIL_DOMAIN}'`);
  await ctx.db.query('DELETE FROM books WHERE isbn = ?', [CONTROL_ISBN]);
}

export async function seedFixtures() {
  const { db } = ctx;

  const [userResult] = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Integration Tester', `${FIXTURE_EMAIL_PREFIX}user@${FIXTURE_EMAIL_DOMAIN}`, 'integration-placeholder-hash', 'student']
  );
  const userId = userResult.insertId;

  const specs = [
    { key: 'borrow', isbn: 'IT-FIX0000001', title: 'ITFIX Borrow Target', total: 2 },
    { key: 'guard', isbn: 'IT-FIX0000002', title: 'ITFIX Guard Target', total: 3 },
    { key: 'race', isbn: 'IT-FIX0000003', title: 'ITFIX Race Target', total: 1 }
  ];

  const books = {};
  const bookIds = [];
  for (const spec of specs) {
    const [result] = await db.query(
      `INSERT INTO books (title, author, isbn, genre, description, total_quantity, available_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [spec.title, 'ITFIX Author', spec.isbn, 'Testing', null, spec.total, spec.total]
    );
    books[spec.key] = result.insertId;
    bookIds.push(result.insertId);
  }

  const [controlResult] = await db.query(
    `INSERT INTO books (title, author, isbn, genre, description, total_quantity, available_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['CONTROL Sentinel', 'CONTROL Author', CONTROL_ISBN, 'Testing', null, 1, 1]
  );

  ctx.fixtures = {
    userId,
    books,
    bookIds,
    controlId: controlResult.insertId,
    email: `${FIXTURE_EMAIL_PREFIX}user@${FIXTURE_EMAIL_DOMAIN}`
  };
  return ctx.fixtures;
}

export async function removeFixtures() {
  await assertActiveDatabase();
  const { db, fixtures } = ctx;
  if (!fixtures) return { removed: false };

  const placeholders = fixtures.bookIds.map(() => '?').join(', ');
  const [recordsBefore] = await db.query(
    `SELECT COUNT(*) AS c FROM borrow_records WHERE user_id = ? OR book_id IN (${placeholders})`,
    [fixtures.userId, ...fixtures.bookIds]
  );

  await db.query(
    `DELETE br FROM borrow_records br
     JOIN books b ON b.id = br.book_id
     WHERE b.isbn LIKE '${FIXTURE_ISBN_PREFIX}%'`
  );
  await db.query(
    `DELETE FROM borrow_records WHERE user_id IN (
       SELECT id FROM (SELECT id FROM users WHERE email LIKE '${FIXTURE_EMAIL_PREFIX}%@${FIXTURE_EMAIL_DOMAIN}') AS t
     )`
  );
  const [booksResult] = await db.query(`DELETE FROM books WHERE isbn LIKE '${FIXTURE_ISBN_PREFIX}%'`);
  const [usersResult] = await db.query(
    `DELETE FROM users WHERE email LIKE '${FIXTURE_EMAIL_PREFIX}%@${FIXTURE_EMAIL_DOMAIN}'`
  );

  return {
    removed: true,
    fixtureRecords: recordsBefore[0].c,
    booksRemoved: booksResult.affectedRows,
    usersRemoved: usersResult.affectedRows
  };
}

export async function removeControlFixture() {
  await assertActiveDatabase();
  const [result] = await ctx.db.query('DELETE FROM books WHERE isbn = ?', [CONTROL_ISBN]);
  return result.affectedRows;
}

export async function teardown() {
  if (!ctx) return;
  try {
    await removeFixtures();
    await removeControlFixture();
  } finally {
    await ctx.db.end();
    ctx = null;
  }
}

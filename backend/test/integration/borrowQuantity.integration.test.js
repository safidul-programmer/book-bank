import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  setup,
  teardown,
  assertActiveDatabase,
  seedFixtures,
  sweepLeftoverFixtures,
  removeFixtures,
  TEST_DB_NAME,
  PRODUCTION_DB_NAME,
  CONTROL_ISBN,
  FIXTURE_ISBN_PREFIX,
  FIXTURE_EMAIL_PREFIX,
  FIXTURE_EMAIL_DOMAIN
} from './helpers/testDb.js';

let ctx = null;
let fixtures = null;
let borrowRecordId = null;

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

async function getBook(id) {
  const [rows] = await ctx.db.query('SELECT * FROM books WHERE id = ?', [id]);
  return rows[0];
}

async function getRecord(id) {
  const [rows] = await ctx.db.query('SELECT * FROM borrow_records WHERE id = ?', [id]);
  return rows[0];
}

async function outstandingFor(bookId) {
  const [[row]] = await ctx.db.query(
    'SELECT COUNT(*) AS c FROM borrow_records WHERE book_id = ? AND return_date IS NULL',
    [bookId]
  );
  return row.c;
}

async function countRows(sql, params = []) {
  const [[row]] = await ctx.db.query(sql, params);
  return row.c;
}

describe(`MySQL integration tests (database: ${TEST_DB_NAME})`, () => {
  before(async () => {
    ctx = await setup();
    await sweepLeftoverFixtures();
    fixtures = await seedFixtures();
  });

  beforeEach(async () => {
    await assertActiveDatabase();
  });

  after(async () => {
    await teardown();
  });

  it('1. borrowing an available book decreases available_quantity and creates a borrow record', async () => {
    const bookId = fixtures.books.borrow;
    const before = await getBook(bookId);
    assert.equal(before.total_quantity, 2, 'fixture starts with 2 copies');
    assert.equal(before.available_quantity, 2, 'fixture starts fully available');

    const result = await ctx.borrowModel.borrowBook(fixtures.userId, bookId);
    assert.ok(result.borrow, 'expected a borrow record to be created');
    assert.equal(result.error, undefined, 'expected no error token');

    const after = await getBook(bookId);
    assert.equal(after.available_quantity, before.available_quantity - 1, 'available drops by exactly 1');
    assert.equal(after.total_quantity, before.total_quantity, 'total_quantity is unchanged');

    const record = await getRecord(result.borrow.id);
    assert.ok(record, 'the borrow record exists in the database');
    assert.equal(record.user_id, fixtures.userId);
    assert.equal(record.book_id, bookId);
    assert.equal(record.return_date, null, 'record is outstanding');
    assert.ok(record.due_date, 'due_date was populated');

    borrowRecordId = result.borrow.id;
  });

  it('2. returning that borrowed book restores available_quantity and records the return', async () => {
    assert.ok(borrowRecordId, 'depends on the record created by test 1');

    const before = await getBook(fixtures.books.borrow);
    assert.equal(before.available_quantity, 1, 'one copy is out on loan');

    const result = await ctx.borrowModel.returnBook(borrowRecordId, fixtures.userId);
    assert.ok(result.record, 'expected the returned record');

    const after = await getBook(fixtures.books.borrow);
    assert.equal(after.available_quantity, before.available_quantity + 1, 'available restored by exactly 1');
    assert.equal(after.available_quantity, 2, 'available back to the original value');
    assert.equal(after.total_quantity, 2, 'total_quantity still unchanged');

    const record = await getRecord(borrowRecordId);
    assert.notEqual(record.return_date, null, 'return_date is recorded');
    assert.equal(await outstandingFor(fixtures.books.borrow), 0, 'no outstanding borrows remain');
  });

  it('3. reducing total_quantity below outstanding borrows is rejected and leaves values unchanged', async () => {
    const bookId = fixtures.books.guard;

    await ctx.borrowModel.borrowBook(fixtures.userId, bookId);
    await ctx.borrowModel.borrowBook(fixtures.userId, bookId);

    const before = await getBook(bookId);
    assert.equal(before.total_quantity, 3);
    assert.equal(before.available_quantity, 1);
    assert.equal(await outstandingFor(bookId), 2, 'two copies are outstanding');

    const unchanged = {
      title: before.title,
      author: before.author,
      isbn: before.isbn,
      genre: before.genre,
      description: before.description
    };

    const okRes = makeRes();
    await ctx.bookController.updateExistingBook(
      { params: { id: String(bookId) }, body: { ...unchanged, total_quantity: 3 } },
      okRes
    );
    assert.equal(okRes.statusCode, 200, 'an equal total_quantity is still accepted');
    assert.equal(okRes.body.success, true);

    const rejectedRes = makeRes();
    await ctx.bookController.updateExistingBook(
      { params: { id: String(bookId) }, body: { ...unchanged, total_quantity: 1 } },
      rejectedRes
    );
    assert.equal(rejectedRes.statusCode, 400, 'reduction below outstanding is rejected');
    assert.equal(
      rejectedRes.body.message,
      'total_quantity cannot be less than the number of outstanding borrowed copies'
    );

    const after = await getBook(bookId);
    assert.equal(after.total_quantity, before.total_quantity, 'total_quantity unchanged after rejection');
    assert.equal(after.available_quantity, before.available_quantity, 'available_quantity unchanged after rejection');
    assert.equal(await outstandingFor(bookId), 2, 'outstanding borrow count unchanged');
  });

  it('4. concurrent borrows of the last copy never oversell or drive available_quantity negative', async () => {
    const bookId = fixtures.books.race;
    const attempts = 6;

    const start = await getBook(bookId);
    assert.equal(start.total_quantity, 1, 'fixture has a single copy');
    assert.equal(start.available_quantity, 1, 'exactly one copy is available');

    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        ctx.borrowModel
          .borrowBook(fixtures.userId, bookId)
          .then((value) => ({ ok: true, value }))
          .catch((error) => ({ ok: false, error }))
      )
    );

    const successes = results.filter((r) => r.ok && r.value && r.value.borrow);
    const unavailable = results.filter((r) => r.ok && r.value && r.value.error === 'UNAVAILABLE');
    const unexpected = results.filter(
      (r) => !r.ok || (!r.value?.borrow && r.value?.error !== 'UNAVAILABLE')
    );

    assert.equal(unexpected.length, 0, `no unexpected outcome allowed: ${JSON.stringify(unexpected)}`);
    assert.equal(successes.length, 1, 'exactly one borrow succeeds for one available copy');
    assert.equal(unavailable.length, attempts - 1, 'every other attempt is rejected as unavailable');

    const end = await getBook(bookId);
    assert.equal(end.available_quantity, 0, 'available_quantity reaches zero, never negative');
    assert.ok(end.available_quantity >= 0, 'available_quantity is not negative');
    assert.equal(end.total_quantity, 1, 'total_quantity is unchanged');

    const created = await countRows('SELECT COUNT(*) AS c FROM borrow_records WHERE book_id = ?', [bookId]);
    assert.equal(created, successes.length, 'borrow records created exactly match successful borrows');
  });

  it('5. cleanup removes only the fixtures created by this suite', async () => {
    const fixtureBookCount = fixtures.bookIds.length;
    const booksBefore = await countRows('SELECT COUNT(*) AS c FROM books');
    const controlBefore = await countRows('SELECT COUNT(*) AS c FROM books WHERE isbn = ?', [CONTROL_ISBN]);
    assert.equal(controlBefore, 1, 'control row exists before cleanup');

    const summary = await removeFixtures();
    assert.equal(summary.removed, true);

    assert.equal(
      await countRows('SELECT COUNT(*) AS c FROM books WHERE isbn LIKE ?', [`${FIXTURE_ISBN_PREFIX}%`]),
      0,
      'no fixture books remain'
    );
    const bookPlaceholders = fixtures.bookIds.map(() => '?').join(', ');
    assert.equal(
      await countRows(`SELECT COUNT(*) AS c FROM books WHERE id IN (${bookPlaceholders})`, fixtures.bookIds),
      0,
      'every fixture book id is gone'
    );
    assert.equal(
      await countRows('SELECT COUNT(*) AS c FROM borrow_records WHERE user_id = ?', [fixtures.userId]),
      0,
      'every fixture borrow record is gone'
    );
    assert.equal(
      await countRows('SELECT COUNT(*) AS c FROM users WHERE id = ?', [fixtures.userId]),
      0,
      'the fixture user is gone'
    );

    const controlAfter = await countRows('SELECT COUNT(*) AS c FROM books WHERE isbn = ?', [CONTROL_ISBN]);
    assert.equal(controlAfter, 1, 'the non-fixture control row survives cleanup');

    const booksAfter = await countRows('SELECT COUNT(*) AS c FROM books');
    assert.equal(
      booksBefore - booksAfter,
      fixtureBookCount,
      'cleanup removed exactly the fixture books and nothing else'
    );
  });

  it(`6. the production ${PRODUCTION_DB_NAME} database was not written to`, async () => {
    const now = {};
    const [[books]] = await ctx.db.query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.books`);
    const [[users]] = await ctx.db.query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.users`);
    const [[records]] = await ctx.db.query(`SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.borrow_records`);
    now.books = books.c;
    now.users = users.c;
    now.records = records.c;

    assert.deepEqual(
      { books: now.books, users: now.users, borrow_records: now.records },
      ctx.productionBaseline,
      `row counts in ${PRODUCTION_DB_NAME} are unchanged since suite start`
    );

    assert.equal(
      await countRows(
        `SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.books WHERE isbn LIKE ? OR isbn = ?`,
        [`${FIXTURE_ISBN_PREFIX}%`, CONTROL_ISBN]
      ),
      0,
      'no fixture or control books were written to the production database'
    );
    assert.equal(
      await countRows(
        `SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.users WHERE email LIKE ?`,
        [`${FIXTURE_EMAIL_PREFIX}%@${FIXTURE_EMAIL_DOMAIN}`]
      ),
      0,
      'no fixture users were written to the production database'
    );
    assert.equal(
      await countRows(
        `SELECT COUNT(*) AS c FROM \`${PRODUCTION_DB_NAME}\`.books WHERE title LIKE 'ITFIX %' OR title = 'CONTROL Sentinel'`
      ),
      0,
      'no fixture rows exist in the production database'
    );
  });
});

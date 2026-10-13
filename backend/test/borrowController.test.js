import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const MODEL_URL = new URL('../src/models/borrowModel.js', import.meta.url).href;

const state = {
  borrowResult: null,
  returnResult: null,
  history: [],
  stats: { active: 0, returned: 0 },
  calls: []
};

mock.module(MODEL_URL, {
  exports: {
    getBorrowStats: async () => {
      state.calls.push(['getBorrowStats']);
      return state.stats;
    },
    findBookById: async () => null,
    getMyBorrowHistory: async (userId) => {
      state.calls.push(['getMyBorrowHistory', userId]);
      return state.history;
    },
    borrowBook: async (userId, bookId) => {
      state.calls.push(['borrowBook', userId, bookId]);
      return state.borrowResult;
    },
    returnBook: async (recordId, userId) => {
      state.calls.push(['returnBook', recordId, userId]);
      return state.returnResult;
    }
  }
});

const { borrowBookHandler, returnBookHandler, getMyBorrowHistoryHandler, getBorrowStatsHandler } =
  await import(new URL('../src/controllers/borrowController.js', import.meta.url).href);

function reset() {
  state.borrowResult = null;
  state.returnResult = null;
  state.history = [];
  state.stats = { active: 0, returned: 0 };
  state.calls.length = 0;
}

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

function borrowReq(body) {
  return { body, user: { id: 7 } };
}

function returnReq(id) {
  return { params: { id }, user: { id: 7 } };
}

describe('borrowBookHandler', () => {
  it('returns 400 when book_id is missing', async () => {
    reset();
    const res = makeRes();
    await borrowBookHandler(borrowReq({}), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'book_id is required');
    assert.deepEqual(state.calls, []);
  });

  it('returns 400 for non-integer or non-positive book_id', async () => {
    for (const [body, message] of [
      [{ book_id: '3' }, 'book_id must be a valid positive integer'],
      [{ book_id: 1.5 }, 'book_id must be a valid positive integer'],
      [{ book_id: 0 }, 'book_id must be a valid positive integer'],
      [{ book_id: -4 }, 'book_id must be a valid positive integer']
    ]) {
      reset();
      const res = makeRes();
      await borrowBookHandler(borrowReq(body), res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, message);
      assert.deepEqual(state.calls, []);
    }
  });

  it('returns 404 when the book does not exist', async () => {
    reset();
    state.borrowResult = { error: 'NOT_FOUND' };
    const res = makeRes();
    await borrowBookHandler(borrowReq({ book_id: 12 }), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Book not found');
    assert.deepEqual(state.calls, [['borrowBook', 7, 12]]);
  });

  it('returns 400 when no copy is available', async () => {
    reset();
    state.borrowResult = { error: 'UNAVAILABLE' };
    const res = makeRes();
    await borrowBookHandler(borrowReq({ book_id: 3 }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Book is currently unavailable');
  });

  it('returns 201 with the borrow record', async () => {
    reset();
    const record = { id: 11, user_id: 7, book_id: 3, return_date: null };
    state.borrowResult = { borrow: record };
    const res = makeRes();
    await borrowBookHandler(borrowReq({ book_id: 3 }), res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { success: true, data: record });
    assert.deepEqual(state.calls, [['borrowBook', 7, 3]]);
  });
});

describe('returnBookHandler', () => {
  it('returns 400 for a malformed record id', async () => {
    for (const id of ['abc', '0', '-2', '1.5']) {
      reset();
      const res = makeRes();
      await returnBookHandler(returnReq(id), res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, 'id must be a valid positive integer');
      assert.deepEqual(state.calls, []);
    }
  });

  it('returns 404 when the record does not belong to the user', async () => {
    reset();
    state.returnResult = { error: 'NOT_FOUND' };
    const res = makeRes();
    await returnBookHandler(returnReq('9'), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Borrow record not found');
    assert.deepEqual(state.calls, [['returnBook', 9, 7]]);
  });

  it('returns 400 when the book was already returned', async () => {
    reset();
    state.returnResult = { error: 'ALREADY_RETURNED' };
    const res = makeRes();
    await returnBookHandler(returnReq('9'), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Book has already been returned');
  });

  it('returns 200 on a successful return', async () => {
    reset();
    const record = { id: 9, user_id: 7, book_id: 3, return_date: '2026-10-13T00:00:00.000Z' };
    state.returnResult = { record };
    const res = makeRes();
    await returnBookHandler(returnReq('9'), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Book returned successfully');
    assert.deepEqual(res.body.data, record);
  });
});

describe('history and stats handlers', () => {
  it('returns the caller history only', async () => {
    reset();
    state.history = [{ id: 1, book_id: 3 }];
    const res = makeRes();
    await getMyBorrowHistoryHandler({ user: { id: 7 } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, [{ id: 1, book_id: 3 }]);
    assert.deepEqual(state.calls, [['getMyBorrowHistory', 7]]);
  });

  it('returns borrow statistics', async () => {
    reset();
    state.stats = { active: 2, returned: 5 };
    const res = makeRes();
    await getBorrowStatsHandler({ user: { id: 7 } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, { active: 2, returned: 5 });
  });
});

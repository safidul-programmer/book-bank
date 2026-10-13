import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const MODEL_URL = new URL('../src/models/bookModel.js', import.meta.url).href;

const state = {
  isbnHit: null,
  bookById: { id: 1 },
  updateResult: { book: { id: 1 } },
  deleteError: null,
  calls: []
};

mock.module(MODEL_URL, {
  exports: {
    findAllBooks: async () => {
      state.calls.push(['findAllBooks']);
      return [];
    },
    findBookByIsbn: async (isbn, excludeId = null) => {
      state.calls.push(['findBookByIsbn', isbn, excludeId]);
      return state.isbnHit;
    },
    findBookById: async (id) => {
      state.calls.push(['findBookById', id]);
      return state.bookById;
    },
    createBook: async (payload) => {
      state.calls.push(['createBook', payload]);
      return { id: 7, ...payload };
    },
    updateBook: async (id, payload) => {
      state.calls.push(['updateBook', id, payload]);
      return state.updateResult;
    },
    deleteBook: async (id) => {
      state.calls.push(['deleteBook', id]);
      if (state.deleteError) throw state.deleteError;
    }
  }
});

const { validateBookPayload, getAllBooks, createNewBook, updateExistingBook, deleteExistingBook } =
  await import(new URL('../src/controllers/bookController.js', import.meta.url).href);

function reset() {
  state.isbnHit = null;
  state.bookById = { id: 1 };
  state.updateResult = { book: { id: 1 } };
  state.deleteError = null;
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

function req(body, id = '1') {
  return { body, params: { id } };
}

function ok(body) {
  const result = validateBookPayload(body);
  assert.equal(result.error, undefined, `expected valid, got: ${result.error}`);
  return result.value;
}

function bad(body) {
  const result = validateBookPayload(body);
  assert.ok(result.error, 'expected an error message');
  return result.error;
}

const base = () => ({
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  genre: 'Programming',
  description: 'A handbook of agile software craftsmanship',
  total_quantity: 3
});

describe('validateBookPayload', () => {
  it('accepts a valid payload and trims whitespace', () => {
    const v = ok({ ...base(), title: '  Clean Code  ', author: '  RCM ', isbn: ' 9780132350884 ' });
    assert.equal(v.title, 'Clean Code');
    assert.equal(v.author, 'RCM');
    assert.equal(v.isbn, '9780132350884');
    assert.equal(v.genre, 'Programming');
    assert.equal(v.description, 'A handbook of agile software craftsmanship');
    assert.equal(v.total_quantity, 3);
  });

  it('defaults omitted optional fields to null', () => {
    const v = ok({ title: 'T', author: 'A', isbn: '1234567890123', total_quantity: 1 });
    assert.equal(v.genre, null);
    assert.equal(v.description, null);
  });

  it('converts whitespace-only optional fields to null', () => {
    const v = ok({ ...base(), genre: '   ', description: '   ' });
    assert.equal(v.genre, null);
    assert.equal(v.description, null);
  });

  it('rejects missing, blank, non-string and over-length title/author', () => {
    assert.equal(bad({ ...base(), title: undefined }), 'title is required');
    assert.equal(bad({ ...base(), title: null }), 'title is required');
    assert.equal(bad({ ...base(), title: '     ' }), 'title must be a non-empty string');
    assert.equal(bad({ ...base(), title: 123 }), 'title must be a string');
    assert.equal(bad({ ...base(), title: 'x'.repeat(256) }), 'title must be at most 255 characters');
    assert.equal(ok({ ...base(), title: 'x'.repeat(255) }).title.length, 255);

    assert.equal(bad({ ...base(), author: undefined }), 'author is required');
    assert.equal(bad({ ...base(), author: '   ' }), 'author must be a non-empty string');
    assert.equal(bad({ ...base(), author: 'x'.repeat(151) }), 'author must be at most 150 characters');
    assert.equal(ok({ ...base(), author: 'x'.repeat(150) }).author.length, 150);
  });

  it('enforces VARCHAR(13) for isbn without inventing a format rule', () => {
    assert.equal(bad({ ...base(), isbn: undefined }), 'isbn is required');
    assert.equal(bad({ ...base(), isbn: '   ' }), 'isbn must be a non-empty string');
    assert.equal(bad({ ...base(), isbn: 9780132350884 }), 'isbn must be a string');
    assert.equal(bad({ ...base(), isbn: 'x'.repeat(14) }), 'isbn must be at most 13 characters');
    assert.ok(ok({ ...base(), isbn: 'x'.repeat(13) }));
    assert.ok(ok({ ...base(), isbn: '978-013-235' }));
  });

  it('validates optional genre against its type and VARCHAR(100)', () => {
    assert.equal(bad({ ...base(), genre: 5 }), 'genre must be a string');
    assert.equal(bad({ ...base(), genre: 'g'.repeat(101) }), 'genre must be at most 100 characters');
    assert.ok(ok({ ...base(), genre: 'g'.repeat(100) }));
  });

  it('validates optional description against its type and TEXT byte limit', () => {
    assert.equal(bad({ ...base(), description: 42 }), 'description must be a string');
    assert.equal(
      bad({ ...base(), description: 'a'.repeat(65536) }),
      'description must be at most 65535 bytes'
    );
    assert.ok(ok({ ...base(), description: 'a'.repeat(65535) }));
    assert.equal(
      bad({ ...base(), description: 'é'.repeat(33000) }),
      'description must be at most 65535 bytes'
    );
    assert.ok(ok({ ...base(), description: 'é'.repeat(20000) }));
  });

  it('rejects invalid total_quantity values (INT UNSIGNED 1..4294967295)', () => {
    assert.equal(bad({ ...base(), total_quantity: undefined }), 'total_quantity is required');
    assert.equal(bad({ ...base(), total_quantity: null }), 'total_quantity is required');
    assert.equal(bad({ ...base(), total_quantity: '5' }), 'total_quantity must be a number');
    assert.equal(bad({ ...base(), total_quantity: 'abc' }), 'total_quantity must be a number');
    assert.equal(bad({ ...base(), total_quantity: NaN }), 'total_quantity must be a number');
    assert.equal(bad({ ...base(), total_quantity: Infinity }), 'total_quantity must be a number');
    assert.equal(bad({ ...base(), total_quantity: 1.5 }), 'total_quantity must be a whole number');
    assert.equal(bad({ ...base(), total_quantity: 0 }), 'total_quantity must be a positive integer');
    assert.equal(bad({ ...base(), total_quantity: -1 }), 'total_quantity must be a positive integer');
    assert.equal(
      bad({ ...base(), total_quantity: 4294967296 }),
      'total_quantity must be at most 4294967295'
    );
    assert.ok(ok({ ...base(), total_quantity: 1 }));
    assert.ok(ok({ ...base(), total_quantity: 4294967295 }));
  });

  it('treats a missing or malformed body as missing fields', () => {
    assert.equal(bad(undefined), 'title is required');
    assert.equal(bad(null), 'title is required');
    assert.equal(bad('not an object'), 'title is required');
    assert.equal(bad([]), 'title is required');
  });
});

describe('getAllBooks', () => {
  it('returns the book list', async () => {
    reset();
    const res = makeRes();
    await getAllBooks(req(undefined), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, data: [] });
  });
});

describe('createNewBook', () => {
  it('returns 400 for an invalid payload and never touches the model', async () => {
    reset();
    const res = makeRes();
    await createNewBook(req({ ...base(), total_quantity: 0 }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'total_quantity must be a positive integer');
    assert.deepEqual(state.calls, []);
  });

  it('returns 400 when the body is missing entirely', async () => {
    reset();
    const res = makeRes();
    await createNewBook(req(undefined), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'title is required');
    assert.deepEqual(state.calls, []);
  });

  it('returns 201 with normalised values', async () => {
    reset();
    const res = makeRes();
    await createNewBook(req({ ...base(), title: '  Clean Code ', isbn: ' 9780132350884 ' }), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.deepEqual(state.calls[0], ['findBookByIsbn', '9780132350884', null]);
    assert.equal(state.calls[1][0], 'createBook');
    assert.equal(state.calls[1][1].title, 'Clean Code');
    assert.equal(state.calls[1][1].total_quantity, 3);
  });

  it('returns 409 for a duplicate ISBN', async () => {
    reset();
    state.isbnHit = { id: 99 };
    const res = makeRes();
    await createNewBook(req(base()), res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'A book with this ISBN already exists');
    assert.equal(
      state.calls.some((call) => call[0] === 'createBook'),
      false
    );
  });
});

describe('updateExistingBook', () => {
  it('returns 404 for an unknown book', async () => {
    reset();
    state.bookById = undefined;
    const res = makeRes();
    await updateExistingBook(req(base(), '42'), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Book not found');
  });

  it('returns 400 for an invalid payload without updating', async () => {
    reset();
    const res = makeRes();
    await updateExistingBook(req({ ...base(), title: '   ' }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'title must be a non-empty string');
    assert.equal(
      state.calls.some((call) => call[0] === 'updateBook'),
      false
    );
  });

  it('returns 400 for an invalid quantity without updating', async () => {
    reset();
    const res = makeRes();
    await updateExistingBook(req({ ...base(), total_quantity: 2.5 }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'total_quantity must be a whole number');
    assert.equal(
      state.calls.some((call) => call[0] === 'updateBook'),
      false
    );
  });

  it('returns 409 when the ISBN belongs to another book', async () => {
    reset();
    state.isbnHit = { id: 5 };
    const res = makeRes();
    await updateExistingBook(req(base(), '1'), res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Another book with this ISBN already exists');
  });

  it('maps the outstanding-borrow guard to 400', async () => {
    reset();
    state.updateResult = { error: 'INSUFFICIENT_TOTAL' };
    const res = makeRes();
    await updateExistingBook(req({ ...base(), total_quantity: 1 }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      'total_quantity cannot be less than the number of outstanding borrowed copies'
    );
  });

  it('maps a lost row to 404', async () => {
    reset();
    state.updateResult = { error: 'NOT_FOUND' };
    const res = makeRes();
    await updateExistingBook(req(base()), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Book not found');
  });

  it('returns 200 with normalised values', async () => {
    reset();
    const res = makeRes();
    await updateExistingBook(req({ ...base(), author: '  Robert C. Martin  ' }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    const updateCall = state.calls.find((call) => call[0] === 'updateBook');
    assert.ok(updateCall, 'updateBook should be called');
    assert.equal(updateCall[1], '1');
    assert.equal(updateCall[2].author, 'Robert C. Martin');
    assert.equal(updateCall[2].total_quantity, 3);
  });
});

describe('deleteExistingBook', () => {
  it('returns 404 for an unknown book', async () => {
    reset();
    state.bookById = undefined;
    const res = makeRes();
    await deleteExistingBook(req(undefined, '42'), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Book not found');
  });

  it('returns 409 when borrow records block the delete', async () => {
    reset();
    state.deleteError = Object.assign(new Error('Cannot delete or update a parent row'), {
      errno: 1451
    });
    const res = makeRes();
    await deleteExistingBook(req(undefined, '1'), res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Cannot delete book: it has active borrow records');
  });

  it('returns 200 on success', async () => {
    reset();
    const res = makeRes();
    await deleteExistingBook(req(undefined, '1'), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Book deleted successfully');
    assert.deepEqual(state.calls[state.calls.length - 1], ['deleteBook', '1']);
  });
});

# AGENTS.md

## Project Structure

Two independent packages, no root workspace tooling:
- **`frontend/`** — React 19 + Vite 8 + Oxlint. Entry: `src/App.jsx`, `src/main.jsx`.
- **`backend/`** — Express 5 + MySQL2. Entry: `src/server.js`. ES modules (`"type": "module"`).

## Commands

Each package has its own `package.json`; run commands from within the respective directory.

**Frontend** (`frontend/`):
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — Oxlint
- `npm run preview` — preview production build

**Backend** (`backend/`):
- `npm run dev` — start with nodemon (auto-reload)
- `npm run start` — production start
- `npm test` — unit tests (node:test, mocks; glob `test/*.test.js` only)
- `npm run test:integration` — MySQL integration tests (local MySQL required; uses `book_bank_test`, never writes to `book_bank`)
- No lint or typecheck configured.

## Environment

Backend requires a `.env` file in `backend/` with:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (defaults: localhost, root, empty, `book_bank`)
- `PORT` (default: 5000)

Database connection pool: `backend/config/db.js` (note: lives outside `src/`).

## Gotchas

- Backend imports from `config/db.js` relative to project root, not `src/`. Models import `../../config/db.js`.
- Tests live in `backend/test/*.test.js` (unit) and `backend/test/integration/*.test.js` (integration). `npm test` deliberately excludes `test/integration`; run `npm run test:integration` separately.
- Integration tests must not be relaxed to touch `book_bank`. Their setup (`backend/test/integration/helpers/testDb.js`) aborts unless the active database is exactly `book_bank_test`, and never drops any database.
- No monorepo scripts — no `npm run dev` at root. Always run from the correct subdirectory.
- React Router DOM v7 is installed; frontend routing is handled via `react-router-dom`.

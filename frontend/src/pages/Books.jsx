import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import { IconSearch, IconChevronLeft, IconChevronRight } from '../components/Icons'
import './Books.css'

const PAGE_SIZE = 8

function Books() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [borrowMessage, setBorrowMessage] = useState('')
  const [borrowError, setBorrowError] = useState('')
  const [borrowingId, setBorrowingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/books`)
      setBooks(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch books. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [])

  const genres = useMemo(() => {
    const set = new Set()
    books.forEach((b) => { if (b.genre) set.add(b.genre) })
    return Array.from(set).sort()
  }, [books])

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return books.filter((book) => {
      const matchesGenre = genreFilter === 'all' || book.genre === genreFilter
      if (!matchesGenre) return false
      if (!query) return true
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.genre && book.genre.toLowerCase().includes(query)) ||
        (book.description && book.description.toLowerCase().includes(query))
      )
    })
  }, [books, searchQuery, genreFilter])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, genreFilter])

  const totalPages = Math.ceil(filteredBooks.length / PAGE_SIZE)
  const clampedPage = Math.min(Math.max(1, currentPage), totalPages || 1)

  const paginatedBooks = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE
    return filteredBooks.slice(start, start + PAGE_SIZE)
  }, [filteredBooks, clampedPage])

  const handleBorrow = async (bookId) => {
    const token = localStorage.getItem('token')
    if (!token) { setBorrowError('login-required'); return }
    setBorrowingId(bookId)
    setBorrowError('')
    setBorrowMessage('')
    try {
      const res = await axios.post(`${API_BASE}/api/borrow`, { book_id: bookId }, { headers: { Authorization: `Bearer ${token}` } })
      setBorrowMessage(res.data.message || 'Book borrowed successfully!')
      await fetchBooks()
    } catch (err) {
      setBorrowError(err.response?.data?.message || 'Failed to borrow book. Please try again.')
    } finally {
      setBorrowingId(null)
    }
  }

  const startIdx = (clampedPage - 1) * PAGE_SIZE

  return (
    <div className="books-page">
      <div className="books-header-section">
        <div className="books-header-inner">
          <span className="section-label">Library</span>
          <h1>Explore the library</h1>
          <p>Find your next book.</p>
        </div>
      </div>

      <div className="books-container">
        {!loading && !error && books.length > 0 && (
          <div className="books-toolbar">
            <div className="search-box">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title, author, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  &times;
                </button>
              )}
            </div>
            <div className="toolbar-right">
              <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
                <option value="all">All Genres</option>
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {(searchQuery || genreFilter !== 'all') && (
                <button type="button" className="clear-btn" onClick={() => { setSearchQuery(''); setGenreFilter('all'); setCurrentPage(1) }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <p className="results-text">
            Showing {startIdx + 1}&ndash;{Math.min(startIdx + PAGE_SIZE, filteredBooks.length)} of {filteredBooks.length} books
          </p>
        )}

        {borrowMessage && <div className="toast success">{borrowMessage}</div>}
        {borrowError && (
          <div className="toast error">
            {borrowError === 'login-required' ? (
              <>Please log in to borrow books. <Link to="/login" className="toast-link">Log in</Link></>
            ) : borrowError}
          </div>
        )}

        {loading && (
          <div className="books-status">
            <div className="spinner" />
            <p>Loading books...</p>
          </div>
        )}

        {error && !loading && <div className="books-error"><p>{error}</p></div>}

        {!loading && !error && books.length === 0 && (
          <div className="books-empty">
            <h2>No books available</h2>
            <p>There are no books in the system yet. Check back later.</p>
          </div>
        )}

        {!loading && !error && books.length > 0 && filteredBooks.length === 0 && (
          <div className="books-empty">
            <h2>No books found</h2>
            <p>Try adjusting your search or filter to find what you&apos;re looking for.</p>
            <button type="button" className="clear-btn" onClick={() => { setSearchQuery(''); setGenreFilter('all'); setCurrentPage(1) }}>
              Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredBooks.length > 0 && (
          <div className="books-grid">
            {paginatedBooks.map((book) => {
              const isAvailable = book.available_quantity > 0
              return (
                <div key={book.id || book.isbn} className="book-card">
                  <div className="book-card-cover">
                    <BookCover book={book} />
                  </div>
                  <div className="book-card-body">
                    <span className="book-card-genre">{book.genre || 'General'}</span>
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">{book.author}</p>
                    <div className="book-card-footer">
                      <span className={`availability ${isAvailable ? 'in-stock' : 'out-of-stock'}`}>
                        <span className="avail-dot" />
                        {isAvailable ? `${book.available_quantity} available` : 'Unavailable'}
                      </span>
                      {isAvailable ? (
                        <button
                          type="button"
                          className="borrow-btn"
                          disabled={borrowingId === book.id}
                          onClick={() => handleBorrow(book.id)}
                        >
                          {borrowingId === book.id ? 'Borrowing...' : 'Borrow'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="page-btn"
              disabled={clampedPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <IconChevronLeft size={14} />
              Prev
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`page-num ${page === clampedPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="page-btn"
              disabled={clampedPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <IconChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Books

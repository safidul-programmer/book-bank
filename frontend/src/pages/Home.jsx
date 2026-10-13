import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import { IconArrowRight } from '../components/Icons'
import './Home.css'

const heroBooks = [
  { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Programming' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History' },
  { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Fiction' },
  { title: 'The Design of Everyday Things', author: 'Don Norman', genre: 'Design' },
]

function Home() {
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0 })

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/books`)
        const allBooks = res.data.data
        setFeaturedBooks(allBooks.slice(0, 5))
        const available = allBooks.reduce((sum, b) => sum + (b.available_quantity || 0), 0)
        setStats({ total: allBooks.length, available })
      } catch { /* */ }
    }
    fetchBooks()
  }, [])

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-eyebrow">College Book Bank</span>
            <h1 className="hero-headline">
              Find the books<br />that move you forward.
            </h1>
            <p className="hero-desc">
              Discover, borrow, and track books from our growing collection.
              Built for students who read with purpose.
            </p>
            <div className="hero-actions">
              <Link to="/books" className="btn-primary">
                Explore Books
                <IconArrowRight size={16} />
              </Link>
              <Link to="/register" className="btn-secondary">
                Get Started
              </Link>
            </div>
          </div>

          <div className="hero-bookshelf">
            <div className="shelf-row">
              {heroBooks.map((book, i) => (
                <div key={i} className="shelf-book" style={{ '--i': i }}>
                  <BookCover book={book} size="hero" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED BOOKS */}
      {featuredBooks.length > 0 && (
        <section className="featured-section">
          <div className="featured-inner">
            <div className="section-head">
              <div>
                <span className="section-label">Collection</span>
                <h2 className="section-title">Explore the collection</h2>
              </div>
              <Link to="/books" className="section-link">
                View all books <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="featured-grid">
              {featuredBooks.map((book) => (
                <div key={book.id} className="featured-card">
                  <BookCover book={book} />
                  <div className="featured-info">
                    <h3>{book.title}</h3>
                    <p className="featured-author">{book.author}</p>
                    <div className="featured-meta">
                      {book.genre && <span className="featured-genre">{book.genre}</span>}
                      <span className={`featured-avail ${book.available_quantity > 0 ? 'in-stock' : 'out'}`}>
                        {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATISTICS */}
      {stats.total > 0 && (
        <section className="stats-section">
          <div className="stats-inner">
            <div className="stat-item">
              <span className="stat-number">{stats.total}+</span>
              <span className="stat-label">Books in Collection</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{stats.available}</span>
              <span className="stat-label">Available Now</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Online Access</span>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="steps-section">
        <div className="steps-inner">
          <span className="section-label">How it works</span>
          <h2 className="section-title">Three simple steps</h2>

          <div className="steps-grid">
            <div className="step">
              <span className="step-num">01</span>
              <div className="step-line" />
              <h3>Discover</h3>
              <p>Browse the library catalog. Search by title, author, or genre.</p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <div className="step-line" />
              <h3>Borrow</h3>
              <p>Check out available books with a single click. No queues.</p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <h3>Return</h3>
              <p>Track due dates and return books from your reading shelf.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-content">
            <h2>Your next book is waiting.</h2>
            <p>Create a free account and start building your reading library today.</p>
            <div className="cta-actions">
              <Link to="/books" className="btn-primary">
                Explore the Library
                <IconArrowRight size={16} />
              </Link>
              <Link to="/register" className="btn-secondary-light">
                Create Account
              </Link>
            </div>
          </div>
          <div className="cta-books">
            <BookCover book={{ title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Science' }} size="small" />
            <BookCover book={{ title: 'Dune', author: 'Frank Herbert', genre: 'Fiction' }} size="small" />
            <BookCover book={{ title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help' }} size="small" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  const [user, setUser] = useState(null)

  const readUser = useCallback(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.role) {
          setUser(parsed)
          return
        }
      }
    } catch { /* */ }
    setUser(null)
  }, [])

  useEffect(() => {
    readUser()
    const onAuthChange = () => readUser()
    window.addEventListener('auth-change', onAuthChange)
    return () => window.removeEventListener('auth-change', onAuthChange)
  }, [readUser])

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-brand">
              <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
                <rect x="1" y="3" width="9" height="20" rx="1.5" fill="#6b6b8a" />
                <rect x="13" y="5" width="9" height="18" rx="1.5" fill="#4a4a65" />
              </svg>
              <span className="footer-brand-text">
                <span className="footer-brand-serif">Book</span>
                <span className="footer-brand-sans">Bank</span>
              </span>
            </div>
            <p className="footer-desc">
              A digital library for college students. Discover, borrow, and track books.
            </p>
          </div>

          <div className="footer-link-col">
            <h4>Navigation</h4>
            <Link to="/">Home</Link>
            <Link to="/books">Browse Books</Link>
            {!user && <Link to="/login">Log in</Link>}
            {user && user.role !== 'admin' && <Link to="/my-borrows">My Borrows</Link>}
            {user && user.role === 'admin' && <Link to="/admin">Dashboard</Link>}
          </div>

          <div className="footer-link-col">
            <h4>Account</h4>
            {!user && <Link to="/register">Sign Up</Link>}
            {!user && <Link to="/admin/register">Admin Access</Link>}
            {user && <Link to="/books">Browse Catalog</Link>}
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Book Bank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { IconMenu, IconX } from './Icons'
import './Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

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

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    closeMenu()
    navigate('/login')
    window.dispatchEvent(new Event('auth-change'))
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <svg className="navbar-logo-icon" width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="3" width="9" height="20" rx="1.5" fill="var(--ink)" />
            <rect x="3.5" y="6" width="4" height="1.5" rx="0.5" fill="var(--cream)" opacity="0.5" />
            <rect x="3.5" y="9" width="4" height="1.5" rx="0.5" fill="var(--cream)" opacity="0.35" />
            <rect x="3.5" y="12" width="3" height="1.5" rx="0.5" fill="var(--cream)" opacity="0.25" />
            <rect x="13" y="5" width="9" height="18" rx="1.5" fill="var(--ink-secondary)" />
            <rect x="15.5" y="8" width="4" height="1.5" rx="0.5" fill="var(--cream)" opacity="0.5" />
            <rect x="15.5" y="11" width="4" height="1.5" rx="0.5" fill="var(--cream)" opacity="0.35" />
          </svg>
          <span className="navbar-brand-text">
            <span className="brand-book">BOOK</span>
            <span className="brand-bank">BANK</span>
          </span>
        </Link>

        <button
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          type="button"
        >
          {menuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><NavLink to="/" end onClick={closeMenu}>Home</NavLink></li>
          <li><NavLink to="/books" onClick={closeMenu}>Books</NavLink></li>
          {user && user.role !== 'admin' && (
            <li><NavLink to="/my-borrows" onClick={closeMenu}>My Borrows</NavLink></li>
          )}
          {user && user.role === 'admin' && (
            <li><NavLink to="/admin" onClick={closeMenu}>Dashboard</NavLink></li>
          )}
          {user ? (
            <li>
              <button type="button" className="nav-logout" onClick={handleLogout}>
                Log out
              </button>
            </li>
          ) : (
            <>
              <li><NavLink to="/login" onClick={closeMenu}>Log in</NavLink></li>
              <li><NavLink to="/register" className="nav-cta" onClick={closeMenu}>Get Started</NavLink></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar

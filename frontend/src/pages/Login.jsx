import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const errorMsg = sessionStorage.getItem('auth-message')
    if (errorMsg) { setApiError(errorMsg); sessionStorage.removeItem('auth-message') }
    const successMsg = sessionStorage.getItem('register-success')
    if (successMsg) { setSuccessMessage(successMsg); sessionStorage.removeItem('register-success') }

    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try {
        const user = JSON.parse(stored)
        if (user && user.role === 'admin') { navigate('/admin', { replace: true }) }
      } catch { /* */ }
    }
  }, [navigate])

  const validate = () => {
    const newErrors = {}
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    if (!formData.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
    if (successMessage) setSuccessMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setApiError('')
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email: formData.email, password: formData.password })
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
      window.dispatchEvent(new Event('auth-change'))
      navigate(res.data.data.user.role === 'admin' ? '/admin' : '/books')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <h2>Welcome back to Book Bank</h2>
          <p>Sign in to access your library, borrow books, and continue your reading journey.</p>
          <div className="auth-brand-quote">
            <p>&ldquo;A reader lives a thousand lives before he dies.&rdquo;</p>
          </div>
          <div className="auth-brand-books">
            <BookCover book={{ title: 'Clean Code', author: 'Robert C. Martin', genre: 'Programming' }} size="small" />
            <BookCover book={{ title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History' }} size="small" />
            <BookCover book={{ title: 'Dune', author: 'Frank Herbert', genre: 'Fiction' }} size="small" />
          </div>
        </div>
      </div>
      <div className="auth-card-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Sign In</h1>
            <p>Enter your credentials to access your account</p>
          </div>

          {apiError && <div className="auth-error">{apiError}</div>}
          {successMessage && <div className="auth-success">{successMessage}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
          <p className="auth-footer-text">
            <Link to="/admin/register">Admin registration</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import './Auth.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try {
        const user = JSON.parse(stored)
        if (user && user.role) { navigate(user.role === 'admin' ? '/admin' : '/books', { replace: true }) }
      } catch { /* */ }
    }
  }, [navigate])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setApiError('')
    try {
      await axios.post(`${API_BASE}/api/auth/register`, { name: formData.name, email: formData.email, password: formData.password })
      sessionStorage.setItem('register-success', 'Registration successful. Please log in.')
      navigate('/login')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <h2>Join Book Bank today</h2>
          <p>Create your free account to start borrowing books and building your personal reading library.</p>
          <div className="auth-brand-quote">
            <p>&ldquo;The more that you read, the more things you will know.&rdquo;</p>
          </div>
          <div className="auth-brand-books">
            <BookCover book={{ title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help' }} size="small" />
            <BookCover book={{ title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Science' }} size="small" />
            <BookCover book={{ title: 'The Design of Everyday Things', author: 'Don Norman', genre: 'Design' }} size="small" />
          </div>
        </div>
      </div>
      <div className="auth-card-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Create Account</h1>
            <p>Fill in your details to get started</p>
          </div>

          {apiError && <div className="auth-error">{apiError}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

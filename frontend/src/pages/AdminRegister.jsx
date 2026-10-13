import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import './AdminRegister.css'

function AdminRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', adminKey: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!formData.adminKey.trim()) newErrors.adminKey = 'Admin registration key is required'
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
      await axios.post(`${API_BASE}/api/auth/admin-register`, { name: formData.name, email: formData.email, password: formData.password, adminKey: formData.adminKey })
      setSuccess(true)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="auth-page">
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <h2>Admin account created</h2>
          <p>You can now sign in with your admin credentials.</p>
          <div className="auth-brand-books">
            <BookCover book={{ title: 'Clean Code', author: 'Robert C. Martin', genre: 'Programming' }} size="small" />
            <BookCover book={{ title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History' }} size="small" />
          </div>
        </div>
      </div>
        <div className="auth-card-side">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1>Registration Successful</h1>
              <p>Your admin account is ready.</p>
            </div>
            <div className="admin-register-success">
              <Link to="/login" className="auth-btn">Go to Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <h2>Admin Registration</h2>
          <p>Create an admin account to manage the Book Bank library system.</p>
          <div className="auth-brand-quote">
            <p>&ldquo;Librarians are the stewards of knowledge.&rdquo;</p>
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
            <h1>Admin Registration</h1>
            <p>Create an admin account for Book Bank</p>
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
            <div className="form-group">
              <label htmlFor="adminKey">Admin Registration Key</label>
              <input type="password" id="adminKey" name="adminKey" value={formData.adminKey} onChange={handleChange} placeholder="Enter admin key" autoComplete="off" />
              {errors.adminKey && <span className="field-error">{errors.adminKey}</span>}
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Register as Admin'}
            </button>
          </form>

          <p className="auth-footer-text">
            <Link to="/register">Student Registration</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminRegister

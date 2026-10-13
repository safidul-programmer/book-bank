import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import { IconPlus, IconPencil, IconTrash } from '../components/Icons'
import './AdminDashboard.css'

const initialForm = { title: '', author: '', isbn: '', genre: '', description: '', total_quantity: '' }

function AdminDashboard() {
  const [books, setBooks] = useState([])
  const [booksError, setBooksError] = useState('')
  const [totalUsers, setTotalUsers] = useState(null)
  const [activeBorrows, setActiveBorrows] = useState(null)
  const [returnedBooks, setReturnedBooks] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchBooks = async () => {
    try { const res = await axios.get(`${API_BASE}/api/books`); setBooks(res.data.data) }
    catch { setBooksError('Failed to load books.') }
  }

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API_BASE}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      setTotalUsers(res.data.data.count)
    } catch { /* */ }
  }

  const fetchBorrowStats = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API_BASE}/api/borrow/stats`, { headers: { Authorization: `Bearer ${token}` } })
      setActiveBorrows(res.data.data.active)
      setReturnedBooks(res.data.data.returned)
    } catch { /* */ }
  }

  useEffect(() => { fetchBooks(); fetchUsers(); fetchBorrowStats() }, [])

  const openAddModal = () => { setEditingBook(null); setFormData(initialForm); setFormErrors({}); setFormError(''); setShowModal(true) }

  const openEditModal = (book) => {
    setEditingBook(book)
    setFormData({ title: book.title || '', author: book.author || '', isbn: book.isbn || '', genre: book.genre || '', description: book.description || '', total_quantity: book.total_quantity ?? '' })
    setFormErrors({}); setFormError(''); setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingBook(null); setFormData(initialForm); setFormErrors({}); setFormError('') }

  const handleDelete = async (book) => {
    if (deletingId) return
    const token = localStorage.getItem('token')
    setDeletingId(book.id)
    try {
      await axios.delete(`${API_BASE}/api/books/${book.id}`, { headers: { Authorization: `Bearer ${token}` } })
      setConfirmDelete(null); fetchBooks()
    } catch (err) { setBooksError(err.response?.data?.message || 'Failed to delete book.'); setConfirmDelete(null) }
    finally { setDeletingId(null) }
  }

  const validate = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.author.trim()) errors.author = 'Author is required'
    if (!formData.isbn.trim()) errors.isbn = 'ISBN is required'
    if (!formData.total_quantity || Number(formData.total_quantity) < 1) errors.total_quantity = 'Quantity must be at least 1'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const token = localStorage.getItem('token')
    setSubmitting(true); setFormError('')
    const payload = { title: formData.title.trim(), author: formData.author.trim(), isbn: formData.isbn.trim(), genre: formData.genre.trim() || undefined, description: formData.description.trim() || undefined, total_quantity: Number(formData.total_quantity) }
    try {
      if (editingBook) { await axios.put(`${API_BASE}/api/books/${editingBook.id}`, payload, { headers: { Authorization: `Bearer ${token}` } }) }
      else { await axios.post(`${API_BASE}/api/books`, payload, { headers: { Authorization: `Bearer ${token}` } }) }
      closeModal(); fetchBooks()
    } catch (err) {
      setFormError(err.response?.data?.message || (editingBook ? 'Failed to update book.' : 'Failed to add book.'))
    } finally { setSubmitting(false) }
  }

  const stats = [
    { label: 'Total Books', value: books.length || '—', className: 'stat-blue' },
    { label: 'Active Borrows', value: activeBorrows !== null ? activeBorrows : '—', className: 'stat-amber' },
    { label: 'Returned', value: returnedBooks !== null ? returnedBooks : '—', className: 'stat-green' },
    { label: 'Users', value: totalUsers !== null ? totalUsers : '—', className: 'stat-rust' },
  ]

  return (
    <div className="admin-page">
      <div className="admin-header-section">
        <div className="admin-header-inner">
          <div>
            <span className="section-label">Admin</span>
            <h1>Dashboard</h1>
            <p>Manage books and monitor activity</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/books" className="btn-outline-sm">Browse Books</Link>
            <button type="button" className="btn-dark-sm" onClick={openAddModal}>
              <IconPlus size={14} /> Add Book
            </button>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-stats">
          {stats.map((s, i) => (
            <div key={i} className={`admin-stat-card ${s.className}`}>
              <span className="admin-stat-label">{s.label}</span>
              <span className="admin-stat-value">{s.value}</span>
            </div>
          ))}
        </div>

        {booksError && <div className="admin-error">{booksError}</div>}

        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Book Management</h2>
            <span className="admin-section-count">{books.length} books</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Genre</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length > 0 ? books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.isbn}</td>
                    <td>{book.genre || '—'}</td>
                    <td>{book.total_quantity}</td>
                    <td>{book.available_quantity}</td>
                    <td>
                      <div className="action-btns">
                        <button type="button" className="action-btn edit" onClick={() => openEditModal(book)}><IconPencil size={13} /></button>
                        <button type="button" className="action-btn delete" onClick={() => setConfirmDelete(book)} disabled={deletingId === book.id}><IconTrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="empty-cell">No books found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>&times;</button>
            </div>
            {formError && <div className="modal-error">{formError}</div>}
            <form className="modal-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter book title" />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input type="text" id="author" name="author" value={formData.author} onChange={handleChange} placeholder="Enter author name" />
                {formErrors.author && <span className="field-error">{formErrors.author}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="isbn">ISBN *</label>
                <input type="text" id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="Enter ISBN" />
                {formErrors.isbn && <span className="field-error">{formErrors.isbn}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="genre">Genre</label>
                  <input type="text" id="genre" name="genre" value={formData.genre} onChange={handleChange} placeholder="e.g. Fiction" />
                </div>
                <div className="form-group">
                  <label htmlFor="total_quantity">Quantity *</label>
                  <input type="number" id="total_quantity" name="total_quantity" min="1" value={formData.total_quantity} onChange={handleChange} placeholder="1" />
                  {formErrors.total_quantity && <span className="field-error">{formErrors.total_quantity}</span>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Optional description" rows="3" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? (editingBook ? 'Saving...' : 'Adding...') : (editingBook ? 'Save Changes' : 'Add Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => !deletingId && setConfirmDelete(null)}>
          <div className="modal-card modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Delete Book</h2>
              <button type="button" className="modal-close-btn" onClick={() => !deletingId && setConfirmDelete(null)}>&times;</button>
            </div>
            <div className="modal-confirm-body">
              <p>Are you sure you want to delete <strong>{confirmDelete.title}</strong>?</p>
              <p className="confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => !deletingId && setConfirmDelete(null)} disabled={deletingId}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(confirmDelete)} disabled={deletingId}>
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

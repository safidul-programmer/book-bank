import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config/api'
import BookCover from '../components/BookCover'
import './BorrowHistory.css'

function BorrowHistory() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noToken, setNoToken] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setNoToken(true); setLoading(false); return }
    fetchHistory()
  }, [])

  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('')
  const [returningId, setReturningId] = useState(null)

  const fetchHistory = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`${API_BASE}/api/borrow/my`, { headers: { Authorization: `Bearer ${token}` } })
      setRecords(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch borrowing history.')
    } finally { setLoading(false) }
  }

  const handleReturn = async (id) => {
    const token = localStorage.getItem('token')
    if (!token) { setToast('Please log in to return books.'); setToastType('error'); setTimeout(() => setToast(''), 3000); return }
    setReturningId(id)
    try {
      const res = await axios.post(`${API_BASE}/api/borrow/${id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast(res.data.message || 'Book returned successfully!')
      setToastType('success')
      await fetchHistory()
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to return book.')
      setToastType('error')
    } finally {
      setReturningId(null)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not returned'
    return new Date(dateStr).toLocaleDateString()
  }

  const activeBooks = records.filter((r) => !r.return_date)
  const returnedBooks = records.filter((r) => r.return_date)

  if (noToken) {
    return (
      <div className="history-page">
        <div className="history-header-section">
          <div className="history-header-inner">
            <span className="section-label">Reading</span>
            <h1>My Reading Shelf</h1>
            <p>Books you&apos;re currently reading and your borrowing history.</p>
          </div>
        </div>
        <div className="history-container">
          <div className="history-auth-required">
            <p>Please log in to view your reading shelf. <Link to="/login" className="history-login-link">Log in</Link></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-header-section">
        <div className="history-header-inner">
          <span className="section-label">Reading</span>
          <h1>My Reading Shelf</h1>
          <p>Books you&apos;re currently reading and your borrowing history.</p>
        </div>
      </div>

      <div className="history-container">
        {toast && <div className={`history-toast ${toastType}`}>{toast}</div>}

        {loading && (
          <div className="history-status">
            <div className="spinner" />
            <p>Loading your reading shelf...</p>
          </div>
        )}

        {error && !loading && <div className="history-error"><p>{error}</p></div>}

        {!loading && !error && records.length === 0 && (
          <div className="history-empty">
            <h2>Your shelf is empty</h2>
            <p>You haven&apos;t borrowed any books yet.</p>
            <Link to="/books" className="btn-primary" style={{ marginTop: '16px' }}>Browse Books</Link>
          </div>
        )}

        {!loading && !error && activeBooks.length > 0 && (
          <div className="shelf-section">
            <h2 className="shelf-section-title">Currently Borrowed</h2>
            <div className="shelf-grid">
              {activeBooks.map((record) => (
                <div key={record.id} className="shelf-card">
                  <div className="shelf-card-cover">
                    <BookCover book={{ title: record.title, author: record.author, genre: '' }} size="small" />
                  </div>
                  <div className="shelf-card-info">
                    <h3>{record.title}</h3>
                    <p className="shelf-card-author">{record.author}</p>
                    <div className="shelf-card-dates">
                      <span>Borrowed {formatDate(record.borrow_date)}</span>
                      <span>Due {formatDate(record.due_date)}</span>
                    </div>
                    <button type="button" className="return-btn" disabled={returningId === record.id} onClick={() => handleReturn(record.id)}>
                      {returningId === record.id ? 'Returning...' : 'Return Book'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && returnedBooks.length > 0 && (
          <div className="shelf-section">
            <h2 className="shelf-section-title">Returned</h2>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Borrowed</th>
                    <th>Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedBooks.map((record) => (
                    <tr key={record.id}>
                      <td data-label="Title">{record.title}</td>
                      <td data-label="Author">{record.author}</td>
                      <td data-label="Borrowed">{formatDate(record.borrow_date)}</td>
                      <td data-label="Returned">{formatDate(record.return_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BorrowHistory

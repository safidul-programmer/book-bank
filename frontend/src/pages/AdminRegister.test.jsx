import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import AdminRegister from './AdminRegister'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

function renderAdminRegister(initialEntry = '/admin/register') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin" element={<div data-testid="admin" />} />
        <Route path="/books" element={<div data-testid="books" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRegister', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the admin registration form for logged-out visitors', () => {
    renderAdminRegister()
    expect(screen.getByRole('heading', { name: 'Admin Registration', level: 1 })).toBeTruthy()
    expect(screen.getByLabelText('Admin Registration Key')).toBeTruthy()
  })

  it('keeps logged-in students on the form instead of bouncing them to /books', () => {
    localStorage.setItem('token', 'student-token')
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Student', email: 's@example.test', role: 'student' }))
    renderAdminRegister()
    expect(screen.getByRole('heading', { name: 'Admin Registration', level: 1 })).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
  })

  it('sends already logged-in admins to /admin', async () => {
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }))
    renderAdminRegister()
    await waitFor(() => expect(screen.getByTestId('admin')).toBeTruthy())
  })

  it('submits the admin key to /api/auth/admin-register and shows the success screen', async () => {
    axios.post.mockResolvedValue({ data: { success: true, data: { id: 9, role: 'admin' } } })
    renderAdminRegister()

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Admin' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new-admin@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('Admin Registration Key'), { target: { value: 'correct-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register as Admin' }))

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1))
    const [url, body] = axios.post.mock.calls[0]
    expect(url).toContain('/api/auth/admin-register')
    expect(body.adminKey).toBe('correct-key')

    expect(await screen.findByRole('heading', { name: 'Registration Successful' })).toBeTruthy()
  })

  it('shows the backend error when the admin key is rejected', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid admin registration key' } } })
    renderAdminRegister()

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Admin' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new-admin@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('Admin Registration Key'), { target: { value: 'wrong-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register as Admin' }))

    expect(await screen.findByText('Invalid admin registration key')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Admin Registration', level: 1 })).toBeTruthy()
  })
})

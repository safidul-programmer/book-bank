import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import Login from './Login'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<div data-testid="admin" />} />
        <Route path="/books" element={<div data-testid="books" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the login form for logged-out visitors', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeTruthy()
  })

  it('keeps logged-in students on the login form instead of bouncing them to /books', () => {
    localStorage.setItem('token', 'student-token')
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Student', email: 's@example.test', role: 'student' }))
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
    expect(screen.queryByTestId('admin')).toBeNull()
  })

  it('keeps a stale session without a role on the login form so the user can sign in again', () => {
    localStorage.setItem('token', 'stale-token')
    localStorage.setItem('user', JSON.stringify({ id: 3, name: 'Stale', email: 'stale@example.test' }))
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
  })

  it('sends already logged-in admins to /admin', async () => {
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }))
    renderLogin()
    await waitFor(() => expect(screen.getByTestId('admin')).toBeTruthy())
  })

  it('stores the role from the backend response and routes admins to /admin', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          token: 'fake-token',
          user: { id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }
        }
      }
    })
    renderLogin()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => expect(screen.getByTestId('admin')).toBeTruthy())
    expect(localStorage.getItem('token')).toBe('fake-token')
    expect(JSON.parse(localStorage.getItem('user')).role).toBe('admin')
  })

  it('routes a student login response to /books and stores the student role', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          token: 'fake-token',
          user: { id: 2, name: 'Student', email: 's@example.test', role: 'student' }
        }
      }
    })
    renderLogin()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 's@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => expect(screen.getByTestId('books')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('user')).role).toBe('student')
  })
})

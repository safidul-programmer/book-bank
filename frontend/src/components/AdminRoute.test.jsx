import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminRoute from './AdminRoute'

function renderAdmin(initialEntry = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<div data-testid="dashboard" />} />
        </Route>
        <Route path="/login" element={<div data-testid="login" />} />
        <Route path="/books" element={<div data-testid="books" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends unauthenticated visitors to /login', () => {
    renderAdmin()
    expect(screen.getByTestId('login')).toBeTruthy()
    expect(screen.queryByTestId('dashboard')).toBeNull()
    expect(screen.queryByTestId('books')).toBeNull()
  })

  it('keeps students away from /admin by sending them to /books', () => {
    localStorage.setItem('token', 'student-token')
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Student', email: 's@example.test', role: 'student' }))
    renderAdmin()
    expect(screen.getByTestId('books')).toBeTruthy()
    expect(screen.queryByTestId('dashboard')).toBeNull()
  })

  it('renders the dashboard outlet for admins', () => {
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }))
    renderAdmin()
    expect(screen.getByTestId('dashboard')).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
  })

  it('sends a session without a role to /login instead of /books', () => {
    localStorage.setItem('token', 'stale-token')
    localStorage.setItem('user', JSON.stringify({ id: 3, name: 'Stale', email: 'stale@example.test' }))
    renderAdmin()
    expect(screen.getByTestId('login')).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
  })

  it('sends a session with corrupt stored user data to /login', () => {
    localStorage.setItem('token', 'stale-token')
    localStorage.setItem('user', 'not-json{')
    renderAdmin()
    expect(screen.getByTestId('login')).toBeTruthy()
    expect(screen.queryByTestId('books')).toBeNull()
  })
})

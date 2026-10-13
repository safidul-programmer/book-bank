import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import StudentRoute from './StudentRoute'

function renderStudentArea(initialEntry = '/my-borrows') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/my-borrows" element={<StudentRoute />}>
          <Route index element={<div data-testid="history" />} />
        </Route>
        <Route path="/login" element={<div data-testid="login" />} />
        <Route path="/admin" element={<div data-testid="admin" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StudentRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends unauthenticated visitors to /login', () => {
    renderStudentArea()
    expect(screen.getByTestId('login')).toBeTruthy()
    expect(screen.queryByTestId('history')).toBeNull()
  })

  it('lets students view their borrow history', () => {
    localStorage.setItem('token', 'student-token')
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Student', email: 's@example.test', role: 'student' }))
    renderStudentArea()
    expect(screen.getByTestId('history')).toBeTruthy()
  })

  it('sends admins to /admin', () => {
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }))
    renderStudentArea()
    expect(screen.getByTestId('admin')).toBeTruthy()
    expect(screen.queryByTestId('history')).toBeNull()
  })
})

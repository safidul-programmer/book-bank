import { Navigate, Outlet } from 'react-router-dom'

function StudentRoute() {
  const token = localStorage.getItem('token')
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user'))
  } catch {
    // invalid JSON in localStorage
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

export default StudentRoute

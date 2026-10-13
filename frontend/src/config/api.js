import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/api/auth/login')
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.setItem('auth-message', 'Your session has expired. Please log in again.')
      window.dispatchEvent(new Event('auth-change'))
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default API_BASE

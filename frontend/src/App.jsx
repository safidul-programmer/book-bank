import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Books from './pages/Books'
import BorrowHistory from './pages/BorrowHistory'
import AdminDashboard from './pages/AdminDashboard'
import AdminRegister from './pages/AdminRegister'
import AdminRoute from './components/AdminRoute'
import StudentRoute from './components/StudentRoute'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/books" element={<Books />} />
          <Route path="/my-borrows" element={<StudentRoute />}>
            <Route index element={<BorrowHistory />} />
          </Route>
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App

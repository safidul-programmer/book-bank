import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-text">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="notfound-btn">Go Home</Link>
      </div>
    </div>
  )
}

export default NotFound

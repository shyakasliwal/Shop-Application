import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('otp_jwt')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}


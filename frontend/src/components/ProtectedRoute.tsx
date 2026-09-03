import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the right dashboard based on role
    const roleHome: Record<UserRole, string> = {
      customer: '/dashboard',
      agent: '/agent',
      admin: '/admin',
    }
    return <Navigate to={roleHome[user.role]} replace />
  }

  return <>{children}</>
}

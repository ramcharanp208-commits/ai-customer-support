import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CustomerDashboard from './pages/CustomerDashboard'
import NewTicketPage from './pages/NewTicketPage'
import TicketDetailPage from './pages/TicketDetailPage'
import AgentDashboard from './pages/AgentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminTicketsPage from './pages/AdminTicketsPage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const roleHome = { customer: '/dashboard', agent: '/agent', admin: '/admin' }
  return <Navigate to={roleHome[user.role]} replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return (
    <>
      {isAuthenticated && <Navbar />}
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', maxWidth: '380px' },
          }}
        />
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Role-aware root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Customer */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['customer', 'agent', 'admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/tickets/new" element={
              <ProtectedRoute allowedRoles={['customer', 'agent', 'admin']}>
                <NewTicketPage />
              </ProtectedRoute>
            } />
            <Route path="/tickets/:id" element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            } />

            {/* Agent */}
            <Route path="/agent" element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agent/all" element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/tickets" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTicketsPage />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

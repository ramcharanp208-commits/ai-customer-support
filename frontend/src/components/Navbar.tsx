import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Ticket, LayoutDashboard, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = () => {
    if (!user) return []
    if (user.role === 'admin') {
      return [
        { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { to: '/admin/tickets', label: 'All Tickets', icon: <Ticket size={16} /> },
      ]
    }
    if (user.role === 'agent') {
      return [
        { to: '/agent', label: 'My Queue', icon: <LayoutDashboard size={16} /> },
        { to: '/agent/all', label: 'All Tickets', icon: <Ticket size={16} /> },
      ]
    }
    // customer
    return [
      { to: '/dashboard', label: 'My Tickets', icon: <Ticket size={16} /> },
      { to: '/tickets/new', label: 'New Ticket', icon: <PlusCircle size={16} /> },
    ]
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-brand-600 font-bold text-lg">
          <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563eb" />
            <path d="M8 10h16v2H8zM8 15h12v2H8zM8 20h10v2H8z" fill="white" />
            <circle cx="24" cy="21" r="5" fill="#10b981" />
            <path d="M22 21l1.5 1.5L26 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">SupportAI</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {navLinks().map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {link.icon}
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium">{user.name}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

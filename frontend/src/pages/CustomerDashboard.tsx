import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Inbox, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ticketsApi } from '../api/tickets'
import { useAuth } from '../context/AuthContext'
import type { Ticket } from '../types'
import TicketCard from '../components/TicketCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.myTickets()
      setTickets(data)
    } catch {
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTickets} className="btn-secondary" title="Refresh">
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link to="/tickets/new" className="btn-primary">
            <PlusCircle size={16} />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Open', value: stats.open, color: 'text-blue-600' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Inbox size={48} className="text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700">No tickets yet</h3>
          <p className="text-sm text-gray-500 mt-1">Submit your first support request to get started.</p>
          <Link to="/tickets/new" className="btn-primary mt-4">
            <PlusCircle size={16} />
            Create Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}

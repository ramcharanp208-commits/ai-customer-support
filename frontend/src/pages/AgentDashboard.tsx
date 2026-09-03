import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, Inbox, Users } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { useAuth } from '../context/AuthContext'
import type { Ticket } from '../types'
import TicketCard from '../components/TicketCard'
import LoadingSpinner from '../components/LoadingSpinner'

type Tab = 'mine' | 'all'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('mine')
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mine, all] = await Promise.all([ticketsApi.agentTickets(), ticketsApi.agentAllTickets()])
      setMyTickets(mine)
      setAllTickets(all)
    } catch {
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const displayed = tab === 'mine' ? myTickets : allTickets

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name}</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary">
          <RefreshCw size={15} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-brand-600">{myTickets.length}</div>
          <div className="text-xs text-gray-500 mt-1">Assigned to Me</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-yellow-600">{allTickets.length}</div>
          <div className="text-xs text-gray-500 mt-1">Open / Pending (All)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {([['mine', 'My Assigned Tickets'], ['all', 'All Open Tickets']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          {tab === 'mine'
            ? <><Users size={48} className="text-gray-300 mb-3" /><h3 className="font-semibold text-gray-700">No tickets assigned to you</h3><p className="text-sm text-gray-500 mt-1">Ask an admin to assign tickets to your queue.</p></>
            : <><Inbox size={48} className="text-gray-300 mb-3" /><h3 className="font-semibold text-gray-700">All clear — no open tickets</h3></>
          }
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}

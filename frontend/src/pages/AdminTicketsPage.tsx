import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import type { Ticket, TicketStatus, TicketPriority, TicketCategory, User } from '../types'
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [agents, setAgents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [filterCategory, setFilterCategory] = useState<TicketCategory | ''>('')

  const PAGE_SIZE = 15

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.adminList({
        page,
        page_size: PAGE_SIZE,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
        ...(filterCategory && { category: filterCategory }),
      })
      setTickets(data.tickets)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const data = await ticketsApi.listAgents()
      setAgents(data)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchTickets(); fetchAgents() }, [page, filterStatus, filterPriority, filterCategory])

  const handleAssign = async (ticketId: number, agentId: number) => {
    try {
      await ticketsApi.assign(ticketId, agentId)
      toast.success('Ticket assigned.')
      fetchTickets()
    } catch {
      toast.error('Assignment failed.')
    }
  }

  const handleStatusChange = async (ticketId: number, status: TicketStatus) => {
    try {
      await ticketsApi.updateStatus(ticketId, status)
      toast.success('Status updated.')
      fetchTickets()
    } catch {
      toast.error('Status update failed.')
    }
  }

  const handleDelete = async (ticketId: number) => {
    if (!window.confirm('Delete this ticket permanently? This cannot be undone.')) return
    try {
      await ticketsApi.delete(ticketId)
      toast.success('Ticket deleted.')
      fetchTickets()
    } catch {
      toast.error('Delete failed.')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const resetFilters = () => {
    setFilterStatus('')
    setFilterPriority('')
    setFilterCategory('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total tickets</p>
        </div>
        <button onClick={() => { fetchTickets(); fetchAgents() }} className="btn-secondary">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Status</label>
            <select className="input py-1.5 text-sm w-32" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as TicketStatus | ''); setPage(1) }}>
              <option value="">All</option>
              {(['open','pending','resolved','closed'] as TicketStatus[]).map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input py-1.5 text-sm w-32" value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as TicketPriority | ''); setPage(1) }}>
              <option value="">All</option>
              {(['urgent','high','medium','low'] as TicketPriority[]).map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input py-1.5 text-sm w-36" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value as TicketCategory | ''); setPage(1) }}>
              <option value="">All</option>
              {(['payment','billing','technical','account','general'] as TicketCategory[]).map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          {(filterStatus || filterPriority || filterCategory) && (
            <button onClick={resetFilters} className="btn-secondary text-xs py-1.5">Clear filters</button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No tickets match your filters.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Assign To</th>
                  <th className="px-4 py-3 text-left">Change Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-400">#{ticket.id}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <Link to={`/tickets/${ticket.id}`} className="font-medium text-brand-600 hover:underline truncate block">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><CategoryBadge category={ticket.category} /></td>
                    <td className="px-4 py-3">
                      <select
                        className="input py-1 text-xs w-36"
                        defaultValue={ticket.assigned_to ?? ''}
                        onChange={(e) => e.target.value && handleAssign(ticket.id, Number(e.target.value))}
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="input py-1 text-xs w-32"
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                      >
                        {(['open','pending','resolved','closed'] as TicketStatus[]).map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Delete ticket"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Page {page} of {totalPages} ({total} tickets)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-1.5 px-3"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { RefreshCw, Ticket, AlertTriangle, CheckCircle, Clock, Users, Inbox } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import type { DashboardStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bg: string
}

function StatCard({ label, value, icon, color, bg }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.dashboard()
      setStats(data)
    } catch {
      toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">System overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} className="btn-secondary">
            <RefreshCw size={15} />
            Refresh
          </button>
          <Link to="/admin/tickets" className="btn-primary">
            <Ticket size={16} />
            Manage Tickets
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tickets" value={stats.total_tickets} icon={<Inbox size={22} />} color="text-brand-700" bg="bg-brand-100" />
          <StatCard label="Open" value={stats.open_tickets} icon={<Ticket size={22} />} color="text-blue-700" bg="bg-blue-100" />
          <StatCard label="Pending" value={stats.pending_tickets} icon={<Clock size={22} />} color="text-yellow-700" bg="bg-yellow-100" />
          <StatCard label="Resolved" value={stats.resolved_tickets} icon={<CheckCircle size={22} />} color="text-green-700" bg="bg-green-100" />
          <StatCard label="Closed" value={stats.closed_tickets} icon={<CheckCircle size={22} />} color="text-gray-600" bg="bg-gray-100" />
          <StatCard label="High Priority" value={stats.high_priority} icon={<AlertTriangle size={22} />} color="text-orange-700" bg="bg-orange-100" />
          <StatCard label="Urgent" value={stats.urgent_tickets} icon={<AlertTriangle size={22} />} color="text-red-700" bg="bg-red-100" />
          <StatCard label="Unassigned" value={stats.unassigned_tickets} icon={<Users size={22} />} color="text-purple-700" bg="bg-purple-100" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/tickets" className="card hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 group-hover:bg-brand-200 transition-colors">
              <Ticket size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Manage All Tickets</div>
              <div className="text-xs text-gray-500">Filter, assign, update status, delete</div>
            </div>
          </div>
        </Link>

        <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm.75 4.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">AI-Powered Triage</div>
              <div className="text-xs text-gray-500">All tickets auto-classified by GPT-4o-mini</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

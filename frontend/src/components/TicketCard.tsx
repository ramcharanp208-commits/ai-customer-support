import { Link } from 'react-router-dom'
import { Clock, MessageSquare } from 'lucide-react'
import type { Ticket } from '../types'
import { StatusBadge, PriorityBadge, CategoryBadge } from './StatusBadge'

interface Props {
  ticket: Ticket
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TicketCard({ ticket }: Props) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="block">
      <div className="card hover:border-brand-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <CategoryBadge category={ticket.category} />
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{ticket.title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
            {ticket.ai_summary && (
              <p className="mt-2 text-xs text-brand-600 bg-brand-50 rounded-md px-2 py-1 line-clamp-1">
                AI: {ticket.ai_summary}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(ticket.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            View thread
          </span>
        </div>
      </div>
    </Link>
  )
}

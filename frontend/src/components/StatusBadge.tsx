import type { TicketCategory, TicketPriority, TicketStatus } from '../types'

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const categoryStyles: Record<TicketCategory, string> = {
  payment: 'bg-purple-100 text-purple-700',
  billing: 'bg-pink-100 text-pink-700',
  technical: 'bg-cyan-100 text-cyan-700',
  account: 'bg-indigo-100 text-indigo-700',
  general: 'bg-gray-100 text-gray-600',
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge capitalize ${statusStyles[status]}`}>{status}</span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge capitalize ${priorityStyles[priority]}`}>{priority}</span>
  )
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className={`badge capitalize ${categoryStyles[category]}`}>{category}</span>
  )
}

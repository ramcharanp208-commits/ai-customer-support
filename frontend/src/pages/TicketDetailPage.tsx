import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Sparkles, Bot, User, Headphones } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { useAuth } from '../context/AuthContext'
import type { TicketDetail, TicketStatus } from '../types'
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function timeFormat(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [statusChange, setStatusChange] = useState<TicketStatus | ''>('')
  const [sending, setSending] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)

  const ticketId = Number(id)

  const fetchTicket = async () => {
    try {
      const data = await ticketsApi.getById(ticketId)
      setTicket(data)
    } catch {
      toast.error('Ticket not found.')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTicket() }, [ticketId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await ticketsApi.postMessage(ticketId, {
        message: message.trim(),
        status_change: statusChange || undefined,
      })
      setMessage('')
      setStatusChange('')
      await fetchTicket()
      toast.success('Reply sent.')
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleAISuggest = async () => {
    setAiSuggesting(true)
    try {
      const res = await ticketsApi.suggestReply(ticketId)
      setMessage(res.suggested_reply)
      toast.success('AI suggestion loaded.')
    } catch {
      toast.error('AI suggestion unavailable.')
    } finally {
      setAiSuggesting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!ticket) return null

  const isStaff = user?.role === 'agent' || user?.role === 'admin'
  const isOpen = ticket.status !== 'resolved' && ticket.status !== 'closed'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Ticket header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <CategoryBadge category={ticket.category} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{ticket.description}</p>
          </div>
        </div>

        {/* AI summary */}
        {ticket.ai_summary && (
          <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">AI Analysis</span>
            </div>
            <p className="text-xs text-gray-700">{ticket.ai_summary}</p>
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-500 border-t pt-4">
          <div><span className="font-medium text-gray-700">Submitted by</span><br />{ticket.owner_name ?? 'Unknown'}</div>
          <div><span className="font-medium text-gray-700">Assigned to</span><br />{ticket.assignee_name ?? 'Unassigned'}</div>
          <div><span className="font-medium text-gray-700">Created</span><br />{timeFormat(ticket.created_at)}</div>
        </div>
      </div>

      {/* Message thread */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Conversation ({ticket.messages.length})</h2>

        {ticket.messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {ticket.messages.map((msg) => {
              const isAI = msg.sender_type === 'ai'
              const isAgent = msg.sender_type === 'agent'

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                    ${isAI ? 'bg-emerald-500' : isAgent ? 'bg-brand-600' : 'bg-gray-400'}`}>
                    {isAI ? <Bot size={14} /> : isAgent ? <Headphones size={14} /> : <User size={14} />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[75%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <span className="text-xs text-gray-500">
                      {msg.sender_name ?? (isAI ? 'AI Assistant' : 'Customer')} · {timeFormat(msg.created_at)}
                    </span>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm
                      ${isAI ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                        isAgent ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply box — staff only on open tickets */}
      {isStaff && isOpen && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Post a reply</h3>
            <button
              type="button"
              onClick={handleAISuggest}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
              disabled={aiSuggesting}
            >
              <Sparkles size={13} />
              {aiSuggesting ? 'Generating…' : 'AI Suggest'}
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Write your reply…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Also change status:</label>
                <select
                  className="input py-1 text-xs w-36"
                  value={statusChange}
                  onChange={(e) => setStatusChange(e.target.value as TicketStatus | '')}
                >
                  <option value="">— no change —</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={sending || !message.trim()}>
                <Send size={14} />
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOpen && (
        <div className="text-center py-4 text-sm text-gray-400 border-t">
          This ticket is {ticket.status}. No further replies can be added.
        </div>
      )}
    </div>
  )
}

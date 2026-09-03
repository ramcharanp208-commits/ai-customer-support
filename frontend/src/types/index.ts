// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'agent' | 'admin'

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TicketCategory = 'payment' | 'billing' | 'technical' | 'account' | 'general'

export type SenderType = 'customer' | 'agent' | 'ai'

// ─── Domain models ────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Message {
  id: number
  message: string
  sender_type: SenderType
  sender_name: string | null
  ticket_id: number
  created_at: string
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  ai_summary: string | null
  ai_suggested_reply: string | null
  user_id: number
  assigned_to: number | null
  created_at: string
  updated_at: string
}

export interface TicketDetail extends Ticket {
  messages: Message[]
  owner_name: string | null
  assignee_name: string | null
}

// ─── API response shapes ───────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface PaginatedTickets {
  total: number
  page: number
  page_size: number
  tickets: Ticket[]
}

export interface DashboardStats {
  total_tickets: number
  open_tickets: number
  pending_tickets: number
  resolved_tickets: number
  closed_tickets: number
  high_priority: number
  urgent_tickets: number
  unassigned_tickets: number
}

export interface AIAnalysisResult {
  category: TicketCategory
  priority: TicketPriority
  sentiment: string
  summary: string
  suggested_reply: string
  confidence: number
}

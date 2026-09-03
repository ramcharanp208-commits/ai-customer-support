import client from './client'
import type {
  DashboardStats,
  Message,
  PaginatedTickets,
  Ticket,
  TicketCategory,
  TicketDetail,
  TicketPriority,
  TicketStatus,
  User,
} from '../types'

export const ticketsApi = {
  // Customer
  create: (data: { title: string; description: string }) =>
    client.post<TicketDetail>('/tickets/', data).then((r) => r.data),

  myTickets: () =>
    client.get<Ticket[]>('/tickets/my').then((r) => r.data),

  getById: (id: number) =>
    client.get<TicketDetail>(`/tickets/${id}`).then((r) => r.data),

  // Agent
  agentTickets: () =>
    client.get<Ticket[]>('/agent/tickets').then((r) => r.data),

  agentAllTickets: () =>
    client.get<Ticket[]>('/agent/all-tickets').then((r) => r.data),

  postMessage: (ticketId: number, data: { message: string; status_change?: TicketStatus }) =>
    client.post<Message>(`/tickets/${ticketId}/messages`, data).then((r) => r.data),

  // Admin
  adminList: (params: {
    page?: number
    page_size?: number
    status?: TicketStatus
    priority?: TicketPriority
    category?: TicketCategory
  }) =>
    client.get<PaginatedTickets>('/admin/tickets', { params }).then((r) => r.data),

  dashboard: () =>
    client.get<DashboardStats>('/admin/dashboard').then((r) => r.data),

  listAgents: () =>
    client.get<User[]>('/admin/agents').then((r) => r.data),

  assign: (ticketId: number, agentId: number) =>
    client.patch<Ticket>(`/tickets/${ticketId}/assign`, { agent_id: agentId }).then((r) => r.data),

  updateStatus: (ticketId: number, status: TicketStatus) =>
    client.patch<Ticket>(`/tickets/${ticketId}/status`, { status }).then((r) => r.data),

  delete: (ticketId: number) =>
    client.delete(`/admin/tickets/${ticketId}`),

  // AI
  suggestReply: (ticketId: number) =>
    client.get<{ ticket_id: number; suggested_reply: string }>(`/ai/suggest-reply/${ticketId}`).then((r) => r.data),
}

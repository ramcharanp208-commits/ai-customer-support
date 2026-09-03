import client from './client'
import type { AuthResponse, User } from '../types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: 'customer' | 'agent' | 'admin'
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    client.post<User>('/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    client.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}

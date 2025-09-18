// 基础类型定义
export interface User {
  id: string
  name: string
  avatar?: string
  email?: string
  phone?: string
  status?: 'online' | 'offline' | 'away'
  lastSeen?: number
}

export interface Message {
  id: string
  content: string
  sender: string
  senderId: string
  timestamp: number
  type?: 'text' | 'image' | 'voice' | 'video' | 'file' | 'redpacket' | 'transfer'
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  replyTo?: string
  metadata?: Record<string, any>
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount?: number
  type?: 'private' | 'group'
  participants?: User[]
  createdAt?: number
  updatedAt?: number
}

export interface Group extends Chat {
  type: 'group'
  description?: string
  adminIds: string[]
  memberCount: number
  maxMembers?: number
  isPublic?: boolean
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

// Socket 事件类型
export interface SocketEvent {
  type: string
  data: any
  timestamp: number
  userId?: string
}

// 分页类型
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}
// 聊天API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, Chat, Message, PaginatedResponse } from './types'

class ChatApi {
  // 获取聊天列表
  async getChats(): Promise<ApiResponse<Chat[]>> {
    return apiClient.get<ApiResponse<Chat[]>>('/chats')
  }

  // 获取聊天详情
  async getChatById(chatId: string): Promise<ApiResponse<Chat>> {
    return apiClient.get<ApiResponse<Chat>>(`/chats/${chatId}`)
  }

  // 获取聊天消息
  async getMessages(chatId: string, page = 1, limit = 20): Promise<PaginatedResponse<Message>> {
    return apiClient.get<PaginatedResponse<Message>>(`/chats/${chatId}/messages`, { page, limit })
  }

  // 发送消息
  async sendMessage(chatId: string, data: {
    content: string
    type: 'text' | 'image' | 'video' | 'audio' | 'file'
    replyTo?: string
  }): Promise<ApiResponse<Message>> {
    return apiClient.post<ApiResponse<Message>>(`/chats/${chatId}/messages`, data)
  }

  // 创建群聊
  async createGroupChat(data: {
    name: string
    participants: string[]
    avatar?: string
  }): Promise<ApiResponse<Chat>> {
    return apiClient.post<ApiResponse<Chat>>('/chats/group', data)
  }

  // 标记消息为已读
  async markAsRead(chatId: string, messageId?: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/chats/${chatId}/read`, { messageId })
  }
}

export const chatApi = new ChatApi()
export default chatApi

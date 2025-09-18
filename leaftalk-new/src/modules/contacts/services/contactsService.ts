// 联系人API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, Contact } from './types'

class ContactsApi {
  // 获取联系人列表
  async getContacts(): Promise<ApiResponse<Contact[]>> {
    return apiClient.get<ApiResponse<Contact[]>>('/contacts')
  }

  // 添加好友
  async addFriend(userId: string, message?: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/contacts/add', { userId, message })
  }

  // 接受好友请求
  async acceptFriend(requestId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/contacts/accept/${requestId}`)
  }

  // 拒绝好友请求
  async rejectFriend(requestId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/contacts/reject/${requestId}`)
  }

  // 删除好友
  async removeFriend(userId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/contacts/${userId}`)
  }

  // 获取好友请求
  async getFriendRequests(): Promise<ApiResponse<Contact[]>> {
    return apiClient.get<ApiResponse<Contact[]>>('/contacts/requests')
  }

  // 获取我发送的好友请求
  async getMyFriendRequests(): Promise<ApiResponse<Contact[]>> {
    return apiClient.get<ApiResponse<Contact[]>>('/contacts/my-requests')
  }

  // 发送好友请求
  async sendFriendRequest(data: { phone?: string, yeyu_id?: string, message?: string }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/contacts/send-request', data)
  }
}

export const contactsApi = new ContactsApi()
export default contactsApi

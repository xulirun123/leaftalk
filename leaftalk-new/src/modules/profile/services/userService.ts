// 用户API模块
// 处理用户信息管理、搜索等

import { apiClient } from '../apiClient'
import type { 
  ApiResponse, 
  User, 
  PaginatedResponse,
  SearchParams 
} from './types'

class UserApi {
  // 获取用户资料
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>('/users/profile')
  }

  // 更新用户资料
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<ApiResponse<User>>('/users/profile', data)
  }

  // 上传头像
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    return apiClient.upload<ApiResponse<{ avatar: string }>>('/users/avatar', file)
  }

  // 根据ID获取用户信息
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(`/users/${userId}`)
  }

  // 搜索用户
  async searchUsers(params: SearchParams): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>('/users/search', params)
  }

  // 检查用户是否存在
  async checkUserExists(identifier: string): Promise<ApiResponse<{
    exists: boolean
    user?: Partial<User>
  }>> {
    return apiClient.get<ApiResponse<{
      exists: boolean
      user?: Partial<User>
    }>>(`/users/check/${identifier}`)
  }

  // 获取用户统计信息
  async getUserStats(): Promise<ApiResponse<{
    friendsCount: number
    chatsCount: number
    momentsCount: number
    joinDate: string
  }>> {
    return apiClient.get<ApiResponse<{
      friendsCount: number
      chatsCount: number
      momentsCount: number
      joinDate: string
    }>>('/users/stats')
  }

  // 更新用户设置
  async updateSettings(settings: {
    notifications?: {
      message: boolean
      call: boolean
      moments: boolean
    }
    privacy?: {
      phoneVisible: boolean
      momentVisible: 'all' | 'friends' | 'none'
      searchable: boolean
    }
    language?: string
    theme?: 'light' | 'dark' | 'auto'
  }): Promise<ApiResponse> {
    return apiClient.put<ApiResponse>('/users/settings', settings)
  }

  // 获取用户设置
  async getSettings(): Promise<ApiResponse<{
    notifications: {
      message: boolean
      call: boolean
      moments: boolean
    }
    privacy: {
      phoneVisible: boolean
      momentVisible: 'all' | 'friends' | 'none'
      searchable: boolean
    }
    language: string
    theme: 'light' | 'dark' | 'auto'
  }>> {
    return apiClient.get<ApiResponse<{
      notifications: {
        message: boolean
        call: boolean
        moments: boolean
      }
      privacy: {
        phoneVisible: boolean
        momentVisible: 'all' | 'friends' | 'none'
        searchable: boolean
      }
      language: string
      theme: 'light' | 'dark' | 'auto'
    }>>('/users/settings')
  }

  // 停用账号
  async deactivateAccount(): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/deactivate')
  }

  // 删除账号
  async deleteAccount(password: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>('/users/delete', {
      body: JSON.stringify({ password })
    } as any)
  }

  // 举报用户
  async reportUser(data: {
    userId: string
    reason: string
    description?: string
    evidence?: string[]
  }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/report', data)
  }

  // 拉黑用户
  async blockUser(userId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/users/${userId}/block`)
  }

  // 取消拉黑
  async unblockUser(userId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/users/${userId}/block`)
  }

  // 获取黑名单
  async getBlockedUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<ApiResponse<User[]>>('/users/blocked')
  }

  // 获取最近访问的用户
  async getRecentUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<ApiResponse<User[]>>('/users/recent')
  }

  // 获取推荐用户
  async getRecommendedUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<ApiResponse<User[]>>('/users/recommended')
  }

  // 更新最后活跃时间
  async updateLastActive(): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/last-active')
  }

  // 获取用户在线状态
  async getUserOnlineStatus(userIds: string[]): Promise<ApiResponse<{
    [userId: string]: {
      online: boolean
      lastSeen?: string
    }
  }>> {
    return apiClient.post<ApiResponse<{
      [userId: string]: {
        online: boolean
        lastSeen?: string
      }
    }>>('/users/online-status', { userIds })
  }
}

// 创建并导出用户API实例
export const userApi = new UserApi()

// 默认导出
export default userApi

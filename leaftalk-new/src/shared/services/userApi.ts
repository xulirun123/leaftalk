/**
 * 用户API服务
 * 处理用户相关的API调用
 */

import { apiClient, type ApiResponse } from './apiClient'

// 用户信息接口
export interface UserInfo {
  id: string
  yeyu_id: string
  nickname: string
  avatar?: string
  phone?: string
  real_name?: string
  status?: string
  created_at?: string
  updated_at?: string
}

// 用户搜索结果接口
export interface UserSearchResult {
  id: string
  yeyu_id: string
  nickname: string
  avatar?: string
  phone?: string
  real_name?: string
  is_friend?: boolean
}

class UserApi {
  /**
   * 获取用户信息
   */
  async getUserInfo(userId?: string): Promise<ApiResponse<UserInfo>> {
    const url = userId ? `/users/${userId}` : '/users/me'
    return apiClient.get<ApiResponse<UserInfo>>(url)
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
    return apiClient.put<ApiResponse<UserInfo>>('/users/me', data)
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string): Promise<ApiResponse<UserSearchResult[]>> {
    return apiClient.get<ApiResponse<UserSearchResult[]>>('/users/search', {
      params: { q: query }
    })
  }

  /**
   * 通过手机号搜索用户
   */
  async searchByPhone(phone: string): Promise<ApiResponse<UserSearchResult[]>> {
    return apiClient.get<ApiResponse<UserSearchResult[]>>('/users/search/phone', {
      params: { phone }
    })
  }

  /**
   * 通过叶语号搜索用户
   */
  async searchByYeyuId(yeyuId: string): Promise<ApiResponse<UserSearchResult[]>> {
    return apiClient.get<ApiResponse<UserSearchResult[]>>('/users/search/yeyu-id', {
      params: { yeyu_id: yeyuId }
    })
  }

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return apiClient.post<ApiResponse<{ avatar_url: string }>>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 获取用户头像URL
   */
  async getAvatarUrl(userId: string): Promise<string> {
    try {
      const response = await this.getUserInfo(userId)
      if (response.success && response.data.avatar) {
        return response.data.avatar
      }
    } catch (error) {
      console.warn('获取用户头像失败:', error)
    }
    
    // 返回默认头像
    return '/default-avatar.png'
  }

  /**
   * 批量获取用户信息
   */
  async getBatchUserInfo(userIds: string[]): Promise<ApiResponse<UserInfo[]>> {
    return apiClient.post<ApiResponse<UserInfo[]>>('/users/batch', {
      user_ids: userIds
    })
  }

  /**
   * 检查用户名是否可用
   */
  async checkUsernameAvailable(username: string): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get<ApiResponse<{ available: boolean }>>('/users/check-username', {
      params: { username }
    })
  }

  /**
   * 检查叶语号是否可用
   */
  async checkYeyuIdAvailable(yeyuId: string): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get<ApiResponse<{ available: boolean }>>('/users/check-yeyu-id', {
      params: { yeyu_id: yeyuId }
    })
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId?: string): Promise<ApiResponse<{
    friends_count: number
    moments_count: number
    videos_count: number
  }>> {
    const url = userId ? `/users/${userId}/stats` : '/users/me/stats'
    return apiClient.get<ApiResponse<{
      friends_count: number
      moments_count: number
      videos_count: number
    }>>(url)
  }

  /**
   * 设置用户状态
   */
  async setUserStatus(status: 'online' | 'away' | 'busy' | 'offline'): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/status', { status })
  }

  /**
   * 获取用户在线状态
   */
  async getUserStatus(userId: string): Promise<ApiResponse<{ status: string, last_seen?: number }>> {
    return apiClient.get<ApiResponse<{ status: string, last_seen?: number }>>(`/users/${userId}/status`)
  }

  /**
   * 注销账户
   */
  async deleteAccount(): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>('/users/me')
  }

  /**
   * 修改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    })
  }

  /**
   * 绑定手机号
   */
  async bindPhone(phone: string, verificationCode: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/bind-phone', {
      phone,
      verification_code: verificationCode
    })
  }

  /**
   * 解绑手机号
   */
  async unbindPhone(verificationCode: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/unbind-phone', {
      verification_code: verificationCode
    })
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone: string, type: 'bind' | 'unbind' | 'login'): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/users/send-verification-code', {
      phone,
      type
    })
  }
}

// 创建全局实例
export const userApi = new UserApi()
export default userApi

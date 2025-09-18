// 认证API模块
// 处理用户登录、注册、token管理等

import { apiClient } from '../apiClient'
import type { 
  ApiResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  User 
} from './types'

class AuthApi {
  // 用户登录
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    
    // 登录成功后设置token
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token)
      // 保存到localStorage
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // 用户注册
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', userData)
    
    // 注册成功后自动登录
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token)
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // 用户登出
  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/auth/logout')
      return response
    } catch (error) {
      // 即使API调用失败，也要清除本地数据
      console.warn('登出API调用失败，但仍清除本地数据:', error)
      return { success: true, message: '已登出' }
    } finally {
      // 清除本地存储的认证信息
      this.clearAuthData()
    }
  }

  // 刷新token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('没有刷新token')
    }

    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh', {
      refreshToken
    })

    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token)
      localStorage.setItem('auth_token', response.data.token)
    }

    return response
  }

  // 验证token有效性
  async validateToken(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>('/auth/validate')
  }

  // 修改密码
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/change-password', data)
  }

  // 重置密码（发送重置邮件/短信）
  async requestPasswordReset(identifier: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/reset-password', { identifier })
  }

  // 确认密码重置
  async confirmPasswordReset(data: {
    token: string
    newPassword: string
  }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/reset-password/confirm', data)
  }

  // 检查用户名是否可用
  async checkUsername(username: string): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get<ApiResponse<{ available: boolean }>>(`/auth/check-username/${username}`)
  }

  // 检查手机号是否已注册
  async checkPhone(phone: string): Promise<ApiResponse<{ registered: boolean }>> {
    return apiClient.get<ApiResponse<{ registered: boolean }>>(`/auth/check-phone/${phone}`)
  }

  // 发送验证码
  async sendVerificationCode(data: {
    phone: string
    type: 'register' | 'login' | 'reset'
  }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/send-code', data)
  }

  // 验证验证码
  async verifyCode(data: {
    phone: string
    code: string
    type: 'register' | 'login' | 'reset'
  }): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/verify-code', data)
  }

  // 手机号登录
  async loginWithPhone(data: {
    phone: string
    code: string
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login-phone', data)
    
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token)
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // 获取当前用户信息
  getCurrentUser(): User | null {
    const userInfo = localStorage.getItem('user_info')
    return userInfo ? JSON.parse(userInfo) : null
  }

  // 获取当前token
  getCurrentToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = this.getCurrentToken()
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  // 清除认证数据
  clearAuthData(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    apiClient.removeAuthToken()
  }

  // 初始化认证状态（应用启动时调用）
  initializeAuth(): void {
    const token = this.getCurrentToken()
    if (token) {
      apiClient.setAuthToken(token)
    }
  }
}

// 创建并导出认证API实例
export const authApi = new AuthApi()

// 默认导出
export default authApi

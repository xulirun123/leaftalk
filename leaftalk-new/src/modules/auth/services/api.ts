/**
 * 认证模块API服务
 */

import axios from 'axios'

// 配置axios基础URL - 开发环境也使用相对路径通过Vite代理
const API_BASE_URL = '/api'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    // 优先使用新的token键名，兼容旧的键名
    const token = localStorage.getItem('yeyu_auth_token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地数据
      clearLocalData()
      // 可以在这里触发重新登录
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authAPI = {
  // 用户登录
  async login(credentials: { username: string; password: string }) {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  // 用户注册
  async register(userData: { 
    username: string; 
    password: string; 
    nickname?: string; 
    phone?: string 
  }) {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  // 用户登出
  async logout() {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  // 刷新token (如果后端支持)
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  }
}

// 用户相关API
export const userAPI = {
  // 获取用户信息
  async getProfile() {
    const response = await apiClient.get('/user/profile')
    return response.data
  },

  // 更新用户信息
  async updateProfile(userData: any) {
    const response = await apiClient.put('/user/profile', userData)
    return response.data
  },

  // 上传头像
  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

// 清除本地数据
export const clearLocalData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('refreshToken')
}

// 获取当前用户token
export const getAuthToken = () => {
  return localStorage.getItem('token')
}

// 检查是否已登录
export const isAuthenticated = () => {
  const token = getAuthToken()
  return !!token
}

// 开发环境API
export const devAPI = {
  // 创建测试用户
  async createTestUser() {
    const response = await apiClient.get('/dev/create-test-user')
    return response.data
  },

  // 快速登录
  async quickLogin() {
    const response = await apiClient.post('/dev/quick-login')
    return response.data
  }
}

export default apiClient

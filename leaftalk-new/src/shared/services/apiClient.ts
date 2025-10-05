import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API客户端配置
interface ApiClientConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

// 默认配置
const defaultConfig: ApiClientConfig = {
  baseURL: '/api',  // 使用相对路径，通过前端服务器代理
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code?: number
  timestamp?: number
}

// API错误接口
export interface ApiError {
  code: number
  message: string
  details?: any
}

class ApiClient {
  private instance: AxiosInstance
  private config: ApiClientConfig

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.instance = this.createInstance()
    this.setupInterceptors()
  }

  private createInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加用户ID
        const userId = this.getCurrentUserId()
        if (userId) {
          config.headers['X-User-ID'] = userId
        }

        console.log('🚀 API请求:', config.method?.toUpperCase(), config.url)
        return config
      },
      (error) => {
        console.error('❌ 请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ API响应:', response.status, response.config.url)

        // 检查是否有新的token需要更新
        const newToken = response.headers['x-new-token']
        const tokenRenewed = response.headers['x-token-renewed']

        if (newToken && tokenRenewed === 'true') {
          console.log('🔄 检测到服务器返回新token，自动更新...')
          this.updateAuthToken(newToken)
        }

        return response
      },
      async (error) => {
        console.error('❌ API响应错误:', error.response?.status, error.config?.url)

        // 处理认证错误 - 直接跳转到登录页面
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(`🔐 检测到${error.response?.status}错误，登录已过期`)
          this.handleAuthError()
          this.redirectToLogin()
          return Promise.reject(error)
        }

        // 处理网络错误和重试
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config)
        }

        return Promise.reject(error)
      }
    )
  }

  private getAuthToken(): string | null {
    // 获取当前标签页的token
    const tabId = sessionStorage.getItem('yeyu_tab_id')
    console.log('🔍 Token调试:', {
      tabId,
      hasTabId: !!tabId,
      tabSpecificToken: tabId ? localStorage.getItem(`yeyu_auth_token_${tabId}`) : null,
      fallbackToken: localStorage.getItem('yeyu_auth_token'),
      oldToken: localStorage.getItem('token')
    })

    if (tabId) {
      const token = localStorage.getItem(`yeyu_auth_token_${tabId}`)
      if (token) {
        console.log('✅ 使用标签页特定token:', token.substring(0, 50) + '...')
        return token
      }
    }

    // 兼容旧版本 - 尝试多个可能的token存储位置
    const fallbackToken = localStorage.getItem('yeyu_auth_token') ||
                         localStorage.getItem('token') ||
                         localStorage.getItem('auth_token')

    if (fallbackToken) {
      console.log('⚠️ 使用兼容token:', fallbackToken.substring(0, 50) + '...')
      return fallbackToken
    }

    console.log('❌ 未找到任何有效token')
    return null
  }

  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.id || user.yeyuId || null
    } catch {
      return null
    }
  }

  private updateAuthToken(newToken: string): void {
    try {
      console.log('🔄 更新认证token...')

      // 获取当前标签页ID
      const tabId = sessionStorage.getItem('yeyu_tab_id')

      if (tabId) {
        // 更新标签页特定的token
        localStorage.setItem(`yeyu_auth_token_${tabId}`, newToken)
        console.log('✅ 标签页特定token已更新')
      }

      // 同时更新通用token（兼容性）
      localStorage.setItem('yeyu_auth_token', newToken)

      // 触发token更新事件
      window.dispatchEvent(new CustomEvent('auth:token-updated', {
        detail: { newToken }
      }))

      console.log('✅ Token自动续期成功')

    } catch (error) {
      console.error('❌ 更新token失败:', error)
    }
  }

  private handleAuthError(): void {
    // 清除当前标签页的认证信息
    const tabId = sessionStorage.getItem('yeyu_tab_id')
    if (tabId) {
      localStorage.removeItem(`yeyu_auth_token_${tabId}`)
      localStorage.removeItem(`yeyu_user_info_${tabId}`)
    }
    // 兼容旧版本
    localStorage.removeItem('yeyu_auth_token')
    localStorage.removeItem('yeyu_token')
    localStorage.removeItem('user')

    // 触发登出事件
    window.dispatchEvent(new CustomEvent('auth:logout'))

    console.log('🔐 认证失效，已清除当前标签页登录信息')
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    )
  }

  private async retryRequest(config: AxiosRequestConfig, attempt: number = 1): Promise<any> {
    if (attempt > this.config.retryAttempts) {
      throw new Error(`请求失败，已重试${this.config.retryAttempts}次`)
    }

    console.log(`🔄 重试请求 (${attempt}/${this.config.retryAttempts}):`, config.url)
    
    await this.delay(this.config.retryDelay * attempt)
    
    try {
      return await this.instance.request(config)
    } catch (error) {
      return this.retryRequest(config, attempt + 1)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 公共请求方法
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get(url, config)
      return this.formatResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post(url, data, config)
      return this.formatResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put(url, data, config)
      return this.formatResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete(url, config)
      return this.formatResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.patch(url, data, config)
      return this.formatResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private formatResponse<T>(response: AxiosResponse): ApiResponse<T> {
    // 如果后端已经返回了标准格式，直接使用
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data
    }

    // 否则包装成标准格式
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Success',
      code: response.status,
      timestamp: Date.now()
    }
  }

  private async handleError(error: any): Promise<ApiResponse> {
    const errorResponse: ApiResponse = {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || '请求失败',
      code: error.response?.status || 500,
      timestamp: Date.now()
    }

    // 如果是401或403错误（token无效），清除token并重定向到登录页
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(`🔄 Token无效(${error.response?.status})，清除认证信息...`)

      // 清除所有认证相关的存储
      this.clearAuthData()

      // 重定向到登录页
      this.redirectToLogin()

      errorResponse.message = 'Token无效，请重新登录'
    }

    console.error('🚨 API错误:', errorResponse)
    return errorResponse
  }



  // 获取保存的登录凭据
  private getSavedCredentials(): { username: string; password: string } | null {
    try {
      const saved = localStorage.getItem('yeyu_saved_credentials')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  // 更新token
  private updateToken(newToken: string): void {
    // 更新localStorage中的token
    const tabId = sessionStorage.getItem('yeyu_tab_id')
    if (tabId) {
      localStorage.setItem(`yeyu_auth_token_${tabId}`, newToken)
    }
    localStorage.setItem('yeyu_auth_token', newToken)
    localStorage.setItem('token', newToken) // 兼容性

    // 更新appStore中的token
    try {
      const { useAppStore } = require('@/shared/stores/appStore')
      const appStore = useAppStore()
      appStore.setToken(newToken)
      console.log('✅ AppStore token已更新')
    } catch (error) {
      console.warn('⚠️ 无法更新AppStore token:', error)
    }
  }

  // 跳转到登录页面
  private redirectToLogin(): void {
    // 显示用户友好的提示
    this.showLoginExpiredNotification()

    // 延迟执行，避免在API调用过程中立即跳转
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location) {
        // 清除所有认证相关的存储
        this.clearAuthData()
        window.location.href = '/login'
      }
    }, 2000)
  }

  // 显示登录过期通知
  private showLoginExpiredNotification(): void {
    // 尝试使用应用的toast系统
    try {
      const event = new CustomEvent('yeyu:show-toast', {
        detail: {
          message: '登录已过期，即将跳转到登录页面',
          type: 'warning',
          duration: 3000
        }
      })
      window.dispatchEvent(event)
    } catch (error) {
      // 降级到浏览器原生提示
      console.log('⚠️ 登录已过期，即将跳转到登录页面')
    }
  }

  // 清除认证数据
  private clearAuthData(): void {
    const tabId = sessionStorage.getItem('yeyu_tab_id')

    // 清除标签页特定的token
    if (tabId) {
      localStorage.removeItem(`yeyu_auth_token_${tabId}`)
      localStorage.removeItem(`yeyu_user_info_${tabId}`)
    }

    // 清除通用token
    localStorage.removeItem('yeyu_auth_token')
    localStorage.removeItem('yeyu_user_info')
    localStorage.removeItem('yeyu_saved_credentials')
    localStorage.removeItem('token')
    localStorage.removeItem('auth_token')
  }

  // 更新配置
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.instance.defaults.baseURL = this.config.baseURL
    this.instance.defaults.timeout = this.config.timeout
  }

  // 获取实例（用于特殊情况）
  getInstance(): AxiosInstance {
    return this.instance
  }
}

// 创建默认实例
export const apiClient = new ApiClient()

// 导出类型和实例
export { ApiClient }
export default apiClient

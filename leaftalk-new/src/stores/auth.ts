import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface User {
  id: string
  yeyu_id: string
  username: string
  nickname: string
  avatar: string
  phone?: string
  real_name?: string
  verification_status?: 'pending' | 'verified' | 'rejected'
  created_at?: string
  updated_at?: string
  gender?: 'male' | 'female' | 'unknown'
  region?: string
  signature?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  nickname: string
  phone?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isVerified = computed(() => user.value?.verification_status === 'verified')

  // 获取开发测试令牌
  async function getDevToken() {
    try {
      const response = await axios.get('http://localhost:8893/api/dev/test-token')
      if (response.data.success) {
        return response.data.data.token
      }
    } catch (error) {
      console.error('获取开发令牌失败:', error)
    }
    return null
  }

  // 初始化认证状态
  async function initAuth() {
    const savedToken = localStorage.getItem('yeyu_auth_token')
    const savedUser = localStorage.getItem('yeyu_user')

    if (savedToken) {
      token.value = savedToken

      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch (e) {
          console.error('Failed to parse saved user data:', e)
          await createDefaultUser()
        }
      } else {
        await createDefaultUser()
      }
    } else {
      // 如果没有保存的令牌，尝试获取开发令牌
      console.log('🔄 没有保存的令牌，尝试获取开发令牌...')
      const devToken = await getDevToken()
      if (devToken) {
        token.value = devToken
        localStorage.setItem('yeyu_auth_token', devToken)
        await createDefaultUser()
        console.log('✅ 开发令牌获取成功')
      } else {
        console.warn('⚠️ 无法获取开发令牌')
      }
    }
  }

  // 创建默认用户
  async function createDefaultUser() {
    user.value = {
      id: "1",
      yeyu_id: "YYJRCW9U2X",
      username: "testuser",
      nickname: "叶语用户",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=YYJRCW9U2X&backgroundColor=b6e3f4"
    }
    localStorage.setItem('yeyu_user', JSON.stringify(user.value))
  }

  // 清除认证状态
  function clearAuth() {
    user.value = null
    token.value = null
    localStorage.removeItem('yeyu_auth_token')
    localStorage.removeItem('yeyu_user')
    // 兼容旧的键名
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 登录
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.post('http://localhost:8893/api/auth/login', credentials)
      
      if (response.data.success) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        // 保存到本地存储
        localStorage.setItem('yeyu_auth_token', token.value)
        localStorage.setItem('yeyu_user', JSON.stringify(user.value))
        
        return { success: true }
      } else {
        error.value = response.data.message || '登录失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '网络错误'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  async function register(data: RegisterData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.post('http://localhost:8893/api/auth/register', data)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        error.value = response.data.message || '注册失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '网络错误'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  async function logout() {
    isLoading.value = true
    
    try {
      if (token.value) {
        await axios.post('http://localhost:8893/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token.value}` }
        })
      }
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  // 强制登出
  function forceLogout(reason?: string) {
    console.log('Force logout:', reason)
    clearAuth()
    // 可以在这里添加跳转到登录页的逻辑
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // 刷新token
  async function refreshToken() {
    if (!token.value) return false

    try {
      const response = await axios.post('http://localhost:8893/api/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      
      if (response.data.success) {
        token.value = response.data.data.token
        localStorage.setItem('token', token.value)
        return true
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      forceLogout('Token刷新失败')
    }
    
    return false
  }

  // 验证token
  async function validateToken() {
    if (!token.value) return false

    try {
      const response = await axios.get('http://localhost:8893/api/auth/validate', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      
      return response.data.success
    } catch (err) {
      console.error('Token validation failed:', err)
      return false
    }
  }

  // 更新用户信息
  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 获取用户信息
  async function fetchUserInfo() {
    if (!token.value) {
      console.log('❌ fetchUserInfo: 没有token')
      return false
    }

    console.log('🔄 fetchUserInfo: 开始获取用户信息...')

    try {
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token.value}` }
      })

      console.log('📡 fetchUserInfo: API响应', {
        success: response.data.success,
        data: response.data.data
      })

      if (response.data.success) {
        const oldUser = user.value
        user.value = response.data.data

        console.log('🔄 fetchUserInfo: 用户数据更新', {
          old: oldUser,
          new: user.value,
          gender: user.value?.gender,
          signature: user.value?.signature
        })

        // 同步更新所有相关的localStorage存储
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('yeyu_user', JSON.stringify(user.value))
        localStorage.setItem('yeyu_user_info', JSON.stringify(user.value))

        console.log('✅ authStore已同步更新所有localStorage存储')
        return true
      } else {
        console.log('❌ fetchUserInfo: API返回失败', response.data)
      }
    } catch (err) {
      console.error('❌ fetchUserInfo: 请求失败', err)
    }

    return false
  }

  // 确保有有效令牌
  async function ensureValidToken() {
    if (!token.value) {
      console.log('🔄 没有令牌，尝试获取开发令牌...')
      const devToken = await getDevToken()
      if (devToken) {
        token.value = devToken
        localStorage.setItem('yeyu_auth_token', devToken)
        if (!user.value) {
          await createDefaultUser()
        }
        return true
      }
      return false
    }

    // 简单检查令牌是否过期（JWT格式）
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.log('🔄 令牌已过期，尝试获取新的开发令牌...')
        const devToken = await getDevToken()
        if (devToken) {
          token.value = devToken
          localStorage.setItem('yeyu_auth_token', devToken)
          return true
        }
        return false
      }
    } catch (error) {
      console.warn('令牌格式检查失败:', error)
    }

    return true
  }

  // 设置用户信息
  function setUser(userData: any) {
    user.value = userData
    localStorage.setItem('yeyu_user', JSON.stringify(userData))
  }

  // 设置令牌
  function setToken(tokenValue: string) {
    token.value = tokenValue
    localStorage.setItem('yeyu_auth_token', tokenValue)
  }

  return {
    // 状态
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isVerified,
    
    // 方法
    initAuth,
    clearAuth,
    login,
    register,
    logout,
    forceLogout,
    refreshToken,
    validateToken,
    updateUser,
    fetchUserInfo,
    getDevToken,
    ensureValidToken,
    setUser,
    setToken
  }
})

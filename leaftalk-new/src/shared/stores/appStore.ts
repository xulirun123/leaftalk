/**
 * 应用全局状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const user = ref(null)
  const token = ref('')
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const theme = ref('light')
  const language = ref('zh-CN')

  // Toast通知状态
  const toast = ref({
    show: false,
    message: '',
    type: 'info' // 'info', 'success', 'warning', 'error'
  })

  // 拍摄页回传的待发送媒体，避免事件在路由切换时丢失
  const pendingCapturedMedia = ref<{ type: 'photo' | 'video', blob: Blob } | null>(null)
  function setPendingCapturedMedia(media: { type: 'photo' | 'video', blob: Blob } | null) {
    pendingCapturedMedia.value = media
  }
  function consumePendingCapturedMedia(): { type: 'photo' | 'video', blob: Blob } | null {
    const m = pendingCapturedMedia.value
    pendingCapturedMedia.value = null
    return m
  }

  // 动作
  function setUser(userData: any) {
    user.value = userData
    // 保存到本地存储（使用统一的键名）
    if (userData) {
      const userJson = JSON.stringify(userData)
      localStorage.setItem('yeyu_user_info', userJson)
      localStorage.setItem('user', userJson) // 兼容旧版本
    } else {
      localStorage.removeItem('yeyu_user_info')
      localStorage.removeItem('user')
      localStorage.removeItem('user_info')
    }
  }

  function setToken(tokenValue: string) {
    token.value = tokenValue
    // 保存到本地存储（使用统一的键名）
    if (tokenValue) {
      // 保存通用token
      localStorage.setItem('yeyu_auth_token', tokenValue)
      localStorage.setItem('token', tokenValue) // 兼容旧版本

      // 保存标签页特定的token（与apiClient保持一致）
      const tabId = sessionStorage.getItem('yeyu_tab_id')
      if (tabId) {
        localStorage.setItem(`yeyu_auth_token_${tabId}`, tokenValue)
      }
    } else {
      // 清除所有token
      localStorage.removeItem('yeyu_auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('auth_token')

      // 清除标签页特定的token
      const tabId = sessionStorage.getItem('yeyu_tab_id')
      if (tabId) {
        localStorage.removeItem(`yeyu_auth_token_${tabId}`)
      }
    }
  }

  function setTheme(themeValue: string) {
    theme.value = themeValue
    localStorage.setItem('theme', themeValue)
  }

  function setLanguage(languageValue: string) {
    language.value = languageValue
    localStorage.setItem('language', languageValue)
  }

  function login(authData: { user: any, token: string }) {
    setUser(authData.user)
    setToken(authData.token)
    console.log('✅ 用户登录成功，状态已保存')
  }


  function logout() {
    user.value = null
    token.value = ''
    // 清理所有可能的认证相关存储
    localStorage.removeItem('yeyu_auth_token')
    localStorage.removeItem('yeyu_user_info')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    console.log('🔒 用户已登出，清理所有认证状态')
  }

  function restoreUserFromStorage() {
    try {
      // 尝试多个可能的存储键名（兼容不同的认证系统）
      const savedToken = localStorage.getItem('yeyu_auth_token') ||
                        localStorage.getItem('token') ||
                        localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('yeyu_user_info') ||
                       localStorage.getItem('user') ||
                       localStorage.getItem('user_info')
      const savedTheme = localStorage.getItem('theme')
      const savedLanguage = localStorage.getItem('language')

      let restored = false

      if (savedToken) {
        token.value = savedToken
        restored = true
      }

      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
          restored = true
        } catch (e) {
          console.error('解析用户数据失败:', e)
        }
      }

      if (savedTheme) {
        theme.value = savedTheme
      }

      if (savedLanguage) {
        language.value = savedLanguage
      }

      console.log('✅ 用户状态恢复完成:', {
        hasUser: !!user.value,
        hasToken: !!token.value,
        theme: theme.value,
        language: language.value,
        restored
      })

      return restored
    } catch (error) {
      console.error('恢复用户状态失败:', error)
      return false
    }
  }

  // Toast通知方法
  function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000) {
    toast.value = {
      show: true,
      message,
      type
    }

    // 自动隐藏
    setTimeout(() => {
      hideToast()
    }, duration)
  }

  function hideToast() {
    toast.value.show = false
  }

  // 监听用户信息更新事件
  const handleUserInfoUpdate = (event: CustomEvent) => {
    console.log('🔄 appStore 收到用户信息更新事件:', event.detail)

    if (event.detail?.user) {
      // 更新用户信息
      setUser(event.detail.user)
      console.log('✅ appStore 用户信息已更新:', event.detail.user)
    }
  }

  // 初始化事件监听
  if (typeof window !== 'undefined') {
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)
    console.log('✅ appStore 已注册用户信息更新监听器')
  }

  return {
    user,
    token,
    isLoggedIn,
    theme,
    language,
    toast,
    pendingCapturedMedia,
    setPendingCapturedMedia,
    consumePendingCapturedMedia,
    setUser,
    setToken,
    setTheme,
    setLanguage,
    login,
    logout,
    restoreUserFromStorage,
    showToast,
    hideToast
  }
})

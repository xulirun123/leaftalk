// 用户状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../services/api/user'
import type { User } from '../services/api/types'

export interface UserState {
  currentUser: User | null
  userSettings: {
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
  }
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<User | null>(null)
  const userSettings = ref({
    notifications: {
      message: true,
      call: true,
      moments: true
    },
    privacy: {
      phoneVisible: false,
      momentVisible: 'friends' as const,
      searchable: true
    },
    language: 'zh-CN',
    theme: 'auto' as const
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!currentUser.value)
  const userAvatar = computed(() => currentUser.value?.avatar || '/avatars/default-user.jpg')
  const userName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '用户')
  const userYeyuId = computed(() => currentUser.value?.yeyuId || '')

  // 方法
  const setCurrentUser = (user: User | null) => {
    currentUser.value = user
    if (user) {
      // 保存到localStorage
      localStorage.setItem('user_info', JSON.stringify(user))
    } else {
      localStorage.removeItem('user_info')
    }
  }

  const loadUserFromStorage = () => {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      try {
        currentUser.value = JSON.parse(userInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('user_info')
      }
    }
  }

  const fetchUserProfile = async () => {
    if (!isLoggedIn.value) return

    loading.value = true
    error.value = null

    try {
      const response = await userApi.getProfile()
      if (response.success && response.data) {
        setCurrentUser(response.data)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取用户信息失败'
      console.error('获取用户资料失败:', err)
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser.value) return

    loading.value = true
    error.value = null

    try {
      const response = await userApi.updateProfile(data)
      if (response.success && response.data) {
        setCurrentUser(response.data)
        return response.data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用户信息失败'
      console.error('更新用户资料失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadAvatar = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const response = await userApi.uploadAvatar(file)
      if (response.success && response.data && currentUser.value) {
        const updatedUser = {
          ...currentUser.value,
          avatar: response.data.avatar
        }
        setCurrentUser(updatedUser)
        return response.data.avatar
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传头像失败'
      console.error('上传头像失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadSettings = async () => {
    try {
      const response = await userApi.getSettings()
      if (response.success && response.data) {
        userSettings.value = response.data
      }
    } catch (err) {
      console.error('加载用户设置失败:', err)
    }
  }

  const updateSettings = async (settings: Partial<typeof userSettings.value>) => {
    try {
      const response = await userApi.updateSettings(settings)
      if (response.success) {
        userSettings.value = { ...userSettings.value, ...settings }
      }
    } catch (err) {
      console.error('更新用户设置失败:', err)
      throw err
    }
  }

  const clearUser = () => {
    currentUser.value = null
    localStorage.removeItem('user_info')
  }

  const searchUsers = async (query: string) => {
    try {
      const response = await userApi.searchUsers({ q: query })
      return response.data || []
    } catch (err) {
      console.error('搜索用户失败:', err)
      return []
    }
  }

  // 初始化
  const initialize = () => {
    loadUserFromStorage()
    if (isLoggedIn.value) {
      fetchUserProfile()
      loadSettings()
    }
  }

  return {
    // 状态
    currentUser,
    userSettings,
    loading,
    error,

    // 计算属性
    isLoggedIn,
    userAvatar,
    userName,
    userYeyuId,

    // 方法
    setCurrentUser,
    loadUserFromStorage,
    fetchUserProfile,
    updateProfile,
    uploadAvatar,
    loadSettings,
    updateSettings,
    clearUser,
    searchUsers,
    initialize
  }
})

export type { UserState }

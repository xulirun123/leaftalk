// 统一头像管理系统
// 确保所有页面使用相同的用户头像源

import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getRealAvatarUrl } from '../utils/avatar'

// 全局用户信息状态
const globalUserAvatar = ref<string | null>(null)
const globalUserInfo = ref<any>(null)

// 所有用户信息缓存 - 按用户ID存储
const allUsersCache = ref<Map<string, any>>(new Map())

// 用户信息更新事件
const userInfoUpdateCallbacks = new Set<() => void>()
const avatarUpdateCallbacks = new Set<() => void>()

/**
 * 统一用户信息管理 Composable
 * 确保所有页面使用相同的用户头像、昵称、叶语号等信息
 */
export function useUnifiedAvatar() {
  const authStore = useAuthStore()

  // 获取当前用户的统一头像
  const currentUserAvatar = computed(() => {
    // 优先级：
    // 1. 全局设置的头像（用户在编辑资料页面上传的）
    // 2. authStore 中的头像
    // 3. localStorage 中的头像
    // 4. 真实头像（基于用户ID）

    if (globalUserAvatar.value) {
      return globalUserAvatar.value
    }

    if (authStore.user?.avatar) {
      return authStore.user.avatar
    }

    // 从 localStorage 获取用户信息
    try {
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      if (userInfo.avatar) {
        return userInfo.avatar
      }
    } catch (error) {
      console.warn('获取本地用户信息失败:', error)
    }

    // 使用真实头像
    const userId = authStore.user?.id || authStore.user?.yeyu_id || 'current_user'
    return getRealAvatarUrl(userId)
  })

  // 获取当前用户信息
  const currentUserInfo = computed(() => {
    if (globalUserInfo.value) {
      return globalUserInfo.value
    }

    if (authStore.user) {
      return authStore.user
    }

    // 从 localStorage 获取
    try {
      return JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
    } catch (error) {
      console.warn('获取本地用户信息失败:', error)
      return {}
    }
  })

  // 获取统一的用户昵称
  const currentUserNickname = computed(() => {
    const userInfo = currentUserInfo.value
    return userInfo?.nickname || userInfo?.name || authStore.user?.nickname || authStore.user?.name || '叶语用户'
  })

  // 获取统一的叶语号
  const currentUserYeyuId = computed(() => {
    const userInfo = currentUserInfo.value
    return userInfo?.yeyuId || userInfo?.yeyu_id || authStore.user?.yeyuId || authStore.user?.yeyu_id || 'yeyu_user'
  })

  // 获取统一的用户ID
  const currentUserId = computed(() => {
    const userInfo = currentUserInfo.value
    return userInfo?.id || authStore.user?.id || null
  })

  // 更新用户头像
  const updateUserAvatar = (newAvatar: string) => {
    globalUserAvatar.value = newAvatar
    
    // 更新 authStore
    if (authStore.user) {
      authStore.user.avatar = newAvatar
    }

    // 更新 localStorage
    try {
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      userInfo.avatar = newAvatar
      localStorage.setItem('yeyu_user_info', JSON.stringify(userInfo))
    } catch (error) {
      console.warn('更新本地用户信息失败:', error)
    }

    // 通知所有监听器
    avatarUpdateCallbacks.forEach(callback => callback())
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo: any) => {
    globalUserInfo.value = { ...globalUserInfo.value, ...newUserInfo }
    
    // 更新 authStore
    if (authStore.user) {
      Object.assign(authStore.user, newUserInfo)
    }

    // 更新 localStorage
    try {
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      Object.assign(userInfo, newUserInfo)
      localStorage.setItem('yeyu_user_info', JSON.stringify(userInfo))
    } catch (error) {
      console.warn('更新本地用户信息失败:', error)
    }

    // 通知所有监听器
    avatarUpdateCallbacks.forEach(callback => callback())
  }

  // 缓存用户信息
  const cacheUserInfo = (userId: string, userInfo: any) => {
    if (!userId || !userInfo) return

    const normalizedInfo = {
      id: userId,
      avatar: userInfo.avatar,
      nickname: userInfo.nickname || userInfo.name,
      name: userInfo.name || userInfo.nickname,
      yeyuId: userInfo.yeyuId || userInfo.yeyu_id,
      yeyu_id: userInfo.yeyu_id || userInfo.yeyuId,
      phone: userInfo.phone,
      ...userInfo
    }

    allUsersCache.value.set(userId, normalizedInfo)

    // 同步到localStorage
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('yeyu_users_cache') || '{}')
      cachedUsers[userId] = normalizedInfo
      localStorage.setItem('yeyu_users_cache', JSON.stringify(cachedUsers))
    } catch (error) {
      console.warn('缓存用户信息到localStorage失败:', error)
    }

    // 通知更新
    userInfoUpdateCallbacks.forEach(callback => callback())
  }

  // 获取用户信息（统一接口）
  const getUserInfo = (userId: string, fallbackInfo?: any) => {
    if (!userId) return fallbackInfo || {}

    // 如果是当前用户，返回当前用户信息
    if (userId === currentUserId.value) {
      return currentUserInfo.value
    }

    // 从缓存获取
    const cachedInfo = allUsersCache.value.get(userId)
    if (cachedInfo) {
      return cachedInfo
    }

    // 如果有传入的信息，缓存并返回
    if (fallbackInfo) {
      cacheUserInfo(userId, fallbackInfo)
      return allUsersCache.value.get(userId) || fallbackInfo
    }

    // 尝试从localStorage获取
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('yeyu_users_cache') || '{}')
      if (cachedUsers[userId]) {
        cacheUserInfo(userId, cachedUsers[userId])
        return cachedUsers[userId]
      }
    } catch (error) {
      console.warn('从localStorage获取用户信息失败:', error)
    }

    return {}
  }

  // 获取用户头像（统一接口）
  const getUserAvatar = (userId: string, fallbackInfo?: any) => {
    if (!userId) return getRealAvatarUrl('unknown')

    // 如果是当前用户，返回统一头像
    if (userId === currentUserId.value) {
      return currentUserAvatar.value
    }

    // 获取用户信息
    const userInfo = getUserInfo(userId, fallbackInfo)

    // 优先使用用户设置的头像，否则使用真实头像
    return userInfo.avatar || getRealAvatarUrl(userId)
  }

  // 获取用户昵称（统一接口）
  const getUserNickname = (userId: string, fallbackInfo?: any) => {
    if (!userId) return '未知用户'

    // 如果是当前用户
    if (userId === currentUserId.value) {
      return currentUserNickname.value
    }

    // 获取用户信息
    const userInfo = getUserInfo(userId, fallbackInfo)
    return userInfo.nickname || userInfo.name || '叶语用户'
  }

  // 获取用户叶语号（统一接口）
  const getUserYeyuId = (userId: string, fallbackInfo?: any) => {
    if (!userId) return 'unknown'

    // 如果是当前用户
    if (userId === currentUserId.value) {
      return currentUserYeyuId.value
    }

    // 获取用户信息
    const userInfo = getUserInfo(userId, fallbackInfo)
    return userInfo.yeyuId || userInfo.yeyu_id || `yeyu_${userId}`
  }

  // 监听用户信息更新
  const onUserInfoUpdate = (callback: () => void) => {
    userInfoUpdateCallbacks.add(callback)

    // 返回取消监听的函数
    return () => {
      userInfoUpdateCallbacks.delete(callback)
    }
  }

  // 批量缓存用户信息（用于聊天列表、好友列表等）
  const batchCacheUsers = (users: any[]) => {
    users.forEach(user => {
      if (user.id || user.userId) {
        cacheUserInfo(user.id || user.userId, user)
      }
    })
  }

  // 初始化用户缓存
  const initializeUserCache = () => {
    try {
      const cachedUsers = JSON.parse(localStorage.getItem('yeyu_users_cache') || '{}')
      Object.entries(cachedUsers).forEach(([userId, userInfo]) => {
        allUsersCache.value.set(userId, userInfo as any)
      })
      console.log('✅ 用户缓存初始化完成，缓存用户数:', allUsersCache.value.size)
    } catch (error) {
      console.warn('初始化用户缓存失败:', error)
    }
  }

  // 监听用户信息更新事件
  const handleUserInfoUpdate = (event: CustomEvent) => {
    console.log('🔄 useUnifiedAvatar 收到用户信息更新事件:', event.detail)

    try {
      // 更新全局用户信息
      if (event.detail?.user) {
        globalUserInfo.value = event.detail.user

        // 如果有头像更新，也更新全局头像
        if (event.detail.user.avatar) {
          globalUserAvatar.value = event.detail.user.avatar
        }

        // 缓存当前用户信息
        if (event.detail.user.id) {
          cacheUserInfo(event.detail.user.id.toString(), event.detail.user)
        }
      }

      // 重新从 localStorage 加载最新数据
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      if (Object.keys(userInfo).length > 0) {
        globalUserInfo.value = userInfo
        if (userInfo.avatar) {
          globalUserAvatar.value = userInfo.avatar
        }
      }

      // 触发所有监听器
      userInfoUpdateCallbacks.forEach(callback => callback())
      avatarUpdateCallbacks.forEach(callback => callback())

      console.log('✅ useUnifiedAvatar 用户信息已更新:', globalUserInfo.value)
    } catch (error) {
      console.error('❌ useUnifiedAvatar 处理用户信息更新失败:', error)
    }
  }

  // 初始化时同步数据
  const initializeAvatar = () => {
    try {
      // 初始化当前用户信息
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      if (userInfo.avatar && !globalUserAvatar.value) {
        globalUserAvatar.value = userInfo.avatar
      }
      if (Object.keys(userInfo).length > 0 && !globalUserInfo.value) {
        globalUserInfo.value = userInfo
      }

      // 初始化用户缓存
      initializeUserCache()

      // 监听用户信息更新事件
      window.addEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)
      console.log('✅ useUnifiedAvatar 已注册用户信息更新监听器')
    } catch (error) {
      console.warn('初始化用户信息失败:', error)
    }
  }

  // 清理函数
  const cleanup = () => {
    window.removeEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)
    console.log('🧹 useUnifiedAvatar 已移除用户信息更新监听器')
  }

  return {
    // 当前用户信息
    currentUserAvatar,
    currentUserInfo,
    currentUserNickname,
    currentUserYeyuId,
    currentUserId,

    // 当前用户更新方法
    updateUserAvatar,
    updateUserInfo,

    // 所有用户信息管理
    getUserInfo,
    getUserAvatar,
    getUserNickname,
    getUserYeyuId,
    cacheUserInfo,
    batchCacheUsers,

    // 事件监听
    onUserInfoUpdate,

    // 初始化和清理
    initializeAvatar,
    cleanup
  }
}

// 全局初始化
export function initializeUnifiedAvatar() {
  const { initializeAvatar } = useUnifiedAvatar()
  initializeAvatar()
}

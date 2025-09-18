import { ref, computed } from 'vue'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'

export interface AvatarOptions {
  size?: number | string
  shape?: 'circle' | 'square' | 'rounded'
  fallbackIcon?: string
  showStatus?: boolean
  status?: 'online' | 'offline' | 'busy' | 'away'
}

/**
 * 统一头像组合式函数
 * 提供头像显示、状态管理、错误处理等功能
 */
export function useUnifiedAvatar() {
  const loadingStates = ref<Map<string, boolean>>(new Map())
  const errorStates = ref<Map<string, boolean>>(new Map())

  /**
   * 获取用户头像URL
   */
  function getUserAvatarUrl(user: any): string {
    if (!user) return ''

    // 优先使用用户设置的头像
    if (user.avatar && user.avatar.trim()) {
      return user.avatar
    }

    // 使用真实头像
    const userId = user.yeyu_id || user.id || 'default'
    return getRealAvatarUrl(userId)
  }

  /**
   * 处理头像加载状态
   */
  function handleAvatarLoad(userId: string) {
    loadingStates.value.set(userId, false)
    errorStates.value.set(userId, false)
  }

  /**
   * 处理头像加载错误
   */
  function handleAvatarError(userId: string) {
    loadingStates.value.set(userId, false)
    errorStates.value.set(userId, true)
  }

  /**
   * 开始加载头像
   */
  function startAvatarLoad(userId: string) {
    loadingStates.value.set(userId, true)
    errorStates.value.set(userId, false)
  }

  /**
   * 获取头像加载状态
   */
  function getAvatarLoadingState(userId: string) {
    return {
      loading: loadingStates.value.get(userId) || false,
      error: errorStates.value.get(userId) || false
    }
  }

  /**
   * 获取状态指示器颜色
   */
  function getStatusColor(status?: string): string {
    switch (status) {
      case 'online':
        return '#52c41a'
      case 'busy':
        return '#ff4d4f'
      case 'away':
        return '#faad14'
      case 'offline':
      default:
        return '#d9d9d9'
    }
  }

  /**
   * 获取头像尺寸样式
   */
  function getAvatarSizeStyle(size: number | string = 40) {
    const sizeValue = typeof size === 'number' ? `${size}px` : size
    return {
      width: sizeValue,
      height: sizeValue
    }
  }

  /**
   * 获取头像形状样式
   */
  function getAvatarShapeStyle(shape: 'circle' | 'square' | 'rounded' = 'circle') {
    switch (shape) {
      case 'circle':
        return { borderRadius: '50%' }
      case 'square':
        return { borderRadius: '0' }
      case 'rounded':
        return { borderRadius: '8px' }
      default:
        return { borderRadius: '50%' }
    }
  }

  /**
   * 生成头像样式
   */
  function generateAvatarStyle(options: AvatarOptions = {}) {
    return {
      ...getAvatarSizeStyle(options.size),
      ...getAvatarShapeStyle(options.shape)
    }
  }

  /**
   * 预加载头像
   */
  function preloadAvatar(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load avatar'))
      img.src = url
    })
  }

  /**
   * 批量预加载头像
   */
  async function preloadAvatars(urls: string[]): Promise<void> {
    try {
      await Promise.all(urls.map(url => preloadAvatar(url)))
    } catch (error) {
      console.warn('Some avatars failed to preload:', error)
    }
  }

  /**
   * 获取用户显示名称
   */
  function getUserDisplayName(user: any): string {
    if (!user) return '未知用户'
    
    // 优先使用备注名
    if (user.remark && user.remark.trim()) {
      return user.remark
    }
    
    // 其次使用昵称
    if (user.nickname && user.nickname.trim()) {
      return user.nickname
    }
    
    // 使用真实姓名
    if (user.real_name && user.real_name.trim()) {
      return user.real_name
    }
    
    // 使用叶语号
    if (user.yeyu_id) {
      return user.yeyu_id
    }
    
    // 最后使用ID
    return user.id || '未知用户'
  }

  /**
   * 清理头像状态
   */
  function clearAvatarStates() {
    loadingStates.value.clear()
    errorStates.value.clear()
  }

  /**
   * 批量缓存用户信息
   */
  function batchCacheUsers(users: any[]) {
    users.forEach(user => {
      if (user && user.avatar) {
        preloadAvatar(user.avatar).catch(() => {
          // 忽略预加载失败
        })
      }
    })
  }

  return {
    loadingStates,
    errorStates,
    getUserAvatarUrl,
    handleAvatarLoad,
    handleAvatarError,
    startAvatarLoad,
    getAvatarLoadingState,
    getStatusColor,
    getAvatarSizeStyle,
    getAvatarShapeStyle,
    generateAvatarStyle,
    preloadAvatar,
    preloadAvatars,
    getUserDisplayName,
    clearAvatarStates,
    batchCacheUsers
  }
}

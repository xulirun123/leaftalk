import { ref, computed } from 'vue'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'

export interface AvatarOptions {
  size?: number | string
  shape?: 'circle' | 'square' | 'rounded'
  fallbackIcon?: string
  showStatus?: boolean
  status?: 'online' | 'offline' | 'busy' | 'away'
}

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
   * 获取用户显示名称
   */
  function getUserDisplayName(user: any): string {
    if (!user) return '未知用户'
    
    // 优先显示昵称
    if (user.nickname && user.nickname.trim()) {
      return user.nickname
    }
    
    // 其次显示用户名
    if (user.username && user.username.trim()) {
      return user.username
    }
    
    // 最后显示叶语号
    if (user.yeyu_id) {
      return `叶语号: ${user.yeyu_id}`
    }
    
    return '未知用户'
  }

  /**
   * 处理头像加载开始
   */
  function startAvatarLoad(key: string) {
    loadingStates.value.set(key, true)
    errorStates.value.delete(key)
  }

  /**
   * 处理头像加载成功
   */
  function handleAvatarLoad(key: string) {
    loadingStates.value.delete(key)
    errorStates.value.delete(key)
  }

  /**
   * 处理头像加载失败
   */
  function handleAvatarError(key: string) {
    loadingStates.value.delete(key)
    errorStates.value.set(key, true)
  }

  /**
   * 获取头像加载状态
   */
  function getAvatarLoadingState(key: string) {
    return {
      loading: loadingStates.value.get(key) || false,
      error: errorStates.value.get(key) || false
    }
  }

  /**
   * 获取状态颜色
   */
  function getStatusColor(status?: string): string {
    switch (status) {
      case 'online': return '#52c41a'
      case 'busy': return '#ff4d4f'
      case 'away': return '#faad14'
      case 'offline':
      default: return '#d9d9d9'
    }
  }

  /**
   * 获取头像尺寸样式
   */
  function getAvatarSizeStyle(size?: number | string) {
    const sizeValue = typeof size === 'number' ? `${size}px` : size || '40px'
    return {
      width: sizeValue,
      height: sizeValue
    }
  }

  /**
   * 获取头像形状样式
   */
  function getAvatarShapeStyle(shape?: string) {
    switch (shape) {
      case 'square': return { borderRadius: '4px' }
      case 'rounded': return { borderRadius: '8px' }
      case 'circle':
      default: return { borderRadius: '50%' }
    }
  }

  /**
   * 生成完整的头像样式
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
      if (!url) {
        reject(new Error('No URL provided'))
        return
      }
      
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = url
    })
  }

  /**
   * 批量预加载头像
   */
  async function preloadAvatars(urls: string[]): Promise<void> {
    const promises = urls.filter(url => url).map(url => preloadAvatar(url))
    await Promise.allSettled(promises)
  }

  /**
   * 清理头像状态
   */
  function clearAvatarStates() {
    loadingStates.value.clear()
    errorStates.value.clear()
  }

  /**
   * 获取当前用户头像
   */
  const currentUserAvatar = computed(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return getUserAvatarUrl(user)
  })

  /**
   * 获取当前用户昵称
   */
  const currentUserNickname = computed(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return getUserDisplayName(user)
  })

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
    currentUserAvatar,
    currentUserNickname
  }
}

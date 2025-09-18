/**
 * 用户信息工具函数
 */

// 简单的事件发射器
class UserInfoEmitter {
  private listeners: ((userInfo: UserInfo | null) => void)[] = []

  subscribe(callback: (userInfo: UserInfo | null) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  emit(userInfo: UserInfo | null) {
    this.listeners.forEach(callback => {
      try {
        callback(userInfo)
      } catch (error) {
        console.error('Error in userInfo listener:', error)
      }
    })
  }
}

export const userInfoEmitter = new UserInfoEmitter()

export interface UserInfo {
  id?: string
  yeyu_id?: string
  username?: string
  nickname?: string
  avatar?: string
  phone?: string
  real_name?: string
  id_card?: string
  verification_status?: string
  region?: string
  signature?: string
}

/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns Promise<UserInfo | null>
 */
export async function getUserInfo(userId?: string): Promise<UserInfo | null> {
  try {
    if (!userId) {
      // 获取当前用户信息
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
    
    // 从API获取指定用户信息
    const response = await fetch(`http://localhost:8893/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.user || null
    }
    
    return null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 格式化用户显示名称
 * @param user 用户对象
 * @returns 格式化后的显示名称
 */
export function formatUserDisplayName(user: UserInfo | null): string {
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
 * 格式化叶语号显示
 * @param yeyuId 叶语号
 * @returns 格式化后的叶语号
 */
export function formatYeyuIdDisplay(yeyuId?: string): string
/**
 * 格式化叶语号显示（重载版本）
 * @param userInfo 用户信息对象
 * @returns 格式化后的叶语号
 */
export function formatYeyuIdDisplay(userInfo?: UserInfo | null): string
export function formatYeyuIdDisplay(input?: string | UserInfo | null): string {
  if (!input) return ''

  if (typeof input === 'string') {
    return `叶语号: ${input}`
  }

  // UserInfo对象
  const yeyuId = input.yeyu_id || input.username
  if (!yeyuId) return ''
  return `叶语号: ${yeyuId}`
}

/**
 * 获取用户头像URL
 * @param user 用户对象
 * @returns 头像URL
 */
export function getUserAvatarUrl(user: UserInfo | null): string {
  if (!user) return getDefaultAvatarUrl()
  
  // 优先使用用户设置的头像
  if (user.avatar && user.avatar.trim()) {
    return user.avatar
  }
  
  // 使用默认头像API
  if (user.yeyu_id || user.id) {
    const userId = user.yeyu_id || user.id
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }
  
  return getDefaultAvatarUrl()
}

/**
 * 获取默认头像URL
 * @returns 默认头像URL
 */
export function getDefaultAvatarUrl(): string {
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
}

/**
 * 验证用户信息完整性
 * @param user 用户对象
 * @returns 验证结果
 */
export function validateUserInfo(user: UserInfo): {
  isValid: boolean
  missingFields: string[]
} {
  const requiredFields = ['yeyu_id', 'username']
  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    if (!user[field as keyof UserInfo]) {
      missingFields.push(field)
    }
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * 格式化用户地区显示
 * @param region 地区信息
 * @returns 格式化后的地区
 */
export function formatUserRegion(region?: string): string {
  if (!region) return '未设置'

  // 直接显示国家和地区，不进行分类处理
  // 移除之前可能存在的地区分类逻辑（如东南亚等）
  return region.trim()
}

/**
 * 获取用户在线状态
 * @param userId 用户ID
 * @returns 在线状态
 */
export function getUserOnlineStatus(userId: string): 'online' | 'offline' | 'unknown' {
  // 这里可以实现实际的在线状态检查逻辑
  // 暂时返回unknown
  return 'unknown'
}

/**
 * 缓存用户信息
 * @param user 用户信息
 */
export function cacheUserInfo(user: UserInfo): void {
  if (user.id || user.yeyu_id) {
    const key = `user_cache_${user.id || user.yeyu_id}`
    localStorage.setItem(key, JSON.stringify(user))
  }
}

/**
 * 从缓存获取用户信息
 * @param userId 用户ID
 * @returns 缓存的用户信息
 */
export function getCachedUserInfo(userId: string): UserInfo | null {
  try {
    const key = `user_cache_${userId}`
    const cached = localStorage.getItem(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('获取缓存用户信息失败:', error)
    return null
  }
}

/**
 * 清除用户信息缓存
 * @param userId 用户ID，不传则清除所有缓存
 */
export function clearUserInfoCache(userId?: string): void {
  if (userId) {
    const key = `user_cache_${userId}`
    localStorage.removeItem(key)
  } else {
    // 清除所有用户缓存
    const keys = Object.keys(localStorage).filter(key => key.startsWith('user_cache_'))
    keys.forEach(key => localStorage.removeItem(key))
  }
}

/**
 * 生成默认头像URL
 * @param name 用户名或昵称
 * @returns 默认头像URL
 */
export function generateDefaultAvatar(name?: string): string {
  // 使用DiceBear API生成头像
  const seed = name || 'default'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

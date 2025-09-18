/**
 * 获取真实头像URL
 * @param user 用户对象
 * @returns 头像URL
 */
export function getRealAvatarUrl(user: any): string {
  if (!user) return ''
  
  // 优先使用用户设置的头像
  if (user.avatar && user.avatar.trim()) {
    return user.avatar
  }
  
  // 使用默认头像API
  if (user.yeyu_id || user.id) {
    const userId = user.yeyu_id || user.id
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }
  
  // 最后的备用头像
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
}

/**
 * 获取头像缩略图URL
 * @param avatarUrl 原始头像URL
 * @param size 尺寸
 * @returns 缩略图URL
 */
export function getAvatarThumbnail(avatarUrl: string, size: number = 100): string {
  if (!avatarUrl) return ''
  
  // 如果是dicebear API，直接返回
  if (avatarUrl.includes('dicebear.com')) {
    return avatarUrl
  }
  
  // 如果是其他URL，可以添加尺寸参数或使用CDN
  return avatarUrl
}

/**
 * 验证头像URL是否有效
 * @param url 头像URL
 * @returns Promise<boolean>
 */
export function validateAvatarUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false)
      return
    }
    
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
    
    // 5秒超时
    setTimeout(() => resolve(false), 5000)
  })
}

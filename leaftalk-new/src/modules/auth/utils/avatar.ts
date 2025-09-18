/**
 * 头像相关工具函数
 */

import { defaultAvatars } from '../config/database'

// 获取真实头像URL
export const getRealAvatarUrl = (avatar?: string): string => {
  if (!avatar) {
    return getRandomDefaultAvatar()
  }

  // 如果是完整URL，直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  // 如果是相对路径，添加基础URL
  if (avatar.startsWith('/')) {
    return avatar
  }

  // 如果是文件名，添加默认路径
  return `/images/avatars/${avatar}`
}

// 获取随机默认头像
export const getRandomDefaultAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * defaultAvatars.length)
  return defaultAvatars[randomIndex]
}

// 检查头像URL是否有效
export const isValidAvatarUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

// 压缩头像文件
export const compressAvatar = (file: File, maxSize: number = 200): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/jpeg', 0.8)
    }

    img.src = URL.createObjectURL(file)
  })
}

// 生成头像占位符
export const generateAvatarPlaceholder = (name: string): string => {
  // 使用用户名首字符生成简单的占位符
  const firstChar = name.charAt(0).toUpperCase()
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  const backgroundColor = colors[colorIndex]

  // 返回SVG数据URL
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${backgroundColor}"/>
      <text x="50" y="50" font-family="Arial" font-size="40" fill="white" 
            text-anchor="middle" dominant-baseline="central">${firstChar}</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// 头像缓存管理
const avatarCache = new Map<string, string>()

export const getCachedAvatar = (key: string): string | null => {
  return avatarCache.get(key) || null
}

export const setCachedAvatar = (key: string, url: string): void => {
  avatarCache.set(key, url)
}

export const clearAvatarCache = (): void => {
  avatarCache.clear()
}

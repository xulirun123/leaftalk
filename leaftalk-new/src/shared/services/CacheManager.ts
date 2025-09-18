/**
 * 缓存管理器
 * 统一管理不同类型的缓存实例
 */

import { UnifiedCacheService, CacheConfig, CacheStats } from './UnifiedCacheService'

// 缓存配置预设
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  avatar: {
    type: 'avatar',
    defaultTTL: 24 * 60 * 60, // 24小时
    maxMemorySize: 50 * 1024 * 1024, // 50MB
    maxLocalStorageSize: 100 * 1024 * 1024, // 100MB
    enableCompression: true,
    version: '1.0'
  },
  user: {
    type: 'user',
    defaultTTL: 30 * 60, // 30分钟
    maxMemorySize: 10 * 1024 * 1024, // 10MB
    maxLocalStorageSize: 20 * 1024 * 1024, // 20MB
    enableCompression: false,
    version: '1.0'
  },
  contacts: {
    type: 'contacts',
    defaultTTL: 60 * 60, // 1小时
    maxMemorySize: 20 * 1024 * 1024, // 20MB
    maxLocalStorageSize: 50 * 1024 * 1024, // 50MB
    enableCompression: false,
    version: '1.0'
  },
  chat: {
    type: 'chat',
    defaultTTL: 10 * 60, // 10分钟
    maxMemorySize: 30 * 1024 * 1024, // 30MB
    maxLocalStorageSize: 100 * 1024 * 1024, // 100MB
    enableCompression: false,
    version: '1.0'
  },
  genealogy: {
    type: 'genealogy',
    defaultTTL: 2 * 60 * 60, // 2小时
    maxMemorySize: 15 * 1024 * 1024, // 15MB
    maxLocalStorageSize: 30 * 1024 * 1024, // 30MB
    enableCompression: false,
    version: '1.0'
  }
}

export class CacheManager {
  private static instance: CacheManager
  private cacheServices = new Map<string, UnifiedCacheService>()

  private constructor() {
    this.initializeCaches()
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * 获取指定类型的缓存服务
   */
  getCache(type: keyof typeof CACHE_CONFIGS): UnifiedCacheService {
    const service = this.cacheServices.get(type)
    if (!service) {
      throw new Error(`缓存服务 ${type} 未初始化`)
    }
    return service
  }

  /**
   * 头像缓存服务
   */
  get avatar(): UnifiedCacheService {
    return this.getCache('avatar')
  }

  /**
   * 用户信息缓存服务
   */
  get user(): UnifiedCacheService {
    return this.getCache('user')
  }

  /**
   * 联系人缓存服务
   */
  get contacts(): UnifiedCacheService {
    return this.getCache('contacts')
  }

  /**
   * 聊天缓存服务
   */
  get chat(): UnifiedCacheService {
    return this.getCache('chat')
  }

  /**
   * 族谱缓存服务
   */
  get genealogy(): UnifiedCacheService {
    return this.getCache('genealogy')
  }

  /**
   * 获取所有缓存的统计信息
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {}
    
    for (const [type, service] of this.cacheServices.entries()) {
      stats[type] = service.getStats()
    }
    
    return stats
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.cacheServices.values()).map(service => 
      service.clear()
    )
    
    await Promise.all(promises)
    console.log('🧹 所有缓存已清空')
  }

  /**
   * 清空指定类型的缓存
   */
  async clearCache(type: keyof typeof CACHE_CONFIGS): Promise<void> {
    const service = this.getCache(type)
    await service.clear()
    console.log(`🧹 ${type} 缓存已清空`)
  }

  /**
   * 打印缓存统计信息
   */
  printStats(): void {
    const allStats = this.getAllStats()
    
    console.group('📊 缓存统计信息')
    
    for (const [type, stats] of Object.entries(allStats)) {
      console.group(`${type} 缓存`)
      console.log(`总请求: ${stats.totalRequests}`)
      console.log(`内存命中: ${stats.memoryHits}`)
      console.log(`本地存储命中: ${stats.localStorageHits}`)
      console.log(`Redis命中: ${stats.redisHits}`)
      console.log(`未命中: ${stats.misses}`)
      console.log(`命中率: ${stats.hitRate.toFixed(2)}%`)
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  private initializeCaches(): void {
    for (const [type, config] of Object.entries(CACHE_CONFIGS)) {
      const service = new UnifiedCacheService(config)
      this.cacheServices.set(type, service)
    }
    
    console.log('🚀 缓存管理器初始化完成')
  }
}

// 导出单例实例
export const cacheManager = CacheManager.getInstance()

// 便捷的缓存服务访问
export const avatarCache = cacheManager.avatar
export const userCache = cacheManager.user
export const contactsCache = cacheManager.contacts
export const chatCache = cacheManager.chat
export const genealogyCache = cacheManager.genealogy

// 头像缓存相关的便捷函数
export interface AvatarCacheItem {
  url: string
  base64: string
  size: number
  mimeType: string
}

/**
 * 缓存头像
 */
export async function cacheAvatar(url: string): Promise<string> {
  try {
    // 检查缓存
    const cached = await avatarCache.get<AvatarCacheItem>(url)
    if (cached) {
      return cached.base64
    }

    console.log('📥 开始缓存头像:', url)

    // 对于外部API（如dicebear），直接返回URL，不进行缓存
    if (url.includes('api.dicebear.com') || url.includes('dicebear.com')) {
      console.log('🔗 外部API头像，直接返回URL:', url)
      return url
    }

    // 下载头像
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const blob = await response.blob()
    const base64 = await blobToBase64(blob)

    // 创建缓存项
    const cacheItem: AvatarCacheItem = {
      url,
      base64,
      size: blob.size,
      mimeType: blob.type
    }

    // 缓存头像
    await avatarCache.set(url, cacheItem)

    console.log('✅ 头像缓存成功:', url)
    return base64

  } catch (error) {
    console.error('❌ 缓存头像失败:', url, error)
    return url // 返回原始URL作为降级方案
  }
}

/**
 * 批量缓存头像
 */
export async function batchCacheAvatars(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // 并行缓存所有头像
  const promises = urls.map(async (url) => {
    try {
      const cachedUrl = await cacheAvatar(url)
      return { url, cachedUrl }
    } catch (error) {
      console.warn('批量缓存头像失败:', url, error)
      return { url, cachedUrl: url }
    }
  })

  const resolvedResults = await Promise.all(promises)
  
  resolvedResults.forEach(({ url, cachedUrl }) => {
    results.set(url, cachedUrl)
  })

  return results
}

/**
 * 预加载头像列表
 */
export async function preloadAvatars(urls: string[]): Promise<void> {
  const validUrls = urls.filter(url => 
    url && !url.startsWith('data:') && !url.startsWith('blob:')
  )
  
  if (validUrls.length === 0) return

  console.log(`🔄 开始预加载 ${validUrls.length} 个头像...`)

  await avatarCache.preload(
    validUrls.map(url => ({
      key: url,
      loader: async () => {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const blob = await response.blob()
        const base64 = await blobToBase64(blob)
        
        return {
          url,
          base64,
          size: blob.size,
          mimeType: blob.type
        } as AvatarCacheItem
      }
    }))
  )

  console.log('✅ 头像预加载完成')
}

/**
 * 获取缓存的头像URL
 */
export async function getCachedAvatarUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  // 对于外部API，直接返回原始URL
  if (url.includes('api.dicebear.com') || url.includes('dicebear.com')) {
    return url
  }

  try {
    const cached = await avatarCache.get<AvatarCacheItem>(url)
    return cached ? cached.base64 : url
  } catch (error) {
    console.error('获取缓存头像失败:', error)
    return url
  }
}

// 工具函数
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 在开发环境下暴露到全局，方便调试
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // 延迟设置，避免循环引用
  setTimeout(() => {
    const manager = CacheManager.getInstance()
    ;(window as any).cacheManager = manager
    ;(window as any).printCacheStats = () => manager.printStats()
    ;(window as any).clearAllCache = () => manager.clearAll()
  }, 0)
}

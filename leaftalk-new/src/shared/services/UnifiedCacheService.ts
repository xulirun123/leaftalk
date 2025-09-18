/**
 * 统一缓存服务
 * 支持多级缓存：内存 → localStorage → Redis → 数据库
 */

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number
  version: string
  size?: number
}

export interface CacheConfig {
  // 缓存类型
  type: 'avatar' | 'user' | 'contacts' | 'chat' | 'genealogy' | 'general'
  // 默认TTL（秒）
  defaultTTL: number
  // 最大内存缓存大小
  maxMemorySize: number
  // 最大localStorage大小
  maxLocalStorageSize: number
  // 是否启用压缩
  enableCompression: boolean
  // 版本号
  version: string
}

export interface CacheStats {
  memoryHits: number
  localStorageHits: number
  redisHits: number
  misses: number
  totalRequests: number
  hitRate: number
}

export class UnifiedCacheService {
  private memoryCache = new Map<string, CacheItem>()
  private memorySize = 0
  private stats: CacheStats = {
    memoryHits: 0,
    localStorageHits: 0,
    redisHits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0
  }

  constructor(private config: CacheConfig) {
    this.initCleanupTimer()
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    this.stats.totalRequests++
    const fullKey = this.getFullKey(key)

    try {
      // 1. 检查内存缓存
      const memoryResult = this.getFromMemory<T>(fullKey)
      if (memoryResult !== null) {
        this.stats.memoryHits++
        this.updateHitRate()
        return memoryResult
      }

      // 2. 检查localStorage缓存
      const localResult = await this.getFromLocalStorage<T>(fullKey)
      if (localResult !== null) {
        this.stats.localStorageHits++
        // 回写到内存缓存
        this.setToMemory(fullKey, localResult, this.config.defaultTTL)
        this.updateHitRate()
        return localResult
      }

      // 3. 检查Redis缓存（如果可用）
      const redisResult = await this.getFromRedis<T>(fullKey)
      if (redisResult !== null) {
        this.stats.redisHits++
        // 回写到本地缓存
        this.setToMemory(fullKey, redisResult, this.config.defaultTTL)
        await this.setToLocalStorage(fullKey, redisResult, this.config.defaultTTL)
        this.updateHitRate()
        return redisResult
      }

      // 4. 缓存未命中
      this.stats.misses++
      this.updateHitRate()
      return null

    } catch (error) {
      console.error('缓存获取失败:', error)
      this.stats.misses++
      this.updateHitRate()
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    const finalTTL = ttl || this.config.defaultTTL

    try {
      // 1. 设置到内存缓存
      this.setToMemory(fullKey, data, finalTTL)

      // 2. 设置到localStorage
      await this.setToLocalStorage(fullKey, data, finalTTL)

      // 3. 设置到Redis（如果可用）
      await this.setToRedis(fullKey, data, finalTTL)

      return true
    } catch (error) {
      console.error('缓存设置失败:', error)
      return false
    }
  }

  /**
   * 批量获取缓存数据
   */
  async getBatch<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    // 并行获取所有缓存
    const promises = keys.map(async (key) => {
      const data = await this.get<T>(key)
      return { key, data }
    })

    const resolvedResults = await Promise.all(promises)
    
    resolvedResults.forEach(({ key, data }) => {
      results.set(key, data)
    })

    return results
  }

  /**
   * 批量设置缓存数据
   */
  async setBatch<T>(items: Array<{ key: string; data: T; ttl?: number }>): Promise<boolean> {
    try {
      const promises = items.map(({ key, data, ttl }) => 
        this.set(key, data, ttl)
      )
      
      const results = await Promise.all(promises)
      return results.every(result => result)
    } catch (error) {
      console.error('批量缓存设置失败:', error)
      return false
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key)

    try {
      // 从所有缓存层删除
      this.memoryCache.delete(fullKey)
      localStorage.removeItem(fullKey)
      await this.deleteFromRedis(fullKey)
      
      return true
    } catch (error) {
      console.error('缓存删除失败:', error)
      return false
    }
  }

  /**
   * 清空指定类型的缓存
   */
  async clear(): Promise<boolean> {
    try {
      // 清空内存缓存
      this.memoryCache.clear()
      this.memorySize = 0

      // 清空localStorage中的相关缓存
      const prefix = this.getKeyPrefix()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // 重置统计
      this.stats = {
        memoryHits: 0,
        localStorageHits: 0,
        redisHits: 0,
        misses: 0,
        totalRequests: 0,
        hitRate: 0
      }

      return true
    } catch (error) {
      console.error('缓存清空失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 预加载数据到缓存
   */
  async preload<T>(items: Array<{ key: string; loader: () => Promise<T>; ttl?: number }>): Promise<void> {
    const promises = items.map(async ({ key, loader, ttl }) => {
      try {
        // 检查是否已缓存
        const cached = await this.get<T>(key)
        if (cached !== null) {
          return // 已缓存，跳过
        }

        // 加载数据并缓存
        const data = await loader()
        await this.set(key, data, ttl)
      } catch (error) {
        console.warn(`预加载失败 ${key}:`, error)
      }
    })

    await Promise.all(promises)
  }

  // ==================== 私有方法 ====================

  private getFullKey(key: string): string {
    return `${this.getKeyPrefix()}:${key}`
  }

  private getKeyPrefix(): string {
    return `cache:${this.config.type}:${this.config.version}`
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() > item.timestamp + item.ttl * 1000) {
      this.memoryCache.delete(key)
      return null
    }

    return item.data as T
  }

  private setToMemory<T>(key: string, data: T, ttl: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.config.version,
      size: this.estimateSize(data)
    }

    // 检查内存限制
    if (this.memorySize + (item.size || 0) > this.config.maxMemorySize) {
      this.evictMemoryCache()
    }

    this.memoryCache.set(key, item)
    this.memorySize += item.size || 0
  }

  private async getFromLocalStorage<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const item: CacheItem<T> = JSON.parse(stored)
      
      // 检查版本
      if (item.version !== this.config.version) {
        localStorage.removeItem(key)
        return null
      }

      // 检查是否过期
      if (Date.now() > item.timestamp + item.ttl * 1000) {
        localStorage.removeItem(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('localStorage读取失败:', error)
      return null
    }
  }

  private async setToLocalStorage<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.config.version,
        size: this.estimateSize(data)
      }

      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('localStorage写入失败:', error)
      // 如果存储失败，尝试清理一些空间
      this.cleanupLocalStorage()
    }
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    // TODO: 实现Redis缓存获取
    // 这里需要根据实际的Redis客户端实现
    return null
  }

  private async setToRedis<T>(key: string, data: T, ttl: number): Promise<void> {
    // TODO: 实现Redis缓存设置
    // 这里需要根据实际的Redis客户端实现
  }

  private async deleteFromRedis(key: string): Promise<void> {
    // TODO: 实现Redis缓存删除
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // 粗略估算字节数
    } catch {
      return 1024 // 默认1KB
    }
  }

  private evictMemoryCache(): void {
    // LRU淘汰策略：删除最旧的缓存项
    const entries = Array.from(this.memoryCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // 删除最旧的25%
    const toDelete = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toDelete; i++) {
      const [key, item] = entries[i]
      this.memoryCache.delete(key)
      this.memorySize -= item.size || 0
    }
  }

  private cleanupLocalStorage(): void {
    // 清理过期的localStorage项
    const prefix = this.getKeyPrefix()
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const item: CacheItem = JSON.parse(stored)
            if (Date.now() > item.timestamp + item.ttl * 1000) {
              keysToRemove.push(key)
            }
          }
        } catch {
          keysToRemove.push(key) // 删除无效的项
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  private updateHitRate(): void {
    const totalHits = this.stats.memoryHits + this.stats.localStorageHits + this.stats.redisHits
    this.stats.hitRate = this.stats.totalRequests > 0 ? 
      (totalHits / this.stats.totalRequests) * 100 : 0
  }

  private initCleanupTimer(): void {
    // 每5分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupExpiredItems()
    }, 5 * 60 * 1000)
  }

  private cleanupExpiredItems(): void {
    // 清理内存中的过期项
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.timestamp + item.ttl * 1000) {
        this.memoryCache.delete(key)
        this.memorySize -= item.size || 0
      }
    }

    // 清理localStorage中的过期项
    this.cleanupLocalStorage()
  }
}

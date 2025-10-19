/**
 * 消息持久化服务
 * 负责消息的本地存储、同步、备份等功能
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { DataValidator } from '../utils/dataValidator'

export interface StoredMessage {
  id: string
  sessionId: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'contact' | 'location' | 'system' | 'announcement' | 'group_invite'
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
  isOwn: boolean
  localPath?: string // 本地文件路径（用于媒体文件）
  serverUrl?: string // 服务器文件URL
  metadata?: any // 额外元数据
}

export interface StoredSession {
  id: string
  participants: string[]
  name: string
  avatar: string
  lastMessage: StoredMessage | null
  lastMessageTime: number
  unreadCount: number
  type: 'private' | 'group'
  createdAt: number
  updatedAt: number
}

interface ChatDB extends DBSchema {
  messages: {
    key: string
    value: StoredMessage
    indexes: {
      'by-session': string
      'by-timestamp': number
      'by-sender': string
    }
  }
  sessions: {
    key: string
    value: StoredSession
    indexes: {
      'by-updated': number
    }
  }
  media: {
    key: string
    value: {
      id: string
      messageId: string
      type: 'image' | 'voice' | 'video' | 'file'
      blob: Blob
      filename: string
      size: number
      createdAt: number
    }
  }
}

class MessagePersistenceService {
  private db: IDBPDatabase<ChatDB> | null = null
  private isInitialized = false

  constructor() {
    this.initializeDB()
  }

  /**
   * 初始化数据库
   */
  private async initializeDB() {
    try {
      this.db = await openDB<ChatDB>('YeYuChatDB', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log('🔄 升级数据库版本:', oldVersion, '->', newVersion)

          // 消息表
          if (!db.objectStoreNames.contains('messages')) {
            const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
            messageStore.createIndex('by-session', 'sessionId')
            messageStore.createIndex('by-timestamp', 'timestamp')
            messageStore.createIndex('by-sender', 'senderId')
            console.log('✅ 创建messages对象存储')
          }

          // 会话表
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
            sessionStore.createIndex('by-updated', 'updatedAt')
            console.log('✅ 创建sessions对象存储')
          }

          // 媒体文件表
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' })
            console.log('✅ 创建media对象存储')
          }
        },
        blocked() {
          console.warn('⚠️ 数据库被阻塞，请关闭其他标签页')
        },
        blocking() {
          console.warn('⚠️ 数据库正在阻塞其他连接')
        }
      })

      this.isInitialized = true
      console.log('✅ 消息数据库初始化成功')

      // 验证对象存储是否存在
      const storeNames = Array.from(this.db.objectStoreNames)
      console.log('📋 可用的对象存储:', storeNames)

    } catch (error) {
      console.error('❌ 消息数据库初始化失败:', error)
      this.isInitialized = false
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBPDatabase<ChatDB>> {
    if (!this.db || !this.isInitialized) {
      await this.initializeDB()
    }

    if (!this.db) {
      throw new Error('数据库初始化失败')
    }

    // 验证必要的对象存储是否存在
    const requiredStores = ['messages', 'sessions', 'media']
    for (const storeName of requiredStores) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.error(`❌ 缺少对象存储: ${storeName}`)
        // 重新初始化数据库
        this.db.close()
        this.db = null
        this.isInitialized = false
        await this.initializeDB()
        break
      }
    }

    if (!this.db) {
      throw new Error('数据库对象存储验证失败')
    }

    return this.db
  }

  /**
   * 保存消息
   */
  async saveMessage(message: StoredMessage): Promise<void> {
    try {
      const db = await this.ensureDB()

      // 清理并验证消息数据
      const cleanMessage = this.sanitizeMessageData(message)

      await db.put('messages', cleanMessage)
      console.log('💾 消息已保存:', message.id)
    } catch (error) {
      console.error('❌ 保存消息失败:', error)
      throw error
    }
  }

  /**
   * 批量保存消息
   */
  async saveMessages(messages: StoredMessage[]): Promise<void> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction('messages', 'readwrite')

      // 清理所有消息数据
      const cleanMessages = messages.map(message => this.sanitizeMessageData(message))

      await Promise.all([
        ...cleanMessages.map(message => tx.store.put(message)),
        tx.done
      ])

      console.log('💾 批量保存消息成功:', messages.length)
    } catch (error) {
      console.error('❌ 批量保存消息失败:', error)
      throw error
    }
  }

  /**
   * 移除指定消息
   */
  async removeMessage(messageId: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction('messages', 'readwrite')

      await tx.store.delete(messageId)
      await tx.done

      console.log('💾 消息已从持久化存储中移除:', messageId)
    } catch (error) {
      console.error('❌ 移除消息失败:', error)
      throw error
    }
  }

  /**
   * 获取会话消息
   */
  async getSessionMessages(sessionId: string, limit = 50, offset = 0): Promise<StoredMessage[]> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction('messages', 'readonly')
      const index = tx.store.index('by-session')
      
      let messages = await index.getAll(sessionId)
      
      // 按时间戳排序
      messages.sort((a, b) => a.timestamp - b.timestamp)
      
      // 分页
      const start = offset
      const end = offset + limit
      
      return messages.slice(start, end)
    } catch (error) {
      console.error('❌ 获取会话消息失败:', error)
      return []
    }
  }

  /**
   * 获取最新消息
   */
  async getLatestMessages(sessionId: string, count = 20): Promise<StoredMessage[]> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction('messages', 'readonly')
      const index = tx.store.index('by-session')
      
      let messages = await index.getAll(sessionId)
      
      // 按时间戳倒序排序，取最新的
      messages.sort((a, b) => b.timestamp - a.timestamp)
      
      return messages.slice(0, count).reverse() // 返回时恢复正序
    } catch (error) {
      console.error('❌ 获取最新消息失败:', error)
      return []
    }
  }

  /**
   * 保存会话
   */
  async saveSession(session: StoredSession): Promise<void> {
    try {
      const db = await this.ensureDB()

      // 验证和清理数据
      const validation = DataValidator.validateSession(session)

      if (!validation.isValid) {
        console.warn('⚠️ 会话数据验证失败:', validation.errors)
        console.warn('原始数据:', session)
      }

      // 使用验证后的数据或回退到手动清理
      const cleanSession = validation.sanitized || this.sanitizeSessionData(session)

      // 最终验证
      if (!DataValidator.isCloneable(cleanSession)) {
        throw new Error('清理后的会话数据仍不可克隆')
      }

      await db.put('sessions', cleanSession)
      console.log('💾 会话已保存:', session.id)
    } catch (error) {
      console.error('❌ 保存会话失败:', error)
      console.error('会话数据:', session)

      // 生成详细的验证报告
      const report = DataValidator.generateValidationReport(session)
      console.error('验证报告:', report)

      throw error
    }
  }

  /**
   * 清理会话数据，确保可以被IndexedDB序列化
   */
  private sanitizeSessionData(session: StoredSession): StoredSession {
    return {
      id: String(session.id || ''),
      participants: Array.isArray(session.participants)
        ? session.participants.map(p => String(p)).filter(p => p)
        : [],
      name: String(session.name || ''),
      avatar: String(session.avatar || ''),
      lastMessage: session.lastMessage ? this.sanitizeMessageData(session.lastMessage) : null,
      lastMessageTime: Number(session.lastMessageTime) || Date.now(),
      unreadCount: Number(session.unreadCount) || 0,
      type: session.type === 'group' ? 'group' : 'private',
      createdAt: Number(session.createdAt) || Date.now(),
      updatedAt: Number(session.updatedAt) || Date.now()
    }
  }

  /**
   * 清理消息数据，确保可以被IndexedDB序列化
   */
  private sanitizeMessageData(message: StoredMessage): StoredMessage {
    return {
      id: String(message.id || ''),
      sessionId: String(message.sessionId || ''),
      senderId: String(message.senderId || ''),
      receiverId: String(message.receiverId || ''),
      content: String(message.content || ''),
      type: ['text', 'image', 'voice', 'video', 'file', 'contact', 'location', 'system', 'announcement', 'group_invite'].includes(message.type)
        ? message.type
        : 'text',
      timestamp: Number(message.timestamp) || Date.now(),
      status: ['sent', 'delivered', 'read'].includes(message.status)
        ? message.status
        : 'sent',
      isOwn: Boolean(message.isOwn),
      localPath: message.localPath ? String(message.localPath) : undefined,
      serverUrl: message.serverUrl ? String(message.serverUrl) : undefined,
      metadata: message.metadata ? this.sanitizeMetadata(message.metadata) : undefined
    }
  }

  /**
   * 清理元数据，移除不可序列化的属性
   */
  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return {}
    }

    const sanitized: any = {}

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) {
        continue
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      } else if (Array.isArray(value)) {
        sanitized[key] = value.filter(item =>
          typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        )
      } else if (typeof value === 'object') {
        // 递归清理嵌套对象，但限制深度
        sanitized[key] = this.sanitizeMetadata(value)
      }
    }

    return sanitized
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<StoredSession[]> {
    try {
      const db = await this.ensureDB()
      const sessions = await db.getAll('sessions')
      
      // 按更新时间倒序排序
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('❌ 获取会话列表失败:', error)
      return []
    }
  }

  /**
   * 获取单个会话
   */
  async getSession(sessionId: string): Promise<StoredSession | null> {
    try {
      const db = await this.ensureDB()
      const session = await db.get('sessions', sessionId)
      return session || null
    } catch (error) {
      console.error('❌ 获取会话失败:', error)
      return null
    }
  }

  /**
   * 更新消息状态
   */
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    try {
      const db = await this.ensureDB()
      const message = await db.get('messages', messageId)
      
      if (message) {
        message.status = status
        await db.put('messages', message)
        console.log('📋 消息状态已更新:', messageId, status)
      }
    } catch (error) {
      console.error('❌ 更新消息状态失败:', error)
    }
  }

  /**
   * 保存媒体文件
   */
  async saveMediaFile(messageId: string, type: 'image' | 'voice' | 'video' | 'file', blob: Blob, filename: string): Promise<string> {
    try {
      const db = await this.ensureDB()
      const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await db.put('media', {
        id: mediaId,
        messageId,
        type,
        blob,
        filename,
        size: blob.size,
        createdAt: Date.now()
      })
      
      console.log('💾 媒体文件已保存:', mediaId)
      return mediaId
    } catch (error) {
      console.error('❌ 保存媒体文件失败:', error)
      throw error
    }
  }

  /**
   * 获取媒体文件
   */
  async getMediaFile(mediaId: string): Promise<Blob | null> {
    try {
      const db = await this.ensureDB()
      const media = await db.get('media', mediaId)
      return media?.blob || null
    } catch (error) {
      console.error('❌ 获取媒体文件失败:', error)
      return null
    }
  }

  /**
   * 删除会话及其所有消息
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction(['messages', 'sessions', 'media'], 'readwrite')
      
      // 删除会话
      await tx.objectStore('sessions').delete(sessionId)
      
      // 删除会话的所有消息
      const messageIndex = tx.objectStore('messages').index('by-session')
      const messages = await messageIndex.getAll(sessionId)
      
      await Promise.all([
        ...messages.map(message => tx.objectStore('messages').delete(message.id)),
        tx.done
      ])
      
      console.log('🗑️ 会话及消息已删除:', sessionId)
    } catch (error) {
      console.error('❌ 删除会话失败:', error)
      throw error
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(daysToKeep = 30): Promise<void> {
    try {
      const db = await this.ensureDB()
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
      
      const tx = db.transaction(['messages', 'media'], 'readwrite')
      const messageStore = tx.objectStore('messages')
      const mediaStore = tx.objectStore('media')
      
      // 获取过期消息
      const allMessages = await messageStore.getAll()
      const expiredMessages = allMessages.filter(msg => msg.timestamp < cutoffTime)
      
      // 删除过期消息和相关媒体文件
      await Promise.all([
        ...expiredMessages.map(msg => messageStore.delete(msg.id)),
        ...expiredMessages.map(msg => mediaStore.delete(`media_${msg.id}`)),
        tx.done
      ])
      
      console.log('🧹 清理过期数据完成:', expiredMessages.length)
    } catch (error) {
      console.error('❌ 清理过期数据失败:', error)
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{ messageCount: number, sessionCount: number, mediaCount: number }> {
    try {
      const db = await this.ensureDB()
      
      const [messageCount, sessionCount, mediaCount] = await Promise.all([
        db.count('messages'),
        db.count('sessions'),
        db.count('media')
      ])
      
      return { messageCount, sessionCount, mediaCount }
    } catch (error) {
      console.error('❌ 获取数据库统计失败:', error)
      return { messageCount: 0, sessionCount: 0, mediaCount: 0 }
    }
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<{ sessions: StoredSession[], messages: StoredMessage[] }> {
    try {
      const db = await this.ensureDB()
      
      const [sessions, messages] = await Promise.all([
        db.getAll('sessions'),
        db.getAll('messages')
      ])
      
      return { sessions, messages }
    } catch (error) {
      console.error('❌ 导出数据失败:', error)
      return { sessions: [], messages: [] }
    }
  }

  /**
   * 清空所有数据
   */
  async clearAllData(): Promise<void> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction(['messages', 'sessions', 'media'], 'readwrite')

      await Promise.all([
        tx.objectStore('messages').clear(),
        tx.objectStore('sessions').clear(),
        tx.objectStore('media').clear(),
        tx.done
      ])

      console.log('🗑️ 所有数据已清空')
    } catch (error) {
      console.error('❌ 清空数据失败:', error)
      throw error
    }
  }

  /**
   * 重置数据库
   */
  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 重置数据库...')

      // 关闭当前连接
      if (this.db) {
        this.db.close()
        this.db = null
      }

      // 删除数据库
      await new Promise<void>((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase('YeYuChatDB')
        deleteReq.onsuccess = () => {
          console.log('✅ 数据库已删除')
          resolve()
        }
        deleteReq.onerror = () => {
          console.error('❌ 删除数据库失败')
          reject(new Error('删除数据库失败'))
        }
        deleteReq.onblocked = () => {
          console.warn('⚠️ 删除数据库被阻塞，请关闭其他标签页')
        }
      })

      // 重新初始化
      this.isInitialized = false
      await this.initializeDB()

      console.log('✅ 数据库重置完成')
    } catch (error) {
      console.error('❌ 重置数据库失败:', error)
      throw error
    }
  }

  /**
   * 检查存储空间并自动清理
   */
  async checkStorageAndCleanup(): Promise<void> {
    try {
      // 检查存储空间使用情况
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usedMB = (estimate.usage || 0) / (1024 * 1024)
        const quotaMB = (estimate.quota || 0) / (1024 * 1024)
        const usagePercent = (usedMB / quotaMB) * 100

        console.log(`💾 存储空间使用情况: ${usedMB.toFixed(2)}MB / ${quotaMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`)

        // 如果使用超过80%，开始清理
        if (usagePercent > 80) {
          console.log('⚠️ 存储空间不足，开始自动清理...')
          await this.smartCleanup()
        }
      }
    } catch (error) {
      console.error('❌ 检查存储空间失败:', error)
    }
  }

  /**
   * 智能清理策略
   */
  private async smartCleanup(): Promise<void> {
    try {
      console.log('🧹 开始智能清理...')

      // 策略1: 清理7天前的消息
      await this.cleanupMessagesByAge(7)

      // 策略2: 清理大文件消息
      await this.cleanupLargeFiles()

      // 策略3: 每个会话保留最近100条消息
      await this.keepRecentMessages(100)

      console.log('✅ 智能清理完成')
    } catch (error) {
      console.error('❌ 智能清理失败:', error)
    }
  }

  /**
   * 按时间清理消息
   */
  private async cleanupMessagesByAge(days: number): Promise<void> {
    try {
      const db = await this.ensureDB()
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)

      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const index = store.index('by-timestamp')
      const range = IDBKeyRange.upperBound(cutoffTime)

      let deletedCount = 0
      let cursor = await index.openCursor(range)
      while (cursor) {
        await cursor.delete()
        deletedCount++
        cursor = await cursor.continue()
      }

      await tx.done
      console.log(`🗑️ 清理了 ${deletedCount} 条 ${days} 天前的消息`)
    } catch (error) {
      console.error('❌ 按时间清理消息失败:', error)
    }
  }

  /**
   * 清理大文件消息
   */
  private async cleanupLargeFiles(): Promise<void> {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')

      let deletedCount = 0
      let cursor = await store.openCursor()
      while (cursor) {
        const message = cursor.value
        // 清理图片、视频、文件类型的消息（保留文本消息）
        if (['image', 'video', 'file'].includes(message.type) &&
            message.timestamp < Date.now() - (3 * 24 * 60 * 60 * 1000)) { // 3天前的媒体文件
          await cursor.delete()
          deletedCount++
        }
        cursor = await cursor.continue()
      }

      await tx.done
      console.log(`🗑️ 清理了 ${deletedCount} 个大文件消息`)
    } catch (error) {
      console.error('❌ 清理大文件失败:', error)
    }
  }

  /**
   * 每个会话保留最近N条消息
   */
  private async keepRecentMessages(keepCount: number): Promise<void> {
    try {
      const db = await this.ensureDB()

      // 获取所有会话
      const sessions = await this.getAllSessions()

      for (const session of sessions) {
        const messages = await this.getSessionMessages(session.id, 1000) // 获取更多消息用于清理

        if (messages.length > keepCount) {
          // 按时间排序，保留最新的消息
          messages.sort((a, b) => b.timestamp - a.timestamp)
          const messagesToDelete = messages.slice(keepCount)

          const tx = db.transaction('messages', 'readwrite')
          const store = tx.objectStore('messages')

          for (const msg of messagesToDelete) {
            await store.delete(msg.id)
          }

          await tx.done
          console.log(`🗑️ 会话 ${session.id} 清理了 ${messagesToDelete.length} 条旧消息`)
        }
      }
    } catch (error) {
      console.error('❌ 保留最近消息失败:', error)
    }
  }
}

// 创建全局实例
export const messagePersistenceService = new MessagePersistenceService()

export default MessagePersistenceService

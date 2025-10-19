/**
 * 聊天防护模块
 * 从根本上防止自聊天的出现，提供全方位的防护机制
 */

export class ChatGuard {
  /**
   * 检测是否为自聊天
   * @param userId1 用户ID1
   * @param userId2 用户ID2
   * @returns 是否为自聊天
   */
  static isSelfChat(userId1: string | number, userId2: string | number): boolean {
    const id1 = String(userId1).trim()
    const id2 = String(userId2).trim()
    
    // 空值检查
    if (!id1 || !id2) {
      return false
    }
    
    return id1 === id2
  }

  /**
   * 检测聊天ID是否为自聊天格式
   * @param chatId 聊天ID
   * @returns 是否为自聊天格式
   */
  static isSelfChatId(chatId: string): boolean {
    if (!chatId || typeof chatId !== 'string') {
      return false
    }

    // 移除可能的前缀
    const cleanId = chatId.replace(/^chat_/, '')
    const parts = cleanId.split('_')
    
    if (parts.length === 2) {
      return this.isSelfChat(parts[0], parts[1])
    }
    
    return false
  }

  /**
   * 检测参与者列表是否包含自聊天
   * @param participants 参与者列表
   * @returns 是否为自聊天
   */
  static isSelfChatParticipants(participants: (string | number)[]): boolean {
    if (!Array.isArray(participants) || participants.length !== 2) {
      return false
    }
    
    return this.isSelfChat(participants[0], participants[1])
  }

  /**
   * 验证聊天操作的合法性
   * @param userId1 用户ID1
   * @param userId2 用户ID2 (可以是用户ID或群ID)
   * @param operation 操作名称
   * @throws Error 如果是自聊天则抛出错误
   */
  static validateChatOperation(userId1: string | number, userId2: string | number, operation: string = '聊天操作'): void {
    // 🛡️ 如果userId2是群ID，跳过自聊天检查
    const userId2Str = String(userId2)
    if (userId2Str.startsWith('group_')) {
      return
    }

    if (this.isSelfChat(userId1, userId2)) {
      const error = `🛡️ 防护系统阻止${operation}: 不能与自己进行聊天操作 (${userId1} === ${userId2})`
      console.error(error)
      throw new Error(`不能与自己进行${operation}`)
    }
  }

  /**
   * 验证聊天ID的合法性
   * @param chatId 聊天ID
   * @param operation 操作名称
   * @throws Error 如果是自聊天ID则抛出错误
   */
  static validateChatId(chatId: string, operation: string = '聊天操作'): void {
    if (this.isSelfChatId(chatId)) {
      const error = `🛡️ 防护系统阻止${operation}: 检测到自聊天ID格式 (${chatId})`
      console.error(error)
      throw new Error(`不能使用自聊天ID进行${operation}`)
    }
  }

  /**
   * 验证参与者列表的合法性
   * @param participants 参与者列表
   * @param operation 操作名称
   * @throws Error 如果是自聊天参与者则抛出错误
   */
  static validateParticipants(participants: (string | number)[], operation: string = '聊天操作'): void {
    if (this.isSelfChatParticipants(participants)) {
      const error = `🛡️ 防护系统阻止${operation}: 检测到自聊天参与者 (${participants.join(', ')})`
      console.error(error)
      throw new Error(`不能使用相同用户作为${operation}参与者`)
    }
  }

  /**
   * 清理数据中的自聊天项
   * @param sessions 会话列表
   * @returns 清理后的会话列表和清理统计
   */
  static cleanSelfChatSessions<T extends { id?: string; participants?: (string | number)[] }>(
    sessions: T[]
  ): { cleanedSessions: T[]; removedCount: number; removedItems: T[] } {
    const removedItems: T[] = []
    
    const cleanedSessions = sessions.filter(session => {
      // 检查ID格式
      if (session.id && this.isSelfChatId(session.id)) {
        console.log('🛡️ 清理自聊天会话 (ID格式):', session.id)
        removedItems.push(session)
        return false
      }
      
      // 检查参与者
      if (session.participants && this.isSelfChatParticipants(session.participants)) {
        console.log('🛡️ 清理自聊天会话 (参与者):', session.participants)
        removedItems.push(session)
        return false
      }
      
      return true
    })
    
    return {
      cleanedSessions,
      removedCount: removedItems.length,
      removedItems
    }
  }

  /**
   * 安全的聊天URL生成
   * @param userId1 用户ID1
   * @param userId2 用户ID2
   * @returns 聊天URL
   */
  static generateSafeChatUrl(userId1: string | number, userId2: string | number): string {
    this.validateChatOperation(userId1, userId2, 'URL生成')
    
    const id1 = String(userId1)
    const id2 = String(userId2)
    const sortedIds = [id1, id2].sort()
    
    return `/chat/${sortedIds[0]}_${sortedIds[1]}`
  }

  /**
   * 安全的会话ID生成
   * @param userId1 用户ID1
   * @param userId2 用户ID2
   * @returns 会话ID
   */
  static generateSafeSessionId(userId1: string | number, userId2: string | number): string {
    this.validateChatOperation(userId1, userId2, '会话ID生成')
    
    const id1 = String(userId1)
    const id2 = String(userId2)
    const sortedIds = [id1, id2].sort()
    
    return `chat_${sortedIds[0]}_${sortedIds[1]}`
  }
}

// 导出单例实例
export const chatGuard = new ChatGuard()

// 导出常用的验证函数
export const {
  isSelfChat,
  isSelfChatId,
  isSelfChatParticipants,
  validateChatOperation,
  validateChatId,
  validateParticipants,
  cleanSelfChatSessions,
  generateSafeChatUrl,
  generateSafeSessionId
} = ChatGuard

export default ChatGuard

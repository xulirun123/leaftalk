/**
 * 聊天URL生成器
 * 统一管理聊天页面的URL格式，确保从不同入口进入聊天页面时URL一致
 */

import { ChatGuard } from './chatGuard'

/**
 * 生成统一的聊天URL
 * @param currentUserId 当前用户ID
 * @param otherUserId 对方用户ID
 * @returns 统一格式的聊天URL
 */
export function generateChatUrl(currentUserId: string, otherUserId: string): string {
  // 使用ChatGuard进行根本防护
  return ChatGuard.generateSafeChatUrl(currentUserId, otherUserId)
}

/**
 * 从聊天URL中解析用户ID
 * @param chatUrl 聊天URL或聊天ID
 * @returns 解析出的用户ID信息
 */
export function parseChatUrl(chatUrl: string): {
  userId1: string
  userId2: string
  currentUserId?: string
  otherUserId?: string
} {
  console.log('🔍 解析聊天URL:', chatUrl)

  // 移除各种可能的前缀，统一处理
  let chatId = chatUrl
    .replace('/chat/', '')  // 移除路由前缀
    .replace('chat_', '')   // 移除chat_前缀

  console.log('🔍 处理后的chatId:', chatId)

  // 分割ID
  const parts = chatId.split('_')

  if (parts.length >= 2) {
    const result = {
      userId1: parts[0],
      userId2: parts[1]
    }
    console.log('🔍 解析结果:', result)
    return result
  }

  console.error('❌ 无效的聊天URL格式:', chatUrl)
  throw new Error(`Invalid chat URL format: ${chatUrl}`)
}

/**
 * 根据当前用户ID确定对方用户ID
 * @param chatId 聊天ID
 * @param currentUserId 当前用户ID
 * @returns 对方用户ID
 */
export function getOtherUserId(chatId: string, currentUserId: string): string {
  // 使用ChatGuard进行根本防护
  ChatGuard.validateChatId(chatId, '获取对方用户ID')

  const { userId1, userId2 } = parseChatUrl(chatId)

  // 🛡️ 立即检测自聊天并阻止
  if (userId1 === userId2) {
    console.error('🛡️ getOtherUserId检测到自聊天ID:', { chatId, userId1, userId2 })
    throw new Error(`Self chat detected in getOtherUserId: ${chatId}`)
  }

  // 再次验证解析结果
  ChatGuard.validateChatOperation(userId1, userId2, '获取对方用户ID')

  if (userId1 === currentUserId) {
    // 🛡️ 确保返回的不是自己
    if (userId2 === currentUserId) {
      throw new Error(`Self chat detected: both users are ${currentUserId}`)
    }
    return userId2
  } else if (userId2 === currentUserId) {
    // 🛡️ 确保返回的不是自己
    if (userId1 === currentUserId) {
      throw new Error(`Self chat detected: both users are ${currentUserId}`)
    }
    return userId1
  }

  throw new Error(`Current user ${currentUserId} is not part of chat ${chatId}`)
}

/**
 * 生成聊天会话ID（用于存储）
 * @param currentUserId 当前用户ID
 * @param otherUserId 对方用户ID
 * @returns 会话ID
 */
export function generateSessionId(currentUserId: string, otherUserId: string): string {
  // 使用ChatGuard进行根本防护
  return ChatGuard.generateSafeSessionId(currentUserId, otherUserId)
}

/**
 * 检查两个用户ID是否匹配某个聊天会话
 * @param sessionId 会话ID
 * @param userId1 用户1 ID
 * @param userId2 用户2 ID
 * @returns 是否匹配
 */
export function isSessionMatch(sessionId: string, userId1: string, userId2: string): boolean {
  try {
    const { userId1: sessionUser1, userId2: sessionUser2 } = parseChatUrl(sessionId)
    const sortedInput = [userId1, userId2].sort()
    const sortedSession = [sessionUser1, sessionUser2].sort()
    
    return sortedInput[0] === sortedSession[0] && sortedInput[1] === sortedSession[1]
  } catch {
    return false
  }
}

/**
 * 从旧格式的聊天ID转换为新格式
 * @param oldChatId 旧格式的聊天ID
 * @param currentUserId 当前用户ID
 * @returns 新格式的聊天URL
 */
export function migrateChatId(oldChatId: string, currentUserId: string): string {
  // 如果已经是新格式，直接返回
  if (oldChatId.includes('_') && !oldChatId.startsWith('chat_')) {
    return `/chat/${oldChatId}`
  }
  
  // 如果是旧格式，尝试转换
  if (oldChatId.startsWith('chat_')) {
    const parts = oldChatId.replace('chat_', '').split('_')
    if (parts.length >= 2) {
      return generateChatUrl(parts[0], parts[1])
    }
  }
  
  // 如果是单个用户ID，与当前用户组合
  return generateChatUrl(currentUserId, oldChatId)
}

/**
 * 验证聊天URL格式是否正确
 * @param chatUrl 聊天URL
 * @returns 是否为有效格式
 */
export function isValidChatUrl(chatUrl: string): boolean {
  try {
    const { userId1, userId2 } = parseChatUrl(chatUrl)
    return userId1 && userId2 && userId1 !== userId2
  } catch {
    return false
  }
}

/**
 * 获取聊天显示名称
 * @param chatId 聊天ID
 * @param currentUserId 当前用户ID
 * @param userInfoMap 用户信息映射
 * @returns 聊天显示名称
 */
export function getChatDisplayName(
  chatId: string, 
  currentUserId: string, 
  userInfoMap: Record<string, { name?: string, nickname?: string }>
): string {
  try {
    const otherUserId = getOtherUserId(chatId, currentUserId)
    const userInfo = userInfoMap[otherUserId]
    
    if (userInfo) {
      return userInfo.nickname || userInfo.name || `用户${otherUserId}`
    }
    
    return `用户${otherUserId}`
  } catch {
    return '未知聊天'
  }
}

// 导出常用的组合函数
export const chatUrlUtils = {
  generate: generateChatUrl,
  parse: parseChatUrl,
  getOtherUser: getOtherUserId,
  generateSession: generateSessionId,
  isMatch: isSessionMatch,
  migrate: migrateChatId,
  isValid: isValidChatUrl,
  getDisplayName: getChatDisplayName
}

export default chatUrlUtils

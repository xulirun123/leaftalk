/**
 * 聊天项管理 Composable
 * 负责在发送/接收消息时自动创建和更新聊天项
 */

import { useChatStore } from '../stores/chatStore'
import { useUnreadStore } from '../stores/unread'
import type { ChatMessage } from '../stores/chatStore'

export interface UserInfo {
  id: string
  name?: string
  nickname?: string
  avatar?: string
}

export function useChatItemManager(sendToServerFn?: (message: ChatMessage) => Promise<void>) {
  const chatStore = useChatStore()
  const unreadStore = useUnreadStore()

  // 发送消息到WebSocket服务器
  const sendMessageToServer = async (message: ChatMessage) => {
    try {
      if (sendToServerFn) {
        console.log('📡 通过WebSocket发送消息:', message.content)
        await sendToServerFn(message)
        console.log('✅ 消息已发送到WebSocket服务器')
      } else {
        console.warn('⚠️ WebSocket发送函数不可用，消息仅保存在本地')
      }
    } catch (error) {
      console.error('❌ 发送消息到服务器失败:', error)
      throw error
    }
  }

  /**
   * 发送消息时调用 - 自动创建或更新聊天项
   * @param message 消息对象
   * @param receiverInfo 接收者信息
   */
  const sendMessage = async (message: ChatMessage, receiverInfo?: UserInfo) => {
    try {
      console.log('📤 发送消息:', message.content, '给:', receiverInfo?.name)

      // 创建或更新聊天项（这会自动添加消息到内存和持久化存储）
      const session = chatStore.createOrUpdateChatItem(message, receiverInfo)

      // 发送者不增加未读数，但要确保会话存在
      if (session) {
        console.log('✅ 聊天项已创建/更新:', session.name)
      }

      // 发送消息到WebSocket服务器（不再重复添加到chatStore）
      await sendMessageToServer(message)

      return session
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      throw error
    }
  }

  /**
   * 接收消息时调用 - 自动创建或更新聊天项
   * @param message 消息对象
   * @param senderInfo 发送者信息
   */
  const receiveMessage = async (message: ChatMessage, senderInfo?: UserInfo) => {
    try {
      console.log('📥 接收消息:', message.content, '来自:', senderInfo?.name)
      
      // 创建或更新聊天项
      const session = chatStore.receiveMessage(message, senderInfo)
      
      // 更新未读消息数
      if (session) {
        unreadStore.setUnreadCount(session.id, session.unreadCount)
        console.log('✅ 聊天项已创建/更新:', session.name, '未读数:', session.unreadCount)
      }

      return session
    } catch (error) {
      console.error('❌ 接收消息失败:', error)
      throw error
    }
  }

  /**
   * 创建消息对象
   * @param content 消息内容
   * @param senderId 发送者ID
   * @param receiverId 接收者ID
   * @param type 消息类型
   */
  const createMessage = (
    content: string,
    senderId: string,
    receiverId: string,
    type: 'text' | 'image' | 'voice' | 'video' | 'file' = 'text'
  ): ChatMessage => {
    // 防护：阻止创建自聊天消息
    if (senderId === receiverId) {
      console.error('❌ 阻止创建自聊天消息:', { senderId, receiverId, content })
      throw new Error('不能给自己发消息')
    }

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId,
      receiverId,
      content,
      type,
      timestamp: Date.now(),
      status: 'sending'
    }
  }

  /**
   * 发送文本消息的便捷方法
   * @param content 消息内容
   * @param receiverId 接收者ID
   * @param currentUserId 当前用户ID
   * @param receiverInfo 接收者信息
   */
  const sendTextMessage = async (
    content: string,
    receiverId: string,
    currentUserId: string,
    receiverInfo?: UserInfo
  ) => {
    const message = createMessage(content, currentUserId, receiverId, 'text')
    return await sendMessage(message, receiverInfo)
  }

  /**
   * 模拟接收消息的便捷方法
   * @param content 消息内容
   * @param senderId 发送者ID
   * @param currentUserId 当前用户ID
   * @param senderInfo 发送者信息
   */
  const simulateReceiveMessage = async (
    content: string,
    senderId: string,
    currentUserId: string,
    senderInfo?: UserInfo
  ) => {
    const message = createMessage(content, senderId, currentUserId, 'text')
    message.status = 'delivered'
    return await receiveMessage(message, senderInfo)
  }

  /**
   * 检查是否已存在聊天项
   * @param userId1 用户1 ID
   * @param userId2 用户2 ID
   */
  const hasChatItem = (userId1: string, userId2: string): boolean => {
    const sessionId = chatStore.generateSessionId(userId1, userId2)
    return chatStore.hasSession(sessionId)
  }

  /**
   * 获取聊天会话ID
   * @param userId1 用户1 ID
   * @param userId2 用户2 ID
   */
  const getChatSessionId = (userId1: string, userId2: string): string => {
    return chatStore.generateSessionId(userId1, userId2)
  }

  return {
    sendMessage,
    sendMessageToServer,
    receiveMessage,
    createMessage,
    sendTextMessage,
    simulateReceiveMessage,
    hasChatItem,
    getChatSessionId
  }
}

/**
 * 使用示例：
 * 
 * const { sendTextMessage, simulateReceiveMessage } = useChatItemManager()
 * 
 * // 发送消息
 * await sendTextMessage(
 *   '你好！',
 *   'user_123',
 *   'current_user',
 *   { id: 'user_123', name: '张三', avatar: '/avatars/user123.jpg' }
 * )
 * 
 * // 模拟接收消息
 * await simulateReceiveMessage(
 *   '你好，很高兴认识你！',
 *   'user_123',
 *   'current_user',
 *   { id: 'user_123', name: '张三', avatar: '/avatars/user123.jpg' }
 * )
 */

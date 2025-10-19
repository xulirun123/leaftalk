import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messagePersistenceService, type StoredMessage, type StoredSession } from '../services/messagePersistenceService'
import { realtimeMessageService, type RealtimeMessage } from '../services/realtimeMessageService'
import { useAuthStore } from '../../../stores/auth'
import { ChatGuard } from '../utils/chatGuard'

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'contact' | 'location' | 'system' | 'announcement' | 'group_invite'
  timestamp: number
  status: 'sending' | 'sent' | 'delivered' | 'read'
  senderName?: string  // 发送者昵称
}

export interface ChatSession {
  id: string
  participants: string[]
  lastMessage?: ChatMessage | string
  unreadCount: number
  updatedAt: number
  createdAt?: number
  name?: string
  avatar?: string
  lastMessageTime?: number
  type?: string
  isPinned?: boolean
}

export const useChatStore = defineStore('chat', () => {
  // 获取认证store
  const authStore = useAuthStore()

  const sessions = ref<ChatSession[]>([])
  const messages = ref<Map<string, ChatMessage[]>>(new Map())
  const lastLoadTime = ref<number>(0) // 记录最后加载时间
  const deletedSessions = ref<Set<string>>(new Set()) // 记录已删除的会话ID
  const clearedSessions = ref<Set<string>>(new Set()) // 记录已清空聊天记录的会话ID
  const clearedTimestamps = ref<Map<string, number>>(new Map()) // 记录清空时间戳

  // 缓存配置
  const SESSIONS_CACHE_KEY = 'chat_sessions_cache'
  const MESSAGES_CACHE_KEY = 'chat_messages_cache'
  const DELETED_SESSIONS_KEY = 'deleted_chat_sessions'
  const CLEARED_SESSIONS_KEY = 'cleared_chat_sessions'
  const CLEARED_TIMESTAMPS_KEY = 'cleared_chat_timestamps'
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天缓存
  const currentSessionId = ref<string | null>(null)

  // 获取当前会话
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  // 获取当前会话的消息
  const currentMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messages.value.get(currentSessionId.value) || []
  })

  // 设置当前会话
  function setCurrentSession(sessionId: string) {
    currentSessionId.value = sessionId
  }

  // 添加消息
  function addMessage(sessionId: string, message: ChatMessage) {
    // 如果会话在删除列表中，说明用户重新发送消息，从删除列表中移除
    if (deletedSessions.value.has(sessionId)) {
      console.log('🔄 检测到已删除会话有新消息，从删除列表中移除:', sessionId)
      deletedSessions.value.delete(sessionId)
      localStorage.setItem('deleted_chat_sessions', JSON.stringify(Array.from(deletedSessions.value)))
    }

    // 如果会话在清空列表中，保持清空状态与时间戳，不再自动移除；仅用于作为历史消息的边界
    if (clearedSessions.value.has(sessionId)) {
      const clearTime = clearedTimestamps.value.get(sessionId) || 0
      console.log('🏷️ 清空状态生效，历史边界:', new Date(clearTime).toLocaleString())
    }

    const sessionMessages = messages.value.get(sessionId) || []

    // 检查消息是否已存在（防止重复添加）
    const existingMessage = sessionMessages.find(msg => msg.id === message.id)
    if (existingMessage) {
      console.log('⚠️ 消息已存在，跳过添加:', message.id)
      return
    }

    sessionMessages.push(message)
    messages.value.set(sessionId, sessionMessages)

    // 更新会话信息
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.lastMessage = message
      session.updatedAt = message.timestamp
      session.lastMessageTime = message.timestamp
    }

    // 持久化保存消息
    try {
      const storedMessage: StoredMessage = {
        id: String(message.id),
        sessionId: String(sessionId),
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        content: String(message.content || ''),
        type: message.type,
        timestamp: Number(message.timestamp) || Date.now(),
        status: (message.status === 'sending' ? 'sent' : (message.status as any)),
        isOwn: String(message.senderId) === String(authStore.user?.id)
      }
      console.log('💾 保存消息到持久化存储(addMessage):', message.id, '内容:', message.content?.substring(0, 20))
      messagePersistenceService.saveMessage(storedMessage).catch(err => console.warn('持久化消息失败(addMessage):', err))
    } catch (e) {
      console.warn('构造持久化消息失败(addMessage):', e)
    }

    // 保存到缓存
    saveToCache()
    console.log('✅ 消息已添加:', message.id)
  }

  // 从指定会话中移除消息
  function removeMessage(sessionId: string, messageId: string) {
    try {
      // 从内存中移除
      const sessionMessages = messages.value.get(sessionId) || []
      const filteredMessages = sessionMessages.filter(msg => msg.id !== messageId)
      messages.value.set(sessionId, filteredMessages)

      // 从持久化存储中移除
      messagePersistenceService.removeMessage(messageId).catch(err =>
        console.warn('持久化移除消息失败:', err)
      )

      // 保存到缓存
      saveToCache()
      console.log('✅ 消息已移除:', messageId)
    } catch (error) {
      console.error('❌ 移除消息失败:', error)
    }
  }

  // 清理无效的blob URL消息和404文件
  function cleanupInvalidMessages(sessionId: string) {
    try {
      const sessionMessages = messages.value.get(sessionId) || []
      const validMessages = sessionMessages.filter(msg => {
        // blob: 临时消息保留（本人的发送中或近期消息用于“立即显示”），仅清理过期或他人残留
        if (typeof msg.content === 'string' && msg.content.startsWith('blob:')) {
          const isOwn = String(msg.senderId) === String(authStore.user?.id)
          const isRecent = Date.now() - (Number((msg as any).timestamp) || 0) < 10 * 60 * 1000
          const isSending = (msg as any).status === 'sending'
          if (isOwn || isSending || isRecent) {
            return true
          }
          console.log('🗑️ 清理过期/无主的 blob URL 消息:', msg.id)
          messagePersistenceService.removeMessage(msg.id).catch(err =>
            console.warn('清理blob消息失败:', err)
          )
          return false
        }

        // 移除明确标记为无效的历史样本文件（临时黑名单），避免误删有效上传
        if (typeof msg.content === 'string' && (
          msg.content.includes('1757725383688_0472ba8497ee7326.mp4') ||
          msg.content.includes('1757766900761_2d0cea9d08600f05.mp4') ||
          msg.content.includes('5fa65094-0e93-46fa-962b-c9f8c91bce29')
        )) {
          console.log('🗑️ 清理历史样本无效文件消息:', msg.id, msg.content)
          messagePersistenceService.removeMessage(msg.id).catch(err =>
            console.warn('清理样本404消息失败:', err)
          )
          return false
        }

        return true
      })

      if (validMessages.length !== sessionMessages.length) {
        messages.value.set(sessionId, validMessages)
        saveToCache()
        console.log(`✅ 已清理 ${sessionMessages.length - validMessages.length} 条无效消息`)
      }
    } catch (error) {
      console.error('❌ 清理无效消息失败:', error)
    }
  }

  // 全局清理所有会话的无效消息
  function cleanupAllInvalidMessages() {
    try {
      console.log('🧹 开始全局清理无效消息...')
      let totalCleaned = 0

      for (const [sessionId, sessionMessages] of messages.value.entries()) {
        const originalCount = sessionMessages.length
        const validMessages = sessionMessages.filter(msg => {
          // blob: 临时消息保留（本人的发送中或近期消息用于“立即显示”），仅清理过期或他人残留
          if (typeof msg.content === 'string' && msg.content.startsWith('blob:')) {
            const isOwn = String(msg.senderId) === String(authStore.user?.id)
            const isRecent = Date.now() - (Number((msg as any).timestamp) || 0) < 10 * 60 * 1000
            const isSending = (msg as any).status === 'sending'
            if (isOwn || isSending || isRecent) {
              return true
            }
            console.log('🗑️ 清理过期/无主的 blob URL 消息:', msg.id)
            messagePersistenceService.removeMessage(msg.id).catch(err =>
              console.warn('清理blob消息失败:', err)
            )
            return false
          }

          // 仅移除明确的历史样本无效文件，避免误删有效上传
          if (typeof msg.content === 'string' && (
            msg.content.includes('1757725383688_0472ba8497ee7326.mp4') ||
            msg.content.includes('1757766900761_2d0cea9d08600f05.mp4') ||
            msg.content.includes('5fa65094-0e93-46fa-962b-c9f8c91bce29')
          )) {
            console.log('🗑️ 清理可能的样本无效文件消息:', msg.id, msg.content)
            messagePersistenceService.removeMessage(msg.id).catch(err =>
              console.warn('清理样本404消息失败:', err)
            )
            return false
          }

          return true
        })

        if (validMessages.length !== originalCount) {
          messages.value.set(sessionId, validMessages)
          const cleaned = originalCount - validMessages.length
          totalCleaned += cleaned
          console.log(`✅ 会话 ${sessionId} 清理了 ${cleaned} 条无效消息`)
        }
      }

      if (totalCleaned > 0) {
        saveToCache()
        console.log(`✅ 全局清理完成，共清理 ${totalCleaned} 条无效消息`)
      } else {
        console.log('✅ 没有发现需要清理的无效消息')
      }
    } catch (error) {
      console.error('❌ 全局清理无效消息失败:', error)
    }
  }

  // 添加会话
  function addSession(sessionData: any) {
    // 🛡️ 根本防护：验证会话数据
    let participants = sessionData.participants

    // 如果没有participants，尝试从其他字段构造
    if (!participants || !Array.isArray(participants)) {
      const currentUserId = String(authStore.user?.id || '')

      if (sessionData.userId && sessionData.userId !== currentUserId) {
        // 如果有userId且不是当前用户，构造双人会话
        participants = [currentUserId, sessionData.userId]
      } else if (sessionData.other_user_id && sessionData.other_user_id !== currentUserId) {
        // 如果有other_user_id且不是当前用户，构造双人会话
        participants = [currentUserId, sessionData.other_user_id]
      } else {
        // 无法构造有效的participants，拒绝添加
        console.error('🛡️ 无法构造有效的participants，拒绝添加会话:', sessionData)
        throw new Error('无效的会话数据：缺少有效的参与者信息')
      }
    }

    // 验证participants不是自聊天
    ChatGuard.validateParticipants(participants, '添加会话')

    // 检查会话是否已存在
    const existingSession = sessions.value.find(s => s.id === sessionData.id)
    if (existingSession) {
      // 会话已存在，更新它而不是添加新的
      console.log('🔄 会话已存在，更新会话:', sessionData.id)
      existingSession.name = sessionData.name
      existingSession.avatar = sessionData.avatar
      existingSession.lastMessage = sessionData.lastMessage
      existingSession.lastMessageTime = sessionData.lastMessageTime || Date.now()
      existingSession.updatedAt = sessionData.lastMessageTime || Date.now()
      // 如果会话在删除列表中，从删除列表中移除
      if (deletedSessions.value.has(sessionData.id)) {
        console.log('🔄 会话重新激活，从删除列表中移除:', sessionData.id)
        deletedSessions.value.delete(sessionData.id)
        localStorage.setItem('deleted_chat_sessions', JSON.stringify(Array.from(deletedSessions.value)))
      }
      return
    }

    const session: ChatSession = {
      id: sessionData.id,
      participants,
      unreadCount: 0,
      updatedAt: sessionData.lastMessageTime || Date.now(),
      createdAt: sessionData.createdAt || Date.now(),
      name: sessionData.name,
      avatar: sessionData.avatar,
      lastMessage: sessionData.lastMessage,
      lastMessageTime: sessionData.lastMessageTime,
      type: sessionData.type || 'private'
    }
    sessions.value.push(session)
    messages.value.set(sessionData.id, [])
  }

  // 创建会话
  function createSession(participants: string[]): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: ChatSession = {
      id: sessionId,
      participants,
      unreadCount: 0,
      updatedAt: Date.now()
    }
    sessions.value.push(session)
    messages.value.set(sessionId, [])
    return sessionId
  }

  // 标记消息为已读
  function markAsRead(sessionId: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.unreadCount = 0
    }
  }

  // 获取未读消息总数
  const totalUnreadCount = computed(() => {
    return sessions.value.reduce((total, session) => total + session.unreadCount, 0)
  })

  // 检查会话是否存在
  function hasSession(sessionId: string): boolean {
    return sessions.value.some(s => s.id === sessionId)
  }

  // 根据参与者查找会话
  function findSessionByParticipants(participants: string[]): ChatSession | null {
    return sessions.value.find(session => {
      if (session.participants.length !== participants.length) return false
      return participants.every(p => session.participants.includes(p))
    }) || null
  }

  // 自动创建或更新聊天项（发送消息时调用）
  async function createOrUpdateChatItem(message: ChatMessage, otherUserInfo?: any) {
    // 🛡️ 判断是否为群聊消息
    const isGroupMessage = String(message.receiverId).startsWith('group_')

    // 群聊：直接使用群ID作为sessionId；私聊：使用generateSessionId生成
    const sessionId = isGroupMessage
      ? String(message.receiverId)
      : generateSessionId(String(message.senderId), String(message.receiverId))

    console.log('🔍 createOrUpdateChatItem - 消息类型:', isGroupMessage ? '群聊' : '私聊', 'sessionId:', sessionId)

    // 如果会话在删除列表中，说明用户重新发送消息，从删除列表中移除
    if (deletedSessions.value.has(sessionId)) {
      console.log('🔄 会话重新激活，从删除列表中移除:', sessionId)
      deletedSessions.value.delete(sessionId)
      localStorage.setItem('deleted_chat_sessions', JSON.stringify(Array.from(deletedSessions.value)))
    }

    // 如果会话在清空列表中，保持清空状态与时间戳，不再自动移除；仅用于作为历史消息的边界
    if (clearedSessions.value.has(sessionId)) {
      const clearTime = clearedTimestamps.value.get(sessionId) || 0
      console.log('🏷️ 清空状态生效（发送时），历史边界:', new Date(clearTime).toLocaleString())
    }

    // 检查是否已存在会话
    let session = sessions.value.find(s => s.id === sessionId)

    if (!session) {
      // 创建新会话
      const participants = isGroupMessage
        ? [String(message.senderId)] // 群聊只记录当前用户
        : [String(message.senderId), String(message.receiverId)]

      // 确定当前用户和对方用户
      const currentUserId = String(authStore.user?.id || '')
      const otherUserId = isGroupMessage
        ? String(message.receiverId) // 群聊的otherUserId就是群ID
        : (participants.find(p => p !== currentUserId) || message.receiverId)

      console.log('🔍 创建聊天项 - 当前用户:', currentUserId, '对方用户:', otherUserId, '是否群聊:', isGroupMessage)

      // 使用ChatGuard进行根本防护（仅对私聊进行检查）
      if (!isGroupMessage) {
        ChatGuard.validateChatOperation(currentUserId, otherUserId, '创建聊天项')
      }

      // 获取对方用户信息或群聊信息
      let userName = ''
      let userAvatar = null

      if (isGroupMessage) {
        // 🛡️ 群聊消息：从 otherUserInfo 中获取群聊信息
        if (otherUserInfo?.groupName && otherUserInfo.groupName.trim()) {
          userName = otherUserInfo.groupName.trim()
        } else if (otherUserInfo?.name && otherUserInfo.name.trim()) {
          userName = otherUserInfo.name.trim()
        }

        if (otherUserInfo?.groupAvatar) {
          userAvatar = otherUserInfo.groupAvatar
        } else if (otherUserInfo?.avatar) {
          userAvatar = otherUserInfo.avatar
        }

        // 如果没有获取到群聊名称，使用默认值
        if (!userName) {
          userName = `群聊${otherUserId.substring(6, 16)}`
          console.log('⚠️ 未获取到群聊名称，使用默认值:', userName)
        }
      } else {
        // 私聊消息：获取对方用户信息
        if (otherUserInfo?.name && otherUserInfo.name.trim()) {
          userName = otherUserInfo.name.trim()
        } else if (otherUserInfo?.nickname && otherUserInfo.nickname.trim()) {
          userName = otherUserInfo.nickname.trim()
        }

        if (otherUserInfo?.avatar) {
          userAvatar = otherUserInfo.avatar
        }

        // 如果没有获取到有效的用户信息，使用默认值
        if (!userName) {
          try {
            console.log('🔍 获取对方用户信息:', otherUserId)
            // 这里可以调用用户信息API获取真实信息
            // const userInfo = await getUserInfo(otherUserId)
            // userName = userInfo.nickname || userName
            // userAvatar = userInfo.avatar || userAvatar

            // 暂时使用默认值，避免生成头像
            userName = `用户${otherUserId}`
          } catch (error) {
            console.warn('获取用户信息失败:', error)
            userName = `用户${otherUserId}`
          }
        }
      }

      if (!userAvatar) {
        userAvatar = null
      }

      session = {
        id: sessionId,
        participants,
        lastMessage: message,
        unreadCount: 0, // 发送者的未读数为0
        updatedAt: message.timestamp,
        createdAt: message.timestamp,
        lastMessageTime: message.timestamp,
        name: userName,
        avatar: userAvatar,
        type: isGroupMessage ? 'group' : 'private'
      }
      sessions.value.push(session)
      messages.value.set(sessionId, [])
      console.log('✅ 创建新聊天项:', session.name)
    } else {
      // 更新现有会话
      session.lastMessage = message
      session.updatedAt = message.timestamp
      session.lastMessageTime = message.timestamp
      console.log('🔄 更新聊天项:', session.name)
    }

    // 添加消息到会话（检查重复）
    const sessionMessages = messages.value.get(sessionId) || []

    // 检查消息是否已存在（防止重复添加）
    const existingMessage = sessionMessages.find(msg => msg.id === message.id)
    if (!existingMessage) {
      sessionMessages.push(message)
      messages.value.set(sessionId, sessionMessages)
      console.log('✅ 消息已添加到会话:', message.id, '内容:', message.content?.substring(0, 20))

      // 持久化保存消息
      try {
        const storedMessage: StoredMessage = {
          id: String(message.id),
          sessionId: String(sessionId),
          senderId: String(message.senderId),
          receiverId: String(message.receiverId),
          content: String(message.content || ''),
          type: message.type,
          timestamp: Number(message.timestamp) || Date.now(),
          status: (message.status === 'sending' ? 'sent' : (message.status as any)),
          isOwn: String(message.senderId) === String(authStore.user?.id)
        }
        console.log('💾 保存消息到持久化存储(createOrUpdateChatItem):', message.id)
        messagePersistenceService.saveMessage(storedMessage).catch(err => console.warn('持久化消息失败(createOrUpdateChatItem):', err))
      } catch (e) {
        console.warn('构造持久化消息失败(createOrUpdateChatItem):', e)
      }
    } else {
      console.log('⚠️ 消息已存在，跳过添加:', message.id, '现有消息内容:', existingMessage.content?.substring(0, 20))
    }

    // 保存到缓存
    saveToCache()

    return session
  }

  // 接收消息时创建或更新聊天项
  async function receiveMessage(message: ChatMessage, senderInfo?: any) {
    // 🛡️ 判断是否为群聊消息
    const isGroupMessage = String(message.receiverId).startsWith('group_')

    // 群聊：直接使用群ID作为sessionId；私聊：使用generateSessionId生成
    const sessionId = isGroupMessage
      ? String(message.receiverId)
      : generateSessionId(String(message.senderId), String(message.receiverId))

    console.log('🔍 receiveMessage - 消息类型:', isGroupMessage ? '群聊' : '私聊', 'sessionId:', sessionId)

    // 检查是否已存在会话
    let session = sessions.value.find(s => s.id === sessionId)

    if (!session) {
      // 创建新会话
      const participants = isGroupMessage
        ? [String(message.senderId)] // 群聊只记录发送者
        : [String(message.senderId), String(message.receiverId)]

      // 使用ChatGuard进行根本防护（仅对私聊进行检查）
      if (!isGroupMessage) {
        ChatGuard.validateChatOperation(message.senderId, message.receiverId, '接收聊天消息')
      }

      // 获取发送者/群聊信息
      let sessionName = ''
      let sessionAvatar = null

      if (isGroupMessage) {
        // 🛡️ 群聊消息：从 senderInfo 中获取群聊信息
        if (senderInfo?.groupName && senderInfo.groupName.trim()) {
          sessionName = senderInfo.groupName.trim()
        } else if (senderInfo?.name && senderInfo.name.trim()) {
          sessionName = senderInfo.name.trim()
        }

        if (senderInfo?.groupAvatar) {
          sessionAvatar = senderInfo.groupAvatar
        } else if (senderInfo?.avatar) {
          sessionAvatar = senderInfo.avatar
        }

        // 如果没有获取到群聊名称，使用默认值
        if (!sessionName) {
          sessionName = `群聊${message.receiverId.substring(6, 16)}`
          console.log('⚠️ 未获取到群聊名称，使用默认值:', sessionName)
        }
      } else {
        // 私聊消息：获取发送者信息
        if (senderInfo?.name && senderInfo.name.trim()) {
          sessionName = senderInfo.name.trim()
        } else if (senderInfo?.nickname && senderInfo.nickname.trim()) {
          sessionName = senderInfo.nickname.trim()
        }

        if (senderInfo?.avatar) {
          sessionAvatar = senderInfo.avatar
        }

        // 如果没有获取到有效的发送者信息，使用默认值
        if (!sessionName) {
          try {
            console.log('🔍 获取发送者用户信息:', message.senderId)
            // 这里可以调用用户信息API获取真实信息
            // const userInfo = await getUserInfo(message.senderId)
            // sessionName = userInfo.nickname || sessionName
            // sessionAvatar = userInfo.avatar || sessionAvatar

            // 暂时使用默认值，避免生成头像
            sessionName = `用户${message.senderId}`
          } catch (error) {
            console.warn('获取发送者信息失败:', error)
            sessionName = `用户${message.senderId}`
          }
        }
      }

      if (!sessionAvatar) {
        sessionAvatar = null
      }

      session = {
        id: sessionId,
        participants,
        lastMessage: message,
        unreadCount: 1, // 接收者的未读数为1
        updatedAt: message.timestamp,
        createdAt: message.timestamp,
        lastMessageTime: message.timestamp,
        name: sessionName,
        avatar: sessionAvatar,
        type: isGroupMessage ? 'group' : 'private'
      }
      sessions.value.push(session)
      messages.value.set(sessionId, [])
      console.log('✅ 收到消息，创建新聊天项:', session.name, '类型:', isGroupMessage ? '群聊' : '私聊')
    } else {
      // 更新现有会话
      session.lastMessage = message
      session.updatedAt = message.timestamp
      session.lastMessageTime = message.timestamp
      session.unreadCount += 1 // 增加未读数
      console.log('🔄 收到消息，更新聊天项:', session.name)
    }

    // 添加消息到会话（检查重复）
    const sessionMessages = messages.value.get(sessionId) || []

    // 检查消息是否已存在（防止重复添加）
    const existingMessage = sessionMessages.find(msg => msg.id === message.id)
    if (!existingMessage) {
      sessionMessages.push(message)
      messages.value.set(sessionId, sessionMessages)
      console.log('✅ 消息已添加到会话:', message.id)

      // 持久化保存消息
      try {
        const storedMessage: StoredMessage = {
          id: String(message.id),
          sessionId: String(sessionId),
          senderId: String(message.senderId),
          receiverId: String(message.receiverId),
          content: String(message.content || ''),
          type: message.type,
          timestamp: Number(message.timestamp) || Date.now(),
          status: (message.status === 'sending' ? 'sent' : (message.status as any)),
          isOwn: String(message.senderId) === String(authStore.user?.id)
        }
        messagePersistenceService.saveMessage(storedMessage).catch(err => console.warn('持久化消息失败(receiveMessage):', err))
      } catch (e) {
        console.warn('构造持久化消息失败(receiveMessage):', e)
      }
    } else {
      console.log('⚠️ 消息已存在，跳过添加:', message.id)
    }

    // 保存到缓存
    saveToCache()

    return session
  }

  // 生成会话ID（确保双方使用相同的ID）
  function generateSessionId(userId1: string, userId2: string): string {
    // 使用ChatGuard进行根本防护
    return ChatGuard.generateSafeSessionId(userId1, userId2)
  }

  // 清理重复会话
  function removeDuplicateSessions() {
    const uniqueSessions = new Map()

    sessions.value.forEach(session => {
      const key = session.id
      if (!uniqueSessions.has(key)) {
        uniqueSessions.set(key, session)
      } else {
        // 如果ID相同，保留时间戳更新的那个
        const existing = uniqueSessions.get(key)
        if ((session.updatedAt || 0) > (existing.updatedAt || 0)) {
          uniqueSessions.set(key, session)
        }
      }
    })

    const originalCount = sessions.value.length
    sessions.value.splice(0, sessions.value.length, ...Array.from(uniqueSessions.values()))
    const newCount = sessions.value.length

    if (originalCount !== newCount) {
      console.log(`🧹 清理重复会话: ${originalCount} -> ${newCount}`)
    }
  }

  // 清理管理员重复项（兼容旧版本调用）
  function cleanAdminDuplicates() {
    console.log('🧹 清理管理员重复项...')
    removeDuplicateSessions()
  }

  // 智能清理会话
  function smartCleanSessions() {
    console.log('🧠 开始智能清理会话项...')

    const originalCount = sessions.value.length

    // 使用ChatGuard进行根本清理
    const { cleanedSessions, removedCount } = ChatGuard.cleanSelfChatSessions(sessions.value)

    const validSessions = cleanedSessions.filter(session => {

      // 保留有最后消息的会话（支持字符串和对象）
      if (session.lastMessage) {
        if (typeof session.lastMessage === 'string' && session.lastMessage.trim()) {
          return true
        }
        if (typeof session.lastMessage === 'object' && session.lastMessage.content) {
          return true
        }
      }

      // 保留有未读消息的会话
      if (session.unreadCount && session.unreadCount > 0) {
        return true
      }

      // 保留有参与者的会话（基本的聊天会话）
      if (session.participants && session.participants.length >= 2) {
        return true
      }

      // 保留最近创建的会话（7天内，而不是24小时）
      if (session.createdAt && Date.now() - session.createdAt < 7 * 24 * 60 * 60 * 1000) {
        return true
      }

      // 保留有名称的会话
      if (session.name && session.name.trim()) {
        return true
      }

      console.log('🗑️ 清理无效会话:', session.id, session.name)
      return false
    })

    sessions.value.splice(0, sessions.value.length, ...validSessions)

    const newCount = sessions.value.length
    console.log(`🧹 智能清理完成: ${originalCount} -> ${newCount}`)

    return {
      original: originalCount,
      cleaned: newCount,
      removed: originalCount - newCount
    }
  }

  // 缓存相关函数
  const loadFromCache = () => {
    try {
      // 首先加载删除列表和清空会话列表
      loadDeletedSessions()
      loadClearedSessions()

      const sessionsCache = localStorage.getItem(SESSIONS_CACHE_KEY)
      console.log('📦 尝试加载聊天缓存...')

      if (sessionsCache) {
        const { data, timestamp } = JSON.parse(sessionsCache)
        const age = Date.now() - timestamp
        console.log(`📦 找到缓存数据，年龄: ${Math.round(age/1000)}秒，数据量: ${data?.length || 0}`)

        if (age < CACHE_DURATION) {
          // 🛡️ 修复错误的群聊ID格式（迁移逻辑）
          let migratedSessions = (data || []).map((session: any) => {
            // 检查是否为错误的群聊ID格式：userId_group_timestamp
            if (session.id && session.id.match(/^\d+_group_\d+$/)) {
              const parts = session.id.split('_')
              const correctId = `group_${parts[2]}`
              console.log('🔧 修复错误的群聊ID:', session.id, '→', correctId)
              return { ...session, id: correctId, type: 'group' }
            }
            // 检查是否为错误的群聊ID格式：chat_userId_group_timestamp
            if (session.id && session.id.match(/^chat_\d+_group_\d+$/)) {
              const parts = session.id.split('_')
              const correctId = `group_${parts[3]}`
              console.log('🔧 修复错误的群聊ID:', session.id, '→', correctId)
              return { ...session, id: correctId, type: 'group' }
            }
            return session
          })

          // 🛡️ 验证并清理缓存数据
          const { cleanedSessions, removedCount } = ChatGuard.cleanSelfChatSessions(migratedSessions)

          if (removedCount > 0) {
            console.log('🛡️ 从缓存中清理了', removedCount, '个自聊天会话')
            // 更新缓存
            localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify({
              data: cleanedSessions,
              timestamp: Date.now()
            }))
          }

          // 过滤已删除的会话
          const filteredSessions = cleanedSessions.filter((session: any) => {
            if (deletedSessions.value.has(session.id)) {
              console.log('🗑️ 缓存中过滤已删除的会话:', session.id, session.name)
              return false
            }
            return true
          })

          sessions.value = filteredSessions as any
          console.log('✅ 缓存数据已加载，会话数量:', sessions.value.length, '(过滤前:', cleanedSessions.length, ')')

          // 验证数据结构
          sessions.value.forEach((session, index) => {
            if (!session.id || !session.name) {
              console.warn(`⚠️ 会话${index}数据不完整:`, session)
            }
          })
        } else {
          console.log('⏰ 缓存已过期，清除缓存')
          localStorage.removeItem(SESSIONS_CACHE_KEY)
        }
      } else {
        console.log('📦 没有找到聊天缓存')
      }
    } catch (error) {
      console.warn('❌ 加载聊天缓存失败:', error)
      localStorage.removeItem(SESSIONS_CACHE_KEY)
    }
  }

  const saveToCache = () => {
    try {
      localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify({
        data: sessions.value,
        timestamp: Date.now()
      }))

      // 保存删除列表和清空会话列表
      localStorage.setItem(DELETED_SESSIONS_KEY, JSON.stringify(Array.from(deletedSessions.value)))
      localStorage.setItem(CLEARED_SESSIONS_KEY, JSON.stringify(Array.from(clearedSessions.value)))

      console.log('💾 聊天数据已保存到缓存')

      // 同时保存到持久化数据库
      saveToPersistentStorage()
    } catch (error) {
      console.warn('保存聊天缓存失败:', error)
    }
  }

  // 加载删除列表
  const loadDeletedSessions = () => {
    try {
      const deletedData = localStorage.getItem(DELETED_SESSIONS_KEY)
      if (deletedData) {
        const deletedArray = JSON.parse(deletedData)
        deletedSessions.value = new Set(deletedArray)
        console.log('📋 已加载删除列表:', deletedArray.length, '个')
      }
    } catch (error) {
      console.error('❌ 加载删除列表失败:', error)
    }
  }

  // 加载清空会话列表
  const loadClearedSessions = () => {
    try {
      const clearedData = localStorage.getItem(CLEARED_SESSIONS_KEY)
      if (clearedData) {
        const clearedArray = JSON.parse(clearedData)
        clearedSessions.value = new Set(clearedArray)
        console.log('📋 已加载清空会话列表:', clearedArray.length, '个')
      }

      // 加载清空时间戳
      const timestampsStored = localStorage.getItem(CLEARED_TIMESTAMPS_KEY)
      if (timestampsStored) {
        const timestampsObj = JSON.parse(timestampsStored)
        clearedTimestamps.value = new Map(Object.entries(timestampsObj).map(([k, v]) => [k, Number(v)]))
        console.log('📋 已加载清空时间戳:', clearedTimestamps.value.size, '个')
      }
    } catch (error) {
      console.error('❌ 加载清空会话列表失败:', error)
    }
  }

  // 添加到删除列表
  const addToDeletedList = (sessionId: string) => {
    deletedSessions.value.add(sessionId)
    // 立即保存
    localStorage.setItem(DELETED_SESSIONS_KEY, JSON.stringify(Array.from(deletedSessions.value)))
    console.log('🗑️ 已添加到删除列表:', sessionId)
  }

  // 删除聊天项（只删除本地会话和消息，不影响其他用户）
  const deleteChatItem = async (sessionId: string) => {
    try {
      console.log('🗑️ 开始删除本地聊天项:', sessionId)

      // 1. 从内存中移除会话
      const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
      if (sessionIndex !== -1) {
        sessions.value.splice(sessionIndex, 1)
        console.log('✅ 会话已从本地内存中移除')
      }

      // 2. 从内存中移除消息
      messages.value.delete(sessionId)
      console.log('✅ 消息已从本地内存中移除')

      // 3. 从本地持久化存储中删除（不影响服务器）
      try {
        await messagePersistenceService.deleteSession(sessionId)
        console.log('✅ 本地持久化数据已删除')
      } catch (dbError) {
        console.warn('⚠️ 本地持久化删除失败:', dbError)
      }

      // 4. 添加到删除列表，防止会话出现在列表
      addToDeletedList(sessionId)

      // 同步标记清空边界：删除聊天项同时视为清空历史，记录边界时间
      const deleteTime = Date.now()
      clearedSessions.value.add(sessionId)
      clearedTimestamps.value.set(sessionId, deleteTime)
      localStorage.setItem(CLEARED_SESSIONS_KEY, JSON.stringify(Array.from(clearedSessions.value)))
      localStorage.setItem(CLEARED_TIMESTAMPS_KEY, JSON.stringify(Object.fromEntries(clearedTimestamps.value)))
      console.log('🏷️ 删除会话后设置清空边界时间:', new Date(deleteTime).toLocaleString())

      // 5. 保存到缓存
      saveToCache()

      console.log('✅ 本地聊天项删除完成，不影响其他用户:', sessionId)
    } catch (error) {
      console.error('❌ 删除聊天项失败:', error)
      throw error
    }
  }

  // 清除聊天记录（保留会话，只删除本地消息，不影响其他用户）
  const clearChatHistory = async (sessionId: string) => {
    try {
      console.log('🧹 开始清除本地聊天记录:', sessionId)

      // 1. 从内存中清除消息
      messages.value.set(sessionId, [])
      console.log('✅ 内存中的消息已清除')

      // 2. 从本地持久化存储中删除消息（只删除本地数据）
      try {
        // 获取会话的所有消息
        const sessionMessages = await messagePersistenceService.getSessionMessages(sessionId, 10000)

        // 逐个删除本地消息
        for (const message of sessionMessages) {
          await messagePersistenceService.removeMessage(message.id)
        }
        console.log('✅ 本地持久化存储中的消息已删除:', sessionMessages.length, '条')

        // 额外确保：直接清空IndexedDB中该会话的所有消息
        await messagePersistenceService.clearSessionMessages(sessionId)
        console.log('✅ IndexedDB中的会话消息已彻底清空')
      } catch (dbError) {
        console.warn('⚠️ 本地持久化删除失败，但内存已清除:', dbError)
      }

      // 3. 标记该会话已被清空（用于防止重新加载历史消息）
      const clearTime = Date.now()
      clearedSessions.value.add(sessionId)
      clearedTimestamps.value.set(sessionId, clearTime)
      localStorage.setItem(CLEARED_SESSIONS_KEY, JSON.stringify(Array.from(clearedSessions.value)))
      localStorage.setItem(CLEARED_TIMESTAMPS_KEY, JSON.stringify(Object.fromEntries(clearedTimestamps.value)))
      console.log('🏷️ 已标记会话为已清空:', sessionId, '时间:', new Date(clearTime).toLocaleString())

      // 4. 更新会话的最后消息（仅本地显示）
      const session = sessions.value.find(s => s.id === sessionId)
      if (session) {
        session.lastMessage = ''
        session.lastMessageTime = new Date().toISOString()
        session.lastMessageType = 'text'
        session.unreadCount = 0
      }

      // 5. 保存到缓存
      saveToCache()

      console.log('✅ 本地聊天记录清除完成，不影响其他用户:', sessionId)
    } catch (error) {
      console.error('❌ 清除聊天记录失败:', error)
      throw error
    }
  }

  // 为会话加载消息（从本地持久化）
  const loadMessagesForSession = async (sessionId: string) => {
    try {
      console.log('📨 为会话加载消息:', sessionId)

      // 检查该会话是否已被清空
      if (clearedSessions.value.has(sessionId)) {
        console.log('🚫 该会话已被清空，只加载清空后的新消息:', sessionId)
        const clearTime = clearedTimestamps.value.get(sessionId) || 0

        // 从持久化服务加载清空时间之后的消息
        const storedMessages = await messagePersistenceService.getLatestMessages(sessionId, 200)

        if (storedMessages && storedMessages.length > 0) {
          // 只保留清空时间之后的消息
          const newMessages = storedMessages.filter(msg => {
            const messageTime = Number(msg.timestamp) || 0
            return messageTime > clearTime
          })

          if (newMessages.length > 0) {
            const formattedMessages = newMessages.map(msg => ({
              id: msg.id,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.content,
              type: msg.type,
              timestamp: msg.timestamp,
              status: msg.status
            }))

            // 获取当前已有的消息，进行去重
            const currentMessages = messages.value.get(sessionId) || []
            const currentMessageIds = new Set(currentMessages.map(m => m.id))

            // 只添加不存在的消息
            const uniqueNewMessages = formattedMessages.filter(msg => !currentMessageIds.has(msg.id))

            if (uniqueNewMessages.length > 0) {
              // 合并现有消息和新消息，按时间戳排序
              const allMessages = [...currentMessages, ...uniqueNewMessages].sort((a, b) =>
                Number(a.timestamp) - Number(b.timestamp)
              )
              messages.value.set(sessionId, allMessages)
              console.log('✅ 清空后新消息加载完成:', uniqueNewMessages.length, '条新消息，总计', allMessages.length, '条')
            } else {
              console.log('📭 没有新的消息需要加载')
            }
          } else {
            // 如果没有新消息，保持现有消息不变
            if (!messages.value.has(sessionId)) {
              messages.value.set(sessionId, [])
            }
            console.log('📭 没有清空后的新消息')
          }
        } else {
          messages.value.set(sessionId, [])
        }

        // 清空的会话不从API同步历史消息
        return
      }

      // 从持久化服务加载“最新N条”消息，确保包含新近发送的消息
      const storedMessages = await messagePersistenceService.getLatestMessages(sessionId, 200)

      if (storedMessages && storedMessages.length > 0) {
        // 预清理：去除可能的重复消息（相同发送者、接收者、类型、内容且时间相差<=2秒）
        const sorted = [...storedMessages].sort((a, b) => a.timestamp - b.timestamp)
        const seenMap = new Map<string, number>()
        const toDeleteIds: string[] = []
        const dedupedStored = sorted.filter(msg => {
          const key = `${msg.senderId}|${msg.receiverId}|${msg.type}|${msg.content}`
          const lastTs = seenMap.get(key)
          if (lastTs !== undefined && Math.abs(msg.timestamp - lastTs) <= 2000) {
            // 标记为重复，稍后从持久化中删除
            toDeleteIds.push(msg.id)
            return false
          }
          seenMap.set(key, msg.timestamp)
          return true
        })
        if (toDeleteIds.length > 0) {
          console.log('🧹 去除重复消息:', toDeleteIds.length)
          // 异步删除持久化中的重复消息（不阻塞主流程）
          toDeleteIds.forEach(id => messagePersistenceService.removeMessage(id).catch(() => {}))
        }

        // 转换为chatStore格式
        const formattedMessages = dedupedStored.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          type: msg.type,
          timestamp: msg.timestamp,
          status: msg.status
        }))

        // 获取当前已有的消息，进行去重
        const currentMessages = messages.value.get(sessionId) || []
        const currentMessageIds = new Set(currentMessages.map(m => m.id))

        // 只添加不存在的消息
        const uniqueNewMessages = formattedMessages.filter(msg => !currentMessageIds.has(msg.id))

        if (uniqueNewMessages.length > 0 || currentMessages.length === 0) {
          // 如果有新消息或者当前没有消息，则更新
          const allMessages = currentMessages.length === 0 ? formattedMessages :
            [...currentMessages, ...uniqueNewMessages].sort((a, b) =>
              Number(a.timestamp) - Number(b.timestamp)
            )
          messages.value.set(sessionId, allMessages)
          console.log('✅ 消息加载完成(本地):', uniqueNewMessages.length, '条新消息，总计', allMessages.length, '条')
        } else {
          console.log('📭 没有新消息需要加载，当前', currentMessages.length, '条')
        }

        // 清理无效的blob URL消息
        cleanupInvalidMessages(sessionId)

        // 检查是否已清空，如果已清空则不同步API消息
        if (!clearedSessions.value.has(sessionId)) {
          // 即使有本地消息，也检查API是否有新消息（离线消息）
          await syncMessagesFromAPI(sessionId)
        } else {
          console.log('🚫 会话已清空，跳过API消息同步:', sessionId)
        }
      } else {
        console.log('📭 没有找到本地消息，尝试从API同步...')

        // 检查是否已清空，如果已清空则不同步API消息
        if (!clearedSessions.value.has(sessionId)) {
          // 如果本地没有消息，从API同步（仅首次）
          await syncMessagesFromAPI(sessionId)
        } else {
          console.log('🚫 会话已清空，跳过API消息同步:', sessionId)
        }
      }
    } catch (error) {
      console.error('❌ 加载消息失败:', error)
    }
  }

  // 从API同步消息（仅在必要时使用）
  const syncMessagesFromAPI = async (sessionId: string) => {
    try {
      // 检查该会话是否已被清空，如果已清空则不从API同步
      if (clearedSessions.value.has(sessionId)) {
        console.log('🚫 该会话已被清空，跳过API同步:', sessionId)
        return
      }

      // 判断是否为群聊消息
      const isGroupMessage = String(sessionId).startsWith('group_')
      let apiUrl = ''
      let otherUserId = ''

      if (isGroupMessage) {
        // 群聊消息：直接使用群ID
        const groupId = sessionId
        console.log('🔄 从API同步群聊消息...', { sessionId: groupId })
        apiUrl = `http://localhost:8893/api/groups/${groupId}/messages`
      } else {
        // 私聊消息：解析sessionId获取对方用户ID
        const parts = sessionId.replace('chat_', '').split('_')
        if (parts.length !== 2) return

        const currentUserId = authStore.user?.id
        otherUserId = parts.find(id => id !== String(currentUserId)) || ''

        if (!otherUserId) return

        console.log('🔄 从API同步私聊消息...', { sessionId, otherUserId })
        apiUrl = `http://localhost:8893/api/chat/messages/${otherUserId}`
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          console.log('✅ API消息同步成功:', result.data.length, '条')

          // 获取当前本地消息，用于去重
          const currentMessages = messages.value.get(sessionId) || []
          const currentMessageIds = new Set(currentMessages.map(m => m.id))

          let newMessagesCount = 0
          const currentUserId = authStore.user?.id

          // 保存到本地持久化
          for (const msg of result.data) {
            // 跳过已存在的消息
            if (currentMessageIds.has(msg.id)) {
              continue
            }

            // 兼容不同的字段名（私聊和群聊可能不同）
            const senderId = msg.sender_id || msg.senderId || msg.from_id
            const receiverId = msg.receiver_id || msg.receiverId || msg.to_id || sessionId
            const content = msg.content || msg.message || ''
            const messageType = msg.message_type || msg.type || 'text'
            const timestamp = msg.created_at ? new Date(msg.created_at).getTime() : (msg.timestamp || Date.now())
            const status = msg.status || 'read'

            const storedMessage = {
              id: msg.id,
              sessionId: sessionId,
              senderId: String(senderId),
              receiverId: String(receiverId),
              content: String(content),
              type: messageType as any,
              timestamp: Number(timestamp),
              status: status as const,
              isOwn: String(senderId) === String(currentUserId)
            }

            console.log('💾 保存离线消息:', { id: msg.id, content: content.substring(0, 20), senderId, receiverId })
            await messagePersistenceService.saveMessage(storedMessage)

            // 添加到内存中的消息列表
            const formattedMessage = {
              id: storedMessage.id,
              senderId: storedMessage.senderId,
              receiverId: storedMessage.receiverId,
              content: storedMessage.content,
              type: storedMessage.type,
              timestamp: storedMessage.timestamp,
              status: storedMessage.status
            }

            currentMessages.push(formattedMessage)
            newMessagesCount++
          }

          if (newMessagesCount > 0) {
            // 按时间戳排序
            currentMessages.sort((a, b) => a.timestamp - b.timestamp)

            // 更新内存中的消息
            messages.value.set(sessionId, currentMessages)

            console.log(`✅ 新增 ${newMessagesCount} 条离线消息`)
          }

          // 检查存储空间并清理
          await messagePersistenceService.checkStorageAndCleanup()
        }
      }
    } catch (error) {
      console.error('❌ API消息同步失败:', error)
    }
  }

  // 保存到持久化存储
  const saveToPersistentStorage = async () => {
    try {
      // 检查是否有会话需要保存
      if (sessions.value.length === 0) {
        console.log('📭 没有会话需要保存')
        return
      }

      // 转换会话格式并保存
      const storedSessions: StoredSession[] = sessions.value.map(session => {
        // 安全地处理lastMessage
        let lastMessage: StoredMessage | null = null
        if (session.lastMessage && typeof session.lastMessage === 'object') {
          // 确保所有字段都是可序列化的
          lastMessage = {
            id: String(session.lastMessage.id || `msg_${Date.now()}`),
            sessionId: String(session.id),
            senderId: String(session.lastMessage.senderId || ''),
            receiverId: String(session.lastMessage.receiverId || ''),
            content: String(session.lastMessage.content || ''),
            type: (['text', 'image', 'voice', 'video', 'file', 'contact', 'location', 'system', 'announcement', 'group_invite'].includes(session.lastMessage.type as any))
              ? session.lastMessage.type as any
              : 'text',
            timestamp: Number(session.lastMessage.timestamp) || Date.now(),
            status: (['sent', 'delivered', 'read'].includes(session.lastMessage.status as any))
              ? session.lastMessage.status as any
              : 'delivered',
            isOwn: false // 将在运行时确定
          }
        }

        // 确保participants是字符串数组
        const participants = Array.isArray(session.participants)
          ? session.participants.map(p => String(p)).filter(p => p)
          : []

        return {
          id: String(session.id),
          participants,
          name: String(session.name || ''),
          avatar: String(session.avatar || ''),
          lastMessage,
          lastMessageTime: Number(session.lastMessageTime || session.updatedAt || Date.now()),
          unreadCount: Number(session.unreadCount || 0),
          type: (session.type === 'group') ? 'group' : 'private',
          createdAt: Number(session.createdAt || Date.now()),
          updatedAt: Number(session.updatedAt || Date.now())
        }
      })

      // 批量保存会话
      for (const session of storedSessions) {
        try {
          await messagePersistenceService.saveSession(session)
        } catch (sessionError) {
          console.error('❌ 保存单个会话失败:', session.id, sessionError)
          // 继续保存其他会话
        }
      }

      console.log('💾 聊天数据已保存到持久化存储')
    } catch (error) {
      console.error('❌ 保存到持久化存储失败:', error)

      // 如果是数据库结构问题，尝试重置数据库
      if (error instanceof Error && error.message.includes('object stores was not found')) {
        console.log('🔄 检测到数据库结构问题，尝试重置...')
        try {
          await messagePersistenceService.resetDatabase()
          console.log('✅ 数据库重置成功，请重试操作')
        } catch (resetError) {
          console.error('❌ 数据库重置失败:', resetError)
        }
      }
    }
  }

  // 从API加载聊天数据（统一的数据源）
  const loadChatsFromAPI = async (forceRefresh = false) => {
    try {
      console.log('🔄 从API加载聊天数据...', forceRefresh ? '(强制刷新)' : '')

      const authStore = useAuthStore()
      const token = authStore.token

      if (!token) {
        console.log('⚠️ 没有token，跳过API加载')
        if (!forceRefresh) {
          loadFromCache()
        }
        return
      }

      const response = await fetch('http://localhost:8893/api/chat/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const apiResult = await response.json()
        if (apiResult.success && apiResult.data && Array.isArray(apiResult.data)) {
          console.log('✅ API聊天数据加载成功:', apiResult.data.length, '个聊天')
          console.log('📋 API返回的原始数据:', apiResult.data.map((chat: any) => ({
            other_user_id: chat.other_user_id,
            nickname: chat.nickname,
            last_message: chat.last_message,
            last_message_time: chat.last_message_time
          })))

          // 转换API数据为本地格式 - 暂时不过滤，看真实数据
          const currentUserId = Number(authStore.user?.id || 1)
          console.log('🔍 API返回的原始数据:', apiResult.data)

          const validSessions = apiResult.data.map((chat: any) => {
              const otherUserId = Number(chat.other_user_id)
              const isSelfChat = currentUserId === otherUserId

              console.log('🔍 处理聊天数据:', {
                currentUserId,
                otherUserId,
                isSelfChat,
                nickname: chat.nickname,
                lastMessage: chat.last_message,
                lastMessageTime: chat.last_message_time,
                messageType: chat.last_message_type
              })

              const sessionData = {
                id: `chat_${Math.min(currentUserId, otherUserId)}_${Math.max(currentUserId, otherUserId)}`,
                participants: [String(currentUserId), String(otherUserId)],
                name: chat.nickname || `用户${otherUserId}`,
                avatar: chat.avatar,
                lastMessage: chat.last_message || '暂无消息',
                lastMessageTime: new Date(chat.last_message_time).getTime(),
                updatedAt: new Date(chat.last_message_time).getTime(),
                createdAt: Date.now(),
                unreadCount: chat.unread_count || 0,
                type: 'private' as const
              }

              console.log('✅ 转换后的会话数据:', {
                id: sessionData.id,
                name: sessionData.name,
                lastMessage: sessionData.lastMessage,
                formattedTime: new Date(sessionData.lastMessageTime).toLocaleString()
              })

              return sessionData
            })

          // 过滤已删除的会话
          const filteredSessions = validSessions.filter((session: any) => {
            if (deletedSessions.value.has(session.id)) {
              console.log('🗑️ 过滤已删除的会话:', session.id, session.name)
              return false
            }
            return true
          })

          console.log('🔍 过滤结果:', {
            原始数量: validSessions.length,
            过滤后数量: filteredSessions.length,
            删除列表: Array.from(deletedSessions.value)
          })

          // 如果API返回空数组且本地已有会话，认为是临时空数据，跳过覆盖，保留现有会话
          if (filteredSessions.length === 0 && sessions.value.length > 0) {
            console.warn('⚠️ API返回空会话列表，保留本地现有会话，避免误清空')
          } else {
            // 清空现有数据并设置新数据
            sessions.value.splice(0, sessions.value.length, ...filteredSessions)

            // 记录加载时间
            lastLoadTime.value = Date.now()

            // 保存到缓存
            saveToCache()

            console.log('✅ 聊天数据加载并缓存完成，会话数量:', sessions.value.length)
          }
        }
      } else {
        console.warn('⚠️ API请求失败，状态码:', response.status)
        if (!forceRefresh) {
          console.log('📦 回退到缓存数据')
          loadFromCache()
        } else {
          console.log('🚫 强制刷新模式，清空旧数据和缓存')
          sessions.value.splice(0, sessions.value.length) // 清空旧数据
          localStorage.removeItem(SESSIONS_CACHE_KEY) // 清空缓存
          lastLoadTime.value = Date.now()
        }
      }
    } catch (error) {
      console.error('❌ 从API加载聊天数据失败:', error)
      if (!forceRefresh) {
        console.log('📦 错误回退到缓存数据')
        loadFromCache()
      } else {
        console.log('🚫 强制刷新模式，清空旧数据和缓存，等待API恢复')
        sessions.value.splice(0, sessions.value.length) // 清空旧数据
        localStorage.removeItem(SESSIONS_CACHE_KEY) // 清空缓存
        lastLoadTime.value = Date.now()
      }
    }
  }

  // 强制重新加载聊天数据（统一使用API）
  const reloadChatData = async () => {
    try {
      console.log('🔄 重新加载聊天数据（从API）...')
      await loadChatsFromAPI()
    } catch (error) {
      console.error('❌ 重新加载聊天数据失败:', error)
      // 失败时从缓存加载
      loadFromCache()
    }
  }

  // 初始化时加载缓存
  loadFromCache()

  return {
    sessions,
    messages,
    currentSessionId,
    currentSession,
    currentMessages,
    totalUnreadCount,
    setCurrentSession,
    addMessage,
    removeMessage,
    cleanupInvalidMessages,
    cleanupAllInvalidMessages,
    addSession,
    createSession,
    markAsRead,
    removeDuplicateSessions,
    cleanAdminDuplicates,
    smartCleanSessions,
    loadFromCache,
    saveToCache,
    reloadChatData,
    // 新增的聊天项管理功能
    hasSession,
    findSessionByParticipants,
    createOrUpdateChatItem,
    receiveMessage,
    generateSessionId,
    // 加载时间
    lastLoadTime,
    // 删除列表管理
    deletedSessions,
    clearedSessions,
    addToDeletedList,
    loadDeletedSessions,
    loadClearedSessions,
    // 聊天项管理
    deleteChatItem,
    clearChatHistory,
    // 消息加载
    loadMessagesForSession
  }
})

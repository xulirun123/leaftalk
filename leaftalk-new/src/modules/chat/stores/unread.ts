import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UnreadMessage {
  id: string
  sessionId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  timestamp: number
}

export interface UnreadSession {
  sessionId: string
  count: number
  lastMessage?: UnreadMessage
  lastUpdateTime: number
  isMuted?: boolean // 是否免打扰
}

export const useUnreadStore = defineStore('unread', () => {
  const unreadSessions = ref<Map<string, UnreadSession>>(new Map())
  const unreadMessages = ref<Map<string, UnreadMessage[]>>(new Map())

  // 获取总未读数
  const totalUnreadCount = computed(() => {
    let total = 0
    unreadSessions.value.forEach(session => {
      total += session.count
    })
    return total
  })

  // 获取指定会话的未读数
  function getUnreadCount(sessionId: string): number {
    return unreadSessions.value.get(sessionId)?.count || 0
  }

  // 添加未读消息
  function addUnreadMessage(sessionId: string, message: UnreadMessage) {
    // 更新未读消息列表
    const messages = unreadMessages.value.get(sessionId) || []
    messages.push(message)
    unreadMessages.value.set(sessionId, messages)

    // 更新未读会话信息
    const session = unreadSessions.value.get(sessionId) || {
      sessionId,
      count: 0,
      lastUpdateTime: Date.now()
    }
    
    session.count++
    session.lastMessage = message
    session.lastUpdateTime = message.timestamp
    
    unreadSessions.value.set(sessionId, session)
  }

  // 标记会话为已读
  function markSessionAsRead(sessionId: string) {
    unreadSessions.value.delete(sessionId)
    unreadMessages.value.delete(sessionId)
  }

  // 标记所有会话为已读
  function markAllAsRead() {
    unreadSessions.value.clear()
    unreadMessages.value.clear()
  }

  // 获取指定会话的未读消息
  function getUnreadMessages(sessionId: string): UnreadMessage[] {
    return unreadMessages.value.get(sessionId) || []
  }

  // 获取所有未读会话
  const unreadSessionsList = computed(() => {
    return Array.from(unreadSessions.value.values())
      .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime)
  })

  // 检查是否有未读消息
  function hasUnreadMessages(sessionId?: string): boolean {
    if (sessionId) {
      return getUnreadCount(sessionId) > 0
    }
    return totalUnreadCount.value > 0
  }

  // 减少未读数（用于部分已读的情况）
  function decreaseUnreadCount(sessionId: string, count: number = 1) {
    const session = unreadSessions.value.get(sessionId)
    if (session) {
      session.count = Math.max(0, session.count - count)
      if (session.count === 0) {
        unreadSessions.value.delete(sessionId)
        unreadMessages.value.delete(sessionId)
      }
    }
  }

  // 清除指定时间之前的未读消息
  function clearOldUnreadMessages(beforeTimestamp: number) {
    unreadSessions.value.forEach((session, sessionId) => {
      if (session.lastUpdateTime < beforeTimestamp) {
        unreadSessions.value.delete(sessionId)
        unreadMessages.value.delete(sessionId)
      }
    })
  }

  // 标记为已读 (兼容性方法)
  function markAsRead(sessionId: string) {
    markSessionAsRead(sessionId)
  }

  // 设置免打扰状态
  function setMuteStatus(sessionId: string, isMuted: boolean) {
    const session = unreadSessions.value.get(sessionId)
    if (session) {
      session.isMuted = isMuted
    } else {
      // 如果会话不存在，创建一个新的
      unreadSessions.value.set(sessionId, {
        sessionId,
        count: 0,
        lastUpdateTime: Date.now(),
        isMuted
      })
    }
  }

  // 获取免打扰状态
  function getMuteStatus(sessionId: string): boolean {
    return unreadSessions.value.get(sessionId)?.isMuted || false
  }

  // 检查是否有红点显示（免打扰的聊天只显示红点）
  function hasRedDot(sessionId: string): boolean {
    const session = unreadSessions.value.get(sessionId)
    return session ? (session.isMuted ?? false) && session.count > 0 : false
  }

  // 设置未读数 (兼容性方法)
  function setUnreadCount(sessionId: string, count: number) {
    const session = unreadSessions.value.get(sessionId)
    if (session) {
      session.count = Math.max(0, count)
      session.lastUpdateTime = Date.now()
      if (session.count === 0) {
        unreadSessions.value.delete(sessionId)
        unreadMessages.value.delete(sessionId)
      }
    } else if (count > 0) {
      // 如果会话不存在且要设置大于0的未读数，创建新会话
      unreadSessions.value.set(sessionId, {
        sessionId,
        count: Math.max(0, count),
        lastUpdateTime: Date.now()
      })
    }
  }

  return {
    unreadSessions,
    unreadMessages,
    totalUnreadCount,
    unreadSessionsList,
    getUnreadCount,
    setUnreadCount,
    addUnreadMessage,
    markSessionAsRead,
    markAsRead,
    markAllAsRead,
    getUnreadMessages,
    hasUnreadMessages,
    decreaseUnreadCount,
    clearOldUnreadMessages,
    setMuteStatus,
    getMuteStatus,
    hasRedDot
  }
})

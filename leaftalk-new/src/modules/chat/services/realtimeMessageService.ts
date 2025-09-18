/**
 * 实时消息接收服务
 * 负责处理WebSocket连接、消息接收、状态同步等
 */

import { io, Socket } from 'socket.io-client'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'
import { useUnreadStore } from '../stores/unread'

export interface RealtimeMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
}

export interface UserStatus {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeen: number
}

class RealtimeMessageService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeConnection()
  }

  /**
   * 初始化WebSocket连接
   */
  private async initializeConnection() {
    try {
      const authStore = useAuthStore()
      const token = localStorage.getItem('yeyu_auth_token')
      const userId = authStore.user?.id

      if (!token || !userId) {
        console.warn('⚠️ 用户未登录，跳过实时消息服务初始化')
        return
      }

      console.log('🔌 初始化实时消息服务...')

      this.socket = io('http://localhost:8893', {
        auth: {
          token,
          userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      })

      this.setupEventListeners()

    } catch (error) {
      console.error('❌ 实时消息服务初始化失败:', error)
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('✅ 实时消息服务连接成功')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.joinUserRoom()
    })

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.log('❌ 实时消息服务连接断开:', reason)
      this.isConnected = false
      this.stopHeartbeat()
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('❌ 实时消息服务连接错误:', error)
      this.handleReconnect()
    })

    // 接收新消息
    this.socket.on('new_message', (message: RealtimeMessage) => {
      console.log('📨 收到新消息:', message)
      this.handleNewMessage(message)
    })

    // 消息状态更新
    this.socket.on('message_status', (data: { messageId: string, status: string }) => {
      console.log('📋 消息状态更新:', data)
      this.handleMessageStatusUpdate(data)
    })

    // 用户状态更新
    this.socket.on('user_status', (status: UserStatus) => {
      console.log('👤 用户状态更新:', status)
      this.handleUserStatusUpdate(status)
    })

    // 未读消息计数更新
    this.socket.on('unread_update', (data: { sessionId: string, count: number }) => {
      console.log('🔢 未读消息更新:', data)
      this.handleUnreadUpdate(data)
    })
  }

  /**
   * 处理新消息接收
   */
  private handleNewMessage(message: RealtimeMessage) {
    const chatStore = useChatStore()
    const unreadStore = useUnreadStore()
    const authStore = useAuthStore()
    const currentUserId = authStore.user?.id

    // 确保不是自己发送的消息
    if (message.senderId === currentUserId) {
      return
    }

    // 添加消息到聊天记录
    chatStore.receiveMessage(message)

    // 更新未读计数
    const sessionId = chatStore.generateSessionId(message.senderId, message.receiverId)
    unreadStore.incrementUnread(sessionId)

    // 发送消息已送达确认
    this.sendMessageDelivered(message.id)

    // 显示通知（如果页面不在前台）
    if (document.hidden) {
      this.showNotification(message)
    }
  }

  /**
   * 处理消息状态更新
   */
  private handleMessageStatusUpdate(data: { messageId: string, status: string }) {
    const chatStore = useChatStore()
    chatStore.updateMessageStatus(data.messageId, data.status)
  }

  /**
   * 处理用户状态更新
   */
  private handleUserStatusUpdate(status: UserStatus) {
    // 可以在这里更新用户在线状态显示
    console.log(`用户 ${status.userId} 状态: ${status.status}`)
  }

  /**
   * 处理未读消息更新
   */
  private handleUnreadUpdate(data: { sessionId: string, count: number }) {
    const unreadStore = useUnreadStore()
    unreadStore.setUnreadCount(data.sessionId, data.count)
  }

  /**
   * 发送消息
   */
  public sendMessage(message: Omit<RealtimeMessage, 'id' | 'timestamp' | 'status'>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error('WebSocket未连接'))
        return
      }

      const fullMessage: RealtimeMessage = {
        ...message,
        id: this.generateMessageId(),
        timestamp: Date.now(),
        status: 'sent'
      }

      this.socket.emit('send_message', fullMessage, (response: any) => {
        if (response.success) {
          console.log('✅ 消息发送成功:', fullMessage.id)
          resolve(true)
        } else {
          console.error('❌ 消息发送失败:', response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 发送消息已送达确认
   */
  private sendMessageDelivered(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message_delivered', { messageId })
    }
  }

  /**
   * 标记消息为已读
   */
  public markMessageAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message_read', { messageId })
    }
  }

  /**
   * 加入用户房间
   */
  private joinUserRoom() {
    const authStore = useAuthStore()
    const userId = authStore.user?.id

    if (userId && this.socket && this.isConnected) {
      this.socket.emit('join_user_room', { userId })
      console.log('🏠 已加入用户房间:', userId)
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() })
      }
    }, 30000) // 30秒心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 处理重连
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.initializeConnection()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ 达到最大重连次数，停止重连')
    }
  }

  /**
   * 显示通知
   */
  private showNotification(message: RealtimeMessage) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('新消息', {
        body: message.content,
        icon: '/favicon.ico'
      })
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取连接状态
   */
  public getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * 断开连接
   */
  public disconnect() {
    this.stopHeartbeat()
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    console.log('🔌 实时消息服务已断开')
  }

  /**
   * 重新连接
   */
  public reconnect() {
    this.disconnect()
    this.reconnectAttempts = 0
    this.initializeConnection()
  }
}

// 创建全局实例
export const realtimeMessageService = new RealtimeMessageService()

export default RealtimeMessageService

/**
 * WebRTC 信令通信服务
 * 处理与后端信令服务器的通信
 */

import { io, Socket } from 'socket.io-client'

export interface SignalingEvent {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end' | 'call-status' | 'incoming-call' | 'call-ended' | 'error'
  data: any
}

export type SignalingEventHandler = (data: any) => void

class SignalingService {
  private socket: Socket | null = null
  private eventHandlers: Map<string, SignalingEventHandler[]> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  /**
   * 初始化信令服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('📡 初始化信令服务...')
      
      if (!this.socket) {
        this.socket = io('ws://localhost:8893', {
          transports: ['websocket'],
          autoConnect: false
        })
        
        this.setupSocketEventListeners()
      }

      if (!this.socket.connected) {
        this.socket.connect()
      }

      // 等待连接建立
      await this.waitForConnection()
      console.log('✅ 信令服务初始化完成')
    } catch (error) {
      console.error('❌ 信令服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 等待连接建立
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('信令服务连接超时'))
      }, 10000)

      const onConnect = () => {
        clearTimeout(timeout)
        resolve()
      }

      const onError = (error: any) => {
        clearTimeout(timeout)
        reject(error)
      }

      this.socket?.once('connect', onConnect)
      this.socket?.once('connect_error', onError)
    })
  }

  /**
   * 设置 Socket 事件监听
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('📡 信令服务已连接')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('📡 信令服务已断开:', reason)
      this.isConnected = false
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.handleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ 信令服务连接错误:', error)
      this.handleReconnect()
    })

    // WebRTC 信令事件
    this.socket.on('webrtc:offer', (data) => {
      console.log('📞 收到 Offer')
      this.emit('offer', data)
    })

    this.socket.on('webrtc:answer', (data) => {
      console.log('📞 收到 Answer')
      this.emit('answer', data)
    })

    this.socket.on('webrtc:ice-candidate', (data) => {
      console.log('🧊 收到 ICE 候选者')
      this.emit('ice-candidate', data)
    })

    this.socket.on('webrtc:incoming-call', (data) => {
      console.log('📞 收到来电通知:', data)
      this.emit('incoming-call', data)
    })

    this.socket.on('webrtc:call-ended', (data) => {
      console.log('📞 收到通话结束通知')
      this.emit('call-ended', data)
    })

    this.socket.on('webrtc:call-status', (data) => {
      console.log('📊 收到通话状态更新')
      this.emit('call-status', data)
    })

    this.socket.on('webrtc:error', (data) => {
      console.error('❌ 收到信令错误:', data)
      this.emit('error', data)
    })
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 信令服务重连次数超限')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    console.log(`🔄 ${delay}ms 后尝试重连信令服务 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect()
      }
    }, delay)
  }

  /**
   * 加入用户房间
   */
  joinUserRoom(userId: string): void {
    if (this.socket && this.isConnected) {
      console.log(`📞 尝试加入用户房间: ${userId}`)
      this.socket.emit('join_user_room', { userId })
      console.log(`✅ 已发送加入用户房间请求: ${userId}`)
    } else {
      console.error('❌ Socket未连接，无法加入用户房间', {
        hasSocket: !!this.socket,
        isConnected: this.isConnected
      })
    }
  }

  /**
   * 发送 WebRTC Offer
   */
  sendOffer(callId: string, targetUserId: string, offer: RTCSessionDescriptionInit, type: 'voice' | 'video'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:offer', {
        callId,
        targetUserId,
        offer,
        type
      })
      console.log('📞 发送 Offer')
    } else {
      console.error('❌ 信令服务未连接，无法发送 Offer')
    }
  }

  /**
   * 发送 WebRTC Answer
   */
  sendAnswer(callId: string, targetUserId: string, answer: RTCSessionDescriptionInit): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:answer', {
        callId,
        targetUserId,
        answer
      })
      console.log('📞 发送 Answer')
    } else {
      console.error('❌ 信令服务未连接，无法发送 Answer')
    }
  }

  /**
   * 发送 ICE 候选者
   */
  sendIceCandidate(callId: string, targetUserId: string, candidate: RTCIceCandidateInit): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:ice-candidate', {
        callId,
        targetUserId,
        candidate
      })
    } else {
      console.error('❌ 信令服务未连接，无法发送 ICE 候选者')
    }
  }

  /**
   * 开始通话
   */
  startCall(callId: string, targetUserId: string, type: 'voice' | 'video'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:call-start', {
        callId,
        targetUserId,
        type
      })
      console.log('📞 发送通话开始信号')
    } else {
      console.error('❌ 信令服务未连接，无法开始通话')
    }
  }

  /**
   * 结束通话
   */
  endCall(callId: string, reason = 'hangup'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:call-end', {
        callId,
        reason
      })
      console.log('📞 发送通话结束信号')
    } else {
      console.error('❌ 信令服务未连接，无法结束通话')
    }
  }

  /**
   * 发送通话状态
   */
  sendCallStatus(callId: string, status: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:call-status', {
        callId,
        status,
        data
      })
    } else {
      console.error('❌ 信令服务未连接，无法发送通话状态')
    }
  }

  /**
   * 事件监听器管理
   */
  on(event: string, handler: SignalingEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: SignalingEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`❌ 信令事件处理失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.eventHandlers.clear()
    console.log('📡 信令服务已断开')
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// 导出单例
export const signalingService = new SignalingService()
export default signalingService

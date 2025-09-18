/**
 * 连接恢复服务
 * 处理网络中断、连接失败的自动重连和恢复机制
 */

import { peerConnectionService } from './peerConnectionService'
import { signalingService } from './signalingService'
import { mediaService } from './mediaService'

export interface RecoveryState {
  isRecovering: boolean
  attemptCount: number
  maxAttempts: number
  lastAttemptTime: number
  recoveryReason: string
}

export interface RecoveryConfig {
  maxAttempts: number
  baseDelay: number // 基础延迟 (ms)
  maxDelay: number // 最大延迟 (ms)
  backoffMultiplier: number // 退避倍数
  enableAutoReconnect: boolean
}

class ConnectionRecoveryService {
  private state: RecoveryState = {
    isRecovering: false,
    attemptCount: 0,
    maxAttempts: 5,
    lastAttemptTime: 0,
    recoveryReason: ''
  }

  private config: RecoveryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableAutoReconnect: true
  }

  private eventListeners: Map<string, Function[]> = new Map()
  private recoveryTimer: number | null = null
  private isInitialized = false
  private callConfig: any = null

  /**
   * 初始化连接恢复服务
   */
  initialize(callConfig: any): void {
    if (this.isInitialized) return
    
    console.log('🔄 初始化连接恢复服务')
    
    this.callConfig = callConfig
    this.setupEventListeners()
    this.isInitialized = true
    
    console.log('✅ 连接恢复服务初始化完成')
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听 PeerConnection 状态变化
    peerConnectionService.on('connectionStateChange', (data) => {
      this.handleConnectionStateChange(data.state)
    })

    // 监听信令服务连接状态
    signalingService.on('disconnect', () => {
      this.handleSignalingDisconnect()
    })

    // 监听网络状态变化
    window.addEventListener('online', this.handleNetworkOnline.bind(this))
    window.addEventListener('offline', this.handleNetworkOffline.bind(this))
  }

  /**
   * 处理连接状态变化
   */
  private handleConnectionStateChange(state: RTCPeerConnectionState): void {
    console.log('🔄 PeerConnection 状态变化:', state)
    
    switch (state) {
      case 'disconnected':
        this.startRecovery('peer_disconnected')
        break
        
      case 'failed':
        this.startRecovery('peer_failed')
        break
        
      case 'connected':
        this.stopRecovery('connection_restored')
        break
        
      case 'closed':
        this.stopRecovery('connection_closed')
        break
    }
  }

  /**
   * 处理信令服务断开
   */
  private handleSignalingDisconnect(): void {
    console.log('🔄 信令服务断开连接')
    this.startRecovery('signaling_disconnected')
  }

  /**
   * 处理网络上线
   */
  private handleNetworkOnline(): void {
    console.log('🔄 网络已恢复')
    if (this.state.isRecovering) {
      this.attemptRecovery()
    }
  }

  /**
   * 处理网络离线
   */
  private handleNetworkOffline(): void {
    console.log('🔄 网络已断开')
    this.startRecovery('network_offline')
  }

  /**
   * 开始恢复流程
   */
  private startRecovery(reason: string): void {
    if (this.state.isRecovering) {
      console.log('🔄 恢复流程已在进行中')
      return
    }

    if (!this.config.enableAutoReconnect) {
      console.log('🔄 自动重连已禁用')
      return
    }

    console.log(`🔄 开始连接恢复: ${reason}`)
    
    this.state = {
      isRecovering: true,
      attemptCount: 0,
      maxAttempts: this.config.maxAttempts,
      lastAttemptTime: Date.now(),
      recoveryReason: reason
    }

    // 触发恢复开始事件
    this.emit('recoveryStarted', {
      reason,
      state: this.state
    })

    // 立即尝试第一次恢复
    this.attemptRecovery()
  }

  /**
   * 停止恢复流程
   */
  private stopRecovery(reason: string): void {
    if (!this.state.isRecovering) return
    
    console.log(`🔄 停止连接恢复: ${reason}`)
    
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = null
    }

    const wasRecovering = this.state.isRecovering
    this.state.isRecovering = false

    if (wasRecovering) {
      // 触发恢复结束事件
      this.emit('recoveryEnded', {
        reason,
        success: reason === 'connection_restored',
        attempts: this.state.attemptCount
      })
    }
  }

  /**
   * 尝试恢复连接
   */
  private async attemptRecovery(): Promise<void> {
    if (!this.state.isRecovering) return

    this.state.attemptCount++
    this.state.lastAttemptTime = Date.now()

    console.log(`🔄 尝试恢复连接 (${this.state.attemptCount}/${this.state.maxAttempts})`)

    // 触发恢复尝试事件
    this.emit('recoveryAttempt', {
      attempt: this.state.attemptCount,
      maxAttempts: this.state.maxAttempts,
      reason: this.state.recoveryReason
    })

    try {
      // 检查网络连接
      if (!navigator.onLine) {
        console.log('🔄 网络仍未连接，等待网络恢复')
        this.scheduleNextAttempt()
        return
      }

      // 尝试重新建立信令连接
      await this.recoverSignalingConnection()

      // 尝试重新建立媒体流
      await this.recoverMediaStream()

      // 尝试重新建立 PeerConnection
      await this.recoverPeerConnection()

      console.log('✅ 连接恢复成功')
      this.stopRecovery('connection_restored')

    } catch (error) {
      console.error(`❌ 恢复尝试 ${this.state.attemptCount} 失败:`, error)

      if (this.state.attemptCount >= this.state.maxAttempts) {
        console.error('❌ 达到最大重试次数，停止恢复')
        this.stopRecovery('max_attempts_reached')
        
        // 触发恢复失败事件
        this.emit('recoveryFailed', {
          reason: this.state.recoveryReason,
          attempts: this.state.attemptCount,
          error
        })
      } else {
        this.scheduleNextAttempt()
      }
    }
  }

  /**
   * 安排下次尝试
   */
  private scheduleNextAttempt(): void {
    const delay = this.calculateDelay()
    
    console.log(`🔄 ${delay}ms 后进行下次恢复尝试`)
    
    this.recoveryTimer = window.setTimeout(() => {
      this.attemptRecovery()
    }, delay)
  }

  /**
   * 计算延迟时间（指数退避）
   */
  private calculateDelay(): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, this.state.attemptCount - 1)
    return Math.min(delay, this.config.maxDelay)
  }

  /**
   * 恢复信令连接
   */
  private async recoverSignalingConnection(): Promise<void> {
    console.log('🔄 恢复信令连接')
    
    const connectionState = signalingService.getConnectionState()
    if (!connectionState.connected) {
      await signalingService.initialize()
    }
  }

  /**
   * 恢复媒体流
   */
  private async recoverMediaStream(): Promise<void> {
    console.log('🔄 恢复媒体流')
    
    const currentStream = mediaService.getCurrentStream()
    if (!currentStream || currentStream.getTracks().length === 0) {
      // 重新获取媒体流
      const constraints = mediaService.getConstraintsByQuality('medium', this.callConfig?.type === 'video')
      await mediaService.getUserMedia(constraints)
    }
  }

  /**
   * 恢复 PeerConnection
   */
  private async recoverPeerConnection(): Promise<void> {
    console.log('🔄 恢复 PeerConnection')
    
    const stats = peerConnectionService.getConnectionStats()
    if (!stats || stats.connectionState === 'failed' || stats.connectionState === 'disconnected') {
      // 重新初始化 PeerConnection
      await peerConnectionService.initializePeerConnection(this.callConfig)
      
      // 重新添加媒体流
      const stream = mediaService.getCurrentStream()
      if (stream) {
        await peerConnectionService.addLocalStream(stream)
      }
      
      // 重新创建 Offer/Answer
      if (this.callConfig?.isInitiator) {
        const offer = await peerConnectionService.createOffer()
        signalingService.sendOffer(
          this.callConfig.callId,
          this.callConfig.targetUserId,
          offer,
          this.callConfig.type
        )
      }
    }
  }

  /**
   * 手动触发恢复
   */
  manualRecover(): void {
    console.log('🔄 手动触发连接恢复')
    this.startRecovery('manual_trigger')
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🔄 连接恢复配置已更新:', this.config)
  }

  /**
   * 获取当前状态
   */
  getState(): RecoveryState {
    return { ...this.state }
  }

  /**
   * 获取配置
   */
  getConfig(): RecoveryConfig {
    return { ...this.config }
  }

  /**
   * 事件监听器管理
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ 连接恢复事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (!this.isInitialized) return
    
    console.log('🧹 清理连接恢复服务')
    
    this.stopRecovery('service_cleanup')
    
    // 移除事件监听
    window.removeEventListener('online', this.handleNetworkOnline.bind(this))
    window.removeEventListener('offline', this.handleNetworkOffline.bind(this))
    
    this.eventListeners.clear()
    this.callConfig = null
    this.isInitialized = false
    
    console.log('✅ 连接恢复服务已清理')
  }
}

// 导出单例
export const connectionRecoveryService = new ConnectionRecoveryService()
export default connectionRecoveryService

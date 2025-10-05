/**
 * 仿微信通话系统 - 通话状态管理器
 * 负责通话状态的跟踪和管理
 */

import type { CallStatus, CallConfig } from '../types'

export class CallStateManager {
  private callStartTime: number = 0
  private callEndTime: number = 0
  private callHistory: CallHistoryItem[] = []
  private currentCallId: string | null = null

  /**
   * 初始化状态管理器
   */
  public initialize(): void {
    console.log('📊 初始化通话状态管理器')
    this.loadCallHistory()
  }

  /**
   * 开始通话计时
   */
  public startCall(callId: string): void {
    this.currentCallId = callId
    this.callStartTime = Date.now()
    this.callEndTime = 0
    console.log(`⏱️ 开始通话计时: ${callId}`)
  }

  /**
   * 结束通话计时
   */
  public endCall(): void {
    this.callEndTime = Date.now()
    console.log(`⏱️ 结束通话计时，通话时长: ${this.getCallDuration()}秒`)
  }

  /**
   * 获取通话时长（秒）
   */
  public getCallDuration(): number {
    if (this.callStartTime === 0) return 0
    
    const endTime = this.callEndTime || Date.now()
    return Math.floor((endTime - this.callStartTime) / 1000)
  }

  /**
   * 获取格式化的通话时长
   */
  public getFormattedDuration(): string {
    const duration = this.getCallDuration()
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  /**
   * 记录通话历史
   */
  public recordCall(config: CallConfig, status: CallStatus, duration: number): void {
    const historyItem: CallHistoryItem = {
      callId: config.callId,
      type: config.type,
      isInitiator: config.isInitiator,
      targetUserId: config.targetUserId,
      targetUserInfo: config.targetUserInfo,
      status,
      duration,
      timestamp: Date.now()
    }

    this.callHistory.unshift(historyItem)
    
    // 只保留最近100条记录
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(0, 100)
    }

    this.saveCallHistory()
    console.log('📝 通话记录已保存')
  }

  /**
   * 获取通话历史
   */
  public getCallHistory(): CallHistoryItem[] {
    return [...this.callHistory]
  }

  /**
   * 获取与特定用户的通话历史
   */
  public getCallHistoryWithUser(userId: string): CallHistoryItem[] {
    return this.callHistory.filter(item => item.targetUserId === userId)
  }

  /**
   * 清除通话历史
   */
  public clearCallHistory(): void {
    this.callHistory = []
    this.saveCallHistory()
    console.log('🗑️ 通话历史已清除')
  }

  /**
   * 保存通话历史到本地存储
   */
  private saveCallHistory(): void {
    try {
      localStorage.setItem('yeyu_call_history', JSON.stringify(this.callHistory))
    } catch (error) {
      console.error('❌ 保存通话历史失败:', error)
    }
  }

  /**
   * 从本地存储加载通话历史
   */
  private loadCallHistory(): void {
    try {
      const saved = localStorage.getItem('yeyu_call_history')
      if (saved) {
        this.callHistory = JSON.parse(saved)
        console.log(`📚 加载了${this.callHistory.length}条通话历史`)
      }
    } catch (error) {
      console.error('❌ 加载通话历史失败:', error)
      this.callHistory = []
    }
  }

  /**
   * 获取通话统计
   */
  public getCallStats(): CallStats {
    const totalCalls = this.callHistory.length
    const successfulCalls = this.callHistory.filter(item => 
      item.status === 'connected' && item.duration > 0
    ).length
    
    const totalDuration = this.callHistory.reduce((sum, item) => sum + item.duration, 0)
    const averageDuration = successfulCalls > 0 ? Math.floor(totalDuration / successfulCalls) : 0
    
    const videoCalls = this.callHistory.filter(item => item.type === 'video').length
    const voiceCalls = this.callHistory.filter(item => item.type === 'voice').length
    
    const initiatedCalls = this.callHistory.filter(item => item.isInitiator).length
    const receivedCalls = this.callHistory.filter(item => !item.isInitiator).length

    return {
      totalCalls,
      successfulCalls,
      totalDuration,
      averageDuration,
      videoCalls,
      voiceCalls,
      initiatedCalls,
      receivedCalls,
      successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.currentCallId = null
    this.callStartTime = 0
    this.callEndTime = 0
    console.log('🧹 通话状态管理器已清理')
  }
}

// 通话历史项接口
interface CallHistoryItem {
  callId: string
  type: 'voice' | 'video'
  isInitiator: boolean
  targetUserId: string
  targetUserInfo: {
    id: string
    name: string
    avatar: string
  }
  status: CallStatus
  duration: number
  timestamp: number
}

// 通话统计接口
interface CallStats {
  totalCalls: number
  successfulCalls: number
  totalDuration: number
  averageDuration: number
  videoCalls: number
  voiceCalls: number
  initiatedCalls: number
  receivedCalls: number
  successRate: number
}

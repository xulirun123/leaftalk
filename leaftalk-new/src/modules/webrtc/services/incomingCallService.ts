/**
 * 来电监听服务
 * 全局监听来电并处理来电通知
 */

import { ref } from 'vue'
import router from '../../../router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import { signalingService } from './signalingService'

export interface IncomingCallData {
  callId: string
  fromUserId: string
  type: 'voice' | 'video'
  caller: {
    id: string
    name?: string
    avatar?: string
  }
}

class IncomingCallService {
  private isInitialized = false
  private currentIncomingCall = ref<IncomingCallData | null>(null)

  /**
   * 初始化来电监听服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      console.log('📞 初始化来电监听服务...')

      // 初始化信令服务
      await signalingService.initialize()

      // 设置来电监听
      this.setupIncomingCallListeners()

      this.isInitialized = true
      console.log('✅ 来电监听服务初始化完成')
    } catch (error) {
      console.error('❌ 来电监听服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置来电监听
   */
  private setupIncomingCallListeners(): void {
    // 监听来电
    signalingService.on('incoming-call', (data: IncomingCallData) => {
      console.log('📞 收到来电:', data)
      this.handleIncomingCall(data)
    })

    // 监听通话结束
    signalingService.on('call-ended', (data: { callId: string; reason: string }) => {
      console.log('📞 通话结束:', data)
      if (this.currentIncomingCall.value && this.currentIncomingCall.value.callId === data.callId) {
        this.currentIncomingCall.value = null
      }
    })
  }

  /**
   * 处理来电
   */
  private async handleIncomingCall(callData: IncomingCallData): Promise<void> {
    try {
      const appStore = useAppStore()

      // 记录当前来电
      this.currentIncomingCall.value = callData

      // 获取来电者信息
      const callerInfo = await this.getCallerInfo(callData.fromUserId)

      // 显示来电通知
      this.showIncomingCallNotification(callData, callerInfo)

      // 跳转到来电页面
      router.push({
        name: 'IncomingCall',
        params: { callerId: callData.fromUserId },
        query: {
          callId: callData.callId,
          type: callData.type,
          name: callerInfo.name || `用户${callData.fromUserId}`,
          avatar: callerInfo.avatar || ''
        }
      })

    } catch (error) {
      console.error('❌ 处理来电失败:', error)
    }
  }

  /**
   * 获取来电者信息（备注优先，头像统一走真实头像API）
   */
  private async getCallerInfo(userId: string): Promise<{ name?: string; avatar?: string }> {
    try {
      const authStore = useAuthStore()

      // 备注优先
      try {
        const saved = JSON.parse(localStorage.getItem(`friend_remark_${userId}`) || 'null')
        const remark = saved?.name && String(saved.name).trim()
        if (remark) {
          return {
            name: remark,
            avatar: `http://localhost:8893/api/users/${userId}/avatar`
          }
        }
      } catch {}

      if (!authStore.token) {
        return { avatar: `http://localhost:8893/api/users/${userId}/avatar` }
      }

      const response = await fetch(`http://localhost:8893/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          return {
            name: result.data.nickname || result.data.real_name || result.data.username || `用户${userId}`,
            avatar: `http://localhost:8893/api/users/${userId}/avatar`
          }
        }
      }

      return { avatar: `http://localhost:8893/api/users/${userId}/avatar` }
    } catch (error) {
      console.error('❌ 获取来电者信息失败:', error)
      return { avatar: `http://localhost:8893/api/users/${userId}/avatar` }
    }
  }

  /**
   * 显示来电通知
   */
  private showIncomingCallNotification(callData: IncomingCallData, callerInfo: { name?: string; avatar?: string }): void {
    const appStore = useAppStore()

    // 显示Toast通知
    const callerName = callerInfo.name || `用户${callData.fromUserId}`
    const callTypeText = callData.type === 'video' ? '视频通话' : '语音通话'
    
    appStore.showToast(`${callerName} 邀请您进行${callTypeText}`, 'info')

    // 这里可以添加更多通知逻辑，比如：
    // - 播放铃声
    // - 显示系统通知
    // - 震动提醒等
  }

  /**
   * 获取当前来电信息
   */
  getCurrentIncomingCall(): IncomingCallData | null {
    return this.currentIncomingCall.value
  }

  /**
   * 清除当前来电
   */
  clearCurrentIncomingCall(): void {
    this.currentIncomingCall.value = null
  }

  /**
   * 加入用户房间（用于接收来电）
   */
  async joinUserRoom(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      signalingService.joinUserRoom(userId)
      console.log(`📞 已加入用户房间: ${userId}`)
    } catch (error) {
      console.error('❌ 加入用户房间失败:', error)
    }
  }

  /**
   * 离开用户房间
   */
  leaveUserRoom(userId: string): void {
    signalingService.leaveUserRoom(userId)
    console.log(`📞 已离开用户房间: ${userId}`)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.currentIncomingCall.value = null
    this.isInitialized = false
  }
}

// 导出单例
export const incomingCallService = new IncomingCallService()

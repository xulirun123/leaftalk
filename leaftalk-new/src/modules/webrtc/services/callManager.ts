/**
 * WebRTC 通话管理服务
 * 统一处理通话的发起、接听、结束等逻辑
 */

import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { signalingService } from './signalingService'

export interface CallInfo {
  callId: string
  type: 'voice' | 'video'
  status: 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'
  participants: {
    caller: string
    callee: string
  }
  startTime?: number
  endTime?: number
}

class CallManager {
  private currentCall: CallInfo | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  /**
   * 发起通话
   */
  async initiateCall(targetUserId: string, type: 'voice' | 'video'): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      const authStore = useAuthStore()
      const appStore = useAppStore()

      if (!authStore.token) {
        return { success: false, error: '用户未登录' }
      }

      console.log(`📞 发起${type === 'video' ? '视频' : '语音'}通话:`, targetUserId)

      // 调用后端API发起通话
      const response = await fetch('http://localhost:8893/api/webrtc-calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          toUserId: targetUserId,
          type
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const callId = result.data.callId

          // 记录当前通话
          this.currentCall = {
            callId,
            type,
            status: 'calling',
            participants: {
              caller: String(authStore.user?.id),
              callee: targetUserId
            },
            startTime: Date.now()
          }

          console.log('✅ 通话发起成功:', callId)
          this.emit('call-initiated', this.currentCall)

          return { success: true, callId }
        } else {
          return { success: false, error: result.message || '发起通话失败' }
        }
      } else {
        return { success: false, error: '网络错误' }
      }
    } catch (error) {
      console.error('❌ 发起通话失败:', error)
      return { success: false, error: '发起通话失败' }
    }
  }

  /**
   * 接听通话
   */
  async answerCall(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authStore = useAuthStore()

      if (!authStore.token) {
        return { success: false, error: '用户未登录' }
      }

      console.log('📞 接听通话:', callId)

      const response = await fetch('http://localhost:8893/api/webrtc-calls/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ callId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 更新当前通话状态
          if (this.currentCall && this.currentCall.callId === callId) {
            this.currentCall.status = 'connecting'
          }

          console.log('✅ 通话接听成功')
          this.emit('call-answered', { callId })

          return { success: true }
        } else {
          return { success: false, error: result.message || '接听通话失败' }
        }
      } else {
        return { success: false, error: '网络错误' }
      }
    } catch (error) {
      console.error('❌ 接听通话失败:', error)
      return { success: false, error: '接听通话失败' }
    }
  }

  /**
   * 拒绝通话
   */
  async rejectCall(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authStore = useAuthStore()

      if (!authStore.token) {
        return { success: false, error: '用户未登录' }
      }

      console.log('📞 拒绝通话:', callId)

      const response = await fetch('http://localhost:8893/api/webrtc-calls/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ callId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 清除当前通话
          if (this.currentCall && this.currentCall.callId === callId) {
            this.currentCall.status = 'ended'
            this.currentCall.endTime = Date.now()
          }

          console.log('✅ 通话拒绝成功')
          this.emit('call-rejected', { callId })

          return { success: true }
        } else {
          return { success: false, error: result.message || '拒绝通话失败' }
        }
      } else {
        return { success: false, error: '网络错误' }
      }
    } catch (error) {
      console.error('❌ 拒绝通话失败:', error)
      return { success: false, error: '拒绝通话失败' }
    }
  }

  /**
   * 结束通话
   */
  async endCall(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authStore = useAuthStore()

      if (!authStore.token) {
        return { success: false, error: '用户未登录' }
      }

      console.log('📞 结束通话:', callId)

      const response = await fetch('http://localhost:8893/api/webrtc-calls/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ callId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 清除当前通话
          if (this.currentCall && this.currentCall.callId === callId) {
            this.currentCall.status = 'ended'
            this.currentCall.endTime = Date.now()
          }

          console.log('✅ 通话结束成功')
          this.emit('call-ended', { callId })

          return { success: true }
        } else {
          return { success: false, error: result.message || '结束通话失败' }
        }
      } else {
        return { success: false, error: '网络错误' }
      }
    } catch (error) {
      console.error('❌ 结束通话失败:', error)
      return { success: false, error: '结束通话失败' }
    }
  }

  /**
   * 获取当前通话信息
   */
  getCurrentCall(): CallInfo | null {
    return this.currentCall
  }

  /**
   * 设置当前通话信息
   */
  setCurrentCall(callInfo: CallInfo | null): void {
    this.currentCall = callInfo
  }

  /**
   * 事件监听器管理
   */
  on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.currentCall = null
    this.eventListeners.clear()
  }
}

// 导出单例
export const callManager = new CallManager()

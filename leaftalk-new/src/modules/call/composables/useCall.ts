/**
 * 仿微信通话系统 - 通话组合式函数
 * 提供简单易用的通话功能接口
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { callManager } from '../services/CallManager'
import type { CallType, IncomingCallData } from '../types'

export function useCall() {
  const router = useRouter()
  
  // 响应式状态
  const isInitializing = ref(false)
  const error = ref<string>('')

  // 计算属性
  const currentCall = computed(() => callManager.currentCall.value)
  const callStatus = computed(() => callManager.callStatus.value)
  const mediaState = computed(() => callManager.mediaState)
  const networkQuality = computed(() => callManager.networkQuality.value)
  const isInCall = computed(() => callStatus.value !== 'idle')

  /**
   * 发起通话
   */
  const makeCall = async (targetUserId: string, type: CallType, targetUserInfo?: any) => {
    try {
      isInitializing.value = true
      error.value = ''

      // 如果没有提供用户信息，使用默认值
      const userInfo = targetUserInfo || {
        id: targetUserId,
        name: `用户${targetUserId}`,
        avatar: ''
      }

      // 跳转到通话页面
      await router.push({
        path: '/call',
        query: {
          action: 'outgoing',
          targetUserId,
          type,
          name: userInfo.name,
          avatar: userInfo.avatar
        }
      })

    } catch (err) {
      console.error('发起通话失败:', err)
      error.value = '发起通话失败，请重试'
      throw err
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * 接听来电
   */
  const acceptIncomingCall = async (callData: IncomingCallData) => {
    try {
      // 跳转到通话页面
      await router.push({
        path: '/call',
        query: {
          action: 'incoming',
          callId: callData.callId,
          targetUserId: callData.fromUserId,
          type: callData.type,
          name: callData.fromUserInfo.name,
          avatar: callData.fromUserInfo.avatar
        }
      })
    } catch (err) {
      console.error('接听通话失败:', err)
      error.value = '接听通话失败'
      throw err
    }
  }

  /**
   * 拒绝来电
   */
  const rejectIncomingCall = async (callId: string) => {
    try {
      await callManager.rejectCall(callId)
    } catch (err) {
      console.error('拒绝通话失败:', err)
      error.value = '拒绝通话失败'
      throw err
    }
  }

  /**
   * 结束通话
   */
  const endCall = async () => {
    try {
      await callManager.endCall()
    } catch (err) {
      console.error('结束通话失败:', err)
      error.value = '结束通话失败'
      throw err
    }
  }

  /**
   * 切换音频静音
   */
  const toggleAudioMute = () => {
    try {
      return callManager.toggleAudioMute()
    } catch (err) {
      console.error('切换音频失败:', err)
      error.value = '音频控制失败'
      return false
    }
  }

  /**
   * 切换视频静音
   */
  const toggleVideoMute = () => {
    try {
      return callManager.toggleVideoMute()
    } catch (err) {
      console.error('切换视频失败:', err)
      error.value = '视频控制失败'
      return false
    }
  }

  /**
   * 切换摄像头
   */
  const switchCamera = async () => {
    try {
      await callManager.switchCamera()
    } catch (err) {
      console.error('切换摄像头失败:', err)
      error.value = '切换摄像头失败'
      throw err
    }
  }

  /**
   * 获取本地媒体流
   */
  const getLocalStream = () => {
    return callManager.getLocalStream()
  }

  /**
   * 获取远程媒体流
   */
  const getRemoteStream = () => {
    return callManager.getRemoteStream()
  }

  /**
   * 监听通话事件
   */
  const onCallEvent = (event: string, handler: Function) => {
    callManager.on(event as any, handler as any)
  }

  /**
   * 移除通话事件监听
   */
  const offCallEvent = (event: string, handler: Function) => {
    callManager.off(event as any, handler as any)
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = ''
  }

  /**
   * 初始化通话管理器
   */
  const initialize = async () => {
    try {
      isInitializing.value = true
      await callManager.initialize()
    } catch (err) {
      console.error('初始化通话管理器失败:', err)
      error.value = '通话服务初始化失败'
      throw err
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * 销毁通话管理器
   */
  const destroy = async () => {
    try {
      await callManager.destroy()
    } catch (err) {
      console.error('销毁通话管理器失败:', err)
    }
  }

  return {
    // 状态
    currentCall,
    callStatus,
    mediaState,
    networkQuality,
    isInCall,
    isInitializing,
    error,

    // 方法
    makeCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
    switchCamera,
    getLocalStream,
    getRemoteStream,
    onCallEvent,
    offCallEvent,
    clearError,
    initialize,
    destroy
  }
}

// 导出单例实例供全局使用
let globalCallInstance: ReturnType<typeof useCall> | null = null

export function useGlobalCall() {
  if (!globalCallInstance) {
    globalCallInstance = useCall()
  }
  return globalCallInstance
}

/**
 * 仿微信通话系统 - 模块入口
 */

// 导出类型
export * from './types'

// 导出服务
export { callManager } from './services/CallManager'

// 导出组合式函数
export { useCall, useGlobalCall } from './composables/useCall'

// 导出组件
export { default as IncomingCallScreen } from './components/IncomingCallScreen.vue'
export { default as VideoCallScreen } from './components/VideoCallScreen.vue'
export { default as VoiceCallScreen } from './components/VoiceCallScreen.vue'
export { default as CallPage } from './pages/CallPage.vue'

// 导出路由
export { default as callRoutes } from './router'

// 导出工具函数
export const CallUtils = {
  /**
   * 格式化通话时长
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  },

  /**
   * 检查浏览器WebRTC支持
   */
  checkWebRTCSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    )
  },

  /**
   * 获取设备权限状态
   */
  async getPermissionStatus(): Promise<{
    camera: PermissionState
    microphone: PermissionState
  }> {
    try {
      const [camera, microphone] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName })
      ])

      return {
        camera: camera.state,
        microphone: microphone.state
      }
    } catch (error) {
      console.warn('无法获取权限状态:', error)
      return {
        camera: 'prompt',
        microphone: 'prompt'
      }
    }
  },

  /**
   * 请求媒体权限
   */
  async requestMediaPermissions(video: boolean = true): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      })
      
      // 立即停止流，只是为了获取权限
      stream.getTracks().forEach(track => track.stop())
      
      return true
    } catch (error) {
      console.error('获取媒体权限失败:', error)
      return false
    }
  },

  /**
   * 生成通话ID
   */
  generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * 验证通话配置
   */
  validateCallConfig(config: any): boolean {
    return !!(
      config &&
      config.callId &&
      config.type &&
      ['voice', 'video'].includes(config.type) &&
      config.targetUserId &&
      typeof config.isInitiator === 'boolean'
    )
  }
}

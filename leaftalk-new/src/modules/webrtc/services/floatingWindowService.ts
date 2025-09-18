/**
 * 浮窗管理服务
 * 处理通话页面的最小化、恢复和浮窗状态管理
 */

export interface FloatingWindowState {
  isMinimized: boolean
  callType: 'video' | 'voice'
  contactName: string
  contactAvatar: string
  duration: number
  isConnected: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callId: string
  targetUserId: string
}

export interface FloatingWindowPosition {
  x: number
  y: number
}

class FloatingWindowService {
  private state: FloatingWindowState | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private savedPosition: FloatingWindowPosition | null = null
  private isInitialized = false

  /**
   * 初始化浮窗服务
   */
  initialize(): void {
    if (this.isInitialized) return
    
    console.log('🪟 初始化浮窗服务')
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleWindowResize.bind(this))
    
    // 监听页面卸载
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    
    this.isInitialized = true
    console.log('✅ 浮窗服务初始化完成')
  }

  /**
   * 最小化到浮窗
   */
  minimize(callData: Partial<FloatingWindowState>): void {
    try {
      console.log('🪟 最小化到浮窗:', callData)
      
      this.state = {
        isMinimized: true,
        callType: callData.callType || 'voice',
        contactName: callData.contactName || '未知联系人',
        contactAvatar: callData.contactAvatar || '',
        duration: callData.duration || 0,
        isConnected: callData.isConnected || false,
        isMuted: callData.isMuted || false,
        isVideoEnabled: callData.isVideoEnabled || true,
        localStream: callData.localStream || null,
        remoteStream: callData.remoteStream || null,
        callId: callData.callId || '',
        targetUserId: callData.targetUserId || ''
      }
      
      // 触发最小化事件
      this.emit('minimized', this.state)
      
      console.log('✅ 已最小化到浮窗')
    } catch (error) {
      console.error('❌ 最小化失败:', error)
    }
  }

  /**
   * 恢复窗口
   */
  restore(): void {
    try {
      if (!this.state) {
        console.warn('⚠️ 没有可恢复的浮窗状态')
        return
      }
      
      console.log('🪟 恢复窗口')
      
      const callData = { ...this.state }
      this.state = null
      
      // 触发恢复事件
      this.emit('restored', callData)
      
      console.log('✅ 窗口已恢复')
    } catch (error) {
      console.error('❌ 恢复窗口失败:', error)
    }
  }

  /**
   * 更新浮窗状态
   */
  updateState(updates: Partial<FloatingWindowState>): void {
    if (!this.state) return
    
    this.state = { ...this.state, ...updates }
    
    // 触发状态更新事件
    this.emit('stateUpdated', this.state)
  }

  /**
   * 更新通话时长
   */
  updateDuration(duration: number): void {
    this.updateState({ duration })
  }

  /**
   * 更新连接状态
   */
  updateConnectionState(isConnected: boolean): void {
    this.updateState({ isConnected })
  }

  /**
   * 更新静音状态
   */
  updateMuteState(isMuted: boolean): void {
    this.updateState({ isMuted })
  }

  /**
   * 更新视频状态
   */
  updateVideoState(isVideoEnabled: boolean): void {
    this.updateState({ isVideoEnabled })
  }

  /**
   * 更新媒体流
   */
  updateStreams(localStream: MediaStream | null, remoteStream: MediaStream | null): void {
    this.updateState({ localStream, remoteStream })
  }

  /**
   * 关闭浮窗
   */
  close(): void {
    try {
      console.log('🪟 关闭浮窗')
      
      if (this.state) {
        const callData = { ...this.state }
        this.state = null
        
        // 触发关闭事件
        this.emit('closed', callData)
      }
      
      console.log('✅ 浮窗已关闭')
    } catch (error) {
      console.error('❌ 关闭浮窗失败:', error)
    }
  }

  /**
   * 保存浮窗位置
   */
  savePosition(position: FloatingWindowPosition): void {
    this.savedPosition = position
    
    // 保存到本地存储
    try {
      localStorage.setItem('floating_window_position', JSON.stringify(position))
    } catch (error) {
      console.warn('⚠️ 保存浮窗位置失败:', error)
    }
  }

  /**
   * 获取保存的浮窗位置
   */
  getSavedPosition(): FloatingWindowPosition | null {
    if (this.savedPosition) {
      return this.savedPosition
    }
    
    // 从本地存储读取
    try {
      const saved = localStorage.getItem('floating_window_position')
      if (saved) {
        this.savedPosition = JSON.parse(saved)
        return this.savedPosition
      }
    } catch (error) {
      console.warn('⚠️ 读取保存的浮窗位置失败:', error)
    }
    
    return null
  }

  /**
   * 获取当前状态
   */
  getState(): FloatingWindowState | null {
    return this.state ? { ...this.state } : null
  }

  /**
   * 检查是否已最小化
   */
  isMinimized(): boolean {
    return this.state?.isMinimized || false
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.hidden && this.state) {
      // 页面隐藏时保持浮窗状态
      console.log('🪟 页面隐藏，保持浮窗状态')
    } else if (!document.hidden && this.state) {
      // 页面显示时检查浮窗状态
      console.log('🪟 页面显示，检查浮窗状态')
    }
  }

  /**
   * 处理窗口大小变化
   */
  private handleWindowResize(): void {
    if (this.state) {
      // 触发窗口大小变化事件，让浮窗组件调整位置
      this.emit('windowResized', {
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
  }

  /**
   * 处理页面卸载
   */
  private handleBeforeUnload(): void {
    if (this.state) {
      // 页面卸载时保存状态
      try {
        sessionStorage.setItem('floating_window_state', JSON.stringify(this.state))
      } catch (error) {
        console.warn('⚠️ 保存浮窗状态失败:', error)
      }
    }
  }

  /**
   * 恢复保存的状态
   */
  restoreSavedState(): FloatingWindowState | null {
    try {
      const saved = sessionStorage.getItem('floating_window_state')
      if (saved) {
        const state = JSON.parse(saved)
        sessionStorage.removeItem('floating_window_state')
        return state
      }
    } catch (error) {
      console.warn('⚠️ 恢复保存的浮窗状态失败:', error)
    }
    
    return null
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
          console.error(`❌ 浮窗事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (!this.isInitialized) return
    
    console.log('🧹 清理浮窗服务')
    
    // 移除事件监听
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    window.removeEventListener('resize', this.handleWindowResize.bind(this))
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    
    // 清理状态
    this.state = null
    this.savedPosition = null
    this.eventListeners.clear()
    this.isInitialized = false
    
    console.log('✅ 浮窗服务已清理')
  }
}

// 导出单例
export const floatingWindowService = new FloatingWindowService()
export default floatingWindowService

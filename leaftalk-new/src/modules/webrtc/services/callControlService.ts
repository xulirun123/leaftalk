/**
 * 通话控制服务
 * 处理静音、摄像头切换、扬声器控制等功能
 */

import { mediaService } from './mediaService'
import { peerConnectionService } from './peerConnectionService'

export interface CallControlState {
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeakerOn: boolean
  currentCamera: 'front' | 'back'
  currentMicrophone: string | null
  volume: number
}

export interface AudioOutputDevice {
  deviceId: string
  label: string
  kind: 'audiooutput'
}

class CallControlService {
  private state: CallControlState = {
    isMuted: false,
    isVideoEnabled: true,
    isSpeakerOn: true,
    currentCamera: 'front',
    currentMicrophone: null,
    volume: 1.0
  }

  private eventListeners: Map<string, Function[]> = new Map()
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private analyserNode: AnalyserNode | null = null

  /**
   * 初始化通话控制服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎛️ 初始化通话控制服务')
      
      // 初始化音频上下文
      this.initializeAudioContext()
      
      console.log('✅ 通话控制服务初始化完成')
    } catch (error) {
      console.error('❌ 通话控制服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化音频上下文
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gainNode = this.audioContext.createGain()
      this.analyserNode = this.audioContext.createAnalyser()
      
      // 连接音频节点
      this.gainNode.connect(this.analyserNode)
      this.analyserNode.connect(this.audioContext.destination)
      
      console.log('🔊 音频上下文初始化完成')
    } catch (error) {
      console.warn('⚠️ 音频上下文初始化失败:', error)
    }
  }

  /**
   * 切换静音状态
   */
  toggleMute(): boolean {
    try {
      this.state.isMuted = mediaService.toggleMute()
      
      // 通知对方静音状态变化
      this.notifyPeerControlChange('mute', { muted: this.state.isMuted })
      
      // 触发状态变化事件
      this.emit('muteChanged', { isMuted: this.state.isMuted })
      
      console.log(this.state.isMuted ? '🔇 已静音' : '🔊 已取消静音')
      return this.state.isMuted
    } catch (error) {
      console.error('❌ 切换静音状态失败:', error)
      return this.state.isMuted
    }
  }

  /**
   * 切换视频状态
   */
  toggleVideo(): boolean {
    try {
      this.state.isVideoEnabled = mediaService.toggleVideo()
      
      // 通知对方视频状态变化
      this.notifyPeerControlChange('video', { enabled: this.state.isVideoEnabled })
      
      // 触发状态变化事件
      this.emit('videoChanged', { isVideoEnabled: this.state.isVideoEnabled })
      
      console.log(this.state.isVideoEnabled ? '📹 已开启视频' : '📹 已关闭视频')
      return this.state.isVideoEnabled
    } catch (error) {
      console.error('❌ 切换视频状态失败:', error)
      return this.state.isVideoEnabled
    }
  }

  /**
   * 切换扬声器状态
   */
  toggleSpeaker(): boolean {
    try {
      this.state.isSpeakerOn = !this.state.isSpeakerOn
      
      // 调整音频输出
      this.adjustAudioOutput()
      
      // 触发状态变化事件
      this.emit('speakerChanged', { isSpeakerOn: this.state.isSpeakerOn })
      
      console.log(this.state.isSpeakerOn ? '🔊 已开启扬声器' : '🔇 已关闭扬声器')
      return this.state.isSpeakerOn
    } catch (error) {
      console.error('❌ 切换扬声器状态失败:', error)
      return this.state.isSpeakerOn
    }
  }

  /**
   * 切换摄像头
   */
  async switchCamera(): Promise<boolean> {
    try {
      const newStream = await mediaService.switchCamera()
      if (newStream) {
        this.state.currentCamera = this.state.currentCamera === 'front' ? 'back' : 'front'
        
        // 触发状态变化事件
        this.emit('cameraChanged', { 
          currentCamera: this.state.currentCamera,
          stream: newStream 
        })
        
        console.log(`📷 已切换到${this.state.currentCamera === 'front' ? '前置' : '后置'}摄像头`)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 切换摄像头失败:', error)
      return false
    }
  }

  /**
   * 切换麦克风
   */
  async switchMicrophone(deviceId?: string): Promise<boolean> {
    try {
      const newStream = await mediaService.switchMicrophone(deviceId)
      if (newStream) {
        this.state.currentMicrophone = deviceId || null
        
        // 触发状态变化事件
        this.emit('microphoneChanged', { 
          currentMicrophone: this.state.currentMicrophone,
          stream: newStream 
        })
        
        console.log('🎤 已切换麦克风')
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 切换麦克风失败:', error)
      return false
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    try {
      // 限制音量范围 0-1
      this.state.volume = Math.max(0, Math.min(1, volume))
      
      // 调整音频增益
      if (this.gainNode) {
        this.gainNode.gain.value = this.state.volume
      }
      
      // 触发状态变化事件
      this.emit('volumeChanged', { volume: this.state.volume })
      
      console.log(`🔊 音量设置为: ${Math.round(this.state.volume * 100)}%`)
    } catch (error) {
      console.error('❌ 设置音量失败:', error)
    }
  }

  /**
   * 获取音频输出设备列表
   */
  async getAudioOutputDevices(): Promise<AudioOutputDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || '默认扬声器',
          kind: 'audiooutput' as const
        }))
    } catch (error) {
      console.error('❌ 获取音频输出设备失败:', error)
      return []
    }
  }

  /**
   * 设置音频输出设备
   */
  async setAudioOutputDevice(deviceId: string): Promise<boolean> {
    try {
      // 注意：setSinkId 方法在某些浏览器中可能不支持
      const audioElements = document.querySelectorAll('audio, video')
      
      for (const element of audioElements) {
        if ('setSinkId' in element && typeof (element as any).setSinkId === 'function') {
          await (element as any).setSinkId(deviceId)
        }
      }
      
      console.log('🔊 音频输出设备已切换')
      return true
    } catch (error) {
      console.error('❌ 设置音频输出设备失败:', error)
      return false
    }
  }

  /**
   * 获取音频分析数据（用于可视化）
   */
  getAudioAnalysisData(): Uint8Array | null {
    if (!this.analyserNode) return null
    
    const bufferLength = this.analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyserNode.getByteFrequencyData(dataArray)
    
    return dataArray
  }

  /**
   * 获取音频音量级别
   */
  getAudioLevel(): number {
    if (!this.analyserNode) return 0
    
    const bufferLength = this.analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyserNode.getByteFrequencyData(dataArray)
    
    // 计算平均音量
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    
    return sum / bufferLength / 255 // 归一化到 0-1
  }

  /**
   * 调整音频输出
   */
  private adjustAudioOutput(): void {
    try {
      if (this.gainNode) {
        // 根据扬声器状态调整音量
        const targetVolume = this.state.isSpeakerOn ? this.state.volume : 0
        this.gainNode.gain.setValueAtTime(targetVolume, this.audioContext!.currentTime)
      }
    } catch (error) {
      console.error('❌ 调整音频输出失败:', error)
    }
  }

  /**
   * 通知对方控制状态变化
   */
  private notifyPeerControlChange(type: string, data: any): void {
    try {
      peerConnectionService.sendDataChannelMessage({
        type: `control_${type}`,
        data
      })
    } catch (error) {
      console.warn('⚠️ 通知对方控制状态变化失败:', error)
    }
  }

  /**
   * 处理来自对方的控制状态变化
   */
  handlePeerControlChange(type: string, data: any): void {
    switch (type) {
      case 'mute':
        this.emit('peerMuteChanged', data)
        break
      case 'video':
        this.emit('peerVideoChanged', data)
        break
      default:
        console.log('📊 收到对方控制状态变化:', type, data)
    }
  }

  /**
   * 获取当前控制状态
   */
  getState(): CallControlState {
    return { ...this.state }
  }

  /**
   * 重置控制状态
   */
  reset(): void {
    this.state = {
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: true,
      currentCamera: 'front',
      currentMicrophone: null,
      volume: 1.0
    }
    
    console.log('🔄 通话控制状态已重置')
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
          console.error(`❌ 控制事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioContext = null
    this.gainNode = null
    this.analyserNode = null
    this.eventListeners.clear()
    
    console.log('🧹 通话控制服务已清理')
  }
}

// 导出单例
export const callControlService = new CallControlService()
export default callControlService

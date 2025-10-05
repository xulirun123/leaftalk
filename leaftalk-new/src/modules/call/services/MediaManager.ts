/**
 * 仿微信通话系统 - 媒体管理器
 * 负责音视频流的获取、处理和控制
 */

import type { CallType, DeviceInfo } from '../types'

export class MediaManager {
  private localStream: MediaStream | null = null
  private frontCameraStream: MediaStream | null = null // 前置摄像头预览流（小窗固定显示）
  private audioDevices: DeviceInfo[] = []
  private videoDevices: DeviceInfo[] = []
  private currentAudioDevice: string | null = null
  private currentVideoDevice: string | null = null
  private currentFacingMode: 'user' | 'environment' = 'user' // 当前主流的朝向
  private eventListeners: Map<string, Function[]> = new Map()
  // 呼叫铃声播放器
  private ringtoneAudio: HTMLAudioElement | null = null

  // 视频重试控制
  private videoRetryTimer: any = null
  private videoRetryAttempts = 0

  /**
   * 初始化媒体管理器
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🎥 初始化媒体管理器...')

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持 WebRTC')
      }

      // 枚举设备
      await this.enumerateDevices()

      console.log('✅ 媒体管理器初始化完成')
    } catch (error) {
      console.error('❌ 媒体管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化本地媒体流
   */
  public async initializeLocalStream(type: CallType): Promise<MediaStream> {
    console.log(`🎥 获取${type === 'video' ? '视频' : '音频'}流...`)

    // 基础音频约束
    const baseAudio: MediaTrackConstraints = {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 48000 },
      deviceId: this.currentAudioDevice ? { exact: this.currentAudioDevice } : undefined
    }

    // 首选视频约束（默认前置摄像头）
    const preferredVideo: MediaTrackConstraints = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user', // 前置摄像头
      deviceId: this.currentVideoDevice ? { exact: this.currentVideoDevice } : undefined
    }

    // 回退视频约束（更宽松，不带 deviceId）
    const relaxedVideo: MediaTrackConstraints = {
      width: { ideal: 320 },
      height: { ideal: 240 }
    }

    // 最简单的视频约束
    const basicVideo: MediaTrackConstraints = true

    // 释放之前的流
    if (this.localStream) {
      this.stopLocalStream()
    }

    // 检查权限状态
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      console.log('📹 摄像头权限状态:', permissions.state)
    } catch (e) {
      console.warn('📹 无法检查摄像头权限:', e)
    }

    // 检查可用设备
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      console.log('📹 可用视频设备:', videoDevices.length, videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })))
    } catch (e) {
      console.warn('📹 无法枚举设备:', e)
    }

    // 1) 首选约束尝试
    try {
      const constraints: MediaStreamConstraints = {
        audio: baseAudio,
        video: type === 'video' ? preferredVideo : false
      }
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ 本地媒体流获取成功（首选约束）')
      console.log('📹 流详细信息:', {
        id: this.localStream.id,
        active: this.localStream.active,
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
        videoTrackSettings: this.localStream.getVideoTracks()[0]?.getSettings()
      })

      // 如果是视频通话且当前不是前置摄像头，创建前置预览流
      if (type === 'video' && this.currentFacingMode === 'environment') {
        await this.ensureFrontCameraStream()
      }

      this.emit('local-stream', this.localStream)
      return this.localStream
    } catch (err1: any) {
      console.warn('⚠️ 首选约束失败:', err1?.name || err1)

      // 2) 视频失败后直接降级为仅音频（不再多轮重试/降级）
      if (type === 'video') {
        try {
          const audioOnly: MediaStreamConstraints = { audio: baseAudio, video: false }
          this.localStream = await navigator.mediaDevices.getUserMedia(audioOnly)
          console.warn('⚠️ 无法获取视频，已降级为仅音频通话（不重试视频）')
          this.emit('video-unavailable', err1?.name || 'VideoNotAvailable')
          this.emit('local-stream', this.localStream)
          return this.localStream
        } catch (errAudio: any) {
          console.error('❌ 无法获取音频流:', errAudio)
          // 将最初的错误抛出以便上层按原始原因处理
          throw err1
        }
      }

      // 非视频通话，直接抛错
      throw err1
    }
  }

  /**
   * 枚举设备
   */
  private async enumerateDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      this.audioDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `音频设备 ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId
        }))

      this.videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `视频设备 ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId
        }))

      // 设置默认设备
      if (this.audioDevices.length > 0 && !this.currentAudioDevice) {
        this.currentAudioDevice = this.audioDevices[0].deviceId
      }

      if (this.videoDevices.length > 0 && !this.currentVideoDevice) {
        this.currentVideoDevice = this.videoDevices[0].deviceId
      }

      console.log(`📱 发现设备: ${this.audioDevices.length} 个音频设备, ${this.videoDevices.length} 个视频设备`)
    } catch (error) {
      console.error('❌ 枚举设备失败:', error)
    }
  }

  /**
   * 切换音频静音
   */
  public toggleAudioMute(): boolean {
    if (!this.localStream) return false

    const audioTracks = this.localStream.getAudioTracks()
    const muted = !audioTracks[0]?.enabled

    audioTracks.forEach(track => {
      track.enabled = muted
    })

    console.log(`🔊 音频${muted ? '取消静音' : '静音'}`)
    return !muted
  }

  /**
   * 切换视频静音
   */
  public toggleVideoMute(): boolean {
    if (!this.localStream) return false

    const videoTracks = this.localStream.getVideoTracks()
    const muted = !videoTracks[0]?.enabled

    videoTracks.forEach(track => {
      track.enabled = muted
    })

    console.log(`📹 视频${muted ? '取消静音' : '静音'}`)
    return !muted
  }

  /**
   * 切换摄像头（主流：发送给对方的画面）
   */
  public async switchCamera(): Promise<void> {
    if (!this.localStream) return

    // 切换朝向
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user'
    console.log(`📹 切换到${this.currentFacingMode === 'user' ? '前置' : '后置'}摄像头`)

    const currentTrack = this.localStream.getVideoTracks()[0]
    const constraints = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: this.currentFacingMode
    }

    try {
      // 先尝试 exact 约束
      const exactConstraints = { ...constraints, facingMode: { exact: this.currentFacingMode } }
      let newStream: MediaStream
      try {
        newStream = await navigator.mediaDevices.getUserMedia({ video: exactConstraints })
      } catch {
        // 降级到非 exact
        newStream = await navigator.mediaDevices.getUserMedia({ video: constraints })
      }

      const newVideoTrack = newStream.getVideoTracks()[0]

      // 替换主流中的视频轨道
      if (currentTrack) {
        this.localStream.removeTrack(currentTrack)
        currentTrack.stop()
      }
      this.localStream.addTrack(newVideoTrack)

      // 更新设备ID
      const settings = newVideoTrack.getSettings()
      if (settings.deviceId) {
        this.currentVideoDevice = settings.deviceId
      }

      console.log(`📹 摄像头切换成功：${this.currentFacingMode === 'user' ? '前置' : '后置'}`)
      this.emit('camera-switched', this.currentVideoDevice)
      this.emit('local-stream', this.localStream)

      // 如果当前是后置摄像头，确保前置预览流仍然可用
      if (this.currentFacingMode === 'environment') {
        await this.ensureFrontCameraStream()
      }

    } catch (error) {
      console.error('❌ 切换摄像头失败:', error)
      // 恢复原来的朝向
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user'
      throw error
    }
  }

  /**
   * 确保前置摄像头预览流可用（用于小窗显示）
   */
  private async ensureFrontCameraStream(): Promise<void> {
    if (this.frontCameraStream && this.frontCameraStream.active) {
      return // 已有活跃的前置流
    }

    try {
      const frontConstraints = {
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        frameRate: { ideal: 15, max: 30 },
        facingMode: 'user'
      }

      this.frontCameraStream = await navigator.mediaDevices.getUserMedia({
        video: frontConstraints,
        audio: false // 前置预览流不需要音频
      })

      console.log('📹 前置摄像头预览流已创建')
      this.emit('front-camera-stream', this.frontCameraStream)
    } catch (error) {
      console.warn('⚠️ 创建前置摄像头预览流失败:', error)
    }
  }

  /**
   * 设置音频设备
   */
  public async setAudioDevice(deviceId: string): Promise<void> {
    if (!this.audioDevices.find(device => device.deviceId === deviceId)) {
      throw new Error('音频设备不存在')
    }

    this.currentAudioDevice = deviceId

    // 如果有活跃的流，重新获取音频
    if (this.localStream) {
      await this.refreshAudioTrack()
    }
  }

  /**
   * 设置视频设备
   */
  public async setVideoDevice(deviceId: string): Promise<void> {
    if (!this.videoDevices.find(device => device.deviceId === deviceId)) {
      throw new Error('视频设备不存在')
    }

    this.currentVideoDevice = deviceId

    // 如果有活跃的流，重新获取视频
    if (this.localStream && this.localStream.getVideoTracks().length > 0) {
      await this.refreshVideoTrack()
    }
  }

  /**
   * 刷新音频轨道
   */
  private async refreshAudioTrack(): Promise<void> {
    if (!this.localStream) return

    try {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        const constraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: { exact: this.currentAudioDevice! }
        }

        const newStream = await navigator.mediaDevices.getUserMedia({ audio: constraints })
        const newAudioTrack = newStream.getAudioTracks()[0]

        this.localStream.removeTrack(audioTrack)
        this.localStream.addTrack(newAudioTrack)

        audioTrack.stop()
      }
    } catch (error) {
      console.error('❌ 刷新音频轨道失败:', error)
    }
  }

  /**
   * 刷新视频轨道
   */
  private async refreshVideoTrack(): Promise<void> {
    if (!this.localStream) return

    try {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        const constraints = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
          deviceId: { exact: this.currentVideoDevice! }
        }

        const newStream = await navigator.mediaDevices.getUserMedia({ video: constraints })
        const newVideoTrack = newStream.getVideoTracks()[0]

        this.localStream.removeTrack(videoTrack)
        this.localStream.addTrack(newVideoTrack)

        videoTrack.stop()
      }


    } catch (error) {
      console.error('❌ 刷新视频轨道失败:', error)
    }
  }

  /**
   * 停止本地媒体流
   */
  public stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
      })
      this.localStream = null
      console.log('🛑 本地媒体流已停止')
    }

    // 同时停止前置预览流
    if (this.frontCameraStream) {
      this.frontCameraStream.getTracks().forEach(track => {
        track.stop()
      })
      this.frontCameraStream = null
      console.log('🛑 前置摄像头预览流已停止')
    }
  }

  /**
   * 获取本地媒体流
   */
  public getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * 获取前置摄像头预览流
   */
  public getFrontCameraStream(): MediaStream | null {
    return this.frontCameraStream
  }

  /**
   * 获取当前摄像头朝向
   */
  public getCurrentFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode
  }

  /**
   * 获取音频设备列表
   */
  public getAudioDevices(): DeviceInfo[] {
    return [...this.audioDevices]
  }

  /**
   * 获取视频设备列表
   */
  public getVideoDevices(): DeviceInfo[] {
    return [...this.videoDevices]
  }

  /** 后台自动重试获取视频并拼接到当前本地流（当前未启用） */
  private scheduleVideoRetry(maxAttempts: number = 5, intervalMs: number = 2000): void {
    if (this.videoRetryTimer) {
      clearInterval(this.videoRetryTimer)
      this.videoRetryTimer = null
      this.videoRetryAttempts = 0
    }

    // 若当前已有视频轨道则不需要重试
    if (this.localStream && this.localStream.getVideoTracks().length > 0) {
      return
    }

    console.log(`🔁 启动视频获取重试（最多 ${maxAttempts} 次，每 ${intervalMs}ms）`)
    this.videoRetryAttempts = 0
    this.videoRetryTimer = setInterval(async () => {
      this.videoRetryAttempts++
      if (this.videoRetryAttempts > maxAttempts) {
        console.warn('⏹️ 已达到视频重试上限，停止重试')
        clearInterval(this.videoRetryTimer)
        this.videoRetryTimer = null
        return
      }
      try {
        const constraints: MediaTrackConstraints = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: this.currentFacingMode,
          deviceId: this.currentVideoDevice ? { exact: this.currentVideoDevice } : undefined
        }
        const s = await navigator.mediaDevices.getUserMedia({ video: constraints })
        const newVideoTrack = s.getVideoTracks()[0]
        if (!newVideoTrack) throw new Error('no-video-track')

        if (!this.localStream) {
          this.localStream = new MediaStream()
        }
        // 如果已有视频轨道则先移除
        this.localStream.getVideoTracks().forEach(t => t.stop())
        this.localStream.getVideoTracks().forEach(t => this.localStream!.removeTrack(t))
        this.localStream.addTrack(newVideoTrack)

        // 同时确保仍有音频轨道（如果原来有）
        if (s.getAudioTracks().length > 0 && this.localStream.getAudioTracks().length === 0) {
          this.localStream.addTrack(s.getAudioTracks()[0])
        }

        console.log('✅ 视频重试成功，已将视频轨道加入本地流')
        clearInterval(this.videoRetryTimer)
        this.videoRetryTimer = null
        this.emit('local-stream', this.localStream)
      } catch (e) {
        console.warn(`🔁 第 ${this.videoRetryAttempts} 次视频重试失败:`, e)
      }
    }, intervalMs)
  }


  public on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`媒体事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 播放呼叫铃声（支持MP3），返回是否成功开始播放
   */
  public async playRingtone(url?: string, loop: boolean = true): Promise<boolean> {
    try {
      if (!url) {
        console.warn('未提供铃声URL，将使用默认铃声（若存在）')
      }
      // 停止已有铃声
      this.stopRingtone()
      const audio = new Audio(url || '')
      audio.loop = loop
      audio.preload = 'auto'
      audio.volume = 0.6
      this.ringtoneAudio = audio
      try {
        await audio.play()
        console.log('🔔 呼叫铃声开始播放')
        return true
      } catch (err) {
        console.warn('🔇 自动播放铃声被浏览器拦截，将在用户交互后尝试播放:', err)
        return false
      }
    } catch (error) {
      console.error('播放铃声失败:', error)
      return false
    }
  }

  /** 停止呼叫铃声 */
  public stopRingtone(): void {
    if (this.ringtoneAudio) {
      try {
        this.ringtoneAudio.pause()
      } catch {}
      this.ringtoneAudio.currentTime = 0
      this.ringtoneAudio = null
      console.log('🔕 呼叫铃声已停止')
    }
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {
    // 停止铃声
    this.stopRingtone()
    // 结束后立即释放麦克风/摄像头
    this.stopLocalStream()
    // 不清空事件监听，保持与 CallManager 的绑定，便于后续再次通话
    console.log('🧹 媒体管理器已清理（已释放本地媒体流）')
  }
}

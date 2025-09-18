/**
 * 媒体设备管理服务
 * 处理音视频设备访问、媒体流采集和管理
 */

export interface MediaDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput' | 'videoinput'
}

export interface MediaConstraints {
  audio?: boolean | MediaTrackConstraints
  video?: boolean | MediaTrackConstraints
}

export interface MediaQuality {
  level: 'low' | 'medium' | 'high' | 'ultra'
  video: {
    width: number
    height: number
    frameRate: number
    bitrate: number
  }
  audio: {
    sampleRate: number
    bitrate: number
  }
}

class MediaService {
  private currentStream: MediaStream | null = null
  private devices: MediaDevice[] = []
  private currentVideoDevice: string | null = null
  private currentAudioDevice: string | null = null
  private isInitialized = false
  private requestCounter = 0
  private activeRequestId = 0

  // 预定义的质量配置
  private qualityPresets: Record<string, MediaQuality> = {
    low: {
      level: 'low',
      video: { width: 320, height: 240, frameRate: 15, bitrate: 200000 },
      audio: { sampleRate: 16000, bitrate: 32000 }
    },
    medium: {
      level: 'medium',
      video: { width: 640, height: 480, frameRate: 24, bitrate: 500000 },
      audio: { sampleRate: 44100, bitrate: 64000 }
    },
    high: {
      level: 'high',
      video: { width: 1280, height: 720, frameRate: 30, bitrate: 1000000 },
      audio: { sampleRate: 48000, bitrate: 128000 }
    },
    ultra: {
      level: 'ultra',
      video: { width: 1920, height: 1080, frameRate: 30, bitrate: 2000000 },
      audio: { sampleRate: 48000, bitrate: 128000 }
    }
  }

  /**
   * 初始化媒体服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎥 初始化媒体服务...')

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持 WebRTC')
      }

      // 枚举设备
      await this.enumerateDevices()

      this.isInitialized = true
      console.log('✅ 媒体服务初始化完成')
    } catch (error) {
      console.error('❌ 媒体服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 枚举可用的媒体设备
   */
  async enumerateDevices(): Promise<MediaDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      this.devices = devices
        .filter(device => device.kind !== 'audiooutput' || device.deviceId !== 'default')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || this.getDefaultDeviceLabel(device.kind),
          kind: device.kind as 'audioinput' | 'audiooutput' | 'videoinput'
        }))

      console.log('📱 发现设备:', this.devices.length, '个')
      console.log('📱 设备列表:', this.devices)

      return this.devices
    } catch (error) {
      console.error('❌ 枚举设备失败:', error)
      return []
    }
  }

  /**
   * 获取默认设备标签
   */
  private getDefaultDeviceLabel(kind: string): string {
    switch (kind) {
      case 'audioinput': return '默认麦克风'
      case 'audiooutput': return '默认扬声器'
      case 'videoinput': return '默认摄像头'
      default: return '未知设备'
    }
  }

  /**
   * 获取用户媒体流（渐进式降级）
   */
  async getUserMedia(constraints: MediaConstraints): Promise<MediaStream> {
    try {
      console.log('🎥 请求用户媒体:', constraints)

      // 尝试获取完整媒体流
      let stream = await this.tryGetUserMedia(constraints)

      if (stream) {
        this.currentStream = stream
        this.setupStreamEventListeners(stream)
        console.log('✅ 媒体流获取成功')
        return stream
      }

      throw new Error('无法获取媒体流')
    } catch (error) {
      console.error('❌ 获取用户媒体失败:', error)
      throw error
    }
  }

  /**
   * 尝试获取用户媒体（带降级策略 + 快速超时兜底）
   */
  private async tryGetUserMedia(constraints: MediaConstraints): Promise<MediaStream | null> {
    const hasVideo = !!constraints.video

    // 优先尝试“快速预览”低清视频，提升首帧速度
    const fastVideo: MediaConstraints | null = hasVideo ? {
      audio: constraints.audio ?? true,
      video: {
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        frameRate: { ideal: 15, max: 24 },
        facingMode: 'user'
      }
    } : null

    const attempts = [
      fastVideo,
      constraints,
      hasVideo ? {
        ...constraints,
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: 'user'
        }
      } : null,
      hasVideo ? { audio: constraints.audio ?? true } : null,
      { audio: true }
    ].filter(Boolean) as MediaConstraints[]

    const requestId = ++this.requestCounter
    this.activeRequestId = requestId

    for (const attempt of attempts) {
      try {
        console.log('🔄 尝试媒体约束:', attempt)
        const timeoutMs = attempt.video ? 1800 : 1200
        const stream = await this.getUserMediaWithTimeout(attempt, timeoutMs, requestId)
        if (!stream) { continue }
        console.log('✅ 媒体流获取成功:', {
          audio: stream.getAudioTracks().length,
          video: stream.getVideoTracks().length
        })
        return stream
      } catch (error) {
        console.warn('⚠️ 媒体约束失败:', attempt, error)
        continue
      }
    }

    return null
  }

  // 带超时与延迟结果丢弃的 getUserMedia
  private async getUserMediaWithTimeout(attempt: MediaConstraints, timeoutMs: number, requestId: number): Promise<MediaStream | null> {
    let settled = false

    const timer = new Promise<null>((resolve) => {
      setTimeout(() => {
        if (!settled) {
          resolve(null)
        }
      }, timeoutMs)
    })

    const gum = navigator.mediaDevices.getUserMedia(attempt)
      .then(stream => {
        // 如果此时已经不是最新请求，丢弃并关闭轨道
        if (this.activeRequestId !== requestId) {
          try { stream.getTracks().forEach(t => t.stop()) } catch {}
          return null
        }
        return stream
      })
      .catch(() => null)

    const result = await Promise.race([gum, timer])
    settled = true
    return result
  }

  /**
   * 设置媒体流事件监听
   */
  private setupStreamEventListeners(stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      track.addEventListener('ended', () => {
        console.log(`📱 媒体轨道结束: ${track.kind}`)
      })

      track.addEventListener('mute', () => {
        console.log(`🔇 媒体轨道静音: ${track.kind}`)
      })

      track.addEventListener('unmute', () => {
        console.log(`🔊 媒体轨道取消静音: ${track.kind}`)
      })
    })
  }

  /**
   * 根据质量级别获取媒体约束
   */
  getConstraintsByQuality(quality: 'low' | 'medium' | 'high' | 'ultra', includeVideo = true): MediaConstraints {
    const preset = this.qualityPresets[quality]

    const constraints: MediaConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: preset.audio.sampleRate
      }
    }

    if (includeVideo) {
      constraints.video = {
        width: { ideal: preset.video.width },
        height: { ideal: preset.video.height },
        frameRate: { ideal: preset.video.frameRate },
        facingMode: 'user'
      }
    }

    return constraints
  }

  /**
   * 切换摄像头
   */
  async switchCamera(): Promise<MediaStream | null> {
    try {
      if (!this.currentStream) {
        throw new Error('当前没有活跃的媒体流')
      }

      const videoDevices = this.devices.filter(d => d.kind === 'videoinput')
      if (videoDevices.length < 2) {
        console.warn('⚠️ 只有一个摄像头，无法切换')
        return this.currentStream
      }

      // 找到下一个摄像头
      const currentIndex = videoDevices.findIndex(d => d.deviceId === this.currentVideoDevice)
      const nextIndex = (currentIndex + 1) % videoDevices.length
      const nextDevice = videoDevices[nextIndex]

      console.log('🔄 切换摄像头:', nextDevice.label)

      // 停止当前视频轨道
      const videoTracks = this.currentStream.getVideoTracks()
      videoTracks.forEach(track => track.stop())

      // 获取新的视频流
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } }
      })

      // 替换视频轨道
      const newVideoTrack = newVideoStream.getVideoTracks()[0]
      this.currentStream.removeTrack(videoTracks[0])
      this.currentStream.addTrack(newVideoTrack)

      this.currentVideoDevice = nextDevice.deviceId
      console.log('✅ 摄像头切换成功')

      return this.currentStream
    } catch (error) {
      console.error('❌ 切换摄像头失败:', error)
      return null
    }
  }

  /**
   * 切换麦克风
   */
  async switchMicrophone(deviceId?: string): Promise<MediaStream | null> {
    try {
      if (!this.currentStream) {
        throw new Error('当前没有活跃的媒体流')
      }

      const audioDevices = this.devices.filter(d => d.kind === 'audioinput')
      let targetDevice: MediaDevice

      if (deviceId) {
        const device = audioDevices.find(d => d.deviceId === deviceId)
        if (!device) {
          throw new Error('指定的音频设备不存在')
        }
        targetDevice = device
      } else {
        // 自动切换到下一个设备
        const currentIndex = audioDevices.findIndex(d => d.deviceId === this.currentAudioDevice)
        const nextIndex = (currentIndex + 1) % audioDevices.length
        targetDevice = audioDevices[nextIndex]
      }

      console.log('🔄 切换麦克风:', targetDevice.label)

      // 停止当前音频轨道
      const audioTracks = this.currentStream.getAudioTracks()
      audioTracks.forEach(track => track.stop())

      // 获取新的音频流
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: targetDevice.deviceId } }
      })

      // 替换音频轨道
      const newAudioTrack = newAudioStream.getAudioTracks()[0]
      this.currentStream.removeTrack(audioTracks[0])
      this.currentStream.addTrack(newAudioTrack)

      this.currentAudioDevice = targetDevice.deviceId
      console.log('✅ 麦克风切换成功')

      return this.currentStream
    } catch (error) {
      console.error('❌ 切换麦克风失败:', error)
      return null
    }
  }

  /**
   * 静音/取消静音
   */
  toggleMute(): boolean {
    if (!this.currentStream) return false

    const audioTracks = this.currentStream.getAudioTracks()
    const isMuted = audioTracks.length > 0 && !audioTracks[0].enabled

    audioTracks.forEach(track => {
      track.enabled = isMuted
    })

    console.log(isMuted ? '🔊 取消静音' : '🔇 静音')
    return !isMuted
  }

  /**
   * 开启/关闭视频
   */
  toggleVideo(): boolean {
    if (!this.currentStream) return false

    const videoTracks = this.currentStream.getVideoTracks()
    const isVideoOff = videoTracks.length > 0 && !videoTracks[0].enabled

    videoTracks.forEach(track => {
      track.enabled = isVideoOff
    })

    console.log(isVideoOff ? '📹 开启视频' : '📹 关闭视频')
    return !isVideoOff
  }

  /**
   * 停止当前媒体流
   */
  stopCurrentStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop()
      })
      this.currentStream = null
      console.log('🛑 媒体流已停止')
    }
  }

  /**
   * 获取当前媒体流
   */
  getCurrentStream(): MediaStream | null {
    return this.currentStream
  }

  /**
   * 获取设备列表
   */
  getDevices(): MediaDevice[] {
    return this.devices
  }

  /**
   * 检查设备权限
   */
  async checkPermissions(): Promise<{ audio: boolean; video: boolean }> {
    try {
      const permissions = {
        audio: false,
        video: false
      }

      // 检查麦克风权限
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        permissions.audio = true
        audioStream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.warn('⚠️ 麦克风权限被拒绝')
      }

      // 检查摄像头权限
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        permissions.video = true
        videoStream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.warn('⚠️ 摄像头权限被拒绝')
      }

      return permissions
    } catch (error) {
      console.error('❌ 检查权限失败:', error)
      return { audio: false, video: false }
    }
  }

  /**
   * 获取媒体流统计信息
   */
  getStreamStats(): { audio: any; video: any } | null {
    if (!this.currentStream) return null

    const audioTracks = this.currentStream.getAudioTracks()
    const videoTracks = this.currentStream.getVideoTracks()

    return {
      audio: audioTracks.length > 0 ? {
        enabled: audioTracks[0].enabled,
        label: audioTracks[0].label,
        settings: audioTracks[0].getSettings()
      } : null,
      video: videoTracks.length > 0 ? {
        enabled: videoTracks[0].enabled,
        label: videoTracks[0].label,
        settings: videoTracks[0].getSettings()
      } : null
    }
  }
}

// 导出单例
export const mediaService = new MediaService()
export default mediaService

/**
 * 通话管理器
 * 处理语音和视频通话的WebRTC连接
 */

export interface CallUser {
  id: string
  name: string
  avatar: string
}

export interface CallSession {
  id: string
  type: 'voice' | 'video'
  caller: CallUser
  callee: CallUser
  status: 'calling' | 'connecting' | 'connected' | 'ended'
  startTime?: number
  endTime?: number
  duration?: number
}

export type CallEventType = 'incoming' | 'accepted' | 'rejected' | 'ended' | 'error' | 'quality_update'

export interface CallEvent {
  type: CallEventType
  session: CallSession
  error?: string
}

export interface CallRecord {
  id: string
  type: 'voice' | 'video'
  participants: CallUser[]
  startTime: number
  endTime: number
  duration: number
  status: 'completed' | 'missed' | 'rejected' | 'failed'
  initiator: string
}

export interface CallQuality {
  bitrate: number
  packetLoss: number
  latency: number
  resolution?: { width: number; height: number }
  frameRate?: number
}

class CallManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private currentSession: CallSession | null = null
  private eventListeners: Array<(event: CallEvent) => void> = []
  private callRecords: CallRecord[] = []
  private qualityMonitor: any | null = null

  // WebRTC配置
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  constructor() {
    this.setupEventHandlers()
    this.loadCallRecords()
  }

  // 设置事件处理器
  private setupEventHandlers() {
    // 监听页面关闭事件
    window.addEventListener('beforeunload', () => {
      this.endCall()
    })
  }

  // 添加事件监听器
  addEventListener(callback: (event: CallEvent) => void) {
    this.eventListeners.push(callback)
    return () => {
      const index = this.eventListeners.indexOf(callback)
      if (index > -1) {
        this.eventListeners.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emitEvent(event: CallEvent) {
    this.eventListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Call event handler error:', error)
      }
    })
  }

  // 发起通话
  async startCall(callee: CallUser, type: 'voice' | 'video'): Promise<CallSession> {
    try {
      // 创建通话会话
      const session: CallSession = {
        id: this.generateSessionId(),
        type,
        caller: this.getCurrentUser(),
        callee,
        status: 'calling',
        startTime: Date.now()
      }

      this.currentSession = session

      // 获取本地媒体流
      await this.getLocalStream(type === 'video')

      // 创建WebRTC连接
      await this.createPeerConnection()

      // 发送通话邀请（这里应该通过WebSocket发送）
      this.sendCallInvitation(session)

      this.emitEvent({ type: 'incoming', session })
      return session

    } catch (error) {
      console.error('Start call failed:', error)
      this.emitEvent({ 
        type: 'error', 
        session: this.currentSession!, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // 接受通话
  async acceptCall(sessionId: string): Promise<void> {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      throw new Error('Invalid call session')
    }

    try {
      this.currentSession.status = 'connecting'

      // 获取本地媒体流
      await this.getLocalStream(this.currentSession.type === 'video')

      // 创建WebRTC连接
      await this.createPeerConnection()

      // 发送接受信号
      this.sendCallAcceptance(this.currentSession)

      this.currentSession.status = 'connected'
      this.emitEvent({ type: 'accepted', session: this.currentSession })

    } catch (error) {
      console.error('Accept call failed:', error)
      this.emitEvent({ 
        type: 'error', 
        session: this.currentSession, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // 拒绝通话
  rejectCall(sessionId: string): void {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      return
    }

    this.currentSession.status = 'ended'
    this.currentSession.endTime = Date.now()

    // 发送拒绝信号
    this.sendCallRejection(this.currentSession)

    this.emitEvent({ type: 'rejected', session: this.currentSession })
    this.cleanup()
  }

  // 结束通话
  endCall(): void {
    if (!this.currentSession) {
      return
    }

    this.currentSession.status = 'ended'
    this.currentSession.endTime = Date.now()

    if (this.currentSession.startTime) {
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime
    }

    // 记录通话记录
    this.recordCall(this.currentSession)

    // 发送结束信号
    this.sendCallEnd(this.currentSession)

    this.emitEvent({ type: 'ended', session: this.currentSession })
    this.cleanup()
  }

  // 切换静音
  toggleMute(): boolean {
    if (!this.localStream) {
      return false
    }

    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return !audioTrack.enabled // 返回是否静音
    }

    return false
  }

  // 切换摄像头
  toggleCamera(): boolean {
    if (!this.localStream || this.currentSession?.type !== 'video') {
      return false
    }

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      return videoTrack.enabled // 返回摄像头是否开启
    }

    return false
  }

  // 切换前后摄像头
  async switchCamera(): Promise<void> {
    if (!this.localStream || this.currentSession?.type !== 'video') {
      throw new Error('无法切换摄像头')
    }

    try {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('没有视频轨道')
      }

      // 获取当前摄像头设置
      const settings = videoTrack.getSettings()
      const currentFacingMode = settings.facingMode

      // 切换摄像头方向
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'

      // 停止当前视频轨道
      videoTrack.stop()

      // 获取新的视频流
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      })

      const newVideoTrack = newStream.getVideoTracks()[0]

      // 替换PeerConnection中的轨道
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        )
        if (sender) {
          await sender.replaceTrack(newVideoTrack)
        }
      }

      // 更新本地流
      this.localStream.removeTrack(videoTrack)
      this.localStream.addTrack(newVideoTrack)

    } catch (error) {
      console.error('切换摄像头失败:', error)
      throw error
    }
  }

  // 获取本地媒体流
  private async getLocalStream(includeVideo: boolean): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: includeVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.localStream

    } catch (error) {
      console.error('Get local stream failed:', error)
      throw new Error('无法获取摄像头或麦克风权限')
    }
  }

  // 创建WebRTC连接
  private async createPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig)

    // 添加本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })
    }

    // 处理远程流
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
    }

    // 处理ICE候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(event.candidate)
      }
    }

    // 处理连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState)
    }
  }

  // 获取当前用户信息
  private getCurrentUser(): CallUser {
    // 这里应该从用户store获取
    return {
      id: 'current-user',
      name: '我',
      avatar: ''
    }
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  // 发送通话邀请（模拟）
  private sendCallInvitation(session: CallSession): void {
    console.log('发送通话邀请:', session)
    // 这里应该通过WebSocket发送
  }

  // 发送接受信号（模拟）
  private sendCallAcceptance(session: CallSession): void {
    console.log('发送接受信号:', session)
    // 这里应该通过WebSocket发送
  }

  // 发送拒绝信号（模拟）
  private sendCallRejection(session: CallSession): void {
    console.log('发送拒绝信号:', session)
    // 这里应该通过WebSocket发送
  }

  // 发送结束信号（模拟）
  private sendCallEnd(session: CallSession): void {
    console.log('发送结束信号:', session)
    // 这里应该通过WebSocket发送
  }

  // 发送ICE候选（模拟）
  private sendIceCandidate(candidate: RTCIceCandidate): void {
    console.log('发送ICE候选:', candidate)
    // 这里应该通过WebSocket发送
  }

  // 清理资源
  private cleanup(): void {
    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // 关闭WebRTC连接
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
    this.currentSession = null
  }

  // 获取当前会话
  getCurrentSession(): CallSession | null {
    return this.currentSession
  }



  // 获取远程流
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }







  // 记录通话记录
  private recordCall(session: CallSession): void {
    const record: CallRecord = {
      id: session.id,
      type: session.type,
      participants: (session as any).participants || [],
      startTime: session.startTime || Date.now(),
      endTime: session.endTime || Date.now(),
      duration: session.duration || 0,
      status: session.status === 'ended' ? 'completed' : 'failed',
      initiator: (session as any).participants?.find((p: any) => p.role === 'caller')?.id || ''
    }

    this.callRecords.unshift(record)

    // 限制记录数量
    if (this.callRecords.length > 100) {
      this.callRecords = this.callRecords.slice(0, 100)
    }

    this.saveCallRecords()
  }

  // 获取通话记录
  getCallRecords(): CallRecord[] {
    return [...this.callRecords]
  }

  // 清除通话记录
  clearCallRecords(): void {
    this.callRecords = []
    this.saveCallRecords()
  }

  // 保存通话记录
  private saveCallRecords(): void {
    try {
      localStorage.setItem('leaftalk_call_records', JSON.stringify(this.callRecords))
    } catch (error) {
      console.error('保存通话记录失败:', error)
    }
  }

  // 加载通话记录
  private loadCallRecords(): void {
    try {
      const saved = localStorage.getItem('leaftalk_call_records')
      if (saved) {
        this.callRecords = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载通话记录失败:', error)
      this.callRecords = []
    }
  }

  // 开始质量监控
  private startQualityMonitoring(): void {
    if (!this.peerConnection) return

    this.qualityMonitor = setInterval(async () => {
      if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') {
        this.stopQualityMonitoring()
        return
      }

      try {
        const stats = await this.peerConnection.getStats()
        const quality = this.analyzeCallQuality(stats)

        this.emitEvent({
          type: 'quality_update',
          session: this.currentSession!,
          error: undefined
        })

      } catch (error) {
        console.error('质量监控失败:', error)
      }
    }, 5000) // 每5秒检查一次
  }

  // 停止质量监控
  private stopQualityMonitoring(): void {
    if (this.qualityMonitor) {
      clearInterval(this.qualityMonitor)
      this.qualityMonitor = null
    }
  }

  // 分析通话质量
  private analyzeCallQuality(stats: RTCStatsReport): CallQuality {
    let bitrate = 0
    let packetLoss = 0
    let latency = 0
    let resolution: { width: number; height: number } | undefined
    let frameRate: number | undefined

    stats.forEach((report: any) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        bitrate = report.bytesReceived * 8 / 1000 // kbps
        packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100

        if (report.frameWidth && report.frameHeight) {
          resolution = { width: report.frameWidth, height: report.frameHeight }
        }

        if (report.framesPerSecond) {
          frameRate = report.framesPerSecond
        }
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime * 1000 // ms
      }
    })

    return { bitrate, packetLoss, latency, resolution, frameRate }
  }

  // 获取当前通话质量
  async getCurrentCallQuality(): Promise<CallQuality | null> {
    if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') {
      return null
    }

    try {
      const stats = await this.peerConnection.getStats()
      return this.analyzeCallQuality(stats)
    } catch (error) {
      console.error('获取通话质量失败:', error)
      return null
    }
  }
}

// 创建全局实例
export const callManager = new CallManager()

export default CallManager

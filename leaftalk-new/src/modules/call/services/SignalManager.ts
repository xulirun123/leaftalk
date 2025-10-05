/**
 * 仿微信通话系统 - 信令管理器
 * 负责WebRTC信令交换和连接管理
 */

import { io, Socket } from 'socket.io-client'
import type {
  CallConfig,
  CallStatus,
  IncomingCallData,
  NetworkQuality,
  SocketOfferData,
  SocketAnswerData,
  SocketIceCandidateData,
  SocketCallStatusData
} from '../types'

export class SignalManager {
  private socket: Socket | null = null
  private peerConnection: RTCPeerConnection | null = null
  private remoteStream: MediaStream | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private isConnected = false
  private callConfig: CallConfig | null = null
  private iceCandidatesQueue: RTCIceCandidateInit[] = []
  // 上一次统计缓存用于计算丢包率/码率
  private prevInbound: { lost: number; recv: number } | null = null
  private prevOutboundBytes: number | null = null
  private prevStatsTs: number | null = null
  // 去重与状态保护
  private lastRemoteOfferSdp: string | null = null
  private lastRemoteAnswerSdp: string | null = null
  // 预创建阶段暂存（PC 未就绪时先排队）
  private pendingRemoteOffer: RTCSessionDescriptionInit | null = null
  private pendingRemoteAnswer: RTCSessionDescriptionInit | null = null
  private pendingPrePcIce: RTCIceCandidateInit[] = []
  // 当前用户信息与流缓冲
  private currentUserId: string | null = null
  private pendingLocalStream: MediaStream | null = null
  // 连接建立判定的幂等开关（首个远端轨道或连接状态变为connected时仅触发一次）
  private emittedConnected: boolean = false

  // WebRTC配置
  private rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  }

  /**
   * 初始化信令管理器
   */
  public async initialize(): Promise<void> {
    try {
      console.log('📡 初始化信令管理器...')

      if (!this.socket) {
        this.socket = io('ws://localhost:8893', {
          transports: ['websocket'],
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        })

        this.setupSocketEventListeners()
      }

      if (!this.socket.connected) {
        this.socket.connect()
      }

      await this.waitForConnection()
      console.log('✅ 信令管理器初始化完成')
    } catch (error) {
      console.error('❌ 信令管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 等待Socket连接
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('信令服务连接超时'))
      }, 10000)

      this.socket!.once('connect', () => {
        clearTimeout(timeout)
        this.isConnected = true
        resolve()
      })

      this.socket!.once('connect_error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * 设置Socket事件监听
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ 信令服务连接成功')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('❌ 信令服务连接断开')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ 信令服务连接失败:', error)
      this.isConnected = false
    })

    // WebRTC信令事件
    this.socket.on('webrtc:incoming-call', this.handleIncomingCall.bind(this))
    this.socket.on('webrtc:offer', this.handleOffer.bind(this))
    this.socket.on('webrtc:answer', this.handleAnswer.bind(this))
    this.socket.on('webrtc:ice-candidate', this.handleIceCandidate.bind(this))
    this.socket.on('webrtc:call-status', this.handleCallStatus.bind(this))
    this.socket.on('webrtc:call-ended', this.handleCallEnded.bind(this))
  }

  /**
   * 创建PeerConnection
   */
  public async createPeerConnection(config: CallConfig): Promise<void> {
    try {
      console.log('🔗 创建PeerConnection:', config.callId)

      this.callConfig = config
      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration)
      //       
      this.emittedConnected = false

      this.setupPeerConnectionEventListeners()

      // 加入用户房间
      this.joinUserRoom()

      // 如有暂存的本地流，补充加入到 PeerConnection
      if (this.pendingLocalStream) {
        try {
          await this.addLocalStream(this.pendingLocalStream)
          this.pendingLocalStream = null
        } catch (e) {
          console.warn('⚠️ 暂存本地流加入PeerConnection失败:', e)
        }
      }

      // 如在PC创建前已收到远端Offer（被叫场景常见），此处消化并立即答复
      if (this.pendingRemoteOffer) {
        try {
          if (this.peerConnection!.signalingState === 'stable') {
            await this.peerConnection!.setRemoteDescription(this.pendingRemoteOffer)
            this.lastRemoteOfferSdp = this.pendingRemoteOffer.sdp || null
            // 处理排队ICE
            for (const cand of this.pendingPrePcIce) {
              await this.peerConnection!.addIceCandidate(cand)
            }
            this.pendingPrePcIce = []
            // 创建并发送 Answer
            const answer = await this.peerConnection!.createAnswer()
            await this.peerConnection!.setLocalDescription(answer)
            this.sendAnswer(answer)
            console.log('📞 已处理挂起的Offer并发送Answer')
          } else {
            console.warn('⚠️ 非 stable 状态下存在挂起Offer，暂不处理:', this.peerConnection!.signalingState)
          }
        } finally {
          this.pendingRemoteOffer = null
        }
      }

      console.log('✅ PeerConnection创建成功')
    } catch (error) {
      console.error('❌ 创建PeerConnection失败:', error)
      throw error
    }
  }

  /**
   * 设置PeerConnection事件监听
   */
  private setupPeerConnectionEventListeners(): void {
    if (!this.peerConnection) return

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callConfig) {
        this.sendIceCandidate(event.candidate)
      }
    }

    // 当本地轨道发生变更（addTrack/replaceTrack）时，自动发起协商
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        // 仅在当前有通话配置时协商，避免无意义的 offer
        if (this.callConfig) {
          await this.createAndSendOffer()
          console.log('🤝 onnegotiationneeded -> 已触发重新协商')
        }
      } catch (e) {
        console.warn('⚠️ onnegotiationneeded 协商失败:', e)
      }
    }

    this.peerConnection.ontrack = (event) => {
      console.log('📹 收到远程媒体流')
      this.remoteStream = event.streams[0]
      this.emit('remote-stream', this.remoteStream)
      // 有些环境下 connectionState 迟滞；收到首个远端 track 也视为已接通
      if (!this.emittedConnected) {
        this.emittedConnected = true
        this.emit('call-connected')
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState
      console.log('🔗 连接状态变化:', state)

      if (state === 'connected') {
        if (!this.emittedConnected) {
          this.emittedConnected = true
          this.emit('call-connected')
        }
        this.startNetworkQualityMonitoring()
      } else if (state === 'disconnected' || state === 'failed') {
        this.emit('call-disconnected')
      }
    }

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection!.iceConnectionState
      console.log('🧊 ICE连接状态:', state)
      if ((state === 'connected' || state === 'completed') && !this.emittedConnected) {
        this.emittedConnected = true
        this.emit('call-connected')
      }
    }
  }

  /**
   * 加入用户房间
   */
  private joinUserRoom(): void {
    if (this.socket && this.isConnected) {
      const userId = this.currentUserId
      if (!userId) {
        console.warn('⚠️ 当前用户ID未知，无法加入用户房间')
        return
      }
      this.socket.emit('join_user_room', { userId })
      console.log(`📞 加入用户房间: ${userId}`)
    }
  }

  /**
   * 设置当前用户ID（用于加入自己的房间，避免误收信令）
   */
  public setCurrentUserId(userId: string): void {
    this.currentUserId = userId
    if (this.socket && this.isConnected) {
      this.joinUserRoom()
    }
  }

  /**
   * 发送通话信令
   */
  public async sendCallSignal(callId: string, targetUserId: string, type: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:call-start', {
        callId,
        targetUserId,
        type
      })
      console.log('📞 发送通话信令')
    }
  }

  /**
   * 添加本地媒体流
   */
  public async addLocalStream(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      // PeerConnection 尚未初始化：先暂存本地流，待 PC 创建后再加入
      this.pendingLocalStream = stream
      console.warn('PeerConnection 未初始化，已暂存本地流，稍后加入')
      return
    }

    try {
      // 添加音频轨道
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        const audioSenders = this.peerConnection.getSenders(); if (!audioSenders.some(s => s.track && s.track.id === audioTracks[0].id)) { this.peerConnection.addTrack(audioTracks[0], stream) } else { console.warn('跳过重复的音频轨道添加') }
      }

      // 添加视频轨道（如果是视频通话）
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0 && this.callConfig?.type === 'video') {
        const videoSenders = this.peerConnection.getSenders(); if (!videoSenders.some(s => s.track && s.track.id === videoTracks[0].id)) { this.peerConnection.addTrack(videoTracks[0], stream) } else { console.warn('跳过重复的视频轨道添加') }
      }

      console.log('✅ 本地媒体流已添加到PeerConnection')
    } catch (error) {
      console.error('❌ 添加本地媒体流失败:', error)
      throw error
    }
  }
  /**
   * 替换已发送的视频轨道（切换前后摄像头时使用）
   */
  public async replaceLocalVideoTrack(newTrack: MediaStreamTrack, stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      // PeerConnection 尚未初始化，暂存整条流，待创建后 add
      this.pendingLocalStream = stream
      console.warn('PeerConnection 未初始化，replaceLocalVideoTrack 改为暂存本地流，稍后加入')
      return
    }

    try {
      const senders = this.peerConnection.getSenders()
      const videoSender = senders.find(s => s.track && s.track.kind === 'video')
      if (videoSender) {
        await videoSender.replaceTrack(newTrack)
        console.log('✅ 已替换本地视频轨道（RTCRtpSender.replaceTrack）')
      } else {
        // 若尚无视频 sender，则直接添加
        this.peerConnection.addTrack(newTrack, stream)
        console.log('✅ 无现有视频sender，已直接添加新的视频轨道')
      }
    } catch (error) {
      console.error('❌ 替换本地视频轨道失败:', error)
      throw error
    }
  }


  /**
   * 创建并发送Offer
   */
  public async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection || !this.callConfig) {
      throw new Error('PeerConnection或CallConfig未初始化')
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callConfig.type === 'video'
      })

      await this.peerConnection.setLocalDescription(offer)

      // 如果此前已收到并挂起对端的 Answer，此时再应用
      if (this.pendingRemoteAnswer) {
        try {
          if (this.peerConnection.signalingState === 'have-local-offer') {
            await this.peerConnection.setRemoteDescription(this.pendingRemoteAnswer)
            this.lastRemoteAnswerSdp = this.pendingRemoteAnswer.sdp || null
            // 同步补充 PC 创建前暂存的 ICE 候选
            if (this.pendingPrePcIce.length > 0) {
              for (const cand of this.pendingPrePcIce) {
                try { await this.peerConnection.addIceCandidate(cand) } catch (e) { console.warn('补充预存 ICE 候选失败:', e) }
              }
              this.pendingPrePcIce = []
            }
            console.log('✅ 已应用挂起的 Answer')
          } else {
            console.warn('⚠️ 非 have-local-offer 状态，暂不应用挂起 Answer:', this.peerConnection.signalingState)
          }
        } finally {
          this.pendingRemoteAnswer = null
        }
      }

      this.sendOffer(offer)
      console.log('📞 Offer创建并发送成功')
    } catch (error) {
      console.error('❌ 创建Offer失败:', error)
      throw error
    }
  }

  /**
   * 发送Offer
   */
  private sendOffer(offer: RTCSessionDescriptionInit): void {
    if (this.socket && this.isConnected && this.callConfig) {
      this.socket.emit('webrtc:offer', {
        callId: this.callConfig.callId,
        targetUserId: this.callConfig.targetUserId,
        offer,
        type: this.callConfig.type
      })
    }
  }

  /**
   * 发送Answer
   */
  private sendAnswer(answer: RTCSessionDescriptionInit): void {
    if (this.socket && this.isConnected && this.callConfig) {
      this.socket.emit('webrtc:answer', {
        callId: this.callConfig.callId,
        targetUserId: this.callConfig.targetUserId,
        answer
      })
    }
  }

  /**
   * 发送ICE候选
   */
  private sendIceCandidate(candidate: RTCIceCandidate): void {
    if (this.socket && this.isConnected && this.callConfig) {
      this.socket.emit('webrtc:ice-candidate', {
        callId: this.callConfig.callId,
        targetUserId: this.callConfig.targetUserId,
        candidate: candidate.toJSON()
      })
    }
  }

  /**
   * 处理来电
   */
  private handleIncomingCall(data: any): void {
    console.log('📞 收到来电:', data)

    const incomingCallData: IncomingCallData = {
      callId: data.callId,
      type: data.type,
      fromUserId: data.fromUserId,
      fromUserInfo: data.caller || {
        id: data.fromUserId,
        name: `用户${data.fromUserId}`,
        avatar: ''
      },
      timestamp: Date.now()
    }

    this.emit('incoming-call', incomingCallData)
  }

  /**
   * 处理Offer
   */
  private async handleOffer(data: SocketOfferData): Promise<void> {
    if (!this.peerConnection) {
      // PC 尚未就绪：先挂起 Offer，待 PC 创建后消化
      this.pendingRemoteOffer = data.offer
      console.warn('⚠️ 收到Offer但PeerConnection未初始化，已挂起等待PC创建')
      return
    }

    try {
      console.log('📞 收到Offer')

      // 去重：相同SDP的Offer重复到达，直接忽略
      if (this.lastRemoteOfferSdp && this.lastRemoteOfferSdp === data.offer?.sdp) {
        console.log('↩️ 忽略重复的Offer')
        return
      }

      // 只在稳定状态下接受新的Offer，避免信令对撞/状态错误
      if (this.peerConnection.signalingState !== 'stable') {
        console.warn('⚠️ 非stable状态下收到Offer，已忽略:', this.peerConnection.signalingState)
        return
      }

      await this.peerConnection.setRemoteDescription(data.offer)
      this.lastRemoteOfferSdp = data.offer?.sdp || null

      // 处理排队的ICE候选
      for (const candidate of this.iceCandidatesQueue) {
        await this.peerConnection.addIceCandidate(candidate)
      }
      this.iceCandidatesQueue = []

      // 创建并发送Answer
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      this.sendAnswer(answer)
      console.log('📞 Answer创建并发送成功')
    } catch (error) {
      console.error('❌ 处理Offer失败:', error)
    }
  }

  /**
   * 处理Answer
   */
  private async handleAnswer(data: SocketAnswerData): Promise<void> {
    if (!this.peerConnection) {
      // PC 尚未就绪：先挂起 Answer，待创建 Offer 后再应用
      this.pendingRemoteAnswer = data.answer
      console.warn('⚠️ 收到Answer但PeerConnection未初始化，已挂起等待本地Offer后应用')
      return
    }

    try {
      console.log('📞 收到Answer')

      // 去重：如果已经应用过相同的Answer，直接忽略
      if (this.lastRemoteAnswerSdp && this.lastRemoteAnswerSdp === data.answer?.sdp) {
        console.log('↩️ 忽略重复的Answer')
        return
      }

      // 状态保护：仅在 have-local-offer 时接受 Answer
      const state = this.peerConnection.signalingState
      if (state !== 'have-local-offer') {
        console.warn('⚠️ 非 have-local-offer 状态下收到 Answer，已忽略:', state)
        return
      }

      await this.peerConnection.setRemoteDescription(data.answer)
      // dd dd ICE dddddd
      if (this.pendingPrePcIce.length > 0) {
        for (const cand of this.pendingPrePcIce) {
          try { await this.peerConnection.addIceCandidate(cand) } catch (e) { console.warn('d dd ICE dddd:', e) }
        }
        this.pendingPrePcIce = []
      }
      this.lastRemoteAnswerSdp = data.answer?.sdp || null
    } catch (error) {
      console.error('❌ 处理Answer失败:', error)
    }
  }

  /**
   * 处理ICE候选
   */
  private async handleIceCandidate(data: SocketIceCandidateData): Promise<void> {
    if (!this.peerConnection) {
      this.pendingPrePcIce.push(data.candidate)
      console.warn('⚠️ 收到ICE候选但PeerConnection未初始化，已暂存等待PC创建')
      return
    }

    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(data.candidate)
      } else {
        // 如果还没有远程描述，将ICE候选加入队列
        this.iceCandidatesQueue.push(data.candidate)
      }
    } catch (error) {
      console.error('❌ 处理ICE候选失败:', error)
    }
  }

  /**
   * 处理通话状态
   */
  private handleCallStatus(data: SocketCallStatusData): void {
    console.log('📊 收到通话状态更新:', data.status)

    if (data.status === 'answered') {
      // 如果已经处于已连接态，则忽略answered，避免状态回退
      if (this.emittedConnected) {
        console.log('ℹ️ 已处于connected，忽略 answered 状态')
        return
      }
      this.emit('call-accepted')
      // 主叫方收到接听后创建Offer
      if (this.callConfig?.isInitiator) {
        this.createAndSendOffer()
      }
    }
  }

  /**
   * 处理通话结束
   */
  private handleCallEnded(data: any): void {
    console.log('📞 通话已结束:', data.reason)
    this.emit('call-ended', {
      callId: data.callId,
      reason: data.reason,
      duration: data.duration || 0,
      timestamp: Date.now()
    })
  }

  /**
   * 开始网络质量监控
   */
  private startNetworkQualityMonitoring(): void {
    if (!this.peerConnection) return

    // 重置上一次统计
    this.prevInbound = null
    this.prevOutboundBytes = null
    this.prevStatsTs = null

    const monitor = setInterval(async () => {
      try {
        const stats = await this.peerConnection!.getStats()
        const quality = this.calculateNetworkQuality(stats)
        this.emit('network-quality', quality)
      } catch (error) {
        console.error('❌ 网络质量监控失败:', error)
      }
    }, 2000)

    // 保存定时器引用以便清理
    this.networkQualityMonitor = monitor
  }

  private networkQualityMonitor: NodeJS.Timeout | null = null

  /**
   * 计算网络质量
   */
  private calculateNetworkQuality(stats: RTCStatsReport): NetworkQuality {
    let rttMs = 0
    let cumLost = 0
    let cumRecv = 0
    let bytesSent = 0

    stats.forEach((report) => {
      const any: any = report
      // RTT（秒 -> 毫秒），选择当前提名的候选对
      if (report.type === 'candidate-pair' && any.nominated && any.currentRoundTripTime != null) {
        rttMs = Math.round(any.currentRoundTripTime * 1000)
      }
      // 下行统计：本地 inbound-rtp（累计）
      if (report.type === 'inbound-rtp' && !any.isRemote) {
        cumLost += Number(any.packetsLost || 0)
        cumRecv += Number(any.packetsReceived || 0)
      }
      // 上行累计字节：outbound-rtp
      if (report.type === 'outbound-rtp' && !any.isRemote) {
        bytesSent += Number(any.bytesSent || 0)
      }
    })

    // 计算丢包率（基于累计值的时间差分）
    let lossPercent = 0
    if (this.prevInbound) {
      const dLost = Math.max(0, cumLost - this.prevInbound.lost)
      const dRecv = Math.max(0, cumRecv - this.prevInbound.recv)
      const total = dLost + dRecv
      if (total > 0) lossPercent = (dLost / total) * 100
    }
    this.prevInbound = { lost: cumLost, recv: cumRecv }

    // 计算上行码率（kbps）
    let bandwidthKbps = 0
    const now = Date.now()
    if (this.prevOutboundBytes != null && this.prevStatsTs != null) {
      const deltaBytes = Math.max(0, bytesSent - this.prevOutboundBytes)
      const deltaSec = Math.max(0.5, (now - this.prevStatsTs) / 1000)
      bandwidthKbps = Math.round((deltaBytes * 8) / 1000 / deltaSec)
    }
    this.prevOutboundBytes = bytesSent
    this.prevStatsTs = now

    // 等级阈值：使用 RTT + 丢包率
    let level: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent'
    if (rttMs > 300 || lossPercent > 5) {
      level = 'poor'
    } else if (rttMs > 200 || lossPercent > 2) {
      level = 'fair'
    } else if (rttMs > 100 || lossPercent > 1) {
      level = 'good'
    }

    return { level, rtt: rttMs, packetLoss: Number(lossPercent.toFixed(2)), bandwidth: bandwidthKbps }
  }

  /**
   * 获取远程媒体流
   */
  public getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * 事件监听
   */
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
          console.error(`信令事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {
    //    
    if (this.networkQualityMonitor) {
      clearInterval(this.networkQualityMonitor)
      this.networkQualityMonitor = null
    }
    // 重置上一轮网络质量统计缓存
    this.prevInbound = null
    this.prevOutboundBytes = null
    this.prevStatsTs = null

    if (this.peerConnection) {
      this.peerConnection.ontrack = null as any
      this.peerConnection.onicecandidate = null as any
      this.peerConnection.onconnectionstatechange = null as any
      this.peerConnection.oniceconnectionstatechange = null as any
      this.peerConnection.close()
      this.peerConnection = null
    }

    //   Socket   Call    
    //  this.socket.disconnect()

    //     
    this.remoteStream = null
    this.pendingLocalStream = null
    this.callConfig = null
    this.iceCandidatesQueue = []
    this.lastRemoteOfferSdp = null
    this.lastRemoteAnswerSdp = null
    this.emittedConnected = false
    this.pendingRemoteOffer = null
    this.pendingRemoteAnswer = null
    this.pendingPrePcIce = []

    //    CallManager 
    // this.eventListeners.clear()
    // this.isConnected = false

    console.log('    Socket ')
  }
}

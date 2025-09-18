import Peer from 'simple-peer'
import { io, Socket } from 'socket.io-client'

export interface CallOptions {
  video: boolean
  audio: boolean
}

export interface CallEvent {
  type: 'incoming-call' | 'call-accepted' | 'call-rejected' | 'call-ended' | 'user-online' | 'user-offline'
  from?: string
  to?: string
  callType?: 'voice' | 'video'
  signal?: any
}

export class WebRTCService {
  private static instance: WebRTCService
  private socket: Socket | null = null
  private peer: Peer.Instance | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private currentUserId: string = ''
  private isInitiator: boolean = false
  
  // 事件回调
  private onIncomingCall?: (from: string, callType: 'voice' | 'video') => void
  private onCallAccepted?: () => void
  private onCallRejected?: () => void
  private onCallEnded?: () => void
  private onRemoteStream?: (stream: MediaStream) => void
  private onLocalStream?: (stream: MediaStream) => void
  private onError?: (error: string) => void

  private constructor() {}

  static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService()
    }
    return WebRTCService.instance
  }

  // 初始化服务
  async initialize(userId: string) {
    this.currentUserId = userId
    await this.connectSocket()
    this.setupSocketListeners()
  }

  // 连接Socket服务器
  private async connectSocket() {
    try {
      this.socket = io('http://localhost:8894', {
        auth: {
          userId: this.currentUserId,
          token: localStorage.getItem('yeyu_auth_token')
        }
      })

      this.socket.on('connect', () => {
        console.log('✅ WebRTC信令服务器连接成功')
      })

      this.socket.on('disconnect', () => {
        console.log('❌ WebRTC信令服务器连接断开')
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebRTC信令服务器连接失败:', error)
        this.onError?.('信令服务器连接失败')
      })
    } catch (error) {
      console.error('❌ Socket连接失败:', error)
      this.onError?.('网络连接失败')
    }
  }

  // 设置Socket事件监听
  private setupSocketListeners() {
    if (!this.socket) return

    // 收到来电
    this.socket.on('incoming-call', (data: { from: string, callType: 'voice' | 'video', signal: any }) => {
      console.log('📞 收到来电:', data)
      this.onIncomingCall?.(data.from, data.callType)
    })

    // 通话被接受
    this.socket.on('call-accepted', (data: { signal: any }) => {
      console.log('✅ 通话被接受')
      if (this.peer && !this.peer.destroyed) {
        this.peer.signal(data.signal)
      }
      this.onCallAccepted?.()
    })

    // 通话被拒绝
    this.socket.on('call-rejected', () => {
      console.log('❌ 通话被拒绝')
      this.cleanup()
      this.onCallRejected?.()
    })

    // 通话结束
    this.socket.on('call-ended', () => {
      console.log('📞 通话结束')
      this.cleanup()
      this.onCallEnded?.()
    })

    // WebRTC信令
    this.socket.on('webrtc-signal', (data: { signal: any }) => {
      if (this.peer && !this.peer.destroyed) {
        this.peer.signal(data.signal)
      }
    })
  }

  // 发起通话
  async makeCall(targetUserId: string, options: CallOptions): Promise<boolean> {
    try {
      console.log('📞 发起通话:', targetUserId, options)
      
      // 获取本地媒体流
      this.localStream = await this.getUserMedia(options)
      this.onLocalStream?.(this.localStream)

      // 创建Peer连接（作为发起方）
      this.isInitiator = true
      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      })

      this.setupPeerListeners()

      // 发送通话请求
      this.socket?.emit('make-call', {
        to: targetUserId,
        callType: options.video ? 'video' : 'voice'
      })

      return true
    } catch (error) {
      console.error('❌ 发起通话失败:', error)
      this.onError?.('发起通话失败')
      return false
    }
  }

  // 接受通话
  async acceptCall(fromUserId: string, options: CallOptions): Promise<boolean> {
    try {
      console.log('✅ 接受通话:', fromUserId, options)

      // 获取本地媒体流
      this.localStream = await this.getUserMedia(options)
      this.onLocalStream?.(this.localStream)

      // 创建Peer连接（作为接收方）
      this.isInitiator = false
      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      })

      this.setupPeerListeners()

      // 发送接受通话信号
      this.socket?.emit('accept-call', {
        to: fromUserId
      })

      return true
    } catch (error) {
      console.error('❌ 接受通话失败:', error)
      this.onError?.('接受通话失败')
      return false
    }
  }

  // 拒绝通话
  rejectCall(fromUserId: string) {
    console.log('❌ 拒绝通话:', fromUserId)
    this.socket?.emit('reject-call', { to: fromUserId })
    this.cleanup()
  }

  // 结束通话
  endCall() {
    console.log('📞 结束通话')
    this.socket?.emit('end-call')
    this.cleanup()
  }

  // 设置Peer事件监听
  private setupPeerListeners() {
    if (!this.peer) return

    this.peer.on('signal', (signal) => {
      console.log('📡 发送WebRTC信令')
      this.socket?.emit('webrtc-signal', { signal })
    })

    this.peer.on('stream', (stream) => {
      console.log('📹 收到远程媒体流')
      this.remoteStream = stream
      this.onRemoteStream?.(stream)
    })

    this.peer.on('connect', () => {
      console.log('🔗 WebRTC连接建立成功')
    })

    this.peer.on('error', (error) => {
      console.error('❌ WebRTC连接错误:', error)
      this.onError?.('连接错误')
    })

    this.peer.on('close', () => {
      console.log('🔗 WebRTC连接关闭')
      this.cleanup()
    })
  }

  // 获取用户媒体
  private async getUserMedia(options: CallOptions): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: options.audio,
      video: options.video ? {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      } : false
    }

    return await navigator.mediaDevices.getUserMedia(constraints)
  }

  // 切换静音
  toggleMute(): boolean {
    if (!this.localStream) return false

    const audioTracks = this.localStream.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = !track.enabled
    })

    return !audioTracks[0]?.enabled
  }

  // 切换摄像头
  toggleCamera(): boolean {
    if (!this.localStream) return false

    const videoTracks = this.localStream.getVideoTracks()
    videoTracks.forEach(track => {
      track.enabled = !track.enabled
    })

    return !videoTracks[0]?.enabled
  }

  // 切换前后摄像头
  async switchCamera(): Promise<boolean> {
    if (!this.localStream) return false

    try {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (!videoTrack) return false

      const constraints = videoTrack.getConstraints()
      const currentFacingMode = constraints.facingMode
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'

      videoTrack.stop()

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      this.localStream.removeTrack(videoTrack)
      this.localStream.addTrack(newVideoTrack)

      // 更新Peer连接中的轨道
      if (this.peer && !this.peer.destroyed) {
        this.peer.replaceTrack(videoTrack, newVideoTrack, this.localStream)
      }

      return true
    } catch (error) {
      console.error('❌ 切换摄像头失败:', error)
      return false
    }
  }

  // 清理资源
  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop())
      this.remoteStream = null
    }

    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy()
      this.peer = null
    }
  }

  // 断开连接
  disconnect() {
    this.cleanup()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // 设置事件回调
  setEventHandlers(handlers: {
    onIncomingCall?: (from: string, callType: 'voice' | 'video') => void
    onCallAccepted?: () => void
    onCallRejected?: () => void
    onCallEnded?: () => void
    onRemoteStream?: (stream: MediaStream) => void
    onLocalStream?: (stream: MediaStream) => void
    onError?: (error: string) => void
  }) {
    this.onIncomingCall = handlers.onIncomingCall
    this.onCallAccepted = handlers.onCallAccepted
    this.onCallRejected = handlers.onCallRejected
    this.onCallEnded = handlers.onCallEnded
    this.onRemoteStream = handlers.onRemoteStream
    this.onLocalStream = handlers.onLocalStream
    this.onError = handlers.onError
  }

  // 获取当前状态
  getStatus() {
    return {
      isConnected: this.socket?.connected || false,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
      isPeerConnected: this.peer && !this.peer.destroyed
    }
  }
}

export const webrtcService = WebRTCService.getInstance()

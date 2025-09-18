/**
 * WebRTC PeerConnection 管理服务
 * 处理 P2P 连接建立、信令交换和连接管理
 */

import { mediaService } from './mediaService'

export interface CallConfig {
  callId: string
  isInitiator: boolean
  targetUserId: string
  type: 'voice' | 'video'
}

export interface ConnectionStats {
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  iceGatheringState: RTCIceGatheringState
  signalingState: RTCSignalingState
}

export type CallEventType = 
  | 'connectionStateChange'
  | 'iceCandidate'
  | 'remoteStream'
  | 'dataChannel'
  | 'error'

export interface CallEvent {
  type: CallEventType
  data: any
}

class PeerConnectionService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private eventListeners: Map<CallEventType, Function[]> = new Map()
  private callConfig: CallConfig | null = null
  private isConnected = false

  // WebRTC 配置
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
   * 初始化 PeerConnection
   */
  async initializePeerConnection(config: CallConfig): Promise<void> {
    try {
      console.log('🔗 初始化 PeerConnection:', config)
      
      this.callConfig = config
      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration)
      
      this.setupPeerConnectionEventListeners()
      
      // 如果是发起方，创建数据通道
      if (config.isInitiator) {
        this.dataChannel = this.peerConnection.createDataChannel('callControl', {
          ordered: true
        })
        this.setupDataChannelEventListeners(this.dataChannel)
      }

      console.log('✅ PeerConnection 初始化完成')
    } catch (error) {
      console.error('❌ PeerConnection 初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置 PeerConnection 事件监听
   */
  private setupPeerConnectionEventListeners(): void {
    if (!this.peerConnection) return

    // 连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      console.log('🔗 连接状态变化:', state)
      
      this.isConnected = state === 'connected'
      this.emit('connectionStateChange', { state })
    }

    // ICE 连接状态变化
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState
      console.log('🧊 ICE 连接状态变化:', state)
    }

    // ICE 候选者
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 发现 ICE 候选者')
        this.emit('iceCandidate', { candidate: event.candidate })
      }
    }

    // 远程流
    this.peerConnection.ontrack = (event) => {
      console.log('📡 接收到远程媒体流')
      this.remoteStream = event.streams[0]
      this.emit('remoteStream', { stream: this.remoteStream })
    }

    // 数据通道
    this.peerConnection.ondatachannel = (event) => {
      console.log('📊 接收到数据通道')
      this.dataChannel = event.channel
      this.setupDataChannelEventListeners(this.dataChannel)
      this.emit('dataChannel', { channel: this.dataChannel })
    }

    // 信令状态变化
    this.peerConnection.onsignalingstatechange = () => {
      const state = this.peerConnection?.signalingState
      console.log('📡 信令状态变化:', state)
    }
  }

  /**
   * 设置数据通道事件监听
   */
  private setupDataChannelEventListeners(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('📊 数据通道已打开')
    }

    channel.onclose = () => {
      console.log('📊 数据通道已关闭')
    }

    channel.onmessage = (event) => {
      console.log('📊 收到数据通道消息:', event.data)
      try {
        const message = JSON.parse(event.data)
        this.handleDataChannelMessage(message)
      } catch (error) {
        console.warn('⚠️ 数据通道消息解析失败:', error)
      }
    }

    channel.onerror = (error) => {
      console.error('❌ 数据通道错误:', error)
    }
  }

  /**
   * 处理数据通道消息
   */
  private handleDataChannelMessage(message: any): void {
    switch (message.type) {
      case 'mute':
        console.log('🔇 对方静音状态:', message.muted)
        break
      case 'video':
        console.log('📹 对方视频状态:', message.enabled)
        break
      case 'quality':
        console.log('📊 对方网络质量:', message.quality)
        break
      default:
        console.log('📊 未知数据通道消息:', message)
    }
  }

  /**
   * 添加本地媒体流
   */
  async addLocalStream(stream: MediaStream): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection 未初始化')
      }

      console.log('📹 添加本地媒体流')
      this.localStream = stream

      // 添加所有轨道到 PeerConnection
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream)
        console.log(`✅ 添加 ${track.kind} 轨道`)
      })

    } catch (error) {
      console.error('❌ 添加本地媒体流失败:', error)
      throw error
    }
  }

  /**
   * 创建 Offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection 未初始化')
      }

      console.log('📞 创建 Offer')
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callConfig?.type === 'video'
      })

      await this.peerConnection.setLocalDescription(offer)
      console.log('✅ Offer 创建成功')
      
      return offer
    } catch (error) {
      console.error('❌ 创建 Offer 失败:', error)
      throw error
    }
  }

  /**
   * 创建 Answer（幂等/容错）
   * - 仅在 have-remote-offer 时创建 Answer
   * - 重复/时序异常时安全忽略并返回已存在的本地 Answer（若有）
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      const pc = this.peerConnection
      if (!pc) throw new Error('PeerConnection 未初始化')

      const state = pc.signalingState
      const localType = pc.localDescription?.type
      const remoteType = pc.remoteDescription?.type

      // 若已存在本地 Answer，直接返回，避免重复 setLocalDescription 报错
      if (localType === 'answer' && pc.localDescription) {
        console.info('ℹ️ 已存在本地 Answer，跳过重复创建')
        return pc.localDescription
      }

      // 主叫侧（have-local-offer）不应创建 Answer
      if (state === 'have-local-offer') {
        console.info('ℹ️ 当前为主叫/已有本地 Offer，忽略创建 Answer')
        throw new Error('InvalidState: have-local-offer cannot create answer')
      }

      // 设置远端 Offer：仅当尚未设置或 SDP 不同时再设置
      if (!pc.remoteDescription || pc.remoteDescription.sdp !== offer.sdp) {
        if (remoteType && remoteType !== 'offer') {
          console.info('ℹ️ 远端描述已存在且非 offer，忽略设置远端 Offer:', remoteType)
        } else {
          console.log('📞 设置远端 Offer')
          await pc.setRemoteDescription(offer)
        }
      }

      // 仅在 have-remote-offer 状态下创建 Answer
      if (pc.signalingState !== 'have-remote-offer') {
        console.info('ℹ️ 当前信令状态非 have-remote-offer，跳过创建 Answer:', pc.signalingState)
        // 返回现有本地 Answer（若存在），否则抛出以便上层忽略此次时序
        if (pc.localDescription?.type === 'answer') return pc.localDescription
        throw new Error(`InvalidState: ${pc.signalingState}`)
      }

      const answer = await pc.createAnswer()
      try {
        await pc.setLocalDescription(answer)
      } catch (e: any) {
        const msg = String(e?.message || '')
        if (e?.name === 'InvalidModificationError' || /does not match the previously generated SDP/i.test(msg)) {
          console.info('ℹ️ setLocalDescription(answer) 冲突，返回当前本地描述')
          if (pc.localDescription?.type === 'answer') return pc.localDescription
        }
        if (e?.name === 'InvalidStateError' || /Called in wrong state|stable/i.test(msg)) {
          console.info('ℹ️ setLocalDescription(answer) 时机已过/状态不符，忽略')
          if (pc.localDescription?.type === 'answer') return pc.localDescription
          throw e
        }
        throw e
      }

      console.log('✅ Answer 创建成功')
      return answer
    } catch (error) {
      console.error('❌ 创建 Answer 失败:', error)
      throw error
    }
  }

  /**
   * 设置远程描述
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection 未初始化')
      }

      const pc = this.peerConnection
      const state = pc.signalingState

      // 若已进入稳定态或已存在远端Answer，静默忽略
      if (state === 'stable') {
        console.info('ℹ️ 已处于 stable，忽略设置远程 Answer')
        return
      }
      if (pc.remoteDescription?.type === 'answer') {
        console.info('ℹ️ 已存在远端 Answer，忽略重复设置')
        return
      }
      if (state !== 'have-local-offer') {
        console.info('ℹ️ 当前信令状态非 have-local-offer，忽略设置远程 Answer:', state)
        return
      }

      console.log('📞 设置远程 Answer')
      await pc.setRemoteDescription(answer)
      console.log('✅ 远程 Answer 设置成功')
    } catch (error: any) {
      // 时序竞争下可能在 setRemoteDescription 期间变为 stable，属可忽略情况
      const msg = String(error?.message || '')
      if (error?.name === 'InvalidStateError' || /Wrong state|Called in wrong state|stable/i.test(msg)) {
        console.info('ℹ️ 设置远程 Answer 时机已过（已稳定/重复），忽略')
        return
      }
      console.error('❌ 设置远程 Answer 失败:', error)
      throw error
    }
  }

  /**
   * 添加 ICE 候选者
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection 未初始化')
      }

      await this.peerConnection.addIceCandidate(candidate)
      console.log('✅ ICE 候选者添加成功')
    } catch (error) {
      console.error('❌ 添加 ICE 候选者失败:', error)
      throw error
    }
  }

  /**
   * 发送数据通道消息
   */
  sendDataChannelMessage(message: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ 数据通道未打开，无法发送消息')
    }
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): ConnectionStats | null {
    if (!this.peerConnection) return null

    return {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      iceGatheringState: this.peerConnection.iceGatheringState,
      signalingState: this.peerConnection.signalingState
    }
  }

  /**
   * 获取 PeerConnection 实例
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  /**
   * 获取详细统计信息
   */
  async getDetailedStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null

    try {
      return await this.peerConnection.getStats()
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error)
      return null
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    console.log('🔌 关闭 PeerConnection')

    // 关闭数据通道
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    // 关闭 PeerConnection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    this.remoteStream = null
    this.isConnected = false
    this.callConfig = null
    
    console.log('✅ PeerConnection 已关闭')
  }

  /**
   * 事件监听器管理
   */
  on(event: CallEventType, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: CallEventType, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: CallEventType, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ 事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  // Getters
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  getCallConfig(): CallConfig | null {
    return this.callConfig
  }

  isConnectionEstablished(): boolean {
    return this.isConnected
  }
}

// 导出单例
export const peerConnectionService = new PeerConnectionService()
export default peerConnectionService

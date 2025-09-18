/**
 * 直播管理器
 * 处理直播推流、观看、互动等功能
 */

export interface LiveStream {
  id: string
  title: string
  description: string
  streamerId: string
  streamerName: string
  streamerAvatar: string
  category: string
  tags: string[]
  status: 'preparing' | 'live' | 'ended' | 'paused'
  viewerCount: number
  likeCount: number
  shareCount: number
  startTime?: number
  endTime?: number
  duration?: number
  thumbnail: string
  streamUrl?: string
  playbackUrl?: string
  quality: 'low' | 'medium' | 'high' | 'ultra'
  isPrivate: boolean
  allowComments: boolean
  allowGifts: boolean
}

export interface LiveComment {
  id: string
  streamId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: number
  type: 'text' | 'emoji' | 'gift'
  metadata?: Record<string, any>
}

export interface LiveGift {
  id: string
  name: string
  icon: string
  price: number // 叶语豆价格
  animation: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effects: string[]
}

export interface LiveGiftRecord {
  id: string
  streamId: string
  giftId: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  quantity: number
  totalPrice: number
  timestamp: number
}

export interface StreamQuality {
  resolution: string
  bitrate: number
  fps: number
  codec: string
}

export interface StreamStats {
  viewerCount: number
  peakViewers: number
  totalViews: number
  duration: number
  bitrate: number
  fps: number
  droppedFrames: number
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

export class LiveStreamManager {
  private currentStream: LiveStream | null = null
  private localStream: MediaStream | null = null
  private remoteStreams: Map<string, MediaStream> = new Map()
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()
  
  // 直播数据
  private liveStreams: Map<string, LiveStream> = new Map()
  private comments: Map<string, LiveComment[]> = new Map()
  private gifts: Map<string, LiveGift> = new Map()
  private giftRecords: LiveGiftRecord[] = []
  
  // 推流相关
  private mediaRecorder: MediaRecorder | null = null
  private isStreaming: boolean = false
  private streamStats: StreamStats | null = null

  constructor() {
    this.initializeGifts()
    this.loadStreamData()
  }

  // 初始化礼物系统
  private initializeGifts(): void {
    const defaultGifts: LiveGift[] = [
      {
        id: 'heart',
        name: '爱心',
        icon: '❤️',
        price: 1,
        animation: 'bounce',
        rarity: 'common',
        effects: ['sparkle']
      },
      {
        id: 'flower',
        name: '鲜花',
        icon: '🌹',
        price: 5,
        animation: 'float',
        rarity: 'common',
        effects: ['petals']
      },
      {
        id: 'diamond',
        name: '钻石',
        icon: '💎',
        price: 50,
        animation: 'shine',
        rarity: 'rare',
        effects: ['sparkle', 'glow']
      },
      {
        id: 'crown',
        name: '皇冠',
        icon: '👑',
        price: 100,
        animation: 'royal',
        rarity: 'epic',
        effects: ['golden', 'sparkle', 'glow']
      },
      {
        id: 'rocket',
        name: '火箭',
        icon: '🚀',
        price: 500,
        animation: 'launch',
        rarity: 'legendary',
        effects: ['explosion', 'trail', 'screen_shake']
      }
    ]

    defaultGifts.forEach(gift => {
      this.gifts.set(gift.id, gift)
    })
  }

  // 开始直播
  async startStreaming(streamConfig: {
    title: string
    description: string
    category: string
    tags: string[]
    quality: StreamQuality
    isPrivate: boolean
    allowComments: boolean
    allowGifts: boolean
  }): Promise<LiveStream> {
    if (this.isStreaming) {
      throw new Error('已有直播在进行中')
    }

    try {
      // 获取媒体流
      await this.getLocalMediaStream(streamConfig.quality)

      // 创建直播对象
      const stream: LiveStream = {
        id: this.generateStreamId(),
        title: streamConfig.title,
        description: streamConfig.description,
        streamerId: 'current-user',
        streamerName: '我',
        streamerAvatar: '',
        category: streamConfig.category,
        tags: streamConfig.tags,
        status: 'preparing',
        viewerCount: 0,
        likeCount: 0,
        shareCount: 0,
        startTime: Date.now(),
        thumbnail: await this.generateThumbnail(),
        quality: streamConfig.quality.resolution as any,
        isPrivate: streamConfig.isPrivate,
        allowComments: streamConfig.allowComments,
        allowGifts: streamConfig.allowGifts
      }

      this.currentStream = stream
      this.liveStreams.set(stream.id, stream)

      // 开始推流
      await this.startMediaRecording()

      // 更新状态
      stream.status = 'live'
      this.isStreaming = true

      // 初始化统计
      this.initializeStreamStats()

      this.emit('streamStarted', stream)
      return stream

    } catch (error) {
      console.error('开始直播失败:', error)
      throw error
    }
  }

  // 停止直播
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming || !this.currentStream) {
      return
    }

    try {
      // 停止媒体录制
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }

      // 停止本地流
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      // 关闭所有连接
      this.peerConnections.forEach(pc => pc.close())
      this.peerConnections.clear()

      // 更新直播状态
      this.currentStream.status = 'ended'
      this.currentStream.endTime = Date.now()
      this.currentStream.duration = this.currentStream.endTime - (this.currentStream.startTime || 0)

      this.isStreaming = false
      this.saveStreamData()

      this.emit('streamEnded', this.currentStream)
      this.currentStream = null

    } catch (error) {
      console.error('停止直播失败:', error)
      throw error
    }
  }

  // 暂停直播
  pauseStreaming(): boolean {
    if (!this.currentStream || this.currentStream.status !== 'live') {
      return false
    }

    this.currentStream.status = 'paused'
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }

    this.emit('streamPaused', this.currentStream)
    return true
  }

  // 恢复直播
  resumeStreaming(): boolean {
    if (!this.currentStream || this.currentStream.status !== 'paused') {
      return false
    }

    this.currentStream.status = 'live'
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }

    this.emit('streamResumed', this.currentStream)
    return true
  }

  // 观看直播
  async watchStream(streamId: string): Promise<MediaStream | null> {
    try {
      const stream = this.liveStreams.get(streamId)
      if (!stream || stream.status !== 'live') {
        throw new Error('直播不存在或已结束')
      }

      // 增加观看人数
      stream.viewerCount++

      // 创建WebRTC连接观看直播
      const remoteStream = await this.createViewerConnection(streamId)
      
      this.emit('streamJoined', { streamId, viewerCount: stream.viewerCount })
      return remoteStream

    } catch (error) {
      console.error('观看直播失败:', error)
      throw error
    }
  }

  // 离开直播
  leaveStream(streamId: string): void {
    const stream = this.liveStreams.get(streamId)
    if (stream) {
      stream.viewerCount = Math.max(0, stream.viewerCount - 1)
    }

    // 关闭连接
    const pc = this.peerConnections.get(streamId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(streamId)
    }

    // 移除远程流
    this.remoteStreams.delete(streamId)

    this.emit('streamLeft', { streamId, viewerCount: stream?.viewerCount || 0 })
  }

  // 发送评论
  async sendComment(streamId: string, content: string): Promise<LiveComment> {
    const stream = this.liveStreams.get(streamId)
    if (!stream) {
      throw new Error('直播不存在')
    }

    if (!stream.allowComments) {
      throw new Error('该直播不允许评论')
    }

    const comment: LiveComment = {
      id: this.generateCommentId(),
      streamId,
      userId: 'current-user',
      userName: '我',
      userAvatar: '',
      content,
      timestamp: Date.now(),
      type: 'text'
    }

    // 添加到评论列表
    if (!this.comments.has(streamId)) {
      this.comments.set(streamId, [])
    }
    this.comments.get(streamId)!.push(comment)

    // 限制评论数量
    const comments = this.comments.get(streamId)!
    if (comments.length > 1000) {
      this.comments.set(streamId, comments.slice(-1000))
    }

    this.emit('commentAdded', comment)
    return comment
  }

  // 发送礼物
  async sendGift(
    streamId: string,
    giftId: string,
    quantity: number = 1
  ): Promise<LiveGiftRecord> {
    const stream = this.liveStreams.get(streamId)
    if (!stream) {
      throw new Error('直播不存在')
    }

    if (!stream.allowGifts) {
      throw new Error('该直播不允许送礼物')
    }

    const gift = this.gifts.get(giftId)
    if (!gift) {
      throw new Error('礼物不存在')
    }

    const totalPrice = gift.price * quantity

    // 这里应该检查用户叶语豆余额
    // 暂时跳过余额检查

    const giftRecord: LiveGiftRecord = {
      id: this.generateGiftRecordId(),
      streamId,
      giftId,
      senderId: 'current-user',
      senderName: '我',
      receiverId: stream.streamerId,
      receiverName: stream.streamerName,
      quantity,
      totalPrice,
      timestamp: Date.now()
    }

    this.giftRecords.push(giftRecord)

    // 创建礼物评论
    const giftComment: LiveComment = {
      id: this.generateCommentId(),
      streamId,
      userId: 'current-user',
      userName: '我',
      userAvatar: '',
      content: `送出了 ${quantity} 个${gift.name}`,
      timestamp: Date.now(),
      type: 'gift',
      metadata: { gift, quantity, giftRecord }
    }

    if (!this.comments.has(streamId)) {
      this.comments.set(streamId, [])
    }
    this.comments.get(streamId)!.push(giftComment)

    this.emit('giftSent', { giftRecord, comment: giftComment })
    return giftRecord
  }

  // 点赞直播
  likeStream(streamId: string): boolean {
    const stream = this.liveStreams.get(streamId)
    if (!stream) {
      return false
    }

    stream.likeCount++
    this.emit('streamLiked', { streamId, likeCount: stream.likeCount })
    return true
  }

  // 分享直播
  shareStream(streamId: string): boolean {
    const stream = this.liveStreams.get(streamId)
    if (!stream) {
      return false
    }

    stream.shareCount++
    this.emit('streamShared', { streamId, shareCount: stream.shareCount })
    return true
  }

  // 获取本地媒体流
  private async getLocalMediaStream(quality: StreamQuality): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: parseInt(quality.resolution.split('x')[0]) },
          height: { ideal: parseInt(quality.resolution.split('x')[1]) },
          frameRate: { ideal: quality.fps }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      this.emit('localStreamReady', this.localStream)

    } catch (error) {
      console.error('获取媒体流失败:', error)
      throw new Error('无法访问摄像头或麦克风')
    }
  }

  // 开始媒体录制
  private async startMediaRecording(): Promise<void> {
    if (!this.localStream) {
      throw new Error('本地媒体流未准备好')
    }

    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      }

      this.mediaRecorder = new MediaRecorder(this.localStream, options)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.handleRecordedData(event.data)
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('媒体录制错误:', event)
        this.emit('recordingError', event)
      }

      this.mediaRecorder.start(1000) // 每秒生成数据

    } catch (error) {
      console.error('开始媒体录制失败:', error)
      throw error
    }
  }

  // 处理录制数据
  private handleRecordedData(data: Blob): void {
    // 这里应该将数据推送到流媒体服务器
    // 现在只是模拟处理
    console.log('录制数据:', data.size, 'bytes')
    
    // 更新统计信息
    if (this.streamStats) {
      this.streamStats.bitrate = data.size * 8 // 简化计算
    }
  }

  // 生成缩略图
  private async generateThumbnail(): Promise<string> {
    if (!this.localStream) {
      return ''
    }

    try {
      const video = document.createElement('video')
      video.srcObject = this.localStream
      video.play()

      await new Promise(resolve => {
        video.onloadedmetadata = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      return canvas.toDataURL('image/jpeg', 0.8)

    } catch (error) {
      console.error('生成缩略图失败:', error)
      return ''
    }
  }

  // 创建观看者连接
  private async createViewerConnection(streamId: string): Promise<MediaStream | null> {
    try {
      // 这里应该实现WebRTC连接逻辑
      // 现在返回模拟的远程流
      const mockStream = new MediaStream()
      this.remoteStreams.set(streamId, mockStream)
      
      return mockStream

    } catch (error) {
      console.error('创建观看者连接失败:', error)
      return null
    }
  }

  // 初始化流统计
  private initializeStreamStats(): void {
    this.streamStats = {
      viewerCount: 0,
      peakViewers: 0,
      totalViews: 0,
      duration: 0,
      bitrate: 0,
      fps: 0,
      droppedFrames: 0,
      networkQuality: 'good'
    }

    // 定期更新统计
    const updateStats = () => {
      if (!this.isStreaming || !this.currentStream) {
        return
      }

      if (this.streamStats) {
        this.streamStats.duration = Date.now() - (this.currentStream.startTime || 0)
        this.streamStats.viewerCount = this.currentStream.viewerCount
        this.streamStats.peakViewers = Math.max(this.streamStats.peakViewers, this.currentStream.viewerCount)
      }

      this.emit('statsUpdated', this.streamStats)
      setTimeout(updateStats, 5000) // 每5秒更新
    }

    updateStats()
  }

  // 获取直播列表
  getLiveStreams(): LiveStream[] {
    return Array.from(this.liveStreams.values())
      .filter(stream => stream.status === 'live')
      .sort((a, b) => b.viewerCount - a.viewerCount)
  }

  // 获取直播评论
  getStreamComments(streamId: string): LiveComment[] {
    return this.comments.get(streamId) || []
  }

  // 获取礼物列表
  getAvailableGifts(): LiveGift[] {
    return Array.from(this.gifts.values())
  }

  // 获取当前直播
  getCurrentStream(): LiveStream | null {
    return this.currentStream
  }

  // 获取流统计
  getStreamStats(): StreamStats | null {
    return this.streamStats
  }

  // 保存直播数据
  private saveStreamData(): void {
    try {
      const streams = Array.from(this.liveStreams.entries())
      localStorage.setItem('leaftalk_live_streams', JSON.stringify(streams))
      
      localStorage.setItem('leaftalk_live_gift_records', JSON.stringify(this.giftRecords))
    } catch (error) {
      console.error('保存直播数据失败:', error)
    }
  }

  // 加载直播数据
  private loadStreamData(): void {
    try {
      const saved = localStorage.getItem('leaftalk_live_streams')
      if (saved) {
        const streams = JSON.parse(saved)
        this.liveStreams = new Map(streams)
      }

      const savedGifts = localStorage.getItem('leaftalk_live_gift_records')
      if (savedGifts) {
        this.giftRecords = JSON.parse(savedGifts)
      }
    } catch (error) {
      console.error('加载直播数据失败:', error)
    }
  }

  // 生成ID
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateGiftRecordId(): string {
    return `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 事件监听
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('直播事件处理错误:', error)
        }
      })
    }
  }

  // 销毁实例
  destroy(): void {
    this.stopStreaming()
    this.eventListeners.clear()
    this.liveStreams.clear()
    this.comments.clear()
    this.gifts.clear()
    this.giftRecords = []
  }
}

// 创建全局实例
export const liveStreamManager = new LiveStreamManager()

export default LiveStreamManager

/**
 * 直播流管理器
 * 处理直播推流、拉流和实时互动
 */

export interface LiveStreamConfig {
  video: {
    width: number
    height: number
    frameRate: number
    bitrate: number
  }
  audio: {
    sampleRate: number
    bitrate: number
    channels: number
  }
}

export interface LiveRoom {
  id: string
  title: string
  description: string
  cover: string
  category: string
  streamer: {
    id: string
    name: string
    avatar: string
    followers: number
  }
  viewerCount: number
  likeCount: number
  status: 'preparing' | 'live' | 'ended'
  startTime?: number
  endTime?: number
  streamUrl?: string
  chatEnabled: boolean
  giftEnabled: boolean
}

export interface LiveMessage {
  id: string
  type: 'chat' | 'gift' | 'join' | 'leave' | 'like'
  user: {
    id: string
    name: string
    avatar: string
    level?: number
  }
  content?: string
  gift?: {
    id: string
    name: string
    icon: string
    value: number
    count: number
  }
  timestamp: number
}

export interface LiveGift {
  id: string
  name: string
  icon: string
  animation: string
  value: number
  category: string
}

class LiveStreamManager {
  private mediaRecorder: MediaRecorder | null = null
  private localStream: MediaStream | null = null
  private isStreaming: boolean = false
  private isConnected: boolean = false
  private currentRoom: LiveRoom | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private websocket: WebSocket | null = null
  private messageQueue: LiveMessage[] = []

  // 默认配置
  private defaultConfig: LiveStreamConfig = {
    video: {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrate: 2500
    },
    audio: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    }
  }

  constructor() {
    this.setupEventHandlers()
  }

  // 设置事件处理器
  private setupEventHandlers() {
    window.addEventListener('beforeunload', () => {
      this.stopStreaming()
    })
  }

  // 获取推荐直播间
  async getRecommendedRooms(): Promise<LiveRoom[]> {
    // 模拟获取推荐直播间
    return [
      {
        id: 'room1',
        title: '今晚一起看星星 🌟',
        description: '和大家一起欣赏美丽的夜空',
        cover: 'https://picsum.photos/400/300?random=1',
        category: '生活',
        streamer: {
          id: 'user1',
          name: '星空观察者',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=star',
          followers: 15420
        },
        viewerCount: 1234,
        likeCount: 5678,
        status: 'live',
        startTime: Date.now() - 3600000,
        streamUrl: 'wss://live.example.com/room1',
        chatEnabled: true,
        giftEnabled: true
      },
      {
        id: 'room2',
        title: '深夜电台 📻',
        description: '分享音乐和故事',
        cover: 'https://picsum.photos/400/300?random=2',
        category: '音乐',
        streamer: {
          id: 'user2',
          name: 'DJ小夜',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dj',
          followers: 8932
        },
        viewerCount: 567,
        likeCount: 2341,
        status: 'live',
        startTime: Date.now() - 1800000,
        streamUrl: 'wss://live.example.com/room2',
        chatEnabled: true,
        giftEnabled: true
      },
      {
        id: 'room3',
        title: '游戏直播间 🎮',
        description: '一起来玩游戏吧',
        cover: 'https://picsum.photos/400/300?random=3',
        category: '游戏',
        streamer: {
          id: 'user3',
          name: '游戏达人',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gamer',
          followers: 23456
        },
        viewerCount: 2345,
        likeCount: 9876,
        status: 'live',
        startTime: Date.now() - 7200000,
        streamUrl: 'wss://live.example.com/room3',
        chatEnabled: true,
        giftEnabled: true
      }
    ]
  }

  // 获取直播礼物列表
  getGiftList(): LiveGift[] {
    return [
      {
        id: 'heart',
        name: '小心心',
        icon: '❤️',
        animation: 'bounce',
        value: 1,
        category: 'basic'
      },
      {
        id: 'flower',
        name: '鲜花',
        icon: '🌹',
        animation: 'float',
        value: 5,
        category: 'basic'
      },
      {
        id: 'cake',
        name: '蛋糕',
        icon: '🎂',
        animation: 'spin',
        value: 10,
        category: 'food'
      },
      {
        id: 'diamond',
        name: '钻石',
        icon: '💎',
        animation: 'sparkle',
        value: 50,
        category: 'luxury'
      },
      {
        id: 'crown',
        name: '皇冠',
        icon: '👑',
        animation: 'glow',
        value: 100,
        category: 'luxury'
      },
      {
        id: 'rocket',
        name: '火箭',
        icon: '🚀',
        animation: 'fly',
        value: 500,
        category: 'special'
      }
    ]
  }

  // 开始直播
  async startStreaming(roomConfig: Partial<LiveRoom>, streamConfig?: Partial<LiveStreamConfig>): Promise<boolean> {
    try {
      // 获取媒体流
      const config = { ...this.defaultConfig, ...streamConfig }
      this.localStream = await this.getMediaStream(config)

      // 创建直播间
      this.currentRoom = {
        id: this.generateRoomId(),
        title: roomConfig.title || '我的直播间',
        description: roomConfig.description || '',
        cover: roomConfig.cover || '',
        category: roomConfig.category || '生活',
        streamer: {
          id: 'current-user',
          name: '我',
          avatar: '',
          followers: 0
        },
        viewerCount: 0,
        likeCount: 0,
        status: 'preparing',
        startTime: Date.now(),
        chatEnabled: true,
        giftEnabled: true,
        ...roomConfig
      }

      // 设置媒体录制器
      this.setupMediaRecorder(config)

      // 连接直播服务器
      await this.connectToLiveServer()

      // 开始推流
      this.mediaRecorder?.start()
      this.isStreaming = true
      this.currentRoom.status = 'live'

      this.emit('streaming_started', this.currentRoom)
      return true

    } catch (error) {
      console.error('开始直播失败:', error)
      this.emit('streaming_error', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  // 停止直播
  stopStreaming(): boolean {
    try {
      // 停止录制
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }

      // 停止媒体流
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      // 断开WebSocket连接
      if (this.websocket) {
        this.websocket.close()
        this.websocket = null
      }

      // 更新状态
      this.isStreaming = false
      if (this.currentRoom) {
        this.currentRoom.status = 'ended'
        this.currentRoom.endTime = Date.now()
      }

      this.emit('streaming_stopped', this.currentRoom)
      this.currentRoom = null

      return true

    } catch (error) {
      console.error('停止直播失败:', error)
      return false
    }
  }

  // 加入直播间
  async joinRoom(roomId: string): Promise<boolean> {
    try {
      // 连接直播间WebSocket
      await this.connectToRoom(roomId)

      this.emit('room_joined', { roomId })
      return true

    } catch (error) {
      console.error('加入直播间失败:', error)
      return false
    }
  }

  // 离开直播间
  leaveRoom(): boolean {
    try {
      if (this.websocket) {
        this.websocket.close()
        this.websocket = null
      }

      // 更新连接状态
      this.isConnected = false

      this.emit('room_left')
      return true

    } catch (error) {
      console.error('离开直播间失败:', error)
      return false
    }
  }

  // 发送聊天消息
  sendChatMessage(content: string): boolean {
    try {
      const message: LiveMessage = {
        id: this.generateMessageId(),
        type: 'chat',
        user: {
          id: 'current-user',
          name: '我',
          avatar: '',
          level: 1
        },
        content,
        timestamp: Date.now()
      }

      this.sendMessage(message)
      return true

    } catch (error) {
      console.error('发送消息失败:', error)
      return false
    }
  }

  // 发送礼物
  sendGift(giftId: string, count: number = 1): boolean {
    try {
      const giftList = this.getGiftList()
      const gift = giftList.find(g => g.id === giftId)
      
      if (!gift) {
        throw new Error('礼物不存在')
      }

      const message: LiveMessage = {
        id: this.generateMessageId(),
        type: 'gift',
        user: {
          id: 'current-user',
          name: '我',
          avatar: '',
          level: 1
        },
        gift: {
          id: gift.id,
          name: gift.name,
          icon: gift.icon,
          value: gift.value,
          count
        },
        timestamp: Date.now()
      }

      this.sendMessage(message)
      return true

    } catch (error) {
      console.error('发送礼物失败:', error)
      return false
    }
  }

  // 点赞
  sendLike(): boolean {
    try {
      const message: LiveMessage = {
        id: this.generateMessageId(),
        type: 'like',
        user: {
          id: 'current-user',
          name: '我',
          avatar: '',
          level: 1
        },
        timestamp: Date.now()
      }

      this.sendMessage(message)
      return true

    } catch (error) {
      console.error('发送点赞失败:', error)
      return false
    }
  }

  // 获取媒体流
  private async getMediaStream(config: LiveStreamConfig): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: config.video.width },
        height: { ideal: config.video.height },
        frameRate: { ideal: config.video.frameRate }
      },
      audio: {
        sampleRate: { ideal: config.audio.sampleRate },
        channelCount: { ideal: config.audio.channels }
      }
    }

    return await navigator.mediaDevices.getUserMedia(constraints)
  }

  // 设置媒体录制器
  private setupMediaRecorder(config: LiveStreamConfig) {
    if (!this.localStream) return

    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: config.video.bitrate * 1000,
      audioBitsPerSecond: config.audio.bitrate * 1000
    }

    this.mediaRecorder = new MediaRecorder(this.localStream, options)

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.sendStreamData(event.data)
      }
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event)
      this.emit('streaming_error', { error: 'Recording error' })
    }
  }

  // 连接直播服务器
  private async connectToLiveServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://live.example.com/stream/${this.currentRoom?.id}`
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        resolve()
      }

      this.websocket.onerror = (error) => {
        reject(error)
      }

      this.websocket.onmessage = (event) => {
        this.handleServerMessage(JSON.parse(event.data))
      }
    })
  }

  // 连接直播间 (模拟连接)
  private async connectToRoom(roomId: string): Promise<void> {
    return new Promise((resolve) => {
      // 模拟连接延迟
      setTimeout(() => {
        console.log('已连接到直播间:', roomId)

        // 模拟连接成功
        this.isConnected = true

        // 模拟接收消息
        this.simulateRoomMessages(roomId)

        resolve()
      }, 1000)
    })
  }

  // 模拟直播间消息
  private simulateRoomMessages(roomId: string): void {
    // 模拟定期接收消息
    const messageInterval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(messageInterval)
        return
      }

      // 模拟随机消息
      const messages = [
        { type: 'chat', content: '欢迎来到直播间！', user: { name: '观众' + Math.floor(Math.random() * 1000), level: 1 } },
        { type: 'like', user: { name: '粉丝' + Math.floor(Math.random() * 1000), level: 2 } },
        { type: 'join', user: { name: '新观众' + Math.floor(Math.random() * 1000), level: 0 } }
      ]

      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      this.emit('message_received', {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...randomMessage
      })
    }, 3000 + Math.random() * 5000) // 3-8秒随机间隔
  }

  // 发送流数据
  private sendStreamData(data: Blob) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // 在实际实现中，这里需要将Blob转换为适合传输的格式
      // 这里只是模拟
      console.log('发送流数据:', data.size, 'bytes')
    }
  }

  // 发送消息
  private sendMessage(message: LiveMessage) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    } else {
      // 如果连接断开，将消息加入队列
      this.messageQueue.push(message)
    }
  }

  // 处理服务器消息
  private handleServerMessage(message: any) {
    switch (message.type) {
      case 'viewer_count':
        if (this.currentRoom) {
          this.currentRoom.viewerCount = message.count
          this.emit('viewer_count_updated', message.count)
        }
        break
      case 'stream_quality':
        this.emit('stream_quality_updated', message.quality)
        break
    }
  }

  // 处理直播间消息
  private handleRoomMessage(message: LiveMessage) {
    this.emit('message_received', message)
  }

  // 生成房间ID
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 生成消息ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 事件监听
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  // 移除事件监听
  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emit(event: string, data?: any) {
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

  // 获取当前状态
  getStreamingStatus() {
    return {
      isStreaming: this.isStreaming,
      currentRoom: this.currentRoom,
      hasLocalStream: !!this.localStream
    }
  }

  // 清理资源
  destroy() {
    this.stopStreaming()
    this.eventListeners.clear()
  }
}

// 创建全局实例
export const liveStreamManager = new LiveStreamManager()

export default LiveStreamManager

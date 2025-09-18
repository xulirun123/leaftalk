# APP移动端消息系统完整方案

## 🎯 项目定位和目标

### 项目特点
- **主要平台**: APP移动端 (Android/iOS)
- **开发框架**: Vue3 + Vite (混合APP开发)
- **存储策略**: 前端缓存为主，服务器备份为辅
- **用户体验**: 原生APP级别的流畅体验

### 核心目标
- 支持10+种消息类型的完整聊天系统
- 基于SQLite的高性能本地存储
- 精确的未读计数和实时消息更新
- 完善的数据管理和隐私保护
- 离线优先的使用体验

## 📊 完整技术架构

### 前端架构
```
APP移动端架构
├── Vue3 + Vite (前端框架)
├── Pinia (状态管理)
├── 统一实时服务 (WebSocket)
├── MySQL (服务器数据库)
├── 本地缓存 (IndexedDB/localStorage)
├── 文件系统 (媒体缓存)
└── 原生API桥接 (相机、定位、通话等)
```

### 存储架构
```
混合存储体系
├── 内存层 (当前会话数据)
│   ├── 当前聊天消息
│   ├── 聊天列表状态
│   └── 未读计数缓存
├── 本地缓存层 (离线支持)
│   ├── IndexedDB (结构化数据缓存)
│   ├── localStorage (设置和状态)
│   └── CacheStorage (媒体文件缓存)
├── MySQL数据库层 (服务器端)
│   ├── 消息记录表
│   ├── 聊天列表表
│   ├── 用户信息表
│   ├── 未读计数表
│   └── 媒体文件索引表
└── 文件系统层 (媒体存储)
    ├── 服务器文件存储
    └── 本地媒体缓存
```

## 🎤 完整功能模块设计

### 1. 文本消息模块
```typescript
interface TextMessageModule {
  // 基础功能
  sendText(content: string, chatId: string): Promise<Message>
  receiveText(messageData: any): Promise<void>
  
  // 高级功能
  sendMention(content: string, mentionUsers: string[]): Promise<Message>
  sendEmoji(emojiCode: string): Promise<Message>
  formatText(content: string): string
  
  // 草稿功能
  saveDraft(chatId: string, content: string): Promise<void>
  loadDraft(chatId: string): Promise<string>
  clearDraft(chatId: string): Promise<void>
}
```

### 2. 语音消息模块
```typescript
interface VoiceMessageModule {
  // 录音功能
  startRecording(): Promise<void>
  stopRecording(): Promise<AudioBlob>
  cancelRecording(): void
  pauseRecording(): void
  resumeRecording(): void
  
  // 语音发送
  sendVoice(audioBlob: AudioBlob, duration: number): Promise<Message>
  
  // 语音播放
  playVoice(message: Message): Promise<void>
  pauseVoice(): void
  stopVoice(): void
  seekVoice(position: number): void
  
  // 语音转文字
  transcribeVoice(audioBlob: AudioBlob): Promise<string>
  enableAutoTranscription(enabled: boolean): void
  
  // 语音输入
  startVoiceInput(): Promise<void>
  stopVoiceInput(): Promise<string>
  
  // 语音增强
  noiseReduction(audioBlob: AudioBlob): Promise<AudioBlob>
  volumeNormalization(audioBlob: AudioBlob): Promise<AudioBlob>
}
```

### 3. 图片消息模块
```typescript
interface ImageMessageModule {
  // 拍照功能
  takePhoto(options?: CameraOptions): Promise<ImageBlob>
  takeMultiplePhotos(): Promise<ImageBlob[]>
  
  // 图片选择
  selectImage(multiple?: boolean): Promise<ImageBlob[]>
  selectFromAlbum(): Promise<ImageBlob[]>
  
  // 图片编辑
  cropImage(imageBlob: ImageBlob, cropArea: CropArea): Promise<ImageBlob>
  rotateImage(imageBlob: ImageBlob, angle: number): Promise<ImageBlob>
  addFilter(imageBlob: ImageBlob, filter: string): Promise<ImageBlob>
  addText(imageBlob: ImageBlob, text: string, position: Position): Promise<ImageBlob>
  
  // 图片发送
  sendImage(imageBlob: ImageBlob, caption?: string): Promise<Message>
  sendMultipleImages(images: ImageBlob[]): Promise<Message[]>
  
  // 图片预览
  previewImage(message: Message): void
  previewImageGallery(messages: Message[], currentIndex: number): void
  
  // 图片处理
  compressImage(imageBlob: ImageBlob, quality: number): Promise<ImageBlob>
  generateThumbnail(imageBlob: ImageBlob): Promise<ImageBlob>
  getImageInfo(imageBlob: ImageBlob): Promise<ImageInfo>
}
```

### 4. 视频消息模块
```typescript
interface VideoMessageModule {
  // 录制功能
  startVideoRecording(options?: VideoOptions): Promise<void>
  stopVideoRecording(): Promise<VideoBlob>
  pauseVideoRecording(): void
  resumeVideoRecording(): void
  
  // 视频选择
  selectVideo(): Promise<VideoBlob>
  
  // 视频编辑
  trimVideo(videoBlob: VideoBlob, startTime: number, endTime: number): Promise<VideoBlob>
  addVideoFilter(videoBlob: VideoBlob, filter: string): Promise<VideoBlob>
  
  // 视频发送
  sendVideo(videoBlob: VideoBlob, thumbnail?: ImageBlob): Promise<Message>
  
  // 视频播放
  playVideo(message: Message): void
  pauseVideo(): void
  seekVideo(position: number): void
  setVideoVolume(volume: number): void
  
  // 视频处理
  compressVideo(videoBlob: VideoBlob, quality: string): Promise<VideoBlob>
  generateVideoThumbnail(videoBlob: VideoBlob, timePosition?: number): Promise<ImageBlob>
  getVideoInfo(videoBlob: VideoBlob): Promise<VideoInfo>
}
```

### 5. 位置消息模块
```typescript
interface LocationMessageModule {
  // 位置获取
  getCurrentLocation(highAccuracy?: boolean): Promise<LocationInfo>
  watchPosition(callback: (location: LocationInfo) => void): Promise<number>
  clearWatch(watchId: number): void
  
  // 位置选择
  selectLocationFromMap(): Promise<LocationInfo>
  searchLocation(query: string): Promise<LocationInfo[]>
  getNearbyPOI(location: LocationInfo): Promise<POIInfo[]>
  
  // 位置发送
  sendLocation(location: LocationInfo): Promise<Message>
  sendCurrentLocation(): Promise<Message>
  
  // 实时位置共享
  startLocationSharing(chatId: string, duration: number): Promise<void>
  stopLocationSharing(chatId: string): void
  updateSharedLocation(chatId: string, location: LocationInfo): Promise<void>
  
  // 位置显示
  showLocationOnMap(message: Message): void
  getLocationPreview(location: LocationInfo): Promise<ImageBlob>
  calculateDistance(loc1: LocationInfo, loc2: LocationInfo): number
  
  // 地址解析
  reverseGeocode(location: LocationInfo): Promise<string>
  geocode(address: string): Promise<LocationInfo>
}
```

### 6. 红包转账模块
```typescript
interface PaymentMessageModule {
  // 红包功能
  sendRedpacket(params: RedpacketParams): Promise<Message>
  claimRedpacket(redpacketId: string): Promise<ClaimResult>
  getRedpacketDetail(redpacketId: string): Promise<RedpacketDetail>
  getRedpacketHistory(): Promise<RedpacketRecord[]>
  
  // 转账功能
  sendTransfer(params: TransferParams): Promise<Message>
  acceptTransfer(transferId: string): Promise<TransferResult>
  rejectTransfer(transferId: string): Promise<void>
  getTransferDetail(transferId: string): Promise<TransferDetail>
  
  // 支付验证
  verifyPaymentPassword(password: string): Promise<boolean>
  enableBiometricPayment(): Promise<boolean>
  
  // 余额管理
  getWalletBalance(): Promise<number>
  getPaymentMethods(): Promise<PaymentMethod[]>
  
  // 交易记录
  getTransactionHistory(): Promise<Transaction[]>
  exportTransactionRecord(startDate: Date, endDate: Date): Promise<string>
}
```

### 7. 通话模块
```typescript
interface CallMessageModule {
  // 通话发起
  startVoiceCall(userId: string): Promise<CallSession>
  startVideoCall(userId: string): Promise<CallSession>
  startGroupCall(userIds: string[], type: 'voice' | 'video'): Promise<CallSession>
  
  // 通话控制
  answerCall(callId: string): Promise<void>
  rejectCall(callId: string, reason?: string): Promise<void>
  endCall(callId: string): Promise<void>
  
  // 通话中功能
  muteAudio(muted: boolean): void
  muteVideo(muted: boolean): void
  switchCamera(): void
  enableSpeaker(enabled: boolean): void
  
  // 通话质量
  getCallQuality(): CallQuality
  adjustCallQuality(quality: 'low' | 'medium' | 'high'): void
  
  // 通话记录
  saveCallRecord(callSession: CallSession): Promise<Message>
  getCallHistory(): Promise<CallRecord[]>
  deleteCallRecord(callId: string): Promise<void>
  
  // 通话设置
  setCallRingtone(ringtone: string): void
  enableCallWaiting(enabled: boolean): void
  enableCallForwarding(enabled: boolean, forwardTo?: string): void
}
```

### 8. 名片消息模块
```typescript
interface ContactCardModule {
  // 名片发送
  sendContactCard(contactInfo: ContactInfo): Promise<Message>
  sendMyCard(): Promise<Message>
  sendMultipleCards(contacts: ContactInfo[]): Promise<Message[]>
  
  // 名片接收
  receiveContactCard(message: Message): Promise<void>
  previewContactCard(message: Message): ContactInfo
  
  // 联系人操作
  addContactFromCard(message: Message): Promise<boolean>
  updateContactFromCard(message: Message): Promise<boolean>
  
  // 名片管理
  createContactCard(userInfo: UserInfo): ContactInfo
  updateContactCard(contactInfo: ContactInfo): Promise<void>
  getContactCard(userId: string): Promise<ContactInfo>
  
  // 名片分享
  shareContactCard(contactInfo: ContactInfo, method: 'qr' | 'link'): Promise<string>
  scanContactQR(): Promise<ContactInfo>
}
```

### 9. 文件消息模块
```typescript
interface FileMessageModule {
  // 文件选择
  selectFile(types?: string[]): Promise<FileBlob>
  selectMultipleFiles(): Promise<FileBlob[]>
  selectFromCloud(): Promise<FileBlob[]>
  
  // 文件发送
  sendFile(fileBlob: FileBlob): Promise<Message>
  sendMultipleFiles(files: FileBlob[]): Promise<Message[]>
  
  // 文件接收
  downloadFile(message: Message): Promise<string>
  previewFile(message: Message): void
  
  // 文件管理
  getFileInfo(fileBlob: FileBlob): FileInfo
  compressFile(fileBlob: FileBlob): Promise<FileBlob>
  encryptFile(fileBlob: FileBlob, password: string): Promise<FileBlob>
  
  // 文件分享
  shareFile(message: Message, method: 'system' | 'app'): Promise<void>
  saveFileToDevice(message: Message): Promise<boolean>
  
  // 文件预览
  previewDocument(message: Message): void
  previewSpreadsheet(message: Message): void
  previewPresentation(message: Message): void
}
```

### 10. 系统消息模块
```typescript
interface SystemMessageModule {
  // 系统通知
  sendSystemNotification(type: string, content: string, chatId: string): Promise<Message>
  
  // 群组消息
  sendJoinGroupMessage(userId: string, groupId: string): Promise<Message>
  sendLeaveGroupMessage(userId: string, groupId: string): Promise<Message>
  sendGroupNameChangeMessage(oldName: string, newName: string): Promise<Message>
  
  // 状态消息
  sendTypingIndicator(chatId: string): Promise<void>
  sendOnlineStatusMessage(status: 'online' | 'offline'): Promise<void>
  
  // 撤回消息
  recallMessage(messageId: string): Promise<boolean>
  sendRecallNotification(messageId: string): Promise<Message>
  
  // 消息引用
  replyToMessage(originalMessage: Message, replyContent: string): Promise<Message>
  forwardMessage(message: Message, targetChatIds: string[]): Promise<Message[]>
}
```

## 🔄 核心业务流程设计

### 消息发送完整流程
```
用户操作 → 消息类型判断 → 媒体处理(如需要) → 创建消息对象
    ↓
立即显示(status: sending) → 保存到SQLite → HTTP API发送 → 实时推送
    ↓                          ↓              ↓            ↓
更新聊天列表最后消息        本地持久化      服务器存储    接收者收到
    ↓                                          ↓
发送成功: 更新status为sent                 发送失败: 重试机制
```

### 消息接收完整流程
```
在线接收:
统一实时服务推送 → 黑名单检查 → 消息去重 → 保存SQLite → 更新UI
                      ↓              ↓           ↓          ↓
                  拒收则忽略      基于ID去重    持久化存储   实时显示
                                                              ↓
                                                        更新聊天列表
                                                              ↓
                                                        更新未读计数

离线接收:
服务器暂存 → 用户上线 → 推送离线消息包 → 批量处理 → 更新本地状态
```

### 未读计数精确管理
```
消息接收时:
检查当前页面状态 → 是当前聊天: 直接标记已读
                    ↓
                非当前聊天: 未读+1 → 更新SQLite → 更新聊天列表 → 更新底部导航

用户进入聊天:
加载消息 → 清除未读计数 → 发送已读回执 → 更新总未读数 → 同步到服务器

离线状态:
服务器记录未读 → 用户上线 → 同步未读计数 → 更新本地数据
```

## 📱 APP混合存储详细设计

### MySQL数据库设计 (服务器端)
```sql
-- 数据库: yeyu_messages
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci

-- 消息表 (支持所有消息类型)
CREATE TABLE messages (
    id VARCHAR(64) PRIMARY KEY COMMENT '消息唯一ID',
    chat_id VARCHAR(64) NOT NULL COMMENT '聊天ID',
    sender_id VARCHAR(64) NOT NULL COMMENT '发送者ID',
    receiver_id VARCHAR(64) NOT NULL COMMENT '接收者ID',
    content TEXT NOT NULL COMMENT '消息内容',
    type ENUM('text','image','voice','video','location','redpacket','transfer','contact_card','file','system') NOT NULL COMMENT '消息类型',
    timestamp BIGINT NOT NULL COMMENT '发送时间戳',
    status ENUM('sending','sent','delivered','read','failed') NOT NULL DEFAULT 'sent' COMMENT '消息状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',

    -- 媒体文件字段
    file_url TEXT,
    local_path TEXT,
    file_size INTEGER,
    duration INTEGER,
    thumbnail_path TEXT,
    file_name TEXT,
    mime_type TEXT,

    -- 位置信息字段
    latitude REAL,
    longitude REAL,
    address TEXT,
    location_name TEXT,

    -- 红包转账字段
    amount REAL,
    payment_id TEXT,
    payment_status TEXT, -- pending,completed,expired,refunded
    payment_remark TEXT,

    -- 名片字段 (JSON格式)
    contact_card_data TEXT,

    -- 引用消息字段
    reply_to_message_id TEXT,
    forward_from_chat_id TEXT,
    forward_from_message_id TEXT,

    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    sync_status INTEGER DEFAULT 0, -- 0:未同步, 1:已同步

    -- 索引
    INDEX idx_chat_timestamp (chat_id, timestamp),
    INDEX idx_timestamp (timestamp),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_sync_status (sync_status)
);

-- 聊天列表表
CREATE TABLE app_chats (
    id TEXT PRIMARY KEY, -- 聊天ID (对方用户ID或群组ID)
    type TEXT NOT NULL, -- private,group
    name TEXT NOT NULL,
    avatar TEXT,
    description TEXT,

    -- 最后消息信息
    last_message TEXT,
    last_message_type TEXT,
    last_message_time INTEGER NOT NULL,
    last_message_sender_id TEXT,

    -- 状态信息
    unread_count INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    is_muted INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,

    -- 在线状态 (私聊)
    is_online INTEGER DEFAULT 0,
    last_seen INTEGER,

    -- 群组信息
    member_count INTEGER,
    group_owner_id TEXT,
    group_admins TEXT, -- JSON数组

    -- 聊天设置
    background_image TEXT,
    custom_ringtone TEXT,

    -- 草稿消息
    draft_message TEXT,
    draft_type TEXT,
    draft_time INTEGER,

    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    -- 索引
    INDEX idx_last_message_time (last_message_time),
    INDEX idx_unread_count (unread_count),
    INDEX idx_is_pinned (is_pinned),
    INDEX idx_type (type)
);

-- 用户信息缓存表
CREATE TABLE app_users (
    id TEXT PRIMARY KEY,
    yeyu_id TEXT UNIQUE,
    username TEXT,
    nickname TEXT,
    avatar TEXT,
    phone TEXT,
    email TEXT,

    -- 状态信息
    is_online INTEGER DEFAULT 0,
    last_seen INTEGER,
    status_message TEXT,

    -- 关系信息
    is_friend INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    friendship_status TEXT, -- pending,accepted,rejected

    -- 缓存时间
    cached_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,

    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    -- 索引
    INDEX idx_yeyu_id (yeyu_id),
    INDEX idx_is_friend (is_friend),
    INDEX idx_expires_at (expires_at)
);

-- 未读计数表
CREATE TABLE app_unreads (
    chat_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    last_message_id TEXT,
    last_read_message_id TEXT,
    last_read_time INTEGER,
    mention_count INTEGER DEFAULT 0, -- @我的消息数
    updated_at INTEGER NOT NULL,

    -- 索引
    INDEX idx_count (count),
    INDEX idx_mention_count (mention_count)
);

-- 应用设置表
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    type TEXT, -- string,number,boolean,json
    category TEXT, -- general,notification,privacy,chat,media
    updated_at INTEGER NOT NULL
);

-- 媒体文件缓存表
CREATE TABLE app_media_cache (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    file_type TEXT NOT NULL, -- image,voice,video,file
    original_url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    download_status TEXT NOT NULL, -- downloading,completed,failed

    -- 缓存策略
    access_count INTEGER DEFAULT 0,
    last_access_time INTEGER NOT NULL,
    expires_at INTEGER,

    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    -- 索引
    INDEX idx_message_id (message_id),
    INDEX idx_chat_id (chat_id),
    INDEX idx_file_type (file_type),
    INDEX idx_expires_at (expires_at)
);

-- 草稿表
CREATE TABLE app_drafts (
    chat_id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- text,voice,image,video,file
    media_path TEXT, -- 媒体草稿的本地路径
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 同步状态表
CREATE TABLE app_sync_status (
    id TEXT PRIMARY KEY,
    last_sync_time INTEGER NOT NULL,
    sync_type TEXT NOT NULL, -- messages,chats,users,settings
    sync_status TEXT NOT NULL, -- syncing,completed,failed
    error_message TEXT,
    updated_at INTEGER NOT NULL
);
```

### 文件系统存储结构
```
APP存储目录结构:
yeyu_app_data/
├── database/
│   └── yeyu_app_messages.db
├── media/
│   ├── images/
│   │   ├── thumbnails/
│   │   ├── originals/
│   │   └── compressed/
│   ├── voices/
│   │   ├── originals/
│   │   └── transcriptions/
│   ├── videos/
│   │   ├── originals/
│   │   ├── thumbnails/
│   │   └── compressed/
│   └── files/
│       ├── documents/
│       ├── archives/
│       └── others/
├── cache/
│   ├── avatars/
│   ├── location_previews/
│   └── temp/
├── logs/
│   ├── app.log
│   ├── sync.log
│   └── error.log
└── backup/
    ├── database_backup/
    └── settings_backup/
```

### 缓存策略设计
```typescript
// 缓存管理策略
interface CacheStrategy {
  // 消息缓存策略
  messages: {
    memoryLimit: 1000,        // 内存中最多保存1000条消息
    diskRetention: {
      text: 365,              // 文本消息保存365天
      media: 30,              // 媒体消息保存30天
      payment: -1,            // 红包转账永久保存
      system: 90              // 系统消息保存90天
    }
  },

  // 媒体文件缓存策略
  media: {
    maxSize: 2048,            // 最大缓存2GB
    autoCleanup: true,        // 自动清理
    compressionQuality: {
      image: 0.8,             // 图片压缩质量80%
      video: 'medium'         // 视频中等质量
    }
  },

  // 用户信息缓存策略
  users: {
    cacheTime: 3600,          // 缓存1小时
    maxEntries: 10000         // 最多缓存10000个用户
  }
}
```

## 🔧 统一存储管理器实现

### AppStorageManager核心类
```typescript
export class AppStorageManager {
  private database: AppDatabase
  private mediaManager: AppMediaManager
  private settingsManager: AppSettingsManager
  private cacheManager: AppCacheManager

  constructor() {
    this.database = new AppDatabase()
    this.mediaManager = new AppMediaManager()
    this.settingsManager = new AppSettingsManager()
    this.cacheManager = new AppCacheManager()
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.database.initialize(),
      this.mediaManager.initialize(),
      this.settingsManager.initialize(),
      this.cacheManager.initialize()
    ])

    // 启动后台任务
    this.startBackgroundTasks()
  }

  // 消息操作
  async saveMessage(message: Message): Promise<void> {
    // 保存到数据库
    await this.database.saveMessage(message)

    // 如果有媒体文件，保存到文件系统
    if (message.localPath) {
      await this.mediaManager.cacheMediaFile(message)
    }

    // 更新聊天列表
    await this.updateChatFromMessage(message)

    // 更新未读计数
    if (!message.isSelf) {
      await this.incrementUnreadCount(message.chatId)
    }
  }

  async loadChatMessages(chatId: string, page: number = 1): Promise<Message[]> {
    // 先从内存缓存获取
    const cachedMessages = this.cacheManager.getCachedMessages(chatId)
    if (cachedMessages && page === 1) {
      return cachedMessages
    }

    // 从数据库加载
    const messages = await this.database.loadChatMessages(chatId, page)

    // 缓存到内存
    if (page === 1) {
      this.cacheManager.cacheMessages(chatId, messages)
    }

    return messages
  }

  // 聊天列表操作
  async getChats(): Promise<Chat[]> {
    // 先从缓存获取
    const cachedChats = this.cacheManager.getCachedChats()
    if (cachedChats) {
      return cachedChats
    }

    // 从数据库加载
    const chats = await this.database.getChats()

    // 缓存到内存
    this.cacheManager.cacheChats(chats)

    return chats
  }

  async updateChat(chat: Chat): Promise<void> {
    await this.database.updateChat(chat)
    this.cacheManager.updateCachedChat(chat)
  }

  // 未读计数操作
  async getUnreadCount(chatId?: string): Promise<number> {
    if (chatId) {
      return this.database.getChatUnreadCount(chatId)
    } else {
      return this.database.getTotalUnreadCount()
    }
  }

  async markAsRead(chatId: string, messageId?: string): Promise<void> {
    await this.database.markAsRead(chatId, messageId)
    this.cacheManager.updateUnreadCount(chatId, 0)
  }

  // 数据清理操作
  async clearChatData(chatId: string): Promise<void> {
    await Promise.all([
      this.database.clearChatData(chatId),
      this.mediaManager.clearChatMedia(chatId),
      this.cacheManager.clearChatCache(chatId)
    ])
  }

  async autoCleanup(): Promise<void> {
    await Promise.all([
      this.database.autoCleanup(),
      this.mediaManager.autoCleanup(),
      this.cacheManager.autoCleanup()
    ])
  }

  // 数据同步
  async syncWithServer(): Promise<void> {
    // 上传未同步的消息
    await this.uploadPendingMessages()

    // 下载新消息
    await this.downloadNewMessages()

    // 同步聊天列表
    await this.syncChatList()

    // 同步用户信息
    await this.syncUserInfo()
  }

  // 后台任务
  private startBackgroundTasks(): void {
    // 定期清理过期数据
    setInterval(() => {
      this.autoCleanup()
    }, 24 * 60 * 60 * 1000) // 每24小时

    // 定期同步数据
    setInterval(() => {
      this.syncWithServer()
    }, 5 * 60 * 1000) // 每5分钟

    // 定期压缩数据库
    setInterval(() => {
      this.database.vacuum()
    }, 7 * 24 * 60 * 60 * 1000) // 每7天
  }
}
```

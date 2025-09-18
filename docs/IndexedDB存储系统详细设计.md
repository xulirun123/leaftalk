# IndexedDB存储系统详细设计

## 🎯 存储目标

IndexedDB作为浏览器端的主要数据存储，需要实现：
- 消息数据的持久化存储
- 聊天列表的本地缓存
- 未读计数的准确记录
- 高效的数据查询和分页
- 自动数据清理机制

## 📊 数据库结构设计

### 数据库基本信息
```typescript
数据库名称: YeYuMessages
版本号: 2
描述: 叶语消息系统本地存储数据库
```

### 对象存储(Object Store)设计

#### 1. messages 表 - 消息存储
```typescript
interface MessageRecord {
  id: string                    // 主键：消息唯一ID
  chatId: string               // 聊天ID（用于索引）
  senderId: string             // 发送者ID
  receiverId: string           // 接收者ID
  content: string              // 消息内容
  type: MessageType            // 消息类型
  timestamp: number            // 发送时间戳（用于索引）
  status: MessageStatus        // 消息状态
  isSelf: boolean             // 是否自己发送
  
  // 媒体文件字段
  fileUrl?: string            // 服务器文件URL
  localPath?: string          // 本地缓存路径
  fileSize?: number           // 文件大小
  duration?: number           // 语音/视频时长
  thumbnail?: string          // 缩略图
  
  // 位置信息字段
  latitude?: number           // 纬度
  longitude?: number          // 经度
  address?: string            // 地址
  
  // 红包转账字段
  amount?: number             // 金额
  paymentId?: string          // 支付ID
  paymentStatus?: string      // 支付状态
  
  // 系统字段
  createdAt: number           // 创建时间
  updatedAt: number           // 更新时间
  isDeleted: boolean          // 软删除标记
}

// 索引设计
indexes: [
  { name: 'chatId', keyPath: 'chatId', unique: false },           // 按聊天查询
  { name: 'timestamp', keyPath: 'timestamp', unique: false },     // 按时间排序
  { name: 'type', keyPath: 'type', unique: false },              // 按类型查询
  { name: 'status', keyPath: 'status', unique: false },          // 按状态查询
  { name: 'chatId_timestamp', keyPath: ['chatId', 'timestamp'], unique: false }, // 复合索引
  { name: 'senderId', keyPath: 'senderId', unique: false },      // 按发送者查询
  { name: 'isDeleted', keyPath: 'isDeleted', unique: false }     // 软删除查询
]
```

#### 2. chats 表 - 聊天列表
```typescript
interface ChatRecord {
  id: string                  // 主键：聊天ID（对方用户ID）
  userId: string              // 对方用户ID
  name: string                // 对方姓名
  avatar: string              // 对方头像
  lastMessage: string         // 最后一条消息内容
  lastMessageType: string     // 最后消息类型
  lastMessageTime: number     // 最后消息时间（用于索引）
  unreadCount: number         // 未读消息数（用于索引）
  isPinned: boolean          // 是否置顶（用于索引）
  isMuted: boolean           // 是否免打扰
  isDeleted: boolean         // 是否已删除
  
  // 在线状态
  isOnline: boolean          // 对方是否在线
  lastSeen?: number          // 最后在线时间
  
  // 草稿消息
  draftMessage?: string      // 草稿内容
  draftTime?: number         // 草稿时间
  
  // 系统字段
  createdAt: number          // 创建时间
  updatedAt: number          // 更新时间
}

// 索引设计
indexes: [
  { name: 'lastMessageTime', keyPath: 'lastMessageTime', unique: false }, // 按时间排序
  { name: 'unreadCount', keyPath: 'unreadCount', unique: false },         // 按未读数查询
  { name: 'isPinned', keyPath: 'isPinned', unique: false },               // 按置顶查询
  { name: 'userId', keyPath: 'userId', unique: false },                   // 按用户ID查询
  { name: 'isDeleted', keyPath: 'isDeleted', unique: false }              // 软删除查询
]
```

#### 3. unreads 表 - 未读计数管理
```typescript
interface UnreadRecord {
  chatId: string              // 主键：聊天ID
  count: number               // 未读消息数（用于索引）
  lastMessageId: string       // 最后一条消息ID
  lastReadMessageId?: string  // 最后已读消息ID
  lastReadTime?: number       // 最后已读时间
  updatedAt: number           // 更新时间（用于索引）
}

// 索引设计
indexes: [
  { name: 'count', keyPath: 'count', unique: false },           // 按未读数查询
  { name: 'updatedAt', keyPath: 'updatedAt', unique: false }    // 按更新时间查询
]
```

#### 4. drafts 表 - 草稿消息
```typescript
interface DraftRecord {
  chatId: string              // 主键：聊天ID
  content: string             // 草稿内容
  type: 'text' | 'voice'      // 草稿类型
  createdAt: number           // 创建时间
  updatedAt: number           // 更新时间（用于索引）
}

// 索引设计
indexes: [
  { name: 'updatedAt', keyPath: 'updatedAt', unique: false }    // 按更新时间查询
]
```

#### 5. settings 表 - 系统设置
```typescript
interface SettingRecord {
  key: string                 // 主键：设置键名
  value: any                  // 设置值
  updatedAt: number           // 更新时间
}

// 常用设置键名
settings: {
  'lastSyncTime': number,           // 最后同步时间
  'currentUserId': string,          // 当前用户ID
  'autoCleanupEnabled': boolean,    // 是否启用自动清理
  'lastCleanupTime': number,        // 最后清理时间
  'cacheSize': number               // 缓存大小
}
```

## 🔧 存储操作规则

### 1. 消息存储规则

#### 新消息存储
```typescript
// 存储新消息的完整流程
const saveMessage = async (message: Message) => {
  // 1. 检查消息是否已存在（去重）
  const existing = await getMessageById(message.id)
  if (existing) {
    console.log('消息已存在，跳过存储')
    return existing
  }
  
  // 2. 添加系统字段
  const messageRecord: MessageRecord = {
    ...message,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDeleted: false
  }
  
  // 3. 存储到messages表
  await messagesStore.add(messageRecord)
  
  // 4. 更新聊天列表
  await updateChatLastMessage(message.chatId, message)
  
  // 5. 更新未读计数（如果不是自己发送的）
  if (!message.isSelf) {
    await incrementUnreadCount(message.chatId)
  }
  
  return messageRecord
}
```

#### 消息查询规则
```typescript
// 分页加载聊天消息
const loadChatMessages = async (chatId: string, page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit
  
  // 使用复合索引查询
  const transaction = db.transaction(['messages'], 'readonly')
  const store = transaction.objectStore('messages')
  const index = store.index('chatId_timestamp')
  
  // 查询指定聊天的消息，按时间倒序
  const range = IDBKeyRange.bound([chatId, 0], [chatId, Date.now()])
  const request = index.openCursor(range, 'prev') // 倒序
  
  const messages: MessageRecord[] = []
  let count = 0
  let skipped = 0
  
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor && count < limit) {
        // 跳过已删除的消息
        if (!cursor.value.isDeleted) {
          if (skipped >= offset) {
            messages.push(cursor.value)
            count++
          } else {
            skipped++
          }
        }
        cursor.continue()
      } else {
        // 返回时间正序的消息
        resolve(messages.reverse())
      }
    }
    
    request.onerror = () => reject(request.error)
  })
}
```

### 2. 聊天列表存储规则

#### 聊天列表更新
```typescript
// 更新聊天的最后一条消息
const updateChatLastMessage = async (chatId: string, message: Message) => {
  const transaction = db.transaction(['chats'], 'readwrite')
  const store = transaction.objectStore('chats')
  
  // 获取现有聊天记录
  let chat = await store.get(chatId)
  
  if (!chat) {
    // 创建新的聊天记录
    chat = {
      id: chatId,
      userId: message.isSelf ? message.receiverId : message.senderId,
      name: await getUserName(message.isSelf ? message.receiverId : message.senderId),
      avatar: await getUserAvatar(message.isSelf ? message.receiverId : message.senderId),
      lastMessage: getMessagePreview(message),
      lastMessageType: message.type,
      lastMessageTime: message.timestamp,
      unreadCount: message.isSelf ? 0 : 1,
      isPinned: false,
      isMuted: false,
      isDeleted: false,
      isOnline: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  } else {
    // 更新现有聊天记录
    chat.lastMessage = getMessagePreview(message)
    chat.lastMessageType = message.type
    chat.lastMessageTime = message.timestamp
    chat.updatedAt = Date.now()
  }
  
  await store.put(chat)
}

// 获取消息预览文本
const getMessagePreview = (message: Message): string => {
  switch (message.type) {
    case 'text': return message.content
    case 'image': return '[图片]'
    case 'voice': return '[语音]'
    case 'video': return '[视频]'
    case 'location': return '[位置]'
    case 'redpacket': return '[红包]'
    case 'transfer': return '[转账]'
    case 'contact_card': return '[名片]'
    case 'file': return '[文件]'
    default: return '[消息]'
  }
}
```

### 3. 未读计数管理规则

#### 未读计数更新
```typescript
// 增加未读计数
const incrementUnreadCount = async (chatId: string) => {
  const transaction = db.transaction(['unreads', 'chats'], 'readwrite')
  const unreadsStore = transaction.objectStore('unreads')
  const chatsStore = transaction.objectStore('chats')
  
  // 更新unreads表
  let unreadRecord = await unreadsStore.get(chatId)
  if (!unreadRecord) {
    unreadRecord = {
      chatId,
      count: 1,
      lastMessageId: '',
      updatedAt: Date.now()
    }
  } else {
    unreadRecord.count++
    unreadRecord.updatedAt = Date.now()
  }
  await unreadsStore.put(unreadRecord)
  
  // 同步更新chats表
  const chat = await chatsStore.get(chatId)
  if (chat) {
    chat.unreadCount = unreadRecord.count
    await chatsStore.put(chat)
  }
}

// 清除未读计数
const clearUnreadCount = async (chatId: string) => {
  const transaction = db.transaction(['unreads', 'chats'], 'readwrite')
  const unreadsStore = transaction.objectStore('unreads')
  const chatsStore = transaction.objectStore('chats')
  
  // 清除unreads表记录
  await unreadsStore.delete(chatId)
  
  // 同步更新chats表
  const chat = await chatsStore.get(chatId)
  if (chat) {
    chat.unreadCount = 0
    await chatsStore.put(chat)
  }
}
```

### 4. 数据清理规则

#### 按类型自动清理
```typescript
// 自动清理过期数据
const autoCleanupExpiredData = async () => {
  const now = Date.now()
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000  // 1年前
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000   // 7天前
  
  const transaction = db.transaction(['messages'], 'readwrite')
  const store = transaction.objectStore('messages')
  const timestampIndex = store.index('timestamp')
  
  // 清理1年前的文本消息
  const textRange = IDBKeyRange.upperBound(oneYearAgo)
  const textCursor = timestampIndex.openCursor(textRange)
  
  textCursor.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result
    if (cursor) {
      const message = cursor.value
      if (message.type === 'text' && !['redpacket', 'transfer'].includes(message.type)) {
        cursor.delete()
      }
      cursor.continue()
    }
  }
  
  // 清理7天前的媒体消息
  const mediaRange = IDBKeyRange.upperBound(sevenDaysAgo)
  const mediaCursor = timestampIndex.openCursor(mediaRange)
  
  mediaCursor.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result
    if (cursor) {
      const message = cursor.value
      if (['image', 'voice', 'video', 'file'].includes(message.type)) {
        cursor.delete()
      }
      cursor.continue()
    }
  }
}
```

## 📈 性能优化策略

### 1. 索引优化
- 使用复合索引 `chatId_timestamp` 提高聊天消息查询性能
- 为常用查询字段建立单独索引
- 避免在大数据量表上进行全表扫描

### 2. 分页策略
- 消息列表采用分页加载，每页20条
- 使用游标(cursor)进行高效分页
- 缓存当前页数据，减少重复查询

### 3. 缓存策略
- 热点聊天数据保持在内存中
- 聊天列表数据实时缓存
- 未读计数数据内存同步

### 4. 事务管理
- 相关操作使用事务保证数据一致性
- 批量操作减少事务开销
- 合理设置事务超时时间

这个IndexedDB存储系统设计确保了数据的完整性、查询的高效性和存储的可靠性。

## 💻 具体实现代码示例

### MessageStorage类实现
```typescript
// src/services/storage/MessageStorage.ts
export class MessageStorage {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'YeYuMessages'
  private readonly DB_VERSION = 2

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(db)
      }
    })
  }

  private createObjectStores(db: IDBDatabase): void {
    // 创建messages表
    if (!db.objectStoreNames.contains('messages')) {
      const messagesStore = db.createObjectStore('messages', { keyPath: 'id' })
      messagesStore.createIndex('chatId', 'chatId', { unique: false })
      messagesStore.createIndex('timestamp', 'timestamp', { unique: false })
      messagesStore.createIndex('type', 'type', { unique: false })
      messagesStore.createIndex('status', 'status', { unique: false })
      messagesStore.createIndex('chatId_timestamp', ['chatId', 'timestamp'], { unique: false })
      messagesStore.createIndex('senderId', 'senderId', { unique: false })
      messagesStore.createIndex('isDeleted', 'isDeleted', { unique: false })
    }

    // 创建chats表
    if (!db.objectStoreNames.contains('chats')) {
      const chatsStore = db.createObjectStore('chats', { keyPath: 'id' })
      chatsStore.createIndex('lastMessageTime', 'lastMessageTime', { unique: false })
      chatsStore.createIndex('unreadCount', 'unreadCount', { unique: false })
      chatsStore.createIndex('isPinned', 'isPinned', { unique: false })
      chatsStore.createIndex('userId', 'userId', { unique: false })
      chatsStore.createIndex('isDeleted', 'isDeleted', { unique: false })
    }

    // 创建unreads表
    if (!db.objectStoreNames.contains('unreads')) {
      const unreadsStore = db.createObjectStore('unreads', { keyPath: 'chatId' })
      unreadsStore.createIndex('count', 'count', { unique: false })
      unreadsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    // 创建drafts表
    if (!db.objectStoreNames.contains('drafts')) {
      const draftsStore = db.createObjectStore('drafts', { keyPath: 'chatId' })
      draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    // 创建settings表
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' })
    }
  }

  // 保存消息
  async saveMessage(message: MessageRecord): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const transaction = this.db.transaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')

    // 添加系统字段
    const messageWithMeta = {
      ...message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false
    }

    await store.put(messageWithMeta)
  }

  // 加载聊天消息
  async loadChatMessages(chatId: string, page: number = 1, limit: number = 20): Promise<MessageRecord[]> {
    if (!this.db) throw new Error('数据库未初始化')

    const offset = (page - 1) * limit
    const transaction = this.db.transaction(['messages'], 'readonly')
    const store = transaction.objectStore('messages')
    const index = store.index('chatId_timestamp')

    const range = IDBKeyRange.bound([chatId, 0], [chatId, Date.now()])

    return new Promise((resolve, reject) => {
      const messages: MessageRecord[] = []
      let count = 0
      let skipped = 0

      const request = index.openCursor(range, 'prev')

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && count < limit) {
          if (!cursor.value.isDeleted) {
            if (skipped >= offset) {
              messages.push(cursor.value)
              count++
            } else {
              skipped++
            }
          }
          cursor.continue()
        } else {
          resolve(messages.reverse())
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // 更新聊天列表
  async updateChat(chat: ChatRecord): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const transaction = this.db.transaction(['chats'], 'readwrite')
    const store = transaction.objectStore('chats')

    const chatWithMeta = {
      ...chat,
      updatedAt: Date.now()
    }

    await store.put(chatWithMeta)
  }

  // 获取聊天列表
  async getChats(): Promise<ChatRecord[]> {
    if (!this.db) throw new Error('数据库未初始化')

    const transaction = this.db.transaction(['chats'], 'readonly')
    const store = transaction.objectStore('chats')
    const index = store.index('lastMessageTime')

    return new Promise((resolve, reject) => {
      const chats: ChatRecord[] = []
      const request = index.openCursor(null, 'prev')

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (!cursor.value.isDeleted) {
            chats.push(cursor.value)
          }
          cursor.continue()
        } else {
          resolve(chats)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // 更新未读计数
  async updateUnreadCount(chatId: string, count: number): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const transaction = this.db.transaction(['unreads', 'chats'], 'readwrite')
    const unreadsStore = transaction.objectStore('unreads')
    const chatsStore = transaction.objectStore('chats')

    // 更新unreads表
    const unreadRecord: UnreadRecord = {
      chatId,
      count,
      lastMessageId: '',
      updatedAt: Date.now()
    }
    await unreadsStore.put(unreadRecord)

    // 同步更新chats表
    const chat = await chatsStore.get(chatId)
    if (chat) {
      chat.unreadCount = count
      await chatsStore.put(chat)
    }
  }

  // 清理聊天数据
  async clearChatData(chatId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const transaction = this.db.transaction(['messages', 'chats', 'unreads', 'drafts'], 'readwrite')

    // 删除消息
    const messagesStore = transaction.objectStore('messages')
    const messagesIndex = messagesStore.index('chatId')
    const messagesRequest = messagesIndex.openCursor(IDBKeyRange.only(chatId))

    messagesRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    // 删除聊天记录
    await transaction.objectStore('chats').delete(chatId)

    // 删除未读计数
    await transaction.objectStore('unreads').delete(chatId)

    // 删除草稿
    await transaction.objectStore('drafts').delete(chatId)
  }

  // 自动清理过期数据
  async autoCleanup(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const now = Date.now()
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    const transaction = this.db.transaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')
    const index = store.index('timestamp')

    // 清理1年前的文本消息（保留红包转账）
    const textRange = IDBKeyRange.upperBound(oneYearAgo)
    const textRequest = index.openCursor(textRange)

    textRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const message = cursor.value
        if (message.type === 'text' && !['redpacket', 'transfer'].includes(message.type)) {
          cursor.delete()
        }
        cursor.continue()
      }
    }

    // 清理7天前的媒体消息
    const mediaRange = IDBKeyRange.upperBound(sevenDaysAgo)
    const mediaRequest = index.openCursor(mediaRange)

    mediaRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const message = cursor.value
        if (['image', 'voice', 'video', 'file'].includes(message.type)) {
          cursor.delete()
        }
        cursor.continue()
      }
    }
  }
}
```

## 🔄 使用示例

### 在messageStore中使用
```typescript
// src/stores/messageStore.ts
import { MessageStorage } from '@/services/storage/MessageStorage'

export const useMessageStore = defineStore('message', () => {
  const storage = new MessageStorage()

  // 初始化
  const initialize = async () => {
    await storage.initialize()
    await loadChats()
  }

  // 发送消息
  const sendMessage = async (content: string, type: string, chatId: string) => {
    const message: MessageRecord = {
      id: generateMessageId(),
      chatId,
      senderId: getCurrentUserId(),
      receiverId: chatId,
      content,
      type,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true
    }

    // 保存到本地
    await storage.saveMessage(message)

    // 更新聊天列表
    await updateChatLastMessage(chatId, message)

    // 发送到服务器
    try {
      await sendToServer(message)
      message.status = 'sent'
      await storage.saveMessage(message)
    } catch (error) {
      message.status = 'failed'
      await storage.saveMessage(message)
    }
  }

  // 接收消息
  const receiveMessage = async (messageData: any) => {
    const message: MessageRecord = {
      ...messageData,
      isSelf: false,
      status: 'delivered'
    }

    // 保存到本地
    await storage.saveMessage(message)

    // 更新聊天列表
    await updateChatLastMessage(message.chatId, message)

    // 更新未读计数
    await storage.updateUnreadCount(message.chatId, getUnreadCount(message.chatId) + 1)
  }

  return {
    initialize,
    sendMessage,
    receiveMessage
  }
})
```

这个详细的IndexedDB存储系统设计提供了完整的数据存储解决方案，确保消息系统的数据持久化和高效查询。

# APP客户端存储方案设计

## 🎯 APP存储需求分析

### 移动端特殊考虑
- **存储空间限制** - 手机存储空间有限，需要高效利用
- **性能要求** - 移动设备性能相对较弱，需要优化存储性能
- **电池续航** - 频繁的磁盘I/O会影响电池续航
- **系统清理** - 系统可能会清理应用数据，需要备份机制
- **离线使用** - 需要支持完全离线的消息查看

### 存储目标
- 消息数据的持久化存储
- 媒体文件的本地缓存
- 快速的数据查询和加载
- 合理的存储空间管理
- 数据安全和隐私保护

## 📱 APP存储技术选型

### 1. 原生APP存储方案

#### Android存储方案
```kotlin
// 主要存储技术
1. SQLite数据库 - 结构化数据存储
2. SharedPreferences - 配置和设置存储
3. 内部存储 - 应用私有文件存储
4. 外部存储 - 媒体文件存储
5. Room数据库 - SQLite的高级封装
```

#### iOS存储方案
```swift
// 主要存储技术
1. Core Data - 对象关系映射数据库
2. SQLite - 轻量级数据库
3. UserDefaults - 用户偏好设置
4. Documents目录 - 用户文档存储
5. Caches目录 - 缓存文件存储
```

### 2. 混合APP存储方案

#### Cordova/PhoneGap
```javascript
// 插件支持
1. cordova-sqlite-storage - SQLite数据库
2. cordova-plugin-file - 文件系统访问
3. cordova-plugin-device - 设备信息
4. WebSQL/IndexedDB - Web存储技术
```

#### React Native
```javascript
// 存储选项
1. AsyncStorage - 键值对存储
2. SQLite - react-native-sqlite-storage
3. Realm - 对象数据库
4. MMKV - 高性能键值存储
5. WatermelonDB - 响应式数据库
```

#### Flutter
```dart
// 存储选项
1. sqflite - SQLite数据库
2. shared_preferences - 偏好设置
3. path_provider - 文件路径获取
4. hive - 轻量级NoSQL数据库
5. moor - 响应式SQLite封装
```

## 🗄️ 推荐存储架构

### 混合存储策略
```
APP存储架构
├── SQLite数据库 (结构化数据)
│   ├── messages表 - 消息记录
│   ├── chats表 - 聊天列表
│   ├── users表 - 用户信息缓存
│   └── settings表 - 应用设置
├── 文件系统 (媒体文件)
│   ├── images/ - 图片缓存
│   ├── voices/ - 语音文件
│   ├── videos/ - 视频文件
│   └── files/ - 其他文件
└── 键值存储 (配置数据)
    ├── 用户偏好设置
    ├── 登录状态
    └── 缓存配置
```

## 📊 SQLite数据库设计

### 数据库结构
```sql
-- 数据库名: yeyu_messages.db
-- 版本: 1.0

-- 消息表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,
    is_self INTEGER NOT NULL,
    
    -- 媒体文件字段
    file_url TEXT,
    local_path TEXT,
    file_size INTEGER,
    duration INTEGER,
    thumbnail TEXT,
    
    -- 位置信息字段
    latitude REAL,
    longitude REAL,
    address TEXT,
    
    -- 红包转账字段
    amount REAL,
    payment_id TEXT,
    payment_status TEXT,
    
    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    
    -- 索引
    INDEX idx_chat_timestamp (chat_id, timestamp),
    INDEX idx_timestamp (timestamp),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- 聊天表
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    last_message TEXT,
    last_message_type TEXT,
    last_message_time INTEGER NOT NULL,
    unread_count INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    is_muted INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    
    -- 在线状态
    is_online INTEGER DEFAULT 0,
    last_seen INTEGER,
    
    -- 草稿消息
    draft_message TEXT,
    draft_time INTEGER,
    
    -- 系统字段
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- 索引
    INDEX idx_last_message_time (last_message_time),
    INDEX idx_unread_count (unread_count),
    INDEX idx_is_pinned (is_pinned)
);

-- 用户信息缓存表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    yeyu_id TEXT,
    nickname TEXT,
    avatar TEXT,
    phone TEXT,
    is_online INTEGER DEFAULT 0,
    last_seen INTEGER,
    updated_at INTEGER NOT NULL
);

-- 设置表
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at INTEGER NOT NULL
);

-- 未读计数表
CREATE TABLE unreads (
    chat_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    last_message_id TEXT,
    last_read_message_id TEXT,
    last_read_time INTEGER,
    updated_at INTEGER NOT NULL
);
```

### 数据库操作封装
```typescript
// 数据库操作类
export class AppMessageDatabase {
  private db: SQLiteDatabase | null = null
  
  async initialize(): Promise<void> {
    // 根据平台选择不同的初始化方式
    if (this.isReactNative()) {
      await this.initializeReactNative()
    } else if (this.isCordova()) {
      await this.initializeCordova()
    } else if (this.isFlutter()) {
      await this.initializeFlutter()
    }
  }
  
  // React Native初始化
  private async initializeReactNative(): Promise<void> {
    const SQLite = require('react-native-sqlite-storage')
    SQLite.DEBUG(true)
    SQLite.enablePromise(true)
    
    this.db = await SQLite.openDatabase({
      name: 'yeyu_messages.db',
      location: 'default',
      createFromLocation: '~yeyu_messages.db'
    })
    
    await this.createTables()
  }
  
  // Cordova初始化
  private async initializeCordova(): Promise<void> {
    this.db = (window as any).sqlitePlugin.openDatabase({
      name: 'yeyu_messages.db',
      location: 'default'
    })
    
    await this.createTables()
  }
  
  // 创建表结构
  private async createTables(): Promise<void> {
    const createTableSQL = `
      -- 这里放入上面的SQL建表语句
    `
    
    await this.db.executeSql(createTableSQL)
  }
  
  // 保存消息
  async saveMessage(message: Message): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO messages 
      (id, chat_id, sender_id, receiver_id, content, type, timestamp, status, is_self, 
       file_url, local_path, file_size, duration, thumbnail, 
       latitude, longitude, address, amount, payment_id, payment_status,
       created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      message.id, message.chatId, message.senderId, message.receiverId,
      message.content, message.type, message.timestamp, message.status, message.isSelf ? 1 : 0,
      message.fileUrl, message.localPath, message.fileSize, message.duration, message.thumbnail,
      message.latitude, message.longitude, message.address, 
      message.amount, message.paymentId, message.paymentStatus,
      Date.now(), Date.now(), 0
    ]
    
    await this.db.executeSql(sql, params)
  }
  
  // 加载聊天消息
  async loadChatMessages(chatId: string, page: number = 1, limit: number = 20): Promise<Message[]> {
    const offset = (page - 1) * limit
    const sql = `
      SELECT * FROM messages 
      WHERE chat_id = ? AND is_deleted = 0 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `
    
    const [results] = await this.db.executeSql(sql, [chatId, limit, offset])
    const messages: Message[] = []
    
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      messages.push(this.rowToMessage(row))
    }
    
    return messages.reverse() // 返回时间正序
  }
  
  // 更新聊天列表
  async updateChat(chat: Chat): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO chats 
      (id, user_id, name, avatar, last_message, last_message_type, last_message_time,
       unread_count, is_pinned, is_muted, is_deleted, is_online, last_seen,
       draft_message, draft_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      chat.id, chat.userId, chat.name, chat.avatar, 
      chat.lastMessage, chat.lastMessageType, chat.lastMessageTime,
      chat.unreadCount, chat.isPinned ? 1 : 0, chat.isMuted ? 1 : 0, 
      chat.isDeleted ? 1 : 0, chat.isOnline ? 1 : 0, chat.lastSeen,
      chat.draftMessage, chat.draftTime, 
      chat.createdAt || Date.now(), Date.now()
    ]
    
    await this.db.executeSql(sql, params)
  }
  
  // 获取聊天列表
  async getChats(): Promise<Chat[]> {
    const sql = `
      SELECT * FROM chats 
      WHERE is_deleted = 0 
      ORDER BY is_pinned DESC, last_message_time DESC
    `
    
    const [results] = await this.db.executeSql(sql)
    const chats: Chat[] = []
    
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      chats.push(this.rowToChat(row))
    }
    
    return chats
  }
  
  // 清理聊天数据
  async clearChatData(chatId: string): Promise<void> {
    const transaction = await this.db.transaction()
    
    try {
      // 删除消息
      await transaction.executeSql(
        'DELETE FROM messages WHERE chat_id = ?', 
        [chatId]
      )
      
      // 删除聊天记录
      await transaction.executeSql(
        'DELETE FROM chats WHERE id = ?', 
        [chatId]
      )
      
      // 删除未读计数
      await transaction.executeSql(
        'DELETE FROM unreads WHERE chat_id = ?', 
        [chatId]
      )
      
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
  
  // 自动清理过期数据
  async autoCleanup(): Promise<void> {
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    // 清理1年前的文本消息（保留红包转账）
    await this.db.executeSql(`
      DELETE FROM messages 
      WHERE timestamp < ? 
      AND type = 'text' 
      AND type NOT IN ('redpacket', 'transfer')
    `, [oneYearAgo])
    
    // 清理7天前的媒体消息
    await this.db.executeSql(`
      DELETE FROM messages 
      WHERE timestamp < ? 
      AND type IN ('image', 'voice', 'video', 'file')
    `, [sevenDaysAgo])
  }
  
  // 数据转换方法
  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      chatId: row.chat_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      status: row.status,
      isSelf: row.is_self === 1,
      fileUrl: row.file_url,
      localPath: row.local_path,
      fileSize: row.file_size,
      duration: row.duration,
      thumbnail: row.thumbnail,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      amount: row.amount,
      paymentId: row.payment_id,
      paymentStatus: row.payment_status
    }
  }
  
  private rowToChat(row: any): Chat {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      avatar: row.avatar,
      lastMessage: row.last_message,
      lastMessageType: row.last_message_type,
      lastMessageTime: row.last_message_time,
      unreadCount: row.unread_count,
      isPinned: row.is_pinned === 1,
      isMuted: row.is_muted === 1,
      isDeleted: row.is_deleted === 1,
      isOnline: row.is_online === 1,
      lastSeen: row.last_seen,
      draftMessage: row.draft_message,
      draftTime: row.draft_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
```

## 📁 文件系统存储管理

### 媒体文件存储策略
```typescript
// 媒体文件管理器
export class AppMediaFileManager {
  private basePath: string = ''

  async initialize(): Promise<void> {
    // 获取应用存储目录
    if (this.isReactNative()) {
      const RNFS = require('react-native-fs')
      this.basePath = RNFS.DocumentDirectoryPath + '/yeyu_media'
    } else if (this.isCordova()) {
      const file = (window as any).cordova.file
      this.basePath = file.dataDirectory + 'yeyu_media'
    }

    // 创建目录结构
    await this.createDirectories()
  }

  private async createDirectories(): Promise<void> {
    const directories = [
      'images',
      'voices',
      'videos',
      'files',
      'thumbnails'
    ]

    for (const dir of directories) {
      await this.createDirectory(`${this.basePath}/${dir}`)
    }
  }

  // 保存媒体文件
  async saveMediaFile(
    fileData: Blob | string,
    fileName: string,
    type: 'image' | 'voice' | 'video' | 'file'
  ): Promise<string> {
    const filePath = `${this.basePath}/${type}s/${fileName}`

    if (this.isReactNative()) {
      const RNFS = require('react-native-fs')

      if (typeof fileData === 'string') {
        // Base64数据
        await RNFS.writeFile(filePath, fileData, 'base64')
      } else {
        // Blob数据转换
        const base64Data = await this.blobToBase64(fileData)
        await RNFS.writeFile(filePath, base64Data, 'base64')
      }
    } else if (this.isCordova()) {
      // Cordova文件操作
      await this.cordovaWriteFile(filePath, fileData)
    }

    return filePath
  }

  // 获取媒体文件
  async getMediaFile(localPath: string): Promise<string | null> {
    try {
      if (this.isReactNative()) {
        const RNFS = require('react-native-fs')
        const exists = await RNFS.exists(localPath)
        if (exists) {
          return `file://${localPath}`
        }
      } else if (this.isCordova()) {
        // Cordova文件检查
        const exists = await this.cordovaFileExists(localPath)
        if (exists) {
          return localPath
        }
      }
      return null
    } catch (error) {
      console.error('获取媒体文件失败:', error)
      return null
    }
  }

  // 删除媒体文件
  async deleteMediaFile(localPath: string): Promise<boolean> {
    try {
      if (this.isReactNative()) {
        const RNFS = require('react-native-fs')
        await RNFS.unlink(localPath)
      } else if (this.isCordova()) {
        await this.cordovaDeleteFile(localPath)
      }
      return true
    } catch (error) {
      console.error('删除媒体文件失败:', error)
      return false
    }
  }

  // 清理聊天媒体文件
  async clearChatMedia(chatId: string): Promise<void> {
    const directories = ['images', 'voices', 'videos', 'files', 'thumbnails']

    for (const dir of directories) {
      const dirPath = `${this.basePath}/${dir}`
      const files = await this.listFiles(dirPath)

      // 删除以chatId开头的文件
      for (const file of files) {
        if (file.startsWith(chatId)) {
          await this.deleteMediaFile(`${dirPath}/${file}`)
        }
      }
    }
  }

  // 获取缓存大小
  async getCacheSize(): Promise<number> {
    let totalSize = 0
    const directories = ['images', 'voices', 'videos', 'files', 'thumbnails']

    for (const dir of directories) {
      const dirPath = `${this.basePath}/${dir}`
      const size = await this.getDirectorySize(dirPath)
      totalSize += size
    }

    return totalSize
  }

  // 清理所有缓存
  async clearAllCache(): Promise<boolean> {
    try {
      if (this.isReactNative()) {
        const RNFS = require('react-native-fs')
        await RNFS.unlink(this.basePath)
        await this.createDirectories()
      } else if (this.isCordova()) {
        await this.cordovaDeleteDirectory(this.basePath)
        await this.createDirectories()
      }
      return true
    } catch (error) {
      console.error('清理缓存失败:', error)
      return false
    }
  }
}
```

## 🔧 键值存储管理

### 配置和设置存储
```typescript
// 应用设置管理器
export class AppSettingsManager {

  // 保存设置
  async setSetting(key: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value)

    if (this.isReactNative()) {
      const AsyncStorage = require('@react-native-async-storage/async-storage')
      await AsyncStorage.setItem(`yeyu_${key}`, stringValue)
    } else if (this.isCordova()) {
      localStorage.setItem(`yeyu_${key}`, stringValue)
    } else if (this.isFlutter()) {
      // Flutter SharedPreferences
      await this.flutterSetString(key, stringValue)
    }
  }

  // 获取设置
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      let stringValue: string | null = null

      if (this.isReactNative()) {
        const AsyncStorage = require('@react-native-async-storage/async-storage')
        stringValue = await AsyncStorage.getItem(`yeyu_${key}`)
      } else if (this.isCordova()) {
        stringValue = localStorage.getItem(`yeyu_${key}`)
      } else if (this.isFlutter()) {
        stringValue = await this.flutterGetString(key)
      }

      if (stringValue) {
        return JSON.parse(stringValue)
      }
      return defaultValue
    } catch (error) {
      console.error('获取设置失败:', error)
      return defaultValue
    }
  }

  // 删除设置
  async removeSetting(key: string): Promise<void> {
    if (this.isReactNative()) {
      const AsyncStorage = require('@react-native-async-storage/async-storage')
      await AsyncStorage.removeItem(`yeyu_${key}`)
    } else if (this.isCordova()) {
      localStorage.removeItem(`yeyu_${key}`)
    } else if (this.isFlutter()) {
      await this.flutterRemove(key)
    }
  }

  // 清理所有设置
  async clearAllSettings(): Promise<void> {
    if (this.isReactNative()) {
      const AsyncStorage = require('@react-native-async-storage/async-storage')
      const keys = await AsyncStorage.getAllKeys()
      const yeyuKeys = keys.filter(key => key.startsWith('yeyu_'))
      await AsyncStorage.multiRemove(yeyuKeys)
    } else if (this.isCordova()) {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('yeyu_')) {
          localStorage.removeItem(key)
        }
      })
    } else if (this.isFlutter()) {
      await this.flutterClear()
    }
  }
}
```

## 🔄 统一存储接口

### 存储管理器整合
```typescript
// 统一存储管理器
export class AppStorageManager {
  private database: AppMessageDatabase
  private mediaManager: AppMediaFileManager
  private settingsManager: AppSettingsManager

  constructor() {
    this.database = new AppMessageDatabase()
    this.mediaManager = new AppMediaFileManager()
    this.settingsManager = new AppSettingsManager()
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.database.initialize(),
      this.mediaManager.initialize()
    ])
  }

  // 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    return this.database.saveMessage(message)
  }

  async loadChatMessages(chatId: string, page: number, limit: number): Promise<Message[]> {
    return this.database.loadChatMessages(chatId, page, limit)
  }

  // 媒体文件操作
  async saveMediaFile(fileData: any, fileName: string, type: string): Promise<string> {
    return this.mediaManager.saveMediaFile(fileData, fileName, type)
  }

  async getMediaFile(localPath: string): Promise<string | null> {
    return this.mediaManager.getMediaFile(localPath)
  }

  // 设置操作
  async setSetting(key: string, value: any): Promise<void> {
    return this.settingsManager.setSetting(key, value)
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    return this.settingsManager.getSetting(key, defaultValue)
  }

  // 数据清理
  async clearChatData(chatId: string): Promise<void> {
    await Promise.all([
      this.database.clearChatData(chatId),
      this.mediaManager.clearChatMedia(chatId)
    ])
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.database.clearAllData(),
      this.mediaManager.clearAllCache(),
      this.settingsManager.clearAllSettings()
    ])
  }

  // 获取存储统计
  async getStorageStats(): Promise<StorageStats> {
    const cacheSize = await this.mediaManager.getCacheSize()
    const dbSize = await this.database.getDatabaseSize()

    return {
      totalSize: cacheSize + dbSize,
      cacheSize,
      databaseSize: dbSize,
      messageCount: await this.database.getMessageCount(),
      chatCount: await this.database.getChatCount()
    }
  }
}

interface StorageStats {
  totalSize: number
  cacheSize: number
  databaseSize: number
  messageCount: number
  chatCount: number
}
```

## 📊 存储性能优化

### 1. 数据库优化
- 合理的索引设计
- 批量操作减少事务开销
- 定期数据库优化(VACUUM)
- 连接池管理

### 2. 文件系统优化
- 按类型分目录存储
- 文件名规范化
- 定期清理临时文件
- 压缩存储减少空间占用

### 3. 内存优化
- 分页加载大量数据
- 及时释放不用的资源
- 图片缓存策略
- 后台任务处理

### 4. 网络优化
- 离线优先策略
- 增量同步
- 断点续传
- 数据压缩传输

这个APP客户端存储方案提供了完整的移动端数据存储解决方案，支持多种开发框架，确保数据的安全性和性能。
```

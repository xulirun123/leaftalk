// 叶语统一服务器入口文件
const dotenv = require('dotenv')
const _resolve = require('path').resolve
let _env = dotenv.config({ path: _resolve(__dirname, '.env'), override: true })
if (_env.error) {
  _env = dotenv.config({ path: _resolve(__dirname, '..', '.env'), override: true })
}


const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 8893

// 中间件配置
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',  // 部署环境前端
        'http://127.0.0.1:3000',  // 部署环境前端
        'null'
    ], // 'null' 允许 file:// 协议
    credentials: true
}))
// 增加请求体大小限制，支持 base64 图片上传
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Socket.IO配置
const io = socketIo(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',  // 部署环境前端
            'http://127.0.0.1:3000',  // 部署环境前端
            'null'
        ], // 'null' 允许 file:// 协议
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
})

// 静态文件服务 - 带错误处理
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 处理文件不存在的情况，返回占位符而不是404
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, '../uploads', req.path)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.warn('⚠️ 文件不存在:', req.path)

        // 根据文件类型返回不同的占位符
        if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            // 图片占位符 - SVG格式
            const placeholder = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="#f5f5f5"/>
                <text x="100" y="75" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy=".3em">图片不存在</text>
            </svg>`
            res.setHeader('Content-Type', 'image/svg+xml')
            return res.send(placeholder)
        } else if (req.path.match(/\.(mp4|webm|avi|mov)$/i)) {
            // 视频文件不存在时返回404，让前端处理
            return res.status(404).json({ error: '视频文件不存在' })
        }
    }

    next()
})
app.use('/test', express.static(path.join(__dirname, '../')))

// 配置multer文件上传
const upload = multer({
    storage: multer.memoryStorage(), // 使用内存存储，这样req.file.buffer才有数据
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB - 支持大视频文件
    },
    fileFilter: (req, file, cb) => {
        // 允许的文件类型：图片、视频、音频
        const allowedTypes = [
            // 图片
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            // 视频
            'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv',
            // 音频
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/webm'
        ]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error(`不支持的文件类型: ${file.mimetype}，请上传图片、视频或音频文件`), false)
        }
    }
})

// 数据库连接配置 - 使用leaftalk-new数据库
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000
}

// 调试：打印数据库配置
console.log('🔍 数据库配置调试:')
console.log('  DB_HOST:', process.env.DB_HOST)
console.log('  DB_USER:', process.env.DB_USER)
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined')
console.log('  DB_NAME:', process.env.DB_NAME)
console.log('  实际使用的数据库:', dbConfig.database)

// 创建数据库连接池
let pool
let db
const dbInitDiag = { tried: [], errors: [] }

async function initDbWithFallback() {
  const tried = []
  dbInitDiag.tried = []
  dbInitDiag.errors = []

  const candidates = []
  const envUser = process.env.DB_USER || 'root'
  const envPass = process.env.DB_PASSWORD ?? ''
  // 1) 优先尝试 .env 提供的账号
  candidates.push({ user: envUser, password: envPass })
  // 2) 常见账号名 + 已知密码
  const commonUsers = ['leaftalk', 'admin', 'mysql', 'user']
  for (const u of commonUsers) {
    if (!candidates.find(c => c.user === u && c.password === envPass)) {
      candidates.push({ user: u, password: envPass })
    }
  }
  // 3) 尝试 root 无密码（常见本地环境）
  if (!candidates.find(c => c.user === 'root' && c.password === '')) {
    candidates.push({ user: 'root', password: '' })
  }

  for (const cand of candidates) {
    try {
      const testPool = mysql.createPool({ ...dbConfig, user: cand.user, password: cand.password })
      await testPool.execute('SELECT 1')
      pool = testPool
      db = pool
      app.set('db', pool)
      const masked = cand.password ? '***' : '(empty)'
      console.log(`✅ 数据库连接池创建成功，使用账号: ${cand.user} / ${masked}`)
      return
    } catch (e) {
      const label = `${cand.user}:${cand.password ? '***' : '(empty)'}`
      tried.push(label)
      dbInitDiag.tried.push(label)
      dbInitDiag.errors.push({ user: cand.user, code: e && e.code, errno: e && e.errno, message: (e && e.message) || String(e) })
      console.warn('⚠️ 数据库连接失败，尝试下一个账号:', { user: cand.user, code: e && e.code, message: e && e.message })
    }
  }

  throw new Error(`无法连接数据库，已尝试账号: ${tried.join(', ')}`)
}

// 启动数据库初始化，并保存就绪Promise
const dbReady = initDbWithFallback().catch(err => {
  console.error('❌ 数据库初始化失败:', err && (err.stack || err.message || err))
})
// --- Startup tasks: run after DB is ready ---
async function ensureUser1And2AreFriends() {
  try {
    if (!pool) {
      console.warn('⚠️ 数据库未就绪，跳过初始化默认好友关系')
      return
    }
    const [existing] = await pool.execute(`
      SELECT * FROM friendships
      WHERE (user_id = 1 AND friend_id = 2) OR (user_id = 2 AND friend_id = 1)
    `)
    // @ts-ignore
    if (!existing || existing.length === 0) {
      console.log('🔗 添加用户1和用户2的好友关系...')
      await pool.execute(`
        INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES
        (1, 2, 'accepted', NOW(), NOW()),
        (2, 1, 'accepted', NOW(), NOW())
      `)
      console.log('✅ 用户1和用户2现在互为好友')
    } else {
      console.log('✅ 用户1和用户2已经是好友')
    }
  } catch (error) {
    console.error('❌ 设置用户1和用户2好友关系失败:', error)
  }
}

async function initStartupTasks() {
  try {
    await ensureUser1And2AreFriends()
  } catch (e) {
    console.warn('⚠️ 启动任务执行出现问题:', e && (e.message || e))
  }
}

// 在数据库就绪后运行启动任务
if (dbReady && typeof dbReady.then === 'function') {
  dbReady.then(() => initStartupTasks()).catch(() => initStartupTasks())
}

// 在数据库就绪前阻塞路由处理；若未初始化则按需重新初始化
app.use(async (req, res, next) => {
  if (!pool) {
    try {
      // 优先等待已有的初始化过程
      if (typeof dbReady?.then === 'function') {
        await dbReady
      }
      // 若仍未就绪，按需重试初始化
      if (!pool) {
        await initDbWithFallback()
      }
    } catch (e) {
      console.error('❌ 按需初始化数据库失败:', e?.message || e)
      return res.status(500).json({ success: false, error: '数据库未初始化', detail: e?.message || String(e), diag: dbInitDiag })
    }
  }
  next()
})

// 确保用户表增加二维码字段（兼容不支持 IF NOT EXISTS 的 MySQL 版本）
async function ensureUserQrColumn() {
  try {
    const [rows] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'qr_code_url'`
    )
    // @ts-ignore - rows 来自 mysql2/promise
    if (!rows || rows.length === 0) {
      await pool.execute(`ALTER TABLE users ADD COLUMN qr_code_url VARCHAR(255) DEFAULT NULL`)
      console.log('✅ 已添加 qr_code_url 列')
    } else {
      console.log('ℹ️ qr_code_url 列已存在')
    }
  } catch (e) {
    console.warn('⚠️ 确保用户二维码字段失败:', e?.message || e)
  }
}

// 在启动时后台执行一次，等待数据库就绪后再执行，避免未就绪导致报错
;(async () => {
  try { await dbReady; await ensureUserQrColumn() } catch (e) { /* ignore */ }
})()
// 确保用户信息常用字段存在（gender, region, signature, qr_code_url）
async function ensureUserProfileColumns() {
  try {
    const [cols] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    )
    const have = new Set((cols || []).map(c => c.COLUMN_NAME))
    const alterStmts = []
    if (!have.has('gender')) alterStmts.push("ADD COLUMN gender VARCHAR(10) DEFAULT NULL COMMENT '性别'")
    if (!have.has('region')) alterStmts.push("ADD COLUMN region VARCHAR(255) DEFAULT '' COMMENT '地区'")
    if (!have.has('signature')) alterStmts.push("ADD COLUMN signature VARCHAR(255) DEFAULT '' COMMENT '个性签名'")
    if (!have.has('qr_code_url')) alterStmts.push("ADD COLUMN qr_code_url VARCHAR(255) DEFAULT NULL COMMENT '账户二维码URL'")
    if (alterStmts.length) {
      const sql = `ALTER TABLE users ${alterStmts.join(', ')}`
      await pool.execute(sql)
      console.log('✅ 已补齐用户信息列:', alterStmts)
    }
  } catch (e) {
    console.warn('⚠️ 确保用户信息列失败:', e.message)
  }
}



// 初始化消息表
async function initMessageTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(255) PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL,
                receiver_id VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                type ENUM('text', 'image', 'voice', 'video', 'file', 'system', 'group_invite', 'contact', 'custom_emoji', 'link', 'location', 'announcement') DEFAULT 'text',
                status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 消息表检查/创建完成')

        // 更新 messages 表的 type 字段，确保包含所有消息类型
        try {
          console.log('🔄 开始更新 messages.type 字段...')

          // 首先，清理无效的消息类型数据
          try {
            console.log('🔄 清理无效的消息类型数据...')
            await db.execute(`
              UPDATE messages
              SET \`type\` = 'text'
              WHERE \`type\` NOT IN ('text', 'image', 'voice', 'video', 'file', 'system', 'group_invite', 'contact', 'custom_emoji', 'link', 'location', 'announcement')
            `)
            console.log('✅ 无效的消息类型已清理')
          } catch (cleanError) {
            console.warn('⚠️ 清理无效数据时出错:', cleanError.message)
          }

          // 然后更新字段定义
          await db.execute(`
            ALTER TABLE messages
            MODIFY COLUMN \`type\` ENUM('text', 'image', 'voice', 'video', 'file', 'system', 'group_invite', 'contact', 'custom_emoji', 'link', 'location', 'announcement') DEFAULT 'text'
          `)
          console.log('✅ messages.type 字段已更新，现在支持所有消息类型')
        } catch (error) {
          console.error('❌ 更新 messages.type 字段失败:', error.message)
          console.warn('⚠️ 继续启动服务器，消息类型字段可能不完整')
        }

        // 修复旧的邀请消息：将 type='text' 但内容是 group_invite 的消息更新为正确类型
        try {
          console.log('🔄 修复旧的邀请消息类型...')
          const [result] = await db.execute(`
            UPDATE messages
            SET \`type\` = 'group_invite'
            WHERE \`type\` = 'text'
            AND (content LIKE '%"type":"group_invite"%' OR content LIKE '%\\"type\\":\\"group_invite\\"%')
          `)
          if (result.affectedRows > 0) {
            console.log(`✅ 已修复 ${result.affectedRows} 条旧的邀请消息`)
          } else {
            console.log('ℹ️ 没有需要修复的旧邀请消息')
          }
        } catch (error) {
          console.error('❌ 修复旧邀请消息失败:', error.message)
        }

        // 创建群二维码表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS group_qrcodes (
                id VARCHAR(100) PRIMARY KEY,
                group_id VARCHAR(100) NOT NULL,
                qrcode_data TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_group_id (group_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 群二维码表检查/创建完成')

        // 创建进群申请表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS group_join_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id VARCHAR(100) NOT NULL,
                user_id INT NOT NULL,
                message VARCHAR(255) DEFAULT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                inviter_id INT DEFAULT NULL COMMENT '邀请人ID',
                invite_code VARCHAR(50) DEFAULT NULL COMMENT '邀请码',
                created_at DATETIME NOT NULL,
                updated_at DATETIME DEFAULT NULL,
                INDEX idx_group_id (group_id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_invite_code (invite_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 进群申请表检查/创建完成')

        // 创建群聊邀请链接表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS group_invite_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id VARCHAR(100) NOT NULL,
                invite_code VARCHAR(50) UNIQUE NOT NULL COMMENT '邀请码',
                inviter_id INT NOT NULL COMMENT '创建邀请链接的用户ID',
                max_uses INT DEFAULT NULL COMMENT '最大使用次数，NULL表示无限制',
                used_count INT DEFAULT 0 COMMENT '已使用次数',
                expire_at DATETIME DEFAULT NULL COMMENT '过期时间，NULL表示永不过期',
                created_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效',
                INDEX idx_group_id (group_id),
                INDEX idx_invite_code (invite_code),
                INDEX idx_inviter_id (inviter_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 群聊邀请链接表检查/创建完成')

        // 检查并添加 group_invite_links.inviter_id 字段（如果不存在）
        try {
          const [columns] = await db.execute(`
            SHOW COLUMNS FROM group_invite_links LIKE 'inviter_id'
          `)

          if (columns.length === 0) {
            await db.execute(`
              ALTER TABLE group_invite_links
              ADD COLUMN inviter_id INT NOT NULL COMMENT '创建邀请链接的用户ID' AFTER invite_code
            `)
            console.log('✅ group_invite_links.inviter_id 字段已添加')
          } else {
            console.log('ℹ️ group_invite_links.inviter_id 字段已存在')
          }
        } catch (error) {
          console.error('❌ 检查/添加 group_invite_links.inviter_id 字段失败:', error.message)
        }

        // 检查并添加 group_join_requests.inviter_id 字段（如果不存在）
        try {
          const [columns2] = await db.execute(`
            SHOW COLUMNS FROM group_join_requests LIKE 'inviter_id'
          `)

          if (columns2.length === 0) {
            await db.execute(`
              ALTER TABLE group_join_requests
              ADD COLUMN inviter_id INT DEFAULT NULL COMMENT '邀请人ID' AFTER status
            `)
            console.log('✅ group_join_requests.inviter_id 字段已添加')
          } else {
            console.log('ℹ️ group_join_requests.inviter_id 字段已存在')
          }
        } catch (error) {
          console.error('❌ 检查/添加 group_join_requests.inviter_id 字段失败:', error.message)
        }

        // 检查并添加 group_join_requests.invite_code 字段（如果不存在）
        try {
          const [columns3] = await db.execute(`
            SHOW COLUMNS FROM group_join_requests LIKE 'invite_code'
          `)

          if (columns3.length === 0) {
            await db.execute(`
              ALTER TABLE group_join_requests
              ADD COLUMN invite_code VARCHAR(50) DEFAULT NULL COMMENT '邀请码' AFTER inviter_id
            `)
            console.log('✅ group_join_requests.invite_code 字段已添加')

            // 添加索引
            try {
              await db.execute(`
                ALTER TABLE group_join_requests
                ADD INDEX idx_invite_code (invite_code)
              `)
              console.log('✅ invite_code 索引已添加')
            } catch (e) {
              console.log('ℹ️ invite_code 索引可能已存在')
            }
          } else {
            console.log('ℹ️ group_join_requests.invite_code 字段已存在')
          }
        } catch (error) {
          console.error('❌ 检查/添加 group_join_requests.invite_code 字段失败:', error.message)
        }

        // 创建群聊邀请申请表（普通成员邀请需要审核）
        await db.execute(`
            CREATE TABLE IF NOT EXISTS group_invite_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_id VARCHAR(100) NOT NULL COMMENT '群聊ID',
                inviter_id INT NOT NULL COMMENT '邀请人ID（普通成员）',
                invitee_id INT NOT NULL COMMENT '被邀请人ID',
                reason TEXT COMMENT '邀请理由',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
                reviewer_id INT DEFAULT NULL COMMENT '审核人ID（群主或管理员）',
                invite_code VARCHAR(50) DEFAULT NULL COMMENT '审核通过后生成的邀请码',
                created_at DATETIME NOT NULL,
                reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
                INDEX idx_group_id (group_id),
                INDEX idx_inviter_id (inviter_id),
                INDEX idx_invitee_id (invitee_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 群聊邀请申请表检查/创建完成')

        // 创建群公告表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS \`group_announcements\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`group_id\` VARCHAR(100) NOT NULL COMMENT '群聊ID',
                \`content\` TEXT NOT NULL COMMENT '公告内容',
                \`editor_id\` INT NOT NULL COMMENT '编辑者ID',
                \`editor_nickname\` VARCHAR(100) DEFAULT NULL COMMENT '编辑者昵称',
                \`created_at\` DATETIME NOT NULL COMMENT '创建时间',
                \`updated_at\` DATETIME NOT NULL COMMENT '更新时间',
                INDEX \`idx_group_id\` (\`group_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 群公告表检查/创建完成')

        // 添加 require_approval 字段到 groups 表
        try {
            await db.execute(`
                ALTER TABLE \`groups\`
                ADD COLUMN \`require_approval\` TINYINT(1) DEFAULT 0 COMMENT '是否需要进群验证'
            `)
            console.log('✅ groups 表添加 require_approval 字段成功')
        } catch (alterError) {
            // 字段可能已存在，忽略错误
            if (alterError.message.includes('Duplicate column name')) {
                console.log('ℹ️ require_approval 字段已存在')
            } else {
                console.log('ℹ️ require_approval 字段添加失败:', alterError.message)
            }
        }

        // 添加 is_dissolved 字段到 groups 表
        try {
            await db.execute(`
                ALTER TABLE \`groups\`
                ADD COLUMN \`is_dissolved\` TINYINT(1) DEFAULT 0 COMMENT '是否已解散'
            `)
            console.log('✅ groups 表添加 is_dissolved 字段成功')
        } catch (alterError) {
            // 字段可能已存在，忽略错误
            if (alterError.message.includes('Duplicate column name')) {
                console.log('ℹ️ is_dissolved 字段已存在')
            } else {
                console.error('❌ 添加 is_dissolved 字段失败:', alterError.message)
            }
        }
    } catch (error) {
        console.error('❌ 创建消息表失败:', error)
    }
}

// 等待数据库就绪后再初始化消息表
;(async () => { try { await dbReady; await initMessageTable() } catch (e) {} })()

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// WebSocket相关变量
const onlineUsers = new Map() // 存储在线用户
const userSockets = new Map() // 存储用户Socket映射

// 身份验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    console.log('🔐 认证调试:', {
        url: req.url,
        method: req.method,
        authHeader: authHeader ? authHeader.substring(0, 50) + '...' : null,
        hasToken: !!token
    })

    if (!token) {
        console.log('❌ 访问令牌缺失')
        return res.status(401).json({ error: '访问令牌缺失' })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Token验证失败:', err.message)
            console.log('🔍 Token内容:', token.substring(0, 100) + '...')
            return res.status(403).json({ error: '访问令牌无效' })
        }
        console.log('✅ Token验证成功，用户ID:', user.userId)
        req.user = user
        next()
    })
}

// 导入安全配置
let securityConfig
try {
    securityConfig = require('../config/security.js')
    console.log('✅ 安全配置加载成功')
} catch (error) {
    console.warn('⚠️ 安全配置加载失败，使用默认配置:', error.message)
    securityConfig = null
}

// 导入服务模块
let ocrService, notificationService, momentsService, fileUploadService, friendRequestService, cacheManager, logger

try {
    ocrService = require('./services/ocrService')
    notificationService = require('./services/notificationService')
    const MomentsService = require('./services/momentsService')
    fileUploadService = require('./services/fileUploadService')
    friendRequestService = require('./services/friendRequestService')
    cacheManager = require('./services/cacheManager')
    logger = require('./services/logger')

    // 实例化momentsService
    if (pool) {
        momentsService = new MomentsService(pool, fileUploadService, notificationService)
        console.log('✅ momentsService初始化成功（使用数据库）')
    } else {
        // 创建一个简单的momentsService替代品
        momentsService = {
            getMoments: async () => ({
                success: true,
                data: {
                    moments: [],
                    page: 1,
                    limit: 20,
                    hasMore: false
                }
            }),
            getPersonalMoments: async () => ({
                success: true,
                data: {
                    moments: [],
                    page: 1,
                    limit: 20,
                    hasMore: false
                }
            }),
            getUserMoments: async () => ({
                success: true,
                data: {
                    moments: [],
                    page: 1,
                    limit: 20,
                    hasMore: false
                }
            })
        }
        console.warn('⚠️ 使用简化的momentsService（无数据库）')
    }

    console.log('✅ 所有服务模块加载成功')
} catch (error) {
    console.error('❌ 服务模块加载失败:', error.message)
    // 创建简单的日志记录器作为后备
    logger = {
        info: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.debug
    }
}
// 初始化好友与黑名单服务（用于拉黑/移除黑名单等）
let frService = null
try {
  const FriendRequestService = require('./services/friendRequestService')
  frService = new FriendRequestService(pool, notificationService, {
    sendToUser: (uid, event, data) => io.to(`user_${uid}`).emit(event, data)
  })
  console.log('✅ frService 初始化成功')
} catch (e) {
  console.warn('⚠️ frService 初始化失败:', e.message)
}


// 基础路由
app.get('/', (req, res) => {
    res.json({
        message: '叶语统一服务器运行中',
        version: '2.0.0',
        services: {
            websocket: 'WebSocket实时消息服务',
            webrtc: 'WebRTC实时通信服务',
            api: '后端API服务',
            ocr: 'OCR识别服务',
            notification: '通知服务',
            moments: '朋友圈服务',
            upload: '文件上传服务'
        }
    })
})

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        onlineUsers: onlineUsers.size
    })
})

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('🔌 新WebSocket连接:', socket.id)

    // 用户加入房间
    socket.on('join_user_room', async (data) => {
        try {
            console.log('🔥 收到 join_user_room 事件:', data)

            const { userId } = data
            if (!userId) {
                console.warn('⚠️ 用户ID缺失')
                return
            }

            // 设置socket的userId，供WebRTC信令使用
            socket.userId = userId

            // 初始化WebRTC信令监听
            webrtcSignaling.initializeSignaling(socket)

            socket.userId = userId
            socket.join(`user_${userId}`)

            // 记录在线用户
            onlineUsers.set(userId, {
                socketId: socket.id,
                joinTime: Date.now(),
                status: 'online',
                lastHeartbeat: Date.now()
            })

            userSockets.set(userId, socket.id)

            console.log(`🔥 userSockets 已设置: userId=${userId}, socketId=${socket.id}`)
            console.log(`🔥 当前 userSockets 内容:`, Array.from(userSockets.entries()))

            console.log(`👤 用户 ${userId} 已加入WebSocket房间`)

            // 广播用户上线状态
            socket.broadcast.emit('user_status', {
                userId,
                status: 'online',
                lastSeen: Date.now()
            })
        } catch (error) {
            console.error('❌ 用户加入房间失败:', error)
        }
    })

    // 处理消息发送
    socket.on('send_message', async (message, callback) => {
        try {
            console.log('📨 收到消息:', message)

            // 验证消息格式
            if (!message.receiverId || !message.content) {
                callback({ success: false, error: '消息格式不正确' })
            // 黑名单拦截：如果接收者已拉黑发送者，拒绝发送
            try {
                if (pool) {
                    const [rows] = await pool.execute(
                        'SELECT id FROM user_blacklist WHERE user_id = ? AND blocked_user_id = ?',
                        [message.receiverId, message.senderId]
                    )
                    if (rows && rows.length > 0) {
                        const notice = { type: 'chat_blocked', targetUserId: message.receiverId, content: '对方已设置拒收你的消息' }
                        socket.emit('system_message', notice)
                        if (typeof callback === 'function') {
                            return callback({ success: false, error: '对方已设置拒收你的消息' })
                        }
                        return
                    }
                }
            } catch (blkErr) {
                console.warn('⚠️ 黑名单拦截检查失败:', blkErr.message)
            }

                return
            }

            // 生成消息ID（如果没有）
            if (!message.id) {
                message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }

            // 设置消息状态和时间戳
            message.status = 'sent'
            message.timestamp = Date.now()

            // 保存消息到数据库
            if (pool) {
                try {
                    // 🛡️ 根本防护：阻止保存自聊天消息
                    if (message.senderId === message.receiverId) {
                        console.error('🛡️ 服务器阻止保存自聊天消息:', {
                            messageId: message.id,
                            senderId: message.senderId,
                            receiverId: message.receiverId
                        })
                        throw new Error('不能保存自聊天消息')
                    }

                    await db.execute(`
                        INSERT INTO messages (id, sender_id, receiver_id, content, type, created_at, status)
                        VALUES (?, ?, ?, ?, ?, NOW(), ?)
                    `, [
                        message.id,
                        message.senderId,
                        message.receiverId,
                        message.content,
                        message.type || 'text',
                        message.status
                    ])
                    console.log('💾 消息已保存到数据库:', message.id)
                } catch (dbError) {
                    console.error('❌ 保存消息到数据库失败:', dbError)
                    // 如果是自聊天错误，不继续发送消息
                    if (dbError.message && dbError.message.includes('自聊天')) {
                        throw dbError
                    }
                    // 其他数据库错误，继续发送消息
                }
            }

            // 检查是否为群聊消息
            const isGroupMessage = message.receiverId && message.receiverId.startsWith('group_')

            if (isGroupMessage) {
                // 群聊消息：发送给所有群成员
                console.log('📢 群聊消息，查询群成员...')

                try {
                    // 查询发送者昵称（如果消息中没有）
                    if (!message.senderName && message.senderId) {
                        try {
                            const [senderInfo] = await pool.execute(
                                'SELECT nickname FROM users WHERE id = ?',
                                [message.senderId]
                            )
                            if (senderInfo.length > 0) {
                                message.senderName = senderInfo[0].nickname || `用户${message.senderId}`
                                console.log('✅ 已添加发送者昵称:', message.senderName)
                            }
                        } catch (err) {
                            console.warn('⚠️ 查询发送者昵称失败:', err)
                            message.senderName = `用户${message.senderId}`
                        }
                    }

                    // 查询群成员
                    const [members] = await pool.execute(
                        'SELECT user_id FROM group_members WHERE group_id = ?',
                        [message.receiverId]
                    )

                    console.log(`👥 找到群成员数量: ${members.length}`)

                    // 发送给所有群成员（除了发送者自己）
                    let sentCount = 0
                    for (const member of members) {
                        if (member.user_id !== parseInt(message.senderId)) {
                            const memberRoom = `user_${member.user_id}`
                            socket.to(memberRoom).emit('new_message', message)
                            sentCount++
                        }
                    }

                    console.log(`✅ 群聊消息已发送给 ${sentCount} 个成员`)
                } catch (error) {
                    console.error('❌ 查询群成员失败:', error)
                }
            } else {
                // 私聊消息：发送给接收者
                const receiverRoom = `user_${message.receiverId}`
                socket.to(receiverRoom).emit('new_message', message)
                console.log(`✅ 私聊消息已发送: ${message.senderId} -> ${message.receiverId}`)
            }

            // 发送给发送者确认
            callback({ success: true, messageId: message.id })

            // 模拟消息状态更新
            setTimeout(() => {
                // 发送已送达状态
                socket.emit('message_status', {
                    messageId: message.id,
                    status: 'delivered'
                })

                // 更新数据库中的消息状态
                if (db) {
                    db.execute(
                        'UPDATE messages SET status = ? WHERE id = ?',
                        ['delivered', message.id]
                    ).catch(err => console.error('更新消息状态失败:', err))
                }
            }, 500)

        } catch (error) {
            console.error('❌ 处理消息失败:', error)
            callback({ success: false, error: error.message })
        }
    })

    // 处理消息已送达确认
    socket.on('message_delivered', async (data) => {
        try {
            console.log('📋 消息已送达确认:', data.messageId)

            // 更新数据库中的消息状态
            if (db && data.messageId) {
                await db.execute(
                    'UPDATE messages SET status = ? WHERE id = ?',
                    ['delivered', data.messageId]
                )
            }

            // 通知发送者消息已送达
            if (socket.userId) {
                socket.broadcast.emit('message_status', {
                    messageId: data.messageId,
                    status: 'delivered'
                })
            }
        } catch (error) {
            console.error('❌ 处理消息送达确认失败:', error)
        }
    })

    // 处理消息已读确认
    socket.on('message_read', async (data) => {
        try {
            console.log('📖 消息已读确认:', data.messageId)

            // 更新数据库中的消息状态
            if (pool && data.messageId) {
                await pool.execute(
                    'UPDATE messages SET status = ? WHERE id = ?',
                    ['read', data.messageId]
                )
            }

            // 通知发送者消息已读
            if (socket.userId) {
                socket.broadcast.emit('message_status', {
                    messageId: data.messageId,
                    status: 'read'
                })
            }
        } catch (error) {
            console.error('❌ 处理消息已读确认失败:', error)
        }
    })

    // 处理心跳
    socket.on('heartbeat', (data) => {
        // 更新用户最后活跃时间
        if (socket.userId && onlineUsers.has(socket.userId)) {
            const userInfo = onlineUsers.get(socket.userId)
            userInfo.lastHeartbeat = data.timestamp
            onlineUsers.set(socket.userId, userInfo)
        }

        // 回复心跳
        socket.emit('heartbeat_ack', { timestamp: Date.now() })
    })

    // 处理断开连接
    socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket连接断开:', socket.id, reason)

        // 反向查找：通过 socket.id 找到对应的 userId
        let disconnectedUserId = null
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId
                break
            }
        }

        if (disconnectedUserId) {
            // 移除在线用户记录
            onlineUsers.delete(disconnectedUserId)
            userSockets.delete(disconnectedUserId)

            // 广播用户离线状态
            socket.broadcast.emit('user_status', {
                userId: disconnectedUserId,
                status: 'offline',
                lastSeen: Date.now()
            })

            console.log(`👤 用户 ${disconnectedUserId} 已离线`)
        }
    })

    // 错误处理
    socket.on('error', (error) => {
        console.error('❌ WebSocket错误:', error)
    })
})

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

// 用户认证路由 - 叶语号或手机号登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, phone, password } = req.body
        const loginIdentifier = username || phone

        console.log('🔍 登录请求参数:', { username, phone, password: password ? '***' : undefined })

        if (!loginIdentifier) {
            return res.status(400).json({
                success: false,
                error: '请输入叶语号或手机号'
            })
        }

        // 查询用户（支持叶语号/手机号登录）
        const [users] = await db.execute(
            'SELECT * FROM users WHERE yeyu_id = ? OR phone = ?',
            [loginIdentifier, loginIdentifier]
        )

        if (users.length === 0) {
            console.log('❌ 用户不存在:', username)
            return res.status(401).json({
                success: false,
                error: '账户不存在，请检查叶语号、手机号或用户名'
            })
        }

        const user = users[0]

        console.log('🔍 找到用户:', {
            id: user.id,
            yeyu_id: user.yeyu_id,
            phone: user.phone,
            nickname: user.nickname,
            hasPassword: !!user.password
        })

        // 验证密码
        if (!password) {
            return res.status(400).json({
                success: false,
                error: '请输入密码'
            })
        }

        let isValidPassword = false

        if (user.password) {
            // 如果用户有加密密码，使用bcrypt验证
            try {
                isValidPassword = await bcrypt.compare(password, user.password)
            } catch (error) {
                console.warn('bcrypt验证失败，尝试简单比较:', error.message)
                // 如果bcrypt失败，可能是明文密码，直接比较
                isValidPassword = (password === user.password)
            }
        } else {
            // 如果数据库中没有密码字段，在开发环境下允许任何密码
            console.log('🔧 开发模式：用户无密码字段，允许任何密码登录')
            isValidPassword = true
        }

        if (!isValidPassword) {
            console.log('❌ 密码验证失败:', { userId: user.id, username })
            return res.status(401).json({
                success: false,
                error: '账户或密码错误，请重新输入'
            })
        }

        // 生成JWT令牌 - 30天过期
        const token = jwt.sign(
            {
                userId: user.id,
                phone: user.phone,
                username: user.username
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        console.log('✅ 登录成功，生成令牌')

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    yeyu_id: user.yeyu_id,
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    phone: user.phone
                }
            },
            message: '登录成功'
        })
    } catch (error) {
        console.error('登录失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器内部错误，请稍后重试'
        })
    }
})

// 用户登出路由
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // 在实际应用中，这里可以将token加入黑名单
        // 目前只是返回成功响应
        res.json({
            success: true,
            message: '登出成功'
        })
    } catch (error) {
        console.error('登出失败:', error)
        res.status(500).json({ error: '登出失败' })
    }
})

// 验证当前密码路由
app.post('/api/auth/verify-password', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body
        const userId = req.user.userId

        console.log('🔍 验证密码请求:', { userId, hasPassword: !!password })

        if (!password) {
            return res.status(400).json({
                success: false,
                error: '请输入密码'
            })
        }

        // 查询用户信息
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]
        let isValidPassword = false

        console.log('🔍 密码验证详情:', {
            userId,
            hasPassword: !!user.password,
            passwordLength: user.password?.length,
            inputPasswordLength: password.length,
            passwordStartsWith: user.password?.substring(0, 10)
        })

        if (user.password) {
            // 如果用户有加密密码，使用bcrypt验证
            try {
                isValidPassword = await bcrypt.compare(password, user.password)
                console.log('🔐 bcrypt验证结果:', isValidPassword)
            } catch (error) {
                console.warn('bcrypt验证失败，尝试简单比较:', error.message)
                // 如果bcrypt失败，可能是明文密码，直接比较
                isValidPassword = (password === user.password)
                console.log('🔐 明文比较结果:', isValidPassword)
            }
        } else {
            // 如果数据库中没有密码字段，在开发环境下允许任何密码
            console.log('🔧 开发模式：用户无密码字段，允许任何密码')
            isValidPassword = true
        }

        if (isValidPassword) {
            console.log('✅ 密码验证成功:', userId)
            res.json({
                success: true,
                message: '密码验证成功'
            })
        } else {
            console.log('❌ 密码验证失败:', userId)
            // 密码错误是正常的业务流程，返回200状态码但success为false
            res.json({
                success: false,
                error: '密码错误'
            })
        }
    } catch (error) {
        console.error('验证密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器内部错误，请稍后重试'
        })
    }
})

// 修改密码路由
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const userId = req.user.userId

        console.log('🔍 修改密码请求:', { userId, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword })

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: '请输入当前密码和新密码'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: '新密码长度至少6位'
            })
        }

        // 查询用户信息
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]
        let isValidPassword = false

        // 验证当前密码
        if (user.password) {
            try {
                isValidPassword = await bcrypt.compare(currentPassword, user.password)
            } catch (error) {
                console.warn('bcrypt验证失败，尝试简单比较:', error.message)
                isValidPassword = (currentPassword === user.password)
            }
        } else {
            console.log('🔧 开发模式：用户无密码字段，允许任何当前密码')
            isValidPassword = true
        }

        if (!isValidPassword) {
            console.log('❌ 当前密码验证失败:', userId)
            // 密码错误是正常的业务流程，返回200状态码但success为false
            return res.json({
                success: false,
                error: '当前密码错误'
            })
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        // 更新密码
        await db.execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedNewPassword, userId]
        )

        console.log('✅ 密码修改成功:', userId)

        res.json({
            success: true,
            message: '密码修改成功'
        })
    } catch (error) {
        console.error('修改密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器内部错误，请稍后重试'
        })
    }
})

// 刷新令牌路由 - 不使用authenticateToken中间件，因为token可能已过期
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: '缺少刷新令牌' })
        }

        // 尝试解码token，即使已过期也要获取用户信息
        let decoded
        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // token过期，但仍然可以解码获取用户信息
                decoded = jwt.decode(token)
                console.log('🔄 Token已过期，但可以刷新:', decoded?.userId)
            } else {
                console.log('❌ Token无效，无法刷新:', error.message)
                return res.status(403).json({ error: '令牌无效，无法刷新' })
            }
        }

        if (!decoded || !decoded.userId) {
            return res.status(403).json({ error: '令牌格式无效' })
        }

        // 生成新的token - 30天过期
        const newToken = jwt.sign(
            {
                userId: decoded.userId,
                phone: decoded.phone,
                username: decoded.username
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        console.log('✅ Token刷新成功，用户ID:', decoded.userId)

        res.json({
            success: true,
            data: { token: newToken },
            message: '令牌刷新成功'
        })
    } catch (error) {
        console.error('❌ 刷新令牌失败:', error)
        res.status(500).json({ error: '刷新令牌失败' })
    }
})

// 验证令牌状态路由
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                userId: req.user.userId,
                username: req.user.username,
                phone: req.user.phone
            },
            message: '令牌有效'
        })
    } catch (error) {
        console.error('验证令牌失败:', error)
        res.status(500).json({ error: '验证令牌失败' })
    }
})

// 检查身份证号绑定情况（允许多个用户绑定同一身份证）
app.get('/api/users/check-identity', authenticateToken, async (req, res) => {
    try {
        const { idNumber } = req.query
        const currentUserId = req.user.userId

        console.log('🔍 检查身份证号绑定情况:', idNumber)

        if (!idNumber) {
            return res.json({
                success: true,
                exists: false,
                bindingCount: 0,
                message: '身份证号为空'
            })
        }

        // 查询已绑定该身份证的用户（包括当前用户）
        const [users] = await pool.execute(
            'SELECT id, real_name, yeyu_id FROM users WHERE id_card = ?',
            [idNumber]
        )

        // 检查当前用户是否已经绑定了这个身份证
        const currentUserBound = users.some(user => user.id === currentUserId)

        res.json({
            success: true,
            exists: users.length > 0,
            bindingCount: users.length,
            currentUserBound: currentUserBound,
            data: {
                exists: users.length > 0,
                bindingCount: users.length,
                currentUserBound: currentUserBound,
                boundUsers: users.map(user => ({
                    id: user.id,
                    name: user.real_name,
                    yeyuId: user.yeyu_id
                }))
            },
            message: users.length > 0
                ? `该身份证已绑定${users.length}个账号${currentUserBound ? '（包括当前账号）' : ''}`
                : '身份证号可用'
        })

    } catch (error) {
        console.error('❌ 检查身份证号失败:', error)
        res.status(500).json({
            success: false,
            error: '检查身份证号失败'
        })
    }
})

// 搜索用户API（通过叶语号或手机号）
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query
        const currentUserId = req.user.userId

        console.log('🔍 搜索用户:', { query: q, currentUserId })

        if (!q || !q.trim()) {
            return res.status(400).json({
                success: false,
                message: '搜索关键词不能为空',
                code: 400
            })
        }

        const query = q.trim()

        // 检查是否搜索自己
        const [currentUser] = await db.execute(
            'SELECT yeyu_id, phone FROM users WHERE id = ?',
            [currentUserId]
        )

        if (currentUser.length > 0) {
            const user = currentUser[0]
            if (query === user.yeyu_id || query === user.phone) {
                return res.status(400).json({
                    success: false,
                    message: '不能添加自己为好友',
                    code: 400,
                    data: { searchingSelf: true }
                })
            }
        }

        // 搜索用户（通过叶语号或手机号）
        const [users] = await db.execute(
            'SELECT id, yeyu_id, username, nickname, avatar, phone, gender, region, signature FROM users WHERE (yeyu_id = ? OR phone = ?) AND id != ?',
            [query, query, currentUserId]
        )

        console.log('🔍 搜索结果:', users.length, '个用户')

        if (users.length === 0) {
            return res.json({
                success: false,
                message: '未找到匹配的用户',
                code: 404,
                data: []
            })
        }

        // 检查是否已经是好友
        const userId = users[0].id
        const [friendships] = await db.execute(
            'SELECT status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [currentUserId, userId, userId, currentUserId]
        )

        const isFriend = friendships.length > 0 && friendships[0].status === 'accepted'

        const result = users.map(user => ({
            id: user.id,
            yeyuId: user.yeyu_id,
            name: user.nickname || user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone,
            gender: user.gender,
            region: user.region,
            signature: user.signature,
            isFriend: isFriend
        }))

        res.json({
            success: true,
            data: result,
            message: '搜索成功',
            code: 200
        })

    } catch (error) {
        console.error('❌ 搜索用户失败:', error)
        res.status(500).json({
            success: false,
            message: '搜索用户失败',
            code: 500,
            error: error.message
        })
    }
})

// 批量获取用户信息API
app.get('/api/users/batch', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.query

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: '缺少 ids 参数'
      })
    }

    // 解析 ids 参数（可以是逗号分隔的字符串或数组）
    const userIds = typeof ids === 'string' ? ids.split(',').map(id => id.trim()) : ids

    console.log('🔍 批量获取用户信息:', { userIds })

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: []
      })
    }

    // 构建 SQL 查询
    const placeholders = userIds.map(() => '?').join(',')
    const [users] = await db.execute(
      `SELECT id, yeyu_id, username, nickname, avatar, phone, gender, region, signature, qr_code_url
       FROM users
       WHERE id IN (${placeholders}) OR yeyu_id IN (${placeholders})`,
      [...userIds, ...userIds]
    )

    // 构建用户映射
    const userMap = new Map()
    if (Array.isArray(users)) {
      users.forEach(user => {
        userMap.set(String(user.id), {
          id: user.id,
          yeyu_id: user.yeyu_id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          gender: user.gender || null,
          region: user.region || '',
          signature: user.signature || '',
          qr_code_url: user.qr_code_url || null
        })
      })
    }

    // 返回用户数据
    const result = userIds.map(id => {
      const user = userMap.get(String(id))
      if (user) {
        return user
      }
      // 如果用户不存在，返回默认数据
      return {
        id: id,
        yeyu_id: null,
        username: `用户${id}`,
        nickname: `用户${id}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        phone: null,
        gender: null,
        region: '',
        signature: '',
        qr_code_url: null
      }
    })

    console.log('✅ 批量获取用户信息成功，返回', result.length, '个用户')

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ 批量获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      error: '批量获取用户信息失败'
    })
  }
})

// 获取用户信息API
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params

        // 检查是否是系统用户
        if (userId === 'system' || userId === '0') {
            return res.json({
                success: true,
                data: {
                    id: 'system',
                    yeyu_id: 'SYSTEM',
                    username: 'system',
                    nickname: '系统消息',
                    avatar: '/system-avatar.png',
                    phone: null,
                    gender: null,
                    region: '',
                    signature: '系统消息',
                    qr_code_url: null
                }
            })
        }

        // 检查是否是特殊路径（如 group, me 等）
        if (userId === 'group' || userId === 'me' || userId === 'current') {
            return res.status(400).json({
                success: false,
                message: `无效的用户ID: ${userId}`,
                error: '请使用正确的用户ID或叶语号'
            })
        }

        // 查询用户信息（包含地区、性别、签名）
        const [users] = await db.execute(
            'SELECT id, yeyu_id, username, nickname, avatar, phone, gender, region, signature, qr_code_url FROM users WHERE id = ? OR yeyu_id = ?',
            [userId, userId]
        )

        if (Array.isArray(users) && users.length > 0) {
            const user = users[0]
            res.json({
                success: true,
                data: {
                    id: user.id,
                    yeyu_id: user.yeyu_id,
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    phone: user.phone,
                    gender: user.gender || null,
                    region: user.region || '',
                    signature: user.signature || '',
                    qr_code_url: user.qr_code_url || null
                }
            })
        } else {
            res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        })
    }
})

// 获取用户头像API
app.get('/api/users/:userId/avatar', async (req, res) => {
    try {
        const { userId } = req.params

        // 过滤系统消息（userId 为 0 或 system）
        if (userId === '0' || userId === 'system') {
            console.log('⚠️ 系统消息请求头像，返回默认头像')
            return res.redirect('https://api.dicebear.com/7.x/avataaars/svg?seed=system')
        }

        // 查询用户信息
        const [users] = await pool.execute(
            'SELECT avatar FROM users WHERE id = ? OR yeyu_id = ?',
            [userId, userId]
        )

        if (users.length > 0 && users[0].avatar) {
            // 如果用户有头像，重定向到头像URL
            res.redirect(users[0].avatar)
        } else {
            // 如果没有头像，返回默认头像
            res.redirect('https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId)
        }
    } catch (error) {
        console.error('获取用户头像失败:', error)
        // 出错时返回默认头像
        res.redirect('https://api.dicebear.com/7.x/avataaars/svg?seed=default')
    }
})

// 用户注册路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const { phone, password, nickname, username } = req.body

        console.log('📝 收到注册请求:', { phone, nickname, username })

        // 检查手机号是否已存在
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        )

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '手机号已注册'
            })
        }

        // 生成叶语号（如果前端没有提供）
        const generateYeyuId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = ''
            for (let i = 0; i < 10; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        }

        let yeyuId = username || generateYeyuId()

        // 确保叶语号唯一
        while (true) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE yeyu_id = ?',
                [yeyuId]
            )
            if (existing.length === 0) break
            yeyuId = generateYeyuId()
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 生成随机头像
        const avatarSeed = Math.random().toString(36).substring(7)
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`

        // 插入新用户
        const [result] = await pool.execute(
            'INSERT INTO users (yeyu_id, phone, password, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [yeyuId, phone, hashedPassword, nickname, avatar]
        )

        // 生成 JWT token
        const token = jwt.sign(
            {
                userId: result.insertId,
                yeyuId: yeyuId,
                phone: phone
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        const user = {
            id: result.insertId,
            yeyu_id: yeyuId,
            username: yeyuId,
            phone,
            nickname,
            avatar,
            verification_status: 'unverified'
        }

        console.log('✅ 注册成功:', user)

        res.json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user
            }
        })
    } catch (error) {
        console.error('❌ 注册失败:', error)
        res.status(500).json({
            success: false,
            message: '注册失败',
            error: error.message
        })
    }
})

// 检查用户是否存在（用于注册页面验证）
app.get('/api/users/check/:phone', async (req, res) => {
    try {
        const { phone } = req.params

        console.log('🔍 检查手机号是否已注册:', phone)

        // 查询用户是否存在
        const [users] = await pool.execute(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        )

        const exists = users.length > 0

        res.json({
            success: true,
            exists: exists,
            message: exists ? '手机号已注册' : '手机号可用'
        })

    } catch (error) {
        console.error('检查用户失败:', error)
        res.status(500).json({
            success: false,
            error: '检查用户失败'
        })
    }
})



// 提交身份认证信息
app.post('/api/users/identity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId
        const {
            name,
            idNumber,
            gender,
            birthDate,
            address,
            fatherName,
            motherName,
            maritalStatus,
            spouseName
        } = req.body

        console.log('🔍 提交身份认证信息:', { userId, name, idNumber })

        // 更新用户身份信息
        await pool.execute(`
            UPDATE users SET
                real_name = ?,
                id_card = ?,
                gender = ?,
                birth_date = ?,
                father_name = ?,
                mother_name = ?,
                verification_status = 'verified',
                updated_at = NOW()
            WHERE id = ?
        `, [name, idNumber, gender, birthDate, fatherName, motherName, userId])

        // 查询更新后的用户信息
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, nickname, real_name, verification_status FROM users WHERE id = ?',
            [userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        res.json({
            success: true,
            message: '身份认证成功',
            data: {
                user: {
                    id: users[0].id,
                    yeyuId: users[0].yeyu_id,
                    nickname: users[0].nickname,
                    realName: users[0].real_name,
                    verified: users[0].verification_status === 'verified'
                }
            }
        })

    } catch (error) {
        console.error('❌ 身份认证失败:', error)
        res.status(500).json({
            success: false,
            error: '身份认证失败'
        })
    }
})

// 获取用户列表（开发用）
app.get('/api/dev/users', async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, username, phone, nickname, created_at FROM users ORDER BY created_at DESC LIMIT 10'
        )

        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功'
        })

    } catch (error) {
        console.error('获取用户列表失败:', error)
        res.status(500).json({
            success: false,
            error: '获取用户列表失败'
        })
    }
})

// 获取用户认证状态（开发用）
app.get('/api/dev/user-verification/:userId', async (req, res) => {
    try {
        const { userId } = req.params

        const [users] = await pool.execute(`
            SELECT
                id, yeyu_id, username, nickname, phone, email,
                real_name, id_card, verification_status, gender,
                birth_date, region, father_name, mother_name,
                created_at, updated_at, last_login_at
            FROM users
            WHERE id = ? OR yeyu_id = ? OR phone = ?
        `, [userId, userId, userId])

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        // 格式化认证状态
        const verificationInfo = {
            userId: user.id,
            yeyuId: user.yeyu_id,
            username: user.username,
            nickname: user.nickname,
            phone: user.phone,
            email: user.email,
            realName: user.real_name,
            idCard: user.id_card ? `${user.id_card.substring(0, 6)}****${user.id_card.substring(14)}` : null,
            verificationStatus: user.verification_status,
            gender: user.gender,
            birthDate: user.birth_date,
            region: user.region,
            fatherName: user.father_name,
            motherName: user.mother_name,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            lastLoginAt: user.last_login_at,
            isVerified: user.verification_status === 'verified',
            verificationStatusText: {
                'unverified': '未认证',
                'pending': '认证中',
                'verified': '已认证',
                'rejected': '认证失败'
            }[user.verification_status] || '未知状态'
        }

        res.json({
            success: true,
            data: verificationInfo,
            message: '获取用户认证状态成功'
        })

    } catch (error) {
        console.error('获取用户认证状态失败:', error)
        res.status(500).json({
            success: false,
            error: '获取用户认证状态失败'
        })
    }
})

// 获取数据库表列表（开发用）
app.get('/api/dev/tables', async (req, res) => {
    try {
        const [tables] = await pool.execute('SHOW TABLES')

        res.json({
            success: true,
            data: tables,
            message: '获取表列表成功'
        })

    } catch (error) {
        console.error('获取表列表失败:', error)
        res.status(500).json({
            success: false,
            error: '获取表列表失败'
        })
    }
})

// 获取所有数据库列表（开发用）
app.get('/api/dev/databases', async (req, res) => {
    try {
        const [databases] = await pool.execute('SHOW DATABASES')

        res.json({
            success: true,
            data: databases,
            message: '获取数据库列表成功'
        })

    } catch (error) {
        console.error('获取数据库列表失败:', error)
        res.status(500).json({
            success: false,
            error: '获取数据库列表失败'
        })
    }
})

// 获取指定数据库的表列表（开发用）
app.get('/api/dev/tables/:database', async (req, res) => {
    try {
        const { database } = req.params
        const [tables] = await pool.execute(`SHOW TABLES FROM \`${database}\``)

        res.json({
            success: true,
            database: database,
            data: tables,
            message: `获取${database}数据库表列表成功`
        })

    } catch (error) {
        console.error('获取指定数据库表列表失败:', error)
        res.status(500).json({
            success: false,
            error: '获取指定数据库表列表失败'
        })
    }
})

// 获取表结构（开发用）
app.get('/api/dev/describe/:table', async (req, res) => {
    try {
        const { table } = req.params
        const [structure] = await pool.execute(`DESCRIBE \`${table}\``)

        res.json({
            success: true,
            table: table,
            data: structure,
            message: `获取${table}表结构成功`
        })

    } catch (error) {
        console.error('获取表结构失败:', error)
        res.status(500).json({
            success: false,
            error: '获取表结构失败'
        })
    }
})

// OCR测试API
app.post('/api/dev/ocr-test', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请上传图片文件'
            })
        }

        console.log('🔍 OCR测试开始...')
        console.log('📷 文件信息:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        })

        // 这里需要导入OCR服务
        const OCRService = require('./services/ocrService')
        const ocrService = new OCRService()

        // 执行OCR识别
        const result = await ocrService.recognizeIdCard(req.file.buffer)

        res.json({
            success: true,
            data: result,
            message: 'OCR识别完成'
        })

    } catch (error) {
        console.error('OCR测试失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'OCR识别失败'
        })
    }
})

// OCR身份证识别API
app.post('/api/ocr/idcard', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请上传身份证图片'
            })
        }

        console.log('🔍 身份证OCR识别开始...')
        console.log('📷 文件信息:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferType: typeof req.file.buffer,
            bufferLength: req.file.buffer ? req.file.buffer.length : 'undefined',
            isBuffer: Buffer.isBuffer(req.file.buffer)
        })

        // 验证文件buffer
        if (!req.file.buffer) {
            return res.status(400).json({
                success: false,
                error: '文件数据为空'
            })
        }

        // 使用全局腾讯云OCR服务实例
        if (!global.tencentOcrService) {
            const TencentOcrService = require('./services/tencentOcrService')
            global.tencentOcrService = new TencentOcrService()
            console.log('🔧 创建全局腾讯云OCR服务实例')
        }

        console.log('🔍 腾讯云OCR客户端状态:', global.tencentOcrService.client ? '已初始化' : '未初始化')

        // 执行OCR识别
        const result = await global.tencentOcrService.recognizeIdCard(req.file.buffer)

        console.log('✅ OCR识别完成:', result.success ? '成功' : '失败')

        res.json({
            success: result.success,
            data: result.data,
            confidence: result.confidence,
            source: result.source,
            message: result.success ? 'OCR识别成功' : result.error
        })

    } catch (error) {
        console.error('❌ OCR身份证识别失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'OCR识别失败'
        })
    }
})

// 获取用户信息
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status, gender, region, signature, qr_code_url, require_friend_verification FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })


        }

        res.json({
            success: true,
            data: users[0]
        })
    } catch (error) {
        console.error('获取用户信息失败:', error)
        res.status(500).json({ error: '获取用户信息失败' })
    }
})

// ==================== 支付相关API ====================

// 数据库迁移：添加支付密码字段
app.post('/api/admin/migrate-pay-password', async (req, res) => {
    try {
        const results = []

        // 检查pay_password字段是否已存在
        const [payPasswordColumns] = await pool.execute(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'leaftalk-new'
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'pay_password'
        `)

        if (payPasswordColumns.length === 0) {
            // 添加pay_password字段
            await pool.execute(`
                ALTER TABLE users
                ADD COLUMN pay_password VARCHAR(255) DEFAULT NULL
                COMMENT '支付密码(加密存储)'
            `)
            results.push('pay_password字段添加成功')
        } else {
            results.push('pay_password字段已存在')
        }

        // 检查gesture_password字段是否已存在
        const [gesturePasswordColumns] = await pool.execute(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'leaftalk-new'
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'gesture_password'
        `)

        if (gesturePasswordColumns.length === 0) {
            // 添加gesture_password字段
            await pool.execute(`
                ALTER TABLE users
                ADD COLUMN gesture_password VARCHAR(255) DEFAULT NULL
                COMMENT '手势密码(加密存储)'
            `)
            results.push('gesture_password字段添加成功')
        } else {
            results.push('gesture_password字段已存在')
        }

        // 检查password_style字段是否已存在
        const [passwordStyleColumns] = await pool.execute(`


            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'leaftalk-new'
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'password_style'
        `)

        if (passwordStyleColumns.length === 0) {
            // 添加password_style字段
            await pool.execute(`
                ALTER TABLE users
                ADD COLUMN password_style ENUM('numeric', 'gesture', 'fingerprint') DEFAULT 'numeric'
                COMMENT '支付密码样式设置'
            `)
            results.push('password_style字段添加成功')
        } else {
            results.push('password_style字段已存在')
        }

        res.json({
            success: true,
            message: results.join(', '),
            results: results
        })
    } catch (error) {
        console.error('添加密码字段失败:', error)
        res.status(500).json({
            success: false,
            error: '添加字段失败: ' + error.message
        })
    }
})

// 检查支付密码状态
app.get('/api/payment/check-password', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT pay_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]
        res.json({
            success: true,
            hasPayPassword: !!user.pay_password
        })
    } catch (error) {
        console.error('检查支付密码状态失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 设置/修改支付密码
app.post('/api/payment/set-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!newPassword || newPassword.length !== 6) {
            return res.status(400).json({
                success: false,
                error: '支付密码必须为6位数字'
            })
        }

        // 检查新密码是否为纯数字
        if (!/^\d{6}$/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: '支付密码必须为6位数字'
            })
        }

        // 获取当前用户信息
        const [users] = await pool.execute(
            'SELECT pay_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        // 如果已有支付密码，需要验证旧密码
        if (user.pay_password) {
            if (!oldPassword) {
                return res.status(400).json({
                    success: false,
                    error: '请输入原支付密码'
                })
            }

            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.pay_password)
            if (!isOldPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: '原支付密码错误'
                })
            }
        }

        // 加密新支付密码
        const hashedPayPassword = await bcrypt.hash(newPassword, 10)

        // 更新支付密码
        await pool.execute(
            'UPDATE users SET pay_password = ? WHERE id = ?',
            [hashedPayPassword, req.user.userId]
        )

        res.json({
            success: true,
            message: user.pay_password ? '支付密码修改成功' : '支付密码设置成功'
        })
    } catch (error) {
        console.error('设置支付密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 验证支付密码
app.post('/api/payment/verify-password', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body

        if (!password) {
            return res.status(400).json({
                success: false,
                error: '请输入支付密码'
            })
        }

        // 获取用户支付密码
        const [users] = await pool.execute(
            'SELECT pay_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        if (!user.pay_password) {
            return res.status(400).json({
                success: false,
                error: '请先设置支付密码'
            })
        }

        // 验证支付密码
        const isPasswordValid = await bcrypt.compare(password, user.pay_password)

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: '支付密码错误'
            })
        }

        res.json({
            success: true,
            message: '支付密码验证成功'
        })
    } catch (error) {
        console.error('验证支付密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 检查手势密码状态
app.get('/api/payment/check-gesture-password', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT gesture_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]
        res.json({
            success: true,
            hasGesturePassword: !!user.gesture_password
        })
    } catch (error) {
        console.error('检查手势密码状态失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 设置/修改手势密码
app.post('/api/payment/set-gesture-password', authenticateToken, async (req, res) => {
    try {
        const { oldPattern, newPattern } = req.body

        if (!newPattern || newPattern.length < 4) {
            return res.status(400).json({
                success: false,
                error: '手势密码至少需要连接4个点'
            })
        }

        // 获取当前用户信息
        const [users] = await pool.execute(
            'SELECT gesture_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        // 如果已有手势密码，需要验证旧密码
        if (user.gesture_password) {
            if (!oldPattern) {
                return res.status(400).json({
                    success: false,
                    error: '请输入原手势密码'
                })
            }

            const isOldPatternValid = await bcrypt.compare(oldPattern, user.gesture_password)
            if (!isOldPatternValid) {
                return res.status(400).json({
                    success: false,
                    error: '原手势密码错误'
                })
            }
        }

        // 加密新手势密码
        const hashedGesturePassword = await bcrypt.hash(newPattern, 10)

        // 更新手势密码
        await pool.execute(
            'UPDATE users SET gesture_password = ? WHERE id = ?',
            [hashedGesturePassword, req.user.userId]
        )

        res.json({
            success: true,
            message: user.gesture_password ? '手势密码修改成功' : '手势密码设置成功'
        })
    } catch (error) {
        console.error('设置手势密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 验证手势密码
app.post('/api/payment/verify-gesture-password', authenticateToken, async (req, res) => {
    try {
        const { pattern } = req.body

        if (!pattern) {
            return res.status(400).json({
                success: false,
                error: '请输入手势密码'
            })
        }

        // 获取用户手势密码
        const [users] = await pool.execute(
            'SELECT gesture_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        if (!user.gesture_password) {
            return res.status(400).json({
                success: false,
                error: '请先设置手势密码'
            })
        }

        // 验证手势密码
        const isPatternValid = await bcrypt.compare(pattern, user.gesture_password)

        if (!isPatternValid) {
            return res.status(400).json({
                success: false,
                error: '手势密码错误'
            })
        }

        res.json({
            success: true,
            message: '手势密码验证成功'
        })
    } catch (error) {
        console.error('验证手势密码失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 获取支付密码样式设置
app.get('/api/payment/password-style', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT password_style FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        res.json({
            success: true,
            style: user.password_style || 'numeric'
        })
    } catch (error) {
        console.error('获取支付密码样式失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 设置支付密码样式
app.post('/api/payment/password-style', authenticateToken, async (req, res) => {
    try {
        const { style } = req.body

        if (!style || !['numeric', 'gesture', 'fingerprint'].includes(style)) {
            return res.status(400).json({
                success: false,
                error: '无效的密码样式'
            })
        }

        // 检查用户是否已设置对应类型的密码
        const [users] = await pool.execute(
            'SELECT pay_password, gesture_password FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        // 检查是否需要设置对应类型的密码（给出提示但不阻止设置样式）
        let needSetupWarning = null
        if (style === 'numeric' && !user.pay_password) {
            needSetupWarning = {
                message: '您还未设置数字密码，建议先设置数字密码',
                needSetup: true,
                setupType: 'numeric'
            }
        }

        if (style === 'gesture' && !user.gesture_password) {
            needSetupWarning = {
                message: '您还未设置手势密码，建议先设置手势密码',
                needSetup: true,
                setupType: 'gesture'
            }
        }

        // 更新密码样式设置（无论是否已设置对应密码都允许）
        await pool.execute(
            'UPDATE users SET password_style = ? WHERE id = ?',
            [style, req.user.userId]
        )

        const response = {
            success: true,
            message: '支付密码样式设置成功',
            style: style
        }

        // 如果有设置建议，添加到响应中
        if (needSetupWarning) {
            response.warning = needSetupWarning
        }

        res.json(response)
    } catch (error) {
        console.error('设置支付密码样式失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
})

// 更新用户信息
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        await ensureUserProfileColumns()
        const userId = req.user.userId
        const { nickname, avatar, phone, real_name, gender, region, signature, qrCodeUrl, qr_code_url, require_friend_verification } = req.body

        console.log('🔄 更新用户信息:', { userId, nickname, avatar, phone, real_name, gender, region, signature, require_friend_verification })

        // 构建动态更新SQL
        const updateFields = []
        const updateValues = []

        if (nickname !== undefined) {
            updateFields.push('nickname = ?')
            updateValues.push(nickname)
        }
        if (avatar !== undefined) {
            updateFields.push('avatar = ?')
            updateValues.push(avatar)
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?')
            updateValues.push(phone)
        }
        if (real_name !== undefined) {
            updateFields.push('real_name = ?')
            updateValues.push(real_name)
        }
        if (gender !== undefined) {
            updateFields.push('gender = ?')
            updateValues.push(gender)
        }
        if (region !== undefined) {
            updateFields.push('region = ?')
            updateValues.push(region)
        }
        if (signature !== undefined) {
            updateFields.push('signature = ?')
            updateValues.push(signature)
        }
        const qrFinal = (qrCodeUrl !== undefined) ? qrCodeUrl : qr_code_url
        if (qrFinal !== undefined) {
            updateFields.push('qr_code_url = ?')
            updateValues.push(qrFinal)
        }
        if (require_friend_verification !== undefined) {
            updateFields.push('require_friend_verification = ?')
            updateValues.push(require_friend_verification ? 1 : 0)
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有提供要更新的字段'
            })
        }

        // 添加更新时间和用户ID
        updateFields.push('updated_at = NOW()')
        updateValues.push(userId)

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`

        await pool.execute(sql, updateValues)

        // 获取更新后的用户信息
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status, gender, region, signature, qr_code_url, require_friend_verification FROM users WHERE id = ?',
            [userId]
        )

        res.json({
            success: true,
            data: users[0],
            message: '用户信息更新成功'
        })

        console.log('✅ 用户信息更新成功:', users[0])
    } catch (error) {
        console.error('❌ 更新用户信息失败:', error)
        res.status(500).json({
            success: false,
            error: '更新用户信息失败: ' + error.message
        })
    }
})

// 发送手机验证码
app.post('/api/sms/send-code', authenticateToken, async (req, res) => {
    try {
        const { phone, type } = req.body

        if (!phone || !type) {
            return res.status(400).json({
                success: false,
                error: '手机号和类型不能为空'
            })
        }

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                error: '手机号格式不正确'
            })
        }

        // 检查手机号是否已被其他用户使用
        if (type === 'change_phone') {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE phone = ? AND id != ?',
                [phone, req.user.userId]
            )

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: '该手机号已被其他账户绑定'
                })
            }
        }

        // 生成6位验证码
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        // 存储验证码到Redis（1分钟过期）
        const codeKey = `sms_code:${type}:${phone}`
        await redisClient.setex(codeKey, 60, verificationCode)

        // 这里应该调用短信服务发送验证码
        // 暂时在控制台输出验证码用于测试
        console.log(`📱 发送验证码到 ${phone}: ${verificationCode}`)

        res.json({
            success: true,
            message: '验证码发送成功',
            // 开发环境下返回验证码，生产环境应该移除
            ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
        })
    } catch (error) {
        console.error('发送验证码失败:', error)
        res.status(500).json({
            success: false,
            error: '发送验证码失败'
        })
    }
})

// 更换手机号
app.put('/api/user/change-phone', authenticateToken, async (req, res) => {
    try {
        const { newPhone, verificationCode } = req.body

        if (!newPhone || !verificationCode) {
            return res.status(400).json({
                success: false,
                error: '新手机号和验证码不能为空'
            })
        }

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(newPhone)) {
            return res.status(400).json({
                success: false,
                error: '手机号格式不正确'
            })
        }

        // 检查手机号是否已被其他用户使用
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE phone = ? AND id != ?',
            [newPhone, req.user.userId]
        )

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: '该手机号已被其他账户绑定'
            })
        }

        // 验证验证码
        const codeKey = `sms_code:change_phone:${newPhone}`
        const storedCode = await redisClient.get(codeKey)

        if (!storedCode || storedCode !== verificationCode) {
            return res.status(400).json({
                success: false,
                error: '验证码不正确或已过期'
            })
        }

        // 更新用户手机号
        await pool.execute(
            'UPDATE users SET phone = ?, updated_at = NOW() WHERE id = ?',
            [newPhone, req.user.userId]
        )

        // 删除已使用的验证码
        await redisClient.del(codeKey)

        // 获取更新后的用户信息
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status FROM users WHERE id = ?',
            [req.user.userId]
        )

        console.log(`✅ 用户 ${req.user.userId} 手机号更换成功: ${newPhone}`)

        res.json({
            success: true,
            data: users[0],
            message: '手机号更换成功'
        })
    } catch (error) {
        console.error('更换手机号失败:', error)
        res.status(500).json({
            success: false,
            error: '更换手机号失败'
        })
    }
})

// 检查叶语号是否可用
app.post('/api/user/check-yeyu-id', authenticateToken, async (req, res) => {
    try {
        const { yeyuId } = req.body

        if (!yeyuId) {
            return res.status(400).json({
                success: false,
                error: '叶语号不能为空'
            })
        }

        // 验证叶语号格式
        if (!/^[a-zA-Z0-9_]+$/.test(yeyuId)) {
            return res.status(400).json({
                success: false,
                error: '叶语号只能包含字母、数字和下划线'
            })
        }

        if (yeyuId.length < 6 || yeyuId.length > 20) {
            return res.status(400).json({
                success: false,
                error: '叶语号长度必须在6-20个字符之间'
            })
        }

        // 检查是否与当前用户的叶语号相同
        const [currentUser] = await pool.execute(
            'SELECT yeyu_id FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (currentUser.length > 0 && currentUser[0].yeyu_id === yeyuId) {
            return res.json({
                success: true,
                available: false,
                message: '不能与当前叶语号相同'
            })
        }

        // 检查叶语号是否已被其他用户使用
        console.log(`🔍 检查叶语号唯一性: ${yeyuId}, 当前用户ID: ${req.user.userId}`)

        const [existingUsers] = await pool.execute(
            'SELECT id, yeyu_id, nickname FROM users WHERE yeyu_id = ? AND id != ?',
            [yeyuId, req.user.userId]
        )

        console.log(`📊 查询结果:`, existingUsers)

        const available = existingUsers.length === 0

        console.log(`✅ 叶语号 ${yeyuId} ${available ? '可用' : '已被使用'}`)

        res.json({
            success: true,
            available: available,
            message: available ? '叶语号可以使用' : '叶语号已被使用'
        })
    } catch (error) {
        console.error('检查叶语号失败:', error)
        res.status(500).json({
            success: false,
            error: '检查叶语号失败'
        })
    }
})

// 更换叶语号
app.put('/api/user/change-yeyu-id', authenticateToken, async (req, res) => {
    try {
        const { newYeyuId } = req.body

        if (!newYeyuId) {
            return res.status(400).json({
                success: false,
                error: '新叶语号不能为空'
            })
        }

        // 验证叶语号格式
        if (!/^[a-zA-Z0-9_]+$/.test(newYeyuId)) {
            return res.status(400).json({
                success: false,
                error: '叶语号只能包含字母、数字和下划线'
            })
        }

        if (newYeyuId.length < 6 || newYeyuId.length > 20) {
            return res.status(400).json({
                success: false,
                error: '叶语号长度必须在6-20个字符之间'
            })
        }

        // 检查叶语号是否已被其他用户使用
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE yeyu_id = ? AND id != ?',
            [newYeyuId, req.user.userId]
        )

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: '该叶语号已被其他用户使用'
            })
        }

        // 检查用户是否在过去365天内修改过叶语号
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        const [modificationHistory] = await pool.execute(
            'SELECT COUNT(*) as count, MAX(created_at) as last_modified FROM yeyu_id_changes WHERE user_id = ? AND created_at > ?',
            [req.user.userId, oneYearAgo]
        )

        if (modificationHistory[0].count >= 1) {
            const lastModified = new Date(modificationHistory[0].last_modified)
            const nextAllowedDate = new Date(lastModified)
            nextAllowedDate.setFullYear(nextAllowedDate.getFullYear() + 1)

            const nextAllowedDateStr = `${nextAllowedDate.getFullYear()}年${nextAllowedDate.getMonth() + 1}月${nextAllowedDate.getDate()}日`

            return res.status(400).json({
                success: false,
                error: `每年只能修改一次叶语号，下次可修改时间：${nextAllowedDateStr}`
            })
        }

        // 获取数据库连接开始事务
        const connection = await pool.getConnection()

        try {
            // 开始事务
            await connection.beginTransaction()
            console.log(`🔄 开始叶语号修改事务，用户ID: ${req.user.userId}`)

            // 获取当前叶语号
            const [currentUser] = await connection.execute(
                'SELECT yeyu_id FROM users WHERE id = ?',
                [req.user.userId]
            )

            const oldYeyuId = currentUser[0].yeyu_id
            console.log(`📝 当前叶语号: ${oldYeyuId} → 新叶语号: ${newYeyuId}`)

            // 更新用户叶语号
            const [updateResult] = await connection.execute(
                'UPDATE users SET yeyu_id = ?, updated_at = NOW() WHERE id = ?',
                [newYeyuId, req.user.userId]
            )
            console.log(`✅ 用户表更新成功，影响行数: ${updateResult.affectedRows}`)

            // 记录修改历史
            const [insertResult] = await connection.execute(
                'INSERT INTO yeyu_id_changes (user_id, old_yeyu_id, new_yeyu_id, created_at) VALUES (?, ?, ?, NOW())',
                [req.user.userId, oldYeyuId, newYeyuId]
            )
            console.log(`✅ 历史记录插入成功，插入ID: ${insertResult.insertId}`)

            // 提交事务
            await connection.commit()
            console.log(`✅ 事务提交成功`)

            // 获取更新后的用户信息
            const [users] = await connection.execute(
                'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status FROM users WHERE id = ?',
                [req.user.userId]
            )

            connection.release()

            console.log(`✅ 用户 ${req.user.userId} 叶语号更换成功: ${oldYeyuId} → ${newYeyuId}`)

            res.json({
                success: true,
                data: users[0],
                message: '叶语号更换成功'
            })

        } catch (transactionError) {
            // 回滚事务
            await connection.rollback()
            connection.release()
            console.error(`❌ 事务回滚: ${transactionError.message}`)
            throw transactionError
        }

    } catch (error) {
        console.error('更换叶语号失败:', error)
        res.status(500).json({
            success: false,
            error: '更换叶语号失败'
        })
    }
})

// 检查叶语号修改状态API
app.get('/api/user/yeyu-id-status', authenticateToken, async (req, res) => {
    try {
        // 检查过去365天内的修改次数
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        const [modificationHistory] = await pool.execute(
            'SELECT COUNT(*) as count, MAX(created_at) as last_modified FROM yeyu_id_changes WHERE user_id = ? AND created_at > ?',
            [req.user.userId, oneYearAgo]
        )

        const modificationCount = modificationHistory[0].count
        const lastModified = modificationHistory[0].last_modified
        const canModify = modificationCount < 1

        // 计算下次可修改时间（从最后修改日期开始一年后）
        let nextModifyTime = null
        if (!canModify && lastModified) {
            const nextAllowedDate = new Date(lastModified)
            nextAllowedDate.setFullYear(nextAllowedDate.getFullYear() + 1)
            nextModifyTime = `${nextAllowedDate.getFullYear()}年${nextAllowedDate.getMonth() + 1}月${nextAllowedDate.getDate()}日`
        }

        console.log(`📊 用户 ${req.user.userId} 叶语号修改状态: 过去一年修改${modificationCount}次, 可修改: ${canModify}`)
        if (!canModify) {
            console.log(`📅 最后修改时间: ${lastModified}, 下次可修改: ${nextModifyTime}`)
        }

        res.json({
            success: true,
            data: {
                canModify,
                modificationCount,
                maxModifications: 1,
                lastModified,
                nextModifyTime,
                oneYearPeriod: true // 标识使用365天周期而不是自然年
            }
        })
    } catch (error) {
        console.error('检查叶语号修改状态失败:', error)
        res.status(500).json({
            success: false,
            error: '检查修改状态失败'
        })
    }
})

// 获取用户设置API
app.get('/api/user/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId

        // 查询用户设置（如果没有设置记录，返回默认设置）
        const [settings] = await pool.execute(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [userId]
        )

        let userSettings = {}

        if (settings.length > 0) {
            // 用户有自定义设置
            const settingData = settings[0]
            userSettings = {
                // 映射现有字段
                language: settingData.language || 'zh-CN',
                fontSize: settingData.font_size || 'standard',
                autoDownload: settingData.auto_download || true,
                soundEnabled: settingData.sound_enabled || true,
                vibrationEnabled: settingData.vibration_enabled || true,
                showPreview: settingData.message_preview || true,
                notifications: settingData.notifications || true,
                darkMode: settingData.dark_mode || false,
                autoSavePhotos: settingData.auto_save_photos || true,
                autoSaveVideos: settingData.auto_save_videos || true,
                dataUsageOptimization: settingData.data_usage_optimization || false,

                // 提供默认值给前端期望的字段
                enterToSend: false,
                translateEnabled: true,
                chatBackground: 'default',
                photoVideoQuality: 'standard',
                momentsEnabled: true,
                videoChannelEnabled: true,
                liveAndNearbyEnabled: true,
                earphoneMode: false,
                voiceToText: true,
                textToVoice: false,
                highContrast: false,
                autoCleanup: true,
                cleanupDays: 7,
                maxStorageSize: 10
            }
        } else {
            // 返回默认设置
            userSettings = {
                language: 'zh-CN',
                fontSize: 'standard',
                enterToSend: false,
                translateEnabled: true,
                chatBackground: 'default',
                autoDownload: true,
                photoVideoQuality: 'standard',
                momentsEnabled: true,
                videoChannelEnabled: true,
                liveAndNearbyEnabled: true,
                earphoneMode: false,
                voiceToText: true,
                textToVoice: false,
                highContrast: false,
                autoCleanup: true,
                cleanupDays: 7,
                maxStorageSize: 10,
                soundEnabled: true,
                vibrationEnabled: true,
                showPreview: true
            }
        }

        console.log('✅ 获取用户设置成功:', { userId, settingsCount: settings.length })

        res.json({
            success: true,
            data: userSettings
        })
    } catch (error) {
        console.error('❌ 获取用户设置失败:', error)
        res.status(500).json({
            success: false,
            error: '获取用户设置失败'
        })
    }
})

// 更新用户设置API
app.put('/api/user/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId
        const settings = req.body

        console.log('🔄 更新用户设置:', { userId, settings })

        // 检查用户设置是否存在
        const [existingSettings] = await pool.execute(
            'SELECT id FROM user_settings WHERE user_id = ?',
            [userId]
        )

        if (existingSettings.length > 0) {
            // 更新现有设置（只更新现有表中存在的字段）
            await pool.execute(`
                UPDATE user_settings SET
                    language = ?,
                    font_size = ?,
                    auto_download = ?,
                    sound_enabled = ?,
                    vibration_enabled = ?,
                    message_preview = ?,
                    notifications = ?,
                    dark_mode = ?,
                    auto_save_photos = ?,
                    auto_save_videos = ?,
                    data_usage_optimization = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            `, [
                settings.language || 'zh-CN',
                settings.fontSize || 'standard',
                settings.autoDownload !== undefined ? settings.autoDownload : true,
                settings.soundEnabled !== undefined ? settings.soundEnabled : true,
                settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true,
                settings.showPreview !== undefined ? settings.showPreview : true,
                settings.notifications !== undefined ? settings.notifications : true,
                settings.darkMode !== undefined ? settings.darkMode : false,
                settings.autoSavePhotos !== undefined ? settings.autoSavePhotos : true,
                settings.autoSaveVideos !== undefined ? settings.autoSaveVideos : true,
                settings.dataUsageOptimization !== undefined ? settings.dataUsageOptimization : false,
                userId
            ])
        } else {
            // 创建新设置记录（只插入现有表中存在的字段）
            await pool.execute(`
                INSERT INTO user_settings (
                    user_id, language, font_size, auto_download, sound_enabled,
                    vibration_enabled, message_preview, notifications, dark_mode,
                    auto_save_photos, auto_save_videos, data_usage_optimization,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                userId,
                settings.language || 'zh-CN',
                settings.fontSize || 'standard',
                settings.autoDownload !== undefined ? settings.autoDownload : true,
                settings.soundEnabled !== undefined ? settings.soundEnabled : true,
                settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true,
                settings.showPreview !== undefined ? settings.showPreview : true,
                settings.notifications !== undefined ? settings.notifications : true,
                settings.darkMode !== undefined ? settings.darkMode : false,
                settings.autoSavePhotos !== undefined ? settings.autoSavePhotos : true,
                settings.autoSaveVideos !== undefined ? settings.autoSaveVideos : true,
                settings.dataUsageOptimization !== undefined ? settings.dataUsageOptimization : false
            ])
        }

        console.log('✅ 用户设置更新成功:', userId)

        res.json({
            success: true,
            message: '设置更新成功'
        })
    } catch (error) {
        console.error('❌ 更新用户设置失败:', error)
        res.status(500).json({
            success: false,
            error: '更新用户设置失败'
        })
    }
})

// 身份认证状态API (开发环境免token)
app.get('/api/identity/status', async (req, res) => {
    try {
        // 开发环境直接返回未认证状态
        console.log('🔍 身份认证状态检查 - 开发环境模式')
        res.json({
            success: true,
            data: {
                verified: false,
                status: 'pending',
                message: '开发环境 - 尚未进行实名认证'
            }
        })
    } catch (error) {
        console.error('身份认证状态API错误:', error)
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        })
    }
})

// ==================== 聊天背景设置 API ====================

// 获取用户的所有聊天背景设置
app.get('/api/chat-backgrounds', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId

        // 从 user_settings 表中获取 chat_backgrounds JSON 字段
        const [settings] = await pool.execute(
            'SELECT chat_backgrounds FROM user_settings WHERE user_id = ?',
            [userId]
        )

        let backgrounds = {}
        if (settings.length > 0 && settings[0].chat_backgrounds) {
            try {
                backgrounds = JSON.parse(settings[0].chat_backgrounds)
            } catch (e) {
                console.error('❌ 解析聊天背景JSON失败:', e)
            }
        }

        console.log('✅ 获取聊天背景设置成功:', { userId, count: Object.keys(backgrounds).length })

        res.json({
            success: true,
            data: backgrounds
        })
    } catch (error) {
        console.error('❌ 获取聊天背景设置失败:', error)
        res.status(500).json({
            success: false,
            error: '获取聊天背景设置失败'
        })
    }
})

// 保存单个聊天的背景设置
app.post('/api/chat-backgrounds/:chatId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId
        const { chatId } = req.params
        const { background } = req.body

        console.log('🎨 保存聊天背景:', { userId, chatId, backgroundLength: background?.length || 0 })

        // 检查用户设置是否存在
        const [existingSettings] = await pool.execute(
            'SELECT id, chat_backgrounds FROM user_settings WHERE user_id = ?',
            [userId]
        )

        let backgrounds = {}
        if (existingSettings.length > 0 && existingSettings[0].chat_backgrounds) {
            try {
                backgrounds = JSON.parse(existingSettings[0].chat_backgrounds)
            } catch (e) {
                console.error('❌ 解析现有聊天背景JSON失败:', e)
            }
        }

        // 更新指定聊天的背景
        backgrounds[chatId] = background

        const backgroundsJSON = JSON.stringify(backgrounds)

        if (existingSettings.length > 0) {
            // 更新现有设置
            await pool.execute(
                'UPDATE user_settings SET chat_backgrounds = ?, updated_at = NOW() WHERE user_id = ?',
                [backgroundsJSON, userId]
            )
        } else {
            // 创建新设置记录
            await pool.execute(
                'INSERT INTO user_settings (user_id, chat_backgrounds, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                [userId, backgroundsJSON]
            )
        }

        console.log('✅ 聊天背景保存成功:', { userId, chatId })

        res.json({
            success: true,
            message: '聊天背景保存成功'
        })
    } catch (error) {
        console.error('❌ 保存聊天背景失败:', error)
        res.status(500).json({
            success: false,
            error: '保存聊天背景失败'
        })
    }
})

// 删除单个聊天的背景设置
app.delete('/api/chat-backgrounds/:chatId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId
        const { chatId } = req.params

        console.log('🗑️ 删除聊天背景:', { userId, chatId })

        // 获取现有设置
        const [existingSettings] = await pool.execute(
            'SELECT id, chat_backgrounds FROM user_settings WHERE user_id = ?',
            [userId]
        )

        if (existingSettings.length > 0 && existingSettings[0].chat_backgrounds) {
            let backgrounds = {}
            try {
                backgrounds = JSON.parse(existingSettings[0].chat_backgrounds)
            } catch (e) {
                console.error('❌ 解析聊天背景JSON失败:', e)
            }

            // 删除指定聊天的背景
            delete backgrounds[chatId]

            const backgroundsJSON = JSON.stringify(backgrounds)

            await pool.execute(
                'UPDATE user_settings SET chat_backgrounds = ?, updated_at = NOW() WHERE user_id = ?',
                [backgroundsJSON, userId]
            )

            console.log('✅ 聊天背景删除成功:', { userId, chatId })
        }

        res.json({
            success: true,
            message: '聊天背景删除成功'
        })
    } catch (error) {
        console.error('❌ 删除聊天背景失败:', error)
        res.status(500).json({
            success: false,
            error: '删除聊天背景失败'
        })
    }
})

// ==================== 开发环境测试 API ====================

// 开发环境测试API
app.get('/api/dev/test-token', async (req, res) => {
    try {
        // 生成测试token - 30天过期
        const testToken = jwt.sign(
            { userId: 1, phone: '13800138000', username: 'testuser' },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        res.json({
            success: true,
            data: {
                token: testToken,
                message: '测试token生成成功',
                usage: '在请求头中添加: Authorization: Bearer ' + testToken
            }
        })
    } catch (error) {
        console.error('生成测试token失败:', error)
        res.status(500).json({ error: '生成测试token失败' })
    }
})

// 调试用户信息API - 无需认证的版本
app.get('/api/dev/user-info/:userId', async (req, res) => {
    try {
        const { userId } = req.params

        console.log('🔍 查询用户信息:', userId)

        // 查询用户信息
        const [users] = await db.execute(
            'SELECT id, yeyu_id, username, nickname, phone, password FROM users WHERE id = ?',
            [userId]
        )

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            })
        }

        const user = users[0]

        console.log('👤 用户信息:', {
            id: user.id,
            username: user.username,
            hasPassword: !!user.password,
            passwordLength: user.password?.length
        })

        res.json({
            success: true,
            data: {
                id: user.id,
                yeyu_id: user.yeyu_id,
                username: user.username,
                nickname: user.nickname,
                phone: user.phone,
                hasPassword: !!user.password,
                passwordLength: user.password?.length,
                passwordHash: user.password?.substring(0, 20) + '...',
                // 在开发环境下显示完整密码
                fullPassword: process.env.NODE_ENV === 'development' ? user.password : '***'
            }
        })
    } catch (error) {
        console.error('获取用户信息失败:', error)
        res.status(500).json({ error: '获取用户信息失败' })
    }
})

// 临时密码重置API - 仅开发环境
app.post('/api/dev/reset-password/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const { newPassword } = req.body

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: '请提供新密码'
            })
        }

        console.log('🔧 重置用户密码:', { userId, newPassword })

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 更新密码
        await db.execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        )

        console.log('✅ 密码重置成功:', userId)

        res.json({
            success: true,
            message: `用户 ${userId} 的密码已重置为: ${newPassword}`
        })
    } catch (error) {
        console.error('重置密码失败:', error)
        res.status(500).json({ error: '重置密码失败' })
    }
})

// 身份状态路由
app.get('/api/identity/status', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status FROM users WHERE id = ?',
            [req.user.userId]
        )

        if (users.length === 0) {
            return res.status(404).json({ error: '用户不存在' })
        }

        res.json({
            success: true,
            data: {
                user: users[0],
                authenticated: true,
                tokenValid: true
            },
            message: '身份验证成功'
        })
    } catch (error) {
        console.error('获取身份状态失败:', error)
        res.status(500).json({ error: '获取身份状态失败' })
    }
})

// OCR识别路由
app.post('/api/ocr/id-card', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片' })
        }

        const result = await ocrService.recognizeIdCard(req.file.path)
        res.json(result)
    } catch (error) {
        console.error('OCR识别失败:', error)
        res.status(500).json({ error: 'OCR识别失败' })
    }
})

// 文件上传路由
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择文件' })
        }

        const result = await fileUploadService.processUpload(req.file, req.user.userId)
        res.json(result)
    } catch (error) {
        console.error('文件上传失败:', error)
        res.status(500).json({ error: '文件上传失败' })
    }
})

// 头像上传路由
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择头像文件'
            })
        }

        const userId = req.user.userId
        console.log('🖼️ 用户头像上传:', { userId, fileName: req.file.originalname, size: req.file.size })

        // 创建uploads/avatars目录
        const avatarsDir = path.join(__dirname, '../uploads/avatars')
        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true })
        }

        // 生成文件名
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const ext = path.extname(req.file.originalname)
        const filename = `${timestamp}_${randomString}${ext}`
        const filePath = path.join(avatarsDir, filename)
        const relativePath = `uploads/avatars/${filename}`

        // 保存文件
        fs.writeFileSync(filePath, req.file.buffer)

        // 构建头像URL
        const avatarUrl = `http://localhost:8893/${relativePath}`

        // 更新用户表中的头像字段
        await db.execute(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarUrl, userId]
        )

        console.log('✅ 头像上传成功:', avatarUrl)

        res.json({
            success: true,
            data: {
                avatar: avatarUrl,
                avatar_url: avatarUrl
            },
            message: '头像上传成功'
        })
    } catch (error) {
        console.error('头像上传失败:', error)


        res.status(500).json({
            success: false,
            error: '头像上传失败: ' + error.message
        })
    }
})



// 联系人相关路由
app.get('/api/contacts', authenticateToken, async (req, res) => {
    try {
        console.log('📱 联系人API被调用，用户ID:', req.user.userId)

        // 先尝试从数据库获取真实的联系人数据
        let contacts = []

        try {
            // 首先检查数据库中有哪些用户
            const [allUsers] = await pool.execute('SELECT id, username, nickname, phone, yeyu_id FROM users ORDER BY id')
            console.log('📱 数据库中的所有用户:', allUsers)

            // 获取当前用户的真实数据库ID
            let currentUserId = req.user.userId
            const [currentUserData] = await pool.execute('SELECT id FROM users WHERE id = ? OR yeyu_id = ?', [req.user.userId, req.user.userId])
            if (currentUserData.length > 0) {
                currentUserId = currentUserData[0].id
                console.log('📱 当前用户数据库ID:', currentUserId, '(原始ID:', req.user.userId, ')')
            } else {
                console.log('⚠️ 找不到当前用户:', req.user.userId)
                return res.json({ success: true, data: [] })
            }

            // 检查friendships表是否存在和有数据
            try {
                const [friendships] = await pool.execute('SELECT * FROM friendships WHERE user_id = ? OR friend_id = ?', [currentUserId, currentUserId])
                console.log('📱 当前用户的好友关系:', friendships)
            } catch (friendshipError) {
                console.log('⚠️ friendships表查询失败:', friendshipError.message)
            }

            // 检查friend_requests表
            try {
                const [requests] = await pool.execute('SELECT * FROM friend_requests WHERE requester_id = ? OR requestee_id = ?', [currentUserId, currentUserId])
                console.log('📱 当前用户的好友请求:', requests)
            } catch (requestError) {
                console.log('⚠️ friend_requests表查询失败:', requestError.message)
            }



            // 尝试使用friendships表查询（优先带黑名单过滤；若表不存在则降级为无黑名单过滤）
            try {
                let dbContacts = []
                try {
                    const [rows] = await pool.execute(`
                        SELECT DISTINCT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
                               f.created_at as friend_since,
                               COALESCE(fr.remark, f.remark) AS remark,
                               fr.description AS description,
                               fr.tags AS remark_tags,
                               fr.phones AS remark_phones
                        FROM friendships f
                        JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
                        LEFT JOIN friend_remarks fr ON fr.user_id = ? AND fr.friend_id = u.id
                        LEFT JOIN user_blacklist ub ON ub.user_id = ? AND ub.blocked_user_id = u.id
                        WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
                        ORDER BY f.created_at DESC
                    `, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId])
                    dbContacts = rows
                } catch (e) {
                    console.log('⚠️ user_blacklist 不存在或查询失败，改用无黑名单过滤的查询:', e.message)
                    const [rows2] = await pool.execute(`
                        SELECT DISTINCT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
                               f.created_at as friend_since,
                               COALESCE(fr.remark, f.remark) AS remark,
                               fr.description AS description,
                               fr.tags AS remark_tags,
                               fr.phones AS remark_phones
                        FROM friendships f
                        JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
                        LEFT JOIN friend_remarks fr ON fr.user_id = ? AND fr.friend_id = u.id
                        WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
                        ORDER BY f.created_at DESC
                    `, [currentUserId, currentUserId, currentUserId, currentUserId])
                    dbContacts = rows2
                }

                contacts = dbContacts
                console.log('📱 通过friendships表获取到联系人(含双向):', contacts.length, '个')
            } catch (friendshipQueryError) {
                console.log('⚠️ friendships表查询失败，尝试friend_requests表:', friendshipQueryError.message)

                // 如果friendships表查询失败，尝试friend_requests表
                const [dbContacts] = await pool.execute(`
                    SELECT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
                           f.created_at as friend_since, NULL as remark_name
                    FROM friend_requests f
                    JOIN users u ON (f.requester_id = ? AND f.requestee_id = u.id) OR (f.requestee_id = ? AND f.requester_id = u.id)
                    WHERE f.status = 'accepted' AND u.id != ?
                    ORDER BY f.created_at DESC
                `, [currentUserId, currentUserId, currentUserId])

                contacts = dbContacts
                console.log('📱 通过friend_requests表获取到联系人:', contacts.length, '个')
        // 补充星标标识
        try {
            await ensureStarFriendsTable()
            const [starRows] = await pool.execute('SELECT friend_id FROM star_friends WHERE user_id = ?', [currentUserId])
            const starred = new Set((starRows || []).map(r => r.friend_id))
            contacts = contacts.map(c => ({ ...c, is_starred: starred.has(c.id) }))
        } catch (e) {
            console.warn('⚠️ 星标状态填充失败:', e.message)
        }

            }

            console.log('📱 最终联系人详细信息:', contacts)
        } catch (dbError) {
            console.warn('⚠️ 数据库查询失败:', dbError.message)
            console.warn('⚠️ 错误详情:', dbError)
        }

        // 暂时禁用测试用户过滤，让所有联系人都显示
        console.log('📱 跳过测试用户过滤，显示所有联系人')

        console.log('✅ 过滤后的联系人数据:', contacts.length, '个')
        res.json({
            success: true,
            data: contacts
        })
    } catch (error) {
        console.error('❌ 获取联系人失败:', error)
        res.status(500).json({ error: '获取联系人失败' })
    }
})

// 聊天文件上传（图片/视频/语音/文件）
app.post('/api/chat/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未选择文件' })
    }

    const userId = req.user.userId
    console.log('🗂️ 聊天文件上传:', { userId, fileName: req.file.originalname, size: req.file.size })

    // 确保 uploads/chat 目录存在
    const chatDir = path.join(__dirname, '../uploads/chat')
    if (!fs.existsSync(chatDir)) {
      fs.mkdirSync(chatDir, { recursive: true })
    }

    // 生成文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const ext = path.extname(req.file.originalname) || ''
    const filename = `${timestamp}_${randomString}${ext}`
    const filePath = path.join(chatDir, filename)

    // 保存文件
    fs.writeFileSync(filePath, req.file.buffer)

    // 构建URL（绝对地址 + 相对路径）
    const relativePath = `/uploads/chat/${filename}`
    const fileUrl = `http://localhost:8893${relativePath}`

    console.log('✅ 聊天文件保存成功:', { url: fileUrl })

    return res.json({
      success: true,
      data: { url: fileUrl, path: relativePath, fileName: filename, size: req.file.size },
      message: '上传成功'
    })
  } catch (error) {
    console.error('❌ 聊天文件上传失败:', error)
    return res.status(500).json({ success: false, message: '上传失败: ' + error.message })
  }
})

// 好友权限设置（前端需要的占位接口）

// 备注包持久化：确保表存在
async function ensureFriendRemarksTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS friend_remarks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        remark VARCHAR(255) DEFAULT NULL,
        tags TEXT DEFAULT NULL,
        phones TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_friend (user_id, friend_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  } catch (e) {
    console.error('❌ 创建 friend_remarks 表失败:', e)
  }
}

// 获取备注包
app.get('/api/contacts/:friendId/remark-pack', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const friendId = req.params.friendId
    if (!userId || !friendId) return res.status(400).json({ success: false, error: '参数错误' })

    await ensureFriendRemarksTable()

    const [rows] = await pool.execute(
      'SELECT remark, tags, phones, description, updated_at FROM friend_remarks WHERE user_id = ? AND friend_id = ? LIMIT 1',
      [userId, friendId]
    )

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: { remark: '', tags: [], phones: [], description: '' } })
    }

    const row = rows[0]
    let tags = []
    let phones = []
    try { tags = row.tags ? JSON.parse(row.tags) : [] } catch (e) {}
    try { phones = row.phones ? JSON.parse(row.phones) : [] } catch (e) {}

    return res.json({ success: true, data: { remark: row.remark || '', tags, phones, description: row.description || '', updated_at: row.updated_at } })
  } catch (e) {
    console.error('❌ 获取备注包失败:', e)
    return res.status(500).json({ success: false, error: '获取备注包失败' })
  }
})

// 保存/更新备注包
app.put('/api/contacts/:friendId/remark-pack', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const friendId = req.params.friendId
    const { name, remark, tags, phones, description } = req.body || {}

    if (!userId || !friendId) return res.status(400).json({ success: false, error: '参数错误' })

    await ensureFriendRemarksTable()

    const remarkText = (remark ?? name ?? '').toString().slice(0, 255)
    const tagsText = JSON.stringify(Array.isArray(tags) ? tags : [])
    const phonesText = JSON.stringify(Array.isArray(phones) ? phones : [])
    const descText = (description ?? '').toString()

    await pool.execute(`
      INSERT INTO friend_remarks (user_id, friend_id, remark, tags, phones, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        remark = VALUES(remark),
        tags = VALUES(tags),
        phones = VALUES(phones),
        description = VALUES(description),
        updated_at = NOW()
    `, [userId, friendId, remarkText, tagsText, phonesText, descText])

    return res.json({ success: true })
  } catch (e) {
    console.error('❌ 保存备注包失败:', e)
    return res.status(500).json({ success: false, error: '保存备注包失败' })
  }
})

app.post('/api/contacts/:id/permissions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId
        const friendId = req.params.id
        const { chatScope, blockHimSeeMe, dontSeeHim } = req.body || {}

        // 仅聊天 = 双向不可见朋友圈
        const finalChatScope = (chatScope === 'chat') ? 'chat' : 'all'
        const finalBlock = !!(blockHimSeeMe || finalChatScope === 'chat')
        const finalDontSee = !!(dontSeeHim || finalChatScope === 'chat')

        // 确保数据表存在
        await db.execute(`
            CREATE TABLE IF NOT EXISTS friend_permissions (
              user_id BIGINT NOT NULL,
              friend_id BIGINT NOT NULL,
              chat_scope ENUM('all','chat') NOT NULL DEFAULT 'all',
              block_him_see_me TINYINT(1) NOT NULL DEFAULT 0,
              dont_see_him TINYINT(1) NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, friend_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        // UPSERT 持久化
        await db.execute(`
          INSERT INTO friend_permissions (user_id, friend_id, chat_scope, block_him_see_me, dont_see_him)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE chat_scope = VALUES(chat_scope), block_him_see_me = VALUES(block_him_see_me), dont_see_him = VALUES(dont_see_him)
        `, [userId, friendId, finalChatScope, finalBlock ? 1 : 0, finalDontSee ? 1 : 0])

        return res.json({ success: true, data: { chatScope: finalChatScope, blockHimSeeMe: finalBlock, dontSeeHim: finalDontSee } })
    } catch (e) {
        console.error('❌ 保存朋友权限失败:', e)
        return res.status(500).json({ success: false, message: '保存朋友权限失败' })
    }
})

// 获取朋友权限（持久化）
app.get('/api/contacts/:id/permissions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId
        const friendId = req.params.id

        // 确保数据表存在
        await db.execute(`
            CREATE TABLE IF NOT EXISTS friend_permissions (
              user_id BIGINT NOT NULL,
              friend_id BIGINT NOT NULL,
              chat_scope ENUM('all','chat') NOT NULL DEFAULT 'all',
              block_him_see_me TINYINT(1) NOT NULL DEFAULT 0,
              dont_see_him TINYINT(1) NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, friend_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        const [rows] = await db.execute(
          'SELECT chat_scope, block_him_see_me, dont_see_him FROM friend_permissions WHERE user_id = ? AND friend_id = ? LIMIT 1',
          [userId, friendId]
        )

        if (Array.isArray(rows) && rows.length > 0) {
            const r = rows[0]
            return res.json({ success: true, data: {
                chatScope: r.chat_scope === 'chat' ? 'chat' : 'all',
                blockHimSeeMe: !!r.block_him_see_me,
                dontSeeHim: !!r.dont_see_him
            }})
        }

        // 默认值
        return res.json({ success: true, data: { chatScope: 'all', blockHimSeeMe: false, dontSeeHim: false } })
    } catch (e) {
        console.error('❌ 获取朋友权限失败:', e)
        return res.status(500).json({ success: false, message: '获取朋友权限失败' })
    }
})



// 管理员删除用户接口（用于清理测试数据）
app.delete('/api/admin/delete-user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params
        console.log('🗑️ 管理员删除用户请求:', userId)

        // 开始事务
        await pool.execute('START TRANSACTION')

        try {
            // 1. 删除用户的好友关系
            await pool.execute('DELETE FROM friendships WHERE user_id = ? OR friend_id = ?', [userId, userId])

            // 2. 删除用户的好友请求
            await pool.execute('DELETE FROM friend_requests WHERE from_user_id = ? OR to_user_id = ?', [userId, userId])

            // 3. 删除用户的消息
            await pool.execute('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId])

            // 4. 删除用户
            const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId])

            if (result.affectedRows > 0) {
                await pool.execute('COMMIT')
                console.log('✅ 用户删除成功:', userId)
                res.json({ success: true, message: '用户删除成功' })
            } else {
                await pool.execute('ROLLBACK')
                res.status(404).json({ success: false, error: '用户不存在' })
            }

        } catch (dbError) {
            await pool.execute('ROLLBACK')
            throw dbError
        }

    } catch (error) {
        console.error('❌ 删除用户失败:', error)
        res.status(500).json({ success: false, error: '删除用户失败' })
    }
})

// 好友请求相关路由
app.get('/api/friends/requests', authenticateToken, async (req, res) => {
    try {
        // friend_requests 表已存在，直接查询

        // 获取收到的好友请求 - 返回所有状态（pending, accepted, rejected）
        // 同时查询备注信息（如果已经是好友）
        const [requests] = await pool.execute(`
            SELECT fr.id, fr.message, fr.created_at, fr.updated_at, fr.status,
                   u.id as user_id, u.yeyu_id, u.nickname, u.avatar,
                   f.remark
            FROM friend_requests fr
            JOIN users u ON fr.from_user_id = u.id
            LEFT JOIN friendships f ON (
                (f.user_id = ? AND f.friend_id = u.id) OR
                (f.friend_id = ? AND f.user_id = u.id)
            ) AND f.status = 'accepted'
            WHERE fr.to_user_id = ?
            ORDER BY fr.created_at DESC
        `, [req.user.userId, req.user.userId, req.user.userId])

        console.log(`📥 收到的好友请求数量: ${requests.length}`)

        res.json({
            success: true,
            data: requests
        })
    } catch (error) {
        console.error('❌ 获取好友请求失败:', error)
        res.status(500).json({ error: '获取好友请求失败' })
    }
})

app.get('/api/friends/requests/sent', authenticateToken, async (req, res) => {
    try {
        // 获取发送的好友请求 - 返回所有状态（pending, accepted, rejected）
        // 同时查询备注信息（如果已经是好友）
        const [requests] = await pool.execute(`
            SELECT fr.id, fr.message, fr.created_at, fr.updated_at, fr.status,
                   u.id as user_id, u.yeyu_id, u.nickname, u.avatar,
                   f.remark
            FROM friend_requests fr
            JOIN users u ON fr.to_user_id = u.id
            LEFT JOIN friendships f ON (
                (f.user_id = ? AND f.friend_id = u.id) OR
                (f.friend_id = ? AND f.user_id = u.id)
            ) AND f.status = 'accepted'
            WHERE fr.from_user_id = ?
            ORDER BY fr.created_at DESC
        `, [req.user.userId, req.user.userId, req.user.userId])

        console.log(`📤 发送的好友请求数量: ${requests.length}`)

        res.json({
            success: true,
            data: requests
        })
    } catch (error) {
        console.error('❌ 获取我的申请失败:', error)
        res.status(500).json({ error: '获取我的申请失败' })
    }
})

// 添加好友API
app.post('/api/contacts/add', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId
        const { userId, message } = req.body

        console.log('📤 发送好友请求:', { from: currentUserId, to: userId, message })

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '缺少用户ID',
                code: 400
            })
        }

        // 检查是否添加自己
        if (Number(userId) === Number(currentUserId)) {
            return res.status(400).json({
                success: false,
                message: '不能添加自己为好友',
                code: 400
            })
        }

        // 检查今日添加好友次数（一天最多20次）
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        const [todayRequests] = await db.execute(
            'SELECT COUNT(*) as count FROM friend_requests WHERE from_user_id = ? AND DATE(created_at) = ?',
            [currentUserId, todayStr]
        )

        const todayCount = todayRequests[0].count
        if (todayCount >= 20) {
            return res.status(429).json({
                success: false,
                message: '今日添加好友次数已达上限（20次），请明天再试',
                code: 429
            })
        }

        console.log(`📊 今日已添加好友次数: ${todayCount}/20`)

        // 检查目标用户是否存在，并获取其验证设置
        const [targetUsers] = await db.execute(
            'SELECT id, nickname, require_friend_verification FROM users WHERE id = ?',
            [userId]
        )

        if (targetUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在',
                code: 404
            })
        }

        const targetUser = targetUsers[0]
        const requireVerification = targetUser.require_friend_verification !== 0 // 默认需要验证

        // 检查是否已经是好友
        const [existingFriendship] = await db.execute(
            'SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [currentUserId, userId, userId, currentUserId]
        )

        if (existingFriendship.length > 0 && existingFriendship[0].status === 'accepted') {
            return res.status(400).json({
                success: false,
                message: '已经是好友了',
                code: 400
            })
        }

        // 检查是否已经发送过好友请求
        const [existingRequest] = await db.execute(
            'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?',
            [currentUserId, userId, 'pending']
        )

        if (existingRequest.length > 0) {
            return res.status(400).json({
                success: false,
                message: '已经发送过好友请求，请等待对方回应',
                code: 400
            })
        }

        // 根据目标用户的设置决定是直接成为好友还是发送请求
        if (requireVerification) {
            // 需要验证：创建好友请求
            await db.execute(
                'INSERT INTO friend_requests (from_user_id, to_user_id, message, status, created_at) VALUES (?, ?, ?, ?, NOW())',
                [currentUserId, userId, message || '我想加你为好友', 'pending']
            )

            console.log('✅ 好友请求发送成功（需要验证）')

            res.json({
                success: true,
                message: '好友请求已发送',
                code: 200,
                requireVerification: true
            })
        } else {
            // 不需要验证：直接成为好友
            // 创建双向好友关系
            await db.execute(
                'INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, ?, NOW())',
                [currentUserId, userId, 'accepted']
            )
            await db.execute(
                'INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, ?, NOW())',
                [userId, currentUserId, 'accepted']
            )

            // 同时创建一条已接受的好友请求记录（用于历史记录）
            await db.execute(
                'INSERT INTO friend_requests (from_user_id, to_user_id, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [currentUserId, userId, message || '我想加你为好友', 'accepted']
            )

            console.log('✅ 直接成为好友（无需验证）')

            res.json({
                success: true,
                message: '已成为好友',
                code: 200,
                requireVerification: false
            })
        }

    } catch (error) {
        console.error('❌ 发送好友请求失败:', error)
        res.status(500).json({
            success: false,
            message: '发送好友请求失败',
            code: 500,
            error: error.message
        })
    }
})

// 接受好友请求API
app.post('/api/contacts/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId
        const { requestId } = req.params

        console.log('✅ 接受好友请求:', { requestId, currentUserId })

        // 查询好友请求
        const [requests] = await db.execute(
            'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = ?',
            [requestId, currentUserId, 'pending']
        )

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: '好友请求不存在或已处理',
                code: 404
            })
        }

        const request = requests[0]
        const fromUserId = request.from_user_id

        // 更新好友请求状态
        await db.execute(
            'UPDATE friend_requests SET status = ?, updated_at = NOW() WHERE id = ?',
            ['accepted', requestId]
        )

        // 创建双向好友关系
        await db.execute(
            'INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, ?, NOW())',
            [currentUserId, fromUserId, 'accepted']
        )
        await db.execute(
            'INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, ?, NOW())',
            [fromUserId, currentUserId, 'accepted']
        )

        console.log('✅ 好友请求已接受，好友关系已建立')

        res.json({
            success: true,
            message: '已接受好友请求',
            code: 200
        })

    } catch (error) {
        console.error('❌ 接受好友请求失败:', error)
        res.status(500).json({
            success: false,
            message: '接受好友请求失败',
            code: 500,
            error: error.message
        })
    }
})

// 拒绝好友请求API
app.post('/api/contacts/reject/:requestId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId
        const { requestId } = req.params

        console.log('❌ 拒绝好友请求:', { requestId, currentUserId })

        // 查询好友请求
        const [requests] = await db.execute(
            'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = ?',
            [requestId, currentUserId, 'pending']
        )

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: '好友请求不存在或已处理',
                code: 404
            })
        }

        // 更新好友请求状态
        await db.execute(
            'UPDATE friend_requests SET status = ?, updated_at = NOW() WHERE id = ?',
            ['rejected', requestId]
        )

        console.log('✅ 好友请求已拒绝')

        res.json({
            success: true,
            message: '已拒绝好友请求',
            code: 200
        })

    } catch (error) {
        console.error('❌ 拒绝好友请求失败:', error)
        res.status(500).json({
            success: false,
            message: '拒绝好友请求失败',
            code: 500,
            error: error.message
        })
    }
})

// 朋友圈相关路由
app.get('/api/moments', authenticateToken, async (req, res) => {
    try {
        console.log('📡 收到朋友圈请求，用户ID:', req.user.userId)
        const moments = await momentsService.getMoments(req.user.userId)
        console.log('📊 朋友圈服务返回:', moments)

        // 
        try {
            const viewerId = req.user.userId
            const [rows] = await db.execute('SELECT friend_id, chat_scope, dont_see_him FROM friend_permissions WHERE user_id = ?', [viewerId])
            const blockMap = new Map()
            if (Array.isArray(rows)) {
                rows.forEach(r => {
                    const block = r.dont_see_him || r.chat_scope === 'chat'
                    blockMap.set(String(r.friend_id), !!block)
                })
            }
            if (moments && moments.data && Array.isArray(moments.data.moments)) {
                moments.data.moments = moments.data.moments.filter(m => {
                    const authorId = String(m.userId || m.authorId || m.user_id || '')
                    if (!authorId) return true
                    return !blockMap.get(authorId)
                })
            }
        } catch (filterErr) {
            console.warn(':', filterErr)
        }

        res.json(moments)
    } catch (error) {
        console.error('获取朋友圈失败:', error)
        res.status(500).json({ error: '获取朋友圈失败' })
    }
})

// 获取个人朋友圈
app.get('/api/moments/personal', authenticateToken, async (req, res) => {
    try {
        const moments = await momentsService.getPersonalMoments(req.user.userId)
        res.json(moments)
    } catch (error) {
        console.error('获取个人朋友圈失败:', error)
        res.status(500).json({ error: '获取个人朋友圈失败' })
    }
})

// 获取好友朋友圈
app.get('/api/moments/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params

        // 
        try {
            const viewerId = req.user.userId
            const [rows] = await db.execute('SELECT chat_scope, block_him_see_me FROM friend_permissions WHERE user_id = ? AND friend_id = ? LIMIT 1', [viewerId, userId])
            if (Array.isArray(rows) && rows.length > 0) {
                const r = rows[0]
                if (r.block_him_see_me || r.chat_scope === 'chat') {
                    return res.json({ success: true, data: { moments: [], page: 1, limit: 20, total: 0 } })
                }
            }
        } catch (permErr) {
            console.warn(':', permErr)
        }

        const moments = await momentsService.getUserMoments(userId)
        res.json(moments)
    } catch (error) {
        console.error('获取好友朋友圈失败:', error)
        res.status(500).json({ error: '获取好友朋友圈失败' })
    }
})

app.post('/api/moments', authenticateToken, upload.array('images', 9), async (req, res) => {
    try {
        const result = await momentsService.createMoment(req.body, req.files, req.user.userId)
        res.json(result)
    } catch (error) {
        console.error('发布朋友圈失败:', error)
        res.status(500).json({ error: '发布朋友圈失败' })
    }
})

// 二维码相关路由
app.post('/api/qr/decode', authenticateToken, async (req, res) => {
    try {
        const { imageData } = req.body

        if (!imageData) {
            return res.status(400).json({ error: '缺少图像数据' })
        }

        // 简化的二维码解码实现
        // 在实际应用中，这里应该使用专业的二维码解码库
        const result = {
            success: true,
            data: {
                type: 'text',
                content: '模拟扫描结果: ' + Date.now(),
                timestamp: Date.now()
            }
        }

        // 根据内容判断类型
        if (imageData.includes('leaftalk.com/user/')) {
            result.data.type = 'leaftalk_user'
            result.data.content = imageData.split('/user/')[1] || 'unknown'
        } else if (imageData.includes('leaftalk.com/group/')) {
            result.data.type = 'leaftalk_group'
            result.data.content = imageData.split('/group/')[1] || 'unknown'
        } else if (imageData.includes('http')) {
            result.data.type = 'url'
            result.data.content = imageData
        }

        res.json(result)
    } catch (error) {
        console.error('二维码解码失败:', error)
        res.status(500).json({ error: '二维码解码失败' })
    }
})

// 临时API：删除所有测试用户和当前用户，只保留用户1和用户2
app.get('/api/debug/cleanup-users', async (req, res) => {
    try {
        console.log('🧹 开始清理数据库，删除测试用户和当前用户...')

        // 查询当前所有用户
        const [allUsers] = await pool.execute('SELECT id, username, nickname, yeyu_id FROM users ORDER BY id')
        console.log('📋 清理前的所有用户:', allUsers)

        // 删除除用户1和用户2之外的所有用户
        await pool.execute('DELETE FROM users WHERE id NOT IN (1, 2)')
        console.log('🗑️ 已删除除用户1和用户2之外的所有用户')

        // 删除涉及已删除用户的好友关系
        await pool.execute('DELETE FROM friendships WHERE user_id NOT IN (1, 2) OR friend_id NOT IN (1, 2)')
        console.log('🗑️ 已删除涉及已删除用户的好友关系')

        // 删除涉及已删除用户的好友请求
        await pool.execute('DELETE FROM friend_requests WHERE requester_id NOT IN (1, 2) OR requestee_id NOT IN (1, 2)')
        console.log('🗑️ 已删除涉及已删除用户的好友请求')

        // 删除涉及已删除用户的黑名单
        await pool.execute('DELETE FROM user_blacklist WHERE user_id NOT IN (1, 2) OR blocked_user_id NOT IN (1, 2)')
        console.log('🗑️ 已删除涉及已删除用户的黑名单')

        // 删除涉及已删除用户的星标好友
        await pool.execute('DELETE FROM star_friends WHERE user_id NOT IN (1, 2) OR friend_id NOT IN (1, 2)')
        console.log('🗑️ 已删除涉及已删除用户的星标好友')

        // 删除涉及已删除用户的好友备注
        await pool.execute('DELETE FROM friend_remarks WHERE user_id NOT IN (1, 2) OR friend_id NOT IN (1, 2)')
        console.log('🗑️ 已删除涉及已删除用户的好友备注')

        // 查询清理后的用户
        const [remainingUsers] = await pool.execute('SELECT id, username, nickname, yeyu_id FROM users ORDER BY id')
        console.log('📋 清理后剩余的用户:', remainingUsers)

        // 查询清理后的好友关系
        const [remainingFriendships] = await pool.execute('SELECT * FROM friendships ORDER BY id')
        console.log('📋 清理后剩余的好友关系:', remainingFriendships)

        res.json({
            success: true,
            message: '数据库清理完成，只保留用户1和用户2',
            before: allUsers,
            after: remainingUsers,
            friendships: remainingFriendships
        })
    } catch (error) {
        console.error('❌ 数据库清理失败:', error)
        res.status(500).json({ error: '数据库清理失败' })
    }
})

// 确保 user_blacklist 表存在
async function ensureBlacklistTable() {
  try {
    if (!pool) return
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_blacklist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        blocked_user_id INT NOT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_blocked (user_id, blocked_user_id),
        INDEX idx_user (user_id),
        INDEX idx_blocked (blocked_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  } catch (e) {
    console.error('❌ 创建/校验 user_blacklist 表失败:', e)
  }
}

// ==================== 黑名单相关API ====================
// 获取黑名单列表
app.get('/api/user/blacklist', authenticateToken, async (req, res) => {
  try {
    await ensureBlacklistTable()
    if (!frService) return res.json({ success: true, data: { blacklist: [], total: 0, page: 1, limit: 0 } })
    const result = await frService.getBlacklist(req.user.userId, 1, 1000)
    return res.json({ success: true, data: result.data })
  } catch (e) {
    console.error('获取黑名单失败:', e)
    if (e && e.code === 'ER_NO_SUCH_TABLE') {
      try {
        await ensureBlacklistTable()
        return res.json({ success: true, data: { blacklist: [], total: 0, page: 1, limit: 0 } })
      } catch (e2) {
        console.error('自动创建 user_blacklist 表失败:', e2)
      }
    }
    return res.status(500).json({ success: false, error: '获取黑名单失败' })
  }
})

// 加入黑名单（并删除双方好友关系、拒绝待处理请求）
app.post('/api/user/blacklist/add', authenticateToken, async (req, res) => {
  try {
    await ensureBlacklistTable()
    const { targetUserId, reason } = req.body || {}
    if (!targetUserId) return res.status(400).json({ success: false, error: '缺少目标用户ID' })
    if (!frService) return res.status(500).json({ success: false, error: '服务未就绪' })



    const r = await frService.blockUser(req.user.userId, Number(targetUserId), reason || '')
    if (r.success) {
      io.to(`user_${req.user.userId}`).emit('blacklist_updated', { action: 'add', userId: Number(targetUserId) })
      return res.json({ success: true, message: r.message })
    }
    // 已在黑名单中 → 视为幂等成功
    if (r.error && (r.error.includes('已在黑名单') || r.error.includes('already'))) {
      io.to(`user_${req.user.userId}`).emit('blacklist_updated', { action: 'add', userId: Number(targetUserId) })
      return res.json({ success: true, message: r.error })
    }
    return res.json({ success: false, error: r.error || '加入黑名单失败' })
  } catch (e) {
    console.error('加入黑名单失败:', e)
    if (e && e.code === 'ER_NO_SUCH_TABLE') {
      try {
        await ensureBlacklistTable()
        const r2 = await frService.blockUser(req.user.userId, Number(req.body?.targetUserId), req.body?.reason || '')
        if (r2.success) {
          io.to(`user_${req.user.userId}`).emit('blacklist_updated', { action: 'add', userId: Number(req.body?.targetUserId) })
          return res.json({ success: true, message: r2.message })
        }
        return res.json({ success: false, error: r2.error || '加入黑名单失败' })
      } catch (e2) {
        console.error('加入黑名单失败(自动建表后重试仍失败):', e2)
      }
    }
    return res.status(500).json({ success: false, error: '加入黑名单失败' })
  }
})

// 从黑名单移除
app.post('/api/user/blacklist/remove', authenticateToken, async (req, res) => {
  try {
    await ensureBlacklistTable()
    const { targetUserId } = req.body || {}
    if (!targetUserId) return res.status(400).json({ success: false, error: '缺少目标用户ID' })
    if (!frService) return res.status(500).json({ success: false, error: '服务未就绪' })

    const r = await frService.unblockUser(req.user.userId, Number(targetUserId))
    if (r.success) {
      io.to(`user_${req.user.userId}`).emit('blacklist_updated', { action: 'remove', userId: Number(targetUserId) })
      return res.json({ success: true, message: r.message })
    }
    return res.json({ success: false, error: r.error || '移除黑名单失败' })
  } catch (e) {
    console.error('移除黑名单失败:', e)
    return res.status(500).json({ success: false, error: '移除黑名单失败' })
  }
})


// 聊天相关API
// 获取聊天历史消息
app.get('/api/chat/messages/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params
        const currentUserId = req.user.userId
        const limit = parseInt(req.query.limit) || 50
        const offset = parseInt(req.query.offset) || 0

        // 确保limit和offset是安全的整数
        const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 50))
        const safeOffset = Math.max(0, parseInt(offset) || 0)

        const [messages] = await db.execute(`
            SELECT id, sender_id, receiver_id, content, type as message_type, status, created_at
            FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC
            LIMIT ${safeLimit} OFFSET ${safeOffset}
        `, [currentUserId, userId, userId, currentUserId])

        res.json({
            success: true,
            data: messages.reverse(), // 返回时恢复时间正序
            pagination: {
                limit,
                offset,
                hasMore: messages.length === limit
            }
        })
    } catch (error) {
        console.error('获取聊天历史失败:', error)
        res.status(500).json({ error: '获取聊天历史失败' })
    }
})

// 获取聊天会话列表的通用处理函数 - 简化版本，专注于正常工作
const getChatSessions = async (req, res) => {
    try {
        const currentUserId = req.user.userId
        console.log('🔍 获取聊天会话，用户ID:', currentUserId)

        // 修复的查询：使用子查询获取最新消息
        const [messages] = await db.execute(`
            SELECT DISTINCT
                m1.sender_id,
                m1.receiver_id,
                m1.content as last_message,
                m1.type as last_message_type,
                m1.created_at as last_message_time,
                m1.status
            FROM messages m1
            INNER JOIN (
                SELECT
                    CASE
                        WHEN sender_id = ? THEN receiver_id
                        ELSE sender_id
                    END as other_user_id,
                    MAX(created_at) as max_time
                FROM messages
                WHERE (sender_id = ? OR receiver_id = ?)
                  AND sender_id != receiver_id  -- 排除自聊天
                GROUP BY other_user_id
            ) m2 ON (
                (m1.sender_id = ? AND m1.receiver_id = m2.other_user_id) OR
                (m1.receiver_id = ? AND m1.sender_id = m2.other_user_id)
            ) AND m1.created_at = m2.max_time


            WHERE m1.sender_id != m1.receiver_id  -- 再次确保排除自聊天
            ORDER BY m1.created_at DESC
        `, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId])

        console.log('📨 找到消息数量:', messages.length)

        // 如果没有消息，返回空数组
        if (messages.length === 0) {
            console.log('📭 没有找到任何消息')
            return res.json({ success: true, data: [] })
        }

        // 简单处理：获取唯一的聊天对象
        const otherUserIds = new Set()
        const chatData = new Map()

        for (const msg of messages) {
            const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id

            if (!chatData.has(otherUserId)) {
                otherUserIds.add(otherUserId)
                chatData.set(otherUserId, {
                    other_user_id: otherUserId,
                    last_message: msg.last_message,
                    last_message_type: msg.last_message_type,
                    last_message_time: msg.last_message_time,
                    unread_count: 0
                })
            }

            // 计算未读消息数
            if (msg.receiver_id === currentUserId && msg.status !== 'read') {
                chatData.get(otherUserId).unread_count++
            }
        }

        console.log('👥 聊天对象用户IDs:', Array.from(otherUserIds))

        // 获取用户信息
        const userIds = Array.from(otherUserIds)
        if (userIds.length === 0) {
            return res.json({ success: true, data: [] })
        }

        const placeholders = userIds.map(() => '?').join(',')
        const [users] = await db.execute(`
            SELECT id, nickname, avatar, yeyu_id
            FROM users
            WHERE id IN (${placeholders})
        `, userIds)

        console.log('👤 找到用户信息数量:', users.length)

        // 合并数据
        const sessions = users.map(user => {
            const chat = chatData.get(user.id)
            return {
                other_user_id: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                yeyu_id: user.yeyu_id,
                last_message: chat.last_message,
                last_message_type: chat.last_message_type,
                last_message_time: chat.last_message_time,
                unread_count: chat.unread_count
            }
        })

        console.log('✅ 返回聊天会话数量:', sessions.length)
        console.log('📋 会话详情:', sessions.map(s => ({
            other_user_id: s.other_user_id,
            nickname: s.nickname,
            is_self_chat: s.other_user_id === currentUserId
        })))

        res.json({
            success: true,
            data: sessions
        })
    } catch (error) {
        console.error('❌ 获取聊天会话失败:', error)
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        })
        res.status(500).json({
            error: '获取聊天会话失败',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

// 删除聊天会话
app.delete('/api/chat/sessions/:chatId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { chatId } = req.params

    console.log('🗑️ 删除聊天会话请求:', { userId, chatId })

    // 解析chatId获取参与者
    let otherUserId
    if (chatId.startsWith('chat_')) {
      const parts = chatId.substring(5).split('_')
      if (parts.length === 2) {
        otherUserId = parts.find(id => id !== userId.toString())
      }
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: '无效的聊天ID格式'
      })
    }

    // 删除该用户与对方的所有消息记录
    const deleteQuery = `
      DELETE FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
    `

    const [result] = await db.execute(deleteQuery, [userId, otherUserId, otherUserId, userId])

    console.log('✅ 聊天会话删除成功:', {
      userId,
      otherUserId,
      chatId,
      deletedRows: result.affectedRows
    })

    res.json({
      success: true,
      message: '聊天已删除',
      deletedRows: result.affectedRows
    })

  } catch (error) {
    console.error('❌ 删除聊天会话失败:', error)
    res.status(500).json({
      success: false,
      message: '删除聊天失败'
    })
  }
})


// 获取聊天会话列表 - 主端点
app.get('/api/chat/sessions', authenticateToken, getChatSessions)

// 获取聊天会话列表 - 别名端点（兼容性）
app.get('/api/chats', authenticateToken, getChatSessions)

// 调试端点：查看数据库中的实际数据
app.get('/api/debug/data', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId
        console.log('🔍 调试数据，用户ID:', currentUserId)

        // 查看所有用户
        const [users] = await pool.execute('SELECT id, nickname, yeyu_id FROM users LIMIT 10')

        // 查看所有消息
        const [messages] = await pool.execute(`
            SELECT id, sender_id, receiver_id, content, created_at,
                   CASE WHEN sender_id = receiver_id THEN 'SELF_CHAT' ELSE 'NORMAL' END as chat_type
            FROM messages
            ORDER BY created_at DESC
            LIMIT 20
        `)

        // 查看当前用户相关的消息
        const [userMessages] = await pool.execute(`
            SELECT id, sender_id, receiver_id, content, created_at,
                   CASE WHEN sender_id = receiver_id THEN 'SELF_CHAT' ELSE 'NORMAL' END as chat_type
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `, [currentUserId, currentUserId])

        // 统计自聊天消息
        const [selfChatCount] = await pool.execute(`
            SELECT COUNT(*) as count FROM messages WHERE sender_id = receiver_id
        `)

        res.json({
            success: true,
            data: {
                current_user_id: currentUserId,
                users: users,
                all_messages: messages,
                user_messages: userMessages,
                self_chat_count: selfChatCount[0].count,
                analysis: {
                    total_users: users.length,
                    total_messages: messages.length,
                    user_related_messages: userMessages.length,
                    self_chat_messages: selfChatCount[0].count
                }
            }
        })
    } catch (error) {
        console.error('❌ 调试数据失败:', error)
        res.status(500).json({
            error: '调试数据失败',
            details: error.message
        })
    }
})

// 测试数据库连接的简单端点
app.get('/api/test/db', authenticateToken, async (req, res) => {
    try {
        console.log('🧪 测试数据库连接...')

        // 测试基本查询
        const [result] = await pool.execute('SELECT 1 as test')
        console.log('✅ 数据库连接正常:', result)

        // 测试用户表
        const [users] = await pool.execute('SELECT COUNT(*) as user_count FROM users')
        console.log('👥 用户表记录数:', users[0].user_count)

        // 测试消息表
        const [messages] = await pool.execute('SELECT COUNT(*) as message_count FROM messages')
        console.log('📨 消息表记录数:', messages[0].message_count)

        res.json({
            success: true,
            data: {
                database_connection: 'OK',
                user_count: users[0].user_count,
                message_count: messages[0].message_count,
                current_user_id: req.user.userId
            }
        })
    } catch (error) {
        console.error('❌ 数据库测试失败:', error)
        res.status(500).json({
            error: '数据库测试失败',
            details: error.message
        })
    }
})

// 标记消息为已读
app.post('/api/chat/messages/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params
        const currentUserId = req.user.userId

        await pool.execute(`
            UPDATE messages
            SET status = 'read'
            WHERE id = ? AND receiver_id = ?
        `, [messageId, currentUserId])

        res.json({ success: true })
    } catch (error) {
        console.error('标记消息已读失败:', error)
        res.status(500).json({ error: '标记消息已读失败' })
    }
})

// 检查数据库状态API - 完整版本
app.get('/api/dev/check-db', async (req, res) => {
    try {
        // 测试数据库连接
        const [result] = await pool.execute('SELECT DATABASE() as current_db')

        // 检查表数量
        const [tables] = await pool.execute('SHOW TABLES')

        // 检查关键表的数据量
        const tableStats = {}
        const keyTables = ['users', 'conversations', 'messages', 'friend_requests']

        for (const table of keyTables) {
            try {
                const [count] = await pool.execute(`SELECT COUNT(*) as count FROM \`${table}\``)
                tableStats[table] = count[0].count
            } catch (e) {
                tableStats[table] = '表不存在'
            }
        }

        res.json({
            success: true,
            data: {
                database: result[0].current_db,
                totalTables: tables.length,
                tableStats,
                message: '数据库连接正常'
            }
        })
    } catch (error) {
        console.error('检查数据库失败:', error)
        res.status(500).json({ error: '检查数据库失败', details: error.message })
    }
})


// ==================== 星标朋友相关API ====================
async function ensureStarFriendsTable() {
  try {
    if (!pool) return
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS star_friends (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_friend (user_id, friend_id),
        INDEX idx_user (user_id),
        INDEX idx_friend (friend_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  } catch (e) {
    console.error('❌ 创建/检查 star_friends 表失败:', e)
  }
}

app.get('/api/contacts/starred', authenticateToken, async (req, res) => {
  try {
    await ensureStarFriendsTable()
    const userId = req.user.userId
    const [list] = await pool.execute(`
      SELECT sf.friend_id AS id, u.nickname, u.real_name, u.avatar, u.yeyu_id
      FROM star_friends sf
      JOIN users u ON u.id = sf.friend_id
      WHERE sf.user_id = ?
      ORDER BY sf.created_at DESC
    `, [userId])
    const ids = list.map((x) => x.id)
    return res.json({ success: true, data: { ids, list } })
  } catch (e) {
    console.error('❌ 获取星标朋友失败:', e)
    return res.status(500).json({ success: false, error: '获取星标朋友失败' })
  }
})

app.post('/api/contacts/star/add', authenticateToken, async (req, res) => {
  try {
    await ensureStarFriendsTable()
    const userId = req.user.userId
    const { friendId } = req.body || {}
    if (!friendId) return res.status(400).json({ success: false, error: '缺少好友ID' })
    await pool.execute(`INSERT IGNORE INTO star_friends (user_id, friend_id) VALUES (?, ?)`, [userId, Number(friendId)])
    return res.json({ success: true })
  } catch (e) {
    console.error('❌ 设为星标失败:', e)
    return res.status(500).json({ success: false, error: '设为星标失败' })
  }
})

app.post('/api/contacts/star/remove', authenticateToken, async (req, res) => {
  try {
    await ensureStarFriendsTable()
    const userId = req.user.userId
    const { friendId } = req.body || {}
    if (!friendId) return res.status(400).json({ success: false, error: '缺少好友ID' })
    await pool.execute(`DELETE FROM star_friends WHERE user_id = ? AND friend_id = ?`, [userId, Number(friendId)])
    return res.json({ success: true })
  } catch (e) {
    console.error('❌ 取消星标失败:', e)
    return res.status(500).json({ success: false, error: '取消星标失败' })
  }
})

// WebRTC 信令服务
const WebRTCSignalingService = require('../backend/services/webrtcSignaling')
const webrtcSignaling = new WebRTCSignalingService(io)
app.set('webrtcSignaling', webrtcSignaling)
console.log('🎯 WebRTC信令服务已启动')

// 通话 API (仿微信通话系统)
const callRouter = require('../backend/routes/callRoutes')
app.use('/api/call', authenticateToken, callRouter)
console.log('✅ Call API mounted on /api/call')

// 小程序 API
app.get('/api/miniapps', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  })
})

// 附近的人 API
app.post('/api/nearby/users', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  })
})

// 地图地理编码 API
app.get('/api/map/geocoder', authenticateToken, (req, res) => {
  const { location } = req.query
  res.json({
    success: true,
    data: {
      address: '未知位置',
      location: location
    }
  })
})

// 启动服务器
if (require.main === module) {
  // 只有直接运行此文件时才启动服务器
  server.listen(PORT, () => {
    console.log('🚀 叶语服务器启动成功！')
    console.log(`📍 HTTP服务: http://localhost:${PORT}`)
    console.log(`🔌 WebSocket服务: ws://localhost:${PORT}`)
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('================================')
  })

  // 错误处理
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用，请关闭占用进程或更换端口`)
    } else {
      console.error('❌ 服务器启动失败:', error.message)
    }
    process.exit(1)
  })

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n👋 正在关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })

  process.on('SIGTERM', async () => {
    console.log('\n👋 正在关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })
}

// ==================== 群聊功能 API ====================

// 初始化群聊表（仅在表不存在时创建）
app.post('/api/groups/init-tables', async (req, res) => {
  try {
    await dbReady

    // 创建 groups 表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        \`id\` VARCHAR(50) PRIMARY KEY COMMENT '群聊ID，格式：group_时间戳',
        \`name\` VARCHAR(100) NOT NULL COMMENT '群聊名称（显示在聊天列表）',
        \`title\` VARCHAR(100) DEFAULT NULL COMMENT '群聊标题（显示在聊天页面顶部）',
        \`avatar\` LONGTEXT DEFAULT NULL COMMENT '群聊头像（base64或URL）',
        \`creator_id\` INT NOT NULL COMMENT '创建者用户ID',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX \`idx_creator\` (\`creator_id\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群聊表'
    `)

    // 创建 group_members 表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`group_members\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
        \`group_id\` VARCHAR(50) NOT NULL COMMENT '群聊ID',
        \`user_id\` INT NOT NULL COMMENT '用户ID',
        \`role\` ENUM('creator', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
        \`joined_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
        UNIQUE KEY \`uk_group_user\` (\`group_id\`, \`user_id\`),
        INDEX \`idx_group_id\` (\`group_id\`),
        INDEX \`idx_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表'
    `)

    // 为 messages 表添加索引
    try {
      await pool.execute(`
        ALTER TABLE \`messages\`
        ADD INDEX \`idx_receiver_created\` (\`receiver_id\`, \`created_at\`)
      `)
    } catch (e) {
      // 索引可能已存在，忽略错误
      if (e.code !== 'ER_DUP_KEYNAME') {
        console.warn('添加索引失败:', e.message)
      }
    }

    console.log('✅ 群聊表初始化成功')
    res.json({ success: true, message: '群聊表初始化成功' })
  } catch (error) {
    console.error('❌ 初始化群聊表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 创建群聊
app.post('/api/groups/create', async (req, res) => {
  try {
    await dbReady
    const { id, name, title, avatar, creatorId, members } = req.body

    console.log('📝 创建群聊:', { id, name, title, creatorId, memberCount: members?.length })

    // 验证参数
    if (!id || !name || !creatorId || !members || members.length === 0) {
      return res.status(400).json({ success: false, error: '参数不完整' })
    }

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 1. 插入群聊记录
      await connection.execute(
        'INSERT INTO `groups` (id, name, title, avatar, creator_id) VALUES (?, ?, ?, ?, ?)',
        [id, name, title || null, avatar || null, creatorId]
      )

      // 2. 插入群成员记录
      for (const member of members) {
        const role = member.id === creatorId ? 'creator' : 'member'
        await connection.execute(
          'INSERT INTO `group_members` (group_id, user_id, role) VALUES (?, ?, ?)',
          [id, member.id, role]
        )
      }

      await connection.commit()
      console.log('✅ 群聊创建成功:', id)

      res.json({ success: true, data: { id, name, title, avatar, creatorId, members } })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('❌ 创建群聊失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取用户的所有群聊
app.get('/api/groups/my-groups', async (req, res) => {
  try {
    await dbReady
    const userId = req.query.userId

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' })
    }

    console.log('📋 获取用户群聊列表:', userId)

    // 查询用户加入的所有群聊
    const [groups] = await pool.execute(`
      SELECT g.*, gm.role, gm.joined_at
      FROM \`groups\` g
      INNER JOIN \`group_members\` gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY g.updated_at DESC
    `, [userId])

    console.log('✅ 找到群聊数量:', groups.length)

    // 为每个群聊获取最后一条消息
    const groupsWithLastMessage = await Promise.all(groups.map(async (group) => {
      try {
        const [messages] = await pool.execute(`
          SELECT content, type, created_at
          FROM \`messages\`
          WHERE receiver_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `, [group.id])

        if (messages.length > 0) {
          group.last_message = messages[0].content
          group.last_message_type = messages[0].type
          group.last_message_time = messages[0].created_at
        } else {
          group.last_message = ''
          group.last_message_type = 'text'
          group.last_message_time = group.updated_at
        }
      } catch (error) {
        console.warn('⚠️ 获取群聊最后消息失败:', group.id, error)
        group.last_message = ''
        group.last_message_type = 'text'
        group.last_message_time = group.updated_at
      }
      return group
    }))

    res.json({ success: true, data: groupsWithLastMessage })
  } catch (error) {
    console.error('❌ 获取群聊列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 获取邀请链接信息（用于判断是否需要审核）
 * 注意：此路由必须在 /api/groups/:groupId 之前，否则会被 :groupId 匹配
 */
app.get('/api/groups/invite-link-info', (req, res, next) => {
  console.log('🚀 收到 invite-link-info 请求:', req.query)
  next()
}, authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { inviteCode } = req.query

    console.log(`🔍 查询邀请链接信息: ${inviteCode}`)

    if (!inviteCode) {
      console.log('❌ 邀请码为空')
      return res.status(400).json({ success: false, error: '邀请码不能为空' })
    }

    // 查询邀请链接信息（检查 is_active 字段，如果字段不存在则忽略）
    const [inviteLinks] = await pool.execute(
      'SELECT group_id, inviter_id, is_active FROM `group_invite_links` WHERE invite_code = ?',
      [inviteCode]
    )

    console.log(`📋 查询结果: ${inviteLinks.length} 条记录`)
    if (inviteLinks.length > 0) {
      console.log(`📋 邀请链接详情:`, inviteLinks[0])
    }

    if (inviteLinks.length === 0) {
      console.log(`❌ 邀请链接不存在: ${inviteCode}`)
      return res.status(404).json({ success: false, error: '邀请链接不存在' })
    }

    // 检查邀请链接是否有效（如果有 is_active 字段）
    const invite = inviteLinks[0]
    if (invite.is_active !== undefined && invite.is_active === 0) {
      console.log(`❌ 邀请链接已失效: ${inviteCode}`)
      return res.status(404).json({ success: false, error: '邀请链接已失效' })
    }

    const { group_id: groupId, inviter_id: inviterId } = inviteLinks[0]

    // 获取群设置
    const [groupInfo] = await pool.execute(
      'SELECT require_approval FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupInfo.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    const requireApproval = groupInfo[0].require_approval === 1

    // 检查邀请人的角色
    const [inviterRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, inviterId]
    )

    const isInviterAdmin = inviterRole.length > 0 && (inviterRole[0].role === 'owner' || inviterRole[0].role === 'creator' || inviterRole[0].role === 'admin')

    res.json({
      success: true,
      data: {
        groupId,
        inviterId,
        requireApproval,
        isInviterAdmin
      }
    })
  } catch (error) {
    console.error('❌ 获取邀请链接信息失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群聊详情
app.get('/api/groups/:groupId', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('📋 获取群聊详情:', groupId)

    // 查询群聊信息
    const [groups] = await pool.execute(`
      SELECT id, name, title, avatar, creator_id, require_approval, only_admin_can_rename, created_at, updated_at
      FROM \`groups\`
      WHERE id = ?
    `, [groupId])

    if (groups.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    console.log('✅ 找到群聊信息')

    // 获取群成员数量
    const [memberCount] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM \`group_members\`
      WHERE group_id = ?
    `, [groupId])

    const group = groups[0]
    const data = {
      id: group.id,
      name: group.name || group.title || '群聊',
      avatar: group.avatar,
      announcement: group.announcement || '',
      memberCount: memberCount[0]?.count || 0,
      createTime: group.created_at ? new Date(group.created_at).getTime() : Date.now(),
      creatorId: group.creator_id,
      creator_id: group.creator_id,
      require_approval: group.require_approval,
      only_admin_can_rename: group.only_admin_can_rename,
      requireApproval: group.require_approval,
      updatedAt: group.updated_at
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('❌ 获取群聊详情失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新群聊设置 (PATCH)
app.patch('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { require_approval, name_edit_restricted, send_system_message } = req.body
    const userId = req.user.userId

    console.log('🔄 更新群聊设置:', { groupId, require_approval, name_edit_restricted, send_system_message, userId })

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    console.log('🔍 用户角色检查:', { userId, memberRole: memberRole.length > 0 ? memberRole[0].role : 'none' })

    if (memberRole.length === 0 || (memberRole[0].role !== 'owner' && memberRole[0].role !== 'admin' && memberRole[0].role !== 'creator')) {
      return res.status(403).json({ success: false, error: '只有群主或管理员可以修改群设置' })
    }

    // 获取当前用户的显示名称（优先级：备注名 > 群昵称 > 昵称）
    let displayName = ''
    if (send_system_message && require_approval !== undefined) {
      const [userInfo] = await pool.execute(
        'SELECT nickname FROM users WHERE id = ?',
        [userId]
      )

      if (userInfo.length > 0) {
        displayName = userInfo[0].nickname || `用户${userId}`
      } else {
        displayName = `用户${userId}`
      }
    }

    // 构建更新语句
    const updates = []
    const values = []

    if (require_approval !== undefined) {
      updates.push('require_approval = ?')
      values.push(require_approval ? 1 : 0)
      console.log('✅ 更新 require_approval:', require_approval)
    }

    if (name_edit_restricted !== undefined) {
      updates.push('only_admin_can_rename = ?')
      values.push(name_edit_restricted ? 1 : 0)
      console.log('✅ 更新 only_admin_can_rename:', name_edit_restricted)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: '没有要更新的字段' })
    }

    values.push(groupId)

    // 执行更新
    await pool.execute(
      `UPDATE \`groups\` SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    )

    console.log('✅ 群聊设置已更新')

    // 发送系统消息（如果需要）
    if (send_system_message && require_approval !== undefined && displayName) {
      let systemMessageContent = ''
      if (require_approval) {
        systemMessageContent = `"${displayName}"已开启"进群需要群主/管理员确认"`
      } else {
        systemMessageContent = `"${displayName}"已恢复默认进群方式`
      }

      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: systemMessageContent,
        timestamp: new Date().toISOString(),
        groupId: groupId
      }

      // 保存系统消息到数据库
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      console.log('✅ 系统消息已保存:', systemMessageContent)

      // 通过WebSocket发送系统消息给所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 系统消息已发送给用户 ${memberId}`)
        }
      })
    }

    // 读取最新设置用于广播
    const [updatedRows] = await pool.execute(
      'SELECT require_approval, only_admin_can_rename FROM `groups` WHERE id = ? LIMIT 1',
      [groupId]
    )
    const currentSettings = updatedRows && updatedRows[0] ? updatedRows[0] : { require_approval: 0, only_admin_can_rename: 0 }

    // 通过 WebSocket 广播给群成员，实时同步前端
    try {
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )
      if (Array.isArray(members)) {
        members.forEach((m) => {
          try {
            const userIdNum = m.user_id
            const userSocketId = userSockets.get(userIdNum)
            if (userSocketId) {
              io.to(userSocketId).emit('group_settings_updated', {
                groupId,
                require_approval: !!currentSettings.require_approval,
                only_admin_can_rename: !!currentSettings.only_admin_can_rename
              })
            }
          } catch (e) { /* noop */ }
        })
      }
    } catch (wsErr) {
      console.warn('⚠️ 广播群设置更新失败:', wsErr?.message || wsErr)
    }

    res.json({ success: true, message: '设置已更新' })
  } catch (error) {
    console.error('❌ 更新群聊设置失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群聊成员列表
app.get('/api/groups/:groupId/members', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const currentUserId = req.user.userId

    console.log('👥 获取群成员列表:', groupId, '类型:', typeof groupId, '当前用户:', currentUserId)

    // 检查群是否已解散
    const [groupInfo] = await pool.execute(
      'SELECT is_dissolved FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupInfo.length > 0 && groupInfo[0].is_dissolved === 1) {
      // 群已解散，只返回当前用户自己
      console.log('⚠️ 群已解散，只返回当前用户')
      const [currentUser] = await pool.execute(
        'SELECT id, nickname, avatar, yeyu_id FROM `users` WHERE id = ?',
        [currentUserId]
      )

      if (currentUser.length > 0) {
        res.json({
          success: true,
          data: [{
            id: currentUser[0].id,
            nickname: currentUser[0].nickname,
            avatar: currentUser[0].avatar,
            yeyu_id: currentUser[0].yeyu_id,
            role: 'member',
            joined_at: null,
            group_nickname: null
          }],
          isDissolved: true
        })
      } else {
        res.json({ success: true, data: [], isDissolved: true })
      }
      return
    }

    // 查询群成员（包含群内昵称）
    const [members] = await pool.execute(`
      SELECT u.id, u.nickname, u.avatar, u.yeyu_id, gm.role, gm.joined_at, gm.nickname as group_nickname
      FROM \`group_members\` gm
      INNER JOIN \`users\` u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
    `, [groupId])

    console.log('✅ 找到群成员数量:', members.length)

    res.json({ success: true, data: members, isDissolved: false })
  } catch (error) {
    console.error('❌ 获取群成员失败:', error)
    console.error('❌ 错误详情:', error.stack)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 设置我在本群的昵称
app.post('/api/groups/:groupId/set-nickname', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { nickname } = req.body
    const userId = req.user.userId

    console.log('📝 设置群昵称:', { groupId, userId, nickname })

    // 验证用户是否是群成员
    const [members] = await pool.execute(
      'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (members.length === 0) {
      return res.status(403).json({
        success: false,
        message: '您不是该群成员',
        code: 403
      })
    }

    // 更新群昵称
    await pool.execute(
      'UPDATE `group_members` SET nickname = ? WHERE group_id = ? AND user_id = ?',
      [nickname || null, groupId, userId]
    )

    console.log('✅ 群昵称设置成功')

    res.json({
      success: true,
      message: '昵称设置成功',
      data: { nickname }
    })
  } catch (error) {
    console.error('❌ 设置群昵称失败:', error)
    res.status(500).json({
      success: false,
      message: '设置昵称失败',
      error: error.message
    })
  }
})

// 退出群聊
app.post('/api/groups/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    console.log('🚪 用户退出群聊:', { groupId, userId })

    // 验证用户是否是群成员
    const [members] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (members.length === 0) {
      return res.status(403).json({
        success: false,
        message: '您不是该群成员',
        code: 403
      })
    }

    // 检查是否是群主
    if (members[0].role === 'creator') {
      return res.status(403).json({
        success: false,
        message: '群主不能退出群聊，请先转让群主或解散群聊',
        code: 403
      })
    }

    // 从群成员表中删除该用户
    await pool.execute(
      'DELETE FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    // 更新群成员数量
    const [groupMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM `group_members` WHERE group_id = ?',
      [groupId]
    )
    const memberCount = groupMembers[0].count

    console.log('✅ 用户已退出群聊，当前群成员数:', memberCount)

    // 通知所有群成员（通过Socket.IO）
    if (io) {
      io.to(groupId).emit('group-member-left', {
        groupId,
        userId,
        memberCount
      })
      console.log('📢 已通知群成员：用户退出群聊')
    }

    res.json({
      success: true,
      message: '已退出群聊',
      data: { memberCount }
    })
  } catch (error) {
    console.error('❌ 退出群聊失败:', error)
    res.status(500).json({
      success: false,
      message: '退出群聊失败',
      error: error.message
    })
  }
})

// 获取群公告
app.get('/api/groups/:groupId/announcement', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    const [rows] = await pool.execute(
      'SELECT * FROM `group_announcements` WHERE group_id = ? ORDER BY updated_at DESC LIMIT 1',
      [groupId]
    )

    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] })
    } else {
      res.json({ success: true, data: null })
    }
  } catch (error) {
    console.error('❌ 获取群公告失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新群公告
app.put('/api/groups/:groupId/announcement', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { content, editorId, editorNickname, sendNotification } = req.body
    const userId = req.user.userId

    console.log('📢 更新群公告:', { groupId, editorId, userId })

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    console.log('🔍 用户角色检查:', { userId, memberRole: memberRole.length > 0 ? memberRole[0].role : 'none' })

    if (memberRole.length === 0 || (memberRole[0].role !== 'owner' && memberRole[0].role !== 'admin' && memberRole[0].role !== 'creator')) {
      return res.status(403).json({ success: false, error: '只有群主或管理员可以发布群公告' })
    }

    // 检查是否已存在公告
    const [existing] = await pool.execute(
      'SELECT * FROM `group_announcements` WHERE group_id = ?',
      [groupId]
    )

    if (existing.length > 0) {
      // 更新现有公告
      await pool.execute(
        'UPDATE `group_announcements` SET content = ?, editor_id = ?, editor_nickname = ?, updated_at = NOW() WHERE group_id = ?',
        [content, editorId, editorNickname, groupId]
      )
    } else {
      // 创建新公告
      await pool.execute(
        'INSERT INTO `group_announcements` (group_id, content, editor_id, editor_nickname, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [groupId, content, editorId, editorNickname]
      )
    }

    // 如果需要发送通知，创建系统消息
    if (sendNotification) {
      console.log('📢 发送群公告通知')

      // 创建群公告消息ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 保存公告消息到数据库（senderId 设置为发布者ID）
      try {
        await pool.execute(
          'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [messageId, editorId, groupId, content, 'announcement']
        )
        console.log('✅ 群公告消息已保存到数据库')
      } catch (msgError) {
        console.error('❌ 保存公告消息失败:', msgError)
      }

      // 通过WebSocket发送公告消息给所有群成员
      try {
        const [members] = await pool.execute(
          'SELECT user_id FROM `group_members` WHERE group_id = ?',
          [groupId]
        )

        console.log(`📢 找到 ${members.length} 个群成员`)

        members.forEach(member => {
          const memberId = member.user_id
          const userSocketId = userSockets.get(memberId)

          if (userSocketId) {
            // 创建群公告消息（每个成员收到的消息略有不同）
            const announcementMessage = {
              id: messageId,
              senderId: editorId, // 发布者ID
              senderName: editorNickname,
              receiverId: groupId,
              type: 'announcement',
              content: content, // 公告内容
              timestamp: new Date().toISOString(),
              groupId: groupId,
              isOwn: memberId === editorId, // 如果是发布者自己，标记为 isOwn
              metadata: {
                editorId: editorId,
                editorNickname: editorNickname
              }
            }

            io.to(userSocketId).emit('new_message', announcementMessage)
            console.log(`📤 群公告消息已发送给用户 ${memberId}${memberId === editorId ? ' (发布者)' : ''}`)
          }
        })
      } catch (wsError) {
        console.error('❌ 发送WebSocket消息失败:', wsError)
      }
    }

    // 广播群公告更新事件给所有群成员
    try {
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)

        if (userSocketId) {
          io.to(userSocketId).emit('group_announcement_updated', {
            groupId: groupId,
            content: content,
            editorId: editorId,
            editorNickname: editorNickname
          })
          console.log(`📤 群公告更新事件已发送给用户 ${memberId}`)
        }
      })
    } catch (wsError) {
      console.error('❌ 广播群公告更新事件失败:', wsError)
    }

    res.json({ success: true, message: '群公告更新成功' })
  } catch (error) {
    console.error('❌ 更新群公告失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群管理设置
app.get('/api/groups/:groupId/settings', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    const [rows] = await pool.execute(
      'SELECT invite_confirm_enabled, only_admin_can_rename FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (rows.length > 0) {
      res.json({
        success: true,
        data: {
          invite_confirm_enabled: rows[0].invite_confirm_enabled || false,
          only_admin_can_rename: rows[0].only_admin_can_rename || false
        }
      })
    } else {
      res.json({ success: false, message: '群聊不存在' })
    }
  } catch (error) {
    console.error('❌ 获取群管理设置失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新群管理设置
app.put('/api/groups/:groupId/settings', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { invite_confirm_enabled, only_admin_can_rename } = req.body

    const updates = []
    const values = []

    if (invite_confirm_enabled !== undefined) {
      updates.push('invite_confirm_enabled = ?')
      values.push(invite_confirm_enabled ? 1 : 0)
      // 同时更新 require_approval 字段
      updates.push('require_approval = ?')
      values.push(invite_confirm_enabled ? 1 : 0)
    }

    if (only_admin_can_rename !== undefined) {
      updates.push('only_admin_can_rename = ?')
      values.push(only_admin_can_rename ? 1 : 0)
    }

    if (updates.length > 0) {
      values.push(groupId)
      await pool.execute(
        `UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
      console.log('✅ 群管理设置更新成功')
    }

    res.json({ success: true, message: '设置更新成功' })
  } catch (error) {
    console.error('❌ 更新群管理设置失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 邀请成员加入群聊
app.post('/api/groups/:groupId/invite', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { userIds } = req.body
    const inviterId = req.user.userId

    console.log('📨 邀请成员加入群聊:', { groupId, userIds, inviterId })

    // 获取邀请人的角色和昵称
    const [inviterInfo] = await pool.execute(
      'SELECT gm.role, u.nickname FROM `group_members` gm INNER JOIN `users` u ON gm.user_id = u.id WHERE gm.group_id = ? AND gm.user_id = ?',
      [groupId, inviterId]
    )

    if (inviterInfo.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const inviterRole = inviterInfo[0].role
    const inviterName = inviterInfo[0].nickname
    const isAdminOrOwner = inviterRole === 'creator' || inviterRole === 'admin'

    // 获取群设置
    const [groupSettings] = await pool.execute(
      'SELECT require_approval FROM `groups` WHERE id = ?',
      [groupId]
    )

    const requiresApproval = groupSettings[0]?.require_approval || false

    // 如果是群主/管理员邀请，或者群不需要验证，直接加入
    if (isAdminOrOwner || !requiresApproval) {
      // 直接添加成员
      const addedMembers = []
      for (const userId of userIds) {
        // 检查是否已经是群成员
        const [existingMember] = await pool.execute(
          'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
          [groupId, userId]
        )

        if (existingMember.length === 0) {
          await pool.execute(
            'INSERT INTO `group_members` (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
            [groupId, userId, 'member']
          )

          // 获取被邀请人的昵称
          const [userInfo] = await pool.execute(
            'SELECT nickname FROM `users` WHERE id = ?',
            [userId]
          )
          const userName = userInfo.length > 0 ? userInfo[0].nickname : `用户${userId}`
          addedMembers.push(userName)

          console.log(`✅ 用户 ${userId} 已加入群聊`)
        }
      }

      // 为每个加入的成员发送一条系统消息
      for (const memberName of addedMembers) {
        const systemMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: 0,
          receiverId: groupId,
          type: 'system',
          content: `${memberName} 加入了群聊`,
          timestamp: new Date().toISOString(),
          groupId: groupId
        }

        // 保存系统消息到数据库
        await pool.execute(
          'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [systemMessage.id, 0, groupId, systemMessage.content, 'system']
        )

        // 通过WebSocket发送系统消息给所有群成员
        const [members] = await pool.execute(
          'SELECT user_id FROM `group_members` WHERE group_id = ?',
          [groupId]
        )

        members.forEach(member => {
          const memberId = member.user_id
          const userSocketId = userSockets.get(memberId)
          if (userSocketId) {
            io.to(userSocketId).emit('new_message', systemMessage)
            console.log(`📤 系统消息已发送给用户 ${memberId}: ${memberName} 加入了群聊`)
          }
        })

        // 添加小延迟，避免消息ID冲突
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      res.json({ success: true, message: '邀请成功，成员已加入群聊' })
    } else {
      // 普通成员邀请，需要创建进群申请
      for (const userId of userIds) {
        // 检查是否已经有待处理的申请
        const [existingRequest] = await pool.execute(
          'SELECT id FROM `group_join_requests` WHERE group_id = ? AND user_id = ? AND status = ?',
          [groupId, userId, 'pending']
        )

        if (existingRequest.length === 0) {
          await pool.execute(
            'INSERT INTO `group_join_requests` (group_id, user_id, message, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            [groupId, userId, '通过好友邀请', 'pending']
          )
          console.log(`✅ 已创建用户 ${userId} 的进群申请`)
        }
      }

      res.json({ success: true, message: '邀请已发送，等待群主/管理员审核' })
    }
  } catch (error) {
    console.error('❌ 邀请成员失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 生成群聊邀请链接
app.post('/api/groups/:groupId/invite-link', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const inviterId = req.user.userId
    const { maxUses, expireHours } = req.body

    console.log('🔗 生成群聊邀请链接:', { groupId, inviterId, maxUses, expireHours })

    // 检查用户是否是群成员
    const [memberInfo] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, inviterId]
    )

    if (memberInfo.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    // 检查群设置是否允许普通成员邀请
    const [groupInfo] = await pool.execute(
      'SELECT allow_member_invite FROM `groups` WHERE id = ?',
      [groupId]
    )

    const allowMemberInvite = groupInfo.length > 0 ? groupInfo[0].allow_member_invite : true
    const userRole = memberInfo[0].role

    if (!allowMemberInvite && userRole === 'member') {
      return res.status(403).json({ success: false, error: '群主已关闭成员邀请功能' })
    }

    // 生成唯一邀请码
    const inviteCode = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 计算过期时间
    let expireAt = null
    if (expireHours && expireHours > 0) {
      expireAt = new Date(Date.now() + expireHours * 60 * 60 * 1000)
    }

    // 保存邀请链接
    await pool.execute(
      'INSERT INTO `group_invite_links` (group_id, invite_code, inviter_id, max_uses, expire_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [groupId, inviteCode, inviterId, maxUses || null, expireAt]
    )

    console.log('✅ 邀请链接已生成:', inviteCode)

    res.json({
      success: true,
      data: {
        inviteCode,
        inviteLink: `yeyu://group/join?code=${inviteCode}`,
        expireAt,
        maxUses
      }
    })
  } catch (error) {
    console.error('❌ 生成邀请链接失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 发送群聊邀请消息卡片
app.post('/api/groups/:groupId/send-invite-card', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { receiverIds, inviteCode } = req.body
    const senderId = req.user.userId

    console.log('📨 发送群聊邀请消息卡片:', { groupId, receiverIds, inviteCode, senderId })

    // 检查邀请码是否有效
    const [inviteInfo] = await pool.execute(
      'SELECT * FROM `group_invite_links` WHERE invite_code = ? AND group_id = ? AND is_active = TRUE',
      [inviteCode, groupId]
    )

    if (inviteInfo.length === 0) {
      return res.status(404).json({ success: false, error: '邀请链接不存在或已失效' })
    }

    const invite = inviteInfo[0]

    // 检查是否过期
    if (invite.expire_at && new Date(invite.expire_at) < new Date()) {
      return res.status(400).json({ success: false, error: '邀请链接已过期' })
    }

    // 检查使用次数
    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return res.status(400).json({ success: false, error: '邀请链接已达到最大使用次数' })
    }

    // 获取群信息
    const [groupInfo] = await pool.execute(
      'SELECT name, avatar FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupInfo.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    const group = groupInfo[0]

    // 获取群成员数量
    const [memberCountResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM `group_members` WHERE group_id = ?',
      [groupId]
    )
    const memberCount = memberCountResult[0].count

    // 获取发送者信息
    const [senderInfo] = await pool.execute(
      'SELECT nickname, avatar FROM `users` WHERE id = ?',
      [senderId]
    )

    const senderName = senderInfo.length > 0 ? senderInfo[0].nickname : `用户${senderId}`

    // 构造邀请消息卡片内容
    const cardContent = JSON.stringify({
      type: 'group_invite',
      groupId,
      groupName: group.name,
      groupAvatar: group.avatar,
      memberCount,
      inviteCode,
      inviterName: senderName,
      inviterId: senderId
    })

    // 向每个接收者发送消息
    const sentMessages = []
    for (const receiverId of receiverIds) {
      // 检查是否已经是群成员
      const [existingMember] = await pool.execute(
        'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
        [groupId, receiverId]
      )

      if (existingMember.length > 0) {
        console.log(`⚠️ 用户 ${receiverId} 已经是群成员，跳过`)
        continue
      }

      // 创建消息
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [messageId, senderId, receiverId, cardContent, 'group_invite']
      )

      const message = {
        id: messageId,
        senderId,
        receiverId,
        content: cardContent,
        type: 'group_invite',
        timestamp: new Date().toISOString()
      }

      sentMessages.push(message)

      // 通过WebSocket发送消息
      const userSocketId = userSockets.get(receiverId)
      if (userSocketId) {
        io.to(userSocketId).emit('new_message', message)
        console.log(`📤 群邀请消息已发送给用户 ${receiverId}`)
      }

      await new Promise(resolve => setTimeout(resolve, 10))
    }

    res.json({
      success: true,
      message: '邀请消息已发送',
      data: { sentCount: sentMessages.length }
    })
  } catch (error) {
    console.error('❌ 发送邀请消息失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})



// 移除群成员
app.post('/api/groups/:groupId/remove-members', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { userIds } = req.body
    const operatorId = req.user.userId

    console.log('🚫 移除群成员:', { groupId, userIds, operatorId })

    // 验证操作者是否是群主或管理员，并获取昵称
    const [operatorInfo] = await pool.execute(
      'SELECT gm.role, u.nickname FROM `group_members` gm INNER JOIN `users` u ON gm.user_id = u.id WHERE gm.group_id = ? AND gm.user_id = ?',
      [groupId, operatorId]
    )

    if (operatorInfo.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const operatorRole = operatorInfo[0].role
    const operatorName = operatorInfo[0].nickname
    const isAdminOrOwner = operatorRole === 'creator' || operatorRole === 'admin'

    if (!isAdminOrOwner) {
      return res.status(403).json({ success: false, error: '只有群主和管理员可以移除成员' })
    }

    // 移除成员并收集被移除成员的昵称
    const removedMembers = []
    for (const userId of userIds) {
      // 获取被移除成员的昵称
      const [userInfo] = await pool.execute(
        'SELECT nickname FROM `users` WHERE id = ?',
        [userId]
      )
      const userName = userInfo.length > 0 ? userInfo[0].nickname : `用户${userId}`
      removedMembers.push(userName)

      // 移除成员
      await pool.execute(
        'DELETE FROM `group_members` WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      )
      console.log(`✅ 用户 ${userId} 已被移除`)
    }

    // 发送系统消息
    if (removedMembers.length > 0) {
      const memberNames = removedMembers.join('、')

      // 创建包含操作者和被移除者信息的系统消息
      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: `${operatorName} 将 ${memberNames} 移出了群聊`,
        timestamp: new Date().toISOString(),
        groupId: groupId,
        operatorId: operatorId,  // 操作者ID
        operatorName: operatorName,  // 操作者昵称
        removedUserIds: userIds,  // 被移除的用户ID列表
        removedUserNames: removedMembers  // 被移除的用户昵称列表
      }

      // 保存系统消息到数据库（只保存基本内容）
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      // 通过WebSocket发送系统消息给所有群成员（包括被移除的成员，让他们知道）
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      // 发送给当前群成员
      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 移除系统消息已发送给用户 ${memberId}`)
        }
      })

      // 也发送给被移除的成员
      userIds.forEach(userId => {
        const userSocketId = userSockets.get(userId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          io.to(userSocketId).emit('removed_from_group', { groupId, operatorName })
          console.log(`📤 移除通知已发送给被移除用户 ${userId}`)
        }
      })
    }

    // 获取更新后的成员数量和所有成员ID
    const [groupMembers] = await pool.execute(
      'SELECT user_id FROM `group_members` WHERE group_id = ?',
      [groupId]
    )
    const memberCount = groupMembers.length

    // 通知所有群成员成员数量变化（遍历每个成员单独发送）
    if (io) {
      console.log('📢 准备通知群成员数量变化:', { groupId, memberCount, totalMembers: groupMembers.length })
      groupMembers.forEach(member => {
        const memberId = member.user_id
        const memberSocketId = userSockets.get(memberId)
        console.log(`📤 尝试通知用户 ${memberId}:`, {
          hasSocket: !!memberSocketId,
          socketId: memberSocketId
        })
        if (memberSocketId) {
          io.to(memberSocketId).emit('group-members-changed', {
            groupId,
            memberCount
          })
          console.log(`✅ 已发送 group-members-changed 给用户 ${memberId}`)
        } else {
          console.log(`⚠️ 用户 ${memberId} 没有在线，跳过通知`)
        }
      })
      console.log('📢 已通知群成员：成员数量变化，当前成员数:', memberCount)
    }

    res.json({ success: true, message: '成员已移除', data: { memberCount } })
  } catch (error) {
    console.error('❌ 移除成员失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 转让群主
app.post('/api/groups/:groupId/transfer-ownership', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { currentOwnerId, newOwnerId } = req.body

    console.log('👑 转让群主:', { groupId, currentOwnerId, newOwnerId })

    // 验证当前用户是否是群主
    const [currentOwnerRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, currentOwnerId]
    )

    if (currentOwnerRole.length === 0 || (currentOwnerRole[0].role !== 'owner' && currentOwnerRole[0].role !== 'creator')) {
      return res.status(403).json({ success: false, error: '只有群主可以转让群主权限' })
    }

    // 验证新群主是否是群成员
    const [newOwnerRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, newOwnerId]
    )

    if (newOwnerRole.length === 0) {
      return res.status(400).json({ success: false, error: '新群主不是群成员' })
    }

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 将当前群主改为普通成员
      await connection.execute(
        'UPDATE `group_members` SET role = ? WHERE group_id = ? AND user_id = ?',
        ['member', groupId, currentOwnerId]
      )

      // 将新成员设为群主（使用 creator 作为群主角色）
      await connection.execute(
        'UPDATE `group_members` SET role = ? WHERE group_id = ? AND user_id = ?',
        ['creator', groupId, newOwnerId]
      )

      // 提交事务
      await connection.commit()
      connection.release()

      console.log('✅ 群主转让成功')

      // 获取新旧群主的昵称
      const [oldOwnerInfo] = await pool.execute(
        'SELECT nickname FROM `users` WHERE id = ?',
        [currentOwnerId]
      )
      const [newOwnerInfo] = await pool.execute(
        'SELECT nickname FROM `users` WHERE id = ?',
        [newOwnerId]
      )

      const oldOwnerName = oldOwnerInfo.length > 0 ? oldOwnerInfo[0].nickname : '前群主'
      const newOwnerName = newOwnerInfo.length > 0 ? newOwnerInfo[0].nickname : '新群主'

      // 发送系统消息到群聊
      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: `${oldOwnerName} 将群主转让给 ${newOwnerName}`,
        timestamp: new Date().toISOString(),
        groupId: groupId
      }

      // 保存系统消息到数据库
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      // 通过WebSocket发送系统消息给所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 群主转让消息已发送给用户 ${memberId}`)
        }
      })

      res.json({ success: true, message: '群主转让成功' })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('❌ 转让群主失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群管理员列表
app.get('/api/groups/:groupId/admins', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('📋 获取群管理员列表:', { groupId })

    // 查询所有管理员
    const [admins] = await pool.execute(
      `SELECT gm.user_id as id, u.nickname, u.avatar
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ? AND gm.role = 'admin'
       ORDER BY gm.joined_at ASC`,
      [groupId]
    )

    console.log('✅ 群管理员列表:', admins)

    res.json({
      success: true,
      data: admins
    })
  } catch (error) {
    console.error('❌ 获取群管理员列表失败:', error)
    res.status(500).json({ success: false, error: '获取管理员列表失败' })
  }
})

// 添加群管理员
app.post('/api/groups/:groupId/admins', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { memberIds } = req.body

    console.log('➕ 添加群管理员:', { groupId, memberIds })

    // 验证是否超过最大管理员数量
    const [currentAdmins] = await pool.execute(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND role = "admin"',
      [groupId]
    )

    const currentCount = currentAdmins[0].count
    if (currentCount + memberIds.length > 3) {
      return res.status(400).json({ success: false, error: '最多只能设置3个管理员' })
    }

    // 更新成员角色为管理员
    for (const memberId of memberIds) {
      await pool.execute(
        'UPDATE group_members SET role = "admin" WHERE group_id = ? AND user_id = ?',
        [groupId, memberId]
      )
    }

    console.log('✅ 群管理员添加成功')

    // 获取新管理员的昵称并发送系统消息
    for (const memberId of memberIds) {
      const [adminInfo] = await pool.execute(
        'SELECT nickname FROM `users` WHERE id = ?',
        [memberId]
      )

      const adminName = adminInfo.length > 0 ? adminInfo[0].nickname : `用户${memberId}`

      // 发送系统消息到群聊
      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: `${adminName} 成为群管理员`,
        timestamp: new Date().toISOString(),
        groupId: groupId
      }

      // 保存系统消息到数据库
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      // 通过WebSocket发送系统消息给所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 管理员设置消息已发送给用户 ${memberId}`)
        }
      })
    }

    res.json({
      success: true,
      message: '管理员添加成功'
    })
  } catch (error) {
    console.error('❌ 添加群管理员失败:', error)
    res.status(500).json({ success: false, error: '添加管理员失败' })
  }
})

// 移除群管理员
app.delete('/api/groups/:groupId/admins/:adminId', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId, adminId } = req.params

    console.log('➖ 移除群管理员:', { groupId, adminId })

    // 获取管理员昵称
    const [adminInfo] = await pool.execute(
      'SELECT nickname FROM `users` WHERE id = ?',
      [adminId]
    )

    const adminName = adminInfo.length > 0 ? adminInfo[0].nickname : `用户${adminId}`

    // 将管理员角色改为普通成员
    await pool.execute(
      'UPDATE group_members SET role = "member" WHERE group_id = ? AND user_id = ?',
      [groupId, adminId]
    )

    console.log('✅ 群管理员移除成功')

    // 发送系统消息到群聊
    const systemMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: 0,
      receiverId: groupId,
      type: 'system',
      content: `${adminName} 被解除群管理员`,
      timestamp: new Date().toISOString(),
      groupId: groupId
    }

    // 保存系统消息到数据库
    await pool.execute(
      'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [systemMessage.id, 0, groupId, systemMessage.content, 'system']
    )

    // 通过WebSocket发送系统消息给所有群成员
    const [members] = await pool.execute(
      'SELECT user_id FROM `group_members` WHERE group_id = ?',
      [groupId]
    )

    members.forEach(member => {
      const memberId = member.user_id
      const userSocketId = userSockets.get(memberId)
      if (userSocketId) {
        io.to(userSocketId).emit('new_message', systemMessage)
        console.log(`📤 管理员移除消息已发送给用户 ${memberId}`)
      }
    })

    res.json({
      success: true,
      message: '管理员已移除'
    })
  } catch (error) {
    console.error('❌ 移除群管理员失败:', error)
    res.status(500).json({ success: false, error: '移除管理员失败' })
  }
})

// 转让群主
app.post('/api/groups/:groupId/transfer', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { newOwnerId } = req.body
    const userId = req.user.userId

    console.log('🔄 转让群主:', { groupId, currentOwnerId: userId, newOwnerId })

    // 验证当前用户是否是群主
    const [currentOwner] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (currentOwner.length === 0 || (currentOwner[0].role !== 'owner' && currentOwner[0].role !== 'creator')) {
      return res.status(403).json({ success: false, error: '只有群主可以转让群主' })
    }

    // 验证新群主是否是群成员
    const [newOwner] = await pool.execute(
      'SELECT user_id FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, newOwnerId]
    )

    if (newOwner.length === 0) {
      return res.status(400).json({ success: false, error: '新群主不是群成员' })
    }

    // 获取新群主昵称
    const [newOwnerInfo] = await pool.execute(
      'SELECT nickname FROM `users` WHERE id = ?',
      [newOwnerId]
    )

    const newOwnerName = newOwnerInfo.length > 0 ? newOwnerInfo[0].nickname : `用户${newOwnerId}`

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 将当前群主改为普通成员
      await connection.execute(
        'UPDATE group_members SET role = "member" WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      )

      // 将新群主的角色改为creator
      await connection.execute(
        'UPDATE group_members SET role = "creator" WHERE group_id = ? AND user_id = ?',
        [groupId, newOwnerId]
      )

      // 更新群表的创建者ID
      await connection.execute(
        'UPDATE `groups` SET creator_id = ? WHERE id = ?',
        [newOwnerId, groupId]
      )

      // 提交事务
      await connection.commit()
      connection.release()

      console.log('✅ 群主转让成功')

      // 发送系统消息到群聊
      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: `${newOwnerName} 成为新群主`,
        timestamp: new Date().toISOString(),
        groupId: groupId
      }

      // 保存系统消息到数据库
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      // 通过WebSocket发送系统消息给所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 群主转让消息已发送给用户 ${memberId}`)
        }
      })

      res.json({
        success: true,
        message: '群主转让成功'
      })
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('❌ 转让群主失败:', error)
    res.status(500).json({ success: false, error: '转让群主失败' })
  }
})



// 检查群是否已解散
app.get('/api/groups/:groupId/status', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('🔍 检查群聊状态:', groupId)

    // 查询群聊信息
    const [groups] = await pool.execute(
      'SELECT is_dissolved FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groups.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    const isDissolved = groups[0].is_dissolved === 1

    res.json({
      success: true,
      data: {
        isDissolved
      }
    })
  } catch (error) {
    console.error('❌ 检查群聊状态失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 解散群聊
app.delete('/api/groups/:groupId/dissolve', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { userId } = req.body

    console.log('🗑️ 解散群聊:', { groupId, userId })

    // 验证用户是否是群主
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (memberRole.length === 0 || (memberRole[0].role !== 'owner' && memberRole[0].role !== 'creator')) {
      return res.status(403).json({ success: false, error: '只有群主可以解散群聊' })
    }

    // 获取所有群成员ID（用于发送通知）
    const [members] = await pool.execute(
      'SELECT user_id FROM `group_members` WHERE group_id = ?',
      [groupId]
    )

    const memberIds = members.map(m => m.user_id)

    // 标记群聊为已解散
    await pool.execute(
      'UPDATE `groups` SET is_dissolved = 1, updated_at = NOW() WHERE id = ?',
      [groupId]
    )
    console.log('✅ 群聊已标记为解散')

    // 删除所有群成员（包括群主）
    await pool.execute(
      'DELETE FROM `group_members` WHERE group_id = ?',
      [groupId]
    )
    console.log('✅ 所有群成员已删除')

    // 向群聊发送系统消息
    const systemMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await pool.execute(
      'INSERT INTO `messages` (id, sender_id, receiver_id, content, message_type, created_at, status) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
      [systemMessageId, 0, groupId, '群聊已解散', 'system', 'sent']
    )
    console.log('✅ 系统消息已发送')

    // 通过WebSocket通知所有群成员
    memberIds.forEach(memberId => {
      const userSocketId = userSockets.get(memberId)
      if (userSocketId) {
        io.to(userSocketId).emit('group_dissolved', {
          groupId: groupId,
          message: '该群聊已被群主解散',
          isOwner: memberId === userId // 标记是否是群主
        })
        console.log(`📤 群聊解散通知已发送给用户 ${memberId}`)
      }
    })

    res.json({ success: true, message: '群聊已解散' })
  } catch (error) {
    console.error('❌ 解散群聊失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新群聊名称
app.put('/api/groups/:groupId/name', authenticateToken, async (req, res) => {
  console.log('🔥🔥🔥 收到修改群聊名称请求！')
  console.log('🔥 请求参数:', req.params)
  console.log('🔥 请求体:', req.body)

  try {
    await dbReady
    const { groupId } = req.params
    const { name, oldName } = req.body
    const userId = req.user.userId  // 从 token 中获取用户 ID

    console.log('📝 更新群聊名称:', { groupId, name, oldName, userId })

    // 验证参数
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: '群聊名称不能为空' })
    }

    if (name.length > 20) {
      return res.status(400).json({ success: false, error: '群聊名称最多20个字符' })
    }

    // 检查群聊设置：是否仅管理员可修改群名
    const [groupSettings] = await pool.execute(
      'SELECT only_admin_can_rename FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupSettings.length > 0 && groupSettings[0].only_admin_can_rename) {
      // 检查用户是否是群主或管理员
      const [memberRole] = await pool.execute(
        'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      )

      if (memberRole.length === 0 || (memberRole[0].role !== 'owner' && memberRole[0].role !== 'creator' && memberRole[0].role !== 'admin')) {
        return res.status(403).json({ success: false, error: '只有群主或管理员可以修改群名' })
      }
    }

    // 更新群聊名称
    await pool.execute(
      'UPDATE `groups` SET name = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), groupId]
    )

    console.log('✅ 群聊名称更新成功')

    // 获取修改者的昵称
    let operatorName = '群成员'
    if (userId) {
      const [users] = await pool.execute(
        'SELECT nickname, username FROM `users` WHERE id = ?',
        [userId]
      )
      if (users.length > 0) {
        // 优先使用 nickname，如果为空则使用 username
        operatorName = users[0].nickname || users[0].username || '群成员'
      }
    }

    // 发送系统消息到群聊
    // 消息格式：对于每个群成员，如果是自己则显示"你修改群名为'XX'"，否则显示"XX修改群名为'XX'"
    const systemMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: userId || 0, // 发送者ID（操作者）
      receiverId: groupId, // 接收者ID（群聊ID）
      type: 'system',
      content: `${operatorName}修改群名为"${name.trim()}"`,
      timestamp: new Date().toISOString(),
      groupId: groupId,
      operatorId: userId, // 添加操作者ID
      operatorName: operatorName, // 添加操作者昵称
      newGroupName: name.trim() // 添加新群名
    }

    // 保存系统消息到数据库（保存完整内容）
    try {
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, userId || 0, groupId, systemMessage.content, 'system']
      )
      console.log('✅ 系统消息已保存到数据库')
    } catch (msgError) {
      console.error('❌ 保存系统消息失败:', msgError)
    }

    // 通过WebSocket发送系统消息给所有群成员
    try {
      console.log('🔥 开始发送WebSocket系统消息...')

      // 获取所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      console.log(`🔥 找到 ${members.length} 个群成员:`, members.map(m => m.user_id))
      console.log('🔥 当前在线用户 userSockets:', Array.from(userSockets.entries()))

      // 向每个群成员发送消息
      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        console.log(`🔥 用户 ${memberId} 的 Socket ID:`, userSocketId)

        if (userSocketId) {
          // 发送包含操作者信息的完整消息
          io.to(userSocketId).emit('new_message', systemMessage)
          console.log(`📤 系统消息已发送给用户 ${memberId}，Socket ID: ${userSocketId}`)
        } else {
          console.log(`⚠️ 用户 ${memberId} 不在线，无法发送消息`)
        }
      })

      console.log('✅ 系统消息已通过WebSocket发送给所有群成员')
    } catch (wsError) {
      console.error('❌ 发送WebSocket消息失败:', wsError)
    }

    // 广播群名称更新事件给所有群成员（用于实时更新标题）
    try {
      console.log('📢 广播群名称更新事件...')
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)

        if (userSocketId) {
          io.to(userSocketId).emit('group_name_updated', {
            groupId: groupId,
            newGroupName: name.trim(),
            operatorId: userId,
            operatorName: operatorName
          })
          console.log(`📤 群名称更新事件已发送给用户 ${memberId}`)
        }
      })
    } catch (wsError) {
      console.error('❌ 广播群名称更新事件失败:', wsError)
    }

    res.json({ success: true, data: { id: groupId, name: name.trim() } })
  } catch (error) {
    console.error('❌ 更新群聊名称失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群二维码（GET）
app.get('/api/groups/:groupId/qrcode', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('🔍 获取群二维码:', groupId)

    // 检查是否有有效的二维码（7天内）
    const [existingQRCode] = await pool.execute(
      'SELECT * FROM `group_qrcodes` WHERE group_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [groupId]
    )

    if (existingQRCode.length > 0) {
      // 返回现有的二维码
      console.log('✅ 返回现有的群二维码')

      // 生成二维码图片URL
      const qrSize = 400 // 默认大小
      const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(existingQRCode[0].qrcode_data)}`

      return res.json({
        success: true,
        data: {
          qr_code_url: qrcodeUrl,
          qrcode_data: existingQRCode[0].qrcode_data,
          expires_at: existingQRCode[0].expires_at
        }
      })
    }

    // 生成新的二维码
    const qrcodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const qrcodeData = JSON.stringify({
      type: 'group_join',
      groupId: groupId,
      qrcodeId: qrcodeId
    })
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期

    // 保存到数据库
    await pool.execute(
      'INSERT INTO `group_qrcodes` (id, group_id, qrcode_data, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())',
      [qrcodeId, groupId, qrcodeData, expiresAt]
    )

    console.log('✅ 群二维码生成成功')

    // 生成二维码图片URL
    const qrSize = 400 // 默认大小
    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrcodeData)}`

    res.json({
      success: true,
      data: {
        qr_code_url: qrcodeUrl,
        qrcode_data: qrcodeData,
        expires_at: expiresAt
      }
    })
  } catch (error) {
    console.error('❌ 获取群二维码失败:', error)
    res.status(500).json({ success: false, error: '获取群二维码失败' })
  }
})

// 生成/获取群二维码（POST，保留兼容性）
app.post('/api/groups/:groupId/qrcode', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('🔍 生成/获取群二维码:', groupId)

    // 检查是否有有效的二维码（7天内）
    const [existingQRCode] = await pool.execute(
      'SELECT * FROM `group_qrcodes` WHERE group_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [groupId]
    )

    if (existingQRCode.length > 0) {
      // 返回现有的二维码
      console.log('✅ 返回现有的群二维码')
      return res.json({
        success: true,
        data: {
          qrcode_data: existingQRCode[0].qrcode_data,
          expires_at: existingQRCode[0].expires_at
        }
      })
    }

    // 生成新的二维码
    const qrcodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const qrcodeData = JSON.stringify({
      type: 'group_join',
      groupId: groupId,
      qrcodeId: qrcodeId
    })
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期

    // 保存到数据库
    await pool.execute(
      'INSERT INTO `group_qrcodes` (id, group_id, qrcode_data, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())',
      [qrcodeId, groupId, qrcodeData, expiresAt]
    )

    console.log('✅ 群二维码生成成功')

    res.json({
      success: true,
      data: {
        qrcode_data: qrcodeData,
        expires_at: expiresAt
      }
    })
  } catch (error) {
    console.error('❌ 生成群二维码失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取群备注
app.get('/api/groups/:groupId/remark', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    console.log('🔍 获取群备注:', { groupId, userId })

    // 确保群备注表存在
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`group_remarks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL COMMENT '用户ID',
        \`group_id\` VARCHAR(50) NOT NULL COMMENT '群聊ID',
        \`remark\` VARCHAR(255) DEFAULT '' COMMENT '备注',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_user_group\` (\`user_id\`, \`group_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群备注表'
    `)

    // 查询备注
    const [rows] = await pool.execute(
      'SELECT remark FROM `group_remarks` WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    )

    if (rows.length > 0) {
      console.log('✅ 群备注查询成功')
      res.json({
        success: true,
        data: {
          remark: rows[0].remark || ''
        }
      })
    } else {
      res.json({
        success: true,
        data: {
          remark: ''
        }
      })
    }
  } catch (error) {
    console.error('❌ 获取群备注失败:', error)
    res.status(500).json({ success: false, error: '获取群备注失败' })
  }
})

// 保存/更新群备注
app.put('/api/groups/:groupId/remark', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId
    const { remark } = req.body

    console.log('🔄 保存群备注:', { groupId, userId, remark })

    // 确保群备注表存在
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`group_remarks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL COMMENT '用户ID',
        \`group_id\` VARCHAR(50) NOT NULL COMMENT '群聊ID',
        \`remark\` VARCHAR(255) DEFAULT '' COMMENT '备注',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_user_group\` (\`user_id\`, \`group_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群备注表'
    `)

    // 插入或更新备注
    await pool.execute(
      'INSERT INTO `group_remarks` (user_id, group_id, remark) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE remark = ?, updated_at = NOW()',
      [userId, groupId, remark || '', remark || '']
    )

    console.log('✅ 群备注保存成功')
    res.json({
      success: true,
      message: '备注已保存'
    })
  } catch (error) {
    console.error('❌ 保存群备注失败:', error)
    res.status(500).json({ success: false, error: '保存群备注失败' })
  }
})

// 获取待处理的进群申请数量
app.get('/api/groups/:groupId/join-requests/pending-count', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('🔍 获取待处理进群申请数量:', groupId)

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM `group_join_requests` WHERE group_id = ? AND status = "pending"',
      [groupId]
    )

    const count = result[0].count || 0
    console.log('✅ 待处理进群申请数量:', count)

    res.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    console.error('❌ 获取待处理进群申请数量失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取进群申请列表
app.get('/api/groups/:groupId/join-requests', async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params

    console.log('🔍 获取进群申请列表:', groupId)

    const [requests] = await pool.execute(
      `SELECT gjr.id, gjr.user_id, gjr.message, gjr.status, gjr.created_at,
              u.nickname, u.avatar
       FROM \`group_join_requests\` gjr
       JOIN \`users\` u ON gjr.user_id = u.id
       WHERE gjr.group_id = ? AND gjr.status = 'pending'
       ORDER BY gjr.created_at DESC`,
      [groupId]
    )

    console.log('✅ 获取进群申请列表成功，数量:', requests.length)

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('❌ 获取进群申请列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 处理进群申请
app.put('/api/groups/:groupId/join-requests/:requestId', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId, requestId } = req.params
    const { action } = req.body // 'approve' 或 'reject'

    console.log('🔍 处理进群申请:', { groupId, requestId, action })

    // 获取申请信息
    const [request] = await pool.execute(
      'SELECT * FROM `group_join_requests` WHERE id = ? AND group_id = ?',
      [requestId, groupId]
    )

    if (request.length === 0) {
      return res.status(404).json({ success: false, error: '申请不存在' })
    }

    const userId = request[0].user_id

    if (action === 'approve') {
      // 同意申请，添加用户到群聊
      await pool.execute(
        'INSERT INTO `group_members` (group_id, user_id, role, joined_at) VALUES (?, ?, "member", NOW())',
        [groupId, userId]
      )

      // 更新申请状态
      await pool.execute(
        'UPDATE `group_join_requests` SET status = "approved", updated_at = NOW() WHERE id = ?',
        [requestId]
      )

      console.log('✅ 进群申请已同意')

      // 获取更新后的成员数量和所有成员ID
      const [groupMembers] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )
      const memberCount = groupMembers.length

      // 通知所有群成员成员数量变化（遍历每个成员单独发送）
      if (io) {
        groupMembers.forEach(member => {
          const memberId = member.user_id
          const memberSocketId = userSockets.get(memberId)
          if (memberSocketId) {
            io.to(memberSocketId).emit('group-members-changed', {
              groupId,
              memberCount
            })
          }
        })
        console.log('📢 已通知群成员：成员数量变化，新成员数:', memberCount)
      }

      // 通过 WebSocket 通知被邀请人审核通过
      const userSocketId = userSockets.get(userId)
      if (userSocketId) {
        io.to(userSocketId).emit('group_join_approved', {
          groupId,
          requestId,
          status: 'approved'
        })
        console.log(`📤 已通知用户 ${userId} 审核通过`)
      }
    } else if (action === 'reject') {
      // 拒绝申请
      await pool.execute(
        'UPDATE `group_join_requests` SET status = "rejected", updated_at = NOW() WHERE id = ?',
        [requestId]
      )

      console.log('✅ 进群申请已拒绝')

      // 通过 WebSocket 通知被邀请人审核被拒
      const userSocketId = userSockets.get(userId)
      if (userSocketId) {
        io.to(userSocketId).emit('group_join_rejected', {
          groupId,
          requestId,
          status: 'rejected'
        })
        console.log(`📤 已通知用户 ${userId} 审核被拒`)
      }
    }

    res.json({
      success: true,
      message: action === 'approve' ? '已同意' : '已拒绝'
    })
  } catch (error) {
    console.error('❌ 处理进群申请失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 邀请好友加入群聊
 * 逻辑：
 * 1. 生成邀请码
 * 2. 发送邀请卡片消息给被邀请人
 * 3. 被邀请人点击卡片后弹出确认对话框
 * 4. 确认后调用加入群聊接口
 */
app.post('/api/groups/:groupId/invite-request', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const { inviteeIds } = req.body
    const inviterId = req.user.userId

    // 参数验证
    if (!inviteeIds || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要邀请的好友' })
    }

    // 检查邀请人是否是群成员
    const [memberCheck] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, inviterId]
    )

    if (memberCheck.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员，无法邀请好友' })
    }

    // 获取群信息
    const [groupInfo] = await pool.execute(
      'SELECT name, avatar, require_approval FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupInfo.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    const group = groupInfo[0]

    // 获取群成员数量
    const [memberCountResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM `group_members` WHERE group_id = ?',
      [groupId]
    )
    const memberCount = memberCountResult[0].count

    // 获取邀请人信息
    const [inviterInfo] = await pool.execute(
      'SELECT nickname, username FROM `users` WHERE id = ?',
      [inviterId]
    )
    const inviterName = inviterInfo[0].nickname || inviterInfo[0].username

    // 生成邀请码（每次邀请生成一个新的邀请码）
    const inviteCode = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`📝 准备插入邀请码到数据库: ${inviteCode}`)

    // 保存邀请链接到数据库（确保 is_active 为 TRUE）
    const [insertResult] = await pool.execute(
      'INSERT INTO `group_invite_links` (group_id, invite_code, inviter_id, is_active, created_at) VALUES (?, ?, ?, TRUE, NOW())',
      [groupId, inviteCode, inviterId]
    )

    console.log(`✅ 邀请码已插入数据库: ${inviteCode}, insertId: ${insertResult.insertId}`)

    // 构建邀请卡片内容
    const inviteCard = {
      type: 'group_invite',
      groupId,
      groupName: group.name,
      groupAvatar: group.avatar,
      memberCount,
      inviteCode,
      inviterName,
      inviterId,
      requireApproval: group.require_approval === 1 // 是否需要审核
    }

    // 发送邀请卡片给每个被邀请人
    for (const inviteeId of inviteeIds) {
      // 生成消息ID和时间戳（确保每条消息的时间戳递增）
      const now = Date.now()
      const messageId = `msg_${now}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date(now).toISOString()

      // 获取被邀请人信息
      const [inviteeInfo] = await pool.execute(
        'SELECT nickname, username FROM `users` WHERE id = ?',
        [inviteeId]
      )
      const inviteeName = inviteeInfo[0]?.nickname || inviteeInfo[0]?.username || '好友'

      // 构建邀请卡片内容（包含被邀请人信息）
      const inviteCardWithInvitee = {
        ...inviteCard,
        inviteeName,
        inviteeId
      }

      const messageContent = JSON.stringify(inviteCardWithInvitee)

      // 保存消息到数据库（使用统一的时间戳）
      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [messageId, inviterId, inviteeId, messageContent, 'group_invite', new Date(now)]
      )

      // 通过WebSocket发送给被邀请人
      const inviteeSocketId = userSockets.get(inviteeId)
      if (inviteeSocketId) {
        const messageToSend = {
          id: messageId,
          senderId: inviterId,
          receiverId: inviteeId,
          content: messageContent,
          type: 'group_invite',
          timestamp: timestamp
        }
        console.log('📤 发送群邀请消息给被邀请人:', JSON.stringify(messageToSend))
        io.to(inviteeSocketId).emit('new_message', messageToSend)
      }

      // 同时发送给邀请人自己（让邀请人也能看到发送的邀请卡片）
      const inviterSocketId = userSockets.get(inviterId)
      if (inviterSocketId) {
        const messageToSend = {
          id: messageId,
          senderId: inviterId,
          receiverId: inviteeId,
          content: messageContent,
          type: 'group_invite',
          timestamp: timestamp,
          isOwn: true // 标记为自己发送的消息
        }
        console.log('📤 发送群邀请消息给邀请人:', JSON.stringify(messageToSend))
        io.to(inviterSocketId).emit('new_message', messageToSend)
      }

      // 添加小延迟，确保下一条消息的时间戳更大
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    res.json({
      success: true,
      message: '邀请已发送',
      data: {
        inviteCode,
        groupName: group.name,
        groupAvatar: group.avatar,
        memberCount
      }
    })
  } catch (error) {
    console.error('❌ 发送群邀请失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 检查用户是否是群成员
 * 用于在点击邀请卡片时判断是否直接进入群聊
 */
app.get('/api/groups/:groupId/check-membership', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    console.log('🔍 检查用户是否是群成员:', { groupId, userId })

    // 检查用户是否已经是群成员
    const [existingMember] = await pool.execute(
      'SELECT id, role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    const isMember = existingMember.length > 0

    console.log('✅ 检查结果:', { isMember })

    res.json({
      success: true,
      isMember,
      role: isMember ? existingMember[0].role : null
    })
  } catch (error) {
    console.error('❌ 检查群成员失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 通过邀请码加入群聊
 * 被邀请人点击邀请卡片后调用此接口
 */
app.post('/api/groups/join-by-invite', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { inviteCode, reason } = req.body
    const userId = req.user.userId

    console.log('🔑 通过邀请码加入群聊:', { inviteCode, userId, reason })

    if (!inviteCode) {
      return res.status(400).json({ success: false, error: '邀请码不能为空' })
    }

    // 查询邀请链接信息
    const [inviteLinks] = await pool.execute(
      'SELECT group_id, inviter_id, is_active FROM `group_invite_links` WHERE invite_code = ?',
      [inviteCode]
    )

    if (inviteLinks.length === 0) {
      return res.status(404).json({ success: false, error: '邀请链接不存在或已失效' })
    }

    const { group_id: groupId, inviter_id: inviterId, is_active: isActive } = inviteLinks[0]

    if (!isActive) {
      return res.status(400).json({ success: false, error: '邀请链接已失效' })
    }

    // 检查用户是否已经是群成员
    const [existingMember] = await pool.execute(
      'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (existingMember.length > 0) {
      return res.status(400).json({ success: false, error: '您已经是群成员了' })
    }

    // 检查是否已有待处理的申请
    const [existingRequest] = await pool.execute(
      'SELECT id FROM `group_join_requests` WHERE group_id = ? AND user_id = ? AND status = ?',
      [groupId, userId, 'pending']
    )

    if (existingRequest.length > 0) {
      return res.status(400).json({ success: false, error: '您已经提交过申请，请等待审核' })
    }

    // 获取群设置
    const [groupInfo] = await pool.execute(
      'SELECT name, avatar, require_approval FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (groupInfo.length === 0) {
      return res.status(404).json({ success: false, error: '群聊不存在' })
    }

    const group = groupInfo[0]
    const requireApproval = group.require_approval === 1

    // 检查邀请人的角色
    const [inviterRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, inviterId]
    )

    const isInviterAdmin = inviterRole.length > 0 && (inviterRole[0].role === 'owner' || inviterRole[0].role === 'creator' || inviterRole[0].role === 'admin')

    // 判断是否需要审核：
    // 1. 邀请人是群主/管理员 → 直接加入（无论群设置如何）
    // 2. 邀请人是普通成员 + 群不需要审核 → 直接加入
    // 3. 邀请人是普通成员 + 群需要审核 → 需要审核
    const needApproval = !isInviterAdmin && requireApproval

    console.log('🔍 加入群聊判断:', {
      isInviterAdmin,
      requireApproval,
      needApproval
    })

    if (!needApproval) {
      // 直接加入
      await pool.execute(
        'INSERT INTO `group_members` (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
        [groupId, userId, 'member']
      )

      // 更新邀请链接使用次数
      await pool.execute(
        'UPDATE `group_invite_links` SET used_count = used_count + 1 WHERE invite_code = ?',
        [inviteCode]
      )

      // 获取用户信息
      const [userInfo] = await pool.execute(
        'SELECT nickname FROM `users` WHERE id = ?',
        [userId]
      )
      const userName = userInfo.length > 0 ? userInfo[0].nickname : `用户${userId}`

      // 发送系统消息
      const systemMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: 0,
        receiverId: groupId,
        type: 'system',
        content: `${userName} 通过邀请链接加入了群聊`,
        timestamp: new Date().toISOString(),
        groupId: groupId
      }

      await pool.execute(
        'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [systemMessage.id, 0, groupId, systemMessage.content, 'system']
      )

      // 通过WebSocket发送给所有群成员
      const [members] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ?',
        [groupId]
      )

      const memberCount = members.length

      members.forEach(member => {
        const memberId = member.user_id
        const userSocketId = userSockets.get(memberId)
        if (userSocketId) {
          io.to(userSocketId).emit('new_message', systemMessage)
          // 同时发送成员数量变化事件
          io.to(userSocketId).emit('group-members-changed', {
            groupId,
            memberCount
          })
        }
      })

      console.log('📢 已通知群成员：成员数量变化，新成员数:', memberCount)

      console.log('✅ 用户已直接加入群聊')
      res.json({
        success: true,
        message: '已成功加入群聊',
        requireApproval: false,
        data: {
          groupId,
          groupName: group.name,
          groupAvatar: group.avatar
        }
      })
    } else {
      // 需要审核，创建进群申请
      const applyReason = reason || '申请加入群聊'
      await pool.execute(
        'INSERT INTO `group_join_requests` (group_id, user_id, message, status, inviter_id, invite_code, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [groupId, userId, applyReason, 'pending', inviterId, inviteCode]
      )

      // 通知群主和管理员有新的申请
      const [admins] = await pool.execute(
        'SELECT user_id FROM `group_members` WHERE group_id = ? AND (role = ? OR role = ? OR role = ?)',
        [groupId, 'owner', 'creator', 'admin']
      )

      admins.forEach(admin => {
        const adminId = admin.user_id
        const adminSocketId = userSockets.get(adminId)
        if (adminSocketId) {
          io.to(adminSocketId).emit('new_group_invite_request', {
            groupId,
            groupName: group.name,
            applicantId: userId
          })
        }
      })

      console.log('✅ 进群申请已创建')
      res.json({
        success: true,
        message: '申请已提交，等待群主/管理员审核',
        requireApproval: true,
        data: {
          groupId,
          groupName: group.name,
          groupAvatar: group.avatar
        }
      })
    }
  } catch (error) {
    console.error('❌ 加入群聊失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 获取用户在某个群的申请状态
 */
app.get('/api/groups/:groupId/join-requests/my-status', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    // 查询最新的申请记录
    const [requests] = await pool.execute(
      'SELECT status, created_at, updated_at FROM `group_join_requests` WHERE group_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
      [groupId, userId]
    )

    if (requests.length === 0) {
      return res.json({ success: true, data: null })
    }

    res.json({ success: true, data: requests[0] })
  } catch (error) {
    console.error('获取申请状态失败:', error)
    res.status(500).json({ success: false, error: '获取申请状态失败' })
  }
})

/**
 * 获取群聊邀请申请列表（群主和管理员可见）
 */
app.get('/api/groups/:groupId/invite-requests', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    console.log('📋 获取群聊邀请申请列表:', { groupId, userId })

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (memberRole.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const role = memberRole[0].role
    if (role !== 'owner' && role !== 'creator' && role !== 'admin') {
      return res.status(403).json({ success: false, error: '只有群主和管理员可以查看邀请申请' })
    }

    // 查询所有待处理的邀请申请
    const [requests] = await pool.execute(
      `SELECT
        gjr.id,
        gjr.user_id,
        gjr.message as reason,
        gjr.status,
        gjr.inviter_id,
        gjr.created_at,
        u.nickname,
        u.avatar
      FROM group_join_requests gjr
      INNER JOIN users u ON gjr.user_id = u.id
      WHERE gjr.group_id = ?
      ORDER BY
        CASE gjr.status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
        END,
        gjr.created_at DESC`,
      [groupId]
    )

    console.log('✅ 查询到邀请申请:', requests.length)

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('❌ 获取邀请申请列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 获取群聊邀请申请未读数量
 */
app.get('/api/groups/:groupId/invite-requests/unread-count', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId } = req.params
    const userId = req.user.userId

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    )

    if (memberRole.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const role = memberRole[0].role
    if (role !== 'owner' && role !== 'creator' && role !== 'admin') {
      return res.json({ success: true, count: 0 })
    }

    // 查询待处理的申请数量
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM `group_join_requests` WHERE group_id = ? AND status = ?',
      [groupId, 'pending']
    )

    const count = result[0].count

    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('❌ 获取未读申请数量失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 同意邀请申请
 */
app.post('/api/groups/:groupId/invite-requests/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId, requestId } = req.params
    const reviewerId = req.user.userId

    console.log('✅ 同意邀请申请:', { groupId, requestId, reviewerId })

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, reviewerId]
    )

    if (memberRole.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const role = memberRole[0].role
    if (role !== 'owner' && role !== 'creator' && role !== 'admin') {
      return res.status(403).json({ success: false, error: '只有群主和管理员可以处理邀请申请' })
    }

    // 查询申请信息
    const [requests] = await pool.execute(
      'SELECT user_id, status FROM `group_join_requests` WHERE id = ? AND group_id = ?',
      [requestId, groupId]
    )

    if (requests.length === 0) {
      return res.status(404).json({ success: false, error: '申请不存在' })
    }

    const request = requests[0]

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: '该申请已被处理' })
    }

    const applicantId = request.user_id

    // 检查用户是否已经是群成员
    const [existingMember] = await pool.execute(
      'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, applicantId]
    )

    if (existingMember.length > 0) {
      // 更新申请状态为已批准
      await pool.execute(
        'UPDATE `group_join_requests` SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', requestId]
      )
      return res.status(400).json({ success: false, error: '该用户已经是群成员' })
    }

    // 添加用户到群聊
    await pool.execute(
      'INSERT INTO `group_members` (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [groupId, applicantId, 'member']
    )

    // 更新申请状态
    await pool.execute(
      'UPDATE `group_join_requests` SET status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', requestId]
    )

    // 获取群信息和用户信息
    const [groupInfo] = await pool.execute(
      'SELECT name, avatar FROM `groups` WHERE id = ?',
      [groupId]
    )

    const [userInfo] = await pool.execute(
      'SELECT nickname FROM `users` WHERE id = ?',
      [applicantId]
    )

    const groupName = groupInfo.length > 0 ? groupInfo[0].name : '群聊'
    const userName = userInfo.length > 0 ? userInfo[0].nickname : `用户${applicantId}`

    // 发送系统消息到群聊
    const systemMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: 0,
      receiverId: groupId,
      type: 'system',
      content: `${userName} 通过邀请加入了群聊`,
      timestamp: new Date().toISOString(),
      groupId: groupId
    }

    await pool.execute(
      'INSERT INTO `messages` (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [systemMessage.id, 0, groupId, systemMessage.content, 'system']
    )

    // 通过WebSocket通知所有群成员
    const [members] = await pool.execute(
      'SELECT user_id FROM `group_members` WHERE group_id = ?',
      [groupId]
    )

    const memberCount = members.length

    members.forEach(member => {
      const memberId = member.user_id
      const userSocketId = userSockets.get(memberId)
      if (userSocketId) {
        io.to(userSocketId).emit('new_message', systemMessage)
        // 同时发送成员数量变化事件
        io.to(userSocketId).emit('group-members-changed', {
          groupId,
          memberCount
        })
      }
    })

    console.log('📢 已通知群成员：成员数量变化，新成员数:', memberCount)

    // 通知申请人审核通过
    const applicantSocketId = userSockets.get(applicantId)
    if (applicantSocketId) {
      io.to(applicantSocketId).emit('group_join_approved', {
        groupId,
        groupName,
        groupAvatar: groupInfo.length > 0 ? groupInfo[0].avatar : null
      })
    }

    console.log('✅ 邀请申请已同意')
    res.json({ success: true, message: '已同意申请' })
  } catch (error) {
    console.error('❌ 同意邀请申请失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 拒绝邀请申请
 */
app.post('/api/groups/:groupId/invite-requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    await dbReady
    const { groupId, requestId } = req.params
    const reviewerId = req.user.userId

    console.log('❌ 拒绝邀请申请:', { groupId, requestId, reviewerId })

    // 验证用户是否是群主或管理员
    const [memberRole] = await pool.execute(
      'SELECT role FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, reviewerId]
    )

    if (memberRole.length === 0) {
      return res.status(403).json({ success: false, error: '您不是群成员' })
    }

    const role = memberRole[0].role
    if (role !== 'owner' && role !== 'creator' && role !== 'admin') {
      return res.status(403).json({ success: false, error: '只有群主和管理员可以处理邀请申请' })
    }

    // 查询申请信息
    const [requests] = await pool.execute(
      'SELECT user_id, status FROM `group_join_requests` WHERE id = ? AND group_id = ?',
      [requestId, groupId]
    )

    if (requests.length === 0) {
      return res.status(404).json({ success: false, error: '申请不存在' })
    }

    const request = requests[0]

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: '该申请已被处理' })
    }

    const applicantId = request.user_id

    // 更新申请状态
    await pool.execute(
      'UPDATE `group_join_requests` SET status = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', requestId]
    )

    // 通知申请人审核被拒
    const applicantSocketId = userSockets.get(applicantId)
    if (applicantSocketId) {
      io.to(applicantSocketId).emit('group_join_rejected', {
        groupId
      })
    }

    console.log('✅ 邀请申请已拒绝')
    res.json({ success: true, message: '已拒绝申请' })
  } catch (error) {
    console.error('❌ 拒绝邀请申请失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 导出 server 而不是 app，因为 Socket.IO 绑定在 server 上
module.exports = server

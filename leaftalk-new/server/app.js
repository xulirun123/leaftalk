// 叶语统一服务器入口文件
require('dotenv').config({ path: '../.env' })

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
const PORT = 8893

// 中间件配置
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'], // 'null' 允许 file:// 协议
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Socket.IO配置
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'], // 'null' 允许 file:// 协议
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
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
}

// 调试：打印数据库配置
console.log('🔍 数据库配置调试:')
console.log('  DB_HOST:', process.env.DB_HOST)
console.log('  DB_USER:', process.env.DB_USER)
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined')
console.log('  DB_NAME:', process.env.DB_NAME)
console.log('  实际使用的数据库:', dbConfig.database)

// 创建数据库连接池
const pool = mysql.createPool(dbConfig)
const db = pool // 为了兼容性，创建db别名
console.log('✅ 数据库连接池创建成功')
// 确保用户表增加二维码字段（MySQL 8+ 支持 IF NOT EXISTS）
async function ensureUserQrColumn() {
  try {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(255) DEFAULT NULL
    `)
  } catch (e) {
    console.warn('⚠️ 确保用户二维码字段失败(可能已存在):', e.message)
  }
}

// 在启动时后台执行一次，避免阻塞
;(async () => {
  try { await ensureUserQrColumn() } catch { /* ignore */ }
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
                message_type ENUM('text', 'image', 'voice', 'video', 'file') DEFAULT 'text',
                status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ 消息表检查/创建完成')
    } catch (error) {
        console.error('❌ 创建消息表失败:', error)
    }
}

// 立即初始化消息表
initMessageTable()

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

            userSockets.set(socket.id, userId)

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
                        INSERT INTO messages (id, sender_id, receiver_id, content, message_type, created_at, status)
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

            // 发送给接收者
            const receiverRoom = `user_${message.receiverId}`
            socket.to(receiverRoom).emit('new_message', message)

            // 发送给发送者确认
            callback({ success: true, messageId: message.id })

            console.log(`✅ 消息已发送: ${message.senderId} -> ${message.receiverId}`)

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

        const userId = userSockets.get(socket.id)
        if (userId) {
            // 移除在线用户记录
            onlineUsers.delete(userId)
            userSockets.delete(socket.id)

            // 广播用户离线状态
            socket.broadcast.emit('user_status', {
                userId,
                status: 'offline',
                lastSeen: Date.now()
            })

            console.log(`👤 用户 ${userId} 已离线`)
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
        const { username, password } = req.body

        console.log('🔍 登录请求参数:', { username, password: password ? '***' : undefined })

        if (!username) {
            return res.status(400).json({
                success: false,
                error: '请输入叶语号或手机号'
            })
        }

        // 查询用户（支持叶语号或手机号登录）
        const [users] = await db.execute(
            'SELECT * FROM users WHERE yeyu_id = ? OR phone = ?',
            [username, username]
        )

        if (users.length === 0) {
            console.log('❌ 用户不存在:', username)
            return res.status(401).json({
                success: false,
                error: '账户不存在，请检查叶语号或手机号'
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

// 获取用户信息API
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params

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
        const { phone, password, nickname } = req.body

        // 检查手机号是否已存在
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        )

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: '手机号已注册' })
        }

        // 生成叶语号
        const generateYeyuId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = ''
            for (let i = 0; i < 10; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        }

        let yeyuId = generateYeyuId()

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

        // 插入新用户
        const [result] = await pool.execute(
            'INSERT INTO users (yeyu_id, username, phone, password, nickname, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [yeyuId, yeyuId, phone, hashedPassword, nickname]
        )

        res.json({
            message: '注册成功',
            user: {
                id: result.insertId,
                yeyu_id: yeyuId,
                phone,
                nickname
            }
        })
    } catch (error) {
        console.error('注册失败:', error)
        res.status(500).json({ error: '注册失败' })
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

        // 导入OCR服务
        const OCRService = require('./services/ocrService')
        const ocrService = new OCRService()

        // 执行OCR识别
        const result = await ocrService.recognizeIDCard(req.file.buffer)

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
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status, gender, region, signature, qr_code_url FROM users WHERE id = ?',
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
        const { nickname, avatar, phone, real_name, gender, region, signature, qrCodeUrl, qr_code_url } = req.body

        console.log('🔄 更新用户信息:', { userId, nickname, avatar, phone, real_name, gender, region, signature })

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
            'SELECT id, yeyu_id, nickname, avatar, phone, real_name, verification_status, gender, region, signature, qr_code_url FROM users WHERE id = ?',
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

        // 保存到user_avatars表
        await db.execute(`
            INSERT INTO user_avatars (user_id, avatar_url, avatar_type, file_name, file_path,
                                    file_type, file_size, is_current, is_active)
            VALUES (?, ?, 'upload', ?, ?, ?, ?, 1, 1)
            ON DUPLICATE KEY UPDATE
            avatar_url = VALUES(avatar_url),
            file_name = VALUES(file_name),
            file_path = VALUES(file_path),
            file_type = VALUES(file_type),
            file_size = VALUES(file_size),
            is_current = 1,
            updated_at = CURRENT_TIMESTAMP
        `, [userId, avatarUrl, req.file.originalname, relativePath,
            path.extname(req.file.originalname), req.file.size])

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
    try { tags = row.tags ? JSON.parse(row.tags) : [] } catch {}
    try { phones = row.phones ? JSON.parse(row.phones) : [] } catch {}

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

        // 获取收到的好友请求
        const [requests] = await pool.execute(`
            SELECT fr.id, fr.message, fr.created_at, fr.status,
                   u.id as user_id, u.yeyu_id, u.nickname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.requester_id = u.id
            WHERE fr.requestee_id = ? AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        `, [req.user.userId])

        res.json({
            success: true,
            data: requests
        })
    } catch (error) {
        console.error('获取好友请求失败:', error)
        res.status(500).json({ error: '获取好友请求失败' })
    }
})

app.get('/api/friends/requests/sent', authenticateToken, async (req, res) => {
    try {
        // 获取发送的好友请求
        const [requests] = await pool.execute(`
            SELECT fr.id, fr.message, fr.created_at, fr.status,
                   u.id as user_id, u.yeyu_id, u.nickname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.requestee_id = u.id
            WHERE fr.requester_id = ?
            ORDER BY fr.created_at DESC
        `, [req.user.userId])

        res.json({
            success: true,
            data: requests
        })
    } catch (error) {
        console.error('获取我的申请失败:', error)
        res.status(500).json({ error: '获取我的申请失败' })
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

// 启动服务器 - 使用HTTP server以支持WebSocket
server.listen(PORT, () => {
    console.log(`🚀 叶语统一服务器启动成功！`)

    // 确保用户1和用户2互为好友
    async function ensureUser1And2AreFriends() {
        try {
            // 检查用户1和用户2是否已经是好友
            const [existing] = await pool.execute(`
                SELECT * FROM friendships
                WHERE (user_id = 1 AND friend_id = 2) OR (user_id = 2 AND friend_id = 1)
            `)

            if (existing.length === 0) {
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

    // 启动时确保好友关系
    ensureUser1And2AreFriends()

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
    console.log(`📍 主服务: http://localhost:${PORT}`)
    console.log(`📡 WebSocket服务已启用`)
    console.log(`🌐 HTTP API: http://localhost:${PORT}`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
    console.log(`🔍 健康检查: http://localhost:${PORT}/health`)
    console.log(`🔑 测试Token: http://localhost:${PORT}/api/dev/test-token`)
    console.log(`👤 身份状态: http://localhost:${PORT}/api/identity/status`)
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`)

    // 自动启动WebRTC服务
    if (process.env.AUTO_START_WEBRTC !== 'false') {
        console.log(`🔄 正在启动WebRTC服务...`)
        const { spawn } = require('child_process')
        const webrtcProcess = spawn('node', ['start-webrtc.js'], {
            cwd: './webrtc',
            stdio: 'inherit'
        })

        webrtcProcess.on('error', (error) => {
            console.error('❌ WebRTC服务启动失败:', error.message)
        })

        webrtcProcess.on('exit', (code) => {
            console.log(`📴 WebRTC服务退出，代码: ${code}`)
        })
    } else {
        console.log(`📝 WebRTC服务: 请单独启动 webrtc/start-webrtc.js`)
    }

    // 定期清理离线用户
    setInterval(() => {
        const now = Date.now()
        const timeout = 60000 // 60秒超时

        for (const [userId, userInfo] of onlineUsers.entries()) {
            if (userInfo.lastHeartbeat && (now - userInfo.lastHeartbeat) > timeout) {
                console.log(`⏰ 用户 ${userId} 心跳超时，标记为离线`)
                onlineUsers.delete(userId)

                // 广播用户离线状态
                io.emit('user_status', {
                    userId,
                    status: 'offline',
                    lastSeen: userInfo.lastHeartbeat || userInfo.joinTime
                })
            }
        }
    }, 30000) // 每30秒检查一次
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
            SELECT id, sender_id, receiver_id, content, message_type, status, created_at
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
                m1.message_type as last_message_type,
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

// WebRTC 通话 API
const webrtcCallsRouter = require('../backend/routes/webrtcCalls')
app.use('/api/webrtc-calls', authenticateToken, webrtcCallsRouter)
console.log('✅ WebRTC Calls API mounted on /api/webrtc-calls')

module.exports = app

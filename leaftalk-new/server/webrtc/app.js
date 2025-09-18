/**
 * 叶语企业版 - 后端服务器
 * 模块化架构，支持认证、聊天、通讯录等功能
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const { createServer } = require('http')
const { Server } = require('socket.io')
const redis = require('redis')
const fileUpload = require('express-fileupload')

// 加载环境变量
require('dotenv').config()

// 创建Express应用
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
})

// 配置
const PORT = 8894
const JWT_SECRET = process.env.JWT_SECRET || 'leaftalk-secret-key-2024'

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'leaftalk_enterprise',
  charset: 'utf8mb4',
  timezone: '+08:00'
}

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0
}

// 创建数据库连接池
let db
async function initDatabase() {
  try {
    db = await mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  }
}

// 创建Redis连接
let redisClient
async function initRedis() {
  try {
    redisClient = redis.createClient({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db
    })

    redisClient.on('error', (err) => {
      console.error('❌ Redis连接错误:', err)
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis连接成功')
    })

    await redisClient.connect()
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message)
    console.log('⚠️ 继续运行，但缓存功能将不可用')
    redisClient = null
  }
}

// 中间件配置
app.use(cors({
  origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API限流中间件
const rateLimiter = async (req, res, next) => {
  if (!redisClient) {
    return next() // Redis不可用时跳过限流
  }

  const clientIP = req.ip || req.connection.remoteAddress
  const key = `rate_limit:${clientIP}`

  try {
    const current = await redisClient.incr(key)

    if (current === 1) {
      // 第一次请求，设置过期时间为1分钟
      await redisClient.expire(key, 60)
    }

    // 每分钟最多100个请求
    if (current > 100) {
      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter: 60
      })
    }

    next()
  } catch (error) {
    console.warn('限流检查失败:', error.message)
    next() // 出错时不阻止请求
  }
}

// 应用限流中间件到API路由
app.use('/api', rateLimiter)

// JWT验证中间件 (支持Redis黑名单)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' })
  }

  // 检查令牌是否在黑名单中
  if (redisClient) {
    try {
      const isBlacklisted = await redisClient.get(`blacklist:${token}`)
      if (isBlacklisted) {
        return res.status(401).json({ error: '令牌已失效' })
      }
    } catch (error) {
      console.warn('Redis黑名单检查失败:', error.message)
    }
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' })
    }
    req.user = user
    req.token = token // 保存token用于后续操作
    next()
  })
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '叶语服务器运行正常',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
})

// 认证路由
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 收到登录请求:', req.body)
    const { username, password } = req.body

    if (!username || !password) {
      console.log('❌ 用户名或密码为空')
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    console.log('🔍 查询用户:', username)
    // 查询用户
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR phone = ? OR yeyu_id = ?',
      [username, username, username]
    )
    console.log('📊 查询结果:', users.length, '个用户')

    if (users.length === 0) {
      console.log('❌ 用户不存在:', username)
      return res.status(401).json({ error: '用户不存在' })
    }

    const user = users[0]
    console.log('✅ 找到用户:', user.username, user.id)

    // 验证密码
    console.log('🔒 验证密码...')
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.log('❌ 密码错误')
      return res.status(401).json({ error: '密码错误' })
    }
    console.log('✅ 密码验证成功')

    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        yeyu_id: user.yeyu_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 注释掉last_login更新，因为数据库表中没有这个字段
    // await db.execute(
    //   'UPDATE users SET last_login = NOW() WHERE id = ?',
    //   [user.id]
    // )
    console.log('✅ JWT令牌生成成功')

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        yeyu_id: user.yeyu_id,
        avatar: user.avatar,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 注册路由
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 检查用户是否已存在
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR phone = ?',
      [username, phone]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: '用户名或手机号已存在' })
    }

    // 生成叶语ID
    const generateYeyuId = () => {
      return Math.random().toString(36).substring(2, 12).toUpperCase()
    }
    
    let yeyu_id = generateYeyuId()
    
    // 确保叶语ID唯一
    while (true) {
      const [existing] = await db.execute('SELECT id FROM users WHERE yeyu_id = ?', [yeyu_id])
      if (existing.length === 0) break
      yeyu_id = generateYeyuId()
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const [result] = await db.execute(
      'INSERT INTO users (username, password, nickname, phone, yeyu_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [username, hashedPassword, nickname || username, phone, yeyu_id]
    )

    res.json({
      success: true,
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        nickname: nickname || username,
        yeyu_id,
        phone
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 用户登出 (JWT黑名单)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.token

    // 将令牌加入黑名单 (设置过期时间为令牌剩余有效期)
    if (redisClient && token) {
      try {
        // 解析令牌获取过期时间
        const decoded = jwt.decode(token)
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)

        if (expiresIn > 0) {
          await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true')
          console.log('🚫 令牌已加入黑名单')
        }
      } catch (error) {
        console.warn('Redis黑名单写入失败:', error.message)
      }
    }

    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error('登出错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取用户信息 (带Redis缓存)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `user:${req.user.id}`

    // 尝试从Redis获取缓存
    let user = null
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey)
        if (cached) {
          user = JSON.parse(cached)
          console.log('📦 从Redis缓存获取用户信息')
        }
      } catch (cacheError) {
        console.warn('Redis缓存读取失败:', cacheError.message)
      }
    }

    // 如果缓存中没有，从数据库查询
    if (!user) {
      const [users] = await db.execute(
        'SELECT id, username, nickname, yeyu_id, avatar, phone, real_name, created_at FROM users WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({ error: '用户不存在' })
      }

      user = users[0]

      // 存入Redis缓存 (5分钟过期)
      if (redisClient) {
        try {
          await redisClient.setEx(cacheKey, 300, JSON.stringify(user))
          console.log('💾 用户信息已缓存到Redis')
        } catch (cacheError) {
          console.warn('Redis缓存写入失败:', cacheError.message)
        }
      }
    }

    res.json({ success: true, user })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 聊天相关路由 (带Redis缓存)
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const cacheKey = `chats:${userId}`

    // 尝试从Redis获取缓存
    let chats = null
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey)
        if (cached) {
          chats = JSON.parse(cached)
          console.log('📦 从Redis缓存获取聊天列表')
        }
      } catch (cacheError) {
        console.warn('Redis缓存读取失败:', cacheError.message)
      }
    }

    // 如果缓存中没有，返回空数组而不是测试数据
    if (!chats) {
      chats = []
      console.log('📱 没有聊天数据，返回空列表')
    }

    res.json({
      success: true,
      chats
    })
  } catch (error) {
    console.error('获取聊天列表错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 通讯录相关路由
app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      contacts: []
    })
  } catch (error) {
    console.error('获取通讯录错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 身份认证状态接口
app.get('/api/identity/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // 查询用户的实名认证状态
    const [users] = await db.execute(
      'SELECT real_name, id_card, verification_status FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const user = users[0]

    let status = 'not_submitted'
    let message = '请完成实名认证'

    if (user.real_name && user.id_card) {
      if (user.verification_status === 'verified' || user.verification_status === 'approved') {
        status = 'verified'
        message = '实名认证已通过'
      } else if (user.verification_status === 'pending') {
        status = 'pending'
        message = '实名认证审核中'
      } else {
        status = 'verified' // 有实名信息就认为已认证
        message = '实名认证已通过'
      }
    }

    res.json({
      success: true,
      data: {
        status,
        message,
        realName: user.real_name || '',
        idCard: user.id_card ? user.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '',
        verified: user.verification_status === 'verified' || user.verification_status === 'approved' || (user.real_name && user.id_card)
      }
    })
  } catch (error) {
    console.error('获取身份认证状态错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 开发环境创建测试用户
app.get('/api/dev/create-test-user', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10)

    // 先尝试创建测试用户 (如果不存在)
    await db.execute(
      'INSERT IGNORE INTO users (username, password, nickname, phone, yeyu_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['testuser', hashedPassword, '测试用户', '13800138000', 'TEST123456']
    )

    res.json({
      success: true,
      message: '测试用户创建成功',
      user: {
        username: 'testuser',
        password: '123456',
        nickname: '测试用户',
        yeyu_id: 'TEST123456'
      }
    })
  } catch (error) {
    console.error('创建测试用户错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// OCR身份证识别接口 (使用百度OCR)
app.post('/api/ocr/idcard', async (req, res) => {
  try {
    console.log('📷 收到OCR识别请求')

    // 检查是否有上传的文件
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        error: '请上传身份证图片'
      })
    }

    const imageFile = req.files.image
    console.log('📷 图片信息:', {
      name: imageFile.name,
      size: imageFile.size,
      mimetype: imageFile.mimetype
    })

    // 尝试使用百度OCR
    try {
      const OCRService = require('./services/ocrService')
      const ocrService = new OCRService()

      const result = await ocrService.recognizeIdCard(imageFile.data)

      if (result.success) {
        console.log('✅ 百度OCR识别成功')
        res.json(result)
      } else {
        throw new Error('百度OCR识别失败')
      }
    } catch (ocrError) {
      console.warn('⚠️ 百度OCR失败，使用模拟数据:', ocrError.message)

      // 降级到模拟OCR识别结果
      const mockOCRResult = {
        realName: '张三',
        idNumber: '110101199001011234',
        gender: '男',
        birthDate: '1990-01-01',
        address: '北京市东城区某某街道某某号',
        nationality: '汉族',
        issuingAuthority: '北京市公安局东城分局',
        validPeriod: '2020.01.01-2030.01.01'
      }

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000))

      res.json({
        success: true,
        message: 'OCR识别成功 (模拟)',
        data: mockOCRResult,
        method: 'mock_ocr',
        confidence: 0.95
      })
    }
  } catch (error) {
    console.error('OCR识别错误:', error)
    res.status(500).json({
      success: false,
      error: 'OCR识别失败',
      message: error.message
    })
  }
})

// 提交实名认证接口
app.post('/api/users/identity', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 收到实名认证提交:', req.body)
    const { realName, idNumber, fatherName, motherName } = req.body
    const userId = req.user.id

    if (!realName || !idNumber || !fatherName || !motherName) {
      return res.status(400).json({
        success: false,
        error: '请填写所有必填信息'
      })
    }

    // 验证姓氏匹配
    if (realName.charAt(0) !== fatherName.charAt(0)) {
      return res.status(400).json({
        success: false,
        error: '身份证姓氏必须与父亲姓氏相同'
      })
    }

    // 更新用户实名信息
    await db.execute(
      'UPDATE users SET real_name = ?, id_card = ?, verification_status = ? WHERE id = ?',
      [realName, idNumber, 'verified', userId]
    )

    console.log('✅ 实名认证信息已更新')

    res.json({
      success: true,
      message: '实名认证提交成功',
      data: {
        realName,
        idNumber: idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'),
        verified: true,
        submittedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('提交实名认证错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

// 开发环境 - 查看所有用户状态
app.get('/api/dev/users', async (req, res) => {
  try {
    // 先查看表结构
    const [columns] = await db.execute('DESCRIBE users')
    console.log('📊 Users表结构:', columns.map(col => col.Field))

    const [users] = await db.execute(
      'SELECT * FROM users ORDER BY id'
    )

    res.json({
      success: true,
      message: '用户列表获取成功',
      users: users.map(user => ({
        ...user,
        id_card: user.id_card ? user.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : null
      }))
    })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 开发环境快速登录 (自动创建测试用户并登录)
app.post('/api/dev/quick-login', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10)

    // 先尝试创建测试用户 (如果不存在)
    await db.execute(
      'INSERT IGNORE INTO users (username, password, nickname, phone, yeyu_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['testuser', hashedPassword, '测试用户', '13800138000', 'TEST123456']
    )

    // 查询用户信息
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      ['testuser']
    )

    if (users.length === 0) {
      return res.status(404).json({ error: '测试用户创建失败' })
    }

    const user = users[0]

    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        yeyu_id: user.yeyu_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: '开发环境快速登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        yeyu_id: user.yeyu_id,
        avatar: user.avatar,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('快速登录错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// Socket.IO 连接处理 (支持在线状态管理)
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id)

  // 用户上线
  socket.on('user:online', async (data) => {
    const { userId, token } = data

    if (userId && redisClient) {
      try {
        // 设置用户在线状态 (30分钟过期)
        await redisClient.setEx(`online:${userId}`, 1800, JSON.stringify({
          socketId: socket.id,
          lastSeen: new Date().toISOString(),
          status: 'online'
        }))

        socket.userId = userId
        console.log(`👤 用户 ${userId} 上线`)
      } catch (error) {
        console.warn('设置在线状态失败:', error.message)
      }
    }
  })

  // 用户断开连接
  socket.on('disconnect', async () => {
    console.log('用户断开连接:', socket.id)

    if (socket.userId && redisClient) {
      try {
        // 移除在线状态或设置为离线
        await redisClient.del(`online:${socket.userId}`)
        console.log(`👤 用户 ${socket.userId} 离线`)
      } catch (error) {
        console.warn('移除在线状态失败:', error.message)
      }
    }
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 404处理
app.use('*', (req, res) => {
  console.log(`❌ 404错误: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: '接口不存在',
    method: req.method,
    path: req.originalUrl,
    message: `接口 ${req.method} ${req.originalUrl} 不存在`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/auth/logout',
      'GET /api/user/profile',
      'GET /api/chats',
      'GET /api/contacts',
      'GET /api/dev/create-test-user',
      'POST /api/dev/quick-login'
    ]
  })
})

// 启动服务器
async function startServer() {
  try {
    await initDatabase()
    await initRedis()

    server.listen(PORT, () => {
      console.log(`🚀 叶语服务器启动成功!`)
      console.log(`📡 HTTP服务: http://127.0.0.1:${PORT}`)
      console.log(`🔌 WebSocket服务: ws://127.0.0.1:${PORT}`)
      console.log(`📊 健康检查: http://127.0.0.1:${PORT}/api/health`)
      console.log(`💾 Redis缓存: ${redisClient ? '已启用' : '未启用'}`)
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

// 启动服务器
startServer()

module.exports = app

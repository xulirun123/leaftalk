// 简单的测试服务器
require('dotenv').config({ path: './server/.env' })

const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const PORT = 8893

// 中间件配置
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Socket.IO配置
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'],
        methods: ['GET', 'POST'],
        credentials: true
    }
})

// 简单的JWT验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
        return res.status(401).json({ error: '未提供访问令牌' })
    }
    
    // 简单验证 - 实际应用中应该验证JWT
    req.user = { userId: '1' } // 模拟用户
    next()
}

// 基础路由
app.get('/', (req, res) => {
    res.json({ message: '测试服务器运行中' })
})

// 提供测试页面
app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/test-call-api.html')
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() })
})

// 通话API路由
const callRouter = express.Router()

callRouter.post('/initiate', (req, res) => {
    const { targetUserId, type } = req.body
    const fromUserId = req.user.userId
    
    console.log(`📞 发起${type}通话:`, { fromUserId, targetUserId, type })
    
    // 生成通话ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    res.json({
        success: true,
        data: {
            callId,
            type,
            targetUserId,
            targetUserInfo: {
                id: targetUserId,
                name: `用户${targetUserId}`,
                avatar: ''
            }
        },
        message: '通话发起成功'
    })
})

callRouter.post('/accept', (req, res) => {
    const { callId } = req.body
    console.log('📞 接听通话:', callId)
    res.json({ success: true, message: '通话已接听' })
})

callRouter.post('/reject', (req, res) => {
    const { callId } = req.body
    console.log('📞 拒绝通话:', callId)
    res.json({ success: true, message: '通话已拒绝' })
})

callRouter.post('/end', (req, res) => {
    const { callId } = req.body
    console.log('📞 结束通话:', callId)
    res.json({ success: true, message: '通话已结束' })
})

// 挂载通话API
app.use('/api/call', authenticateToken, callRouter)

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('🔌 新WebSocket连接:', socket.id)
    
    socket.on('disconnect', () => {
        console.log('❌ WebSocket断开连接:', socket.id)
    })
})

// 启动服务器
server.listen(PORT, () => {
    console.log(`🚀 测试服务器启动成功！`)
    console.log(`📍 地址: http://localhost:${PORT}`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
    console.log(`✅ Call API mounted on /api/call`)
})

module.exports = app

const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'leaftalk-new',
    charset: 'utf8mb4',
    timezone: '+08:00'
}

// 创建数据库连接池
const pool = mysql.createPool(dbConfig)
app.set('db', pool) // 设置数据库连接到app中

console.log('✅ 数据库连接池创建成功并设置到app中')

// 简单的认证中间件（测试用）
const authenticateToken = (req, res, next) => {
    req.user = { userId: 1 } // 模拟用户ID为1
    next()
}

// 测试通话API
app.post('/api/call/initiate', authenticateToken, async (req, res) => {
    try {
        const { targetUserId, type } = req.body
        const fromUserId = req.user.userId

        console.log(`📞 发起${type}通话:`, { fromUserId, targetUserId, type })

        // 参数验证
        if (!targetUserId || !type) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            })
        }

        if (!['voice', 'video'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '无效的通话类型'
            })
        }

        // 检查目标用户是否存在
        const db = req.app.get('db')
        console.log('🔍 数据库连接:', db ? '✅ 存在' : '❌ 不存在')
        
        const [targetUsers] = await db.execute(
            'SELECT id, nickname, avatar FROM users WHERE id = ?',
            [targetUserId]
        )

        if (targetUsers.length === 0) {
            return res.status(404).json({
                success: false,
                error: '目标用户不存在'
            })
        }

        // 生成通话ID
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.log('✅ 通话发起成功:', { callId, fromUserId, targetUserId, type })

        res.json({
            success: true,
            data: {
                callId,
                fromUserId,
                targetUserId,
                type,
                status: 'initiated',
                timestamp: Date.now()
            }
        })

    } catch (error) {
        console.error('❌ 通话发起失败:', error)
        res.status(500).json({
            success: false,
            error: '服务器内部错误: ' + error.message
        })
    }
})

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        message: '通话API测试服务器运行正常'
    })
})

// 测试数据库连接
app.get('/test-db', async (req, res) => {
    try {
        const db = req.app.get('db')
        const [result] = await db.execute('SELECT COUNT(*) as count FROM users')
        res.json({
            success: true,
            userCount: result[0].count,
            message: '数据库连接正常'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

const PORT = 8893
app.listen(PORT, () => {
    console.log(`🚀 通话API测试服务器启动成功，端口: ${PORT}`)
    console.log(`📍 健康检查: http://localhost:${PORT}/health`)
    console.log(`📍 数据库测试: http://localhost:${PORT}/test-db`)
    console.log(`📍 通话API: POST http://localhost:${PORT}/api/call/initiate`)
})

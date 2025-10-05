/**
 * 仿微信通话系统 - API路由
 * 简化的通话API，专注于核心功能
 */

const express = require('express')
const router = express.Router()

/**
 * 发起通话
 * POST /api/call/initiate
 */
router.post('/initiate', async (req, res) => {
  try {
    const { targetUserId, type } = req.body
    const fromUserId = req.user && req.user.userId

    console.log(`📞 发起${type}通话:`, { fromUserId, targetUserId, type })

    // 认证校验
    if (!fromUserId) {
      return res.status(401).json({ success: false, error: '未认证或令牌无效' })
    }

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
    if (!db || typeof db.execute !== 'function') {
      console.error('❌ DB 未初始化或不可用:', db)
      return res.status(500).json({ success: false, error: '数据库未初始化' })
    }
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
    
    // 获取WebRTC信令服务
    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    // 创建通话记录
    const success = webrtcSignaling.handleCallStart(
      { userId: fromUserId }, 
      { callId, targetUserId, type }
    )
    
    if (success === false) {
      return res.status(500).json({
        success: false,
        error: '发起通话失败'
      })
    }

    // 返回成功响应
    res.json({
      success: true,
      data: {
        callId,
        type,
        targetUserId,
        targetUserInfo: {
          id: targetUsers[0].id,
          name: targetUsers[0].nickname || `用户${targetUsers[0].id}`,
          avatar: targetUsers[0].avatar || ''
        }
      },
      message: '通话发起成功'
    })

  } catch (error) {
    console.error('❌ 发起通话失败:', error && (error.stack || error.message || error))
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      detail: error && (error.message || String(error))
    })
  }
})

/**
 * 接听通话
 * POST /api/call/accept
 */
router.post('/accept', async (req, res) => {
  try {
    const { callId } = req.body
    const userId = req.user.userId

    console.log(`📞 接听通话:`, { callId, userId })

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    // 检查通话是否存在且用户有权限接听
    const call = webrtcSignaling.getActiveCall(callId)
    if (!call) {
      return res.status(404).json({
        success: false,
        error: '通话不存在或已结束'
      })
    }

    if (String(call.callee) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: '无权限接听此通话'
      })
    }

    // 更新通话状态
    call.status = 'answered'

    // 通知主叫方已接听
    const room = `user_${call.caller}`
    const roomSize = webrtcSignaling.io?.sockets.adapter.rooms.get(room)?.size || 0
    
    if (roomSize > 0 && webrtcSignaling.io) {
      webrtcSignaling.io.to(room).emit('webrtc:call-status', {
        callId,
        fromUserId: String(userId),
        status: 'answered',
        data: {}
      })
      console.log('📊 已通知主叫方已接听')
    }

    res.json({
      success: true,
      message: '通话已接听'
    })

  } catch (error) {
    console.error('❌ 接听通话失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

/**
 * 拒绝通话
 * POST /api/call/reject
 */
router.post('/reject', async (req, res) => {
  try {
    const { callId, reason = 'rejected' } = req.body
    const userId = req.user.userId

    console.log(`📞 拒绝通话:`, { callId, userId, reason })

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    // 结束通话
    webrtcSignaling.endCall(callId, reason, userId)
    
    res.json({
      success: true,
      message: '通话已拒绝'
    })

  } catch (error) {
    console.error('❌ 拒绝通话失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

/**
 * 结束通话
 * POST /api/call/end
 */
router.post('/end', async (req, res) => {
  try {
    const { callId, reason = 'normal' } = req.body
    const userId = req.user.userId

    console.log(`📞 结束通话:`, { callId, userId, reason })

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    // 结束通话
    webrtcSignaling.endCall(callId, reason, userId)
    
    res.json({
      success: true,
      message: '通话已结束'
    })

  } catch (error) {
    console.error('❌ 结束通话失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

/**
 * 获取通话状态
 * GET /api/call/status/:callId
 */
router.get('/status/:callId', async (req, res) => {
  try {
    const { callId } = req.params
    const userId = req.user.userId

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    const call = webrtcSignaling.getActiveCall(callId)
    if (!call) {
      return res.status(404).json({
        success: false,
        error: '通话不存在'
      })
    }

    // 检查用户是否参与此通话
    if (String(call.caller) !== String(userId) && String(call.callee) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此通话'
      })
    }

    res.json({
      success: true,
      data: {
        callId: call.callId || callId,
        status: call.status,
        type: call.type,
        caller: call.caller,
        callee: call.callee,
        startTime: call.startTime,
        connectedTime: call.connectedTime || null
      }
    })

  } catch (error) {
    console.error('❌ 获取通话状态失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

/**
 * 获取用户的活跃通话
 * GET /api/call/active
 */
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.userId

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (!webrtcSignaling) {
      return res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

    const activeCalls = webrtcSignaling.getUserActiveCalls(userId)
    
    res.json({
      success: true,
      data: activeCalls
    })

  } catch (error) {
    console.error('❌ 获取活跃通话失败:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
})

module.exports = router

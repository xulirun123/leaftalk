/**
 * WebRTC 通话 API 路由
 */
const express = require('express')
const router = express.Router()

// 发起通话
router.post('/initiate', async (req, res) => {
  try {
    const { toUserId, type } = req.body
    const fromUserId = req.user.userId

    if (!toUserId || !type) {
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

    // 生成通话ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`📞 发起 ${type} 通话:`, {
      callId,
      fromUserId,
      toUserId
    })

    // 通过WebRTC信令服务处理
    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      // 记录通话并通知目标用户
      const success = webrtcSignaling.handleCallStart(
        { userId: fromUserId }, 
        { callId, targetUserId: toUserId, type }
      )
      
      if (success !== false) {
        res.json({
          success: true,
          data: {
            callId,
            type,
            targetUserId: toUserId
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: '发起通话失败'
        })
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 发起通话失败:', error)
    res.status(500).json({
      success: false,
      error: '发起通话失败'
    })
  }
})

// 接听通话
router.post('/answer', async (req, res) => {
  try {
    const { callId } = req.body
    const userId = req.user.userId

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    console.log(`📞 接听通话:`, { callId, userId })

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      const call = webrtcSignaling.getActiveCall(callId)
      console.log('🔎 检查通话与被叫匹配:', { callId, call, userId })
      if (call && String(call.callee) === String(userId)) {
        // 更新通话状态
        call.status = 'answered'

        // 通知主叫方：对方已接听
        try {
          const fromUserId = String(userId)
          const targetUserId = String(call.caller)
          const targetSocketId = webrtcSignaling.userSockets?.get(targetUserId)
          if (targetSocketId && webrtcSignaling.io) {
            webrtcSignaling.io.to(targetSocketId).emit('webrtc:call-status', {
              callId,
              fromUserId,
              status: 'answered',
              data: {}
            })
            console.log('📊 已通知主叫方已接听', { callId, targetUserId, targetSocketId })
          } else {
            console.warn('⚠️ 无法通知主叫方（未在线或无socket）', { callId, targetUserId })
          }
        } catch (e) {
          console.warn('⚠️ 通知主叫方已接听失败:', e)
        }

        res.json({
          success: true,
          message: '通话已接听'
        })
      } else {
        res.status(404).json({
          success: false,
          error: '通话不存在或无权限'
        })
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 接听通话失败:', error)
    res.status(500).json({
      success: false,
      error: '接听通话失败'
    })
  }
})

// 拒绝通话
router.post('/reject', async (req, res) => {
  try {
    const { callId } = req.body
    const userId = req.user.userId

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    console.log(`📞 拒绝通话:`, { callId, userId })

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      webrtcSignaling.endCall(callId, 'rejected', userId)
      
      res.json({
        success: true,
        message: '通话已拒绝'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 拒绝通话失败:', error)
    res.status(500).json({
      success: false,
      error: '拒绝通话失败'
    })
  }
})

// 结束通话
router.post('/end', async (req, res) => {
  try {
    const { callId } = req.body
    const userId = req.user.userId

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: '缺少通话ID'
      })
    }

    console.log(`📞 结束通话:`, { callId, userId })

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      webrtcSignaling.endCall(callId, 'hangup', userId)
      
      res.json({
        success: true,
        message: '通话已结束'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 结束通话失败:', error)
    res.status(500).json({
      success: false,
      error: '结束通话失败'
    })
  }
})

// 获取通话状态
router.get('/status/:callId', async (req, res) => {
  try {
    const { callId } = req.params
    const userId = req.user.userId

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      const call = webrtcSignaling.getActiveCall(callId)
      
      if (call && (call.caller === userId || call.callee === userId)) {
        res.json({
          success: true,
          data: {
            callId,
            status: call.status,
            type: call.type,
            duration: Date.now() - call.startTime
          }
        })
      } else {
        res.status(404).json({
          success: false,
          error: '通话不存在或无权限'
        })
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 获取通话状态失败:', error)
    res.status(500).json({
      success: false,
      error: '获取通话状态失败'
    })
  }
})

// 获取用户的活跃通话
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.userId

    const webrtcSignaling = req.app.get('webrtcSignaling')
    if (webrtcSignaling) {
      const activeCalls = webrtcSignaling.getUserActiveCalls(userId)
      
      res.json({
        success: true,
        data: activeCalls
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'WebRTC服务未启动'
      })
    }

  } catch (error) {
    console.error('❌ 获取活跃通话失败:', error)
    res.status(500).json({
      success: false,
      error: '获取活跃通话失败'
    })
  }
})

module.exports = router

/**
 * WebRTC 信令服务
 * 处理 offer/answer/ice-candidate 交换
 */

class WebRTCSignalingService {
  constructor(io) {
    this.io = io
    this.activeCalls = new Map() // callId -> { caller, callee, status, startTime }
    this.userSockets = new Map() // userId -> socketId
    // 去重缓存：按通话记录最近一次的 offer/answer sdp
    this.lastOfferSdpByCall = new Map()
    this.lastAnswerSdpByCall = new Map()

    console.log('🎯 WebRTC信令服务已初始化')
  }

  /**
   * 初始化信令事件监听
   */
  initializeSignaling(socket) {
    const userId = socket.userId

    // 用户连接时记录socket映射
    if (userId) {
      this.userSockets.set(String(userId), socket.id)
      console.log(`📡 用户 ${userId} 信令连接已建立`)
    }

    // 断开连接时清理
    socket.on('disconnect', () => {
      if (userId) {
        this.userSockets.delete(String(userId))
        this.handleUserDisconnect(userId)
        console.log(`📡 用户 ${userId} 信令连接已断开`)
      }
    })

    // WebRTC 信令事件
    socket.on('webrtc:offer', (data) => this.handleOffer(socket, data))
    socket.on('webrtc:answer', (data) => this.handleAnswer(socket, data))
    socket.on('webrtc:ice-candidate', (data) => this.handleIceCandidate(socket, data))
    socket.on('webrtc:call-start', (data) => this.handleCallStart(socket, data))
    socket.on('webrtc:call-end', (data) => this.handleCallEnd(socket, data))
    socket.on('webrtc:call-status', (data) => this.handleCallStatus(socket, data))
  }

  /**
   * 处理 WebRTC Offer
   */
  handleOffer(socket, { callId, targetUserId, offer, type }) {
    try {
      const fromUserId = socket.userId
      console.log(`📞 收到 ${type} 通话 Offer:`, { callId, fromUserId, targetUserId })

      // 验证通话是否存在
      if (!this.activeCalls.has(callId)) {
        console.warn(`⚠️ 通话 ${callId} 不存在`)
        return
      }

      // Offer 去重（避免重复触发）
      const offerSdp = (offer && offer.sdp) ? String(offer.sdp) : ''
      const prevOfferSdp = this.lastOfferSdpByCall.get(callId)
      if (prevOfferSdp && prevOfferSdp === offerSdp) {
        console.log(`ℹ️ 检测到重复 Offer，已忽略: callId=${callId}`)
        return
      }
      this.lastOfferSdpByCall.set(callId, offerSdp)

      // 转发 Offer 给目标用户（按房间广播，避免多socket映射丢失）
      const room = `user_${targetUserId}`
      const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0
      if (roomSize > 0) {
        this.io.to(room).emit('webrtc:offer', {
          callId,
          fromUserId,
          offer,
          type
        })
        console.log(`✅ Offer 已广播到房间 ${room}（在线连接数: ${roomSize}）`)
      } else {
        console.warn(`⚠️ 房间 ${room} 无在线连接，无法转发 Offer`)
        // 通知发起方对方不在线
        socket.emit('webrtc:error', {
          callId,
          error: 'TARGET_OFFLINE',
          message: '对方不在线'
        })
      }
    } catch (error) {
      console.error('❌ 处理 Offer 失败:', error)
      socket.emit('webrtc:error', { callId: callId, error: 'OFFER_FAILED' })
    }
  }

  /**
   * 处理 WebRTC Answer
   */
  handleAnswer(socket, { callId, targetUserId, answer }) {
    try {
      const fromUserId = socket.userId
      console.log(`📞 收到通话 Answer:`, { callId, fromUserId, targetUserId })

      // Answer 去重（避免重复触发）
      const answerSdp = (answer && answer.sdp) ? String(answer.sdp) : ''
      const prevAnswerSdp = this.lastAnswerSdpByCall.get(callId)
      if (prevAnswerSdp && prevAnswerSdp === answerSdp) {
        console.log(`ℹ️ 检测到重复 Answer，已忽略: callId=${callId}`)
        return
      }
      this.lastAnswerSdpByCall.set(callId, answerSdp)

      // 转发 Answer 给目标用户（按房间广播，避免多 socket 映射丢失）
      const room = `user_${targetUserId}`
      const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0
      if (roomSize > 0) {
        this.io.to(room).emit('webrtc:answer', {
          callId,
          fromUserId,
          answer
        })

        // 更新通话状态为已连接
        if (this.activeCalls.has(callId)) {
          const call = this.activeCalls.get(callId)
          call.status = 'connected'
          call.connectedTime = Date.now()
          console.log(`✅ 通话 ${callId} 已连接`)
        }
      } else {
        console.warn(`⚠️ 房间 ${room} 无在线连接，无法转发 Answer`)
      }
    } catch (error) {
      console.error('❌ 处理 Answer 失败:', error)
      socket.emit('webrtc:error', { callId, error: 'ANSWER_FAILED' })
    }
  }

  /**
   * 处理 ICE Candidate
   */
  handleIceCandidate(socket, { callId, targetUserId, candidate }) {
    try {
      const fromUserId = socket.userId
      
      // 转发 ICE Candidate 给目标用户（按房间广播）
      const room = `user_${targetUserId}`
      const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0
      if (roomSize > 0) {
        this.io.to(room).emit('webrtc:ice-candidate', {
          callId,
          fromUserId,
          candidate
        })
      }
    } catch (error) {
      console.error('❌ 处理 ICE Candidate 失败:', error)
    }
  }

  /**
   * 处理通话开始
   */
  handleCallStart(socket, { callId, targetUserId, type }) {
    try {
      // 支持从socket或API调用获取用户ID
      // socket可能是真实的socket对象，也可能是API调用传递的 { userId: xxx }
      const fromUserId = socket.userId
      console.log(`📞 开始 ${type} 通话:`, { callId, fromUserId, targetUserId, socketType: typeof socket })

      // 如果没有fromUserId，说明调用方式有问题
      if (!fromUserId) {
        console.error('❌ 无法获取发起者用户ID:', socket)
        return false
      }

      // 记录活跃通话
      this.activeCalls.set(callId, {
        caller: fromUserId,
        callee: targetUserId,
        type,
        status: 'calling',
        startTime: Date.now()
      })

      // 通知目标用户有来电（按房间广播，更稳）
      const room = `user_${targetUserId}`
      const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0
      console.log(`🔍 用户 ${targetUserId} 的房间 ${room} 当前连接数:`, roomSize)

      if (roomSize > 0) {
        console.log(`📤 发送来电通知到房间 ${room}`)
        this.io.to(room).emit('webrtc:incoming-call', {
          callId,
          fromUserId,
          type,
          caller: {
            id: fromUserId,
            // 这里可以添加更多用户信息
          }
        })
        console.log(`✅ 来电通知已发送`)
      } else {
        console.warn(`⚠️ 房间 ${room} 无在线连接，无法发送来电通知`)
      }

      // 设置通话超时（60秒）
      setTimeout(() => {
        if (this.activeCalls.has(callId)) {
          const call = this.activeCalls.get(callId)
          if (call.status === 'calling') {
            this.endCall(callId, 'timeout')
          }
        }
      }, 60000)

    } catch (error) {
      console.error('❌ 处理通话开始失败:', error)
      socket.emit('webrtc:error', { callId, error: 'CALL_START_FAILED' })
    }
  }

  /**
   * 处理通话结束
   */
  handleCallEnd(socket, { callId, reason = 'hangup' }) {
    try {
      const fromUserId = socket.userId
      console.log(`📞 结束通话:`, { callId, fromUserId, reason })
      
      this.endCall(callId, reason, fromUserId)
    } catch (error) {
      console.error('❌ 处理通话结束失败:', error)
    }
  }

  /**
   * 处理通话状态更新
   */
  handleCallStatus(socket, { callId, status, data }) {
    try {
      const fromUserId = socket.userId
      
      if (this.activeCalls.has(callId)) {
        const call = this.activeCalls.get(callId)
        const targetUserId = call.caller === fromUserId ? call.callee : call.caller
        const room = `user_${targetUserId}`
        const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0

        if (roomSize > 0) {
          this.io.to(room).emit('webrtc:call-status', {
            callId,
            fromUserId,
            status,
            data
          })
        }
      }
    } catch (error) {
      console.error('❌ 处理通话状态更新失败:', error)
    }
  }

  /**
   * 结束通话（内部方法）
   */
  endCall(callId, reason, endByUserId = 'system') {
    if (!this.activeCalls.has(callId)) {
      return
    }

    const call = this.activeCalls.get(callId)
    const { caller, callee } = call

    // 通知双方通话结束
    const callerSocketId = this.userSockets.get(String(caller))
    const calleeSocketId = this.userSockets.get(String(callee))

    const endData = {
      callId,
      reason,
      endBy: endByUserId,
      duration: Date.now() - call.startTime
    }

    // 向双方用户房间广播通话结束
    const callerRoom = `user_${caller}`
    const calleeRoom = `user_${callee}`
    this.io.to(callerRoom).emit('webrtc:call-ended', endData)
    this.io.to(calleeRoom).emit('webrtc:call-ended', endData)

    // 清理通话记录
    this.activeCalls.delete(callId)
    console.log(`✅ 通话 ${callId} 已结束，原因: ${reason}`)
  }

  /**
   * 处理用户断开连接
   */
  handleUserDisconnect(userId) {
    // 查找用户参与的活跃通话并结束
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.caller === userId || call.callee === userId) {
        this.endCall(callId, 'disconnect', userId)
      }
    }
  }

  /**
   * 获取活跃通话信息
   */
  getActiveCall(callId) {
    return this.activeCalls.get(callId)
  }

  /**
   * 获取用户的活跃通话
   */
  getUserActiveCalls(userId) {
    const userCalls = []
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.caller === userId || call.callee === userId) {
        userCalls.push({ callId, ...call })
      }
    }
    return userCalls
  }
}

module.exports = WebRTCSignalingService

import { signalingService } from './signalingService'
import { peerConnectionService } from './peerConnectionService'

export type CallType = 'voice' | 'video'

export interface CallFlowOptions {
  callId: string
  targetUserId: string
  type: CallType
  isInitiator: boolean
}

export interface CallFlowHooks {
  // 必传：收到 Offer 时如何处理（通常：初始化 PC、设置远端、创建并发送 Answer）
  handleOffer: (offer: RTCSessionDescriptionInit) => Promise<void>

  // 连接建立（connectionState=connected 或 远端流到达时触发）
  onConnected?: () => void
  // 远端媒体流回调
  onRemoteStream?: (stream: MediaStream) => void
  // 错误与结束
  onError?: (data: any) => void
  onCallEnded?: (data: any) => void

  // UI 状态辅助（可选）
  setConnecting?: (v: boolean) => void
  setStatus?: (status: 'calling' | 'connecting' | 'connected' | 'ended') => void
}

/**
 * 统一的通话流程监听与操作：
 * - answered → 主叫创建并发送 Offer，10 秒兜底重发一次
 * - answer → 设置远端 Answer
 * - ice-candidate → 添加远端 ICE
 * - 本地 ICE → 通过信令转发
 * - connectionState=connected 或收到远端流 → 认为已连接
 * - error / call-ended 透传到页面
 *
 * 返回：清理函数（移除所有监听、清理定时器）
 */
export function setupCallFlow(opts: CallFlowOptions, hooks: CallFlowHooks): () => void {
  const { callId, targetUserId, type, isInitiator } = opts
  const {
    handleOffer,
    onConnected,
    onRemoteStream,
    onError,
    onCallEnded,
    setConnecting,
    setStatus,
  } = hooks

  let offerResendTimer: number | null = null
  let lastOffer: RTCSessionDescriptionInit | null = null

  // 信令：Offer
  const offerHandler = async (data: any) => {
    if (data.callId !== callId) return
    await handleOffer(data.offer)
  }
  signalingService.on('offer', offerHandler)

  // 信令：Answer（直接设置远端 Answer）
  const answerHandler = async (data: any) => {
    if (data.callId !== callId) return
    try {
      console.log('📞 [callFlow] 收到 Answer, callId=', data.callId)
      await peerConnectionService.setRemoteAnswer(data.answer)
      console.log('✅ [callFlow] 已设置远端 Answer')
    } catch (e) {
      console.error('❌ 设置远端 Answer 失败:', e)
    }
  }
  signalingService.on('answer', answerHandler)

  // 信令：远端 ICE
  const iceHandler = async (data: any) => {
    if (data.callId !== callId) return
    try {
      await peerConnectionService.addIceCandidate(data.candidate)
    } catch (e) {
      console.error('❌ 添加远端 ICE 失败:', e)
    }
  }
  signalingService.on('ice-candidate', iceHandler)

  // 信令：状态（被叫 answered → 主叫发送 Offer，并在 10s 未收到 Answer 时重发一次）
  const callStatusHandler = async (data: any) => {
    if (data.callId !== callId) return
    if (data.status === 'answered' && isInitiator) {
      try {
        setStatus?.('connecting')
        setConnecting?.(true)
        const offer = await peerConnectionService.createOffer()
        lastOffer = offer
        signalingService.sendOffer(callId, targetUserId, offer, type)

        if (offerResendTimer) clearTimeout(offerResendTimer)
        offerResendTimer = window.setTimeout(() => {
          const pc = peerConnectionService.getPeerConnection()
          if (pc && pc.signalingState === 'have-local-offer' && lastOffer) {
            console.warn('⌛ 未收到 Answer，重发 Offer:', { callId, type })
            signalingService.sendOffer(callId, targetUserId, lastOffer, type)
          }
        }, 10000)
      } catch (e) {
        console.error('❌ 发送 Offer 失败:', e)
      }
    }
  }
  signalingService.on('call-status', callStatusHandler)

  // 信令：错误与结束
  const errorHandler = (data: any) => {
    try { onError?.(data) } catch {}
  }
  signalingService.on('error', errorHandler)

  const endedHandler = (data: any) => {
    try { onCallEnded?.(data) } catch {}
  }
  signalingService.on('call-ended', endedHandler)

  // 本地 ICE → 信令转发
  const onLocalIce = (data: any) => {
    try {
      signalingService.sendIceCandidate(callId, targetUserId, data.candidate)
    } catch (e) {
      console.error('❌ 发送本地 ICE 失败:', e)
    }
  }
  peerConnectionService.on('iceCandidate', onLocalIce)

  // 连接状态变化
  const onConnChange = (data: any) => {
    if (data.state === 'connected') {
      try { setStatus?.('connected') } catch {}
      try { setConnecting?.(false) } catch {}
      try { onConnected?.() } catch {}
    }
  }
  peerConnectionService.on('connectionStateChange', onConnChange)

  // 远端流
  const onRemote = (data: any) => {
    try { onRemoteStream?.(data.stream) } catch {}
    // 兜底：收到远端流则视为已连接
    try {
      setStatus?.('connected')
      setConnecting?.(false)
      onConnected?.()
    } catch {}
  }
  peerConnectionService.on('remoteStream', onRemote)

  // 清理函数
  return () => {
    signalingService.off('offer', offerHandler)
    signalingService.off('answer', answerHandler)
    signalingService.off('ice-candidate', iceHandler)
    signalingService.off('call-status', callStatusHandler)
    signalingService.off('error', errorHandler)
    signalingService.off('call-ended', endedHandler)
    try { peerConnectionService.off('iceCandidate', onLocalIce) } catch {}
    try { peerConnectionService.off('connectionStateChange', onConnChange) } catch {}
    try { peerConnectionService.off('remoteStream', onRemote) } catch {}
    if (offerResendTimer) {
      clearTimeout(offerResendTimer)
      offerResendTimer = null
    }
  }
}


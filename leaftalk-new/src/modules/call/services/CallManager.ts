/**
 * 仿微信通话系统 - 核心通话管理器
 * 统一管理所有通话相关功能，简化架构
 */

import { ref, reactive } from 'vue'
import type {
  CallType,
  CallStatus,
  CallConfig,
  CallEvents,
  MediaState,
  IncomingCallData,
  CallEndReason,
  NetworkQuality
} from '../types'
import { MediaManager } from './MediaManager'
import { SignalManager } from './SignalManager'
import { CallStateManager } from './CallStateManager'
import { apiClient } from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../stores/auth'

export class CallManager {
  private static instance: CallManager
  private mediaManager: MediaManager
  private signalManager: SignalManager
  private stateManager: CallStateManager
  private eventListeners: Map<keyof CallEvents, Function[]> = new Map()
  // 计时与铃声
  private outgoingTimeoutTimer: any = null
  private incomingTimeoutTimer: any = null

  // 去重与抖动控制（防止重复来电与拒绝后立即再次弹起）
  private seenIncomingCallIds: Set<string> = new Set()
  private callIdToFromUser: Map<string, string> = new Map()
  private suppressUserMap: Map<string, any> = new Map()
  private suppressMs = 3000
  private suppressUser(userId: string, ms: number = this.suppressMs) {
    const key = String(userId || '')
    if (!key) return
    if (this.suppressUserMap.has(key)) {
      try { clearTimeout(this.suppressUserMap.get(key)) } catch {}
    }
    const timer = setTimeout(() => {
      this.suppressUserMap.delete(key)
    }, ms)
    this.suppressUserMap.set(key, timer)
  }

  // UI：全局迷你浮窗状态（供外层组件使用）
  public isMini = ref(false)

  // UI：邀请联系人覆盖层是否激活（用于在不切换浮窗的情况下覆盖通话页）
  public isInviteOverlayActive = ref(false)

  // 响应式状态
  public currentCall = ref<CallConfig | null>(null)
  public callStatus = ref<CallStatus>('idle')
  // 接通时间戳（用于恢复页面时计算已通话时长）
  public connectedAt = ref<number | null>(null)
  public mediaState = reactive<MediaState>({
    audio: { enabled: true, muted: false, volume: 1 },
    video: { enabled: true, muted: false, facingMode: 'user' }
  })
  public networkQuality = ref<NetworkQuality>({
    level: 'excellent',
    rtt: 0,
    packetLoss: 0,
    bandwidth: 0
  })

  /**
   * 参与者列表（仅骨架，后续由信令/后端驱动更新）
   * 建议包含所有当前在房间内的用户ID（含自己）
   */
  public participants = ref<string[]>([])

  /** 更新参与者（去重） */
  public updateParticipants(ids: string[]) {
    const set = new Set(ids.map(String))
    this.participants.value = Array.from(set)
    this.emit('room:participants' as any, this.participants.value)
  }

  /** 增加参与者 */
  public addParticipant(id: string) {
    const s = new Set(this.participants.value)
    s.add(String(id))
    this.participants.value = Array.from(s)
    this.emit('participant:joined' as any, String(id))
  }

  /** 移除参与者 */
  public removeParticipant(id: string) {
    this.participants.value = this.participants.value.filter(x => String(x) !== String(id))
    this.emit('participant:left' as any, String(id))
  }


  private constructor() {
    this.mediaManager = new MediaManager()
    this.signalManager = new SignalManager()
    this.stateManager = new CallStateManager()

    this.setupEventHandlers()
  }

  public static getInstance(): CallManager {
    if (!CallManager.instance) {
      CallManager.instance = new CallManager()
    }
    return CallManager.instance
  }

  /**
   * 初始化通话管理器
   */
  public async initialize(): Promise<void> {
    try {
      console.log('📞 初始化通话管理器...')

      await this.mediaManager.initialize()
      await this.signalManager.initialize()

      // 设置当前用户ID供信令加入房间
      const auth = useAuthStore()
      let uid: string | null = auth.user?.id || null
      if (!uid) {
        try {
          const raw = localStorage.getItem('yeyu_user_info')
          if (raw) uid = JSON.parse(raw).id || null
        } catch {}
      }
      if (uid) this.signalManager.setCurrentUserId(String(uid))

      this.stateManager.initialize()

      console.log('✅ 通话管理器初始化完成')
    } catch (error) {
      console.error('❌ 通话管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 发起通话
   */
  public async makeCall(targetUserId: string, type: CallType, targetUserInfo: any): Promise<string> {
    try {
      console.log(`📞 发起${type === 'video' ? '视频' : '语音'}通话:`, targetUserId)

      // 检查当前状态
      if (this.callStatus.value !== 'idle') {
        throw new Error('当前正在通话中')
      }

      // 调用后端API发起通话
      const response = await apiClient.post<{ callId: string }>('/call/initiate', {
        targetUserId,
        type
      })

      if (!response.data?.callId) {
        throw new Error('发起通话失败')
      }

      const callId = response.data.callId

      // 设置通话配置
      const callConfig: CallConfig = {
        callId,
        type,
        isInitiator: true,
        targetUserId,
        targetUserInfo
      }

      this.currentCall.value = callConfig
      this.callStatus.value = 'calling'

      // 初始化媒体流（若已有本地流则复用，避免重复获取导致预览中断）
      if (!this.mediaManager.getLocalStream()) {
        await this.mediaManager.initializeLocalStream(type)
      }

      // 建立WebRTC连接
      await this.signalManager.createPeerConnection(callConfig)

      // 发送通话信令
      await this.signalManager.sendCallSignal(callId, targetUserId, type)

      // 开始主叫方响铃（播放被叫设置的铃声，若有），并启动60秒超时
      const ringUrl = (targetUserInfo && (targetUserInfo as any).ringtoneUrl) || findCachedRingtoneUrl(targetUserId)
      this.mediaManager.playRingtone(ringUrl || '')
      this.startOutgoingTimeout()

      this.emit('call:initiated', { callId, type, targetUserId })

      return callId
    } catch (error) {
      console.error('❌ 发起通话失败:', error)
      this.callStatus.value = 'idle'
      this.currentCall.value = null
      throw error
    }
  }

  /**
   * 预先准备本地预览（不改变当前呼叫状态）
   */
  public async prepareLocalPreview(type: CallType): Promise<void> {
    try {
      if (!this.mediaManager.getLocalStream()) {
        await this.mediaManager.initializeLocalStream(type)
      }
    } catch (e) {
      console.warn('准备本地预览失败，将继续尝试发起通话:', (e as any)?.message)
    }
  }

  /**
   * 接听通话
   */
  public async acceptCall(callData: IncomingCallData): Promise<void> {
    try {
      console.log('📞 接听通话:', callData.callId)

      // 设置通话配置
      const callConfig: CallConfig = {
        callId: callData.callId,
        type: callData.type,
        isInitiator: false,
        targetUserId: callData.fromUserId,
        targetUserInfo: callData.fromUserInfo
      }

      this.currentCall.value = callConfig
      this.callStatus.value = 'connecting'

      // 初始化媒体流（视频失败时不阻塞接听，降级为仅音频或无本地流也继续）
      try {
        await this.mediaManager.initializeLocalStream(callData.type)
      } catch (e: any) {
        console.warn('⚠️ 初始化本地媒体失败，尝试仅音频继续接听:', e?.name || e)
        try {
          // 尝试仅音频；若也失败，继续走下去，仅接收远端流
          await this.mediaManager.initializeLocalStream('audio' as any)
        } catch (e2) {
          console.warn('⚠️ 获取仅音频也失败，将以无本地流方式继续（可后续再尝试）:', e2)
        }
      }

      // 建立WebRTC连接（即使没有本地流也要建立，以便接收远端流并完成连接）
      await this.signalManager.createPeerConnection(callConfig)


      // 调用后端API接听通话（带404容错重试）
      try {
        await apiClient.post('/call/accept', { callId: callData.callId })
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) {
          console.warn('⚠️ /call/accept 返回404，尝试从 /call/active 同步通话ID后重试')
          try {
            const activeRes = await apiClient.get('/call/active')
            const active = (activeRes as any)?.data?.data || []
            // 根据主叫ID/类型匹配当前来电
            const found = active.find((c: any) => String(c?.caller) === String(callData.fromUserId) && c?.type === callData.type && c?.status === 'calling')
            if (found?.callId) {
              // 使用新的callId重试
              callConfig.callId = found.callId
              this.currentCall.value = { ...callConfig }
              await apiClient.post('/call/accept', { callId: found.callId })
            } else {
              throw err
            }
          } catch (e) {
            throw err
          }
        } else {
          throw err
        }
      }

      // 停止来电铃声与超时计时
      this.mediaManager.stopRingtone()
      this.clearIncomingTimeout()

      this.emit('call:accepted', { callId: this.currentCall.value!.callId, timestamp: Date.now() })
    } catch (error) {
      console.error('❌ 接听通话失败:', error)
      await this.endCall('network_error')
      throw error
    }
  }

  /**
   * 拒绝通话
   */
  public async rejectCall(callId: string, reason: string = 'rejected'): Promise<void> {
    try {
      console.log('📞 拒绝通话:', callId)

      await apiClient.post('/call/reject', {
        callId,
        reason
      })

      // 停止铃声与清理计时器
      this.mediaManager.stopRingtone()
      this.clearIncomingTimeout()
      this.clearOutgoingTimeout()

      this.emit('call:rejected', { callId, reason, timestamp: Date.now() })
      this.resetCallState()
    } catch (error) {
      console.error('❌ 拒绝通话失败:', error)
      throw error
    }
  }

  /**
   * 结束通话
   */
  public async endCall(reason: CallEndReason = 'normal'): Promise<void> {
    try {
      console.log('📞 结束通话:', reason)

      const callId = this.currentCall.value?.callId
      if (!callId) return

      this.callStatus.value = 'ending'

      // 调用后端API结束通话
      await apiClient.post('/call/end', {
        callId,
        reason
      })

      // 停止铃声与计时器
      this.mediaManager.stopRingtone()
      this.clearIncomingTimeout()
      this.clearOutgoingTimeout()

      // 清理资源
      await this.cleanup()

      this.emit('call:ended', {
        callId,
        reason,
        duration: this.stateManager.getCallDuration(),
        timestamp: Date.now()
      })

      this.resetCallState()
    } catch (error) {
      console.error('❌ 结束通话失败:', error)
      // 即使API调用失败也要清理本地资源
      await this.cleanup()
      this.resetCallState()
    }
  }

  /**
   * 仅自己退出当前通话房间（多人通话适用）
   * - 调用后端 /call/leave
   * - 本地清理资源并重置UI
   * - 不广播全局结束（其他人继续）
   */
  public async leaveCallForMe(): Promise<void> {
    try {
      const callId = this.currentCall.value?.callId
      if (!callId) return

      console.log('👋 仅自己退出通话房间:', callId)

      // 调用后端API离开房间（若后端未实现也不阻塞）
      try {
        await apiClient.post('/call/leave', { callId })
      } catch (e) {
        console.warn('后端 /call/leave 暂不可用，采用前端兜底离开:', e)
      }

      // 停止铃声与计时器
      this.mediaManager.stopRingtone()
      this.clearIncomingTimeout()
      this.clearOutgoingTimeout()

      // 清理本地资源
      await this.cleanup()

      // 仅本地发出“自己已离开”的事件，便于页面收起
      this.emit('call:self-left' as any, { callId, timestamp: Date.now() })

      // 重置本地状态
      this.resetCallState()
    } catch (error) {
      console.error('❌ 自己退出通话失败:', error)
      await this.cleanup()
      this.resetCallState()
    }
  }

  /**
   * 切换音频静音
   */
  public toggleAudioMute(): boolean {
    const muted = this.mediaManager.toggleAudioMute()
    this.mediaState.audio.muted = muted
    return muted
  }

  /**
   * 切换视频静音
   */
  public toggleVideoMute(): boolean {
    const muted = this.mediaManager.toggleVideoMute()
    this.mediaState.video.muted = muted
    return muted
  }

  /**
   * 切换摄像头
   */
  public async switchCamera(): Promise<void> {
    await this.mediaManager.switchCamera()
    this.mediaState.video.facingMode =
      this.mediaState.video.facingMode === 'user' ? 'environment' : 'user'
  }

  /**
   * 获取本地媒体流
   */
  public getLocalStream(): MediaStream | null {
    return this.mediaManager.getLocalStream()
  }

  /**
   * 获取远程媒体流
   */
  public getRemoteStream(): MediaStream | null {
    return this.signalManager.getRemoteStream()
  }

  /**
   * 事件监听
   */
  public on<K extends keyof CallEvents>(event: K, handler: CallEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  /**
   * 移除事件监听
   */
  public off<K extends keyof CallEvents>(event: K, handler: CallEvents[K]): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof CallEvents>(event: K, ...args: Parameters<CallEvents[K]>): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args)
        } catch (error) {
          console.error(`事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 信令事件
    this.signalManager.on('incoming-call', (data) => {
      // 标记来电状态为 ringing，便于后续超时保护判断
      this.callStatus.value = 'ringing'
      // 来电时开始播放来电铃声（使用主叫设置的铃声，如无则默认）
      const ringUrl = (data.fromUserInfo as any)?.ringtoneUrl || findCachedRingtoneUrl(data.fromUserId)
      this.mediaManager.playRingtone(ringUrl || '')
      // 启动被叫60s超时（未接未拒自动超时）
      this.startIncomingTimeout(data.callId)
      this.emit('call:incoming', data)
    })

    this.signalManager.on('call-accepted', () => {
      console.log('📞 对方已接听，进入连接中状态')
      // 仅在尚未connected时才进入connecting，避免connected -> connecting 回退
      if (this.callStatus.value !== 'connected') {
        this.callStatus.value = 'connecting'
      }
      // 对端已接听：主叫侧应立即停止铃声并清除所有超时计时器
      this.mediaManager.stopRingtone()
      this.clearOutgoingTimeout()
      this.clearIncomingTimeout()
    })

    this.signalManager.on('call-connected', () => {
      this.callStatus.value = 'connected'
      this.connectedAt.value = Date.now()
      // 接通后停止铃声与超时
      this.mediaManager.stopRingtone()
      this.clearOutgoingTimeout()
      this.clearIncomingTimeout()
      this.emit('call:connected', {
        callId: this.currentCall.value!.callId,
        timestamp: this.connectedAt.value!
      })
    })

    this.signalManager.on('call-ended', async (data) => {
      // 对端结束，停止铃声与超时
      this.mediaManager.stopRingtone()
      this.clearIncomingTimeout()
      this.clearOutgoingTimeout()
      this.emit('call:ended', data)
      await this.cleanup()
      this.resetCallState()
    })

    // 媒体事件
    this.mediaManager.on('local-stream', async (stream) => {
      this.emit('media:stream', stream, 'local')
      // 确保本地流加入到PeerConnection
      try {
        const v = stream.getVideoTracks()[0]
        if (v && this.currentCall.value?.type === 'video') {
          await this.signalManager.replaceLocalVideoTrack(v, stream)
        } else {
          await this.signalManager.addLocalStream(stream)
        }
      } catch (e) {
        console.warn('本地流加入/替换到 PeerConnection 失败，稍后重试:', e)
      }
    })

    this.signalManager.on('remote-stream', (stream) => {
      this.emit('media:stream', stream, 'remote')
    })

    // 网络质量事件
    this.signalManager.on('network-quality', (quality) => {
      this.networkQuality.value = quality
      this.emit('network:quality', quality)
    })
  }

  // UI: 设置/查询迷你浮窗状态
  public setMini(val: boolean) {
    this.isMini.value = val
    this.emit('ui:mini-changed', { mini: val })
  }

  // UI: 设置/查询邀请联系人覆盖层状态
  public setInviteOverlayActive(val: boolean) {
    this.isInviteOverlayActive.value = val
    this.emit('ui:invite-overlay-changed', { active: val })
  }

  /**
   * 重置通话状态
   */
  private resetCallState(): void {
    this.currentCall.value = null
    this.callStatus.value = 'idle'
    this.mediaState.audio.muted = false
    this.mediaState.video.muted = false
    this.connectedAt.value = null
    this.isMini.value = false
    this.isInviteOverlayActive.value = false
    this.participants.value = []
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    await this.mediaManager.cleanup()
    await this.signalManager.cleanup()
    this.stateManager.cleanup()
  }

  /**
   * 销毁管理器
   */
  public async destroy(): Promise<void> {
    await this.cleanup()
    this.eventListeners.clear()
    CallManager.instance = null as any
  }

  // 启动主叫超时（60s）
  private startOutgoingTimeout() {
    this.clearOutgoingTimeout()
    this.outgoingTimeoutTimer = setTimeout(() => {
      // 仍处于呼叫/响铃阶段则超时
      if (this.callStatus.value === 'calling' || this.callStatus.value === 'ringing') {
        console.warn('⏱️ 主叫通话超时，自动结束')
        this.endCall('timeout')
      }
    }, 60000)
  }
  private clearOutgoingTimeout() {
    if (this.outgoingTimeoutTimer) {
      clearTimeout(this.outgoingTimeoutTimer)
      this.outgoingTimeoutTimer = null
    }
  }

  // 启动被叫超时（60s）
  private startIncomingTimeout(callId: string) {
    this.clearIncomingTimeout()
    this.incomingTimeoutTimer = setTimeout(() => {
      // 仅在仍处于来电响铃阶段才判定为超时，已接听/连接后不处理
      if (this.callStatus.value === 'ringing') {
        console.warn('⏱️ 被叫通话超时，自动拒绝')
        this.rejectCall(callId, 'timeout')
      } else {
        console.log('⏱️ 被叫超时回调触发，但当前状态为', this.callStatus.value, '已忽略')
      }
    }, 60000)
  }
  private clearIncomingTimeout() {
    if (this.incomingTimeoutTimer) {
      clearTimeout(this.incomingTimeoutTimer)
      this.incomingTimeoutTimer = null
    }
  }
  /**
   * 邀请多个好友加入当前通话（前端流程 + 后端接口优先）
   * - 优先调用后端 /call/invite（如未实现则本地兜底，仅发出本地事件以便UI提示）
   * - 60s 未响应自动触发一个 invite-expired 事件，用于本地提示，不影响通话
   */
  public async inviteParticipants(userIds: string[]): Promise<void> {
    if (!this.currentCall.value) throw new Error('没有进行中的通话')
    const callId = this.currentCall.value.callId

    const uniqueIds = [...new Set((userIds || []).filter(Boolean))]
    if (!uniqueIds.length) return

    let backendOk = false
    try {
      const res = await apiClient.post<any>('/call/invite', { callId, userIds: uniqueIds })
      backendOk = !!res?.success
      if (!backendOk) {
        console.warn('后端 /call/invite 返回非成功，采用前端兜底:', res)
      }
    } catch (e) {
      console.warn('后端 /call/invite 调用失败，采用前端兜底:', e)
    }

    // 可选：尝试通过信令服务发送自定义邀请事件（如果已实现）
    try {
      // @ts-ignore 兼容还未声明的方法
      this.signalManager.emitInvite?.(callId, uniqueIds)
    } catch {}

    // 本地事件：通知UI“已发送邀请”
    this.emit('call:invite-sent', { callId, userIds: uniqueIds, backendOk, timestamp: Date.now() })

    // 60s 后发出过期事件（仅用于UI提示，不影响正在进行的通话）
    setTimeout(() => {
      this.emit('call:invite-expired', { callId, userIds: uniqueIds })
    }, 60000)
  }

}

// 根据本地缓存尝试获取好友铃声URL
function findCachedRingtoneUrl(userId: string): string | undefined {
  try {
    const cacheRaw = localStorage.getItem('friend_profile_cache')
    if (!cacheRaw) return undefined
    const cache = JSON.parse(cacheRaw)
    return cache?.[userId]?.ringtoneUrl || cache?.[userId]?.ringtone || undefined
  } catch {
    return undefined
  }
}


// 导出单例实例
export const callManager = CallManager.getInstance()

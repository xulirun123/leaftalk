<template>
  <div class="call-page" :class="{ mini: isMini }">
    <!-- 来电界面 -->
    <IncomingCallScreen
      v-if="showIncomingCall"
      :call-data="incomingCallData!"
      @accept="handleAcceptCall"
      @reject="handleRejectCall"
    />

    <!-- 视频通话界面 -->
    <VideoCallScreen
      v-else-if="currentCall && currentCall.type === 'video'"
      :call-config="currentCall"
      :local-stream="localStreamRef"
      :remote-stream="remoteStreamRef"
      :front-camera-stream="frontCameraStreamRef"
      :network-quality="networkQuality"
      :call-duration="callDuration"
      :is-audio-muted="mediaState.audio.muted"
      :is-video-muted="mediaState.video.muted"
      :call-status="callStatus"
      :is-speaker-on="speakerOn"
      @toggle-audio="handleToggleAudio"
      @toggle-video="handleToggleVideo"
      @toggle-speaker="handleToggleSpeaker"
      @switch-camera="handleSwitchCamera"
      @toggle-floating="handleToggleFloating"
      @invite-friend="handleInviteFriend"
      @end-call="handleEndCall"
    />

    <!-- 语音通话界面 -->
    <VoiceCallScreen
      v-else-if="currentCall && currentCall.type === 'voice'"
      :call-config="currentCall"
      :network-quality="networkQuality"
      :call-duration="callDuration"
      :is-audio-muted="mediaState.audio.muted"
      :call-status="callStatus"
      @toggle-audio="handleToggleAudio"
      @toggle-speaker="handleToggleSpeaker"
      @end-call="handleEndCall"
      @toggle-floating="handleToggleFloating"
      @invite-friend="handleInviteFriend"
    />

    <!-- 错误提示 -->
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ error }}</div>
        <button class="error-btn" @click="handleErrorClose">确定</button>
      </div>
    </div>
    <!-- 远程语音播放节点（语音通话用，隐藏） -->
    <audio ref="remoteAudioRef" autoplay playsinline style="display:none"></audio>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { callManager } from '../services/CallManager'
import type { IncomingCallData, CallEndReason } from '../types'
import IncomingCallScreen from '../components/IncomingCallScreen.vue'
import VideoCallScreen from '../components/VideoCallScreen.vue'
import VoiceCallScreen from '../components/VoiceCallScreen.vue'

// 路由和状态
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 响应式状态
const incomingCallData = ref<IncomingCallData | null>(null)
const error = ref<string>('')
const callDuration = ref(0)
const durationTimer = ref<NodeJS.Timeout | null>(null)
const isMini = ref(false)
// 远程语音播放/免提状态
const remoteAudioRef = ref<HTMLAudioElement | null>(null)
const speakerOn = ref(false)

// 从CallManager获取响应式状态
const currentCall = computed(() => callManager.currentCall.value)
const callStatus = computed(() => callManager.callStatus.value)
const mediaState = computed(() => callManager.mediaState)
const networkQuality = computed(() => callManager.networkQuality.value)

// 计算属性
const showIncomingCall = computed(() => {
  // 接听页在来电(ringing)与连接中(connecting)阶段都显示；仅在真正 connected 后切换到通话界面
  return !!incomingCallData.value && (callStatus.value === 'ringing' || callStatus.value === 'connecting' || callStatus.value === 'idle')
})

// 响应式媒体流：通过 CallManager 的事件驱动更新，保证 UI 能及时拿到最新流
const localStreamRef = ref<MediaStream | null>(callManager.getLocalStream())
const remoteStreamRef = ref<MediaStream | null>(callManager.getRemoteStream())
const frontCameraStreamRef = ref<MediaStream | null>(callManager.mediaManager.getFrontCameraStream())

// 绑定远程音频到隐藏的 <audio>
watch(remoteStreamRef, async (stream) => {
  const el = remoteAudioRef.value
  if (!el) return
  try {
    if (stream) {
      ;(el as any).srcObject = stream
      try { await el.play() } catch (e) { console.warn('远程音频自动播放被阻止:', e) }
    } else {
      ;(el as any).srcObject = null
      try { el.pause() } catch {}
    }
  } catch (e) {
    console.warn('绑定远程音频失败:', e)
  }
})

// 监听通话状态变化
watch(callStatus, async (newStatus, oldStatus) => {
  console.log(`📞 通话状态变化: ${oldStatus} -> ${newStatus}`)

  if (newStatus === 'connected' && oldStatus !== 'connected') {
    const connectedAt = callManager.connectedAt.value
    const initial = connectedAt ? (Date.now() - connectedAt) / 1000 : 0
    startDurationTimer(initial)
    // 仅语音通话：默认切为扬声器输出
    if (currentCall.value?.type === 'voice') {
      await setAudioOutput(true)
    }
  } else if (newStatus === 'ended' || newStatus === 'idle') {
    stopDurationTimer()
    // 立即返回，避免黑屏停留
    router.back()
  }
})

// 方法
const handleAcceptCall = async (callData: IncomingCallData) => {
  try {
    await callManager.acceptCall(callData)
    incomingCallData.value = null
  } catch (error) {
    console.error('接听通话失败:', error)
    showError('接听通话失败，请重试')
  }
}

const handleRejectCall = async (callData: IncomingCallData) => {
  try {
    await callManager.rejectCall(callData.callId)
    incomingCallData.value = null
    // 记录已拒绝的通话，避免刷新仍停留在来电页
    try {
      const key = 'rejected_calls'
      const set = new Set<string>(JSON.parse(localStorage.getItem(key) || '[]'))
      set.add(String(callData.callId))
      localStorage.setItem(key, JSON.stringify(Array.from(set)))
    } catch {}
    router.replace('/contacts')
  } catch (error) {
    console.error('拒绝通话失败:', error)
    router.replace('/contacts')
  }
}

const handleToggleAudio = () => {
  try {
    callManager.toggleAudioMute()
  } catch (error) {
    console.error('切换音频失败:', error)
    showError('音频控制失败')
  }
}

const handleToggleVideo = () => {
  try {
    callManager.toggleVideoMute()
  } catch (error) {
    console.error('切换视频失败:', error)
    showError('视频控制失败')
  }
}

const handleSwitchCamera = async () => {
  try {
    await callManager.switchCamera()
  } catch (error) {
    console.error('切换摄像头失败:', error)
    showError('切换摄像头失败')
  }
}

const setAudioOutput = async (useSpeaker: boolean) => {
  try {
    const el = remoteAudioRef.value
    if (!el) return
    // Web 支持 setSinkId 才能切换输出设备
    const anyEl: any = el as any
    if (typeof anyEl.setSinkId !== 'function') {
      console.warn('当前设备/浏览器不支持音频输出设备切换(setSinkId)')
      speakerOn.value = useSpeaker
      return
    }
    const devices = await navigator.mediaDevices.enumerateDevices()
    const outputs = devices.filter(d => d.kind === 'audiooutput')
    if (outputs.length === 0) {
      console.warn('未发现可用的音频输出设备')
      speakerOn.value = useSpeaker
      return
    }
    let target = outputs[0]
    if (useSpeaker) {
      // 优先找包含“speaker/扬声器”的输出
      const cand = outputs.find(d => /speaker|扬声器/i.test(d.label))
      if (cand) target = cand
    } else {
      // 退回系统默认或通信设备
      const def = outputs.find(d => d.deviceId === 'default')
      const comm = outputs.find(d => /communications/i.test(d.label))
      target = def || comm || outputs[0]
    }
    await (anyEl as HTMLMediaElement & { setSinkId(id: string): Promise<void> }).setSinkId(target.deviceId)
    speakerOn.value = useSpeaker
    console.log('音频输出切换为:', target.label || target.deviceId)
  } catch (e) {
    console.error('切换音频输出失败:', e)
  }
}

const handleToggleSpeaker = async () => {
  await setAudioOutput(!speakerOn.value)
}

const handleEndCall = async () => {
  try {
    const count = (callManager.participants?.value?.length || 0)
    if (count >= 3) {
      await callManager.leaveCallForMe()
    } else {
      await callManager.endCall('normal')
    }
  } catch (error) {
    console.error('结束通话失败:', error)
    // 即使失败也要返回
    router.back()
  }
}

const handleToggleFloating = () => {
  // 切换为全局迷你浮窗，并返回上一页（聊天/上一个页面）
  isMini.value = true
  callManager.setMini(true)
  router.back()
}

const handleInviteFriend = async () => {
  // 邀请好友：进入多选联系人页；覆盖在通话页面之上，但通话继续
  if (!currentCall.value) return
  // 不再切换迷你浮窗；改为标记“邀请覆盖层激活”
  callManager.setInviteOverlayActive(true)
  const max = 7 // 目前总人数上限9，已在通话2人，预留可选7人；后续可根据实际在席人数动态计算
  try {
    await router.push({
      name: 'SelectContact',
      query: {
        from: 'callInvite',
        mode: 'multi',
        callId: currentCall.value.callId,
        type: currentCall.value.type,
        max: String(max)
      }
    })
  } catch (e) {
    console.warn('跳转选择联系人页失败，回退到通讯录:', e)
    await router.push({ name: 'Contacts', query: { from: 'callInvite' } })
  }
}

const handleErrorClose = () => {
  error.value = ''
}

const showError = (message: string) => {
  error.value = message
  setTimeout(() => {
    error.value = ''
  }, 3000)
}

const startDurationTimer = (initial: number = 0) => {
  callDuration.value = Math.max(0, Math.floor(initial))
  if (durationTimer.value) {
    clearInterval(durationTimer.value)
    durationTimer.value = null
  }
  durationTimer.value = setInterval(() => {
    callDuration.value++
  }, 1000)
}

const stopDurationTimer = () => {
  if (durationTimer.value) {
    clearInterval(durationTimer.value)
    durationTimer.value = null
  }
}

// 初始化通话
const initializeCall = async () => {
  try {
    // 初始化CallManager
    await callManager.initialize()

    // 设置事件监听
    setupEventListeners()

    // 检查路由参数（容错：缺 action 时自动推断）
    let { action, targetUserId, type, callId } = route.query as Record<string, any>
    let normalizedAction = action as string | undefined
    if (!normalizedAction) {
      if (callId) normalizedAction = 'incoming'
      else if (targetUserId && type) normalizedAction = 'outgoing'
      else if (callStatus.value !== 'idle') normalizedAction = 'active'
      else if (currentCall.value) normalizedAction = 'active' // HMR/刷新导致路由参数丢失时兜底
      else {
        // 无任何有效参数，可能是误导航，返回联系人页
        console.warn('通话页面无有效参数，返回联系人页')
        router.replace('/contacts')
        return
      }
    }

    if (normalizedAction === 'incoming' && callId) {
      // 来电，先检查是否已被本机拒绝（避免刷新后再次停留接听页）
      try {
        const rejected = new Set<string>(JSON.parse(localStorage.getItem('rejected_calls') || '[]'))
        if (rejected.has(String(callId))) {
          router.replace('/contacts')
          return
        }
      } catch {}
      // 构造来电数据（名称后续在组件内做本地联系人/备注解析）
      const callData: IncomingCallData = {
        callId: callId as string,
        type: (type as 'voice' | 'video') || 'voice',
        fromUserId: targetUserId as string,
        fromUserInfo: {
          id: targetUserId as string,
          name: route.query.name as string || `用户${targetUserId}`,
          avatar: route.query.avatar as string || ''
        },
        timestamp: Date.now()
      }
      incomingCallData.value = callData
    } else if (normalizedAction === 'outgoing' && targetUserId && type) {
      // 发起通话；若当前已在通话中，则视为恢复活跃状态（避免“当前正在通话中”错误）
      if (callStatus.value !== 'idle') {
        // 转为 active 分支逻辑
        callManager.setMini(false)
        isMini.value = false
        if (callStatus.value === 'connected') {
          const connectedAt = callManager.connectedAt.value
          const initial = connectedAt ? (Date.now() - connectedAt) / 1000 : 0
          if (!durationTimer.value) {
            startDurationTimer(initial)
          } else {
            callDuration.value = Math.max(0, Math.floor(initial))
          }
        }
      } else {
        const targetUserInfo = {
          id: targetUserId as string,
          name: route.query.name as string || `用户${targetUserId}`,
          avatar: route.query.avatar as string || ''
        }
        // 视频主叫：先准备本地摄像头预览，保证进入页面即看到预览
        if (type === 'video') {
          console.log('📹 准备视频预览...')
          await callManager.prepareLocalPreview('video')
          console.log('📹 视频预览准备完成，本地流:', callManager.getLocalStream())
        }
        await callManager.makeCall(
          targetUserId as string,
          type as 'voice' | 'video',
          targetUserInfo
        )
      }
    } else if (normalizedAction === 'active' || (normalizedAction === 'outgoing' && callStatus.value !== 'idle')) {
      // 仅恢复到正在进行中的通话UI（不重新发起/接听）
      callManager.setMini(false)
      isMini.value = false
      // 邀请/拨号阶段：若为视频通话但本地预览尚未就绪，补一次本地预览以保证邀请页显示视频
      if (currentCall.value?.type === 'video' && !callManager.getLocalStream()) {
        try { await callManager.prepareLocalPreview('video') } catch {}
      }

      // 若当前已接通，基于 connectedAt 还原累计时长
      if (callStatus.value === 'connected') {
        const connectedAt = callManager.connectedAt.value
        const initial = connectedAt ? (Date.now() - connectedAt) / 1000 : 0
        if (!durationTimer.value) {
          startDurationTimer(initial)
        } else {
          // 已在计时则对齐一次当前值
          callDuration.value = Math.max(0, Math.floor(initial))
        }
      }

    } else {
      throw new Error('无效的通话参数')
    }

    // 处理从联系人选择器返回的邀请选择
    processPendingInviteSelection()
  } catch (error) {
    console.error('初始化通话失败:', error)
    // 若已有通话实例，作为 active 恢复而不返回上一页
    if (currentCall.value) {
      try {
        callManager.setMini(false)
        isMini.value = false
      } catch {}
    } else {
      showError('通话初始化失败')
      setTimeout(() => router.back(), 2000)
    }
  }
}

// 读取并处理联系人多选结果
const processPendingInviteSelection = async () => {
  try {
    const raw = sessionStorage.getItem('call_invite_selection')
    if (!raw) return
    const data = JSON.parse(raw)
    sessionStorage.removeItem('call_invite_selection')
    if (!currentCall.value || data.callId !== currentCall.value.callId) return

    const ids: string[] = Array.isArray(data.userIds) ? data.userIds.slice(0, 9) : []
    if (!ids.length) return

    try {
      await callManager.inviteParticipants(ids)
      appStore.showToast(`已发送通话邀请给 ${ids.length} 位好友`, 'success')
    } catch (e) {
      appStore.showToast('发送邀请失败', 'error')
    }
  } catch (e) {
    console.warn('处理邀请选择失败:', e)
  }
}


// 设置事件监听
const setupEventListeners = () => {
  callManager.on('call:incoming', (data) => {
    incomingCallData.value = data
  })

  // 监听接听事件：保持接听界面直到 connected
  callManager.on('call:accepted', () => {
    console.log('📞 通话已被接听，进入连接中，保持接听界面直至接通')
    // 不清理 incomingCallData；showIncomingCall 在 connecting 仍为 true
  })

// 当从联系人选择页面返回时，检查是否有邀请选择结果
watch(() => route.fullPath, () => {
  processPendingInviteSelection()
})


  // 被叫超时或对方拒绝：关闭接听页
  callManager.on('call:rejected', (data) => {
    console.log('来电已被拒绝/超时:', data.reason)
    incomingCallData.value = null
    // 返回上一页（通常是聊天页）
    router.back()
    appStore.showToast(data.reason === 'timeout' ? '来电超时' : '对方取消了来电', 'info')
  })

  callManager.on('call:ended', (data) => {
    console.log('通话已结束:', data.reason)
    stopDurationTimer()

    // 如果仍停留在接听页（来电未接/已超时），确保关闭并返回
    if (showIncomingCall.value) {
      incomingCallData.value = null
      router.back()
    }

    // 显示结束原因
    let message = '通话已结束'
    switch (data.reason) {
      case 'rejected':
        message = '对方拒绝了通话'
        break
      case 'timeout':
        message = '通话超时'
        break
      case 'network_error':
        message = '网络连接失败'
        break
      case 'busy':
        message = '对方忙线中'
        break
    }

    if (data.reason !== 'normal') {
      appStore.showToast(message, 'info')
    }
  })


  // 同步媒体流到本页面的响应式引用，确保 UI 能实时拿到最新的本地/远程流
  callManager.on('media:stream', (stream: MediaStream, kind: 'local' | 'remote') => {
    if (kind === 'local') {
      localStreamRef.value = stream
    } else if (kind === 'remote') {
      remoteStreamRef.value = stream
    }
  })

  // 监听前置摄像头预览流
  callManager.mediaManager.on('front-camera-stream', (stream: MediaStream) => {
    frontCameraStreamRef.value = stream
  })

  callManager.on('network:quality', (quality) => {
    if (quality.level === 'poor') {
      appStore.showToast('网络质量较差', 'warning')
    }
  })
}

// 生命周期
onMounted(() => {
  console.log('📞 通话页面已加载')
  initializeCall()
})

onUnmounted(() => {
  console.log('📞 通话页面已卸载')
  stopDurationTimer()

  // 如果是“最小化到浮窗”场景，则保持通话不断开
  if (callManager.isMini.value) {
    console.log('保持通话在后台（mini 模式），不挂断')
    return
  }
  // 如果是“邀请联系人覆盖层”场景，则保持通话不断开
  if (callManager.isInviteOverlayActive.value) {
    console.log('保持通话（邀请联系人覆盖层），不挂断')
    return
  }


  // 非 mini 模式下离开通话页才结束/离开通话
  if (callStatus.value !== 'idle' && callStatus.value !== 'ended') {
    const count = (callManager.participants?.value?.length || 0)
    if (count >= 3) {
      callManager.leaveCallForMe()
    } else {
      callManager.endCall('normal')
    }
  }
})
</script>

<style scoped>
.call-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
}
/* 迷你浮窗模式：允许点击穿透，背景透明 */
.call-page.mini { background: transparent; pointer-events: none; }
.call-page.mini :deep(.voice-call-screen) { background: transparent; }


.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.error-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  max-width: 300px;
  margin: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
}

.error-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.error-btn:hover {
  background: #06AD56;
}

.error-btn:active {
  transform: scale(0.98);
}
</style>

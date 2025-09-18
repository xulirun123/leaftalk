<template>
  <div>
    <!-- 主通话界面 -->
    <div v-if="!isMinimized" class="voice-call-container">
      <!-- 顶部快捷操作：左上浮窗按钮，右上邀请按钮 -->
      <div class="top-left-actions">
        <button class="control-btn floating-btn" @click="minimizeToFloating" title="切换浮窗">
          <iconify-icon icon="mdi:window-restore" width="22" />
        </button>
      </div>
      <button class="control-btn invite-btn" @click="inviteMore" title="邀请好友">
        <iconify-icon icon="heroicons:plus" width="24" />
      </button>

      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="wave-animation"></div>
        <div class="particles"></div>
      </div>

      <!-- 顶部状态栏 -->
      <div class="status-bar-overlay">
        <span class="time">{{ currentTime }}</span>
        <div class="status-icons">
          <iconify-icon icon="lucide:signal" width="16"></iconify-icon>
          <iconify-icon icon="lucide:wifi" width="16"></iconify-icon>
          <span class="battery">100%</span>
          <iconify-icon icon="lucide:battery" width="20"></iconify-icon>
        </div>
      </div>

      <!-- 用户信息区域 -->
      <div class="user-section">
        <div v-if="callStatus !== 'connected'" class="single-avatar">
          <img :src="contactInfo.avatar" :alt="contactInfo.name" />
        </div>
        <div v-else class="avatars-row">
          <div class="mini-avatar">
            <img :src="selfInfo.avatar" :alt="selfInfo.name" />
          </div>
          <div class="mini-avatar">
            <img :src="contactInfo.avatar" :alt="contactInfo.name" />
          </div>
        </div>
        <div v-if="callStatus === 'connected'" class="names-row">
          <span class="self-name">{{ selfInfo.name }}</span>
          <span class="contact-name">{{ contactInfo.name }}</span>
        </div>

        <div class="user-info">
          <h2 class="user-name">{{ contactInfo.name }}</h2>
          <p class="call-status">{{ callStatusText }}</p>
          <p class="call-duration">{{ formatDuration(callDuration) }}</p>
        </div>
      </div>

    <!-- 音频可视化 -->
    <div class="audio-visualizer" v-if="isConnected">
      <div class="audio-bars">
        <div
          v-for="i in 20"
          :key="i"
          class="audio-bar"
          :style="{ animationDelay: `${i * 0.1}s` }"
        ></div>
      </div>
    </div>

    <!-- 网络质量指示器 -->
    <div class="network-quality" :class="networkQuality">
      <iconify-icon :icon="getNetworkIcon()" width="16" />
      <span>{{ getNetworkText() }}</span>
    </div>

    <!-- 通话控制栏 -->
    <div class="call-controls">
      <div class="control-buttons">
        <!-- 左：麦克风开关 -->
        <button
          @click="toggleMute"
          :class="['control-btn', { active: isMuted }]"
          :title="isMuted ? '取消静音' : '静音'"
        >
          <iconify-icon :icon="isMuted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" width="28" />
        </button>

        <!-- 中：取消/挂断（带文字） -->
        <div class="end-call-wrapper">
          <button
            @click="endCall"
            class="control-btn end-call"
            :title="isConnected ? '挂断' : '取消'"
            :aria-label="isConnected ? '挂断' : '取消'"
          >
            <iconify-icon icon="heroicons:phone-x-mark" width="28" />
          </button>
          <div class="btn-text">{{ isConnected ? '挂断' : '取消' }}</div>
        </div>

        <!-- 右：扬声器开关 -->
        <button
          @click="toggleSpeaker"
          :class="['control-btn', { active: isSpeakerOn }]"
          :title="isSpeakerOn ? '关闭扬声器' : '开启扬声器'"
        >
          <iconify-icon :icon="isSpeakerOn ? 'heroicons:speaker-wave' : 'heroicons:speaker-x-mark'" width="28" />
        </button>
      </div>
    </div>

    <!-- 数字键盘 -->
    <div v-if="showKeypad" class="keypad-overlay">
      <div class="keypad">
        <div class="keypad-header">
          <h3>拨号键盘</h3>
          <button @click="toggleKeypad" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        <div class="keypad-grid">
          <button
            v-for="key in keypadKeys"
            :key="key.value"
            @click="dialKey(key.value)"
            class="keypad-key"
          >
            <span class="key-number">{{ key.value }}</span>
            <span class="key-letters">{{ key.letters }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isConnecting" class="connecting-overlay">
      <div class="connecting-content">
        <div class="loading-spinner"></div>
        <p>正在连接...</p>
      </div>
    </div>
    </div>

    <!-- 浮窗组件 -->
    <FloatingCallWindow
      :is-visible="isMinimized"
      call-type="voice"
      :contact-name="contactInfo.name"
      :contact-avatar="contactInfo.avatar"
      :duration="callDuration"
      :is-connected="isConnected"
      :is-muted="isMuted"
      :is-video-enabled="false"
      :local-stream="localStream"
      :remote-stream="remoteStream"
      @toggle-mute="toggleMute"
      @end-call="endCall"
      @restore="restoreFromFloating"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import { mediaService } from '../services/mediaService'
import { peerConnectionService } from '../services/peerConnectionService'
import { signalingService } from '../services/signalingService'
import { floatingWindowService } from '../services/floatingWindowService'
import { networkQualityService } from '../services/networkQualityService'
import { connectionRecoveryService } from '../services/connectionRecoveryService'
import FloatingCallWindow from '../components/FloatingCallWindow.vue'

// 路由和状态
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 通话参数
const targetUserId = ref(route.params.id as string)
const callId = ref(route.query.callId as string || '')
const isInitiator = ref(route.query.status === 'calling')

// 媒体流状态
const localStream = ref<MediaStream | null>(null)
const remoteStream = ref<MediaStream | null>(null)

// 通话状态
const callStatus = ref<'calling' | 'connecting' | 'connected' | 'ended'>('calling')
const callDuration = ref(0)
const isConnecting = ref(false)
const isConnected = ref(false)

// 媒体控制状态
const isMuted = ref(false)
const isSpeakerOn = ref(true)
const showKeypad = ref(false)
const isMinimized = ref(false)

// 顶部状态栏时间
const currentTime = ref('')
function updateTime() {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

// 网络质量
const networkQuality = ref<'excellent' | 'good' | 'fair' | 'poor'>('good')
const networkMetrics = ref<any>(null)
const isRecovering = ref(false)

// 联系人信息
const contactInfo = ref({
  name: `用户${targetUserId.value}`,
  avatar: `http://localhost:8893/api/users/${targetUserId.value}/avatar`
})

// 当前用户信息（用于显示主叫方头像/名称）
const selfInfo = computed(() => {
  const u = authStore.user as any
  const name = u?.nickname || u?.real_name || u?.username || '我'
  const avatar = u?.id ? `http://localhost:8893/api/users/${u.id}/avatar` : ''
  return { name, avatar }
})

// 键盘按键
const keypadKeys = [
  { value: '1', letters: '' },
  { value: '2', letters: 'ABC' },
  { value: '3', letters: 'DEF' },
  { value: '4', letters: 'GHI' },
  { value: '5', letters: 'JKL' },
  { value: '6', letters: 'MNO' },
  { value: '7', letters: 'PQRS' },
  { value: '8', letters: 'TUV' },
  { value: '9', letters: 'WXYZ' },
  { value: '*', letters: '' },
  { value: '0', letters: '+' },
  { value: '#', letters: '' }
]

// 定时器
let durationTimer: number | null = null


// 信令事件处理器引用（用于在卸载时解除绑定，避免重复触发）
let onOfferHandler: ((data: any) => any) | null = null
let onAnswerHandler: ((data: any) => any) | null = null
let onIceHandler: ((data: any) => any) | null = null
let onCallStatusHandler: ((data: any) => any) | null = null
let onErrorHandler: ((data: any) => any) | null = null
let onCallEndedHandler: ((data: any) => any) | null = null

// 计算属性
const callStatusText = computed(() => {
  switch (callStatus.value) {
    case 'calling': return '正在呼叫...'
    case 'connecting': return '正在连接...'
    case 'connected': return '通话中'
    case 'ended': return '通话已结束'
    default: return ''
  }
})

/**
 * 组件挂载
 */
onMounted(async () => {
  try {
    console.log('📞 语音通话页面初始化')
    updateTime()
    setInterval(updateTime, 60000)

    // 初始化服务
    await initializeServices()

    // 初始化浮窗服务
    floatingWindowService.initialize()

    // 初始化网络优化服务
    setupNetworkOptimization()

    // 获取联系人信息
    await loadContactInfo()

    // 初始化媒体流（仅音频）
    await initializeMedia()

    // 设置信令监听
    setupSignalingListeners()

    // 开始通话流程
    if (isInitiator.value) {
      await startCall()
    }

  } catch (error) {
    console.error('❌ 语音通话初始化失败:', error)
    appStore.showToast('通话初始化失败', 'error')
    router.back()
  }
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  cleanup()
})

/**
 * 初始化服务
 */
async function initializeServices(): Promise<void> {
  await mediaService.initialize()
  await signalingService.initialize()

  // 加入用户房间
  if (authStore.user?.id) {
    signalingService.joinUserRoom(String(authStore.user.id))
  }
}

/**
 * 加载联系人信息
 */
async function loadContactInfo(): Promise<void> {
  try {
    // 首屏快速回填（来自路由query）
    try {
      const qName = String((route.query as any)?.name || '').trim()
      if (qName) contactInfo.value.name = qName
      const qAvatar = String((route.query as any)?.avatar || '').trim()
      if (qAvatar) contactInfo.value.avatar = qAvatar
    } catch {}

    // 备注名优先
    try {
      const saved = JSON.parse(localStorage.getItem(`friend_remark_${targetUserId.value}`) || 'null')
      const remark = saved?.name && String(saved.name).trim()
      if (remark) {
        contactInfo.value.name = remark
      }
    } catch {}

    const response = await fetch(`http://localhost:8893/api/users/${targetUserId.value}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // 如果本地没有备注，再回落到接口昵称/用户名
        if (!localStorage.getItem(`friend_remark_${targetUserId.value}`)) {
          contactInfo.value.name = result.data.nickname || result.data.real_name || result.data.username || `用户${targetUserId.value}`
        }
        // 头像统一走真实头像API，避免使用/uploads直链
        contactInfo.value.avatar = `http://localhost:8893/api/users/${targetUserId.value}/avatar`
      }
    }
  } catch (error) {
    console.warn('⚠️ 获取联系人信息失败:', error)
  }
}

/**
 * 初始化媒体流（仅音频）
 */
async function initializeMedia(): Promise<void> {
  const constraints = mediaService.getConstraintsByQuality('medium', false) // 不包含视频
  localStream.value = await mediaService.getUserMedia(constraints)
}

/**
 * 设置信令监听
 */
function setupSignalingListeners(): void {
  // 先清理旧监听，避免重复注册导致事件多次触发
  try {
    if (onOfferHandler) signalingService.off('offer', onOfferHandler)
    if (onAnswerHandler) signalingService.off('answer', onAnswerHandler)
    if (onIceHandler) signalingService.off('ice-candidate', onIceHandler)
    if (onCallStatusHandler) signalingService.off('call-status', onCallStatusHandler)
    if (onErrorHandler) signalingService.off('error', onErrorHandler)
    if (onCallEndedHandler) signalingService.off('call-ended', onCallEndedHandler)
  } catch {}

  // 收到 Offer
  onOfferHandler = async (data: any) => {
    if (data.callId === callId.value) {
      await handleOffer(data.offer)
    }
  }
  signalingService.on('offer', onOfferHandler)

  // 收到 Answer
  onAnswerHandler = async (data: any) => {
    if (data.callId === callId.value) {
      await handleAnswer(data.answer)
    }
  }
  signalingService.on('answer', onAnswerHandler)

  // 收到 ICE 候选者
  onIceHandler = async (data: any) => {
    if (data.callId === callId.value) {
      await handleIceCandidate(data.candidate)
    }
  }
  signalingService.on('ice-candidate', onIceHandler)

  // 被叫方接听后，主叫再进入连接流程并发送 Offer
  onCallStatusHandler = async (data: any) => {
    if (data.callId === callId.value && data.status === 'answered') {
      callStatus.value = 'connecting'
      isConnecting.value = true
      if (isInitiator.value) {
        try {
          const offer = await peerConnectionService.createOffer()
          signalingService.sendOffer(callId.value, targetUserId.value, offer, 'voice')
        } catch (e) {
          console.error('❌ 发送 Offer 失败:', e)
        }
      }
    }
  }
  signalingService.on('call-status', onCallStatusHandler)

  // 信令错误（如对方不在线）
  onErrorHandler = (data: any) => {
    try {
      if (data?.callId && data.callId !== callId.value) return
      const code = data?.error || ''
      if (code === 'TARGET_OFFLINE') {
        appStore.showToast('对方不在线', 'error')
        handleCallEnded('target_offline')
      } else if (data?.message) {
        appStore.showToast(String(data.message), 'error')
      }
    } catch {}
  }
  signalingService.on('error', onErrorHandler)

  // 通话结束
  onCallEndedHandler = (data: any) => {
    if (data.callId === callId.value) {
      handleCallEnded(data.reason)
    }
  }
  signalingService.on('call-ended', onCallEndedHandler)
}

/**
 * 开始通话
 */
async function startCall(): Promise<void> {
  try {
    callStatus.value = 'calling'

    // 初始化 PeerConnection
    await peerConnectionService.initializePeerConnection({
      callId: callId.value,
      isInitiator: true,
      targetUserId: targetUserId.value,
      type: 'voice'
    })

    // 添加本地流
    if (localStream.value) {
      await peerConnectionService.addLocalStream(localStream.value)
    }

    // 设置 PeerConnection 监听
    setupPeerConnectionListeners()

    // 主叫方仅通知开始通话；等待被叫接听（answered）后再发送 Offer
    signalingService.startCall(callId.value, targetUserId.value, 'voice')

  } catch (error) {
    console.error('❌ 开始通话失败:', error)
    isConnecting.value = false
    throw error
  }
}

/**
 * 设置 PeerConnection 监听
 */
function setupPeerConnectionListeners(): void {
  peerConnectionService.on('connectionStateChange', (data: any) => {
    if (data.state === 'connected') {
      callStatus.value = 'connected'
      isConnected.value = true
      isConnecting.value = false
      startDurationTimer()

      // 开始网络质量监控
      const peerConnection = peerConnectionService.getPeerConnection()
      if (peerConnection) {
        networkQualityService.initialize(peerConnection)
      }
    } else if (data.state === 'disconnected' || data.state === 'failed') {
      handleCallEnded('connection_failed')
    }
  })

  peerConnectionService.on('remoteStream', (data: any) => {
    remoteStream.value = data.stream
    // Fallback: 一旦收到远端流，视为已连接，防止因某些浏览器不触发 connectionState=connected 而卡在“正在连接”
    if (!isConnected.value) {
      callStatus.value = 'connected'
      isConnected.value = true
      isConnecting.value = false
      startDurationTimer()
    }
  })

  peerConnectionService.on('iceCandidate', (data: any) => {
    signalingService.sendIceCandidate(callId.value, targetUserId.value, data.candidate)
  })
}

/**
 * 处理收到的 Offer
 */
async function handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
  try {
    callStatus.value = 'connecting'
    isConnecting.value = true

    // 初始化 PeerConnection
    await peerConnectionService.initializePeerConnection({
      callId: callId.value,
      isInitiator: false,
      targetUserId: targetUserId.value,
      type: 'voice'
    })

    // 添加本地流
    if (localStream.value) {
      await peerConnectionService.addLocalStream(localStream.value)
    }

    // 设置监听
    setupPeerConnectionListeners()

    // 创建并发送 Answer
    const answer = await peerConnectionService.createAnswer(offer)
    signalingService.sendAnswer(callId.value, targetUserId.value, answer)

  } catch (error) {
    console.error('❌ 处理 Offer 失败:', error)
  }
}

/**
 * 处理收到的 Answer
 */
async function handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
  try {
    await peerConnectionService.setRemoteAnswer(answer)
  } catch (error) {
    console.error('❌ 处理 Answer 失败:', error)
  }
}

/**
 * 处理收到的 ICE 候选者
 */
async function handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
  try {
    await peerConnectionService.addIceCandidate(candidate)
  } catch (error) {
    console.error('❌ 处理 ICE 候选者失败:', error)
  }
}

/**
 * 控制功能
 */
function toggleMute(): void {
  isMuted.value = mediaService.toggleMute()

  // 通知对方静音状态
  peerConnectionService.sendDataChannelMessage({
    type: 'mute',
    muted: isMuted.value
  })
}

function toggleSpeaker(): void {
  isSpeakerOn.value = !isSpeakerOn.value
  // 扬声器控制逻辑
}

function toggleKeypad(): void {
  showKeypad.value = !showKeypad.value
}

function dialKey(key: string): void {
  console.log('📞 拨号:', key)
  // 发送 DTMF 音调
  peerConnectionService.sendDataChannelMessage({
    type: 'dtmf',
    key
  })
}

/**
 * 最小化到浮窗
 */
function minimizeToFloating(): void {
  try {
    console.log('🪟 最小化到浮窗')

    // 准备浮窗数据
    const floatingData = {
      callType: 'voice' as const,
      contactName: contactInfo.value.name,
      contactAvatar: contactInfo.value.avatar,
      duration: callDuration.value,
      isConnected: isConnected.value,
      isMuted: isMuted.value,
      isVideoEnabled: false,
      localStream: localStream.value,
      remoteStream: remoteStream.value,
      callId: callId.value,
      targetUserId: targetUserId.value
    }

    // 最小化到浮窗
    floatingWindowService.minimize(floatingData)
    isMinimized.value = true

    console.log('✅ 已最小化到浮窗')
  } catch (error) {
    console.error('❌ 最小化失败:', error)
    appStore.showToast('最小化失败', 'error')
  }
}

function inviteMore(): void {
  appStore.showToast('邀请好友语音通话（稍后接入选择器）', 'info')
}

/**
 * 从浮窗恢复
 */
function restoreFromFloating(): void {
  try {
    console.log('🪟 从浮窗恢复')

    floatingWindowService.restore()
    isMinimized.value = false

    console.log('✅ 已从浮窗恢复')
  } catch (error) {
    console.error('❌ 恢复失败:', error)
    appStore.showToast('恢复失败', 'error')
  }
}

/**
 * 结束通话
 */
function endCall(): void {
  signalingService.endCall(callId.value, 'hangup')
  handleCallEnded('hangup')
}

/**
 * 处理通话结束
 */
function handleCallEnded(reason: string): void {
  console.log('📞 通话结束:', reason)
  callStatus.value = 'ended'
  isConnected.value = false

  cleanup()

  // 返回聊天页面
  const chatId = `${Math.min(Number(authStore.user?.id), Number(targetUserId.value))}_${Math.max(Number(authStore.user?.id), Number(targetUserId.value))}`
  router.replace(`/chat/${chatId}`)
}

/**
 * 开始通话时长计时
 */
function startDurationTimer(): void {
  durationTimer = window.setInterval(() => {
    callDuration.value++

    // 更新浮窗时长
    if (isMinimized.value) {
      floatingWindowService.updateDuration(callDuration.value)
    }
  }, 1000)
}

/**
 * 设置网络优化
 */
function setupNetworkOptimization(): void {
  try {
    console.log('📊 设置网络优化')

    // 初始化连接恢复服务
    const callConfig = {
      callId: callId.value,
      targetUserId: targetUserId.value,
      type: 'voice',
      isInitiator: route.query.status === 'calling'
    }
    connectionRecoveryService.initialize(callConfig)

    // 监听网络质量变化
    networkQualityService.on('qualityUpdated', (data: any) => {
      networkQuality.value = data.quality.level
      networkMetrics.value = data.metrics

      // 更新浮窗网络状态
      if (isMinimized.value) {
        floatingWindowService.updateState({
          networkQuality: data.quality.level
        } as any)
      }
    })

    // 监听连接恢复状态
    connectionRecoveryService.on('recoveryStarted', () => {
      isRecovering.value = true
      appStore.showToast('正在尝试重新连接...', 'info')
    })

    connectionRecoveryService.on('recoveryEnded', (data: any) => {
      isRecovering.value = false
      if (data.success) {
        appStore.showToast('连接已恢复', 'success')
      }
    })

    connectionRecoveryService.on('recoveryFailed', () => {
      isRecovering.value = false
      appStore.showToast('连接恢复失败，请检查网络', 'error')
    })

    console.log('✅ 网络优化设置完成')
  } catch (error) {
    console.error('❌ 网络优化设置失败:', error)
  }
}

/**
 * 格式化通话时长
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 网络质量相关
 */
function getNetworkIcon(): string {
  switch (networkQuality.value) {
    case 'excellent': return 'heroicons:signal'
    case 'good': return 'heroicons:signal'
    case 'fair': return 'heroicons:signal-slash'
    case 'poor': return 'heroicons:exclamation-triangle'
    default: return 'heroicons:signal'
  }
}

function getNetworkText(): string {
  switch (networkQuality.value) {
    case 'excellent': return '网络优秀'
    case 'good': return '网络良好'
    case 'fair': return '网络一般'
    case 'poor': return '网络较差'
    default: return '网络检测中'
  }
}

/**
 * 清理资源
 */
function cleanup(): void {
  // 解除信令监听，防止重复触发
  try {
    if (onOfferHandler) { signalingService.off('offer', onOfferHandler); onOfferHandler = null }
    if (onAnswerHandler) { signalingService.off('answer', onAnswerHandler); onAnswerHandler = null }
    if (onIceHandler) { signalingService.off('ice-candidate', onIceHandler); onIceHandler = null }
    if (onCallStatusHandler) { signalingService.off('call-status', onCallStatusHandler); onCallStatusHandler = null }
    if (onErrorHandler) { signalingService.off('error', onErrorHandler); onErrorHandler = null }
    if (onCallEndedHandler) { signalingService.off('call-ended', onCallEndedHandler); onCallEndedHandler = null }
  } catch {}

  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }

  // 清理网络优化服务
  networkQualityService.cleanup()
  connectionRecoveryService.cleanup()

  peerConnectionService.close()
  mediaService.stopCurrentStream()
}
</script>

<style scoped>
.voice-call-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.top-left-actions {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 10px;
  z-index: 2;
}

.invite-btn {
  position: absolute;
  right: 14px;
  top: 14px;
  transform: none;
  z-index: 2;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.wave-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: wave 3s ease-in-out infinite;
}

.wave-animation::before,
.wave-animation::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  animation: wave 3s ease-in-out infinite;
}

.wave-animation::before {
  animation-delay: 1s;
}

.wave-animation::after {
  animation-delay: 2s;
}

@keyframes wave {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
}

.user-section {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.user-avatar {
  position: relative;
  margin-bottom: 24px;
}

.user-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.2);
}

.avatar-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border: 3px solid transparent;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.avatar-ring.active {
  border-color: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.user-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.call-status {
  font-size: 16px;
  opacity: 0.8;
  margin: 0 0 8px 0;
}

.call-duration {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.audio-visualizer {
  margin-bottom: 40px;
}

.audio-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 40px;
}

.audio-bar {
  width: 3px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  animation: audioWave 1.5s ease-in-out infinite;
}

@keyframes audioWave {
  0%, 100% {
    height: 8px;
  }
  50% {
    height: 32px;
  }
}

.network-quality {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  color: white;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.network-quality.excellent { color: #10b981; }
.network-quality.good { color: #3b82f6; }
.network-quality.fair { color: #f59e0b; }
.network-quality.poor { color: #ef4444; }

.call-controls {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  padding: 0 20px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 48px;
}

.control-btn {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.55);
  transform: translateY(-1px);
}

.control-btn.active {
  outline: 2px solid rgba(255, 255, 255, 0.55);
}

.control-btn.end-call {
  background: #ef4444;
  width: 72px;
  height: 72px;
  border-radius: 36px;
}

.control-btn.end-call:hover {
  background: #dc2626;
}

.keypad-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  padding: 20px;
  border-radius: 20px 20px 0 0;
}

.keypad {
  max-width: 300px;
  margin: 0 auto;
}

.keypad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.keypad-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.keypad-key {
  aspect-ratio: 1;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.keypad-key:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.key-number {
  font-size: 24px;
  font-weight: 600;
}

.key-letters {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}

.connecting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.connecting-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

/* 控制按钮文字通用样式 */
.end-call-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.btn-text { color: #fff; font-size: 12px; opacity: 0.95; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 顶部状态栏（通话内显示） */
.status-bar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: #333;
  background: rgba(237, 237, 237, 0.95);
  z-index: 10000;
}
.status-bar-overlay .status-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-bar-overlay .battery { font-size: 11px; margin: 0 2px; }

/* 双头像（56px方形） */
.avatars-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}
.mini-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 0;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
/* 呼叫阶段单头像（56px方形，居中） */
.single-avatar { display: flex; justify-content: center; margin-bottom: 8px; }
.single-avatar img { width: 56px; height: 56px; object-fit: cover; border-radius: 0; border: 2px solid rgba(255,255,255,0.2); }
.names-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  color: #fff;
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 16px;
}
.self-name, .contact-name { max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

</style>

<template>
  <div class="video-call-container">
    <div class="video-call-fullscreen">
      <!-- 呼叫状态页面 -->
      <div v-if="callStatus === 'calling'" class="calling-state">
        <!-- 顶部状态栏：呼叫/接听/接通都显示 -->
        <div class="call-status-bar">
          <button @click="minimizeToFloating" class="floating-btn">
            <iconify-icon icon="mdi:window-restore" width="20" />
          </button>
        </div>

        <!-- 大视频流容器（呼叫阶段：只显示本地预览） -->
        <div class="video-container">
          <video v-if="hasLocalVideo && isVideoEnabled" ref="bigLocalPreviewRef" class="remote-video" autoplay playsinline muted />

          <!-- 用户信息 -->
          <div class="user-info">
            <img :src="contactInfo.avatar || '/default-avatar.png'" :alt="contactInfo.name" class="user-avatar" />
            <div class="user-name">{{ contactInfo.name }}</div>
            <div class="call-status-text">{{ callStatusText }}</div>
          </div>
        </div>

        <!-- 底部控制栏 -->
        <div class="calling-controls">
          <!-- 摄像头切换 -->
          <button @click="switchCamera" class="control-btn camera-switch left-btn">
            <iconify-icon icon="heroicons:arrow-path" width="24" />
          </button>

          <!-- 取消通话（带文字） -->
          <div class="center-btn-wrapper">
            <button @click="endCall" class="control-btn cancel-call" title="取消" aria-label="取消">
              <iconify-icon icon="heroicons:phone-x-mark" width="32" />
            </button>
            <div class="btn-text">取消</div>
          </div>

          <!-- 摄像头开关 -->
          <button @click="toggleVideo" class="control-btn video-toggle right-btn" :class="{ active: !isVideoEnabled }">
            <iconify-icon :icon="isVideoEnabled ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" width="24" />
          </button>
        </div>
      </div>

      <!-- 通话状态页面 -->
      <div v-else class="connected-state">
        <!-- 状态栏 -->
        <div class="call-status-bar">
          <!-- 浮窗切换按钮 -->
          <button @click="minimizeToFloating" class="floating-btn">
            <iconify-icon icon="mdi:window-restore" width="20" />
          </button>

          <!-- 通话时长 -->
          <div class="call-duration">{{ formatDuration(callDuration) }}</div>

          <!-- 邀请其他人按钮（隐藏） -->
        </div>

        <!-- 远程视频容器（大容器：显示对方视频） -->
        <div class="remote-video-container">
          <video ref="remoteVideoRef" class="remote-video" autoplay playsinline :muted="isSwapped" />
        </div>

        <!-- 本地视频（小容器：显示自己视频，点击可切换） -->
        <div class="local-video-container" @click="swapVideoStreams">
          <video v-if="hasLocalVideo && isVideoEnabled" ref="localVideoRef" class="local-video" autoplay playsinline :muted="isSmallShowingLocal" />
          <div v-else class="local-avatar-container"><div class="local-avatar-placeholder"></div></div>
        </div>

        <!-- 通话控制栏 -->
        <div class="call-controls">
          <!-- 上层控制按钮 -->
          <div class="control-top">
            <!-- 麦克风开关（挂断按钮上方） -->
            <button @click="toggleMute" class="control-btn">
              <iconify-icon :icon="isMuted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" width="24" />
            </button>

            <!-- 扬声器开关（开启时背景不变） -->
            <button @click="toggleSpeaker" class="control-btn">
              <iconify-icon :icon="isSpeakerOn ? 'heroicons:speaker-wave' : 'heroicons:speaker-x-mark'" width="24" />
            </button>

            <!-- 摄像头开关（开启时背景不变） -->
            <button @click="toggleVideo" class="control-btn">
              <iconify-icon :icon="isVideoEnabled ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" width="24" />
            </button>
          </div>

          <!-- 主要控制按钮 -->
          <div class="main-controls">
            <!-- 挂断电话 -->
            <div class="end-call-wrapper">
              <button @click="endCall" class="control-btn end-call-btn" title="\u6302\u65ad" aria-label="\u6302\u65ad">
                <iconify-icon icon="heroicons:phone-x-mark" width="32" />
              </button>
              <div class="btn-text">\u6302\u65ad</div>
            </div>

            <!-- 摄像头切换 -->
            <button @click="switchCamera" class="control-btn camera-switch-btn">
              <iconify-icon icon="heroicons:arrow-path" width="24" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import { apiClient } from '../../../shared/services/apiClient'
import { mediaService } from '../services/mediaService'
import { peerConnectionService } from '../services/peerConnectionService'
import { signalingService } from '../services/signalingService'
import { setupCallFlow } from '../services/callFlow'

// 路由和状态
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 通话参数
const contactInfo = ref({
  id: route.params.id as string,
  name: (route.query.name as string) || '联系人',
  avatar: (route.query.avatar as string) || ''
})

// 通话配置
const callId = ref((route.query.callId as string) || `call_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`)
const isInitiator = ref((route.query.status as string) === 'calling')

// 通话状态：calling(呼叫中), connecting(连接中), connected(已连接), ended(已结束)
const callStatus = ref((route.query.status as string) || 'calling')

// 媒体流状态
const localStream = ref<MediaStream | null>(null)
const remoteStream = ref<MediaStream | null>(null)

// 状态变量
const isVideoEnabled = ref(true)
const isMuted = ref(false)
const isSpeakerOn = ref(true)
const callDuration = ref(0) // 通话时长（秒）
const isConnecting = ref(false)

// 视频元素引用
const remoteVideoRef = ref<HTMLVideoElement>()
const localVideoRef = ref<HTMLVideoElement>()
const bigLocalPreviewRef = ref<HTMLVideoElement>()

// 定时器 / Offer重发
let durationTimer: number | null = null
let offerResendTimer: number | null = null
const answerHandled = ref(false)

// 统一通话流程清理函数
let callFlowCleanup: (() => void) | null = null

let lastOffer: RTCSessionDescriptionInit | null = null

// 计算属性
const callStatusText = computed(() => {
  switch (callStatus.value) {
    case 'calling': return '正在呼叫...'
    case 'connecting': return '正在连接...'
    case 'connected': return '通话中'
    default: return '呼叫中'
  }
})

// 是否有可用本地视频轨（用于小窗显隐）
const hasLocalVideo = computed(() => {
  const stream = localStream.value
  if (!stream) return false
  const track = stream.getVideoTracks()[0]
  return !!track && track.readyState === 'live' && track.enabled
})

// 已移除 hasRemoteVideo，呼叫阶段只显示本地预览

// 连接后：是否小窗显示本地（用于动态静音）
const isSwapped = ref(false)
const isSmallShowingLocal = computed(() => callStatus.value === 'connected' ? !isSwapped.value : true)

// 根据当前交换状态，更新视频元素绑定
const updateVideoBindings = () => {
  if (callStatus.value !== 'connected') return
  const bigEl = remoteVideoRef.value
  const smallEl = localVideoRef.value
  try {
    if (bigEl) {
      // 大窗：默认显示远端；交换后显示本地
      // @ts-ignore
      bigEl.srcObject = (isSwapped.value ? localStream.value : remoteStream.value) || null
    }
    if (smallEl) {
      // 小窗：默认显示本地；交换后显示远端
      // @ts-ignore
      smallEl.srcObject = (isSwapped.value ? remoteStream.value : localStream.value) || null
    }
  } catch {}
}

const swapVideoStreams = () => {
  if (callStatus.value !== 'connected') return
  isSwapped.value = !isSwapped.value
  updateVideoBindings()
}

// 格式化通话时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 加载联系人信息（备注优先，其次昵称/实名/用户名；并补全头像）
const ensureContactInfo = async () => {
  try {
    // 1) 本地备注优先（与聊天页保持一致）
    try {
      const saved = JSON.parse(localStorage.getItem(`friend_remark_${contactInfo.value.id}`) || 'null')
      const remark = saved?.name && String(saved.name).trim()
      if (remark) contactInfo.value.name = remark
    } catch {}

    // 2) 若头像/昵称缺失，则从用户资料补全
    if (!contactInfo.value.avatar || !contactInfo.value.name || contactInfo.value.name === '联系人') {
      const res = await apiClient.get(`/users/${contactInfo.value.id}`)
      if (res.success && res.data) {
        const u: any = res.data
        // 若无本地备注，则使用后备名字
        if (!localStorage.getItem(`friend_remark_${contactInfo.value.id}`)) {
          contactInfo.value.name = u.nickname || u.real_name || u.username || contactInfo.value.name
        }
        contactInfo.value.avatar = u.avatar || contactInfo.value.avatar
      }
    }
  } catch (e) {
    console.warn('⚠️ 获取联系人资料失败:', e)
  }
}

// 方法
const minimizeToFloating = () => {
  console.log('🪟 最小化到浮窗')
  appStore.showToast('最小化功能开发中', 'info')
}



const toggleMute = () => {
  isMuted.value = mediaService.toggleMute()
  console.log(`🔇 ${isMuted.value ? '静音' : '取消静音'}`)
  appStore.showToast(`${isMuted.value ? '已静音' : '已取消静音'}`, 'info')

  // 通知对方静音状态
  peerConnectionService.sendDataChannelMessage({
    type: 'mute',
    muted: isMuted.value
  })
}

const toggleVideo = () => {
  isVideoEnabled.value = mediaService.toggleVideo()
  console.log(`📹 ${isVideoEnabled.value ? '开启视频' : '关闭视频'}`)
  appStore.showToast(`${isVideoEnabled.value ? '已开启视频' : '已关闭视频'}`, 'info')

  // 通知对方视频状态
  peerConnectionService.sendDataChannelMessage({
    type: 'video',
    enabled: isVideoEnabled.value
  })
}

const toggleSpeaker = () => {
  isSpeakerOn.value = !isSpeakerOn.value
  console.log(`🔊 ${isSpeakerOn.value ? '开启扬声器' : '关闭扬声器'}`)
  appStore.showToast(`${isSpeakerOn.value ? '已开启扬声器' : '已关闭扬声器'}`, 'info')
}

const switchCamera = async () => {
  try {
    console.log('📷 切换摄像头')
    await mediaService.switchCamera()
    appStore.showToast('摄像头已切换', 'success')
  } catch (error) {
    console.error('❌ 切换摄像头失败:', error)
    appStore.showToast('切换摄像头失败', 'error')
  }
}

const endCall = () => {
  console.log('📞 结束通话')

  // 发送结束通话信号
  signalingService.endCall(callId.value, 'hangup')

  // 处理通话结束
  handleCallEnded('hangup')
}

// 获取本地视频流
const getLocalVideoStream = async () => {
  try {
    console.log('🎥 获取本地视频流...')

    // 使用mediaService获取高质量视频流
    const constraints = mediaService.getConstraintsByQuality('medium', true)
    localStream.value = await mediaService.getUserMedia(constraints)

    // 将本地流绑定到视频元素
    if (localVideoRef.value && localStream.value) {
      localVideoRef.value.srcObject = localStream.value
    }
    // 呼叫阶段：将本地流绑定到大容器预览
    if (bigLocalPreviewRef.value && localStream.value) {
      bigLocalPreviewRef.value.srcObject = localStream.value
    } else {
      await nextTick()
      if (bigLocalPreviewRef.value && localStream.value) {
        bigLocalPreviewRef.value.srcObject = localStream.value
      }
    }

    console.log('✅ 本地视频流获取成功')
  } catch (error) {
    console.warn('⚠️ 获取视频流失败（可能被占用/无权限），将仅以语音继续:', error)
    // 若相机不可用，禁用视频开关以隐藏小窗视频
    isVideoEnabled.value = false
    // 不中断流程，允许仅音频继续
    return
  }
}

// 确保呼叫阶段大预览及时绑定
watch([localStream, () => callStatus.value], async () => {
  if (callStatus.value === 'calling' && bigLocalPreviewRef.value && localStream.value) {
    // @ts-ignore
    bigLocalPreviewRef.value.srcObject = localStream.value
  }
})

// 当本地视频不可用或切换为关闭时，主叫方才回显远端视频到小窗；被叫方显示占位


// 初始化WebRTC服务
const initializeWebRTC = async () => {
  try {
    console.log('🔗 初始化WebRTC服务...')

    // 初始化服务
    await mediaService.initialize()
    await signalingService.initialize()

    // 加入用户房间
    if (authStore.user?.id) {
      signalingService.joinUserRoom(String(authStore.user.id))
    }

    // 设置信令监听
    setupSignalingListeners()

    console.log('✅ WebRTC服务初始化完成')
  } catch (error) {
    console.error('❌ WebRTC服务初始化失败:', error)
    appStore.showToast('通话服务初始化失败', 'error')
    throw error
  }
}

// 设置信令监听
const setupSignalingListeners = () => {
  // 统一通话流程（共用 voice/video）
  if (callFlowCleanup) { try { callFlowCleanup() } catch {} callFlowCleanup = null }

  callFlowCleanup = setupCallFlow(
    {
      callId: callId.value,
      targetUserId: String(contactInfo.value.id),
      type: 'video',
      isInitiator: isInitiator.value,
    },
    {
      handleOffer: async (offer) => { await handleOffer(offer) },
      onConnected: () => {
        callStatus.value = 'connected'
        isConnecting.value = false
        isSwapped.value = false
        updateVideoBindings()
        startDurationTimer()
        appStore.showToast('通话已接通', 'success')
      },
      onRemoteStream: (stream) => {
        remoteStream.value = stream
        updateVideoBindings()
      },
      onError: (data) => {
        if (data?.callId && data.callId !== callId.value) return
        if (data?.error === 'TARGET_OFFLINE') {
          appStore.showToast('对方不在线，无法接通', 'error')
          handleCallEnded('target_offline')
        }
      },
      onCallEnded: (data) => {
        if (data?.callId === callId.value) handleCallEnded(data.reason)
      },
      setConnecting: (v) => { isConnecting.value = v },
      setStatus: (s) => { callStatus.value = s },
    }
  )
}

// 开始通话流程
const startCall = async () => {
  try {
    console.log('📞 开始视频通话流程...')
    isConnecting.value = true
    answerHandled.value = false

    // 初始化 PeerConnection
    await peerConnectionService.initializePeerConnection({
      callId: callId.value,
      isInitiator: isInitiator.value,
      targetUserId: contactInfo.value.id,
      type: 'video'
    })

    // 添加本地流
    if (localStream.value) {
      await peerConnectionService.addLocalStream(localStream.value)
    }

    // 监听由统一通话流程内部完成

    if (isInitiator.value) {
      // 发起方：仅通知开始通话；等待对方接听（answered）后再创建并发送 Offer
      signalingService.startCall(callId.value, contactInfo.value.id, 'video')
    }

    console.log('✅ 通话流程启动完成')
  } catch (error) {
    console.error('❌ 开始通话失败:', error)
    isConnecting.value = false
    appStore.showToast('通话启动失败', 'error')
  }
}

// 页面加载时初始化
onMounted(async () => {
  try {
    console.log('📞 视频通话页面加载，状态:', callStatus.value)

    // 补全联系人展示信息（头像/昵称）
    await ensureContactInfo()

    // 主叫方：先获取本地视频流再初始化，保证小窗可立即预览
    // 被叫方：跳过本地视频采集，优先初始化信令，尽快接通远端
    if (isInitiator.value) {
      await getLocalVideoStream()
    } else {
      isVideoEnabled.value = false
    }

    // 初始化WebRTC服务
    await initializeWebRTC()

    // 开始通话流程（仅主叫方触发；被叫方等待 Offer）
    if (isInitiator.value) {
      await startCall()
    }

  } catch (error) {
    console.error('❌ 视频通话初始化失败:', error)
    appStore.showToast('通话初始化失败', 'error')
    router.back()
  }
})

// 页面卸载时清理
onUnmounted(() => {
  cleanup()
})

// 设置 PeerConnection 监听
const setupPeerConnectionListeners = () => {
  peerConnectionService.on('connectionStateChange', (data: any) => {
    console.log('🔗 连接状态变化:', data.state)

    if (data.state === 'connected') {
      callStatus.value = 'connected'
      isConnecting.value = false
      // 刚接通时按默认布局绑定：大窗对方/小窗自己
      isSwapped.value = false
      updateVideoBindings()
      startDurationTimer()
      appStore.showToast('通话已接通', 'success')
    } else if (data.state === 'disconnected' || data.state === 'failed') {
      handleCallEnded('connection_failed')
    }
  })

  peerConnectionService.on('remoteStream', (data: any) => {
    console.log('📹 收到远程视频流')
    remoteStream.value = data.stream
    // 根据状态更新绑定（连接前忽略）
    updateVideoBindings()
  })

  peerConnectionService.on('iceCandidate', (data: any) => {
    signalingService.sendIceCandidate(callId.value, contactInfo.value.id, data.candidate)
  })
}

// 处理收到的 Offer
const handleOffer = async (offer: RTCSessionDescriptionInit) => {
  try {
    console.log('📞 处理收到的 Offer')
    callStatus.value = 'connecting'
    isConnecting.value = true

    // 已存在连接则视为重复Offer，忽略，避免重复初始化/重协商
    const existing = peerConnectionService.getPeerConnection()
    if (existing) {
      console.warn('⚠️ 已存在 PeerConnection，忽略重复 Offer。state:', existing.signalingState)
      return
    }

    // 初始化 PeerConnection（接收方）
    await peerConnectionService.initializePeerConnection({
      callId: callId.value,
      isInitiator: false,
      targetUserId: contactInfo.value.id,
      type: 'video'
    })

    // 添加本地流
    if (localStream.value) {
      await peerConnectionService.addLocalStream(localStream.value)
    }

    // 监听由统一通话流程内部完成

    // 创建并发送 Answer
    const answer = await peerConnectionService.createAnswer(offer)
    signalingService.sendAnswer(callId.value, contactInfo.value.id, answer)

  } catch (error) {
    console.error('❌ 处理 Offer 失败:', error)
    appStore.showToast('通话连接失败', 'error')
  }
}

// 处理收到的 Answer
const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
  try {
    console.log('📞 处理收到的 Answer')
    await peerConnectionService.setRemoteAnswer(answer)
    answerHandled.value = true
  } catch (error: any) {
    // 若因时序导致已处于 stable，再次设置 Answer 会抛错；此处忽略
    if (error?.name === 'InvalidStateError' || /Wrong state|Called in wrong state/i.test(String(error?.message))) {
      console.warn('⚠️ 忽略重复/时序异常的 Answer：', error?.message || error)
      return
    }
    console.error('❌ 处理 Answer 失败:', error)
  }
}

// 处理收到的 ICE 候选者
const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
  try {
    await peerConnectionService.addIceCandidate(candidate)
  } catch (error) {
    console.error('❌ 处理 ICE 候选者失败:', error)
  }
}

// 处理通话结束
const handleCallEnded = (reason: string) => {
  console.log('📞 通话结束:', reason)
  callStatus.value = 'ended'

  let message = '通话已结束'
  switch (reason) {
    case 'hangup': message = '通话已结束'; break
    case 'rejected': message = '对方拒绝了通话'; break
    case 'timeout': message = '通话超时'; break
    case 'connection_failed': message = '连接失败'; break
    default: message = '通话已结束'
  }

  appStore.showToast(message, 'info')
  cleanup()

  // 返回聊天页面
  setTimeout(() => {
    router.push('/chat')
  }, 1500)
}

// 开始通话时长计时
const startDurationTimer = () => {
  durationTimer = window.setInterval(() => {
    callDuration.value++
  }, 1000)
}

// 清理资源
const cleanup = () => {
  console.log('🧹 清理通话资源')

  // 清理定时器
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
  if (offerResendTimer) {
    clearTimeout(offerResendTimer)
    offerResendTimer = null
  }
  lastOffer = null

  // 统一通话流程清理
  if (callFlowCleanup) { try { callFlowCleanup() } catch {} callFlowCleanup = null }

  // 停止媒体流
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
  }

  // 清理WebRTC连接
  peerConnectionService.close()
  mediaService.stopCurrentStream()
}
</script>

<style scoped>
.video-call-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 9999;
}

.video-call-fullscreen {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 呼叫状态样式 */
.calling-state {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.user-info {
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
  z-index: 3;
  pointer-events: none;
}
.user-info .user-name { font-size: 18px; font-weight: 600; }
.user-info .call-status-text { margin-top: 6px; opacity: 0.85; }

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin: 0 auto 12px;
  display: block;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.call-status-text {
  font-size: 14px;
  opacity: 0.8;
}

/* 呼叫状态控制栏 */
.calling-controls {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  height: 88px; /* 为下方文字预留高度 */
}

.left-btn {
  position: absolute;
  left: 20px;
}

.right-btn {
  position: absolute;
  right: 20px;
}

.center-btn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
}

/* 左上角浮窗按钮 */
.floating-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  z-index: 2;
  cursor: pointer;
}

/* 通话状态样式 */
.connected-state {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 状态栏 */
.call-status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(rgba(0, 0, 0, 0.8), transparent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
}

.floating-btn, .invite-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.call-duration {
  color: white;
  font-size: 16px;
  font-weight: 500;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* 远程视频容器 */
.remote-video-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.remote-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  pointer-events: none; /* 确保下方视频不拦截控制栏点击 */
}

.remote-user-info {
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
}

.remote-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 12px;
  display: block;
}

.remote-name {
  font-size: 18px;
  font-weight: 500;
}

/* 本地视频 */
.local-video-container {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  background: #1f2937;
  z-index: 5;
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-avatar-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #374151;
}

.local-avatar, .local-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.local-avatar-placeholder {
  background: #666;
}

/* 通话控制栏 */
.call-controls {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 0 40px;
  z-index: 20; /* 保证在视频之上，便于点击 */
}

.control-top {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 8px;
}

.main-controls {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}

/* 接通后按钮：更高对比度 */
.connected-state .control-btn {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.connected-state .control-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.8);
}
.connected-state .control-btn:active {
  background: rgba(0, 0, 0, 0.8);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.4);
}



.end-call-btn {
  background: rgba(255, 59, 48, 0.8);
  width: 64px;
  height: 64px;
}

.end-call-btn:hover {
  background: rgba(255, 59, 48, 1);
}

.camera-switch-btn {
  background: rgba(255, 255, 255, 0.2);
  position: absolute;
  right: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .local-video-container {
    width: 100px;
    height: 133px;
    top: 70px;
    right: 15px;
  }

  .control-btn {
    width: 48px;
    height: 48px;
  }

  .end-call-btn {
    width: 56px;
    height: 56px;
  }

  .main-controls {
    gap: 40px;
  }

  .call-controls {
    bottom: 40px;
    padding: 0 20px;
  }
}

/* 通用按钮文字样式与呼叫态中间按钮容器 */
.btn-text { color: #fff; font-size: 12px; opacity: 0.95; margin-top: 6px; }
.center-btn-wrapper { position: absolute; left: 50%; transform: translateX(-50%); top: 0; display: flex; flex-direction: column; align-items: center; }

/* 动画效果 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}


</style>

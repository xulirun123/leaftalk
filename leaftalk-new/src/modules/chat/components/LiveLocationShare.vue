<template>
  <div class="live-location-share">
    <!-- 头部控制栏 -->
    <div class="header">
      <div class="status-info">
        <div class="status-indicator" :class="{ active: isSharing }"></div>
        <span class="status-text">
          {{ isSharing ? '正在共享位置' : '位置共享已停止' }}
        </span>
      </div>
      <div class="controls">
        <button
          @click="toggleSharing"
          :class="['share-btn', { active: isSharing }]"
        >
          {{ isSharing ? '停止共享' : '开始共享' }}
        </button>
      </div>
    </div>

    <!-- 地图显示区域 -->
    <div class="map-container">
      <AMapContainer
        ref="mapRef"
        :width="'100%'"
        :height="'300px'"
        :center="mapCenter"
        :zoom="15"
        :markers="allMarkers"
        :show-controls="true"
        @map-ready="onMapReady"
        @location-change="onLocationChange"
      />

      <!-- 位置精度显示 -->
      <div class="accuracy-info" v-if="currentLocation && locationAccuracy">
        <iconify-icon icon="heroicons:signal" width="12"></iconify-icon>
        精度: {{ Math.round(locationAccuracy) }}米
      </div>
    </div>

    <!-- 参与者列表 -->
    <div class="participants" v-if="participants.length > 0">
      <div class="section-title">共享成员 ({{ participants.length }})</div>
      <div class="participant-list">
        <div
          v-for="participant in participants"
          :key="participant.userId"
          @click="focusOnParticipant(participant)"
          class="participant-item"
        >
          <img :src="participant.avatar" :alt="participant.name" class="participant-avatar" />
          <div class="participant-info">
            <div class="participant-name">{{ participant.name }}</div>
            <div class="participant-status">
              <span class="update-time">{{ formatUpdateTime(participant.lastUpdate) }}</span>
              <span class="distance" v-if="participant.distance">
                {{ formatDistance(participant.distance) }}
              </span>
            </div>
          </div>
          <div class="participant-actions">
            <button @click.stop="navigateToParticipant(participant)" class="nav-btn">
              <iconify-icon icon="heroicons:map" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 语音对话控制栏（默认开启） -->
    <div class="voice-call-bar">
      <div class="call-info">
        <div class="call-status">
          <div class="call-indicator" :class="{ active: isInCall, connecting: isConnecting }"></div>
          <span v-if="isConnecting">正在连接语音...</span>
          <span v-else-if="isInCall">语音对话中 {{ formatCallDuration(callDuration) }}</span>
          <span v-else>语音已断开</span>
        </div>
        <div class="call-controls">
          <button @click="toggleMute" :class="['call-btn', { active: isMuted }]" :disabled="!isInCall">
            <iconify-icon :icon="isMuted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" width="16"></iconify-icon>
            <span class="btn-text">{{ isMuted ? '取消静音' : '静音' }}</span>
          </button>
          <button @click="toggleSpeaker" :class="['call-btn', { active: isSpeakerOn }]" :disabled="!isInCall">
            <iconify-icon :icon="isSpeakerOn ? 'heroicons:speaker-wave' : 'heroicons:speaker-x-mark'" width="16"></iconify-icon>
            <span class="btn-text">{{ isSpeakerOn ? '关闭扬声器' : '开启扬声器' }}</span>
          </button>
          <button @click="reconnectVoice" v-if="!isInCall && !isConnecting" class="call-btn reconnect">
            <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
            <span class="btn-text">重新连接</span>
          </button>
        </div>
      </div>

      <!-- 语音质量指示器 -->
      <div class="voice-quality" v-if="isInCall">
        <div class="quality-bars">
          <div class="bar" :class="{ active: voiceQuality >= 1 }"></div>
          <div class="bar" :class="{ active: voiceQuality >= 2 }"></div>
          <div class="bar" :class="{ active: voiceQuality >= 3 }"></div>
          <div class="bar" :class="{ active: voiceQuality >= 4 }"></div>
        </div>
        <span class="quality-text">{{ getQualityText(voiceQuality) }}</span>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="footer-actions">
      <button @click="centerOnMyLocation" class="action-btn">
        <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
        我的位置
      </button>
      <button @click="inviteMembers" class="action-btn">
        <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
        邀请成员
      </button>
      <button @click="shareLocationLink" class="action-btn">
        <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
        分享链接
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AMapContainer from '../map/AMapContainer.vue'
import { mapService, type MapLocation } from '../../services/mapService'
import { MAP_UTILS } from '../../config/map'

interface Participant {
  userId: string
  name: string
  avatar: string
  location: MapLocation
  lastUpdate: Date
  distance?: number
}

interface Props {
  chatId?: string
  participants?: Participant[]
  duration?: number // 共享时长（分钟）
}

const props = withDefaults(defineProps<Props>(), {
  chatId: '',
  participants: () => [],
  duration: 60
})

const emit = defineEmits<{
  'sharing-start': [location: MapLocation]
  'sharing-stop': []
  'location-update': [location: MapLocation]
  'invite-members': []
  'call-start': [participants: string[]]
  'call-end': []
  'call-mute': [muted: boolean]
  'call-speaker': [enabled: boolean]
}>()

// 响应式数据
const isSharing = ref(false)
const currentLocation = ref<MapLocation | null>(null)
const locationAccuracy = ref<number | null>(null)
const mapRef = ref()
const map = ref<any>(null)
const watchId = ref<number | null>(null)
const shareTimer = ref<NodeJS.Timeout | null>(null)

// 语音对话相关
const isInCall = ref(false)
const isConnecting = ref(false)
const isMuted = ref(false)
const isSpeakerOn = ref(true) // 默认开启扬声器
const callDuration = ref(0)
const callTimer = ref<NodeJS.Timeout | null>(null)
const voiceQuality = ref(4) // 语音质量 1-4
const localStream = ref<MediaStream | null>(null)
const peerConnection = ref<RTCPeerConnection | null>(null)

// 地图中心点
const mapCenter = computed(() => {
  if (currentLocation.value) {
    return [currentLocation.value.lng, currentLocation.value.lat]
  }
  return [116.397428, 39.90923] // 默认北京
})

// 所有标记点（包括自己和其他参与者）
const allMarkers = computed(() => {
  const markers: MapLocation[] = []

  // 添加自己的位置
  if (currentLocation.value) {
    markers.push({
      ...currentLocation.value,
      name: '我的位置'
    })
  }

  // 添加其他参与者的位置
  props.participants.forEach(participant => {
    markers.push({
      ...participant.location,
      name: participant.name
    })
  })

  return markers
})

// 地图准备就绪
const onMapReady = (mapInstance: any) => {
  map.value = mapInstance
  console.log('✅ 实时位置共享地图准备就绪')
}

// 位置变化处理
const onLocationChange = (location: MapLocation) => {
  console.log('📍 地图位置变化:', location)
}

// 开始/停止位置共享
const toggleSharing = async () => {
  if (isSharing.value) {
    stopSharing()
  } else {
    await startSharing()
  }
}

// 开始位置共享
const startSharing = async () => {
  try {
    // 获取当前位置
    const location = await getCurrentPosition()
    currentLocation.value = location
    isSharing.value = true

    // 开始定期更新位置
    startLocationTracking()

    // 自动开始语音对话
    await initVoiceCall()

    // 设置自动停止定时器
    if (props.duration > 0) {
      shareTimer.value = setTimeout(() => {
        stopSharing()
      }, props.duration * 60 * 1000)
    }

    emit('sharing-start', location)
    console.log('✅ 开始位置共享和语音对话')
  } catch (error) {
    console.error('❌ 开始位置共享失败:', error)
  }
}

// 停止位置共享
const stopSharing = () => {
  isSharing.value = false

  // 停止位置追踪
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }

  // 停止语音对话
  endVoiceCall()

  // 清除定时器
  if (shareTimer.value) {
    clearTimeout(shareTimer.value)
    shareTimer.value = null
  }

  emit('sharing-stop')
  console.log('✅ 停止位置共享和语音对话')
}

// 初始化语音对话
const initVoiceCall = async () => {
  try {
    isConnecting.value = true

    // 获取用户媒体权限
    localStream.value = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    })

    // 创建 WebRTC 连接
    peerConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // 添加本地音频流
    localStream.value.getTracks().forEach(track => {
      peerConnection.value?.addTrack(track, localStream.value!)
    })

    // 处理远程音频流
    peerConnection.value.ontrack = (event) => {
      const remoteAudio = new Audio()
      remoteAudio.srcObject = event.streams[0]
      remoteAudio.play()
    }

    // 连接状态监听
    peerConnection.value.onconnectionstatechange = () => {
      const state = peerConnection.value?.connectionState
      if (state === 'connected') {
        isConnecting.value = false
        isInCall.value = true
        startCallTimer()
        console.log('✅ 语音对话连接成功')
      } else if (state === 'disconnected' || state === 'failed') {
        isInCall.value = false
        isConnecting.value = false
        console.log('❌ 语音对话连接断开')
      }
    }

    // 模拟连接成功（实际项目中需要信令服务器）
    setTimeout(() => {
      isConnecting.value = false
      isInCall.value = true
      startCallTimer()
      console.log('✅ 语音对话已连接（模拟）')
    }, 2000)

  } catch (error) {
    console.error('❌ 初始化语音对话失败:', error)
    isConnecting.value = false
  }
}

// 结束语音对话
const endVoiceCall = () => {
  isInCall.value = false
  isConnecting.value = false

  // 停止通话计时器
  if (callTimer.value) {
    clearInterval(callTimer.value)
    callTimer.value = null
    callDuration.value = 0
  }

  // 关闭媒体流
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }

  // 关闭 WebRTC 连接
  if (peerConnection.value) {
    peerConnection.value.close()
    peerConnection.value = null
  }

  console.log('✅ 语音对话已结束')
}

// 重新连接语音
const reconnectVoice = async () => {
  await initVoiceCall()
}

// 切换静音
const toggleMute = () => {
  if (localStream.value) {
    const audioTrack = localStream.value.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = isMuted.value
      isMuted.value = !isMuted.value
      console.log(`🔇 ${isMuted.value ? '已静音' : '取消静音'}`)
    }
  }
}

// 切换扬声器
const toggleSpeaker = () => {
  isSpeakerOn.value = !isSpeakerOn.value
  // 在实际项目中，这里需要调用原生API来控制扬声器
  console.log(`🔊 ${isSpeakerOn.value ? '开启扬声器' : '关闭扬声器'}`)
}

// 开始通话计时
const startCallTimer = () => {
  callTimer.value = setInterval(() => {
    callDuration.value++
  }, 1000)
}

// 格式化通话时长
const formatCallDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取语音质量文本
const getQualityText = (quality: number): string => {
  switch (quality) {
    case 4: return '优秀'
    case 3: return '良好'
    case 2: return '一般'
    case 1: return '较差'
    default: return '未知'
  }
}

// 获取当前位置
const getCurrentPosition = (): Promise<MapLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude, accuracy } = position.coords
        locationAccuracy.value = accuracy

        try {
          // 逆地理编码获取地址信息
          const location = await mapService.reverseGeocode(longitude, latitude)
          resolve(location)
        } catch (error) {
          // 如果逆地理编码失败，返回基本位置信息
          resolve({
            lng: longitude,
            lat: latitude,
            address: `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`
          })
        }
      },
      (error) => {
        reject(new Error('定位失败: ' + error.message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 开始位置追踪
const startLocationTracking = () => {
  if (!navigator.geolocation) return

  watchId.value = navigator.geolocation.watchPosition(
    async (position) => {
      const { longitude, latitude, accuracy } = position.coords
      locationAccuracy.value = accuracy

      try {
        const location = await mapService.reverseGeocode(longitude, latitude)
        currentLocation.value = location
        emit('location-update', location)
      } catch (error) {
        console.error('❌ 位置更新失败:', error)
      }
    },
    (error) => {
      console.error('❌ 位置追踪失败:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    }
  )
}

// 聚焦到参与者位置
const focusOnParticipant = (participant: Participant) => {
  if (map.value) {
    mapService.setCenter(
      participant.location.lng,
      participant.location.lat,
      16
    )
  }
}

// 导航到参与者位置
const navigateToParticipant = (participant: Participant) => {
  const amapUrl = `https://uri.amap.com/navigation?to=${participant.location.lng},${participant.location.lat},${encodeURIComponent(participant.name)}&mode=car&policy=1&src=叶语`

  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.location.href = amapUrl
  } else {
    window.open(amapUrl, '_blank')
  }
}

// 居中到我的位置
const centerOnMyLocation = () => {
  if (currentLocation.value && map.value) {
    mapService.setCenter(
      currentLocation.value.lng,
      currentLocation.value.lat,
      16
    )
  }
}

// 邀请成员
const inviteMembers = () => {
  emit('invite-members')
}

// 分享位置链接
const shareLocationLink = async () => {
  if (!currentLocation.value) return

  const shareUrl = `https://uri.amap.com/marker?position=${currentLocation.value.lng},${currentLocation.value.lat}&name=实时位置&src=叶语`

  try {
    if (navigator.share) {
      await navigator.share({
        title: '实时位置分享',
        text: currentLocation.value.address,
        url: shareUrl
      })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      console.log('✅ 位置链接已复制')
    }
  } catch (error) {
    console.error('❌ 分享失败:', error)
  }
}

// 格式化更新时间
const formatUpdateTime = (time: Date): string => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  return time.toLocaleDateString()
}

// 格式化距离
const formatDistance = (distance: number): string => {
  return MAP_UTILS.formatDistance(distance)
}

// 计算参与者距离
watch([currentLocation, () => props.participants], () => {
  if (currentLocation.value) {
    props.participants.forEach(participant => {
      participant.distance = MAP_UTILS.getDistance(
        [currentLocation.value!.lng, currentLocation.value!.lat],
        [participant.location.lng, participant.location.lat]
      )
    })
  }
}, { deep: true })

onUnmounted(() => {
  stopSharing()
})
</script>

<style scoped>
.live-location-share {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background 0.3s;
}

.status-indicator.active {
  background: #07C160;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.share-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.share-btn:hover {
  background: #06AD56;
}

.share-btn.active {
  background: #ff4757;
}

.share-btn.active:hover {
  background: #ff3838;
}

/* 语音对话控制栏样式 */
.voice-call-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.call-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.call-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.call-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  transition: all 0.3s;
}

.call-indicator.active {
  background: #00ff88;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.call-indicator.connecting {
  background: #ffa500;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.call-controls {
  display: flex;
  gap: 8px;
}

.call-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.call-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.call-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.call-btn.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.call-btn.reconnect {
  background: #07C160;
}

.call-btn.reconnect:hover {
  background: #06AD56;
}

.btn-text {
  font-size: 11px;
  white-space: nowrap;
}

.voice-quality {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.quality-bars {
  display: flex;
  gap: 2px;
  align-items: end;
}

.bar {
  width: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background 0.3s;
}

.bar:nth-child(1) { height: 8px; }
.bar:nth-child(2) { height: 12px; }
.bar:nth-child(3) { height: 16px; }
.bar:nth-child(4) { height: 20px; }

.bar.active {
  background: #00ff88;
  box-shadow: 0 0 4px rgba(0, 255, 136, 0.5);
}

.quality-text {
  font-size: 11px;
  opacity: 0.8;
}

.map-container {
  position: relative;
  flex: 1;
}

.accuracy-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 1000;
}

.participants {
  background: white;
  border-top: 1px solid #eee;
  max-height: 200px;
  overflow-y: auto;
}

.section-title {
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.participant-list {
  padding: 0 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.participant-item:hover {
  background: #f8f8f8;
}

.participant-item:last-child {
  border-bottom: none;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.distance {
  color: #07C160;
  font-weight: 500;
}

.participant-actions {
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: #1890ff;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #1677ff;
}

.footer-actions {
  display: flex;
  padding: 16px;
  gap: 12px;
  background: #f8f8f8;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  background: white;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #07C160;
  color: #07C160;
}
</style>

<style scoped>
.live-location-share {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background 0.3s;
}

.status-indicator.active {
  background: #07C160;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.share-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.share-btn:hover {
  background: #06AD56;
}

.share-btn.active {
  background: #ff4757;
}

.share-btn.active:hover {
  background: #ff3838;
}

.map-container {
  position: relative;
  flex: 1;
}

.accuracy-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 1000;
}

.participants {
  background: white;
  border-top: 1px solid #eee;
  max-height: 200px;
  overflow-y: auto;
}

.section-title {
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.participant-list {
  padding: 0 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.participant-item:hover {
  background: #f8f8f8;
}

.participant-item:last-child {
  border-bottom: none;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.distance {
  color: #07C160;
  font-weight: 500;
}

.participant-actions {
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: #1890ff;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #1677ff;
}

.footer-actions {
  display: flex;
  padding: 16px;
  gap: 12px;
  background: #f8f8f8;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  background: white;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #07C160;
  color: #07C160;
}
</style>

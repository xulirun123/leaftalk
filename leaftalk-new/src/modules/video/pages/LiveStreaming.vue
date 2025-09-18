<template>
  <div class="live-streaming">
    <!-- 直播列表 -->
    <div v-if="!currentLive" class="live-list">
      <!-- 顶部导航 -->
      <div class="top-bar">
        <button class="back-btn" @click="goBack">
          <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
        </button>
        <h1 class="title">直播</h1>
        <button class="create-btn" @click="showCreateLive">
          <iconify-icon icon="heroicons:plus" width="24" style="color: white;"></iconify-icon>
        </button>
      </div>

      <!-- 直播分类 -->
      <div class="live-categories">
        <button
          v-for="category in liveCategories"
          :key="category.key"
          :class="['category-btn', { active: activeCategory === category.key }]"
          @click="activeCategory = category.key"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- 直播列表 -->
      <div class="live-grid">
        <div
          v-for="live in filteredLives"
          :key="live.id"
          class="live-card"
          @click="enterLive(live)"
        >
          <div class="live-preview">
            <img :src="live.thumbnail" :alt="live.title" />
            <div class="live-status">
              <span class="live-indicator">LIVE</span>
              <span class="viewer-count">{{ formatNumber(live.viewerCount) }}</span>
            </div>
          </div>
          <div class="live-info">
            <div class="streamer-avatar">
              <img :src="live.streamerAvatar" :alt="live.streamerName" />
            </div>
            <div class="live-details">
              <h3 class="live-title">{{ live.title }}</h3>
              <p class="streamer-name">{{ live.streamerName }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 直播间 -->
    <div v-else class="live-room">
      <div class="live-video-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
        <video
          ref="liveVideo"
          :src="currentLive.streamUrl"
          autoplay
          muted
          playsinline
          class="live-video"
        ></video>
      
      <!-- 直播状态覆盖层 -->
      <div class="streaming-overlay">
        <!-- 顶部状态栏 -->
        <div class="top-status">
          <div class="live-indicator">
            <div class="live-dot"></div>
            <span>{{ $t('live.live') }}</span>
          </div>
          
          <div class="stream-info">
            <div class="viewer-count">
              <iconify-icon icon="heroicons:eye" width="16" />
              <span>{{ viewerCount }}</span>
            </div>
            <div class="stream-duration">{{ formatDuration(streamDuration) }}</div>
          </div>
          
          <button @click="showStreamSettings" class="settings-btn">
            <iconify-icon icon="heroicons:cog-6-tooth" width="20" style="color: white;" />
          </button>
        </div>

        <!-- 直播信息 -->
        <div class="stream-title-overlay">
          <h2>{{ streamConfig.title }}</h2>
          <p v-if="streamConfig.description">{{ streamConfig.description }}</p>
        </div>

        <!-- 实时统计 -->
        <div class="live-stats">
          <div class="stat-item">
            <iconify-icon icon="heroicons:heart" width="16" />
            <span>{{ likeCount }}</span>
          </div>
          <div class="stat-item">
            <iconify-icon icon="heroicons:chat-bubble-left" width="16" />
            <span>{{ messageCount }}</span>
          </div>
          <div class="stat-item">
            <iconify-icon icon="heroicons:signal" width="16" />
            <span class="quality-indicator" :class="streamQuality">{{ streamQuality }}</span>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 聊天消息流 -->
    <div class="chat-stream">
      <div 
        v-for="message in recentMessages"
        :key="message.id"
        class="floating-message"
        :style="{ animationDelay: message.delay + 'ms' }"
      >
        <span class="message-user">{{ message.user.name }}:</span>
        <span class="message-content">{{ message.content }}</span>
      </div>
    </div>

    <!-- 礼物特效区域 -->
    <div class="gift-effects">
      <div 
        v-for="effect in activeEffects"
        :key="effect.id"
        class="gift-effect"
        :class="effect.type"
      >
        <div class="effect-content">
          <span class="effect-icon">{{ effect.icon }}</span>
          <div class="effect-text">
            <div class="effect-user">{{ effect.user }}</div>
            <div class="effect-gift">{{ effect.giftName }} x{{ effect.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="streaming-controls">
      <button 
        @click="toggleMute" 
        class="control-btn"
        :class="{ active: isMuted }"
      >
        <iconify-icon 
          :icon="isMuted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" 
          width="24" 
        />
      </button>

      <button 
        @click="toggleCamera" 
        class="control-btn"
        :class="{ active: !isCameraOn }"
      >
        <iconify-icon 
          :icon="isCameraOn ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" 
          width="24" 
        />
      </button>

      <button @click="switchCamera" class="control-btn">
        <iconify-icon icon="heroicons:arrow-path" width="24" />
      </button>

      <button @click="showFilters" class="control-btn">
        <iconify-icon icon="heroicons:sparkles" width="24" />
      </button>

      <button @click="confirmEndStream" class="control-btn end-stream">
        <iconify-icon icon="heroicons:stop" width="24" />
      </button>
    </div>

    <!-- 滤镜面板 -->
    <div v-if="showFilterPanel" class="filter-panel-overlay" @click="closeFilterPanel">
      <div class="filter-panel" @click.stop>
        <div class="filter-header">
          <h3>{{ $t('live.filters') }}</h3>
          <button @click="closeFilterPanel" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="filter-list">
          <div 
            v-for="filter in filters"
            :key="filter.id"
            class="filter-item"
            :class="{ active: currentFilter === filter.id }"
            @click="applyFilter(filter.id)"
          >
            <div class="filter-preview" :style="{ filter: filter.css }">
              <div class="preview-content">{{ filter.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 直播设置面板 -->
    <div v-if="showSettings" class="settings-overlay" @click="closeSettings">
      <div class="settings-panel" @click.stop>
        <div class="settings-header">
          <h3>{{ $t('live.streamSettings') }}</h3>
          <button @click="closeSettings" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="settings-content">
          <div class="setting-group">
            <label>{{ $t('live.videoQuality') }}</label>
            <select v-model="videoQuality" @change="updateVideoQuality">
              <option value="720p">720p (推荐)</option>
              <option value="480p">480p (流畅)</option>
              <option value="1080p">1080p (高清)</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label>{{ $t('live.bitrate') }}</label>
            <input 
              v-model="bitrate" 
              type="range" 
              min="500" 
              max="5000" 
              step="100"
              @input="updateBitrate"
            />
            <span>{{ bitrate }} kbps</span>
          </div>
          
          <div class="setting-group">
            <label>{{ $t('live.frameRate') }}</label>
            <select v-model="frameRate" @change="updateFrameRate">
              <option value="15">15 FPS</option>
              <option value="24">24 FPS</option>
              <option value="30">30 FPS (推荐)</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 结束直播确认 -->
    <div v-if="showEndConfirm" class="end-confirm-overlay">
      <div class="end-confirm-modal">
        <div class="confirm-icon">
          <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #ff6b6b;" />
        </div>
        <h3>{{ $t('live.endStreamConfirm') }}</h3>
        <p>{{ $t('live.endStreamWarning') }}</p>
        
        <div class="stream-summary">
          <div class="summary-item">
            <span>{{ $t('live.duration') }}</span>
            <span>{{ formatDuration(streamDuration) }}</span>
          </div>
          <div class="summary-item">
            <span>{{ $t('live.maxViewers') }}</span>
            <span>{{ maxViewers }}</span>
          </div>
          <div class="summary-item">
            <span>{{ $t('live.totalLikes') }}</span>
            <span>{{ likeCount }}</span>
          </div>
        </div>
        
        <div class="confirm-actions">
          <button @click="cancelEndStream" class="cancel-btn">
            {{ $t('common.cancel') }}
          </button>
          <button @click="endStream" class="confirm-btn">
            {{ $t('live.endStream') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../../shared/stores/appStore'
import { liveStreamManager, type LiveMessage } from '../../utils/liveStream'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

// 响应式数据
const localVideo = ref<HTMLVideoElement>()
const viewerCount = ref(0)
const streamDuration = ref(0)
const likeCount = ref(0)
const messageCount = ref(0)
const maxViewers = ref(0)
const streamQuality = ref<'excellent' | 'good' | 'poor'>('good')
const isMuted = ref(false)
const isCameraOn = ref(true)
const showFilterPanel = ref(false)
const showSettings = ref(false)
const showEndConfirm = ref(false)
const currentFilter = ref('none')
const videoQuality = ref('720p')
const bitrate = ref(2500)
const frameRate = ref(30)

// 直播配置
const streamConfig = ref({
  title: '我的直播间',
  description: '欢迎来到我的直播间'
})

// 消息和特效
const recentMessages = ref<any[]>([])
const activeEffects = ref<any[]>([])

// 滤镜列表
const filters = ref([
  { id: 'none', name: '无滤镜', css: 'none' },
  { id: 'warm', name: '暖色调', css: 'sepia(0.3) saturate(1.2)' },
  { id: 'cool', name: '冷色调', css: 'hue-rotate(180deg) saturate(1.1)' },
  { id: 'vintage', name: '复古', css: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
  { id: 'bright', name: '明亮', css: 'brightness(1.2) contrast(1.1)' },
  { id: 'dramatic', name: '戏剧性', css: 'contrast(1.5) saturate(1.3)' }
])

// 定时器
let durationTimer: number | null = null

// 方法
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleMute = () => {
  isMuted.value = liveStreamManager.toggleMute()
}

const toggleCamera = () => {
  isCameraOn.value = !liveStreamManager.toggleCamera()
}

const switchCamera = async () => {
  try {
    await liveStreamManager.switchCamera()
  } catch (error) {
    appStore.showToast(t('live.switchCameraFailed'), 'error')
  }
}

const showFilters = () => {
  showFilterPanel.value = true
}

const closeFilterPanel = () => {
  showFilterPanel.value = false
}

const applyFilter = (filterId: string) => {
  currentFilter.value = filterId
  const filter = filters.value.find(f => f.id === filterId)
  
  if (localVideo.value && filter) {
    localVideo.value.style.filter = filter.css
  }
  
  closeFilterPanel()
}

const showStreamSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const updateVideoQuality = () => {
  // 更新视频质量设置
  console.log('Video quality updated:', videoQuality.value)
}

const updateBitrate = () => {
  // 更新比特率设置
  console.log('Bitrate updated:', bitrate.value)
}

const updateFrameRate = () => {
  // 更新帧率设置
  console.log('Frame rate updated:', frameRate.value)
}

const confirmEndStream = () => {
  showEndConfirm.value = true
}

const cancelEndStream = () => {
  showEndConfirm.value = false
}

const endStream = () => {
  liveStreamManager.stopStreaming()
  router.push('/live')
}

const startDurationTimer = () => {
  durationTimer = setInterval(() => {
    streamDuration.value++
  }, 1000)
}

const stopDurationTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
}

// 事件监听
const handleViewerCountUpdate = (count: number) => {
  viewerCount.value = count
  maxViewers.value = Math.max(maxViewers.value, count)
}

const handleStreamQualityUpdate = (quality: string) => {
  streamQuality.value = quality as 'excellent' | 'good' | 'poor'
}

const handleMessage = (message: LiveMessage) => {
  messageCount.value++
  
  // 显示聊天消息
  if (message.type === 'chat') {
    const floatingMessage = {
      id: message.id,
      user: message.user,
      content: message.content,
      delay: 0
    }
    
    recentMessages.value.push(floatingMessage)
    
    // 5秒后移除消息
    setTimeout(() => {
      const index = recentMessages.value.findIndex(m => m.id === message.id)
      if (index > -1) {
        recentMessages.value.splice(index, 1)
      }
    }, 5000)
  }
  
  // 处理礼物特效
  if (message.type === 'gift' && message.gift) {
    const effect = {
      id: Date.now() + Math.random(),
      type: message.gift.animation,
      icon: message.gift.icon,
      user: message.user.name,
      giftName: message.gift.name,
      count: message.gift.count
    }
    
    activeEffects.value.push(effect)
    
    // 5秒后移除特效
    setTimeout(() => {
      const index = activeEffects.value.findIndex(e => e.id === effect.id)
      if (index > -1) {
        activeEffects.value.splice(index, 1)
      }
    }, 5000)
  }
  
  // 处理点赞
  if (message.type === 'like') {
    likeCount.value++
  }
}

// 生命周期
onMounted(async () => {
  // 监听直播事件
  liveStreamManager.on('viewer_count_updated', handleViewerCountUpdate)
  liveStreamManager.on('stream_quality_updated', handleStreamQualityUpdate)
  liveStreamManager.on('message_received', handleMessage)
  
  // 开始计时
  startDurationTimer()
  
  // 设置本地视频流
  const localStream = liveStreamManager.getLocalStream()
  if (localVideo.value && localStream) {
    localVideo.value.srcObject = localStream
  }
  
  // 模拟一些初始数据
  viewerCount.value = Math.floor(Math.random() * 100) + 10
  maxViewers.value = viewerCount.value
})

onUnmounted(() => {
  stopDurationTimer()
  liveStreamManager.off('viewer_count_updated', handleViewerCountUpdate)
  liveStreamManager.off('stream_quality_updated', handleStreamQualityUpdate)
  liveStreamManager.off('message_received', handleMessage)
})
</script>

<style scoped>
.live-streaming {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
}

.video-preview {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* 镜像显示 */
}

.streaming-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.streaming-overlay > * {
  pointer-events: auto;
}

.top-status {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 10;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 68, 68, 0.9);
  border-radius: 16px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stream-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 12px;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}

.stream-duration {
  font-weight: 500;
}

.settings-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.stream-title-overlay {
  position: absolute;
  bottom: 120px;
  left: 16px;
  right: 16px;
  color: white;
  z-index: 10;
}

.stream-title-overlay h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.stream-title-overlay p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.live-stats {
  position: absolute;
  top: 80px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  color: white;
  font-size: 12px;
}

.quality-indicator.excellent {
  color: #07c160;
}

.quality-indicator.good {
  color: #faad14;
}

.quality-indicator.poor {
  color: #ff6b6b;
}

.chat-stream {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 60%;
  z-index: 15;
}

.floating-message {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  animation: messageFloat 5s ease-out forwards;
}

@keyframes messageFloat {
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  10% {
    transform: translateX(0);
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.message-user {
  font-weight: 500;
  margin-right: 4px;
}

.gift-effects {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  z-index: 15;
}

.gift-effect {
  margin-bottom: 12px;
  animation: giftEffect 5s ease-out forwards;
}

@keyframes giftEffect {
  0% {
    transform: translateX(100px) scale(0);
    opacity: 0;
  }
  20% {
    transform: translateX(0) scale(1.2);
    opacity: 1;
  }
  40% {
    transform: scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

.effect-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ff6b6b, #faad14);
  border-radius: 20px;
  color: white;
}

.effect-icon {
  font-size: 20px;
}

.effect-text {
  font-size: 12px;
}

.effect-user {
  font-weight: 500;
}

.effect-gift {
  opacity: 0.9;
}

.streaming-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
}

.control-btn {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.control-btn.active {
  background: rgba(255, 68, 68, 0.8);
}

.control-btn.end-stream {
  background: #ff4444;
}

.control-btn.end-stream:hover {
  background: #cc3333;
}

/* 面板样式 */
.filter-panel-overlay, .settings-overlay, .end-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.filter-panel, .settings-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.filter-header, .settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.filter-header h3, .settings-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.filter-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px;
}

.filter-item {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-item.active {
  border-color: #07c160;
}

.filter-preview {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.settings-content {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.setting-group select,
.setting-group input[type="range"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  outline: none;
}

.end-confirm-modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.confirm-icon {
  margin-bottom: 16px;
}

.end-confirm-modal h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.end-confirm-modal p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.stream-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #ff4444;
  color: white;
}

.confirm-btn:hover {
  background: #cc3333;
}
</style>

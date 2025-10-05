<template>
  <div class="chat-search-video">
    <MobileTopBar 
      title="视频" 
      :show-back="true"
      @back="goBack"
      class="dark-theme-bar"
    />
    
    <div class="page-content">
      <div v-if="isLoading" class="loading-container">
        <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="loading-icon"></iconify-icon>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="monthsData.length === 0" class="empty-container">
        <iconify-icon icon="heroicons:video-camera" width="48" color="#666"></iconify-icon>
        <p>没有视频消息</p>
      </div>
      
      <div v-else class="videos-scroll-area">
        <div v-for="monthData in monthsData" :key="monthData.key" class="month-section">
          <div class="month-title">{{ monthData.title }}</div>
          <div class="video-grid">
            <div v-for="video in monthData.videos" :key="video.id" class="video-item" @click="openVideo(video)">
              <div class="video-thumbnail">
                <img :src="video.thumbnailUrl" :alt="video.content" />
                <div class="play-icon">
                  <iconify-icon icon="heroicons:play-circle" width="32" color="white"></iconify-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频预览 -->
    <div v-if="showPreview" class="media-preview-overlay" @click="closePreview">
      <button class="preview-close-btn" @click.stop="closePreview" aria-label="关闭">✕</button>
      <div class="preview-video-wrap" @click.stop="togglePreviewPlayback">
        <video ref="previewVideoRef" :src="previewSrc" class="preview-video" playsinline></video>
        <button v-if="!isPreviewPlaying" class="preview-play-btn" aria-label="播放">▶</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'
import { messagePersistenceService } from '@/modules/chat/services/messagePersistenceService'

const router = useRouter()
const route = useRoute()

const isLoading = ref(true)
const videoMessages = ref<any[]>([])
const showPreview = ref(false)
const previewSrc = ref('')
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const isPreviewPlaying = ref(false)

// 辅助函数
const getToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const formatMonthKey = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

// 加载视频消息
const loadVideoMessages = async () => {
  try {
    isLoading.value = true
    const chatId = route.params.chatId as string
    
    if (!chatId) {
      console.warn('⚠️ 没有提供 chatId')
      return
    }
    
    console.log('🎬 开始加载视频消息，chatId:', chatId)
    
    const messages = await messagePersistenceService.getLatestMessages(chatId, 1000)

    if (!messages || messages.length === 0) {
      console.log('📭 该会话没有消息记录')
      videoMessages.value = []
      return
    }

    console.log('📨 加载到消息数量:', messages.length)

    // 打印所有消息类型用于调试
    const messageTypes = messages.map(msg => msg.type)
    console.log('📋 所有消息类型:', [...new Set(messageTypes)])

    const videos = messages.filter(msg => {
      if (msg.type !== 'video') return false
      const timestamp = Number(msg.timestamp)
      if (!timestamp) return false
      return true
    })

    console.log('🎬 视频消息数量:', videos.length)
    if (videos.length > 0) {
      console.log('🎬 第一个视频示例:', videos[0])
    }
    videoMessages.value = videos
  } catch (error) {
    console.error('❌ 加载视频消息失败:', error)
    videoMessages.value = []
  } finally {
    isLoading.value = false
  }
}

// 计算属性 - 按月份分组视频（倒序）
const monthsData = computed(() => {
  if (videoMessages.value.length === 0) return []
  
  const monthsMap = new Map<string, any[]>()
  
  videoMessages.value.forEach(msg => {
    const timestamp = Number(msg.timestamp)
    const date = new Date(timestamp)
    const monthKey = formatMonthKey(date)
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, [])
    }
    
    monthsMap.get(monthKey)!.push({
      id: msg.id,
      videoUrl: msg.content,
      thumbnailUrl: msg.content, // TODO: 实际应该有缩略图字段
      timestamp: timestamp,
      senderId: msg.senderId,
      content: msg.content
    })
  })
  
  const months: any[] = []
  const sortedKeys = Array.from(monthsMap.keys()).sort().reverse()
  
  sortedKeys.forEach(key => {
    const [year, month] = key.split('-')
    const videos = monthsMap.get(key)!
    videos.sort((a, b) => b.timestamp - a.timestamp)
    
    months.push({
      key: key,
      title: `${year}年${parseInt(month)}月`,
      videos: videos
    })
  })
  
  console.log('📅 按月份分组的视频数据:', months)
  
  return months
})

const goBack = () => {
  router.back()
}

const openVideo = (video: any) => {
  console.log('🎬 打开视频:', video)
  previewSrc.value = video.videoUrl
  showPreview.value = true
  isPreviewPlaying.value = false

  nextTick(() => {
    if (previewVideoRef.value) {
      previewVideoRef.value.play()
      isPreviewPlaying.value = true
    }
  })
}

const closePreview = () => {
  if (previewVideoRef.value) {
    previewVideoRef.value.pause()
    previewVideoRef.value.currentTime = 0
  }
  showPreview.value = false
  previewSrc.value = ''
  isPreviewPlaying.value = false
}

const togglePreviewPlayback = () => {
  if (!previewVideoRef.value) return

  if (isPreviewPlaying.value) {
    previewVideoRef.value.pause()
    isPreviewPlaying.value = false
  } else {
    previewVideoRef.value.play()
    isPreviewPlaying.value = true
  }
}

onMounted(async () => {
  await loadVideoMessages()
})
</script>

<style scoped>
.chat-search-video {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
}

/* 深色主题导航栏 */
.chat-search-video :deep(.dark-theme-bar) {
  background: #1a1a1a !important;
}

.chat-search-video :deep(.dark-theme-bar .status-bar) {
  background: #1a1a1a !important;
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .status-bar .time) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .status-bar .battery) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .status-bar iconify-icon) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .status-icons iconify-icon) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .nav-bar) {
  background: #1a1a1a !important;
}

.chat-search-video :deep(.dark-theme-bar .nav-title) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .back-btn) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .back-btn iconify-icon) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .action-btn) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .action-btn iconify-icon) {
  color: white !important;
}

.chat-search-video :deep(.dark-theme-bar .action-text) {
  color: #07C160 !important;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a1a;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.loading-container p {
  color: #999;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-container p {
  font-size: 15px;
  color: #999;
}

.videos-scroll-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 0;
}

.month-section {
  margin-bottom: 24px;
}

.month-title {
  font-size: 14px;
  color: #aaa;
  padding: 0 16px 12px 16px;
  text-align: left;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: 0 2px;
}

.video-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #2a2a2a;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.video-item:active .video-thumbnail img {
  transform: scale(0.95);
}

/* 视频预览 */
.media-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  transition: background 0.2s;
}

.preview-close-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.preview-video-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 90%;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  background: #000;
}

.preview-play-btn {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-play-btn:active {
  background: rgba(0, 0, 0, 0.7);
}
</style>


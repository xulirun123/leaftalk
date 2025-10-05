<template>
  <div class="chat-search-image">
    <!-- 统一顶部导航栏 - 深色主题 -->
    <MobileTopBar
      title="图片"
      :show-back="true"
      @back="goBack"
      class="dark-theme-bar"
    />

    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="loading-icon"></iconify-icon>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="monthsData.length === 0" class="empty-container">
        <iconify-icon icon="heroicons:photo" width="48" color="#666"></iconify-icon>
        <p>最近三个月没有图片消息</p>
      </div>

      <!-- 按月份显示图片 -->
      <div v-else class="images-scroll-area">
        <div
          v-for="monthData in monthsData"
          :key="monthData.key"
          class="month-section"
        >
          <!-- 月份标题 -->
          <div class="month-title">{{ monthData.title }}</div>

          <!-- 图片网格 - 一排4张 -->
          <div class="image-grid">
            <div
              v-for="image in monthData.images"
              :key="image.id"
              class="image-item"
              @click="openImage(image)"
            >
              <img :src="image.imageUrl" :alt="image.content" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="showPreview" class="media-preview-overlay" @click="closePreview">
      <button class="preview-close-btn" @click.stop="closePreview" aria-label="关闭">✕</button>
      <img :src="previewSrc" class="preview-image" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'
import { messagePersistenceService } from '@/modules/chat/services/messagePersistenceService'

const router = useRouter()
const route = useRoute()

const isLoading = ref(true)
const imageMessages = ref<any[]>([])
const showPreview = ref(false)
const previewSrc = ref('')

// 获取今天的日期（只包含年月日）
const getToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 格式化日期为 YYYY-MM
const formatMonthKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 从数据库加载真实的图片消息
const loadImageMessages = async () => {
  try {
    isLoading.value = true
    const chatId = route.params.chatId as string

    if (!chatId) {
      console.warn('⚠️ 没有提供 chatId')
      return
    }

    console.log('🖼️ 开始加载图片消息，chatId:', chatId)

    // 从持久化服务加载该会话的所有消息
    const messages = await messagePersistenceService.getLatestMessages(chatId, 1000)

    if (!messages || messages.length === 0) {
      console.log('📭 该会话没有消息记录')
      imageMessages.value = []
      return
    }

    console.log('📨 加载到消息数量:', messages.length)

    // 过滤出图片类型的消息
    const now = getToday()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1) // 三个月前的第一天

    const images = messages.filter(msg => {
      // 只保留图片类型的消息
      if (msg.type !== 'image') return false

      const timestamp = Number(msg.timestamp)
      if (!timestamp) return false

      const date = new Date(timestamp)

      // 只统计最近三个月的消息
      return date >= threeMonthsAgo && date <= now
    })

    console.log('🖼️ 最近三个月的图片消息数量:', images.length)

    imageMessages.value = images
  } catch (error) {
    console.error('❌ 加载图片消息失败:', error)
    imageMessages.value = []
  } finally {
    isLoading.value = false
  }
}

// 计算属性 - 按月份分组图片（倒序）
const monthsData = computed(() => {
  if (imageMessages.value.length === 0) return []

  // 按月份分组
  const monthsMap = new Map<string, any[]>()

  imageMessages.value.forEach(msg => {
    const timestamp = Number(msg.timestamp)
    const date = new Date(timestamp)
    const monthKey = formatMonthKey(date)

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, [])
    }

    monthsMap.get(monthKey)!.push({
      id: msg.id,
      imageUrl: msg.content, // 图片URL存储在content字段
      timestamp: timestamp,
      senderId: msg.senderId,
      content: msg.content
    })
  })

  // 转换为数组并按月份倒序排列
  const months: any[] = []
  const sortedKeys = Array.from(monthsMap.keys()).sort().reverse() // 倒序

  sortedKeys.forEach(key => {
    const [year, month] = key.split('-')
    const images = monthsMap.get(key)!

    // 按时间倒序排列图片
    images.sort((a, b) => b.timestamp - a.timestamp)

    months.push({
      key: key,
      title: `${year}年${parseInt(month)}月`,
      images: images
    })
  })

  console.log('📅 按月份分组的图片数据:', months)

  return months
})

// 方法
const goBack = () => {
  router.back()
}

const openImage = (image: any) => {
  console.log('🖼️ 打开图片:', image)
  previewSrc.value = image.imageUrl
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewSrc.value = ''
}

// 生命周期
onMounted(async () => {
  await loadImageMessages()
})
</script>

<style scoped>
.chat-search-image {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a; /* 深色背景 */
}

/* 深色主题导航栏 - 只影响当前页面 */
.chat-search-image :deep(.dark-theme-bar) {
  background: #1a1a1a !important;
}

/* 状态栏样式 */
.chat-search-image :deep(.dark-theme-bar .status-bar) {
  background: #1a1a1a !important;
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .status-bar .time) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .status-bar .battery) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .status-bar iconify-icon) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .status-icons iconify-icon) {
  color: white !important;
}

/* 导航栏样式 */
.chat-search-image :deep(.dark-theme-bar .nav-bar) {
  background: #1a1a1a !important;
}

.chat-search-image :deep(.dark-theme-bar .nav-title) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .back-btn) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .back-btn iconify-icon) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .action-btn) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .action-btn iconify-icon) {
  color: white !important;
}

.chat-search-image :deep(.dark-theme-bar .action-text) {
  color: #07C160 !important;
}

/* 页面内容 */
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a1a; /* 深色背景 */
}

/* 加载状态 */
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

/* 空状态 */
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

/* 滚动区域 */
.images-scroll-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 0;
}

/* 月份区块 */
.month-section {
  margin-bottom: 24px;
}

/* 月份标题 */
.month-title {
  font-size: 14px;
  color: #aaa;
  padding: 0 16px 12px 16px;
  text-align: left;
}

/* 图片网格 - 一排4张 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: 0 2px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #2a2a2a;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.image-item:active img {
  transform: scale(0.95);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 图片预览 */
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

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
</style>


<template>
  <div class="live-browse">
    <!-- 直播列表 -->
    <div v-if="!currentLive" class="live-list">
      <!-- 顶部导航 -->
      <div class="top-bar">
        <button class="back-btn" @click="goBack">
          <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
        </button>
        <h1 class="title">直播</h1>
        <button class="create-btn" @click="goToCreateLive">
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
        
        <!-- 直播间顶部信息 -->
        <div class="live-room-header">
          <button class="close-btn" @click="exitLive">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
          </button>
          <div class="live-room-info">
            <div class="streamer-info">
              <img :src="currentLive.streamerAvatar" :alt="currentLive.streamerName" class="streamer-avatar-small" />
              <span class="streamer-name-small">{{ currentLive.streamerName }}</span>
              <button class="follow-btn" :class="{ following: isFollowing }" @click="toggleFollow">
                {{ isFollowing ? '已关注' : '关注' }}
              </button>
            </div>
            <div class="live-stats">
              <span class="viewer-count">{{ formatNumber(currentLive.viewerCount) }} 观看</span>
            </div>
          </div>
        </div>

        <!-- 直播间右侧功能 -->
        <div class="live-room-actions">
          <button class="action-btn" @click="toggleLike">
            <iconify-icon 
              :icon="isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
              width="32" 
              :style="{ color: isLiked ? '#ff4444' : 'white' }"
            ></iconify-icon>
            <span>{{ formatNumber(currentLive.likeCount) }}</span>
          </button>
          
          <button class="action-btn" @click="showComments">
            <iconify-icon icon="heroicons:chat-bubble-left" width="32" style="color: white;"></iconify-icon>
            <span>{{ formatNumber(currentLive.commentCount) }}</span>
          </button>
          
          <button class="action-btn" @click="shareLive">
            <iconify-icon icon="heroicons:share" width="32" style="color: white;"></iconify-icon>
            <span>分享</span>
          </button>
          
          <button class="action-btn" @click="sendGift">
            <iconify-icon icon="heroicons:gift" width="32" style="color: white;"></iconify-icon>
            <span>礼物</span>
          </button>

          <button class="action-btn" @click="requestMic">
            <iconify-icon icon="heroicons:microphone" width="32" style="color: white;"></iconify-icon>
            <span>连麦</span>
          </button>

          <button class="action-btn" @click="toggleBeauty">
            <iconify-icon icon="heroicons:sparkles" width="32" style="color: white;"></iconify-icon>
            <span>美颜</span>
          </button>
        </div>

        <!-- 直播间底部评论 -->
        <div class="live-room-bottom">
          <div class="live-comments">
            <div 
              v-for="comment in recentComments" 
              :key="comment.id"
              class="live-comment"
            >
              <span class="comment-user">{{ comment.userName }}:</span>
              <span class="comment-text">{{ comment.content }}</span>
            </div>
          </div>
          
          <div class="live-input-area">
            <input 
              v-model="commentText" 
              type="text" 
              placeholder="说点什么..." 
              class="comment-input"
              @keyup.enter="sendComment"
            />
            <button class="send-btn" @click="sendComment">发送</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 礼物面板 -->
    <div v-if="showGiftPanel" class="gift-panel-overlay" @click="hideGiftPanel">
      <div class="gift-panel" @click.stop>
        <h3>选择礼物</h3>
        <div class="gifts-grid">
          <div 
            v-for="gift in gifts" 
            :key="gift.id"
            class="gift-item"
            :class="{ selected: selectedGift?.id === gift.id }"
            @click="selectGift(gift)"
          >
            <img :src="gift.icon" :alt="gift.name" />
            <span class="gift-name">{{ gift.name }}</span>
            <span class="gift-price">{{ gift.price }}叶语币</span>
          </div>
        </div>
        <div class="gift-actions">
          <button class="cancel-btn" @click="hideGiftPanel">取消</button>
          <button class="send-gift-btn" @click="confirmSendGift" :disabled="!selectedGift">
            赠送礼物
          </button>
        </div>
      </div>
    </div>

    <!-- 连麦申请面板 -->
    <div v-if="showMicPanel" class="mic-panel-overlay" @click="hideMicPanel">
      <div class="mic-panel" @click.stop>
        <h3>申请连麦</h3>
        <p>向主播申请连麦互动</p>
        <div class="mic-actions">
          <button class="cancel-btn" @click="hideMicPanel">取消</button>
          <button class="request-btn" @click="confirmRequestMic">申请连麦</button>
        </div>
      </div>
    </div>

    <!-- 美颜设置面板 -->
    <div v-if="showBeautyPanel" class="beauty-panel-overlay" @click="hideBeautyPanel">
      <div class="beauty-panel" @click.stop>
        <h3>美颜设置</h3>
        <div class="beauty-controls">
          <div class="beauty-item">
            <label>美白</label>
            <input type="range" v-model="beautySettings.whitening" min="0" max="100" />
            <span>{{ beautySettings.whitening }}%</span>
          </div>
          <div class="beauty-item">
            <label>磨皮</label>
            <input type="range" v-model="beautySettings.smoothing" min="0" max="100" />
            <span>{{ beautySettings.smoothing }}%</span>
          </div>
          <div class="beauty-item">
            <label>瘦脸</label>
            <input type="range" v-model="beautySettings.faceSlim" min="0" max="100" />
            <span>{{ beautySettings.faceSlim }}%</span>
          </div>
        </div>
        <div class="beauty-actions">
          <button class="reset-btn" @click="resetBeauty">重置</button>
          <button class="apply-btn" @click="applyBeauty">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const currentLive = ref(null)
const activeCategory = ref('all')
const showGiftPanel = ref(false)
const showMicPanel = ref(false)
const showBeautyPanel = ref(false)
const isFollowing = ref(false)
const isLiked = ref(false)
const commentText = ref('')
const selectedGift = ref(null)

// 美颜设置
const beautySettings = ref({
  whitening: 30,
  smoothing: 20,
  faceSlim: 10
})

// 直播分类
const liveCategories = [
  { key: 'all', label: '全部' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'education', label: '教育' },
  { key: 'life', label: '生活' },
  { key: 'game', label: '游戏' },
  { key: 'music', label: '音乐' }
]

// 工具函数
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${color}"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">${initial}</text></svg>`
}

// 模拟直播数据
const liveStreams = ref([
  {
    id: 'live_001',
    title: '叶语企业版功能演示',
    streamerName: '小叶',
    streamerAvatar: generateAvatar('小叶'),
    thumbnail: '/images/live-thumb1.jpg',
    streamUrl: '/videos/live-stream1.mp4',
    category: 'education',
    viewerCount: 1250,
    likeCount: 89,
    commentCount: 156,
    isLive: true
  },
  {
    id: 'live_002',
    title: '晚间聊天室',
    streamerName: '系统管理员',
    streamerAvatar: generateAvatar('系统管理员'),
    thumbnail: '/images/live-thumb2.jpg',
    streamUrl: '/videos/live-stream2.mp4',
    category: 'entertainment',
    viewerCount: 890,
    likeCount: 67,
    commentCount: 234,
    isLive: true
  }
])

// 模拟评论数据
const recentComments = ref([
  { id: 'comment_001', userName: '用户A', content: '主播讲得很好！' },
  { id: 'comment_002', userName: '用户B', content: '学到了很多' },
  { id: 'comment_003', userName: '用户C', content: '666' }
])

// 礼物数据
const gifts = ref([
  { id: 'gift_001', name: '鲜花', icon: '/images/gift-flower.png', price: 10 },
  { id: 'gift_002', name: '掌声', icon: '/images/gift-clap.png', price: 20 },
  { id: 'gift_003', name: '火箭', icon: '/images/gift-rocket.png', price: 100 },
  { id: 'gift_004', name: '城堡', icon: '/images/gift-castle.png', price: 500 }
])

// 计算属性
const filteredLives = computed(() => {
  if (activeCategory.value === 'all') {
    return liveStreams.value
  }
  return liveStreams.value.filter(live => live.category === activeCategory.value)
})

// 触摸相关
let touchStartY = 0
let touchStartTime = 0

// 方法
const goBack = () => {
  router.back()
}

const goToCreateLive = () => {
  router.push('/live-streaming')
}

const enterLive = (live: any) => {
  currentLive.value = live
  console.log('进入直播间:', live.title)
}

const exitLive = () => {
  currentLive.value = null
}

// 触摸手势处理 - 支持上下滑动切换直播
const handleTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY
  touchStartTime = Date.now()
}

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndY = e.changedTouches[0].clientY
  const touchEndTime = Date.now()
  const deltaY = touchEndY - touchStartY
  const deltaTime = touchEndTime - touchStartTime

  // 快速上滑或下滑切换直播
  if (Math.abs(deltaY) > 100 && deltaTime < 300) {
    if (deltaY < 0) {
      // 上滑 - 下一个直播
      switchToNextLive()
    } else {
      // 下滑 - 上一个直播
      switchToPrevLive()
    }
  }
}

const switchToNextLive = () => {
  const currentIndex = liveStreams.value.findIndex(live => live.id === currentLive.value?.id)
  const nextIndex = (currentIndex + 1) % liveStreams.value.length
  currentLive.value = liveStreams.value[nextIndex]
  console.log('切换到下一个直播:', currentLive.value.title)
}

const switchToPrevLive = () => {
  const currentIndex = liveStreams.value.findIndex(live => live.id === currentLive.value?.id)
  const prevIndex = currentIndex === 0 ? liveStreams.value.length - 1 : currentIndex - 1
  currentLive.value = liveStreams.value[prevIndex]
  console.log('切换到上一个直播:', currentLive.value.title)
}

// 直播间功能
const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  console.log(isFollowing.value ? '已关注主播' : '取消关注主播')
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  if (isLiked.value) {
    currentLive.value.likeCount++
  } else {
    currentLive.value.likeCount--
  }
  console.log(isLiked.value ? '点赞' : '取消点赞')
}

const showComments = () => {
  console.log('显示评论列表')
}

const shareLive = () => {
  console.log('分享直播')
}

const sendGift = () => {
  showGiftPanel.value = true
}

const hideGiftPanel = () => {
  showGiftPanel.value = false
  selectedGift.value = null
}

const selectGift = (gift: any) => {
  selectedGift.value = gift
}

const confirmSendGift = () => {
  if (selectedGift.value) {
    console.log('赠送礼物:', selectedGift.value.name)
    hideGiftPanel()
  }
}

const requestMic = () => {
  showMicPanel.value = true
}

const hideMicPanel = () => {
  showMicPanel.value = false
}

const confirmRequestMic = () => {
  console.log('申请连麦')
  hideMicPanel()
}

const toggleBeauty = () => {
  showBeautyPanel.value = true
}

const hideBeautyPanel = () => {
  showBeautyPanel.value = false
}

const resetBeauty = () => {
  beautySettings.value = {
    whitening: 0,
    smoothing: 0,
    faceSlim: 0
  }
}

const applyBeauty = () => {
  console.log('应用美颜设置:', beautySettings.value)
  hideBeautyPanel()
}

const sendComment = () => {
  if (commentText.value.trim()) {
    const newComment = {
      id: `comment_${Date.now()}`,
      userName: '我',
      content: commentText.value
    }
    recentComments.value.push(newComment)
    
    // 只保留最近10条评论
    if (recentComments.value.length > 10) {
      recentComments.value.shift()
    }
    
    commentText.value = ''
    console.log('发送评论:', newComment.content)
  }
}

// 工具函数
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

onMounted(() => {
  console.log('直播浏览页面已加载')
})

onUnmounted(() => {
  // 清理资源
  if (currentLive.value) {
    console.log('清理直播资源')
  }
})
</script>

<style scoped>
.live-browse {
  min-height: 100vh;
  background: #000;
  color: white;
}

/* 直播列表样式 */
.live-list {
  min-height: 100vh;
  overflow-y: auto;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .create-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover, .create-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: white;
  margin: 0;
}

.live-categories {
  display: flex;
  gap: 8px;
  padding: 16px;
  overflow-x: auto;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  background: transparent;
  color: white;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-btn.active {
  background: #07C160;
  border-color: #07C160;
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px 20px;
}

.live-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.live-card:hover {
  transform: translateY(-2px);
}

.live-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: #333;
}

.live-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-status {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 8px;
}

.live-indicator {
  background: #ff4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.viewer-count {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.live-info {
  display: flex;
  gap: 8px;
  padding: 12px;
}

.streamer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.streamer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-details {
  flex: 1;
  min-width: 0;
}

.live-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.streamer-name {
  font-size: 12px;
  color: #ccc;
  margin: 0;
}

/* 直播间样式 */
.live-room {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
}

.live-video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.live-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-room-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 16px 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.close-btn {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.live-room-info {
  flex: 1;
  margin: 0 16px;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.streamer-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.streamer-name-small {
  font-size: 14px;
  font-weight: 500;
}

.follow-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.follow-btn.following {
  background: rgba(255, 255, 255, 0.3);
}

.live-stats {
  font-size: 12px;
  color: #ccc;
}

.live-room-actions {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn span {
  font-size: 10px;
}

.live-room-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.live-comments {
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.live-comment {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.comment-user {
  color: #07C160;
  font-weight: 500;
}

.comment-text {
  color: white;
}

.live-input-area {
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
}

.comment-input::placeholder {
  color: #ccc;
}

.send-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

/* 面板样式 */
.gift-panel-overlay, .mic-panel-overlay, .beauty-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.gift-panel, .mic-panel, .beauty-panel {
  background: white;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  color: #333;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.gift-panel h3, .mic-panel h3, .beauty-panel h3 {
  margin: 0 0 16px 0;
  text-align: center;
}

.gifts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.gift-item.selected {
  border-color: #07C160;
  background: #f0f9f0;
}

.gift-item img {
  width: 32px;
  height: 32px;
}

.gift-name {
  font-size: 12px;
  font-weight: 500;
}

.gift-price {
  font-size: 10px;
  color: #666;
}

.gift-actions, .mic-actions, .beauty-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn, .request-btn, .send-gift-btn, .reset-btn, .apply-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn, .reset-btn {
  background: #f5f5f5;
  color: #666;
}

.request-btn, .send-gift-btn, .apply-btn {
  background: #07C160;
  color: white;
}

.request-btn:disabled, .send-gift-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.beauty-controls {
  margin-bottom: 20px;
}

.beauty-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.beauty-item label {
  width: 60px;
  font-size: 14px;
}

.beauty-item input[type="range"] {
  flex: 1;
}

.beauty-item span {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #666;
}
</style>

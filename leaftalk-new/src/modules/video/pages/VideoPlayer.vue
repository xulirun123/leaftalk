<template>
  <div class="video-player" @touchstart.passive="handleTouchStart" @touchmove="handleTouchMove" @touchend.passive="handleTouchEnd">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <button class="nav-btn back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>

      <div class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['nav-tab', { active: activeTab === tab.key }]"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="nav-actions">
        <button class="nav-btn float-btn" @click="toggleFloat" :class="{ active: isFloating }">
          <iconify-icon icon="heroicons:rectangle-stack" width="20" style="color: white;"></iconify-icon>
        </button>
        <button class="nav-btn search-btn" @click="showSearch">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: white;"></iconify-icon>
        </button>
        <button class="nav-btn settings-btn" @click="showSettings">
          <iconify-icon icon="heroicons:cog-6-tooth" width="20" style="color: white;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 视频容器 -->
    <div class="video-container">
      <video
        ref="videoElement"
        :src="currentVideo.videoUrl"
        class="video-element"
        @click="togglePlay"
        @ended="onVideoEnd"
        autoplay
        loop
        muted
        playsinline
      ></video>

      <!-- 播放控制 -->
      <div v-if="showControls" class="video-controls">
        <button class="play-btn" @click="togglePlay">
          <iconify-icon 
            :icon="isPlaying ? 'heroicons:pause' : 'heroicons:play'" 
            width="48" 
            style="color: white;"
          ></iconify-icon>
        </button>
      </div>

      <!-- 左下角作者信息 -->
      <div class="bottom-left-info">
        <div class="author-section">
          <img :src="currentVideo.authorAvatar" :alt="currentVideo.authorName" class="author-avatar" @click="viewAuthorProfile" />
          <div class="author-details">
            <div class="author-name">{{ currentVideo.authorName }}</div>
            <button class="follow-btn" :class="{ followed: currentVideo.isFollowing }" @click.stop="followAuthor">
              {{ currentVideo.isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧操作栏 -->
      <div class="action-sidebar">

        <!-- 点赞 -->
        <div class="action-item" @click.stop="toggleLike">
          <iconify-icon
            :icon="currentVideo.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'"
            width="32"
            :style="{ color: currentVideo.isLiked ? '#ff4444' : 'white' }"
          ></iconify-icon>
          <span class="action-count">{{ formatCount(currentVideo.likes) }}</span>
        </div>

        <!-- 评论 -->
        <div class="action-item" @click.stop="showComments">
          <iconify-icon icon="heroicons:chat-bubble-left" width="32" style="color: white;"></iconify-icon>
          <span class="action-count">{{ formatCount(currentVideo.comments) }}</span>
        </div>

        <!-- 分享 -->
        <div class="action-item" @click.stop="shareVideo">
          <iconify-icon icon="heroicons:share" width="32" style="color: white;"></iconify-icon>
          <span class="action-count">分享</span>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="video-info">
        <div class="author-name">@{{ currentVideo.authorName }}</div>
        <div class="video-title">{{ currentVideo.title }}</div>
        <div class="video-tags">
          <span v-for="tag in currentVideo.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>

      <!-- 返回按钮 -->
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>
    </div>

    <!-- 分享弹窗 -->
    <div v-if="showSharePanel" class="share-overlay" @click="hideShare">
      <div class="share-panel" @click.stop>
        <div class="share-header">
          <span>分享到</span>
          <button @click="hideShare">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: #666;"></iconify-icon>
          </button>
        </div>
        <div class="share-options">
          <button class="share-option" @click="shareToMoments">
            <iconify-icon icon="heroicons:photo" width="32" style="color: #07C160;"></iconify-icon>
            <span>朋友圈</span>
          </button>
          <button class="share-option" @click="shareToContacts">
            <iconify-icon icon="heroicons:user-group" width="32" style="color: #07C160;"></iconify-icon>
            <span>叶语联系人</span>
          </button>
          <button class="share-option" @click="copyLink">
            <iconify-icon icon="heroicons:link" width="32" style="color: #07C160;"></iconify-icon>
            <span>复制链接</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <div v-if="showCommentsPanel" class="comments-overlay" @click="hideComments">
      <div class="comments-panel" @click.stop>
        <div class="comments-header">
          <span>{{ currentVideo.comments }}条评论</span>
          <button @click="hideComments">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: #666;"></iconify-icon>
          </button>
        </div>
        <div class="comments-list">
          <div v-for="comment in videoComments" :key="comment.id" class="comment-item">
            <img :src="comment.avatar" :alt="comment.username" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-username">{{ comment.username }}</div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-time">{{ formatTime(comment.timestamp) }}</div>
            </div>
          </div>
        </div>
        <div class="comment-input">
          <input v-model="newComment" placeholder="说点什么..." class="comment-field" />
          <button @click="addComment" class="send-comment-btn">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 检测进入模式
const entryMode = computed(() => {
  // 从URL参数或路径判断进入模式
  if (route.query.mode === 'discover') return 'discover'
  if (route.path.startsWith('/videos/') && route.params.id) return 'friend'
  if (route.path === '/my-video-channel') return 'my'
  return 'discover' // 默认为发现模式
})

// 导航标签 - 根据模式显示不同的标签
const tabs = computed(() => {
  if (entryMode.value === 'discover') {
    return [
      { key: 'recommend', label: '推荐' },
      { key: 'following', label: '关注' },
      { key: 'friends', label: '朋友' }
    ]
  } else if (entryMode.value === 'friend') {
    return [
      { key: 'videos', label: '作品' },
      { key: 'liked', label: '点赞' }
    ]
  } else if (entryMode.value === 'my') {
    return [
      { key: 'published', label: '已发布' },
      { key: 'drafts', label: '草稿' },
      { key: 'private', label: '私密' }
    ]
  }
  return [{ key: 'recommend', label: '推荐' }]
})

const activeTab = ref(tabs.value[0]?.key || 'recommend')
const isFloating = ref(false)

const videoElement = ref<HTMLVideoElement>()
const isPlaying = ref(true)
const showControls = ref(false)
const showCommentsPanel = ref(false)
const showSharePanel = ref(false)
const newComment = ref('')

// 触摸相关
const touchStartY = ref(0)
const touchStartTime = ref(0)

// 当前视频索引
const currentVideoIndex = ref(0)

// 模拟视频数据
const videos = ref([
  {
    id: '1',
    title: '今天的美食分享',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    authorName: '美食达人',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meishidaren&backgroundColor=ff6b6b',
    likes: 1520,
    comments: 89,
    shares: 45,
    tags: ['美食', '分享', '生活'],
    isLiked: false,
    isFollowing: false
  },
  {
    id: '2',
    title: '旅行日记第一集',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    authorName: '旅行者',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lvxingzhe&backgroundColor=4ecdc4',
    likes: 2340,
    comments: 156,
    shares: 78,
    tags: ['旅行', '风景', '记录'],
    isLiked: true,
    isFollowing: true
  },
  {
    id: '3',
    title: '健身教程分享',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    authorName: '健身教练',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jianshenjiaolian&backgroundColor=ffa726',
    likes: 890,
    comments: 67,
    shares: 23,
    tags: ['健身', '教程', '运动'],
    isLiked: false,
    isFollowing: false
  }
])

// 评论数据
const videoComments = ref([
  {
    id: '1',
    username: '用户1',
    avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23ff9500"/><text x="16" y="20" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">用</text></svg>',
    content: '太棒了！学到了很多',
    timestamp: Date.now() - 3600000
  },
  {
    id: '2',
    username: '用户2',
    avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%235856d6"/><text x="16" y="20" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">户</text></svg>',
    content: '请问这个在哪里可以买到？',
    timestamp: Date.now() - 7200000
  }
])

// 计算属性
const currentVideo = computed(() => videos.value[currentVideoIndex.value])

// 方法
const goBack = () => {
  router.back()
}

const switchTab = (tab: string) => {
  activeTab.value = tab
  console.log('切换到标签:', tab)
  // 这里可以根据标签加载不同的视频内容
}

const toggleFloat = () => {
  isFloating.value = !isFloating.value
  console.log('浮窗模式:', isFloating.value ? '开启' : '关闭')
  // 这里可以实现浮窗播放功能
}

const showSearch = () => {
  console.log('显示搜索')
  router.push('/search')
}

const showSettings = () => {
  console.log('显示设置')
  // 这里可以显示设置选项
}

const viewAuthorProfile = () => {
  console.log('查看作者资料:', currentVideo.value.authorName)
  // 这里可以跳转到作者资料页面
}

const togglePlay = () => {
  if (videoElement.value) {
    if (isPlaying.value) {
      videoElement.value.pause()
    } else {
      videoElement.value.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

const onVideoEnd = () => {
  // 视频结束后切换到下一个
  nextVideo()
}

const nextVideo = () => {
  currentVideoIndex.value = (currentVideoIndex.value + 1) % videos.value.length
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.play()
      isPlaying.value = true
    }
  })
}

const prevVideo = () => {
  currentVideoIndex.value = currentVideoIndex.value === 0 ? videos.value.length - 1 : currentVideoIndex.value - 1
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.play()
      isPlaying.value = true
    }
  })
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
}

const handleTouchMove = (e: TouchEvent) => {
  // 阻止默认滚动
  e.preventDefault()
}

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndY = e.changedTouches[0].clientY
  const touchDuration = Date.now() - touchStartTime.value
  const touchDistance = touchStartY.value - touchEndY

  // 如果是快速滑动且距离足够
  if (touchDuration < 300 && Math.abs(touchDistance) > 50) {
    if (touchDistance > 0) {
      // 向上滑动 - 下一个视频
      nextVideo()
    } else {
      // 向下滑动 - 上一个视频
      prevVideo()
    }
  } else if (touchDuration < 200 && Math.abs(touchDistance) < 10) {
    // 短时间点击 - 显示/隐藏控制
    showControls.value = !showControls.value
    setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

const toggleLike = () => {
  const video = videos.value[currentVideoIndex.value]
  video.isLiked = !video.isLiked
  if (video.isLiked) {
    video.likes++
  } else {
    video.likes--
  }
}

const followAuthor = () => {
  const video = videos.value[currentVideoIndex.value]
  video.isFollowing = !video.isFollowing
}

const showComments = () => {
  showCommentsPanel.value = true
}

const hideComments = () => {
  showCommentsPanel.value = false
}

const shareVideo = () => {
  showSharePanel.value = true
}

const hideShare = () => {
  showSharePanel.value = false
}

const shareToMoments = () => {
  console.log('分享到朋友圈')
  hideShare()
  alert('已分享到朋友圈')
  // 这里可以跳转到朋友圈发布页面
}

const shareToContacts = () => {
  console.log('分享到叶语联系人')
  hideShare()
  alert('已分享到叶语联系人')
  // 这里可以跳转到联系人选择页面
}

const copyLink = () => {
  console.log('复制链接')
  hideShare()
  // 这里可以复制视频链接到剪贴板
}

const addComment = () => {
  if (newComment.value.trim()) {
    videoComments.value.unshift({
      id: Date.now().toString(),
      username: '我',
      avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%2307C160"/><text x="16" y="20" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">我</text></svg>',
      content: newComment.value.trim(),
      timestamp: Date.now()
    })
    videos.value[currentVideoIndex.value].comments++
    newComment.value = ''
  }
}

const formatCount = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}

// 根据路由参数设置初始视频
onMounted(() => {
  // 优先从query参数获取视频ID，然后从params获取
  const videoId = (route.query.id as string) || (route.params.id as string)

  if (videoId) {
    const index = videos.value.findIndex(v => v.id === videoId)
    if (index !== -1) {
      currentVideoIndex.value = index
      console.log('🎬 找到视频，开始播放:', videos.value[index].title)
    } else {
      console.log('⚠️ 未找到指定视频ID:', videoId)
    }
  }

  // 检查是否需要自动播放
  if (route.query.autoplay === 'true') {
    console.log('🎬 自动播放已启用')
    // 视频元素已经有autoplay属性，会自动播放
  }
})
</script>

<style scoped>
.video-player {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  overflow: hidden;
  z-index: 1000;
}

.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.nav-btn {
  background: rgba(0,0,0,0.3);
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background: rgba(0,0,0,0.5);
}

.nav-btn.active {
  background: rgba(7,193,96,0.8);
}

.nav-tabs {
  display: flex;
  gap: 24px;
}

.nav-tab {
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.2s;
}

.nav-tab.active {
  color: white;
  font-weight: 500;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: white;
  border-radius: 1px;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.play-btn {
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-left-info {
  position: absolute;
  left: 16px;
  bottom: 80px;
  z-index: 10;
}

.author-section {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
  cursor: pointer;
  transition: transform 0.2s;
}

.author-avatar:hover {
  transform: scale(1.05);
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.author-name {
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.follow-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.follow-btn.followed {
  background: rgba(255,255,255,0.2);
  color: white;
}

.follow-btn:hover {
  transform: scale(1.05);
}

.action-sidebar {
  position: absolute;
  right: 16px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 10;
}

.author-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 2px solid white;
}

.follow-btn {
  position: absolute;
  bottom: -8px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: 2px solid white;
  background: #ff4444;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-count {
  font-size: 12px;
  color: white;
  text-align: center;
}

.video-info {
  position: absolute;
  left: 16px;
  bottom: 120px;
  right: 80px;
  z-index: 10;
}

.author-name {
  font-size: 16px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.video-title {
  font-size: 14px;
  color: white;
  margin-bottom: 8px;
  line-height: 1.4;
}

.video-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  color: white;
  opacity: 0.8;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 16px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.share-overlay,
.comments-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 20;
}

.share-panel {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 40vh;
}

.share-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.share-options {
  padding: 20px;
  display: flex;
  justify-content: space-around;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.share-option:hover {
  background: #f8f8f8;
}

.share-option span {
  font-size: 12px;
  color: #333;
}

.comments-panel {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.comments-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-input {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

.comment-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.send-comment-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #07C160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>

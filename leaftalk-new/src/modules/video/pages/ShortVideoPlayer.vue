<template>
  <div class="short-video-player" @touchstart.passive="handleTouchStart" @touchmove="handleTouchMove" @touchend.passive="handleTouchEnd">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>

      <!-- 视频分类标签 -->
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.key"
          :class="['category-tab', { active: activeCategory === category.key }]"
          @click="switchCategory(category.key)"
        >
          {{ category.label }}
        </button>
      </div>

      <div class="top-actions">
        <button class="action-btn" @click="toggleFloatingPlayer" title="画中画播放">
          <iconify-icon icon="heroicons:rectangle-stack" width="20" style="color: white;"></iconify-icon>
        </button>
        <button class="action-btn" @click="showMore = !showMore" title="更多">
          <iconify-icon icon="heroicons:ellipsis-horizontal" width="20" style="color: white;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 视频容器 - 全屏显示 -->
    <div class="video-container">
      <video
        ref="videoRef"
        :src="currentVideo.videoUrl"
        class="video-element"
        @click="togglePlay"
        @ended="onVideoEnd"
        @loadstart="onVideoLoadStart"
        @canplay="onVideoCanPlay"
        autoplay
        loop
        muted
        playsinline
        webkit-playsinline
      ></video>

      <!-- 播放/暂停按钮覆盖层 -->
      <div v-if="showPlayButton" class="play-overlay" @click="togglePlay">
        <div class="play-button">
          <iconify-icon 
            :icon="isPlaying ? 'heroicons:pause' : 'heroicons:play'" 
            width="60" 
            style="color: white;"
          ></iconify-icon>
        </div>
      </div>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <iconify-icon icon="heroicons:arrow-path" width="40" style="color: white;" class="spin"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 右侧操作栏 -->
    <div class="right-actions">
      <!-- 作者头像 -->
      <div class="author-avatar" @click="goToAuthorProfile">
        <img :src="currentVideo.author.avatar" :alt="currentVideo.author.name" />
        <div v-if="!currentVideo.author.isFollowing" class="follow-btn" @click.stop="followAuthor">
          <iconify-icon icon="heroicons:plus" width="16" style="color: white;"></iconify-icon>
        </div>
      </div>

      <!-- 点赞 -->
      <div class="action-item" @click="toggleLike">
        <div class="action-icon" :class="{ liked: currentVideo.isLiked }">
          <iconify-icon 
            :icon="currentVideo.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
            width="32" 
            :style="{ color: currentVideo.isLiked ? '#ff2d55' : 'white' }"
          ></iconify-icon>
        </div>
        <span class="action-count">{{ formatCount(currentVideo.likeCount) }}</span>
      </div>

      <!-- 评论 -->
      <div class="action-item" @click="showComments = true">
        <div class="action-icon">
          <iconify-icon icon="heroicons:chat-bubble-oval-left" width="32" style="color: white;"></iconify-icon>
        </div>
        <span class="action-count">{{ formatCount(currentVideo.commentCount) }}</span>
      </div>

      <!-- 分享 -->
      <div class="action-item" @click="showShareMenu = true">
        <div class="action-icon">
          <iconify-icon icon="heroicons:share" width="32" style="color: white;"></iconify-icon>
        </div>
        <span class="action-count">{{ formatCount(currentVideo.shareCount) }}</span>
      </div>

      <!-- 收藏 -->
      <div class="action-item" @click="toggleFavorite">
        <div class="action-icon" :class="{ favorited: currentVideo.isFavorited }">
          <iconify-icon
            :icon="currentVideo.isFavorited ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'"
            width="32"
            :style="{ color: currentVideo.isFavorited ? '#ffcc00' : 'white' }"
          ></iconify-icon>
        </div>
        <span class="action-count">收藏</span>
      </div>

      <!-- 更多操作 -->
      <div class="action-item" @click="showMoreActions = true">
        <div class="action-icon">
          <iconify-icon icon="heroicons:ellipsis-vertical" width="32" style="color: white;"></iconify-icon>
        </div>
        <span class="action-count">更多</span>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-info">
      <div class="video-info">
        <div class="author-name">@{{ currentVideo.author.name }}</div>
        <div class="video-title">{{ currentVideo.title }}</div>
        <div class="video-tags">
          <span v-for="tag in currentVideo.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="time-info">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="duration">{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>

    <!-- 滑动提示 -->
    <div v-if="showSwipeHint" class="swipe-hint">
      <div class="hint-text">上下滑动切换视频</div>
      <iconify-icon icon="heroicons:chevron-up-down" width="24" style="color: white;"></iconify-icon>
    </div>

    <!-- 分享菜单弹窗 -->
    <div v-if="showShareMenu" class="share-overlay" @click="showShareMenu = false">
      <div class="share-panel" @click.stop>
        <div class="share-header">
          <h3>分享到</h3>
          <button @click="showShareMenu = false">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        <div class="share-options">
          <div class="share-option" @click="shareToMoments">
            <div class="share-icon moments">
              <iconify-icon icon="heroicons:photo" width="32" style="color: #07c160;"></iconify-icon>
            </div>
            <span>叶语朋友圈</span>
          </div>
          <div class="share-option" @click="shareToChat">
            <div class="share-icon chat">
              <iconify-icon icon="heroicons:chat-bubble-left-right" width="32" style="color: #1890ff;"></iconify-icon>
            </div>
            <span>发送给朋友</span>
          </div>
          <div class="share-option" @click="copyLink">
            <div class="share-icon link">
              <iconify-icon icon="heroicons:link" width="32" style="color: #666;"></iconify-icon>
            </div>
            <span>复制链接</span>
          </div>
          <div class="share-option" @click="downloadVideo">
            <div class="share-icon download">
              <iconify-icon icon="heroicons:arrow-down-tray" width="32" style="color: #ff6b35;"></iconify-icon>
            </div>
            <span>保存视频</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 更多操作菜单 -->
    <div v-if="showMoreActions" class="more-overlay" @click="showMoreActions = false">
      <div class="more-panel" @click.stop>
        <div class="more-header">
          <h3>更多操作</h3>
          <button @click="showMoreActions = false">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        <div class="more-options">
          <div class="more-option" @click="reportVideo">
            <iconify-icon icon="heroicons:flag" width="20"></iconify-icon>
            <span>举报</span>
          </div>
          <div class="more-option" @click="blockAuthor">
            <iconify-icon icon="heroicons:no-symbol" width="20"></iconify-icon>
            <span>屏蔽作者</span>
          </div>
          <div class="more-option" @click="notInterested">
            <iconify-icon icon="heroicons:eye-slash" width="20"></iconify-icon>
            <span>不感兴趣</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <div v-if="showComments" class="comments-overlay" @click="showComments = false">
      <div class="comments-panel" @click.stop>
        <div class="comments-header">
          <h3>评论 ({{ currentVideo.commentCount }})</h3>
          <button @click="showComments = false">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        <div class="comments-list">
          <div v-for="comment in currentVideo.comments" :key="comment.id" class="comment-item">
            <img :src="comment.userAvatar" :alt="comment.userName" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-user">{{ comment.userName }}</div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-time">{{ formatTime(comment.timestamp) }}</div>
            </div>
          </div>
        </div>
        <div class="comment-input">
          <input v-model="newComment" placeholder="说点什么..." @keyup.enter="addComment" />
          <button @click="addComment">发送</button>
        </div>
      </div>
    </div>

    <!-- 画中画播放器 -->
    <div v-if="showFloatingPlayer" class="floating-player" :style="floatingPlayerStyle">
      <div class="floating-video-container">
        <video
          ref="floatingVideoRef"
          :src="currentVideo.videoUrl"
          class="floating-video"
          autoplay
          loop
          muted
          playsinline
        ></video>
        <div class="floating-controls">
          <button @click="closeFloatingPlayer" class="floating-close">
            <iconify-icon icon="heroicons:x-mark" width="16" style="color: white;"></iconify-icon>
          </button>
          <button @click="backToFullscreen" class="floating-expand">
            <iconify-icon icon="heroicons:arrows-pointing-out" width="16" style="color: white;"></iconify-icon>
          </button>
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

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const floatingVideoRef = ref<HTMLVideoElement>()
const currentVideoIndex = ref(0)
const isPlaying = ref(true)
const isLoading = ref(false)
const showPlayButton = ref(false)
const showComments = ref(false)
const showMore = ref(false)
const showSwipeHint = ref(true)
const showShareMenu = ref(false)
const showMoreActions = ref(false)
const showFloatingPlayer = ref(false)
const newComment = ref('')
const currentTime = ref(0)
const duration = ref(0)
const activeCategory = ref('recommend')

// 画中画播放器位置
const floatingPlayerStyle = ref({
  position: 'fixed',
  top: '100px',
  right: '20px',
  width: '120px',
  height: '200px',
  zIndex: 9999
})

// 触摸相关
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isScrolling = ref(false)

// 视频分类
const categories = ref([
  { key: 'recommend', label: '推荐' },
  { key: 'following', label: '关注' },
  { key: 'nearby', label: '附近' },
  { key: 'hot', label: '热门' },
  { key: 'family', label: '家族' }
])

// 模拟视频数据
const videos = ref([
  {
    id: 'v1',
    title: '叶语使用技巧分享',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    author: {
      id: 'u1',
      name: '科技达人小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author1',
      isFollowing: false
    },
    likeCount: 1580,
    commentCount: 89,
    shareCount: 45,
    isLiked: false,
    isFavorited: false,
    tags: ['叶语', '技巧', '分享'],
    comments: [
      {
        id: 'c1',
        userName: '用户A',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=userA',
        content: '很实用的技巧！',
        timestamp: Date.now() - 3600000
      }
    ]
  },
  {
    id: 'v2',
    title: '家庭聚会温馨时刻',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    author: {
      id: 'u2',
      name: '幸福一家人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author2',
      isFollowing: true
    },
    likeCount: 2340,
    commentCount: 156,
    shareCount: 78,
    isLiked: true,
    isFavorited: false,
    tags: ['家庭', '温馨', '聚会'],
    comments: []
  },
  {
    id: 'v3',
    title: '美食制作教程',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    author: {
      id: 'u3',
      name: '美食小厨师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author3',
      isFollowing: false
    },
    likeCount: 5670,
    commentCount: 234,
    shareCount: 123,
    isLiked: false,
    isFavorited: true,
    tags: ['美食', '教程', '制作'],
    comments: []
  }
])

// 计算属性
const currentVideo = computed(() => videos.value[currentVideoIndex.value] || videos.value[0])
const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 方法
const goBack = () => {
  router.back()
}

const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
    showPlayButton.value = true
  } else {
    videoRef.value.play()
    isPlaying.value = true
    showPlayButton.value = false
  }
}

const nextVideo = () => {
  if (currentVideoIndex.value < videos.value.length - 1) {
    currentVideoIndex.value++
    playCurrentVideo()
  }
}

const prevVideo = () => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--
    playCurrentVideo()
  }
}

const playCurrentVideo = async () => {
  if (!videoRef.value) return

  isLoading.value = true
  showPlayButton.value = false

  await nextTick()

  try {
    await videoRef.value.load()
    await videoRef.value.play()
    isPlaying.value = true
  } catch (error) {
    console.error('视频播放失败:', error)
    showPlayButton.value = true
  } finally {
    isLoading.value = false
  }
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
  isScrolling.value = false
}

const handleTouchMove = (e: TouchEvent) => {
  if (isScrolling.value) return

  const touchCurrentY = e.touches[0].clientY
  const touchDistance = Math.abs(touchCurrentY - touchStartY.value)

  // 如果滑动距离超过阈值，开始滚动
  if (touchDistance > 20) {
    isScrolling.value = true
    // 只在确实需要阻止滚动时才调用 preventDefault
    if (Math.abs(touchStartY.value - touchCurrentY) > 50) {
      e.preventDefault()
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!isScrolling.value) return

  const touchEndY = e.changedTouches[0].clientY
  const touchDuration = Date.now() - touchStartTime.value
  const touchDistance = touchStartY.value - touchEndY

  // 快速滑动且距离足够
  if (touchDuration < 500 && Math.abs(touchDistance) > 50) {
    if (touchDistance > 0) {
      // 向上滑动 - 下一个视频
      nextVideo()
    } else {
      // 向下滑动 - 上一个视频
      prevVideo()
    }
  }

  isScrolling.value = false
}

// 视频事件处理
const onVideoLoadStart = () => {
  isLoading.value = true
}

const onVideoCanPlay = () => {
  isLoading.value = false
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

const onVideoEnd = () => {
  // 自动播放下一个视频
  nextVideo()
}

// 交互功能
const toggleLike = () => {
  const video = videos.value[currentVideoIndex.value]
  video.isLiked = !video.isLiked
  video.likeCount += video.isLiked ? 1 : -1
}

const toggleFavorite = () => {
  const video = videos.value[currentVideoIndex.value]
  video.isFavorited = !video.isFavorited
}

const followAuthor = () => {
  const video = videos.value[currentVideoIndex.value]
  video.author.isFollowing = !video.author.isFollowing
  console.log(video.author.isFollowing ? '已关注' : '已取消关注', video.author.name)
}

const goToAuthorProfile = () => {
  router.push(`/user-profile/${currentVideo.value.author.id}`)
}

// 分类切换
const switchCategory = (categoryKey: string) => {
  activeCategory.value = categoryKey
  console.log('切换到分类:', categoryKey)
  // 这里可以加载对应分类的视频数据
  loadVideosByCategory(categoryKey)
}

const loadVideosByCategory = (category: string) => {
  // 模拟加载不同分类的视频
  console.log('加载分类视频:', category)
  // 实际项目中这里会调用API
}

// 画中画功能
const toggleFloatingPlayer = () => {
  if (showFloatingPlayer.value) {
    closeFloatingPlayer()
  } else {
    showFloatingPlayer.value = true
    // 同步当前视频到画中画播放器
    if (floatingVideoRef.value && videoRef.value) {
      floatingVideoRef.value.currentTime = videoRef.value.currentTime
    }
  }
}

const closeFloatingPlayer = () => {
  showFloatingPlayer.value = false
}

const backToFullscreen = () => {
  showFloatingPlayer.value = false
  // 同步播放进度
  if (videoRef.value && floatingVideoRef.value) {
    videoRef.value.currentTime = floatingVideoRef.value.currentTime
  }
}

// 分享功能
const shareToMoments = () => {
  showShareMenu.value = false
  console.log('分享到叶语朋友圈:', currentVideo.value.title)

  // 跳转到朋友圈发布页面，携带视频信息
  router.push({
    path: '/publish-moment',
    query: {
      type: 'video',
      videoId: currentVideo.value.id,
      videoUrl: currentVideo.value.videoUrl,
      title: currentVideo.value.title
    }
  })
}

const shareToChat = () => {
  showShareMenu.value = false
  console.log('发送给朋友:', currentVideo.value.title)

  // 跳转到选择联系人页面
  router.push({
    path: '/select-contacts',
    query: {
      action: 'share',
      type: 'video',
      videoId: currentVideo.value.id
    }
  })
}

const copyLink = () => {
  showShareMenu.value = false
  const link = `${window.location.origin}/short-video-player?id=${currentVideo.value.id}`

  // 复制到剪贴板
  navigator.clipboard.writeText(link).then(() => {
    console.log('链接已复制到剪贴板')
    // 这里可以显示toast提示
  }).catch(() => {
    console.error('复制失败')
  })
}

const downloadVideo = () => {
  showShareMenu.value = false
  console.log('保存视频:', currentVideo.value.title)

  // 创建下载链接
  const link = document.createElement('a')
  link.href = currentVideo.value.videoUrl
  link.download = `${currentVideo.value.title}.mp4`
  link.click()
}

// 更多操作
const reportVideo = () => {
  showMoreActions.value = false
  console.log('举报视频:', currentVideo.value.title)
  // 这里可以打开举报弹窗
}

const blockAuthor = () => {
  showMoreActions.value = false
  console.log('屏蔽作者:', currentVideo.value.author.name)
  // 这里可以调用屏蔽API
}

const notInterested = () => {
  showMoreActions.value = false
  console.log('不感兴趣:', currentVideo.value.title)
  // 这里可以调用不感兴趣API，影响推荐算法
}

const addComment = () => {
  if (!newComment.value.trim()) return

  const video = videos.value[currentVideoIndex.value]
  video.comments.push({
    id: Date.now().toString(),
    userName: '我',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    content: newComment.value,
    timestamp: Date.now()
  })

  video.commentCount++
  newComment.value = ''
}

// 工具函数
const formatCount = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

// 生命周期
onMounted(() => {
  // 隐藏滑动提示
  setTimeout(() => {
    showSwipeHint.value = false
  }, 3000)

  // 监听视频时间更新
  if (videoRef.value) {
    videoRef.value.addEventListener('timeupdate', () => {
      if (videoRef.value) {
        currentTime.value = videoRef.value.currentTime
      }
    })
  }

  // 根据路由参数设置初始视频
  const videoId = (route.query.id as string) || (route.params.id as string)
  if (videoId) {
    const index = videos.value.findIndex(v => v.id === videoId)
    if (index !== -1) {
      currentVideoIndex.value = index
    }
  }
})

onUnmounted(() => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
})
</script>

<style scoped>
.short-video-player {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  z-index: 1000;
}

/* 顶部状态栏 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
  z-index: 10;
}

.back-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(0,0,0,0.3);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 视频分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
  margin: 0 16px;
}

.category-tab {
  padding: 6px 12px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.category-tab.active {
  background: rgba(255,255,255,0.9);
  color: #333;
}

.category-tab:hover {
  background: rgba(255,255,255,0.3);
}

/* 顶部操作按钮 */
.top-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0,0,0,0.3);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0,0,0,0.5);
}

/* 视频容器 */
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

/* 播放覆盖层 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  z-index: 5;
}

.play-button {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

/* 加载指示器 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  z-index: 6;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 右侧操作栏 */
.right-actions {
  position: absolute;
  right: 16px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 10;
}

.author-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  border: 2px solid white;
  cursor: pointer;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.follow-btn {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #ff2d55;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-icon:active {
  transform: scale(0.9);
}

.action-icon.liked {
  background: rgba(255,45,85,0.2);
}

.action-icon.favorited {
  background: rgba(255,204,0,0.2);
}

.action-count {
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 48px;
}

/* 底部信息栏 */
.bottom-info {
  position: absolute;
  left: 16px;
  right: 80px;
  bottom: 20px;
  z-index: 10;
}

.video-info {
  margin-bottom: 12px;
}

.author-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.video-title {
  color: white;
  font-size: 15px;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  color: white;
  font-size: 13px;
  opacity: 0.9;
}

/* 进度条 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.3);
  border-radius: 1px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.1s;
}

.time-info {
  display: flex;
  gap: 4px;
  color: white;
  font-size: 11px;
  opacity: 0.8;
}

/* 滑动提示 */
.swipe-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  opacity: 0.8;
  z-index: 8;
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.8; }
}

.hint-text {
  text-align: center;
  background: rgba(0,0,0,0.5);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* 评论弹窗 */
.comments-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 20;
}

.comments-panel {
  width: 100%;
  max-height: 70vh;
  background: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.comments-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.comments-header button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
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
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 13px;
  font-weight: 600;
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.comment-input input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e0e0e0;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
}

.comment-input button {
  height: 36px;
  padding: 0 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.comment-input button:active {
  background: #06a552;
}

/* 分享菜单 */
.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 30;
}

.share-panel {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.share-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.share-header button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s;
}

.share-option:hover {
  background: #f5f5f5;
}

.share-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.share-icon.moments {
  background: rgba(7,193,96,0.1);
}

.share-icon.chat {
  background: rgba(24,144,255,0.1);
}

.share-icon.link {
  background: rgba(102,102,102,0.1);
}

.share-icon.download {
  background: rgba(255,107,53,0.1);
}

.share-option span {
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 更多操作菜单 */
.more-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 30;
}

.more-panel {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

.more-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.more-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.more-header button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.more-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.more-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.more-option:hover {
  background: #f5f5f5;
}

.more-option span {
  font-size: 14px;
  color: #333;
}

/* 画中画播放器 */
.floating-player {
  position: fixed;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  z-index: 9999;
  cursor: move;
}

.floating-video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-controls {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.floating-close,
.floating-expand {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0,0,0,0.6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.floating-close:hover,
.floating-expand:hover {
  background: rgba(0,0,0,0.8);
}
</style>

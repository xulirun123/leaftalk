<template>
  <div class="video-list">
    <!-- 顶部导航 -->
    <div class="video-header">
      <h1>视频号</h1>
      <div class="header-actions">
        <button class="search-btn" @click="showSearch = !showSearch">
          <iconify-icon icon="heroicons:magnifying-glass" width="24"></iconify-icon>
        </button>
        <button class="publish-btn" @click="goToPublish">
          <iconify-icon icon="heroicons:plus" width="24"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div v-if="showSearch" class="search-bar">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="搜索视频..."
        class="search-input"
        @input="onSearch"
      >
    </div>

    <!-- 分类标签 -->
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

    <!-- 视频列表 -->
    <div class="videos-container">
      <div 
        v-for="video in filteredVideos" 
        :key="video.id"
        class="video-item"
        @click="playVideo(video)"
      >
        <!-- 视频缩略图 -->
        <div class="video-thumbnail">
          <img :src="video.thumbnail" :alt="video.title" class="thumbnail-image">
          <div class="video-overlay">
            <iconify-icon icon="heroicons:play" width="32" class="play-icon"></iconify-icon>
            <span class="video-duration">{{ formatDuration(video.duration) }}</span>
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <div class="video-meta">
            <img :src="video.author.avatar" :alt="video.author.name" class="author-avatar">
            <div class="meta-content">
              <h3 class="video-title">{{ video.title }}</h3>
              <div class="video-stats">
                <span class="author-name">{{ video.author.name }}</span>
                <span class="separator">·</span>
                <span class="view-count">{{ formatViewCount(video.views) }}次观看</span>
                <span class="separator">·</span>
                <span class="publish-time">{{ formatTime(video.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 视频标签 -->
          <div v-if="video.tags && video.tags.length > 0" class="video-tags">
            <span 
              v-for="tag in video.tags.slice(0, 3)" 
              :key="tag"
              class="video-tag"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- 互动按钮 -->
          <div class="video-actions">
            <button 
              :class="['action-btn', { active: video.isLiked }]"
              @click.stop="toggleLike(video)"
            >
              <iconify-icon 
                :icon="video.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
                width="20"
              ></iconify-icon>
              <span>{{ formatCount(video.likes) }}</span>
            </button>

            <button class="action-btn" @click.stop="showComments(video)">
              <iconify-icon icon="heroicons:chat-bubble-left" width="20"></iconify-icon>
              <span>{{ formatCount(video.comments) }}</span>
            </button>

            <button class="action-btn" @click.stop="shareVideo(video)">
              <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
              <span>分享</span>
            </button>

            <button class="action-btn" @click.stop="showMore(video)">
              <iconify-icon icon="heroicons:ellipsis-horizontal" width="20"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">
        <span v-if="!loading">加载更多</span>
        <span v-else>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredVideos.length === 0 && !loading" class="empty-state">
        <iconify-icon icon="heroicons:video-camera-slash" width="64" style="color: #ccc;"></iconify-icon>
        <p>暂无视频</p>
        <button class="publish-first-btn" @click="goToPublish">发布第一个视频</button>
      </div>
    </div>

    <!-- 视频播放器弹窗 -->
    <div v-if="showPlayer" class="video-player-modal" @click="closePlayer">
      <div class="player-container" @click.stop>
        <div class="player-header">
          <button class="close-btn" @click="closePlayer">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        
        <video 
          ref="videoPlayer"
          :src="currentVideo?.videoUrl"
          controls
          autoplay
          class="video-player"
          @ended="onVideoEnded"
        ></video>

        <div class="player-info">
          <h3>{{ currentVideo?.title }}</h3>
          <p>{{ currentVideo?.description }}</p>
          
          <div class="player-actions">
            <button 
              :class="['player-action', { active: currentVideo?.isLiked }]"
              @click="toggleLike(currentVideo)"
            >
              <iconify-icon 
                :icon="currentVideo?.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
                width="24"
              ></iconify-icon>
              <span>{{ formatCount(currentVideo?.likes || 0) }}</span>
            </button>

            <button class="player-action" @click="showComments(currentVideo)">
              <iconify-icon icon="heroicons:chat-bubble-left" width="24"></iconify-icon>
              <span>{{ formatCount(currentVideo?.comments || 0) }}</span>
            </button>

            <button class="player-action" @click="shareVideo(currentVideo)">
              <iconify-icon icon="heroicons:share" width="24"></iconify-icon>
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <div v-if="showCommentsDialog" class="comments-modal" @click="showCommentsDialog = false">
      <div class="comments-container" @click.stop>
        <div class="comments-header">
          <h3>评论 ({{ selectedVideo?.comments || 0 }})</h3>
          <button class="close-btn" @click="showCommentsDialog = false">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        
        <div class="comments-list">
          <div 
            v-for="comment in videoComments" 
            :key="comment.id"
            class="comment-item"
          >
            <img :src="comment.user.avatar" :alt="comment.user.name" class="comment-avatar">
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.user.name }}</span>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>

        <div class="comment-input">
          <input 
            v-model="newComment"
            type="text" 
            placeholder="写评论..."
            @keyup.enter="submitComment"
          >
          <button @click="submitComment" :disabled="!newComment.trim()">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '../../stores/video'

const router = useRouter()
const videoStore = useVideoStore()

// 响应式数据
const showSearch = ref(false)
const searchQuery = ref('')
const activeCategory = ref('all')
const loading = ref(false)
const hasMore = ref(true)

const showPlayer = ref(false)
const currentVideo = ref<any>(null)
const videoPlayer = ref<HTMLVideoElement>()

const showCommentsDialog = ref(false)
const selectedVideo = ref<any>(null)
const videoComments = ref<any[]>([])
const newComment = ref('')

// 分类数据
const categories = [
  { key: 'all', label: '全部' },
  { key: 'following', label: '关注' },
  { key: 'trending', label: '热门' },
  { key: 'latest', label: '最新' }
]

// 视频数据
const videos = ref([
  {
    id: 'video_001',
    title: '美食制作教程：家常菜做法',
    description: '教你如何制作简单美味的家常菜',
    thumbnail: 'https://picsum.photos/300/200?random=1',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 120,
    views: 1234,
    likes: 89,
    comments: 23,
    isLiked: false,
    tags: ['美食', '教程', '家常菜'],
    author: {
      id: 'user_001',
      name: '美食达人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef'
    },
    createdAt: Date.now() - 3600000,
    category: 'trending'
  },
  {
    id: 'video_002',
    title: '旅行日记：美丽的海边风景',
    description: '分享我在海边度假的美好时光',
    thumbnail: 'https://picsum.photos/300/200?random=2',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    duration: 180,
    views: 2567,
    likes: 156,
    comments: 45,
    isLiked: true,
    tags: ['旅行', '海边', '风景'],
    author: {
      id: 'user_002',
      name: '旅行者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler'
    },
    createdAt: Date.now() - 7200000,
    category: 'latest'
  }
])

// 计算属性
const filteredVideos = computed(() => {
  let result = videos.value

  // 分类过滤
  if (activeCategory.value !== 'all') {
    result = result.filter(video => video.category === activeCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query) ||
      video.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return result
})

// 方法
const goToPublish = () => {
  router.push('/video/publish')
}

const switchCategory = (category: string) => {
  activeCategory.value = category
}

const onSearch = () => {
  // 搜索逻辑
}

const playVideo = (video: any) => {
  currentVideo.value = video
  showPlayer.value = true
  
  // 增加观看次数
  video.views++
}

const closePlayer = () => {
  showPlayer.value = false
  currentVideo.value = null
  
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
}

const onVideoEnded = () => {
  // 视频播放结束
}

const toggleLike = (video: any) => {
  if (!video) return
  
  video.isLiked = !video.isLiked
  video.likes += video.isLiked ? 1 : -1
}

const showComments = (video: any) => {
  selectedVideo.value = video
  loadComments(video.id)
  showCommentsDialog.value = true
}

const loadComments = (videoId: string) => {
  // 模拟评论数据
  videoComments.value = [
    {
      id: 'comment_001',
      content: '很棒的视频！',
      user: {
        name: '用户A',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=userA'
      },
      createdAt: Date.now() - 1800000
    },
    {
      id: 'comment_002',
      content: '学到了很多，谢谢分享',
      user: {
        name: '用户B',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=userB'
      },
      createdAt: Date.now() - 3600000
    }
  ]
}

const submitComment = () => {
  if (!newComment.value.trim()) return
  
  const comment = {
    id: `comment_${Date.now()}`,
    content: newComment.value,
    user: {
      name: '我',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'
    },
    createdAt: Date.now()
  }
  
  videoComments.value.unshift(comment)
  
  if (selectedVideo.value) {
    selectedVideo.value.comments++
  }
  
  newComment.value = ''
}

const shareVideo = (video: any) => {
  // 分享逻辑
  if (navigator.share) {
    navigator.share({
      title: video.title,
      text: video.description,
      url: window.location.href
    })
  } else {
    // 复制链接
    navigator.clipboard.writeText(window.location.href)
    alert('链接已复制到剪贴板')
  }
}

const showMore = (video: any) => {
  // 显示更多选项
}

const loadMore = () => {
  if (loading.value) return
  
  loading.value = true
  
  // 模拟加载更多
  setTimeout(() => {
    loading.value = false
    // hasMore.value = false
  }, 1000)
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatViewCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

const formatCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// 生命周期
onMounted(() => {
  // 加载视频数据
  videoStore.loadVideos()
})
</script>

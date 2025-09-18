<template>
  <div class="videos-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">视频号</div>
      <button class="search-btn" @click="toggleSearch">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索视频号"
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <!-- 标签页 -->
    <div class="tabs-container">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <!-- 视频内容 -->
    <div class="videos-content">
      <!-- 关注标签页 -->
      <div v-if="activeTab === 'following'" class="video-list">
        <div v-if="followingVideos.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:video-camera" width="64" style="color: #ccc;"></iconify-icon>
          <p>{{ videos?.noFollowing?.value || '暂无关注的视频' }}</p>
          <p class="empty-tip">{{ videos?.discoverMore?.value || '去发现更多精彩内容' }}</p>
        </div>
        
        <div 
          v-for="video in followingVideos" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.cover" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="play-overlay">
              <iconify-icon icon="heroicons:play" width="32" style="color: white;"></iconify-icon>
            </div>
          </div>
          
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <div class="author-info">
                <img :src="video.author.avatar" :alt="video.author.name" class="author-avatar" />
                <span class="author-name">{{ video.author.name }}</span>
              </div>
              <div class="video-stats">
                <span class="view-count">{{ formatCount(video.viewCount) }}次播放</span>
                <span class="like-count">{{ formatCount(video.likeCount) }}赞</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 推荐标签页 -->
      <div v-if="activeTab === 'recommend'" class="video-list">
        <div 
          v-for="video in recommendVideos" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.cover" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="play-overlay">
              <iconify-icon icon="heroicons:play" width="32" style="color: white;"></iconify-icon>
            </div>
          </div>
          
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <div class="author-info">
                <img :src="video.author.avatar" :alt="video.author.name" class="author-avatar" />
                <span class="author-name">{{ video.author.name }}</span>
                <button 
                  v-if="!video.author.isFollowing" 
                  class="follow-btn"
                  @click.stop="followAuthor(video.author)"
                >
                  {{ videos?.follow?.value || '关注' }}
                </button>
              </div>
              <div class="video-stats">
                <span class="view-count">{{ formatCount(video.viewCount) }}次播放</span>
                <span class="like-count">{{ formatCount(video.likeCount) }}赞</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 附近标签页 -->
      <div v-if="activeTab === 'nearby'" class="video-list">
        <div v-if="nearbyVideos.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:map-pin" width="64" style="color: #ccc;"></iconify-icon>
          <p>{{ videos?.noNearby?.value || '附近暂无视频' }}</p>
          <p class="empty-tip">{{ videos?.enableLocation?.value || '开启位置权限查看附近视频' }}</p>
        </div>
        
        <div 
          v-for="video in nearbyVideos" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.cover" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="video-location">
              <iconify-icon icon="heroicons:map-pin" width="12" style="color: white;"></iconify-icon>
              <span>{{ video.location }}</span>
            </div>
            <div class="play-overlay">
              <iconify-icon icon="heroicons:play" width="32" style="color: white;"></iconify-icon>
            </div>
          </div>
          
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <div class="author-info">
                <img :src="video.author.avatar" :alt="video.author.name" class="author-avatar" />
                <span class="author-name">{{ video.author.name }}</span>
                <span class="distance">{{ video.distance }}</span>
              </div>
              <div class="video-stats">
                <span class="view-count">{{ formatCount(video.viewCount) }}次播放</span>
                <span class="like-count">{{ formatCount(video.likeCount) }}赞</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布按钮 -->
    <button class="publish-btn" @click="publishVideo">
      <iconify-icon icon="heroicons:plus" width="24" style="color: white;"></iconify-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useI18n } from '../../composables/useI18n'
import { videoAPI } from '../../services/api'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const { videos, message } = useI18n()

const showSearch = ref(false)
const searchQuery = ref('')
const activeTab = ref('recommend')

// 标签页配置
const tabs = computed(() => [
  { key: 'following', label: videos?.following?.value || '关注' },
  { key: 'recommend', label: videos?.recommend?.value || '推荐' },
  { key: 'nearby', label: videos?.nearby?.value || '附近' }
])

// 模拟视频数据
const followingVideos = ref([
  {
    id: 'f1',
    title: '叶语新功能介绍',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=follow1',
    duration: 180,
    author: {
      id: 'author1',
      name: '叶语官方',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=official',
      verified: true
    },
    stats: {
      views: 15420,
      likes: 1234,
      comments: 89
    },
    publishTime: Date.now() - 86400000 // 1天前
  },
  {
    id: 'f2',
    title: '用户使用心得分享',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=follow2',
    duration: 240,
    author: {
      id: 'author2',
      name: '科技达人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
      verified: false
    },
    stats: {
      views: 8932,
      likes: 567,
      comments: 45
    },
    publishTime: Date.now() - 172800000 // 2天前
  }
])

const recommendVideos = ref([
  {
    id: 'v1',
    title: '叶语使用技巧分享',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=video1',
    duration: 120,
    viewCount: 1580,
    likeCount: 89,
    author: {
      id: 'u1',
      name: '科技达人小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author1',
      isFollowing: false
    }
  },
  {
    id: 'v2',
    title: '家庭聚会温馨时刻',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=video2',
    duration: 95,
    viewCount: 2340,
    likeCount: 156,
    author: {
      id: 'u2',
      name: '幸福一家人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author2',
      isFollowing: false
    }
  },
  {
    id: 'v3',
    title: '美食制作教程',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=video3',
    duration: 180,
    viewCount: 5670,
    likeCount: 234,
    author: {
      id: 'u3',
      name: '美食小厨师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author3',
      isFollowing: true
    }
  }
])

const nearbyVideos = ref([
  {
    id: 'v4',
    title: '公园晨练日常',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=video4',
    duration: 60,
    viewCount: 890,
    likeCount: 45,
    location: '中央公园',
    distance: '200米',
    author: {
      id: 'u4',
      name: '健身爱好者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author4',
      isFollowing: false
    }
  }
])

// 方法
const goBack = () => {
  router.back()
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchQuery.value = ''
  }
}

const handleSearch = () => {
  console.log('搜索视频:', searchQuery.value)
}

const switchTab = (tabKey: string) => {
  activeTab.value = tabKey
}

const playVideo = (video: any) => {
  console.log('🎬 开始播放视频:', video.title)

  // 跳转到视频播放页面
  router.push({
    path: '/video-player',
    query: {
      id: video.id,
      title: video.title,
      autoplay: 'true'
    }
  })
}

const followAuthor = (author: any) => {
  author.isFollowing = true
  appStore.showToast(`${videos?.follow?.value || '关注'} ${author.name}`, 'success')
}

const publishVideo = () => {
  router.push('/publish-video')
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

// 初始化
onMounted(() => {
  // 根据路由参数设置默认标签页
  const mode = route.query.mode
  if (mode === 'discover') {
    activeTab.value = 'recommend'
  }
})
</script>

<style scoped>
.videos-page {
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
}

.back-btn, .search-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.search-container {
  background: white;
  padding: 12px 16px;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 99;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  background: #f8f8f8;
}

.tabs-container {
  background: white;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 98;
  border-bottom: 1px solid #f0f0f0;
}

.tabs {
  display: flex;
  padding: 0 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-item.active {
  color: #07C160;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #07C160;
  border-radius: 1px;
}

.videos-content {
  padding: 120px 16px 80px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 16px 0 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
}

.video-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-item:hover {
  transform: translateY(-2px);
}

.video-cover {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-location {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .play-overlay {
  opacity: 1;
}

.video-info {
  padding: 16px;
}

.video-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.distance {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.follow-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
}

.video-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.publish-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #07C160;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
  transition: all 0.2s;
  z-index: 50;
}

.publish-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.4);
}
</style>

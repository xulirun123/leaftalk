<template>
  <div class="video-creator-center">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <h1 class="title">创作者中心</h1>
      <button class="settings-btn" @click="showSettings">
        <iconify-icon icon="heroicons:cog-6-tooth" width="24" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 创作者概览 -->
    <div class="creator-overview">
      <div class="creator-info">
        <img :src="creatorInfo.avatar" :alt="creatorInfo.name" class="creator-avatar" />
        <div class="creator-details">
          <h2 class="creator-name">{{ creatorInfo.name }}</h2>
          <p class="creator-desc">{{ creatorInfo.description || '暂无简介' }}</p>
        </div>
        <button class="edit-profile-btn" @click="editProfile">
          <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
        </button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ formatNumber(creatorStats.totalViews) }}</div>
          <div class="stat-label">总播放量</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ formatNumber(creatorStats.followers) }}</div>
          <div class="stat-label">粉丝数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ creatorStats.videos }}</div>
          <div class="stat-label">作品数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ formatNumber(creatorStats.likes) }}</div>
          <div class="stat-label">获赞数</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="action-grid">
        <div class="action-item" @click="createVideo">
          <div class="action-icon">
            <iconify-icon icon="heroicons:plus-circle" width="32" style="color: #07C160;"></iconify-icon>
          </div>
          <span class="action-label">发布作品</span>
        </div>
        <div class="action-item" @click="viewDrafts">
          <div class="action-icon">
            <iconify-icon icon="heroicons:document-text" width="32" style="color: #FF6B6B;"></iconify-icon>
          </div>
          <span class="action-label">草稿箱</span>
        </div>
        <div class="action-item" @click="viewAnalytics">
          <div class="action-icon">
            <iconify-icon icon="heroicons:chart-bar" width="32" style="color: #4ECDC4;"></iconify-icon>
          </div>
          <span class="action-label">数据分析</span>
        </div>
        <div class="action-item" @click="manageComments">
          <div class="action-icon">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="32" style="color: #FFD93D;"></iconify-icon>
          </div>
          <span class="action-label">评论管理</span>
        </div>
      </div>
    </div>

    <!-- 我的作品 -->
    <div class="my-videos">
      <div class="section-header">
        <h3>我的作品</h3>
        <div class="filter-tabs">
          <button 
            v-for="tab in videoTabs" 
            :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="videos-grid" v-if="filteredVideos.length > 0">
        <div 
          v-for="video in filteredVideos" 
          :key="video.id"
          class="video-card"
          @click="viewVideo(video)"
        >
          <div class="video-thumbnail">
            <img :src="video.thumbnailUrl" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="video-status" :class="video.status">
              {{ getStatusText(video.status) }}
            </div>
          </div>
          <div class="video-info">
            <h4 class="video-title">{{ video.title }}</h4>
            <div class="video-stats">
              <span class="stat">{{ formatNumber(video.views) }} 播放</span>
              <span class="stat">{{ formatNumber(video.likeCount) }} 赞</span>
              <span class="stat">{{ formatDate(video.createdTime) }}</span>
            </div>
          </div>
          <div class="video-actions">
            <button class="action-btn" @click.stop="editVideo(video)">
              <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
            </button>
            <button class="action-btn" @click.stop="shareVideo(video)">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            </button>
            <button class="action-btn danger" @click.stop="deleteVideo(video)">
              <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <iconify-icon icon="heroicons:video-camera-slash" width="64" style="color: #ccc;"></iconify-icon>
        <p>暂无{{ activeTabLabel }}作品</p>
        <button class="create-btn" @click="createVideo">创建第一个作品</button>
      </div>
    </div>

    <!-- 最近数据 -->
    <div class="recent-data">
      <h3>最近7天数据</h3>
      <div class="data-cards">
        <div class="data-card">
          <div class="data-icon">
            <iconify-icon icon="heroicons:eye" width="24" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="data-content">
            <div class="data-number">{{ formatNumber(recentData.views) }}</div>
            <div class="data-label">新增播放</div>
            <div class="data-change" :class="{ positive: recentData.viewsChange > 0 }">
              {{ recentData.viewsChange > 0 ? '+' : '' }}{{ recentData.viewsChange }}%
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="data-icon">
            <iconify-icon icon="heroicons:heart" width="24" style="color: #FF6B6B;"></iconify-icon>
          </div>
          <div class="data-content">
            <div class="data-number">{{ formatNumber(recentData.likes) }}</div>
            <div class="data-label">新增点赞</div>
            <div class="data-change" :class="{ positive: recentData.likesChange > 0 }">
              {{ recentData.likesChange > 0 ? '+' : '' }}{{ recentData.likesChange }}%
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="data-icon">
            <iconify-icon icon="heroicons:user-plus" width="24" style="color: #4ECDC4;"></iconify-icon>
          </div>
          <div class="data-content">
            <div class="data-number">{{ formatNumber(recentData.followers) }}</div>
            <div class="data-label">新增粉丝</div>
            <div class="data-change" :class="{ positive: recentData.followersChange > 0 }">
              {{ recentData.followersChange > 0 ? '+' : '' }}{{ recentData.followersChange }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创作工具 -->
    <div class="creator-tools">
      <h3>创作工具</h3>
      <div class="tools-grid">
        <div class="tool-item" @click="openVideoEditor">
          <iconify-icon icon="heroicons:film" width="32" style="color: #07C160;"></iconify-icon>
          <span>视频编辑器</span>
        </div>
        <div class="tool-item" @click="openMusicLibrary">
          <iconify-icon icon="heroicons:musical-note" width="32" style="color: #FF6B6B;"></iconify-icon>
          <span>音乐库</span>
        </div>
        <div class="tool-item" @click="openEffectsLibrary">
          <iconify-icon icon="heroicons:sparkles" width="32" style="color: #4ECDC4;"></iconify-icon>
          <span>特效库</span>
        </div>
        <div class="tool-item" @click="openTemplates">
          <iconify-icon icon="heroicons:rectangle-stack" width="32" style="color: #FFD93D;"></iconify-icon>
          <span>模板库</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { videoChannelApi } from '../../services/videoChannelApi'

const router = useRouter()

// 响应式数据
const creatorInfo = ref({
  id: 'current_user',
  name: '我的视频号',
  avatar: '',
  description: '分享生活中的美好时刻'
})

const creatorStats = ref({
  totalViews: 125000,
  followers: 1250,
  videos: 15,
  likes: 8500
})

const recentData = ref({
  views: 12500,
  viewsChange: 15.2,
  likes: 850,
  likesChange: 8.5,
  followers: 125,
  followersChange: 12.3
})

const myVideos = ref([])
const activeTab = ref('published')

const videoTabs = [
  { key: 'published', label: '已发布' },
  { key: 'reviewing', label: '审核中' },
  { key: 'draft', label: '草稿' },
  { key: 'rejected', label: '未通过' }
]

// 计算属性
const activeTabLabel = computed(() => {
  const tab = videoTabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : ''
})

const filteredVideos = computed(() => {
  return myVideos.value.filter(video => video.status === activeTab.value)
})

// 方法
const goBack = () => {
  router.back()
}

const showSettings = () => {
  router.push('/video-creator-settings')
}

const editProfile = () => {
  router.push('/video-creator-profile')
}

const createVideo = () => {
  router.push('/video-create')
}

const viewDrafts = () => {
  activeTab.value = 'draft'
}

const viewAnalytics = () => {
  router.push('/video-analytics')
}

const manageComments = () => {
  router.push('/video-comments')
}

const viewVideo = (video: any) => {
  router.push(`/video/${video.id}`)
}

const editVideo = (video: any) => {
  router.push(`/video-edit/${video.id}`)
}

const shareVideo = (video: any) => {
  // 分享视频逻辑
  console.log('分享视频:', video.title)
}

const deleteVideo = async (video: any) => {
  const confirmed = confirm(`确定要删除视频"${video.title}"吗？`)
  if (!confirmed) return

  try {
    // 调用删除API
    console.log('删除视频:', video.id)
    
    // 从列表中移除
    const index = myVideos.value.findIndex(v => v.id === video.id)
    if (index > -1) {
      myVideos.value.splice(index, 1)
    }
  } catch (error) {
    console.error('删除视频失败:', error)
  }
}

const openVideoEditor = () => {
  router.push('/video-editor')
}

const openMusicLibrary = () => {
  router.push('/music-library')
}

const openEffectsLibrary = () => {
  router.push('/effects-library')
}

const openTemplates = () => {
  router.push('/video-templates')
}

// 工具函数
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString()
}

const getStatusText = (status: string) => {
  const statusMap = {
    published: '已发布',
    reviewing: '审核中',
    draft: '草稿',
    rejected: '未通过'
  }
  return statusMap[status] || status
}

// 生成头像
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${color}"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">${initial}</text></svg>`
}

// 加载数据
const loadCreatorData = async () => {
  try {
    // 获取当前用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    creatorInfo.value.name = user.name || '我的视频号'
    creatorInfo.value.avatar = user.avatar || generateAvatar(creatorInfo.value.name)

    // 获取用户的视频
    const response = await videoChannelApi.getUserVideos(user.id || 'current_user')
    if (response.success) {
      myVideos.value = response.data
    }

    // 获取频道信息
    const channelResponse = await videoChannelApi.getChannel(user.id || 'current_user')
    if (channelResponse.success) {
      const channel = channelResponse.data
      creatorStats.value = {
        totalViews: channel.totalViews,
        followers: channel.followerCount,
        videos: channel.videoCount,
        likes: creatorStats.value.likes // 保持模拟数据
      }
    }

    console.log('✅ 创作者数据加载完成')
  } catch (error) {
    console.error('❌ 加载创作者数据失败:', error)
  }
}

onMounted(() => {
  loadCreatorData()
})
</script>

<style scoped>
.video-creator-center {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .settings-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover, .settings-btn:hover {
  background: #f0f0f0;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.creator-overview {
  background: white;
  margin-bottom: 12px;
  padding: 20px 16px;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.creator-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-details {
  flex: 1;
}

.creator-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.creator-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.edit-profile-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-profile-btn:hover {
  background: #e0e0e0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.quick-actions {
  background: white;
  margin-bottom: 12px;
  padding: 20px 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #f8f8f8;
}

.action-label {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.my-videos {
  background: white;
  margin-bottom: 12px;
  padding: 20px 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #07C160;
  border-color: #07C160;
  color: white;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.video-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.video-card:hover {
  transform: translateY(-2px);
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 9/16;
  background: #f0f0f0;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.video-status {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
}

.video-status.published {
  background: #07C160;
}

.video-status.reviewing {
  background: #FFD93D;
  color: #333;
}

.video-status.draft {
  background: #666;
}

.video-status.rejected {
  background: #FF6B6B;
}

.video-info {
  padding: 8px;
}

.video-title {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.video-stats .stat {
  font-size: 10px;
  color: #999;
}

.video-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
}

.action-btn.danger {
  color: #ff4444;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 16px 0;
  font-size: 14px;
}

.create-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background: #06a552;
}

.recent-data {
  background: white;
  margin-bottom: 12px;
  padding: 20px 16px;
}

.recent-data h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.data-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.data-content {
  flex: 1;
}

.data-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.data-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.data-change {
  font-size: 10px;
  color: #999;
}

.data-change.positive {
  color: #07C160;
}

.creator-tools {
  background: white;
  padding: 20px 16px;
}

.creator-tools h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tool-item:hover {
  background: #f8f8f8;
}

.tool-item span {
  font-size: 12px;
  color: #333;
  text-align: center;
}
</style>

<template>
  <div class="video-channels">
    <div class="content">
      <!-- 频道信息头部 -->
      <div class="channel-header">
        <div class="channel-info">
          <div class="avatar-section">
            <img :src="friendInfo.avatar" :alt="friendInfo.name" class="avatar" />
          </div>
          <div class="info-section">
            <h3 class="name">{{ friendInfo.name }}</h3>
            <p class="description">{{ friendInfo.channelDescription || '分享生活中的美好瞬间' }}</p>
            <div class="stats">
              <span class="stat-item">{{ videoCount }} 个视频</span>
              <span class="stat-item">{{ followerCount }} 关注</span>
            </div>
          </div>
        </div>
        <div class="channel-actions">
          <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
            {{ isFollowed ? '已关注' : '关注' }}
          </button>
        </div>
      </div>

      <!-- 视频列表 -->
      <div class="videos-section">
        <div v-if="videos.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:video-camera" width="48" style="color: #ccc;"></iconify-icon>
          <p>暂无视频内容</p>
        </div>
        
        <div v-else class="videos-grid">
          <div 
            v-for="video in videos" 
            :key="video.id" 
            class="video-item"
            @click="playVideo(video)"
          >
            <div class="video-thumbnail">
              <img :src="video.thumbnail" :alt="video.title" class="thumbnail-image" />
              <div class="play-overlay">
                <iconify-icon icon="heroicons:play" width="24"></iconify-icon>
              </div>
              <div class="video-duration">{{ video.duration }}</div>
              <div class="video-views">{{ formatViews(video.views) }}</div>
            </div>
            <div class="video-info">
              <h4 class="video-title">{{ video.title }}</h4>
              <p class="video-meta">
                <span class="upload-time">{{ formatTime(video.uploadTime) }}</span>
                <span class="like-count">
                  <iconify-icon icon="heroicons:heart" width="14"></iconify-icon>
                  {{ formatCount(video.likeCount) }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放器模态框 -->
    <div v-if="showVideoPlayer" class="video-player-modal" @click="closeVideoPlayer">
      <div class="video-player-container" @click.stop>
        <div class="video-player-header">
          <h3 class="player-title">{{ currentVideo?.title }}</h3>
          <button class="close-btn" @click="closeVideoPlayer">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        <div class="video-player">
          <img :src="currentVideo?.thumbnail" :alt="currentVideo?.title" class="video-placeholder" />
          <div class="play-button" @click="startPlay">
            <iconify-icon icon="heroicons:play" width="48"></iconify-icon>
          </div>
        </div>
        <div class="video-actions">
          <button class="action-btn" @click="likeVideo">
            <iconify-icon 
              :icon="currentVideo?.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
              width="20"
              :style="{ color: currentVideo?.isLiked ? '#ff4757' : '#666' }"
            ></iconify-icon>
            <span>{{ formatCount(currentVideo?.likeCount || 0) }}</span>
          </button>
          <button class="action-btn" @click="commentVideo">
            <iconify-icon icon="heroicons:chat-bubble-left" width="20"></iconify-icon>
            <span>{{ formatCount(currentVideo?.commentCount || 0) }}</span>
          </button>
          <button class="action-btn" @click="shareVideo">
            <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 好友信息
const friendInfo = ref({
  id: null,
  name: '加载中...',
  avatar: '',
  channelDescription: ''
})

// 关注状态
const isFollowed = ref(false)

// 视频播放器
const showVideoPlayer = ref(false)
const currentVideo = ref(null)

// 视频数据
const videos = ref([
  {
    id: '1',
    title: '美好的一天从早餐开始',
    thumbnail: 'https://picsum.photos/300/400?random=1',
    duration: '00:45',
    views: 1234,
    likeCount: 89,
    commentCount: 12,
    uploadTime: Date.now() - 86400000,
    isLiked: false,
    url: 'https://example.com/video1.mp4'
  },
  {
    id: '2',
    title: '城市夜景真的太美了',
    thumbnail: 'https://picsum.photos/300/400?random=2',
    duration: '01:20',
    views: 2567,
    likeCount: 156,
    commentCount: 23,
    uploadTime: Date.now() - 172800000,
    isLiked: true,
    url: 'https://example.com/video2.mp4'
  },
  {
    id: '3',
    title: '周末的悠闲时光',
    thumbnail: 'https://picsum.photos/300/400?random=3',
    duration: '02:15',
    views: 3456,
    likeCount: 234,
    commentCount: 45,
    uploadTime: Date.now() - 259200000,
    isLiked: false,
    url: 'https://example.com/video3.mp4'
  }
])

// 计算属性
const videoCount = computed(() => videos.value.length)
const followerCount = computed(() => 1234) // 模拟关注数

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / 86400000)

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 格式化数字
const formatCount = (count: number) => {
  if (count < 1000) return count.toString()
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  return `${(count / 10000).toFixed(1)}w`
}

// 格式化观看次数
const formatViews = (views: number) => {
  return `${formatCount(views)} 次播放`
}

// 切换关注状态
const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  appStore.showToast(isFollowed.value ? '已关注' : '已取消关注', 'success')
}

// 播放视频
const playVideo = (video: any) => {
  console.log('📹 播放视频:', video.title)
  currentVideo.value = video
  showVideoPlayer.value = true
}

// 关闭视频播放器
const closeVideoPlayer = () => {
  showVideoPlayer.value = false
  currentVideo.value = null
}

// 开始播放
const startPlay = () => {
  console.log('▶️ 开始播放视频:', currentVideo.value?.title)
  appStore.showToast('视频播放功能开发中', 'info')
}

// 点赞视频
const likeVideo = () => {
  if (currentVideo.value) {
    currentVideo.value.isLiked = !currentVideo.value.isLiked
    currentVideo.value.likeCount += currentVideo.value.isLiked ? 1 : -1
    appStore.showToast(currentVideo.value.isLiked ? '已点赞' : '已取消点赞', 'success')
  }
}

// 评论视频
const commentVideo = () => {
  console.log('💬 评论视频:', currentVideo.value?.title)
  appStore.showToast('评论功能开发中', 'info')
}

// 分享视频
const shareVideo = () => {
  console.log('📤 分享视频:', currentVideo.value?.title)
  appStore.showToast('分享功能开发中', 'info')
}

// 加载好友视频号数据
const loadVideoChannels = () => {
  const friendId = route.params.id
  console.log('📹 加载视频号:', friendId)

  // 使用模拟数据
  friendInfo.value = {
    id: friendId,
    name: `好友${friendId}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=friend${friendId}`,
    channelDescription: '记录生活中的美好瞬间，分享快乐与感动。'
  }

  // TODO: 从API加载实际的视频数据
  // const videosData = await videoAPI.getFriendVideos(friendId)
  // videos.value = videosData
}

// 组件挂载时加载数据
onMounted(() => {
  loadVideoChannels()
})
</script>

<style scoped>
.video-channels {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 频道信息头部 */
.channel-header {
  background: white;
  padding: 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.channel-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.avatar-section {
  margin-right: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.info-section .name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.description {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 12px;
  color: #999;
}

.channel-actions {
  margin-left: 16px;
}

.follow-btn {
  padding: 8px 16px;
  border: 1px solid #07C160;
  border-radius: 20px;
  background: white;
  color: #07C160;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.follow-btn.followed {
  background: #07C160;
  color: white;
}

.follow-btn:hover {
  background: #06AD56;
  color: white;
  border-color: #06AD56;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 16px 0 0 0;
  font-size: 16px;
}

/* 视频网格 */
.videos-section {
  background: white;
  padding: 16px;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.video-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.video-item:hover {
  transform: translateY(-2px);
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-item:hover .play-overlay {
  opacity: 1;
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

.video-views {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.video-info {
  padding: 8px 4px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  font-size: 12px;
  color: #999;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.like-count {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 视频播放器模态框 */
.video-player-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.video-player-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.video-player-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.player-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  margin-right: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
}

.video-player {
  position: relative;
  aspect-ratio: 3/4;
  background: #000;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.play-button:hover {
  background: rgba(0, 0, 0, 0.8);
}

.video-actions {
  padding: 16px;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}
</style>

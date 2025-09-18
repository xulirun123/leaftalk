<template>
  <div class="friend-videos">
    <MobileTopBar 
      :title="`${friendInfo.name}的视频号`" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 视频号内容 -->
    <div class="videos-content">
      <!-- 用户信息 -->
      <div class="user-header">
        <div class="user-avatar">
          <img :src="friendInfo.avatar" :alt="friendInfo.name" />
        </div>
        <div class="user-info">
          <div class="user-name">{{ friendInfo.name }}</div>
          <div class="user-desc">{{ friendInfo.videoDesc || '分享生活的美好瞬间' }}</div>
          <div class="user-stats">
            <span>{{ friendInfo.videoCount || 0 }}个视频</span>
            <span>{{ friendInfo.followerCount || 0 }}个粉丝</span>
          </div>
        </div>
        <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
          {{ isFollowed ? '已关注' : '关注' }}
        </button>
      </div>

      <!-- 视频列表 -->
      <div class="videos-grid">
        <div 
          v-for="video in videos" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.cover" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="play-icon">
              <iconify-icon icon="heroicons:play-solid" width="24"></iconify-icon>
            </div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-stats">
              <span>{{ formatViewCount(video.viewCount) }}次播放</span>
              <span>{{ formatTime(video.createTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="videos.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:video-camera" width="48" style="color: #ccc;"></iconify-icon>
          <p>暂无视频内容</p>
        </div>
      </div>
    </div>

    <!-- 视频播放器弹窗 -->
    <div v-if="showVideoPlayer" class="video-player-modal" @click="closeVideoPlayer">
      <div class="video-player-container" @click.stop>
        <div class="video-header">
          <div class="video-user">
            <img :src="friendInfo.avatar" :alt="friendInfo.name" class="user-avatar-small" />
            <span class="user-name-small">{{ friendInfo.name }}</span>
          </div>
          <button class="close-btn" @click="closeVideoPlayer">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        
        <div class="video-wrapper">
          <video 
            ref="videoPlayer"
            :src="currentVideo?.url" 
            controls 
            autoplay
            class="video-element"
          ></video>
        </div>
        
        <div class="video-details">
          <h3 class="video-title">{{ currentVideo?.title }}</h3>
          <div class="video-meta">
            <span>{{ formatViewCount(currentVideo?.viewCount) }}次播放</span>
            <span>{{ formatTime(currentVideo?.createTime) }}</span>
          </div>
          <div class="video-actions">
            <button class="action-btn" @click="likeVideo">
              <iconify-icon 
                :icon="currentVideo?.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
                :style="{ color: currentVideo?.isLiked ? '#ff4444' : '#666' }"
                width="20"
              ></iconify-icon>
              <span>{{ currentVideo?.likeCount || 0 }}</span>
            </button>
            <button class="action-btn" @click="shareVideo">
              <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()

// 好友ID
const friendId = computed(() => route.params.id as string)

// 好友信息
const friendInfo = ref({
  id: '',
  name: '',
  avatar: '',
  videoDesc: '',
  videoCount: 0,
  followerCount: 0
})

// 关注状态
const isFollowed = ref(false)

// 视频播放器
const showVideoPlayer = ref(false)
const currentVideo = ref<any>(null)
const videoPlayer = ref<HTMLVideoElement>()

// 视频列表
const videos = ref<any[]>([]) // 默认无视频，显示空状态

// 返回上一页
const goBack = () => {
  router.back()
}

// 切换关注状态
const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  console.log('关注状态:', isFollowed.value)
}

// 播放视频
const playVideo = (video: any) => {
  currentVideo.value = video
  showVideoPlayer.value = true
  console.log('播放视频:', video.title)
}

// 关闭视频播放器
const closeVideoPlayer = () => {
  showVideoPlayer.value = false
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
}

// 点赞视频
const likeVideo = () => {
  if (currentVideo.value) {
    currentVideo.value.isLiked = !currentVideo.value.isLiked
    if (currentVideo.value.isLiked) {
      currentVideo.value.likeCount = (currentVideo.value.likeCount || 0) + 1
    } else {
      currentVideo.value.likeCount = Math.max(0, (currentVideo.value.likeCount || 0) - 1)
    }
    console.log('点赞视频:', currentVideo.value.id, currentVideo.value.isLiked)
  }
}

// 分享视频
const shareVideo = () => {
  console.log('分享视频:', currentVideo.value?.id)
  // 这里可以实现分享功能
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 格式化播放次数
const formatViewCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 加载好友信息
const loadFriendInfo = () => {
  friendInfo.value = {
    id: friendId.value,
    name: `好友${friendId.value}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId.value}`,
    videoDesc: '分享生活的美好瞬间',
    videoCount: videos.value.length,
    followerCount: 1234
  }
}

onMounted(() => {
  loadFriendInfo()
})
</script>

<style scoped>
.friend-videos {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 100px;
}

/* 用户信息头部 */
.user-header {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: white;
  margin-bottom: 12px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}

.user-stats {
  font-size: 12px;
  color: #999;
}

.user-stats span {
  margin-right: 16px;
}

.follow-btn {
  padding: 8px 20px;
  border: 1px solid #07C160;
  border-radius: 20px;
  background: white;
  color: #07C160;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn.followed {
  background: #07C160;
  color: white;
}

.follow-btn:hover {
  background: #07C160;
  color: white;
}

/* 视频网格 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 16px;
}

.video-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.video-item:hover {
  transform: translateY(-2px);
}

.video-cover {
  position: relative;
  aspect-ratio: 3/4;
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

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .play-icon {
  opacity: 1;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-stats {
  font-size: 12px;
  color: #999;
}

.video-stats span {
  margin-right: 12px;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
}

/* 视频播放器弹窗 */
.video-player-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-container {
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 16px;
}

.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
}

.video-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.user-name-small {
  color: white;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.video-wrapper {
  position: relative;
  aspect-ratio: 9/16;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-details {
  padding: 16px;
  background: white;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.video-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
}

.video-meta span {
  margin-right: 16px;
}

.video-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #07C160;
}
</style>

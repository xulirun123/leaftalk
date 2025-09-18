<template>
  <div class="video-channel">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-actions">
        <button class="publish-btn" @click="showPublishDialog">
          <iconify-icon icon="heroicons:plus" width="20" style="color: #07C160;"></iconify-icon>
          <span>发布</span>
        </button>
        <button class="float-window-btn" @click="toggleFloatWindow">
          <iconify-icon icon="heroicons:rectangle-stack" width="20" style="color: #333;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 导航标签 -->
    <div class="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 视频列表 -->
    <div class="video-list">
      <div class="video-grid">
        <div 
          v-for="video in displayVideos" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.coverImage" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="play-icon">
              <WeChatIcon name="play" :size="32" />
            </div>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ video.title }}</h3>
            <div class="video-meta">
              <div class="author-info">
                <img :src="video.userAvatar" :alt="video.userName" class="author-avatar" />
                <span class="author-name">{{ video.userName }}</span>
              </div>
              <div class="video-stats">
                <span class="view-count">{{ formatCount(video.viewCount) }} 次播放</span>
                <span class="like-count">{{ formatCount(video.likeCount) }} 赞</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="displayVideos.length === 0" class="empty-state">
        <WeChatIcon name="video" :size="64" />
        <p>暂无视频</p>
      </div>
    </div>

    <!-- 发布视频对话框 -->
    <div v-if="showPublishModal" class="publish-modal-overlay" @click="closePublishDialog">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发布视频</h3>
          <button class="close-btn" @click="closePublishDialog">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: #666;"></iconify-icon>
          </button>
        </div>

        <div class="modal-content">
          <!-- 视频选择 -->
          <div class="video-upload-section">
            <div v-if="!selectedVideo" class="upload-options">
              <div class="upload-option" @click="recordVideo">
                <iconify-icon icon="heroicons:video-camera" width="32" style="color: #07C160;"></iconify-icon>
                <span>拍摄</span>
              </div>
              <div class="upload-option" @click="selectFromGallery">
                <iconify-icon icon="heroicons:photo" width="32" style="color: #07C160;"></iconify-icon>
                <span>相册</span>
              </div>
            </div>
            <div v-else class="video-preview">
              <video :src="selectedVideo.url" controls class="preview-video"></video>
              <button class="change-video-btn" @click="showVideoOptions">更换视频</button>
            </div>
          </div>

          <!-- 视频信息 -->
          <div class="video-info-form">
            <div class="form-group">
              <label>标题</label>
              <input
                v-model="videoForm.title"
                type="text"
                placeholder="输入视频标题"
                maxlength="50"
                class="form-input"
              />
              <div class="char-count">{{ videoForm.title.length }}/50</div>
            </div>

            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="videoForm.description"
                placeholder="添加视频描述..."
                maxlength="200"
                class="form-textarea"
              ></textarea>
              <div class="char-count">{{ videoForm.description.length }}/200</div>
            </div>

            <div class="form-group">
              <label>隐私设置</label>
              <div class="privacy-options">
                <label class="radio-option">
                  <input type="radio" v-model="videoForm.privacy" value="public" />
                  <span>公开</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="videoForm.privacy" value="friends" />
                  <span>仅好友可见</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="videoForm.privacy" value="private" />
                  <span>私密</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closePublishDialog">取消</button>
          <button
            class="publish-submit-btn"
            @click="publishVideo"
            :disabled="!canPublish"
          >
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMomentsStore } from '../../../stores/moments'
import { useDiscoverStore } from './stores/discover'
import WeChatIcon from '../../components/icons/WeChatIcon.vue'

const router = useRouter()
const route = useRoute()
const momentsStore = useMomentsStore()
const discoverStore = useDiscoverStore()

// 响应式数据
const activeTab = ref('recommend')

// 发布相关
const showPublishModal = ref(false)
const selectedVideo = ref<{ url: string; file: File } | null>(null)
const newTag = ref('')
const showCameraModal = ref(false)
const showVideoOptions = ref(false)

const videoForm = ref({
  title: '',
  description: '',
  tags: [] as string[],
  privacy: 'public'
})

// 导航标签
const tabs = [
  { key: 'recommend', label: '推荐' },
  { key: 'follow', label: '关注' },
  { key: 'friends', label: '朋友' }
]

// 获取用户ID（如果是查看好友视频号）
const viewUserId = computed(() => route.params.userId as string || null)

// 是否在查看好友视频号
const isViewingFriend = computed(() => !!viewUserId.value)

// 页面标题
const pageTitle = computed(() => {
  if (isViewingFriend.value) {
    const friend = momentsStore.friends.find(f => f.id === viewUserId.value)
    return friend ? `${friend.name}的视频号` : '视频号'
  }
  return '视频号'
})

// 显示的视频列表
const displayVideos = computed(() => {
  if (isViewingFriend.value) {
    return momentsStore.getFriendVideoChannels(viewUserId.value)
  }
  
  switch (activeTab.value) {
    case 'friends':
      return momentsStore.allVideoChannels
    case 'follow':
      return momentsStore.videoChannels
    case 'recommend':
    default:
      return [...momentsStore.allVideoChannels, ...momentsStore.videoChannels].sort(() => Math.random() - 0.5)
  }
})

// 方法
const goBack = () => {
  router.back()
}

const toggleFloatWindow = () => {
  console.log('切换浮窗模式')
  // 这里可以实现浮窗功能
}

// 发布相关方法
const showPublishDialog = () => {
  // 直接跳转到创作页面
  router.push('/video-create')
}

const closePublishDialog = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  videoForm.value = {
    title: '',
    description: '',
    tags: [],
    privacy: 'public'
  }
  selectedVideo.value = null
  newTag.value = ''
}

// 显示视频选择选项
const showVideoOptionsModal = () => {
  showVideoOptions.value = true
}

// 拍摄视频
const recordVideo = async () => {
  try {
    // 跳转到视频发布页面，该页面有完整的拍摄功能
    router.push('/video-publish')
  } catch (error) {
    console.error('启动拍摄失败:', error)
    alert('无法启动拍摄功能，请检查权限设置')
  }
}

// 从相册选择
const selectFromGallery = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/mp4,video/mov,video/avi'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB
        alert('视频文件不能超过100MB')
        return
      }

      const url = URL.createObjectURL(file)
      selectedVideo.value = { url, file }
    }
  }
  input.click()
}

// 保持原有的 selectVideo 方法以兼容
const selectVideo = selectFromGallery

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !videoForm.value.tags.includes(tag) && videoForm.value.tags.length < 5) {
    videoForm.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = videoForm.value.tags.indexOf(tag)
  if (index > -1) {
    videoForm.value.tags.splice(index, 1)
  }
}

const canPublish = computed(() => {
  return selectedVideo.value &&
         videoForm.value.title.trim() &&
         videoForm.value.description.trim()
})

const publishVideo = async () => {
  if (!canPublish.value) return

  try {
    // 这里应该调用API上传视频
    console.log('发布视频:', {
      video: selectedVideo.value,
      form: videoForm.value
    })

    // 模拟发布成功
    alert('视频发布成功！')
    closePublishDialog()

    // 刷新视频列表
    // await loadVideos()

  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请重试')
  }
}

const playVideo = (video: any) => {
  console.log('播放视频:', video.title)
  // 这里可以实现视频播放逻辑
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

onMounted(() => {
  console.log('视频号页面加载完成')

  // 清零视频号未读数
  discoverStore.clearVideoUnread()
})
</script>

<style scoped>
.video-channel {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.back-btn, .float-window-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.nav-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #07C160;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: #07C160;
}

.video-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.video-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.video-item:hover {
  transform: translateY(-2px);
}

.video-cover {
  position: relative;
  width: 100%;
  height: 120px;
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

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  opacity: 0.8;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 12px;
  color: #666;
}

.video-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-state p {
  margin: 16px 0 0 0;
  font-size: 16px;
}

/* 发布按钮样式 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publish-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #07C160;
  border-radius: 16px;
  color: #07C160;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.publish-btn:hover {
  background: #07C160;
  color: white;
}

/* 发布对话框样式 */
.publish-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.publish-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.video-upload-section {
  margin-bottom: 24px;
}

.upload-options {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.upload-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  border: 2px dashed #07C160;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  min-width: 120px;
}

.upload-option:hover {
  background: #f8fff8;
  border-color: #05A050;
  transform: translateY(-2px);
}

.upload-option span {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.upload-area {
  border: 2px dashed #07C160;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  background: #f8fff8;
  border-color: #05A050;
}

.upload-area p {
  margin: 8px 0 4px;
  font-size: 16px;
  color: #333;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.video-preview {
  text-align: center;
}

.preview-video {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
}

.change-video-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.video-info-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
}

.form-textarea {
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
}

.privacy-options {
  display: flex;
  gap: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.publish-submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.publish-submit-btn {
  background: #07C160;
  color: white;
}

.publish-submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

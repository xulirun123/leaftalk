<template>
  <div class="story-detail-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="故事详情" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canEdit" @click="editStory" class="edit-btn">
          编辑
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="story-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载故事详情中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <iconify-icon icon="heroicons:exclamation-triangle" width="48" color="#ff4757"></iconify-icon>
        <p>{{ error }}</p>
        <button @click="loadStoryDetail" class="retry-btn">重试</button>
      </div>

      <!-- 故事详情 -->
      <div v-else-if="story" class="story-detail">
        <!-- 故事头部 -->
        <div class="story-header">
          <div class="story-meta">
            <div class="story-type" :class="story.type">
              <iconify-icon :icon="getStoryIcon(story.type)" width="16"></iconify-icon>
              <span>{{ getStoryTypeText(story.type) }}</span>
            </div>
            <div class="story-status" v-if="story.isFeatured">
              <iconify-icon icon="heroicons:star" width="14" color="#ffd700"></iconify-icon>
              <span>精选</span>
            </div>
          </div>
          <h1>{{ story.title }}</h1>
          <div class="story-info">
            <div class="author-info">
              <img 
                :src="story.authorAvatar || '/default-avatar.png'"
                :alt="story.authorName"
                class="author-avatar"
              />
              <div class="author-details">
                <h4>{{ story.authorName }}</h4>
                <p>{{ formatDate(story.createdAt) }}</p>
              </div>
            </div>
            <div class="story-stats">
              <span class="views">
                <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
                {{ story.viewCount || 0 }}
              </span>
              <span class="likes" :class="{ liked: story.isLiked }" @click="toggleLike">
                <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
                {{ story.likeCount || 0 }}
              </span>
              <span class="share" @click="shareStory">
                <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
                分享
              </span>
            </div>
          </div>
        </div>

        <!-- 故事封面 -->
        <div v-if="story.coverImage" class="story-cover">
          <img 
            :src="story.coverImage"
            :alt="story.title"
            class="cover-image"
            @click="viewImage(story.coverImage)"
          />
        </div>

        <!-- 故事内容 -->
        <div class="story-body">
          <div class="story-text" v-html="formatContent(story.content)"></div>
          
          <!-- 故事图片 -->
          <div v-if="story.images && story.images.length > 0" class="story-images">
            <h3>相关图片</h3>
            <div class="images-grid">
              <div 
                v-for="(image, index) in story.images" 
                :key="index"
                class="image-item"
                @click="viewImage(image.url, index)"
              >
                <img :src="image.thumbnail || image.url" :alt="image.description" />
                <div v-if="image.description" class="image-description">
                  {{ image.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关故事 -->
        <div v-if="relatedStories.length > 0" class="related-stories">
          <h3>相关故事</h3>
          <div class="related-list">
            <div 
              v-for="relatedStory in relatedStories" 
              :key="relatedStory.id"
              class="related-item"
              @click="viewStory(relatedStory)"
            >
              <img 
                :src="relatedStory.coverImage || '/default-story.jpg'"
                :alt="relatedStory.title"
                class="related-cover"
              />
              <div class="related-info">
                <h4>{{ relatedStory.title }}</h4>
                <p>{{ relatedStory.summary }}</p>
                <div class="related-meta">
                  <span>{{ relatedStory.authorName }}</span>
                  <span>{{ formatDate(relatedStory.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <h3>评论 ({{ comments.length }})</h3>
          
          <!-- 评论输入 -->
          <div class="comment-input">
            <textarea 
              v-model="newComment"
              placeholder="写下您的评论..."
              rows="3"
              maxlength="500"
            ></textarea>
            <button 
              @click="submitComment"
              :disabled="!newComment.trim() || isSubmitting"
              class="submit-btn"
            >
              <span v-if="isSubmitting">发布中...</span>
              <span v-else>发布</span>
            </button>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="comment-item"
            >
              <img 
                :src="comment.userAvatar || '/default-avatar.png'"
                :alt="comment.userName"
                class="comment-avatar"
              />
              <div class="comment-content">
                <div class="comment-header">
                  <h5>{{ comment.userName }}</h5>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p>{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片查看器 -->
    <div v-if="showImageViewer" class="image-viewer" @click="closeImageViewer">
      <div class="viewer-content" @click.stop>
        <button @click="closeImageViewer" class="close-btn">
          <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
        </button>
        <img :src="currentImage" :alt="story?.title" />
        <div v-if="story?.images && story.images.length > 1" class="image-nav">
          <button @click="prevImage" class="nav-btn">
            <iconify-icon icon="heroicons:chevron-left" width="20"></iconify-icon>
          </button>
          <span>{{ currentImageIndex + 1 }} / {{ story.images.length }}</span>
          <button @click="nextImage" class="nav-btn">
            <iconify-icon icon="heroicons:chevron-right" width="20"></iconify-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const storyId = ref(route.params.storyId)
const story = ref(null)
const relatedStories = ref([])
const comments = ref([])
const loading = ref(false)
const error = ref('')
const newComment = ref('')
const isSubmitting = ref(false)
const showImageViewer = ref(false)
const currentImage = ref('')
const currentImageIndex = ref(0)

// 计算属性
const canEdit = computed(() => {
  return story.value?.canEdit || false
})

// 生命周期
onMounted(() => {
  loadStoryDetail()
})

// 方法
const goBack = () => {
  // 直接返回到家族故事页面，避免中间的检测页面
  router.replace(`/genealogy/${genealogyId.value}/stories`)
}

const loadStoryDetail = async () => {
  if (!genealogyId.value || !storyId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/stories/${storyId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取故事详情失败')
    }

    const result = await response.json()
    if (result.success) {
      story.value = result.data.story
      relatedStories.value = result.data.relatedStories || []
      comments.value = result.data.comments || []
    } else {
      throw new Error(result.message || '获取故事详情失败')
    }

  } catch (err: any) {
    console.error('加载故事详情失败:', err)
    error.value = err.message || '加载失败'
    appStore.showToast('加载故事详情失败', 'error')
  } finally {
    loading.value = false
  }
}

const toggleLike = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/stories/${storyId.value}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      story.value.isLiked = !story.value.isLiked
      story.value.likeCount += story.value.isLiked ? 1 : -1
    }

  } catch (error) {
    console.error('点赞失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const shareStory = () => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'story',
    title: story.value?.title,
    summary: story.value?.summary,
    author: story.value?.author,
    createTime: story.value?.createTime,
    category: story.value?.category
  }

  appStore.showToast('正在分享到朋友圈...', 'info')

  // 模拟直接发布到朋友圈
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  isSubmitting.value = true
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/stories/${storyId.value}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: newComment.value.trim()
      })
    })

    const result = await response.json()
    if (result.success) {
      comments.value.unshift(result.data)
      newComment.value = ''
      appStore.showToast('评论发布成功', 'success')
    } else {
      appStore.showToast(result.message || '评论发布失败', 'error')
    }

  } catch (error) {
    console.error('发布评论失败:', error)
    appStore.showToast('评论发布失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const viewImage = (imageUrl: string, index: number = 0) => {
  currentImage.value = imageUrl
  currentImageIndex.value = index
  showImageViewer.value = true
}

const closeImageViewer = () => {
  showImageViewer.value = false
}

const prevImage = () => {
  if (story.value?.images && currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentImage.value = story.value.images[currentImageIndex.value].url
  }
}

const nextImage = () => {
  if (story.value?.images && currentImageIndex.value < story.value.images.length - 1) {
    currentImageIndex.value++
    currentImage.value = story.value.images[currentImageIndex.value].url
  }
}

const editStory = () => {
  router.push(`/genealogy/${genealogyId.value}/stories/${storyId.value}/edit`)
}

const viewStory = (relatedStory: any) => {
  router.push(`/genealogy/${genealogyId.value}/stories/${relatedStory.id}`)
}

const getStoryIcon = (type: string) => {
  const iconMap = {
    'history': 'heroicons:clock',
    'biography': 'heroicons:user',
    'tradition': 'heroicons:sparkles',
    'memory': 'heroicons:heart',
    'achievement': 'heroicons:trophy',
    'other': 'heroicons:book-open'
  }
  return iconMap[type] || iconMap.other
}

const getStoryTypeText = (type: string) => {
  const typeMap = {
    'history': '家族历史',
    'biography': '人物传记',
    'tradition': '传统文化',
    'memory': '回忆录',
    'achievement': '成就荣誉',
    'other': '其他故事'
  }
  return typeMap[type] || '其他故事'
}

const formatContent = (content: string) => {
  if (!content) return ''
  // 简单的文本格式化，将换行转换为<br>
  return content.replace(/\n/g, '<br>')
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.story-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.edit-btn {
  background: none;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
}

.story-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
}

/* 加载和错误状态样式 */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 75px);
  color: #666;
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 16px;
}

/* 故事详情样式 */
.story-detail {
  background: white;
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.story-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.story-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.story-type {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.story-type.history {
  background: #e3f2fd;
  color: #1976d2;
}

.story-type.biography {
  background: #f3e5f5;
  color: #7b1fa2;
}

.story-type.tradition {
  background: #fff3e0;
  color: #f57c00;
}

.story-type.memory {
  background: #fce4ec;
  color: #c2185b;
}

.story-type.achievement {
  background: #e8f5e8;
  color: #388e3c;
}

.story-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #ffd700;
}

.story-header h1 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
  line-height: 1.3;
}

.story-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.author-details p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.story-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.story-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.story-stats .likes.liked {
  color: #ff4757;
}

.story-stats .share {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
}

.story-stats .share:hover {
  color: #07C160;
}

.story-cover {
  width: 100%;
  max-height: 300px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.story-body {
  padding: 24px;
}

.story-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 32px;
}

.story-images h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.image-item:hover {
  transform: scale(1.02);
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.image-description {
  padding: 8px;
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
}

/* 相关故事样式 */
.related-stories {
  padding: 24px;
  border-top: 1px solid #f0f0f0;
}

.related-stories h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.related-item:hover {
  background: #e9ecef;
}

.related-cover {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.related-info {
  flex: 1;
}

.related-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.related-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.related-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #999;
}

/* 评论区样式 */
.comments-section {
  padding: 24px;
  border-top: 1px solid #f0f0f0;
}

.comments-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.comment-input {
  margin-bottom: 24px;
}

.comment-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}

.submit-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.comment-header h5 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 图片查看器样式 */
.image-viewer {
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
}

.viewer-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.viewer-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
}

.image-nav {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
  font-size: 14px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}
</style>

<template>
  <div class="family-stories-page">
    <!-- 顶部导航 -->
    <MobileTopBar
      title="家族故事"
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canPublish" @click="publishStory" class="publish-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 故事分类标签 -->
      <div class="category-tabs">
        <div
          v-for="category in categories"
          :key="category.value"
          class="category-tab"
          :class="{ active: currentCategory === category.value }"
          @click="setCategory(category.value)"
        >
          <iconify-icon :icon="category.icon" width="16"></iconify-icon>
          <span>{{ category.label }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
    <div class="stories-content">
      <!-- 故事列表 -->
      <div class="stories-list">
        <div
          v-for="story in filteredStories"
          :key="story.id"
          class="story-card"
          @click="viewStoryDetail(story)"
        >
          <!-- 故事封面 -->
          <div v-if="story.cover" class="story-cover">
            <img :src="story.cover" :alt="story.title" />
            <div class="story-type" :class="story.type">
              {{ getTypeText(story.type) }}
            </div>
          </div>

          <!-- 故事信息 -->
          <div class="story-info">
            <h3 class="story-title">{{ story.title }}</h3>
            <p class="story-summary">{{ story.summary }}</p>

            <div class="story-meta">
              <div class="author-info">
                <img :src="story.author.avatar || '/default-avatar.png'" :alt="story.author.name" />
                <span>{{ story.author.name }}</span>
              </div>
              <div class="story-stats">
                <span class="publish-time">{{ formatDate(story.publishTime) }}</span>
                <span class="read-count">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  {{ story.readCount }}
                </span>
                <span class="like-count">
                  <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
                  {{ story.likeCount }}
                </span>
              </div>
            </div>

            <!-- 故事标签 -->
            <div class="story-tags">
              <span
                v-for="tag in story.tags"
                :key="tag"
                class="story-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="story-actions">
            <button @click.stop="likeStory(story)" class="action-btn" :class="{ liked: story.isLiked }">
              <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
              {{ story.isLiked ? '已赞' : '点赞' }}
            </button>
            <button @click.stop="shareStory(story)" class="action-btn">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              分享
            </button>
            <button @click.stop="viewStoryDetail(story)" class="action-btn primary">
              <iconify-icon icon="heroicons:book-open" width="16"></iconify-icon>
              阅读
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredStories.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:book-open" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无故事</h3>
        <p>{{ currentCategory === 'all' ? '还没有任何家族故事' : '该分类下暂无故事' }}</p>
        <button v-if="canPublish" @click="publishStory" class="publish-story-btn">
          发布故事
        </button>
      </div>
    </div>

    <!-- 发布故事弹窗 -->
    <div v-if="showPublishModal" class="modal-overlay" @click="closePublishModal">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发布故事</h3>
          <button @click="closePublishModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitStory" class="publish-form">
            <div class="form-group">
              <label>故事标题</label>
              <input
                v-model="newStory.title"
                type="text"
                placeholder="请输入故事标题"
                required
              />
            </div>
            <div class="form-group">
              <label>故事摘要</label>
              <textarea
                v-model="newStory.summary"
                placeholder="请输入故事摘要"
                rows="2"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label>故事内容</label>
              <textarea
                v-model="newStory.content"
                placeholder="请输入故事内容"
                rows="6"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>故事类型</label>
                <select v-model="newStory.type" required>
                  <option value="">请选择</option>
                  <option value="legend">传说故事</option>
                  <option value="history">历史记录</option>
                  <option value="biography">人物传记</option>
                  <option value="tradition">传统文化</option>
                  <option value="memory">回忆录</option>
                </select>
              </div>
              <div class="form-group">
                <label>故事封面</label>
                <button type="button" @click="uploadCover" class="upload-cover-btn">
                  <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
                  上传封面
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>故事标签</label>
              <div class="tags-input">
                <div class="selected-tags">
                  <span
                    v-for="(tag, index) in newStory.tags"
                    :key="index"
                    class="selected-tag"
                  >
                    {{ tag }}
                    <button type="button" @click="removeTag(index)" class="remove-tag">
                      <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
                    </button>
                  </span>
                </div>
                <input
                  v-model="tagInput"
                  type="text"
                  placeholder="输入标签后按回车添加"
                  @keydown.enter.prevent="addTag"
                />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closePublishModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                发布故事
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const currentCategory = ref('all')
const showPublishModal = ref(false)
const tagInput = ref('')

const categories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '传说', value: 'legend', icon: 'heroicons:sparkles' },
  { label: '历史', value: 'history', icon: 'heroicons:clock' },
  { label: '传记', value: 'biography', icon: 'heroicons:user' },
  { label: '文化', value: 'tradition', icon: 'heroicons:academic-cap' },
  { label: '回忆', value: 'memory', icon: 'heroicons:heart' }
])

const stories = ref([
  {
    id: 1,
    title: '张氏始祖的传奇故事',
    summary: '讲述张氏家族始祖张挥的传奇人生和创业历程',
    content: '很久很久以前，张挥...',
    type: 'legend',
    cover: '/story-covers/ancestor-legend.jpg',
    author: {
      id: 1,
      name: '张长老',
      avatar: '/avatars/elder.jpg'
    },
    publishTime: new Date('2024-01-15'),
    readCount: 1256,
    likeCount: 89,
    isLiked: false,
    tags: ['始祖', '传说', '历史']
  },
  {
    id: 2,
    title: '爷爷的抗战岁月',
    summary: '记录爷爷在抗日战争期间的英勇事迹',
    content: '1937年，爷爷参军...',
    type: 'history',
    cover: '/story-covers/war-memories.jpg',
    author: {
      id: 2,
      name: '张小明',
      avatar: '/avatars/xiaoming.jpg'
    },
    publishTime: new Date('2024-01-10'),
    readCount: 856,
    likeCount: 67,
    isLiked: true,
    tags: ['抗战', '英雄', '历史']
  }
])

const newStory = ref({
  title: '',
  summary: '',
  content: '',
  type: '',
  cover: '',
  tags: []
})

// 计算属性
const canPublish = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin' || authStore.user?.role === 'member'
})

const filteredStories = computed(() => {
  if (currentCategory.value === 'all') {
    return stories.value
  }
  return stories.value.filter(story => story.type === currentCategory.value)
})

// 生命周期
onMounted(() => {
  loadStories()
})

// 方法
const goBack = () => {
  router.back()
}

const loadStories = async () => {
  if (!genealogyId.value) {
    appStore.showToast('族谱ID不存在', 'error')
    return
  }

  try {
    console.log('📚 加载家族故事数据，族谱ID:', genealogyId.value)

    const response = await fetch(`http://localhost:8893/api/genealogies/${genealogyId.value}/stories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取家族故事失败')
    }

    const result = await response.json()
    if (result.success) {
      // 处理故事数据，转换为前端需要的格式
      stories.value = result.data.map((story: any) => ({
        id: story.id,
        title: story.title,
        content: story.content,
        summary: story.summary || story.content?.substring(0, 100) + '...',
        category: story.category,
        cover: story.coverImage,
        images: story.images || [],
        author: {
          name: story.author?.name || story.authorName || '未知作者',
          avatar: story.author?.avatar || story.authorAvatar || '/default-avatar.png'
        },
        publishTime: story.publishTime || story.date || story.createdAt,
        readCount: story.readCount || 0,
        likeCount: story.likeCount || 0,
        commentCount: story.commentCount || 0,
        tags: story.tags || [],
        isFeatured: story.isFeatured || false
      }))

      console.log('✅ 家族故事数据加载成功，共', stories.value.length, '个故事')
    } else {
      throw new Error(result.message || '获取家族故事失败')
    }

  } catch (error: any) {
    console.error('❌ 加载家族故事失败:', error)
    appStore.showToast(error.message || '加载家族故事失败', 'error')
  }
}

const setCategory = (category: string) => {
  currentCategory.value = category
}

const formatDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const getTypeText = (type: string) => {
  const typeMap = {
    legend: '传说',
    history: '历史',
    biography: '传记',
    tradition: '文化',
    memory: '回忆'
  }
  return typeMap[type] || type
}

const viewStoryDetail = (story: any) => {
  router.push(`/genealogy/${genealogyId.value}/stories/${story.id}`)
}

const likeStory = async (story: any) => {
  try {
    story.isLiked = !story.isLiked
    story.likeCount += story.isLiked ? 1 : -1
    appStore.showToast(story.isLiked ? '已点赞' : '已取消点赞', 'success')
  } catch (error) {
    appStore.showToast('操作失败', 'error')
  }
}

const shareStory = (story: any) => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'story',
    title: story.title,
    summary: story.summary,
    author: story.author,
    createTime: story.createTime,
    category: story.category
  }

  appStore.showToast('正在分享到朋友圈...', 'info')

  // 模拟直接发布到朋友圈
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}

const publishStory = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  newStory.value = {
    title: '',
    summary: '',
    content: '',
    type: '',
    cover: '',
    tags: []
  }
  tagInput.value = ''
}

const uploadCover = () => {
  appStore.showToast('封面上传功能开发中', 'info')
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !newStory.value.tags.includes(tag)) {
    newStory.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  newStory.value.tags.splice(index, 1)
}

const submitStory = async () => {
  try {
    appStore.showToast('发布中...', 'info')
    // 实现发布故事逻辑
    const story = {
      id: Date.now(),
      ...newStory.value,
      author: {
        id: authStore.user?.id,
        name: authStore.user?.name,
        avatar: authStore.user?.avatar
      },
      publishTime: new Date(),
      readCount: 0,
      likeCount: 0,
      isLiked: false
    }
    stories.value.unshift(story)
    appStore.showToast('故事发布成功', 'success')
    closePublishModal()
  } catch (error) {
    appStore.showToast('发布失败', 'error')
  }
}
</script>

<style scoped>
.family-stories-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.publish-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.publish-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab.active {
  background: #07c160;
  color: white;
}

/* 故事内容 */
.stories-content {
  padding: 16px;
}

.stories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.story-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.story-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.story-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-type {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
  background: rgba(0, 0, 0, 0.6);
}

.story-info {
  padding: 16px;
}

.story-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.story-summary {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-info img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info span {
  font-size: 12px;
  color: #666;
}

.story-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.publish-time,
.read-count,
.like-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #999;
}

.story-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.story-tag {
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
}

.story-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.action-btn.liked {
  background: #ff3b30;
  color: white;
  border-color: #ff3b30;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
}

.publish-story-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
}

/* 发布弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
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
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #07c160;
}

.upload-cover-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.upload-cover-btn:hover {
  background: #e9ecef;
}

.tags-input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px;
  min-height: 40px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #07c160;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tags-input input {
  border: none;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}

.submit-btn:hover {
  background: #06a552;
}
</style>
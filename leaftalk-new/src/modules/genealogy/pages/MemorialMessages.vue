<template>
  <div class="memorial-messages">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">{{ memberInfo.name }}的追思空间</h1>
      <button @click="showAddMessage = true" class="add-btn">
        <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 逝者信息卡片 -->
    <div class="member-info-card">
      <div class="member-avatar">
        <img :src="memberInfo.avatar || '/default-avatar.png'" :alt="memberInfo.name" />
        <div class="memorial-badge">
          <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
        </div>
      </div>
      <div class="member-details">
        <div class="member-name">{{ memberInfo.name }}</div>
        <div class="member-dates">
          {{ formatDate(memberInfo.birthDate) }} - {{ formatDate(memberInfo.deathDate) }}
        </div>
        <div class="member-description">{{ memberInfo.description || '愿您在天堂安息' }}</div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="memorial-stats">
      <div class="stat-item">
        <div class="stat-number">{{ memorialStats.totalMessages }}</div>
        <div class="stat-label">追思留言</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ memorialStats.totalArticles }}</div>
        <div class="stat-label">纪念文章</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ memorialStats.totalPhotos }}</div>
        <div class="stat-label">纪念照片</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ memorialStats.totalVisitors }}</div>
        <div class="stat-label">访问人数</div>
      </div>
    </div>

    <!-- 内容分类标签 -->
    <div class="content-tabs">
      <div class="tab-list">
        <button 
          v-for="tab in contentTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          <iconify-icon :icon="tab.icon" width="16"></iconify-icon>
          <span>{{ tab.name }}</span>
          <div v-if="tab.count > 0" class="tab-count">{{ tab.count }}</div>
        </button>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-list">
      <!-- 追思留言 -->
      <div v-if="activeTab === 'messages'" class="messages-section">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
        >
          <div class="message-header">
            <div class="author-info">
              <img :src="message.authorAvatar || '/default-avatar.png'" :alt="message.authorName" class="author-avatar" />
              <div class="author-details">
                <div class="author-name">{{ message.authorName }}</div>
                <div class="message-time">{{ formatDateTime(message.createdAt) }}</div>
              </div>
            </div>
            <div class="message-actions">
              <button @click="likeMessage(message)" class="like-btn" :class="{ liked: message.isLiked }">
                <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
                <span>{{ message.likes }}</span>
              </button>
            </div>
          </div>
          
          <div class="message-content">
            <p>{{ message.content }}</p>
            <div v-if="message.images && message.images.length > 0" class="message-images">
              <img 
                v-for="(image, index) in message.images" 
                :key="index"
                :src="image" 
                @click="previewImage(image)"
                class="message-image"
              />
            </div>
          </div>
          
          <div class="message-footer">
            <button @click="replyToMessage(message)" class="reply-btn">
              <iconify-icon icon="heroicons:chat-bubble-left" width="14"></iconify-icon>
              <span>回复</span>
            </button>
            <button v-if="message.authorId === currentUserId" @click="deleteMessage(message)" class="delete-btn">
              <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
              <span>删除</span>
            </button>
          </div>
          
          <!-- 回复列表 -->
          <div v-if="message.replies && message.replies.length > 0" class="replies-section">
            <div 
              v-for="reply in message.replies" 
              :key="reply.id"
              class="reply-item"
            >
              <img :src="reply.authorAvatar || '/default-avatar.png'" :alt="reply.authorName" class="reply-avatar" />
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-author">{{ reply.authorName }}</span>
                  <span class="reply-time">{{ formatDateTime(reply.createdAt) }}</span>
                </div>
                <p class="reply-text">{{ reply.content }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="messages.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:chat-bubble-left-ellipsis" width="48"></iconify-icon>
          <p>还没有追思留言</p>
          <button @click="showAddMessage = true" class="add-first-btn">写下第一条留言</button>
        </div>
      </div>

      <!-- 纪念文章 -->
      <div v-if="activeTab === 'articles'" class="articles-section">
        <div 
          v-for="article in articles" 
          :key="article.id"
          class="article-item"
          @click="viewArticle(article)"
        >
          <div v-if="article.coverImage" class="article-cover">
            <img :src="article.coverImage" :alt="article.title" />
          </div>
          <div class="article-content">
            <div class="article-header">
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
                <span class="article-author">{{ article.authorName }}</span>
                <span class="article-date">{{ formatDate(article.createdAt) }}</span>
              </div>
            </div>
            <p class="article-excerpt">{{ article.excerpt }}</p>
            <div class="article-stats">
              <span class="stat-item">
                <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                {{ article.views }}
              </span>
              <span class="stat-item">
                <iconify-icon icon="heroicons:heart" width="14"></iconify-icon>
                {{ article.likes }}
              </span>
              <span class="stat-item">
                <iconify-icon icon="heroicons:chat-bubble-left" width="14"></iconify-icon>
                {{ article.comments }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="articles.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:document-text" width="48"></iconify-icon>
          <p>还没有纪念文章</p>
          <button @click="createArticle" class="add-first-btn">写下第一篇文章</button>
        </div>
      </div>

      <!-- 纪念相册 -->
      <div v-if="activeTab === 'photos'" class="photos-section">
        <div class="photo-grid">
          <div 
            v-for="photo in photos" 
            :key="photo.id"
            class="photo-item"
            @click="previewPhoto(photo)"
          >
            <img :src="photo.thumbnail || photo.url" :alt="photo.description" />
            <div class="photo-overlay">
              <div class="photo-info">
                <div class="photo-title">{{ photo.title }}</div>
                <div class="photo-date">{{ formatDate(photo.takenAt || photo.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="photos.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:photo" width="48"></iconify-icon>
          <p>还没有纪念照片</p>
          <button @click="uploadPhotos" class="add-first-btn">上传第一张照片</button>
        </div>
      </div>

      <!-- 祭奠记录 -->
      <div v-if="activeTab === 'offerings'" class="offerings-section">
        <div 
          v-for="offering in offerings" 
          :key="offering.id"
          class="offering-item"
        >
          <div class="offering-header">
            <img :src="offering.authorAvatar || '/default-avatar.png'" :alt="offering.authorName" class="offering-avatar" />
            <div class="offering-info">
              <div class="offering-author">{{ offering.authorName }}</div>
              <div class="offering-time">{{ formatDateTime(offering.createdAt) }}</div>
            </div>
          </div>
          
          <div class="offering-content">
            <div class="offering-items">
              <div 
                v-for="item in offering.items" 
                :key="item.id"
                class="offering-item-detail"
              >
                <img :src="item.icon" :alt="item.name" class="item-icon" />
                <span class="item-name">{{ item.name }}</span>
                <span class="item-count">x{{ item.count }}</span>
              </div>
            </div>
            <p v-if="offering.message" class="offering-message">{{ offering.message }}</p>
          </div>
        </div>
        
        <div v-if="offerings.length === 0" class="empty-state">
          <iconify-icon icon="mdi:flower-lotus" width="48"></iconify-icon>
          <p>还没有祭奠记录</p>
          <button @click="goToMemorial" class="add-first-btn">前往祭奠</button>
        </div>
      </div>
    </div>

    <!-- 添加留言弹窗 -->
    <div v-if="showAddMessage" class="modal-overlay" @click="showAddMessage = false">
      <div class="add-message-modal" @click.stop>
        <div class="modal-header">
          <h3>写下追思留言</h3>
          <button @click="showAddMessage = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="message-form">
            <textarea 
              v-model="newMessage.content"
              placeholder="写下您对逝者的思念和祝福..."
              rows="6"
              class="message-textarea"
            ></textarea>
            
            <div class="form-actions">
              <div class="upload-section">
                <input 
                  type="file" 
                  ref="imageInput"
                  @change="handleImageUpload"
                  accept="image/*"
                  multiple
                  style="display: none"
                />
                <button @click="$refs.imageInput.click()" class="upload-btn">
                  <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
                  <span>添加图片</span>
                </button>
              </div>
              
              <div v-if="newMessage.images.length > 0" class="preview-images">
                <div 
                  v-for="(image, index) in newMessage.images" 
                  :key="index"
                  class="preview-item"
                >
                  <img :src="image.preview" :alt="`预览图片${index + 1}`" />
                  <button @click="removeImage(index)" class="remove-image-btn">
                    <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showAddMessage = false" class="cancel-btn">取消</button>
          <button @click="submitMessage" class="submit-btn" :disabled="!newMessage.content.trim()">
            发布留言
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="showImagePreview" class="modal-overlay" @click="showImagePreview = false">
      <div class="image-preview-modal" @click.stop>
        <button @click="showImagePreview = false" class="close-preview-btn">
          <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
        </button>
        <img :src="previewImageUrl" :alt="previewImageAlt" class="preview-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 路由参数
const genealogyId = ref(route.params.genealogyId as string)
const memberId = ref(route.params.memberId as string)

// 状态
const activeTab = ref('messages')
const showAddMessage = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageAlt = ref('')
const currentUserId = ref(1) // 当前用户ID

// 成员信息
const memberInfo = ref({
  id: '',
  name: '',
  avatar: '',
  birthDate: '',
  deathDate: '',
  description: ''
})

// 统计信息
const memorialStats = ref({
  totalMessages: 0,
  totalArticles: 0,
  totalPhotos: 0,
  totalVisitors: 0
})

// 内容分类
const contentTabs = ref([
  { id: 'messages', name: '追思留言', icon: 'heroicons:chat-bubble-left-ellipsis', count: 0 },
  { id: 'articles', name: '纪念文章', icon: 'heroicons:document-text', count: 0 },
  { id: 'photos', name: '纪念相册', icon: 'heroicons:photo', count: 0 },
  { id: 'offerings', name: '祭奠记录', icon: 'mdi:flower-lotus', count: 0 }
])

// 数据
const messages = ref([])
const articles = ref([])
const photos = ref([])
const offerings = ref([])

// 新留言表单
const newMessage = reactive({
  content: '',
  images: []
})

// 生命周期
onMounted(() => {
  loadMemberInfo()
  loadMemorialData()
})

// 方法
const loadMemberInfo = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memberInfo.value = result.data
      }
    }
  } catch (error) {
    console.error('加载成员信息失败:', error)
    // 使用模拟数据
    memberInfo.value = {
      id: memberId.value,
      name: '叶德华',
      avatar: '/mock-avatar-1.jpg',
      birthDate: '1920-01-01',
      deathDate: '1995-12-31',
      description: '慈祥的祖父，一生勤劳善良'
    }
  }
}

const loadMemorialData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}/memorial`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const data = result.data
        messages.value = data.messages || []
        articles.value = data.articles || []
        photos.value = data.photos || []
        offerings.value = data.offerings || []
        
        // 更新统计和标签计数
        memorialStats.value = data.stats
        updateTabCounts()
      }
    }
  } catch (error) {
    console.error('加载追思数据失败:', error)
    // 使用模拟数据
    loadMockData()
  }
}

const loadMockData = () => {
  messages.value = [
    {
      id: 1,
      authorId: 2,
      authorName: '叶建国',
      authorAvatar: '/mock-avatar-2.jpg',
      content: '爷爷，您在天堂还好吗？我们都很想念您。您教给我们的做人道理，我们会一直记在心里。',
      images: [],
      likes: 5,
      isLiked: false,
      createdAt: '2024-01-15T10:30:00Z',
      replies: [
        {
          id: 1,
          authorName: '叶小明',
          authorAvatar: '/mock-avatar-3.jpg',
          content: '爷爷永远活在我们心中',
          createdAt: '2024-01-15T11:00:00Z'
        }
      ]
    }
  ]
  
  articles.value = [
    {
      id: 1,
      title: '怀念我的祖父',
      excerpt: '祖父是一个慈祥而睿智的老人，他的一生充满了传奇色彩...',
      coverImage: '/mock-article-cover.jpg',
      authorName: '叶建国',
      createdAt: '2024-01-10T09:00:00Z',
      views: 128,
      likes: 15,
      comments: 8
    }
  ]
  
  photos.value = [
    {
      id: 1,
      title: '祖父的笑容',
      url: '/mock-photo-1.jpg',
      thumbnail: '/mock-photo-1-thumb.jpg',
      description: '祖父慈祥的笑容',
      takenAt: '1990-01-01',
      createdAt: '2024-01-12T14:20:00Z'
    }
  ]
  
  offerings.value = [
    {
      id: 1,
      authorName: '叶小红',
      authorAvatar: '/mock-avatar-4.jpg',
      message: '爷爷，为您献上鲜花，愿您安息',
      items: [
        { id: 1, name: '白菊花', icon: '/offering-flower.png', count: 3 },
        { id: 2, name: '香烛', icon: '/offering-candle.png', count: 2 }
      ],
      createdAt: '2024-01-14T16:45:00Z'
    }
  ]
  
  memorialStats.value = {
    totalMessages: messages.value.length,
    totalArticles: articles.value.length,
    totalPhotos: photos.value.length,
    totalVisitors: 25
  }
  
  updateTabCounts()
}

const updateTabCounts = () => {
  contentTabs.value[0].count = messages.value.length
  contentTabs.value[1].count = articles.value.length
  contentTabs.value[2].count = photos.value.length
  contentTabs.value[3].count = offerings.value.length
}

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        newMessage.images.push({
          file,
          preview: e.target.result
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeImage = (index) => {
  newMessage.images.splice(index, 1)
}

const submitMessage = async () => {
  if (!newMessage.content.trim()) return
  
  try {
    // 上传图片
    const imageUrls = []
    for (const image of newMessage.images) {
      const formData = new FormData()
      formData.append('image', image.file)
      
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appStore.token}`
        },
        body: formData
      })
      
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json()
        if (uploadResult.success) {
          imageUrls.push(uploadResult.data.url)
        }
      }
    }
    
    // 提交留言
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        content: newMessage.content,
        images: imageUrls
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('留言发布成功', 'success')
        showAddMessage.value = false
        newMessage.content = ''
        newMessage.images = []
        loadMemorialData() // 重新加载数据
      }
    }
  } catch (error) {
    console.error('发布留言失败:', error)
    appStore.showToast('发布失败', 'error')
  }
}

const likeMessage = async (message) => {
  try {
    const response = await fetch(`/api/memorial/messages/${message.id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      message.isLiked = !message.isLiked
      message.likes += message.isLiked ? 1 : -1
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const replyToMessage = (message) => {
  // 实现回复功能
  console.log('回复留言:', message.id)
}

const deleteMessage = async (message) => {
  if (!confirm('确定要删除这条留言吗？')) return
  
  try {
    const response = await fetch(`/api/memorial/messages/${message.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      appStore.showToast('留言已删除', 'success')
      loadMemorialData()
    }
  } catch (error) {
    console.error('删除留言失败:', error)
    appStore.showToast('删除失败', 'error')
  }
}

const viewArticle = (article) => {
  router.push(`/genealogy/${genealogyId.value}/members/${memberId.value}/articles/${article.id}`)
}

const createArticle = () => {
  router.push(`/genealogy/${genealogyId.value}/members/${memberId.value}/articles/create`)
}

const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  previewImageAlt.value = '留言图片'
  showImagePreview.value = true
}

const previewPhoto = (photo) => {
  previewImageUrl.value = photo.url
  previewImageAlt.value = photo.title
  showImagePreview.value = true
}

const uploadPhotos = () => {
  router.push(`/genealogy/${genealogyId.value}/members/${memberId.value}/photos/upload`)
}

const goToMemorial = () => {
  router.push(`/genealogy/${genealogyId.value}/members/${memberId.value}/memorial`)
}

// 辅助方法
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.memorial-messages {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .add-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.add-btn {
  background: #07c160;
  color: white;
  border-radius: 50%;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  text-align: center;
  flex: 1;
}

/* 逝者信息卡片 */
.member-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.memorial-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #ff6b6b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.member-dates {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.member-description {
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.4;
}

/* 统计信息 */
.memorial-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 0 16px 16px;
}

.stat-item {
  background: white;
  padding: 16px 8px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

/* 内容分类标签 */
.content-tabs {
  margin: 0 16px 16px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-list {
  display: flex;
  overflow-x: auto;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.tab-btn.active {
  background: #07c160;
  color: white;
}

.tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.tab-btn:not(.active) .tab-count {
  background: #f0f0f0;
  color: #666;
}

/* 内容列表 */
.content-list {
  margin: 0 16px;
}

/* 追思留言 */
.messages-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-actions {
  display: flex;
  gap: 8px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn.liked {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.message-content {
  margin-bottom: 12px;
}

.message-content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
  color: #333;
}

.message-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  max-width: 240px;
}

.message-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.message-footer {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.reply-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
}

.delete-btn {
  color: #ff6b6b;
}

/* 回复列表 */
.replies-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  background: #f9f9f9;
  padding: 8px 12px;
  border-radius: 8px;
}

.reply-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.reply-time {
  font-size: 11px;
  color: #999;
}

.reply-text {
  margin: 0;
  font-size: 12px;
  color: #333;
  line-height: 1.4;
}

/* 纪念文章 */
.articles-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.article-cover {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  padding: 16px;
}

.article-header {
  margin-bottom: 8px;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.article-excerpt {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

/* 纪念相册 */
.photos-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px;
  color: white;
}

.photo-info {
  text-align: center;
}

.photo-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
}

.photo-date {
  font-size: 10px;
  opacity: 0.8;
}

/* 祭奠记录 */
.offerings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.offering-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.offering-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.offering-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.offering-info {
  flex: 1;
}

.offering-author {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.offering-time {
  font-size: 12px;
  color: #999;
}

.offering-content {
  margin-bottom: 8px;
}

.offering-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.offering-item-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f9f9f9;
  border-radius: 16px;
}

.item-icon {
  width: 16px;
  height: 16px;
}

.item-name {
  font-size: 12px;
  color: #333;
}

.item-count {
  font-size: 12px;
  color: #666;
}

.offering-message {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  font-style: italic;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.add-first-btn {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

/* 弹窗样式 */
.modal-overlay {
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

.add-message-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-section {
  display: flex;
  gap: 12px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.preview-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 图片预览弹窗 */
.image-preview-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-preview-btn {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
</style>

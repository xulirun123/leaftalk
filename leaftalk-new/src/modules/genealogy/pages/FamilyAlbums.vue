<template>
  <div class="family-albums-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="家族相册" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canUpload" @click="createAlbum" class="create-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 相册分类标签 -->
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
    <div class="albums-content">
      <!-- 相册网格 -->
      <div class="albums-grid">
        <div 
          v-for="album in filteredAlbums" 
          :key="album.id"
          class="album-card"
          @click="viewAlbum(album)"
        >
          <!-- 相册封面 -->
          <div class="album-cover">
            <div class="cover-images">
              <img 
                v-for="(photo, index) in album.coverPhotos.slice(0, 4)" 
                :key="index"
                :src="photo"
                :alt="`封面${index + 1}`"
                class="cover-photo"
                :class="`photo-${index + 1}`"
              />
            </div>
            <div class="album-overlay">
              <div class="photo-count">
                <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
                <span>{{ album.photoCount }}</span>
              </div>
            </div>
          </div>

          <!-- 相册信息 -->
          <div class="album-info">
            <h3 class="album-title">{{ album.title }}</h3>
            <p class="album-desc">{{ album.description }}</p>
            <div class="album-meta">
              <div class="creator-info">
                <img :src="album.creator.avatar || '/default-avatar.png'" :alt="album.creator.name" />
                <span>{{ album.creator.name }}</span>
              </div>
              <div class="album-stats">
                <span class="create-time">{{ formatDate(album.createTime) }}</span>
                <span class="view-count">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  {{ album.viewCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAlbums.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:photo" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无相册</h3>
        <p>{{ currentCategory === 'all' ? '还没有任何家族相册' : '该分类下暂无相册' }}</p>
        <button v-if="canUpload" @click="createAlbum" class="create-album-btn">
          创建相册
        </button>
      </div>
    </div>

    <!-- 创建相册弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="create-modal" @click.stop>
        <div class="modal-header">
          <h3>创建相册</h3>
          <button @click="closeCreateModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitAlbum" class="create-form">
            <div class="form-group">
              <label>相册名称</label>
              <input 
                v-model="newAlbum.title"
                type="text"
                placeholder="请输入相册名称"
                required
              />
            </div>
            <div class="form-group">
              <label>相册描述</label>
              <textarea 
                v-model="newAlbum.description"
                placeholder="请输入相册描述"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>相册分类</label>
              <select v-model="newAlbum.category" required>
                <option value="">请选择</option>
                <option value="family">家庭生活</option>
                <option value="celebration">庆典活动</option>
                <option value="travel">旅行游记</option>
                <option value="memorial">纪念相册</option>
                <option value="historical">历史照片</option>
              </select>
            </div>
            <div class="form-group">
              <label>隐私设置</label>
              <select v-model="newAlbum.privacy" required>
                <option value="public">公开（所有族人可见）</option>
                <option value="family">家庭（仅直系亲属可见）</option>
                <option value="private">私密（仅自己可见）</option>
              </select>
            </div>
            <div class="form-group">
              <label>上传照片</label>
              <div class="photo-upload-area">
                <div 
                  v-for="(photo, index) in newAlbum.photos" 
                  :key="index"
                  class="uploaded-photo"
                >
                  <img :src="photo.url" :alt="`照片${index + 1}`" />
                  <button type="button" @click="removePhoto(index)" class="remove-photo">
                    <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
                  </button>
                </div>
                <button type="button" @click="uploadPhotos" class="upload-btn">
                  <iconify-icon icon="heroicons:camera" width="24"></iconify-icon>
                  <span>添加照片</span>
                </button>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeCreateModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn" :disabled="newAlbum.photos.length === 0">
                创建相册
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 相册详情弹窗 -->
    <div v-if="showAlbumModal" class="modal-overlay" @click="closeAlbumModal">
      <div class="album-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedAlbum?.title }}</h3>
          <div class="header-actions">
            <button v-if="canEdit(selectedAlbum)" @click="editAlbum" class="edit-btn">
              <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
            </button>
            <button @click="closeAlbumModal" class="close-btn">
              <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
            </button>
          </div>
        </div>
        <div class="modal-content">
          <div v-if="selectedAlbum" class="album-detail">
            <div class="album-info-detail">
              <p class="album-description">{{ selectedAlbum.description }}</p>
              <div class="album-meta-detail">
                <div class="meta-item">
                  <iconify-icon icon="heroicons:user" width="14"></iconify-icon>
                  <span>{{ selectedAlbum.creator.name }}</span>
                </div>
                <div class="meta-item">
                  <iconify-icon icon="heroicons:calendar" width="14"></iconify-icon>
                  <span>{{ formatDateTime(selectedAlbum.createTime) }}</span>
                </div>
                <div class="meta-item">
                  <iconify-icon icon="heroicons:photo" width="14"></iconify-icon>
                  <span>{{ selectedAlbum.photoCount }}张照片</span>
                </div>
                <div class="meta-item">
                  <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                  <span>{{ selectedAlbum.viewCount }}次浏览</span>
                </div>
              </div>
            </div>
            
            <!-- 照片网格 -->
            <div class="photos-grid">
              <div 
                v-for="(photo, index) in selectedAlbum.photos" 
                :key="index"
                class="photo-item"
                @click="viewPhoto(photo, index)"
              >
                <img :src="photo.thumbnail || photo.url" :alt="`照片${index + 1}`" />
                <div class="photo-overlay">
                  <iconify-icon icon="heroicons:magnifying-glass-plus" width="16"></iconify-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 照片查看器 -->
    <div v-if="showPhotoViewer" class="photo-viewer-overlay" @click="closePhotoViewer">
      <div class="photo-viewer">
        <div class="viewer-header">
          <div class="photo-info">
            <span>{{ currentPhotoIndex + 1 }} / {{ currentAlbumPhotos.length }}</span>
          </div>
          <button @click="closePhotoViewer" class="close-viewer">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        <div class="viewer-content">
          <button 
            v-if="currentPhotoIndex > 0"
            @click="prevPhoto"
            class="nav-btn prev-btn"
          >
            <iconify-icon icon="heroicons:chevron-left" width="24"></iconify-icon>
          </button>
          <img 
            :src="currentPhoto?.url"
            :alt="`照片${currentPhotoIndex + 1}`"
            class="viewer-image"
          />
          <button 
            v-if="currentPhotoIndex < currentAlbumPhotos.length - 1"
            @click="nextPhoto"
            class="nav-btn next-btn"
          >
            <iconify-icon icon="heroicons:chevron-right" width="24"></iconify-icon>
          </button>
        </div>
        <div class="viewer-footer">
          <div class="photo-actions">
            <button @click="downloadPhoto" class="action-btn">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
              下载
            </button>
            <button @click="sharePhoto" class="action-btn">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              分享
            </button>
          </div>
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
const showCreateModal = ref(false)
const showAlbumModal = ref(false)
const showPhotoViewer = ref(false)
const selectedAlbum = ref(null)
const currentPhotoIndex = ref(0)
const currentAlbumPhotos = ref([])
const currentPhoto = ref(null)

const categories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '家庭', value: 'family', icon: 'heroicons:home' },
  { label: '庆典', value: 'celebration', icon: 'heroicons:gift' },
  { label: '旅行', value: 'travel', icon: 'heroicons:map-pin' },
  { label: '纪念', value: 'memorial', icon: 'heroicons:heart' },
  { label: '历史', value: 'historical', icon: 'heroicons:clock' }
])

const albums = ref([
  {
    id: 1,
    title: '张氏家族春节聚会2024',
    description: '2024年春节家族聚会的珍贵照片',
    category: 'celebration',
    privacy: 'public',
    photoCount: 28,
    viewCount: 156,
    createTime: new Date('2024-02-15'),
    creator: {
      id: 1,
      name: '张长老',
      avatar: '/avatars/elder.jpg'
    },
    coverPhotos: [
      '/albums/spring-festival/cover1.jpg',
      '/albums/spring-festival/cover2.jpg',
      '/albums/spring-festival/cover3.jpg',
      '/albums/spring-festival/cover4.jpg'
    ],
    photos: [
      { url: '/albums/spring-festival/photo1.jpg', thumbnail: '/albums/spring-festival/thumb1.jpg' },
      { url: '/albums/spring-festival/photo2.jpg', thumbnail: '/albums/spring-festival/thumb2.jpg' }
    ]
  },
  {
    id: 2,
    title: '爷爷的老照片',
    description: '珍藏的爷爷年轻时的照片',
    category: 'historical',
    privacy: 'family',
    photoCount: 15,
    viewCount: 89,
    createTime: new Date('2024-01-10'),
    creator: {
      id: 2,
      name: '张小明',
      avatar: '/avatars/xiaoming.jpg'
    },
    coverPhotos: [
      '/albums/grandpa/cover1.jpg',
      '/albums/grandpa/cover2.jpg'
    ],
    photos: [
      { url: '/albums/grandpa/photo1.jpg', thumbnail: '/albums/grandpa/thumb1.jpg' }
    ]
  }
])

const newAlbum = ref({
  title: '',
  description: '',
  category: '',
  privacy: 'public',
  photos: []
})

// 计算属性
const canUpload = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin' || authStore.user?.role === 'member'
})

const filteredAlbums = computed(() => {
  if (currentCategory.value === 'all') {
    return albums.value
  }
  return albums.value.filter(album => album.category === currentCategory.value)
})

// 生命周期
onMounted(() => {
  loadAlbums()
})

// 方法
const goBack = () => {
  router.back()
}

const loadAlbums = async () => {
  if (!genealogyId.value) {
    appStore.showToast('族谱ID不存在', 'error')
    return
  }

  try {
    console.log('📸 加载家族相册数据，族谱ID:', genealogyId.value)

    const response = await fetch(`http://localhost:8893/api/genealogies/${genealogyId.value}/albums`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取家族相册失败')
    }

    const result = await response.json()
    if (result.success) {
      // 处理相册数据，转换为前端需要的格式
      albums.value = result.data.map((album: any) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        category: album.category || 'general',
        coverImage: album.coverImage,
        coverPhotos: album.coverPhotos || [],
        photoCount: album.photoCount || 0,
        createTime: album.createTime || album.createdAt,
        viewCount: album.viewCount || 0,
        creator: {
          name: album.creator?.name || album.creatorName || '未知创建者',
          avatar: album.creator?.avatar || album.creatorAvatar || '/default-avatar.png'
        }
      }))

      console.log('✅ 家族相册数据加载成功，共', albums.value.length, '个相册')
    } else {
      throw new Error(result.message || '获取家族相册失败')
    }

  } catch (error: any) {
    console.error('❌ 加载家族相册失败:', error)
    appStore.showToast(error.message || '加载家族相册失败', 'error')
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

const formatDateTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('zh-CN')
}

const canEdit = (album: any) => {
  return album?.creator.id === authStore.user?.id || authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin'
}

const viewAlbum = (album: any) => {
  selectedAlbum.value = album
  showAlbumModal.value = true
}

const createAlbum = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
}

const closeAlbumModal = () => {
  showAlbumModal.value = false
  selectedAlbum.value = null
}

const resetForm = () => {
  newAlbum.value = {
    title: '',
    description: '',
    category: '',
    privacy: 'public',
    photos: []
  }
}

const uploadPhotos = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (!files || files.length === 0) return

    // 验证文件
    const validFiles = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        appStore.showToast(`${file.name} 不是有效的图片文件`, 'error')
        continue
      }

      // 检查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        appStore.showToast(`${file.name} 文件过大，请选择小于5MB的图片`, 'error')
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // 显示上传进度
    appStore.showToast(`正在上传 ${validFiles.length} 张照片...`, 'info')

    try {
      for (const file of validFiles) {
        await uploadSinglePhoto(file)
      }
      appStore.showToast(`成功上传 ${validFiles.length} 张照片`, 'success')
    } catch (error) {
      console.error('照片上传失败:', error)
      appStore.showToast('照片上传失败', 'error')
    }
  }

  input.click()
}

const uploadSinglePhoto = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        // 创建照片对象
        const photo = {
          id: Date.now() + Math.random(),
          url: result,
          name: file.name,
          size: file.size,
          uploadTime: new Date().toISOString(),
          file: file // 保存原始文件用于后续上传到服务器
        }

        newAlbum.value.photos.push(photo)
        resolve()
      } else {
        reject(new Error('文件读取失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(file)
  })
}

const removePhoto = (index: number) => {
  newAlbum.value.photos.splice(index, 1)
}

const editAlbum = () => {
  appStore.showToast('编辑功能开发中', 'info')
}

const viewPhoto = (photo: any, index: number) => {
  currentAlbumPhotos.value = selectedAlbum.value.photos
  currentPhotoIndex.value = index
  currentPhoto.value = photo
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
  currentPhoto.value = null
  currentPhotoIndex.value = 0
  currentAlbumPhotos.value = []
}

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
    currentPhoto.value = currentAlbumPhotos.value[currentPhotoIndex.value]
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < currentAlbumPhotos.value.length - 1) {
    currentPhotoIndex.value++
    currentPhoto.value = currentAlbumPhotos.value[currentPhotoIndex.value]
  }
}

const downloadPhoto = () => {
  // 实现照片下载
  appStore.showToast('下载功能开发中', 'info')
}

const sharePhoto = () => {
  if (navigator.share) {
    navigator.share({
      title: '家族相册照片',
      url: currentPhoto.value?.url
    })
  } else {
    appStore.showToast('分享功能开发中', 'info')
  }
}

const submitAlbum = async () => {
  try {
    appStore.showToast('创建中...', 'info')
    // 实现创建相册逻辑
    const album = {
      id: Date.now(),
      ...newAlbum.value,
      photoCount: newAlbum.value.photos.length,
      viewCount: 0,
      createTime: new Date(),
      creator: {
        id: authStore.user?.id,
        name: authStore.user?.name,
        avatar: authStore.user?.avatar
      },
      coverPhotos: newAlbum.value.photos.slice(0, 4).map(p => p.url)
    }
    albums.value.unshift(album)
    appStore.showToast('相册创建成功', 'success')
    closeCreateModal()
  } catch (error) {
    appStore.showToast('创建失败', 'error')
  }
}
</script>

<style scoped>
.family-albums-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.create-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.create-btn:hover {
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

/* 相册内容 */
.albums-content {
  padding: 16px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.album-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.album-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.album-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.cover-images {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
}

.cover-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-photo.photo-1 {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.cover-photo.photo-2 {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.cover-photo.photo-3 {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.cover-photo.photo-4 {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.album-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.album-info {
  padding: 12px;
}

.album-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  line-height: 1.3;
}

.album-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.album-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.creator-info img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-info span {
  font-size: 10px;
  color: #666;
}

.album-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.create-time,
.view-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #999;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  grid-column: 1 / -1;
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

.create-album-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
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
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-modal,
.album-modal {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.edit-btn:hover,
.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

/* 创建表单 */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.photo-upload-area {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  min-height: 80px;
}

.uploaded-photo {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
}

.uploaded-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #999;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: #07c160;
  color: #07c160;
}

.upload-btn span {
  font-size: 10px;
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

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background: #06a552;
}

/* 相册详情 */
.album-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.album-info-detail {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.album-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.album-meta-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

/* 照片查看器 */
.photo-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.photo-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.photo-info {
  font-size: 14px;
}

.close-viewer {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.close-viewer:hover {
  background: rgba(255, 255, 255, 0.1);
}

.viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.viewer-footer {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
}

.photo-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .albums-grid {
    grid-template-columns: 1fr;
  }

  .photo-upload-area {
    grid-template-columns: repeat(2, 1fr);
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .viewer-content {
    padding: 10px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .prev-btn {
    left: 10px;
  }

  .next-btn {
    right: 10px;
  }
}
</style>

<template>
  <div class="family-heritage-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="家族传承" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canPublish" @click="publishHeritage" class="publish-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 传承分类标签 -->
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
    <div class="heritage-content">
      <!-- 传承故事列表 -->
      <div class="heritage-list">
        <div 
          v-for="heritage in filteredHeritage" 
          :key="heritage.id"
          class="heritage-card"
          @click="viewHeritageDetail(heritage)"
        >
          <!-- 传承封面 -->
          <div v-if="heritage.cover" class="heritage-cover">
            <img :src="heritage.cover" :alt="heritage.title" />
            <div class="heritage-type" :class="heritage.type">
              {{ getTypeText(heritage.type) }}
            </div>
            <div v-if="heritage.isImportant" class="important-badge">
              <iconify-icon icon="heroicons:star" width="12"></iconify-icon>
              重要传承
            </div>
          </div>

          <!-- 传承信息 -->
          <div class="heritage-info">
            <h3 class="heritage-title">{{ heritage.title }}</h3>
            <p class="heritage-summary">{{ heritage.summary }}</p>
            
            <div class="heritage-meta">
              <div class="author-info">
                <img :src="heritage.author.avatar || '/default-avatar.png'" :alt="heritage.author.name" />
                <span>{{ heritage.author.name }}</span>
                <span class="author-role">{{ heritage.author.role }}</span>
              </div>
              <div class="heritage-stats">
                <span class="publish-time">{{ formatDate(heritage.publishTime) }}</span>
                <span class="read-count">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  {{ heritage.readCount }}
                </span>
                <span class="like-count">
                  <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
                  {{ heritage.likeCount }}
                </span>
              </div>
            </div>

            <!-- 传承标签 -->
            <div class="heritage-tags">
              <span 
                v-for="tag in heritage.tags" 
                :key="tag"
                class="heritage-tag"
              >
                {{ tag }}
              </span>
            </div>

            <!-- 传承价值 -->
            <div class="heritage-value">
              <div class="value-item">
                <iconify-icon icon="heroicons:academic-cap" width="14"></iconify-icon>
                <span>教育价值：{{ heritage.educationalValue }}</span>
              </div>
              <div class="value-item">
                <iconify-icon icon="heroicons:heart" width="14"></iconify-icon>
                <span>文化价值：{{ heritage.culturalValue }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="heritage-actions">
            <button @click.stop="likeHeritage(heritage)" class="action-btn" :class="{ liked: heritage.isLiked }">
              <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
              {{ heritage.isLiked ? '已赞' : '点赞' }}
            </button>
            <button @click.stop="collectHeritage(heritage)" class="action-btn" :class="{ collected: heritage.isCollected }">
              <iconify-icon icon="heroicons:bookmark" width="16"></iconify-icon>
              {{ heritage.isCollected ? '已收藏' : '收藏' }}
            </button>
            <button @click.stop="shareHeritage(heritage)" class="action-btn">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              分享
            </button>
            <button @click.stop="viewHeritageDetail(heritage)" class="action-btn primary">
              <iconify-icon icon="heroicons:book-open" width="16"></iconify-icon>
              阅读
            </button>
          </div>

          <!-- 点赞者显示 -->
          <div v-if="heritage.likedBy && heritage.likedBy.length > 0" class="liked-by-section">
            <div class="liked-by-avatars">
              <img
                v-for="(user, index) in heritage.likedBy.slice(0, 5)"
                :key="user.id"
                :src="user.avatar"
                :alt="user.name"
                :title="user.name"
                class="liked-by-avatar"
                :style="{ zIndex: 5 - index }"
              />
              <span v-if="heritage.likedBy.length > 5" class="more-likes">
                +{{ heritage.likedBy.length - 5 }}
              </span>
            </div>
            <div class="liked-by-text">
              <span v-if="heritage.likedBy.length === 1">
                {{ heritage.likedBy[0].name }} 觉得很赞
              </span>
              <span v-else-if="heritage.likedBy.length <= 3">
                {{ heritage.likedBy.map(u => u.name).join('、') }} 觉得很赞
              </span>
              <span v-else>
                {{ heritage.likedBy.slice(0, 2).map(u => u.name).join('、') }} 等{{ heritage.likedBy.length }}人觉得很赞
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredHeritage.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:book-open" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无传承故事</h3>
        <p>{{ currentCategory === 'all' ? '还没有任何家族传承故事' : '该分类下暂无传承故事' }}</p>
        <button v-if="canPublish" @click="publishHeritage" class="publish-heritage-btn">
          发布传承故事
        </button>
      </div>
    </div>

    <!-- 发布传承弹窗 -->
    <div v-if="showPublishModal" class="modal-overlay" @click="closePublishModal">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发布传承故事</h3>
          <button @click="closePublishModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitHeritage" class="publish-form">
            <div class="form-group">
              <label>传承标题</label>
              <input 
                v-model="newHeritage.title"
                type="text"
                placeholder="请输入传承故事标题"
                required
              />
            </div>
            <div class="form-group">
              <label>传承摘要</label>
              <textarea 
                v-model="newHeritage.summary"
                placeholder="请输入传承故事摘要"
                rows="2"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label>传承内容</label>
              <textarea 
                v-model="newHeritage.content"
                placeholder="请输入详细的传承故事内容"
                rows="6"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>传承类型</label>
                <select v-model="newHeritage.type" required>
                  <option value="">请选择</option>
                  <option value="tradition">传统技艺</option>
                  <option value="culture">文化习俗</option>
                  <option value="wisdom">家族智慧</option>
                  <option value="spirit">精神品质</option>
                  <option value="craft">手工技艺</option>
                </select>
              </div>
              <div class="form-group">
                <label>重要程度</label>
                <select v-model="newHeritage.importance" required>
                  <option value="">请选择</option>
                  <option value="high">高（核心传承）</option>
                  <option value="medium">中（重要传承）</option>
                  <option value="low">低（一般传承）</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>教育价值</label>
                <select v-model="newHeritage.educationalValue" required>
                  <option value="">请选择</option>
                  <option value="very-high">极高</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div class="form-group">
                <label>文化价值</label>
                <select v-model="newHeritage.culturalValue" required>
                  <option value="">请选择</option>
                  <option value="very-high">极高</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>传承封面</label>
              <button type="button" @click="uploadCover" class="upload-cover-btn">
                <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
                上传封面
              </button>
            </div>
            <div class="form-group">
              <label>传承标签</label>
              <div class="tags-input">
                <div class="selected-tags">
                  <span 
                    v-for="(tag, index) in newHeritage.tags" 
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
            <div class="form-group">
              <label>传承人信息</label>
              <div class="inheritor-info">
                <input 
                  v-model="newHeritage.inheritor.name"
                  type="text"
                  placeholder="传承人姓名"
                  required
                />
                <input 
                  v-model="newHeritage.inheritor.relation"
                  type="text"
                  placeholder="与家族关系"
                  required
                />
                <input 
                  v-model="newHeritage.inheritor.contact"
                  type="text"
                  placeholder="联系方式（可选）"
                />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closePublishModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                发布传承
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
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

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
  { label: '传统技艺', value: 'tradition', icon: 'heroicons:wrench-screwdriver' },
  { label: '文化习俗', value: 'culture', icon: 'heroicons:academic-cap' },
  { label: '家族智慧', value: 'wisdom', icon: 'heroicons:light-bulb' },
  { label: '精神品质', value: 'spirit', icon: 'heroicons:heart' },
  { label: '手工技艺', value: 'craft', icon: 'heroicons:hand-raised' }
])

const heritage = ref([
  {
    id: 1,
    title: '张氏家族传统酿酒技艺',
    summary: '传承三百年的家族酿酒秘方，蕴含着深厚的文化底蕴',
    content: '张氏家族的酿酒技艺始于清朝康熙年间...',
    type: 'tradition',
    cover: '/heritage/wine-making.jpg',
    author: {
      id: 1,
      name: '张长老',
      avatar: '/avatars/elder.jpg',
      role: '族长'
    },
    publishTime: new Date('2024-01-15'),
    readCount: 1256,
    likeCount: 89,
    isLiked: false,
    isCollected: false,
    likedBy: [
      { id: 1, name: '张小明', avatar: '/avatars/xiaoming.jpg' },
      { id: 2, name: '李娜', avatar: '/avatars/lina.jpg' },
      { id: 3, name: '王强', avatar: '/avatars/wangqiang.jpg' },
      { id: 4, name: '赵丽', avatar: '/avatars/zhaoli.jpg' },
      { id: 5, name: '陈伟', avatar: '/avatars/chenwei.jpg' }
    ],
    isImportant: true,
    educationalValue: 'very-high',
    culturalValue: 'very-high',
    tags: ['酿酒', '传统工艺', '家族秘方'],
    inheritor: {
      name: '张师傅',
      relation: '第十二代传人',
      contact: '138****1234'
    }
  },
  {
    id: 2,
    title: '家族孝道文化传承',
    summary: '世代相传的孝道理念，是家族精神财富的重要组成部分',
    content: '孝道是中华民族的传统美德...',
    type: 'spirit',
    cover: '/heritage/filial-piety.jpg',
    author: {
      id: 2,
      name: '张小明',
      avatar: '/avatars/xiaoming.jpg',
      role: '管理员'
    },
    publishTime: new Date('2024-01-10'),
    readCount: 856,
    likeCount: 67,
    isLiked: true,
    isCollected: false,
    likedBy: [
      { id: 6, name: '孙丽华', avatar: '/avatars/sunlihua.jpg' },
      { id: 7, name: '周明', avatar: '/avatars/zhouming.jpg' },
      { id: 8, name: '吴芳', avatar: '/avatars/wufang.jpg' }
    ],
    isImportant: false,
    educationalValue: 'high',
    culturalValue: 'high',
    tags: ['孝道', '家风', '品德'],
    inheritor: {
      name: '全体族人',
      relation: '共同传承',
      contact: ''
    }
  }
])

const newHeritage = ref({
  title: '',
  summary: '',
  content: '',
  type: '',
  importance: '',
  educationalValue: '',
  culturalValue: '',
  cover: '',
  tags: [],
  inheritor: {
    name: '',
    relation: '',
    contact: ''
  }
})

// 计算属性
const canPublish = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin' || authStore.user?.role === 'member'
})

const filteredHeritage = computed(() => {
  if (currentCategory.value === 'all') {
    return heritage.value
  }
  return heritage.value.filter(item => item.type === currentCategory.value)
})

// 生命周期
onMounted(() => {
  loadHeritage()
})

// 方法
const goBack = () => {
  router.back()
}

const loadHeritage = async () => {
  if (!genealogyId.value) {
    appStore.showToast('族谱ID不存在', 'error')
    return
  }

  try {
    console.log('🏛️ 加载家族传承数据，族谱ID:', genealogyId.value)

    const response = await fetch(`http://localhost:8893/api/genealogies/${genealogyId.value}/heritage`, {
      headers: {
        'Authorization': `Bearer ${authStore.token || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取家族传承失败')
    }

    const result = await response.json()
    if (result.success) {
      // 处理传承数据，转换为前端需要的格式
      heritage.value = result.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        author: {
          name: item.author?.name || '未知作者',
          avatar: item.author?.avatar || '/default-avatar.png'
        },
        createTime: item.createTime,
        viewCount: item.viewCount || 0,
        likeCount: item.likeCount || 0,
        tags: item.tags || [],
        isLiked: false
      }))

      console.log('✅ 家族传承数据加载成功，共', heritage.value.length, '项传承')
    } else {
      throw new Error(result.message || '获取家族传承失败')
    }
  } catch (error) {
    console.error('❌ 加载家族传承失败:', error)
    appStore.showToast('加载传承失败', 'error')
  }
}

const setCategory = (category: string) => {
  currentCategory.value = category
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  return dateObj.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const getTypeText = (type: string) => {
  const typeMap = {
    tradition: '传统技艺',
    culture: '文化习俗',
    wisdom: '家族智慧',
    spirit: '精神品质',
    craft: '手工技艺'
  }
  return typeMap[type] || type
}

const viewHeritageDetail = (heritage: any) => {
  router.push(`/genealogy/${genealogyId.value}/heritage/${heritage.id}`)
}

const likeHeritage = async (heritage: any) => {
  try {
    const currentUser = {
      id: 999,
      name: '当前用户',
      avatar: '/avatars/current-user.jpg'
    }

    heritage.isLiked = !heritage.isLiked

    if (heritage.isLiked) {
      // 点赞：增加数量并添加到点赞者列表
      heritage.likeCount += 1
      if (!heritage.likedBy) {
        heritage.likedBy = []
      }
      // 将当前用户添加到列表开头
      heritage.likedBy.unshift(currentUser)
      appStore.showToast('点赞成功', 'success')
    } else {
      // 取消点赞：减少数量并从点赞者列表移除
      heritage.likeCount -= 1
      if (heritage.likedBy) {
        heritage.likedBy = heritage.likedBy.filter(user => user.id !== currentUser.id)
      }
      appStore.showToast('取消点赞', 'info')
    }
  } catch (error) {
    appStore.showToast('操作失败', 'error')
  }
}

const collectHeritage = async (heritage: any) => {
  try {
    heritage.isCollected = !heritage.isCollected
    appStore.showToast(heritage.isCollected ? '已收藏' : '已取消收藏', 'success')
  } catch (error) {
    appStore.showToast('操作失败', 'error')
  }
}

const shareHeritage = (heritage: any) => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'heritage',
    title: heritage.title,
    summary: heritage.summary,
    category: heritage.category,
    author: heritage.author,
    publishTime: heritage.publishTime,
    tags: heritage.tags,
    culturalValue: heritage.culturalValue,
    educationalValue: heritage.educationalValue
  }

  appStore.showToast('正在分享到朋友圈...', 'info')

  // 模拟直接发布到朋友圈
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}

const publishHeritage = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  newHeritage.value = {
    title: '',
    summary: '',
    content: '',
    type: '',
    importance: '',
    educationalValue: '',
    culturalValue: '',
    cover: '',
    tags: [],
    inheritor: {
      name: '',
      relation: '',
      contact: ''
    }
  }
  tagInput.value = ''
}

const uploadCover = () => {
  appStore.showToast('封面上传功能开发中', 'info')
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !newHeritage.value.tags.includes(tag)) {
    newHeritage.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  newHeritage.value.tags.splice(index, 1)
}

const submitHeritage = async () => {
  try {
    appStore.showToast('发布中...', 'info')
    // 实现发布传承逻辑
    const heritageItem = {
      id: Date.now(),
      ...newHeritage.value,
      author: {
        id: authStore.user?.id,
        name: authStore.user?.name,
        avatar: authStore.user?.avatar,
        role: authStore.user?.role
      },
      publishTime: new Date(),
      readCount: 0,
      likeCount: 0,
      isLiked: false,
      isCollected: false,
      isImportant: newHeritage.value.importance === 'high'
    }
    heritage.value.unshift(heritageItem)
    appStore.showToast('传承故事发布成功', 'success')
    closePublishModal()
  } catch (error) {
    appStore.showToast('发布失败', 'error')
  }
}
</script>

<style scoped>
.family-heritage-page {
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
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
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

/* 传承内容 */
.heritage-content {
  padding: 16px;
}

.heritage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.heritage-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.heritage-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.heritage-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.heritage-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.heritage-type {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
  background: rgba(0, 0, 0, 0.6);
}

.heritage-type.tradition {
  background: #FF6B35;
}

.heritage-type.culture {
  background: #4A90E2;
}

.heritage-type.wisdom {
  background: #F39C12;
}

.heritage-type.spirit {
  background: #E74C3C;
}

.heritage-type.craft {
  background: #9B59B6;
}

.important-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.heritage-info {
  padding: 16px;
}

.heritage-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.heritage-summary {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.heritage-meta {
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

.author-role {
  background: #f0f0f0;
  color: #666;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 10px;
}

.heritage-stats {
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

.heritage-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.heritage-tag {
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
}

.heritage-value {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

.value-item iconify-icon {
  color: #07c160;
}

.heritage-actions {
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

.action-btn.collected {
  background: #ff9500;
  color: white;
  border-color: #ff9500;
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

.publish-heritage-btn {
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

.inheritor-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inheritor-info input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
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

/* 点赞者显示样式 */
.liked-by-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.liked-by-avatars {
  display: flex;
  align-items: center;
}

.liked-by-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -6px;
  object-fit: cover;
  position: relative;
}

.liked-by-avatar:first-child {
  margin-left: 0;
}

.more-likes {
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

.liked-by-text {
  font-size: 12px;
  color: #666;
  flex: 1;
}
</style>

<template>
  <div class="family-activities-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="家族活动" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canPublish" @click="publishActivity" class="publish-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 活动分类标签 -->
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
    <div class="activities-content">
      <!-- 活动列表 -->
      <div class="activities-list">
        <div 
          v-for="activity in filteredActivities" 
          :key="activity.id"
          class="activity-card"
          @click="viewActivityDetail(activity)"
        >
          <!-- 活动封面 -->
          <div class="activity-cover">
            <img 
              :src="activity.cover || '/default-activity.jpg'"
              :alt="activity.title"
              class="cover-image"
            />
            <div class="activity-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>

          <!-- 活动信息 -->
          <div class="activity-info">
            <h3 class="activity-title">{{ activity.title }}</h3>
            <p class="activity-desc">{{ activity.description }}</p>
            
            <div class="activity-meta">
              <div class="meta-item">
                <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                <span>{{ formatDate(activity.date) }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:clock" width="14"></iconify-icon>
                <span>{{ activity.time }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:map-pin" width="14"></iconify-icon>
                <span>{{ activity.location }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:users" width="14"></iconify-icon>
                <span>{{ activity.participantCount }}/{{ activity.maxParticipants }}人</span>
              </div>
            </div>

            <!-- 活动标签 -->
            <div class="activity-tags">
              <span 
                v-for="tag in activity.tags" 
                :key="tag"
                class="activity-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="activity-actions">
            <button 
              v-if="activity.status === 'upcoming' && !activity.isRegistered"
              @click.stop="registerActivity(activity)"
              class="action-btn primary"
              :disabled="activity.participantCount >= activity.maxParticipants"
            >
              <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
              {{ activity.participantCount >= activity.maxParticipants ? '已满员' : '报名' }}
            </button>
            <button 
              v-else-if="activity.status === 'upcoming' && activity.isRegistered"
              @click.stop="cancelRegistration(activity)"
              class="action-btn secondary"
            >
              <iconify-icon icon="heroicons:user-minus" width="16"></iconify-icon>
              取消报名
            </button>
            <button
              v-else-if="activity.status === 'ongoing' && activity.isRegistered"
              @click.stop="goToCheckin(activity)"
              class="action-btn primary"
            >
              <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
              活动签到
            </button>
            <button
              v-else-if="activity.status === 'ongoing'"
              @click.stop="joinActivity(activity)"
              class="action-btn primary"
            >
              <iconify-icon icon="heroicons:arrow-right-on-rectangle" width="16"></iconify-icon>
              参与活动
            </button>
            <button
              @click.stop="viewActivityDetail(activity)"
              class="action-btn"
            >
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
              查看详情
            </button>
            <button
              @click.stop="shareActivity(activity)"
              class="action-btn share"
            >
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              分享
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredActivities.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:calendar-days" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无活动</h3>
        <p>{{ currentCategory === 'all' ? '还没有任何活动' : '该分类下暂无活动' }}</p>
        <button v-if="canPublish" @click="publishActivity" class="publish-activity-btn">
          发布活动
        </button>
      </div>
    </div>

    <!-- 发布活动弹窗 -->
    <div v-if="showPublishModal" class="modal-overlay" @click="closePublishModal">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发布活动</h3>
          <button @click="closePublishModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitActivity" class="publish-form">
            <div class="form-group">
              <label>活动标题</label>
              <input 
                v-model="newActivity.title"
                type="text"
                placeholder="请输入活动标题"
                required
              />
            </div>
            <div class="form-group">
              <label>活动描述</label>
              <textarea 
                v-model="newActivity.description"
                placeholder="请输入活动描述"
                rows="3"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>活动日期</label>
                <input 
                  v-model="newActivity.date"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label>活动时间</label>
                <input 
                  v-model="newActivity.time"
                  type="time"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label>活动地点</label>
              <input 
                v-model="newActivity.location"
                type="text"
                placeholder="请输入活动地点"
                required
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>活动类型</label>
                <select v-model="newActivity.category" required>
                  <option value="">请选择</option>
                  <option value="gathering">聚会聚餐</option>
                  <option value="ceremony">祭祀仪式</option>
                  <option value="cultural">文化活动</option>
                  <option value="charity">公益慈善</option>
                  <option value="education">教育培训</option>
                </select>
              </div>
              <div class="form-group">
                <label>最大人数</label>
                <input 
                  v-model.number="newActivity.maxParticipants"
                  type="number"
                  min="1"
                  placeholder="不限制"
                />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closePublishModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                发布活动
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

const categories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '聚会', value: 'gathering', icon: 'heroicons:users' },
  { label: '祭祀', value: 'ceremony', icon: 'heroicons:heart' },
  { label: '文化', value: 'cultural', icon: 'heroicons:academic-cap' },
  { label: '公益', value: 'charity', icon: 'heroicons:hand-raised' },
  { label: '教育', value: 'education', icon: 'heroicons:book-open' }
])

const activities = ref([
  {
    id: 1,
    title: '张氏家族春节聚会',
    description: '一年一度的春节家族聚会，欢迎所有张氏族人参加',
    date: new Date('2024-02-10'),
    time: '18:00',
    location: '北京市朝阳区家族祠堂',
    category: 'gathering',
    status: 'upcoming',
    participantCount: 25,
    maxParticipants: 50,
    isRegistered: false,
    tags: ['春节', '聚会', '传统'],
    cover: ''
  },
  {
    id: 2,
    title: '清明祭祖仪式',
    description: '清明节祭祖仪式，缅怀先祖，传承家风',
    date: new Date('2024-04-05'),
    time: '09:00',
    location: '张氏祖坟',
    category: 'ceremony',
    status: 'upcoming',
    participantCount: 15,
    maxParticipants: 30,
    isRegistered: true,
    tags: ['清明', '祭祖', '传统'],
    cover: ''
  }
])

const newActivity = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: '',
  maxParticipants: null
})

// 计算属性
const canPublish = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin'
})

const filteredActivities = computed(() => {
  if (currentCategory.value === 'all') {
    return activities.value
  }
  return activities.value.filter(activity => activity.category === currentCategory.value)
})

// 生命周期
onMounted(() => {
  loadActivities()
})

// 方法
const goBack = () => {
  router.back()
}

const loadActivities = async () => {
  if (!genealogyId.value) {
    appStore.showToast('族谱ID不存在', 'error')
    return
  }

  try {
    console.log('🎯 加载家族活动数据，族谱ID:', genealogyId.value)

    const response = await fetch(`http://localhost:8893/api/genealogies/${genealogyId.value}/activities`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取活动列表失败')
    }

    const result = await response.json()
    if (result.success) {
      // 处理活动数据，转换为前端需要的格式
      activities.value = result.data.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        category: activity.category || activity.type || 'general',
        status: activity.status,
        participantCount: activity.participantCount || 0,
        maxParticipants: activity.maxParticipants || 100,
        isRegistered: activity.isParticipant || false,
        tags: activity.tags || [],
        cover: activity.cover || activity.coverImage || '',
        organizer: activity.organizer || '家族管理员'
      }))

      console.log('✅ 活动数据加载成功，共', activities.value.length, '个活动')
    } else {
      throw new Error(result.message || '获取活动列表失败')
    }

  } catch (error: any) {
    console.error('❌ 加载活动失败:', error)
    appStore.showToast(error.message || '加载活动失败', 'error')
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

const getStatusText = (status: string) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const viewActivityDetail = (activity: any) => {
  router.push(`/genealogy/${genealogyId.value}/activities/${activity.id}`)
}

const shareActivity = (activity: any) => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'activity',
    title: activity.title,
    description: activity.description,
    location: activity.location,
    date: activity.date,
    time: activity.time,
    organizer: activity.organizer
  }

  appStore.showToast('正在分享到朋友圈...', 'info')

  // 模拟直接发布到朋友圈
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}

const registerActivity = async (activity: any) => {
  try {
    appStore.showToast('报名中...', 'info')
    // 实现报名逻辑
    activity.isRegistered = true
    activity.participantCount += 1
    appStore.showToast('报名成功', 'success')
  } catch (error) {
    appStore.showToast('报名失败', 'error')
  }
}

const cancelRegistration = async (activity: any) => {
  try {
    appStore.showToast('取消报名中...', 'info')
    // 实现取消报名逻辑
    activity.isRegistered = false
    activity.participantCount -= 1
    appStore.showToast('已取消报名', 'success')
  } catch (error) {
    appStore.showToast('取消报名失败', 'error')
  }
}

const joinActivity = (activity: any) => {
  // 参与正在进行的活动
  router.push(`/genealogy/${genealogyId.value}/activities/${activity.id}/join`)
}

const goToCheckin = (activity: any) => {
  // 跳转到活动签到页面
  router.push(`/genealogy/${genealogyId.value}/activities/${activity.id}/checkin`)
}

const publishActivity = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  newActivity.value = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    maxParticipants: null
  }
}

const submitActivity = async () => {
  try {
    appStore.showToast('发布中...', 'info')
    // 实现发布活动逻辑
    const activity = {
      id: Date.now(),
      ...newActivity.value,
      date: new Date(newActivity.value.date),
      status: 'upcoming',
      participantCount: 0,
      isRegistered: false,
      tags: [],
      cover: ''
    }
    activities.value.unshift(activity)
    appStore.showToast('活动发布成功', 'success')
    closePublishModal()
  } catch (error) {
    appStore.showToast('发布失败', 'error')
  }
}
</script>

<style scoped>
.family-activities-page {
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

/* 活动内容 */
.activities-content {
  padding: 16px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activity-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.activity-status.upcoming {
  background: #07c160;
}

.activity-status.ongoing {
  background: #ff9500;
}

.activity-status.completed {
  background: #999;
}

.activity-status.cancelled {
  background: #ff3b30;
}

.activity-info {
  padding: 16px;
}

.activity-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.activity-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.activity-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.activity-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.activity-tag {
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
}

.activity-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
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

.action-btn.primary:hover {
  background: #06a552;
}

.action-btn.secondary {
  background: #ff9500;
  color: white;
  border-color: #ff9500;
}

.action-btn:disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.action-btn.share {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.action-btn.share:hover {
  background: #1565c0;
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

.publish-activity-btn {
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

<template>
  <div class="activity-detail-page">
    <MobileTopBar 
      :title="activity?.title || '活动详情'"
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="activity" class="detail-container">
        <!-- 活动头部信息 -->
        <div class="activity-header">
          <div v-if="activity.coverImage" class="activity-cover">
            <img :src="activity.coverImage" :alt="activity.title" />
          </div>
          
          <div class="activity-info">
            <h1>{{ activity.title }}</h1>
            <div class="activity-meta">
              <div class="meta-item">
                <iconify-icon icon="heroicons:calendar-days" width="16"></iconify-icon>
                <span>{{ formatDate(activity.date) }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
                <span>{{ activity.time }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
                <span>{{ activity.location }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:users" width="16"></iconify-icon>
                <span>{{ activity.participantCount }}人参与</span>
              </div>
            </div>
            
            <div class="activity-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>
        </div>

        <!-- 活动描述 -->
        <div class="activity-description">
          <h3>活动介绍</h3>
          <p>{{ activity.description }}</p>
        </div>

        <!-- 组织者信息 -->
        <div class="organizer-info">
          <h3>组织者</h3>
          <div class="organizer-card">
            <img :src="activity.organizer.avatar" :alt="activity.organizer.name" class="organizer-avatar">
            <div class="organizer-details">
              <h4>{{ activity.organizer.name }}</h4>
              <p>{{ activity.organizer.role }}</p>
            </div>
          </div>
        </div>

        <!-- 参与者列表 -->
        <div class="participants-section">
          <h3>参与者 ({{ participants.length }})</h3>
          <div class="participants-grid">
            <div v-for="participant in participants" :key="participant.id" class="participant-item">
              <img :src="participant.avatar" :alt="participant.name" class="participant-avatar">
              <span class="participant-name">{{ participant.name }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button 
            v-if="activity.status === 'upcoming' && !activity.isJoined"
            @click="joinActivity" 
            class="action-btn primary"
          >
            <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
            参加活动
          </button>
          <button 
            v-else-if="activity.status === 'upcoming' && activity.isJoined"
            @click="leaveActivity" 
            class="action-btn secondary"
          >
            <iconify-icon icon="heroicons:user-minus" width="16"></iconify-icon>
            取消参加
          </button>
          <button @click="shareActivity" class="action-btn share">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            分享到朋友圈
          </button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>活动不存在</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const activity = ref(null)
const participants = ref([
  { id: 1, name: '张伟', avatar: '/default-avatar.png' },
  { id: 2, name: '李娜', avatar: '/default-avatar.png' },
  { id: 3, name: '王强', avatar: '/default-avatar.png' }
])

// 生命周期
onMounted(() => {
  loadActivityDetail()
})

// 方法
const goBack = () => {
  // 直接返回到家族活动页面，避免中间的检测页面
  const genealogyId = route.params.id
  router.replace(`/genealogy/${genealogyId}/activities`)
}

const loadActivityDetail = async () => {
  loading.value = true
  try {
    // 模拟加载活动详情
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    activity.value = {
      id: route.params.activityId,
      title: '张氏家族春节聚会',
      description: '一年一度的张氏家族春节聚会，欢迎所有家族成员参加。我们将一起包饺子、看春晚、分享过去一年的收获和感悟。这是增进家族感情、传承家族文化的重要时刻。',
      date: '2024-02-10',
      time: '18:00-22:00',
      location: '北京市朝阳区某某酒店',
      status: 'upcoming',
      participantCount: 25,
      isJoined: false,
      coverImage: '/activity-cover.jpg',
      organizer: {
        name: '张伟',
        role: '家族长老',
        avatar: '/default-avatar.png'
      }
    }
  } catch (error) {
    console.error('加载活动详情失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束'
  }
  return statusMap[status] || status
}

const joinActivity = () => {
  activity.value.isJoined = true
  activity.value.participantCount++
  appStore.showToast('参加活动成功！', 'success')
}

const leaveActivity = () => {
  activity.value.isJoined = false
  activity.value.participantCount--
  appStore.showToast('已取消参加', 'info')
}

const shareActivity = () => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'activity',
    title: activity.value.title,
    description: activity.value.description,
    location: activity.value.location,
    date: activity.value.date,
    time: activity.value.time,
    image: activity.value.coverImage
  }
  
  // 模拟直接发布到朋友圈
  appStore.showToast('正在分享到朋友圈...', 'info')
  
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}
</script>

<style scoped>
.activity-detail-page {
  height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-header,
.activity-description,
.organizer-info,
.participants-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.activity-cover {
  margin-bottom: 16px;
}

.activity-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.activity-info h1 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.meta-item iconify-icon {
  color: #07C160;
}

.activity-status {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.activity-status.upcoming {
  background: #e3f2fd;
  color: #1976d2;
}

.activity-status.ongoing {
  background: #e8f5e8;
  color: #388e3c;
}

.activity-status.completed {
  background: #fafafa;
  color: #666;
}

.activity-description h3,
.organizer-info h3,
.participants-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.activity-description p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.organizer-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.organizer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.organizer-details h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.organizer-details p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.participant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.participant-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.action-btn {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn.primary {
  background: #07C160;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.action-btn.share {
  background: #1976d2;
  color: white;
}
</style>

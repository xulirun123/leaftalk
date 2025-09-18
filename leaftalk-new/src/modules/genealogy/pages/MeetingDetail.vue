<template>
  <div class="meeting-detail-page">
    <MobileTopBar 
      :title="meeting?.title || '会议详情'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="meeting-detail-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadMeetingDetail" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="meeting" class="meeting-content">
        <div class="meeting-header">
          <h1 class="meeting-title">{{ meeting.title }}</h1>
          <div class="meeting-meta">
            <div class="meta-item">
              <span class="meta-label">时间：</span>
              <span class="meta-value">{{ meeting.date }} {{ meeting.time }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">地点：</span>
              <span class="meta-value">{{ meeting.location }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">状态：</span>
              <span class="meta-value" :class="meeting.status">{{ getStatusText(meeting.status) }}</span>
            </div>
          </div>
        </div>
        
        <div class="meeting-description">
          <h3>会议内容</h3>
          <p>{{ meeting.description }}</p>
        </div>
        
        <div class="meeting-participants">
          <h3>参与人员 ({{ meeting.participantCount || 0 }}人)</h3>
          <div class="participants-list">
            <div v-for="participant in participants" :key="participant.id" class="participant-item">
              <img :src="participant.avatar" :alt="participant.name" class="participant-avatar">
              <span class="participant-name">{{ participant.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>会议不存在</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'
import { generateDefaultAvatar } from '../../../utils/userInfo'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const meetingId = ref(route.params.meetingId)
const meeting = ref(null)
const participants = ref([])
const loading = ref(false)
const error = ref('')

// 生命周期
onMounted(() => {
  loadMeetingDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMeetingDetail = async () => {
  if (!genealogyId.value || !meetingId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟数据
    meeting.value = {
      id: meetingId.value,
      title: '家族年度大会',
      description: '讨论家族事务，制定来年计划，增进家族成员感情。',
      date: '2024-02-15',
      time: '14:00',
      location: '家族祠堂',
      status: 'upcoming',
      participantCount: 25
    }

    // 使用真实的叶语用户头像
    participants.value = [
      { id: 1, name: '徐礼润', avatar: generateDefaultAvatar('徐礼润') },
      { id: 2, name: '徐青松', avatar: generateDefaultAvatar('徐青松') },
      { id: 3, name: '徐明华', avatar: generateDefaultAvatar('徐明华') }
    ]

  } catch (err) {
    console.error('加载会议详情失败:', err)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
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
</script>

<style scoped>
.meeting-detail-page {
  height: 100vh;
  background: #f5f5f5;
}

.meeting-detail-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.loading-state, .error-state, .empty-state {
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

.retry-btn {
  padding: 8px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  margin-top: 16px;
}

.meeting-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.meeting-header {
  margin-bottom: 24px;
}

.meeting-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.meeting-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 500;
  color: #666;
  min-width: 60px;
}

.meta-value {
  color: #333;
}

.meta-value.upcoming {
  color: #07C160;
}

.meta-value.completed {
  color: #999;
}

.meeting-description, .meeting-participants {
  margin-bottom: 24px;
}

.meeting-description h3, .meeting-participants h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.meeting-description p {
  color: #666;
  line-height: 1.6;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-name {
  font-size: 14px;
  color: #333;
}
</style>

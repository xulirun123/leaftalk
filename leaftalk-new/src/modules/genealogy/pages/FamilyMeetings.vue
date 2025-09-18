<template>
  <div class="family-meetings-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="家族会议" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canPublish" @click="publishMeeting" class="publish-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 会议状态标签 -->
      <div class="status-tabs">
        <div
          v-for="status in statusOptions"
          :key="status.value"
          class="status-tab"
          :class="{ active: currentStatus === status.value }"
          @click="setStatus(status.value)"
        >
          <iconify-icon :icon="status.icon" width="16"></iconify-icon>
          <span>{{ status.label }}</span>
          <span v-if="status.count > 0" class="count-badge">{{ status.count }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
    <div class="meetings-content">
      <!-- 会议列表 -->
      <div class="meetings-list">
        <div 
          v-for="meeting in filteredMeetings" 
          :key="meeting.id"
          class="meeting-card"
          @click="viewMeetingDetail(meeting)"
        >
          <!-- 会议状态指示器 -->
          <div class="meeting-status" :class="meeting.status">
            <div class="status-dot"></div>
          </div>

          <!-- 会议信息 -->
          <div class="meeting-info">
            <div class="meeting-header">
              <h3 class="meeting-title">{{ meeting.title }}</h3>
              <div class="meeting-type" :class="meeting.type">
                {{ getTypeText(meeting.type) }}
              </div>
            </div>
            
            <p class="meeting-desc">{{ meeting.description }}</p>
            
            <div class="meeting-meta">
              <div class="meta-item">
                <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                <span>{{ formatDate(meeting.date) }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:clock" width="14"></iconify-icon>
                <span>{{ meeting.time }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:map-pin" width="14"></iconify-icon>
                <span>{{ meeting.location }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:users" width="14"></iconify-icon>
                <span>{{ meeting.participantCount }}/{{ meeting.maxParticipants }}人</span>
              </div>
            </div>

            <!-- 会议议程预览 -->
            <div v-if="meeting.agenda && meeting.agenda.length > 0" class="agenda-preview">
              <h4>会议议程</h4>
              <ul>
                <li v-for="(item, index) in meeting.agenda.slice(0, 2)" :key="index">
                  {{ item.title }}
                </li>
                <li v-if="meeting.agenda.length > 2" class="more-agenda">
                  还有{{ meeting.agenda.length - 2 }}项议程...
                </li>
              </ul>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="meeting-actions">
            <button 
              v-if="meeting.status === 'upcoming' && !meeting.isRegistered"
              @click.stop="registerMeeting(meeting)"
              class="action-btn primary"
              :disabled="meeting.participantCount >= meeting.maxParticipants"
            >
              <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
              {{ meeting.participantCount >= meeting.maxParticipants ? '已满员' : '报名参会' }}
            </button>
            <button 
              v-else-if="meeting.status === 'upcoming' && meeting.isRegistered"
              @click.stop="cancelRegistration(meeting)"
              class="action-btn secondary"
            >
              <iconify-icon icon="heroicons:user-minus" width="16"></iconify-icon>
              取消报名
            </button>
            <button 
              v-else-if="meeting.status === 'ongoing'"
              @click.stop="joinMeeting(meeting)"
              class="action-btn primary"
            >
              <iconify-icon icon="heroicons:video-camera" width="16"></iconify-icon>
              加入会议
            </button>
            <button 
              v-else-if="meeting.status === 'completed'"
              @click.stop="viewMeetingRecord(meeting)"
              class="action-btn"
            >
              <iconify-icon icon="heroicons:document-text" width="16"></iconify-icon>
              查看记录
            </button>
            <button 
              @click.stop="viewMeetingDetail(meeting)"
              class="action-btn"
            >
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
              查看详情
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMeetings.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:users" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无会议</h3>
        <p>{{ getEmptyStateText() }}</p>
        <button v-if="canPublish" @click="publishMeeting" class="publish-meeting-btn">
          发起会议
        </button>
      </div>
    </div>

    <!-- 发布会议弹窗 -->
    <div v-if="showPublishModal" class="modal-overlay" @click="closePublishModal">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发起会议</h3>
          <button @click="closePublishModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitMeeting" class="publish-form">
            <div class="form-group">
              <label>会议主题</label>
              <input 
                v-model="newMeeting.title"
                type="text"
                placeholder="请输入会议主题"
                required
              />
            </div>
            <div class="form-group">
              <label>会议描述</label>
              <textarea 
                v-model="newMeeting.description"
                placeholder="请输入会议描述"
                rows="3"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>会议日期</label>
                <input 
                  v-model="newMeeting.date"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label>会议时间</label>
                <input 
                  v-model="newMeeting.time"
                  type="time"
                  required
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>会议类型</label>
                <select v-model="newMeeting.type" required>
                  <option value="">请选择</option>
                  <option value="annual">年度大会</option>
                  <option value="quarterly">季度会议</option>
                  <option value="special">专题会议</option>
                  <option value="emergency">紧急会议</option>
                  <option value="celebration">庆典会议</option>
                </select>
              </div>
              <div class="form-group">
                <label>参会方式</label>
                <select v-model="newMeeting.meetingMode" required>
                  <option value="">请选择</option>
                  <option value="offline">线下会议</option>
                  <option value="online">线上会议</option>
                  <option value="hybrid">线上线下</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>会议地点</label>
              <input 
                v-model="newMeeting.location"
                type="text"
                placeholder="请输入会议地点"
                required
              />
            </div>
            <div class="form-group">
              <label>最大人数</label>
              <input 
                v-model.number="newMeeting.maxParticipants"
                type="number"
                min="1"
                placeholder="不限制"
              />
            </div>
            <div class="form-group">
              <label>会议议程</label>
              <div class="agenda-input">
                <div 
                  v-for="(item, index) in newMeeting.agenda" 
                  :key="index"
                  class="agenda-item"
                >
                  <input 
                    v-model="item.title"
                    type="text"
                    placeholder="议程标题"
                    required
                  />
                  <input 
                    v-model="item.duration"
                    type="number"
                    placeholder="时长(分钟)"
                    min="1"
                  />
                  <button type="button" @click="removeAgendaItem(index)" class="remove-agenda">
                    <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
                  </button>
                </div>
                <button type="button" @click="addAgendaItem" class="add-agenda">
                  <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
                  添加议程
                </button>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closePublishModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                发起会议
              </button>
            </div>
          </form>
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
const currentStatus = ref('all')
const showPublishModal = ref(false)

const statusOptions = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2', count: 0 },
  { label: '即将开始', value: 'upcoming', icon: 'heroicons:clock', count: 2 },
  { label: '进行中', value: 'ongoing', icon: 'heroicons:play', count: 0 },
  { label: '已结束', value: 'completed', icon: 'heroicons:check', count: 1 }
])

const meetings = ref([
  {
    id: 1,
    title: '张氏家族2024年度大会',
    description: '讨论家族发展规划、传统文化传承等重要议题',
    date: new Date('2024-02-15'),
    time: '14:00',
    location: '北京市朝阳区家族祠堂',
    type: 'annual',
    meetingMode: 'hybrid',
    status: 'upcoming',
    participantCount: 25,
    maxParticipants: 50,
    isRegistered: false,
    agenda: [
      { title: '家族发展报告', duration: 30 },
      { title: '财务状况汇报', duration: 20 },
      { title: '文化传承讨论', duration: 40 },
      { title: '下年度规划', duration: 30 }
    ]
  },
  {
    id: 2,
    title: '春节庆典筹备会议',
    description: '筹备春节家族聚会的相关事宜',
    date: new Date('2024-01-20'),
    time: '19:00',
    location: '线上会议',
    type: 'special',
    meetingMode: 'online',
    status: 'upcoming',
    participantCount: 15,
    maxParticipants: 30,
    isRegistered: true,
    agenda: [
      { title: '活动方案讨论', duration: 45 },
      { title: '预算分配', duration: 30 }
    ]
  },
  {
    id: 3,
    title: '家族史编撰工作会议',
    description: '讨论家族史编撰的进展和下一步工作',
    date: new Date('2023-12-10'),
    time: '10:00',
    location: '张氏图书馆',
    type: 'special',
    meetingMode: 'offline',
    status: 'completed',
    participantCount: 12,
    maxParticipants: 20,
    isRegistered: true,
    agenda: [
      { title: '编撰进度汇报', duration: 30 },
      { title: '资料收集情况', duration: 45 },
      { title: '下阶段安排', duration: 30 }
    ]
  }
])

const newMeeting = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  type: '',
  meetingMode: '',
  maxParticipants: null,
  agenda: [{ title: '', duration: null }]
})

// 计算属性
const canPublish = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin'
})

const filteredMeetings = computed(() => {
  if (currentStatus.value === 'all') {
    return meetings.value
  }
  return meetings.value.filter(meeting => meeting.status === currentStatus.value)
})

// 生命周期
onMounted(() => {
  loadMeetings()
  updateStatusCounts()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMeetings = async () => {
  try {
    // 加载会议数据
    console.log('加载会议数据')
  } catch (error) {
    console.error('加载会议失败:', error)
    appStore.showToast('加载会议失败', 'error')
  }
}

const updateStatusCounts = () => {
  statusOptions.value.forEach(status => {
    if (status.value === 'all') {
      status.count = meetings.value.length
    } else {
      status.count = meetings.value.filter(meeting => meeting.status === status.value).length
    }
  })
}

const setStatus = (status: string) => {
  currentStatus.value = status
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const getTypeText = (type: string) => {
  const typeMap = {
    annual: '年度大会',
    quarterly: '季度会议',
    special: '专题会议',
    emergency: '紧急会议',
    celebration: '庆典会议'
  }
  return typeMap[type] || type
}

const getEmptyStateText = () => {
  const textMap = {
    all: '还没有任何家族会议',
    upcoming: '暂无即将开始的会议',
    ongoing: '暂无正在进行的会议',
    completed: '暂无已结束的会议'
  }
  return textMap[currentStatus.value] || '暂无会议'
}

const viewMeetingDetail = (meeting: any) => {
  router.push(`/genealogy/${genealogyId.value}/meetings/${meeting.id}`)
}

const registerMeeting = async (meeting: any) => {
  try {
    appStore.showToast('报名中...', 'info')
    // 实现报名逻辑
    meeting.isRegistered = true
    meeting.participantCount += 1
    appStore.showToast('报名成功', 'success')
  } catch (error) {
    appStore.showToast('报名失败', 'error')
  }
}

const cancelRegistration = async (meeting: any) => {
  try {
    appStore.showToast('取消报名中...', 'info')
    // 实现取消报名逻辑
    meeting.isRegistered = false
    meeting.participantCount -= 1
    appStore.showToast('已取消报名', 'success')
  } catch (error) {
    appStore.showToast('取消报名失败', 'error')
  }
}

const joinMeeting = (meeting: any) => {
  // 加入正在进行的会议
  router.push(`/genealogy/${genealogyId.value}/meetings/${meeting.id}/join`)
}

const viewMeetingRecord = (meeting: any) => {
  // 查看会议记录
  router.push(`/genealogy/${genealogyId.value}/meetings/${meeting.id}/record`)
}

const publishMeeting = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  newMeeting.value = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: '',
    meetingMode: '',
    maxParticipants: null,
    agenda: [{ title: '', duration: null }]
  }
}

const addAgendaItem = () => {
  newMeeting.value.agenda.push({ title: '', duration: null })
}

const removeAgendaItem = (index: number) => {
  if (newMeeting.value.agenda.length > 1) {
    newMeeting.value.agenda.splice(index, 1)
  }
}

const submitMeeting = async () => {
  try {
    appStore.showToast('发起中...', 'info')
    // 实现发起会议逻辑
    const meeting = {
      id: Date.now(),
      ...newMeeting.value,
      date: new Date(newMeeting.value.date),
      status: 'upcoming',
      participantCount: 0,
      isRegistered: false
    }
    meetings.value.unshift(meeting)
    updateStatusCounts()
    appStore.showToast('会议发起成功', 'success')
    closePublishModal()
  } catch (error) {
    appStore.showToast('发起失败', 'error')
  }
}
</script>

<style scoped>
.family-meetings-page {
  min-height: 100vh;
  background: #f5f5f5;
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

/* 状态标签 */
.status-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
  overflow-x: auto;
  scrollbar-width: none;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.status-tab {
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
  position: relative;
}

.status-tab.active {
  background: #07c160;
  color: white;
}

.count-badge {
  background: #ff3b30;
  color: white;
  border-radius: 8px;
  padding: 1px 4px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

.status-tab.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 会议内容 */
.meetings-content {
  padding: 16px;
}

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meeting-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding-left: 8px;
}

.meeting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.meeting-status {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meeting-status.upcoming {
  background: #07c160;
}

.meeting-status.ongoing {
  background: #ff9500;
}

.meeting-status.completed {
  background: #999;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

.meeting-info {
  padding: 16px 16px 0 16px;
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.meeting-title {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  flex: 1;
  margin-right: 12px;
}

.meeting-type {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.meeting-type.annual {
  background: #ff6b35;
}

.meeting-type.quarterly {
  background: #4A90E2;
}

.meeting-type.special {
  background: #9B59B6;
}

.meeting-type.emergency {
  background: #E74C3C;
}

.meeting-type.celebration {
  background: #F39C12;
}

.meeting-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.meeting-meta {
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

.agenda-preview {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.agenda-preview h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #333;
  font-weight: 600;
}

.agenda-preview ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.agenda-preview li {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  padding-left: 12px;
  position: relative;
}

.agenda-preview li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #07c160;
}

.more-agenda {
  color: #999 !important;
  font-style: italic;
}

.meeting-actions {
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

.publish-meeting-btn {
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

.agenda-input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
}

.agenda-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.agenda-item input {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
}

.agenda-item input:first-child {
  flex: 2;
}

.agenda-item input:last-of-type {
  flex: 1;
}

.remove-agenda {
  background: #ff3b30;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-agenda {
  background: #f5f5f5;
  color: #666;
  border: 1px dashed #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.add-agenda:hover {
  background: #e9ecef;
  border-color: #07c160;
  color: #07c160;
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

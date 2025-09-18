<template>
  <div class="system-notifications-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      :title="familyName" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button @click="markAllAsRead" class="mark-read-btn">
          <iconify-icon icon="heroicons:check-circle" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="notifications-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载通知中...</p>
      </div>

      <!-- 通知列表 -->
      <div v-else class="notifications-list">
        <div v-if="notifications.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:bell-slash" width="64" color="#ccc"></iconify-icon>
          <h4>暂无通知</h4>
          <p>还没有收到家族通知</p>
        </div>
        <div v-else class="notification-items">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 
              'unread': !notification.isRead,
              'urgent': notification.priority === 'urgent'
            }"
            @click="openNotification(notification)"
          >
            <!-- 通知图标 -->
            <div class="notification-icon" :class="notification.type">
              <iconify-icon :icon="getNotificationIcon(notification.type)" width="20"></iconify-icon>
            </div>

            <!-- 通知内容 -->
            <div class="notification-content">
              <div class="notification-header">
                <h4>{{ notification.title }}</h4>
                <div class="notification-meta">
                  <span class="notification-type">{{ getNotificationTypeText(notification.type) }}</span>
                  <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                </div>
              </div>
              <p class="notification-text">{{ notification.content }}</p>
              <div class="notification-footer">
                <span class="family-name">{{ notification.familyName }}</span>
                <span v-if="notification.priority === 'urgent'" class="urgent-badge">紧急</span>
              </div>
            </div>

            <!-- 未读指示器 -->
            <div v-if="!notification.isRead" class="unread-indicator"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="detail-modal" @click.stop>
        <div class="modal-header">
          <div class="notification-type-badge" :class="selectedNotification?.type">
            <iconify-icon :icon="getNotificationIcon(selectedNotification?.type)" width="16"></iconify-icon>
            <span>{{ getNotificationTypeText(selectedNotification?.type) }}</span>
          </div>
          <button @click="closeDetailModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <h3>{{ selectedNotification?.title }}</h3>
          <div class="notification-detail-content">
            {{ selectedNotification?.content }}
          </div>
          <div class="notification-detail-footer">
            <div class="detail-meta">
              <span class="family-name">{{ selectedNotification?.familyName }}</span>
              <span class="send-time">{{ formatFullTime(selectedNotification?.createdAt) }}</span>
            </div>
            <div v-if="selectedNotification?.priority === 'urgent'" class="urgent-notice">
              <iconify-icon icon="heroicons:exclamation-triangle" width="16" color="#ff4757"></iconify-icon>
              <span>紧急通知</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const chatId = ref(route.params.id)
const notifications = ref([])
const loading = ref(false)
const showDetailModal = ref(false)
const selectedNotification = ref(null)
const familyName = ref('家族通知')

// 生命周期
onMounted(() => {
  loadNotifications()
})

// 方法
const goBack = () => {
  router.back()
}

const loadNotifications = async () => {
  loading.value = true

  try {
    const response = await fetch(`/api/system-notifications/${chatId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        notifications.value = result.data.notifications || []
        familyName.value = result.data.familyName || '家族通知'
      }
    }
  } catch (error) {
    console.error('加载通知失败:', error)
    appStore.showToast('加载通知失败', 'error')
  } finally {
    loading.value = false
  }
}

const openNotification = (notification: any) => {
  selectedNotification.value = notification
  showDetailModal.value = true
  
  // 标记为已读
  if (!notification.isRead) {
    markAsRead(notification.id)
    notification.isRead = true
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedNotification.value = null
}

const markAsRead = async (notificationId: string) => {
  try {
    await fetch(`/api/system-notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const markAllAsRead = async () => {
  try {
    const response = await fetch(`/api/system-notifications/${chatId.value}/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      notifications.value.forEach(n => n.isRead = true)
      appStore.showToast('已全部标记为已读', 'success')
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    'announcement': 'heroicons:megaphone',
    'activity': 'heroicons:calendar-days',
    'reminder': 'heroicons:bell',
    'urgent': 'heroicons:exclamation-triangle'
  }
  return iconMap[type] || iconMap.announcement
}

const getNotificationTypeText = (type: string) => {
  const typeMap = {
    'announcement': '公告',
    'activity': '活动通知',
    'reminder': '提醒',
    'urgent': '紧急通知'
  }
  return typeMap[type] || '通知'
}

const formatTime = (time: string | Date) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

const formatFullTime = (time: string | Date) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.system-notifications-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.mark-read-btn {
  background: none;
  border: none;
  color: #07c160;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.notifications-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
}

/* 加载状态样式 */
.loading-container {
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

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h4 {
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 通知列表样式 */
.notifications-list {
  background: white;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f9ff;
  border-left: 3px solid #07c160;
}

.notification-item.urgent {
  background: #fff5f5;
  border-left: 3px solid #ff4757;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon.announcement {
  background: #e3f2fd;
  color: #1976d2;
}

.notification-icon.activity {
  background: #e8f5e8;
  color: #388e3c;
}

.notification-icon.reminder {
  background: #fff3e0;
  color: #f57c00;
}

.notification-icon.urgent {
  background: #ffebee;
  color: #d32f2f;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
  flex: 1;
  line-height: 1.3;
}

.notification-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 12px;
}

.notification-type {
  font-size: 10px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 8px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.family-name {
  font-size: 12px;
  color: #999;
}

.urgent-badge {
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.unread-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
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

.detail-modal {
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

.notification-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.notification-type-badge.announcement {
  background: #e3f2fd;
  color: #1976d2;
}

.notification-type-badge.activity {
  background: #e8f5e8;
  color: #388e3c;
}

.notification-type-badge.reminder {
  background: #fff3e0;
  color: #f57c00;
}

.notification-type-badge.urgent {
  background: #ffebee;
  color: #d32f2f;
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
  max-height: 60vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  line-height: 1.3;
}

.notification-detail-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.notification-detail-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-meta .family-name {
  font-size: 12px;
  color: #999;
}

.detail-meta .send-time {
  font-size: 12px;
  color: #999;
}

.urgent-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff4757;
  font-size: 12px;
  font-weight: 500;
}
</style>

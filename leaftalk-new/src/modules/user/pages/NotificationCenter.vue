<template>
  <div class="notification-center">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>
      <h1 class="title">消息通知</h1>
      <button class="clear-btn" @click="clearAllNotifications">
        <iconify-icon icon="heroicons:trash" width="20" style="color: white;"></iconify-icon>
      </button>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="count-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载通知中...</p>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:bell-slash" width="64" style="color: #ccc;"></iconify-icon>
        <h3>暂无通知</h3>
        <p>{{ getEmptyStateText() }}</p>
      </div>

      <div v-else class="notifications-list">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-item"
          :class="{
            unread: !notification.isRead,
            urgent: notification.priority === 'urgent'
          }"
          @click="handleNotificationClick(notification)"
        >
          <!-- 通知图标 -->
          <div class="notification-icon" :class="notification.type">
            <iconify-icon :icon="getNotificationIcon(notification.type)" width="24"></iconify-icon>
          </div>

          <!-- 通知内容 -->
          <div class="notification-content">
            <div class="notification-header">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            
            <p class="notification-message">{{ notification.content }}</p>
            
            <div class="notification-meta">
              <span class="notification-type-label">{{ getNotificationTypeLabel(notification.type) }}</span>
              <span v-if="notification.priority === 'urgent'" class="urgent-badge">紧急</span>
            </div>
          </div>

          <!-- 未读指示器 -->
          <div v-if="!notification.isRead" class="unread-indicator"></div>

          <!-- 操作按钮 -->
          <div class="notification-actions">
            <button
              v-if="notification.type === 'friend_request'"
              @click.stop="handleFriendRequest(notification, 'accept')"
              class="action-btn accept-btn"
            >
              接受
            </button>
            <button
              v-if="notification.type === 'friend_request'"
              @click.stop="handleFriendRequest(notification, 'reject')"
              class="action-btn reject-btn"
            >
              拒绝
            </button>
            <button
              @click.stop="markAsRead(notification)"
              class="action-btn mark-read-btn"
              v-if="!notification.isRead"
            >
              标记已读
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="filteredNotifications.length > 0" class="bottom-actions">
      <button @click="markAllAsRead" class="action-button">
        <iconify-icon icon="heroicons:check-circle" width="20"></iconify-icon>
        <span>全部已读</span>
      </button>
      <button @click="deleteReadNotifications" class="action-button">
        <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
        <span>清除已读</span>
      </button>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirmDialog" class="confirm-overlay" @click="hideConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ confirmDialog.title }}</h3>
        </div>
        <div class="dialog-content">
          <p>{{ confirmDialog.message }}</p>
        </div>
        <div class="dialog-actions">
          <button @click="hideConfirmDialog" class="cancel-btn">取消</button>
          <button @click="confirmAction" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

// 获取认证token的辅助函数
const getAuthToken = () => {
  return localStorage.getItem('yeyu_auth_token') || 'default'
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('all')
const notifications = ref<any[]>([])
const showConfirmDialog = ref(false)
const confirmDialog = ref({
  title: '',
  message: '',
  action: null as (() => void) | null
})

// 筛选标签
const filterTabs = ref([
  { key: 'all', label: '全部', count: 0 },
  { key: 'chat', label: '聊天', count: 0 },
  { key: 'friend', label: '好友', count: 0 },
  { key: 'moments', label: '朋友圈', count: 0 },
  { key: 'system', label: '系统', count: 0 }
])

// 计算属性
const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notifications.value
  }
  
  const typeMap = {
    chat: ['chat_message', 'group_message'],
    friend: ['friend_request', 'friend_accepted'],
    moments: ['moment_like', 'moment_comment'],
    system: ['system_message', 'announcement', 'genealogy_notification']
  }
  
  const types = typeMap[activeTab.value] || []
  return notifications.value.filter(n => types.includes(n.type))
})

// 方法
const goBack = () => {
  router.back()
}

const switchTab = (tabKey: string) => {
  activeTab.value = tabKey
}

const loadNotifications = async () => {
  loading.value = true
  
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        notifications.value = result.data.notifications || []
        updateTabCounts()
      }
    }
  } catch (error) {
    console.error('加载通知失败:', error)
    appStore.showToast('加载通知失败', 'error')
  } finally {
    loading.value = false
  }
}

const updateTabCounts = () => {
  const counts = {
    all: notifications.value.length,
    chat: 0,
    friend: 0,
    moments: 0,
    system: 0
  }
  
  notifications.value.forEach(n => {
    if (['chat_message', 'group_message'].includes(n.type)) {
      counts.chat++
    } else if (['friend_request', 'friend_accepted'].includes(n.type)) {
      counts.friend++
    } else if (['moment_like', 'moment_comment'].includes(n.type)) {
      counts.moments++
    } else if (['system_message', 'announcement', 'genealogy_notification'].includes(n.type)) {
      counts.system++
    }
  })
  
  filterTabs.value.forEach(tab => {
    tab.count = counts[tab.key] || 0
  })
}

const handleNotificationClick = async (notification: any) => {
  // 标记为已读
  if (!notification.isRead) {
    await markAsRead(notification)
  }
  
  // 根据通知类型跳转
  switch (notification.type) {
    case 'chat_message':
    case 'group_message':
      router.push(`/chat/${notification.data.chatId}`)
      break
    case 'friend_request':
      router.push('/friends/requests')
      break
    case 'friend_accepted':
      router.push('/friends')
      break
    case 'moment_like':
    case 'moment_comment':
      router.push(`/moments/${notification.data.momentId}`)
      break
    case 'genealogy_notification':
      router.push(`/genealogy/${notification.data.genealogyId}`)
      break
    default:
      console.log('打开通知详情:', notification)
  }
}

const markAsRead = async (notification: any) => {
  try {
    const response = await fetch(`/api/notifications/${notification.id}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    })
    
    if (response.ok) {
      notification.isRead = true
      updateTabCounts()
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const markAllAsRead = () => {
  showConfirmDialog.value = true
  confirmDialog.value = {
    title: '标记全部已读',
    message: '确定要将所有通知标记为已读吗？',
    action: async () => {
      try {
        const response = await fetch('/api/notifications/mark-all-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
        
        if (response.ok) {
          notifications.value.forEach(n => n.isRead = true)
          updateTabCounts()
          appStore.showToast('已标记全部为已读', 'success')
        }
      } catch (error) {
        console.error('标记全部已读失败:', error)
        appStore.showToast('操作失败', 'error')
      }
    }
  }
}

const deleteReadNotifications = () => {
  showConfirmDialog.value = true
  confirmDialog.value = {
    title: '清除已读通知',
    message: '确定要删除所有已读通知吗？此操作不可恢复。',
    action: async () => {
      try {
        const response = await fetch('/api/notifications/delete-read', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
        
        if (response.ok) {
          notifications.value = notifications.value.filter(n => !n.isRead)
          updateTabCounts()
          appStore.showToast('已清除已读通知', 'success')
        }
      } catch (error) {
        console.error('清除已读通知失败:', error)
        appStore.showToast('操作失败', 'error')
      }
    }
  }
}

const clearAllNotifications = () => {
  showConfirmDialog.value = true
  confirmDialog.value = {
    title: '清空所有通知',
    message: '确定要删除所有通知吗？此操作不可恢复。',
    action: async () => {
      try {
        const response = await fetch('/api/notifications/clear-all', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
        
        if (response.ok) {
          notifications.value = []
          updateTabCounts()
          appStore.showToast('已清空所有通知', 'success')
        }
      } catch (error) {
        console.error('清空通知失败:', error)
        appStore.showToast('操作失败', 'error')
      }
    }
  }
}

const handleFriendRequest = async (notification: any, action: 'accept' | 'reject') => {
  try {
    const response = await fetch(`/api/friend-requests/${notification.data.requestId}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    })
    
    if (response.ok) {
      const message = action === 'accept' ? '已接受好友请求' : '已拒绝好友请求'
      appStore.showToast(message, 'success')
      
      // 移除通知
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index > -1) {
        notifications.value.splice(index, 1)
        updateTabCounts()
      }
    }
  } catch (error) {
    console.error('处理好友请求失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const hideConfirmDialog = () => {
  showConfirmDialog.value = false
  confirmDialog.value = { title: '', message: '', action: null }
}

const confirmAction = () => {
  if (confirmDialog.value.action) {
    confirmDialog.value.action()
  }
  hideConfirmDialog()
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    chat_message: 'heroicons:chat-bubble-left-right',
    group_message: 'heroicons:user-group',
    friend_request: 'heroicons:user-plus',
    friend_accepted: 'heroicons:check-circle',
    moment_like: 'heroicons:heart',
    moment_comment: 'heroicons:chat-bubble-left',
    system_message: 'heroicons:megaphone',
    announcement: 'heroicons:speaker-wave',
    genealogy_notification: 'heroicons:home'
  }
  return iconMap[type] || 'heroicons:bell'
}

const getNotificationTypeLabel = (type: string) => {
  const labelMap = {
    chat_message: '聊天消息',
    group_message: '群聊消息',
    friend_request: '好友请求',
    friend_accepted: '好友通过',
    moment_like: '朋友圈点赞',
    moment_comment: '朋友圈评论',
    system_message: '系统消息',
    announcement: '系统公告',
    genealogy_notification: '族谱通知'
  }
  return labelMap[type] || '通知'
}

const getEmptyStateText = () => {
  const textMap = {
    all: '暂无通知消息',
    chat: '暂无聊天通知',
    friend: '暂无好友通知',
    moments: '暂无朋友圈通知',
    system: '暂无系统通知'
  }
  return textMap[activeTab.value] || '暂无通知'
}

const formatTime = (timestamp: string | number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString()
}

// 生命周期
onMounted(() => {
  loadNotifications()

  // 定期刷新通知
  const interval = setInterval(loadNotifications, 30000)

  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.notification-center {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部导航栏 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #07c160 0%, #06a552 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.back-btn, .clear-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255,255,255,0.2);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover, .clear-btn:hover {
  background: rgba(255,255,255,0.3);
}

.title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

/* 筛选标签 */
.filter-tabs {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  z-index: 99;
}

.filter-tab {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  position: relative;
}

.filter-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
  background: rgba(7,193,96,0.05);
}

.count-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

/* 通知容器 */
.notifications-container {
  margin-top: 120px;
  padding: 16px;
  padding-bottom: 80px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  text-align: center;
}

.empty-state h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 通知列表 */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.notification-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.notification-item.unread {
  border-left: 4px solid #07c160;
  background: rgba(7,193,96,0.02);
}

.notification-item.urgent {
  border-left: 4px solid #ff4757;
  background: rgba(255,71,87,0.02);
}

/* 通知图标 */
.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.chat_message,
.notification-icon.group_message {
  background: rgba(7,193,96,0.1);
  color: #07c160;
}

.notification-icon.friend_request,
.notification-icon.friend_accepted {
  background: rgba(52,152,219,0.1);
  color: #3498db;
}

.notification-icon.moment_like,
.notification-icon.moment_comment {
  background: rgba(231,76,60,0.1);
  color: #e74c3c;
}

.notification-icon.system_message,
.notification-icon.announcement,
.notification-icon.genealogy_notification {
  background: rgba(155,89,182,0.1);
  color: #9b59b6;
}

/* 通知内容 */
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

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.notification-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.notification-message {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-type-label {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.urgent-badge {
  font-size: 12px;
  color: white;
  background: #ff4757;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 未读指示器 */
.unread-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #07c160;
  border-radius: 50%;
}

/* 操作按钮 */
.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn {
  background: #07c160;
  color: white;
}

.accept-btn:hover {
  background: #06a552;
}

.reject-btn {
  background: #ff4757;
  color: white;
}

.reject-btn:hover {
  background: #ff3742;
}

.mark-read-btn {
  background: #f0f0f0;
  color: #666;
}

.mark-read-btn:hover {
  background: #e0e0e0;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  z-index: 98;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: #f5f5f5;
  border-color: #07c160;
  color: #07c160;
}

/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.dialog-content {
  padding: 20px;
}

.dialog-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #07c160;
  color: white;
}

.confirm-btn:hover {
  background: #06a552;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-item {
    padding: 12px;
  }

  .notification-title {
    font-size: 15px;
  }

  .notification-message {
    font-size: 13px;
  }

  .filter-tab {
    font-size: 13px;
    padding: 10px 6px;
  }
}

/* 动画效果 */
.notification-item {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

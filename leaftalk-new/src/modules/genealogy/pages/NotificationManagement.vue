<template>
  <div class="notification-management-page">
    <!-- 顶部导航 -->
    <MobileTopBar
      title="通知管理"
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canSendNotification" @click="createNotification" class="create-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="management-content">
      <!-- 筛选标签 -->
      <div class="filter-section">
        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter.key"
            class="filter-tab"
            :class="{ active: currentFilter === filter.key }"
            @click="switchFilter(filter.key)"
          >
            {{ filter.label }}
            <span v-if="filter.count > 0" class="count">{{ filter.count }}</span>
          </button>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notifications-list">
        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:bell" width="64" color="#ccc"></iconify-icon>
          <h4>暂无通知</h4>
          <p>{{ getEmptyStateText() }}</p>
          <p v-if="!canSendNotification" class="permission-tip">只有族长和管理员才能发送通知</p>
        </div>
        <div v-else class="notification-cards">
          <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id"
            class="notification-card"
            :class="{ urgent: notification.priority === 'urgent' }"
            @click="viewNotification(notification)"
          >
            <div class="notification-header">
              <div class="notification-type" :class="notification.type">
                <iconify-icon :icon="getNotificationIcon(notification.type)" width="16"></iconify-icon>
                <span>{{ getNotificationTypeText(notification.type) }}</span>
              </div>
              <div class="notification-status" :class="notification.status">
                {{ getStatusText(notification.status) }}
              </div>
            </div>
            <h4>{{ notification.title }}</h4>
            <p class="notification-content">{{ notification.content }}</p>
            <div class="notification-meta">
              <div class="meta-info">
                <span class="sender">发送者：{{ notification.senderName }}</span>
                <span class="time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <div class="notification-stats">
                <span class="read-count">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  {{ notification.readCount }}/{{ notification.totalRecipients }}
                </span>
                <button @click.stop="showNotificationMenu(notification)" class="action-btn">
                  <iconify-icon icon="heroicons:ellipsis-vertical" width="16"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建通知弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="create-modal" @click.stop>
        <div class="modal-header">
          <h3>发送通知</h3>
          <button @click="closeCreateModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>通知类型</label>
            <select v-model="newNotification.type">
              <option value="announcement">公告</option>
              <option value="activity">活动通知</option>
              <option value="reminder">提醒</option>
              <option value="urgent">紧急通知</option>
            </select>
          </div>
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newNotification.priority">
              <option value="normal">普通</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input 
              v-model="newNotification.title"
              type="text"
              placeholder="请输入通知标题"
              maxlength="50"
            />
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea 
              v-model="newNotification.content"
              placeholder="请输入通知内容"
              rows="4"
              maxlength="500"
            ></textarea>
          </div>
          <div class="form-group">
            <label>接收对象</label>
            <div class="recipient-options">
              <label class="checkbox-item">
                <input v-model="newNotification.sendToAll" type="checkbox" checked disabled />
                <span>{{ getRecipientText() }}</span>
              </label>
            </div>
            <p class="recipient-tip">{{ getRecipientDescription() }}</p>
          </div>
          <div class="modal-actions">
            <button @click="closeCreateModal" class="cancel-btn">取消</button>
            <button @click="sendNotification" :disabled="sending" class="send-btn">
              {{ sending ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知操作菜单 -->
    <div v-if="showMenuModal" class="modal-overlay" @click="closeMenu">
      <div class="menu-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedNotification?.title }}</h3>
          <button @click="closeMenu" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="menu-actions">
            <button @click="viewDetails" class="menu-action">
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
              <span>查看详情</span>
            </button>
            <button @click="resendNotification" class="menu-action">
              <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
              <span>重新发送</span>
            </button>
            <button @click="editNotification" class="menu-action">
              <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
              <span>编辑通知</span>
            </button>
            <button @click="deleteNotification" class="menu-action delete">
              <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
              <span>删除通知</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const notifications = ref([])
const currentFilter = ref('all')
const showCreateModal = ref(false)
const showMenuModal = ref(false)
const selectedNotification = ref(null)
const sending = ref(false)
const canSendNotification = ref(false)
const familyType = ref('branch')

// 筛选选项
const filters = ref([
  { key: 'all', label: '全部', count: 0 },
  { key: 'sent', label: '已发送', count: 0 },
  { key: 'draft', label: '草稿', count: 0 },
  { key: 'urgent', label: '紧急', count: 0 }
])

// 新通知数据
const newNotification = ref({
  type: 'announcement',
  priority: 'normal',
  title: '',
  content: '',
  sendToAll: true,
  sendToAdmins: false
})

// 计算属性
const filteredNotifications = computed(() => {
  switch (currentFilter.value) {
    case 'sent':
      return notifications.value.filter(n => n.status === 'sent')
    case 'draft':
      return notifications.value.filter(n => n.status === 'draft')
    case 'urgent':
      return notifications.value.filter(n => n.priority === 'urgent')
    default:
      return notifications.value
  }
})

// 生命周期
onMounted(() => {
  checkPermissions()
  loadNotifications()
})

// 方法
const goBack = () => {
  router.back()
}

const checkPermissions = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/user-role`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 只有族长和管理员才能发送通知
        canSendNotification.value = result.data.isPatriarch || result.data.canEdit
        familyType.value = result.data.familyType || 'branch'
      }
    }
  } catch (error) {
    console.error('检查权限失败:', error)
  }
}

const loadNotifications = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/notifications`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        notifications.value = result.data
        updateFilterCounts()
      }
    }
  } catch (error) {
    console.error('加载通知失败:', error)
    appStore.showToast('加载通知失败', 'error')
  }
}

const updateFilterCounts = () => {
  filters.value[0].count = notifications.value.length
  filters.value[1].count = notifications.value.filter(n => n.status === 'sent').length
  filters.value[2].count = notifications.value.filter(n => n.status === 'draft').length
  filters.value[3].count = notifications.value.filter(n => n.priority === 'urgent').length
}

const switchFilter = (filterKey: string) => {
  currentFilter.value = filterKey
}

const createNotification = () => {
  if (!canSendNotification.value) {
    appStore.showToast('只有族长和管理员才能发送通知', 'error')
    return
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  newNotification.value = {
    type: 'announcement',
    priority: 'normal',
    title: '',
    content: '',
    sendToAll: true,
    sendToAdmins: false
  }
}

const sendNotification = async () => {
  if (!newNotification.value.title.trim()) {
    appStore.showToast('请输入通知标题', 'error')
    return
  }

  if (!newNotification.value.content.trim()) {
    appStore.showToast('请输入通知内容', 'error')
    return
  }

  sending.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newNotification.value)
    })

    const result = await response.json()
    if (result.success) {
      const message = `通知已发送到聊天列表，共${result.data.recipientCount}位接收者`
      appStore.showToast(message, 'success')
      closeCreateModal()
      loadNotifications()
    } else {
      appStore.showToast(result.message || '发送失败', 'error')
    }
  } catch (error) {
    console.error('发送通知失败:', error)
    appStore.showToast('发送通知失败', 'error')
  } finally {
    sending.value = false
  }
}

const viewNotification = (notification: any) => {
  router.push(`/genealogy/${genealogyId.value}/notifications/${notification.id}`)
}

const showNotificationMenu = (notification: any) => {
  selectedNotification.value = notification
  showMenuModal.value = true
}

const closeMenu = () => {
  showMenuModal.value = false
  selectedNotification.value = null
}

const viewDetails = () => {
  closeMenu()
  viewNotification(selectedNotification.value)
}

const resendNotification = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/notifications/${selectedNotification.value.id}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('重新发送成功', 'success')
      loadNotifications()
    } else {
      appStore.showToast(result.message || '重新发送失败', 'error')
    }
  } catch (error) {
    console.error('重新发送失败:', error)
    appStore.showToast('重新发送失败', 'error')
  } finally {
    closeMenu()
  }
}

const editNotification = () => {
  closeMenu()
  router.push(`/genealogy/${genealogyId.value}/notifications/${selectedNotification.value.id}/edit`)
}

const deleteNotification = async () => {
  if (!confirm('确定要删除此通知吗？')) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/notifications/${selectedNotification.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('删除成功', 'success')
      loadNotifications()
    } else {
      appStore.showToast(result.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除通知失败:', error)
    appStore.showToast('删除通知失败', 'error')
  } finally {
    closeMenu()
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
  return typeMap[type] || '公告'
}

const getStatusText = (status: string) => {
  const statusMap = {
    'draft': '草稿',
    'sent': '已发送',
    'failed': '发送失败'
  }
  return statusMap[status] || status
}

const getEmptyStateText = () => {
  switch (currentFilter.value) {
    case 'sent':
      return '暂无已发送的通知'
    case 'draft':
      return '暂无草稿通知'
    case 'urgent':
      return '暂无紧急通知'
    default:
      return '还没有发送过通知，快来创建第一个通知吧！'
  }
}

const getRecipientText = () => {
  if (familyType.value === 'main') {
    return '发送给各分族谱的族长和管理员'
  } else {
    return '发送给本分族谱的所有在世成员'
  }
}

const getRecipientDescription = () => {
  if (familyType.value === 'main') {
    return '总族谱通知只发送给各分族谱的族长和管理员'
  } else {
    return '分族谱通知发送给本分族谱的所有在世成员'
  }
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
</script>

<style scoped>
.notification-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.create-btn {
  background: none;
  border: none;
  color: #07c160;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.management-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.filter-tab {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.filter-tab.active {
  background: #07c160;
  color: white;
}

.filter-tab .count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

/* 通知列表样式 */
.notifications-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

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

.permission-tip {
  margin-top: 8px !important;
  color: #ff9500 !important;
  font-size: 12px !important;
}

.recipient-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
}

.notification-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-card:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.notification-card.urgent {
  border-color: #ff4757;
  background: #fff5f5;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.notification-type {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.notification-type.announcement {
  background: #e3f2fd;
  color: #1976d2;
}

.notification-type.activity {
  background: #e8f5e8;
  color: #388e3c;
}

.notification-type.reminder {
  background: #fff3e0;
  color: #f57c00;
}

.notification-type.urgent {
  background: #ffebee;
  color: #d32f2f;
}

.notification-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.notification-status.sent {
  background: #e8f5e8;
  color: #388e3c;
}

.notification-status.draft {
  background: #f3f4f6;
  color: #6b7280;
}

.notification-status.failed {
  background: #ffebee;
  color: #d32f2f;
}

.notification-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  line-height: 1.3;
}

.notification-content {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.notification-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.read-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.action-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.action-btn:hover {
  background: #f0f0f0;
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

.create-modal, .menu-modal {
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
  max-height: 60vh;
  overflow-y: auto;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.recipient-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-item input {
  width: auto;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .send-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.send-btn {
  background: #07c160;
  color: white;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 菜单样式 */
.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.menu-action:hover {
  background: #f8f9fa;
}

.menu-action.delete {
  color: #ff4757;
}
</style>

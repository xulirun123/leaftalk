<template>
  <div class="genealogy-management-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="族谱管理" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="management-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载管理数据中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <iconify-icon icon="heroicons:exclamation-triangle" width="48" color="#ff4757"></iconify-icon>
        <p>{{ error }}</p>
        <button @click="loadManagementData" class="retry-btn">重试</button>
      </div>

      <!-- 管理功能 -->
      <div v-else class="management-sections">
        <!-- 族谱概览 -->
        <div class="overview-section">
          <h3>族谱概览</h3>
          <div class="overview-cards">
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:users" width="24" color="#07c160"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>{{ statistics.memberCount }}</h4>
                <p>族谱成员</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:calendar-days" width="24" color="#3742fa"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>{{ statistics.activityCount }}</h4>
                <p>家族活动</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:book-open" width="24" color="#ff6b6b"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>{{ statistics.storyCount }}</h4>
                <p>家族故事</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:photo" width="24" color="#ffa502"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>{{ statistics.albumCount }}</h4>
                <p>家族相册</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理功能菜单 -->
        <div class="management-menu">
          <h3>管理功能</h3>
          <div class="menu-items">
            <!-- 成员管理 -->
            <div class="menu-item" @click="goToMemberManagement">
              <div class="item-icon">
                <iconify-icon icon="heroicons:user-group" width="20" color="#07c160"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>成员管理</h4>
                <p>管理族谱成员，设置权限</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 邀请成员 -->
            <div class="menu-item" @click="goToInviteMembers">
              <div class="item-icon">
                <iconify-icon icon="heroicons:user-plus" width="20" color="#3742fa"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>邀请成员</h4>
                <p>邀请新成员加入族谱</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 关系审批 -->
            <div class="menu-item" @click="goToApprovals">
              <div class="item-icon">
                <iconify-icon icon="heroicons:clipboard-document-check" width="20" color="#e74c3c"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>关系审批</h4>
                <p>审批成员关系修改申请</p>
              </div>
              <div class="approval-badge" v-if="pendingApprovalsCount > 0">{{ pendingApprovalsCount }}</div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 通知管理 -->
            <div class="menu-item" @click="goToNotifications">
              <div class="item-icon">
                <iconify-icon icon="heroicons:megaphone" width="20" color="#9b59b6"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>通知管理</h4>
                <p>发送和管理族谱通知</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 数据导出 -->
            <div class="menu-item" @click="goToDataExport">
              <div class="item-icon">
                <iconify-icon icon="heroicons:arrow-down-tray" width="20" color="#2ecc71"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>数据导出</h4>
                <p>导出族谱数据和备份</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 权限管理 -->
            <div class="menu-item" @click="goToPermissionManagement">
              <div class="item-icon">
                <iconify-icon icon="heroicons:shield-check" width="20" color="#ff6b6b"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>权限管理</h4>
                <p>设置成员权限和角色</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 数据统计 -->
            <div class="menu-item" @click="goToDataStatistics">
              <div class="item-icon">
                <iconify-icon icon="heroicons:chart-bar" width="20" color="#ffa502"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>数据统计</h4>
                <p>查看族谱数据统计报告</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 通知管理 -->
            <div class="menu-item" @click="goToNotificationManagement">
              <div class="item-icon">
                <iconify-icon icon="heroicons:bell" width="20" color="#5f27cd"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>通知管理</h4>
                <p>管理族谱通知和公告</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>

            <!-- 族谱设置 -->
            <div class="menu-item" @click="goToGenealogySettings">
              <div class="item-icon">
                <iconify-icon icon="heroicons:cog-6-tooth" width="20" color="#2f3542"></iconify-icon>
              </div>
              <div class="item-info">
                <h4>族谱设置</h4>
                <p>修改族谱基本信息和设置</p>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3>快捷操作</h3>
          <div class="action-buttons">
            <button @click="exportGenealogyData" class="action-btn export">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
              <span>导出数据</span>
            </button>
            <button @click="backupGenealogy" class="action-btn backup">
              <iconify-icon icon="heroicons:cloud-arrow-up" width="16"></iconify-icon>
              <span>备份族谱</span>
            </button>
            <button @click="shareGenealogy" class="action-btn share">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              <span>分享族谱</span>
            </button>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="recent-activities">
          <h3>最近活动</h3>
          <div v-if="recentActivities.length === 0" class="empty-activities">
            <p>暂无最近活动</p>
          </div>
          <div v-else class="activity-list">
            <div 
              v-for="activity in recentActivities" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon" :class="activity.type">
                <iconify-icon :icon="getActivityIcon(activity.type)" width="16"></iconify-icon>
              </div>
              <div class="activity-info">
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.description }}</p>
                <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
              </div>
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
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const loading = ref(false)
const error = ref('')
const pendingApprovalsCount = ref(0)
const statistics = ref({
  memberCount: 0,
  activityCount: 0,
  storyCount: 0,
  albumCount: 0
})
const recentActivities = ref([])

// 生命周期
onMounted(() => {
  loadManagementData()
  loadPendingApprovalsCount()
})

// 方法
const goBack = () => {
  router.back()
}

const loadManagementData = async () => {
  if (!genealogyId.value) {
    error.value = '族谱ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 加载统计数据
    const statsResponse = await fetch(`/api/genealogy/${genealogyId.value}/statistics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (statsResponse.ok) {
      const statsResult = await statsResponse.json()
      if (statsResult.success) {
        statistics.value = statsResult.data
      }
    }

    // 加载最近活动
    const activitiesResponse = await fetch(`/api/genealogy/${genealogyId.value}/recent-activities`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (activitiesResponse.ok) {
      const activitiesResult = await activitiesResponse.json()
      if (activitiesResult.success) {
        recentActivities.value = activitiesResult.data
      }
    }

  } catch (err: any) {
    console.error('加载管理数据失败:', err)
    error.value = err.message || '加载失败'
    appStore.showToast('加载管理数据失败', 'error')
  } finally {
    loading.value = false
  }
}

// 导航方法
const goToMemberManagement = () => {
  router.push(`/genealogy/${genealogyId.value}/management/members`)
}

const goToInviteMembers = () => {
  router.push(`/genealogy/${genealogyId.value}/management/invite`)
}

const goToApprovals = () => {
  router.push(`/genealogy/${genealogyId.value}/management/approvals`)
}

const goToNotifications = () => {
  router.push(`/genealogy/${genealogyId.value}/management/notifications`)
}

const goToDataExport = () => {
  router.push(`/genealogy/${genealogyId.value}/data-export`)
}

const loadPendingApprovalsCount = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/relationship-approvals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        pendingApprovalsCount.value = result.data.filter(a => a.status === 'pending').length
      }
    }
  } catch (error) {
    console.error('加载待审批数量失败:', error)
  }
}

const goToPermissionManagement = () => {
  router.push(`/genealogy/${genealogyId.value}/permission-management`)
}

const goToDataStatistics = () => {
  router.push(`/genealogy/${genealogyId.value}/management/statistics`)
}

const goToNotificationManagement = () => {
  router.push(`/genealogy/${genealogyId.value}/management/notifications`)
}

const goToGenealogySettings = () => {
  router.push(`/genealogy/${genealogyId.value}/management/settings`)
}

// 快捷操作方法
const exportGenealogyData = async () => {
  try {
    appStore.showToast('正在导出数据...', 'info')
    // 实现数据导出逻辑
    const response = await fetch(`/api/genealogy/${genealogyId.value}/export`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `genealogy-${genealogyId.value}-${Date.now()}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      appStore.showToast('数据导出成功', 'success')
    } else {
      throw new Error('导出失败')
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    appStore.showToast('导出数据失败', 'error')
  }
}

const backupGenealogy = async () => {
  try {
    appStore.showToast('正在备份族谱...', 'info')
    const response = await fetch(`/api/genealogy/${genealogyId.value}/backup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('族谱备份成功', 'success')
    } else {
      throw new Error(result.message || '备份失败')
    }
  } catch (error) {
    console.error('备份族谱失败:', error)
    appStore.showToast('备份族谱失败', 'error')
  }
}

const shareGenealogy = () => {
  // 实现分享功能
  if (navigator.share) {
    navigator.share({
      title: '家族族谱',
      text: '邀请您查看我们的家族族谱',
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    appStore.showToast('链接已复制到剪贴板', 'success')
  }
}

const getActivityIcon = (type: string) => {
  const iconMap = {
    'member_join': 'heroicons:user-plus',
    'activity_create': 'heroicons:calendar-days',
    'story_publish': 'heroicons:book-open',
    'album_create': 'heroicons:photo',
    'permission_change': 'heroicons:shield-check',
    'other': 'heroicons:bell'
  }
  return iconMap[type] || iconMap.other
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
.genealogy-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.management-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

/* 加载和错误状态样式 */
.loading-container, .error-container {
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

.retry-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 16px;
}

/* 管理区域样式 */
.management-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.management-sections h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

/* 概览卡片样式 */
.overview-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-info h4 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.card-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 管理菜单样式 */
.management-menu {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f8f9fa;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.item-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.arrow {
  color: #ccc;
}

/* 快捷操作样式 */
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.export {
  background: #e3f2fd;
  color: #1976d2;
}

.action-btn.backup {
  background: #e8f5e8;
  color: #388e3c;
}

.action-btn.share {
  background: #fff3e0;
  color: #f57c00;
}

/* 最近活动样式 */
.recent-activities {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-activities {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-icon.member_join {
  background: #07c160;
}

.activity-icon.activity_create {
  background: #3742fa;
}

.activity-icon.story_publish {
  background: #ff6b6b;
}

.activity-icon.album_create {
  background: #ffa502;
}

.activity-icon.permission_change {
  background: #5f27cd;
}

.activity-icon.other {
  background: #666;
}

.activity-info {
  flex: 1;
}

.activity-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.activity-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.activity-time {
  font-size: 10px;
  color: #999;
}

/* 审批徽章样式 */
.approval-badge {
  position: absolute;
  top: 8px;
  right: 32px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.menu-item {
  position: relative;
}
</style>

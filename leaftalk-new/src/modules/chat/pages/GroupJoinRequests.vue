<template>
  <div class="page">
    <div class="body scroll-container">
      <!-- 申请列表 -->
      <div v-if="joinRequests.length > 0" class="requests-list">
        <div v-for="request in joinRequests" :key="request.id" class="request-item">
          <!-- 用户信息 -->
          <div class="user-info">
            <img :src="request.avatar" :alt="request.nickname" class="user-avatar" />
            <div class="user-details">
              <div class="user-name">{{ request.nickname }}</div>
              <div class="request-time">{{ formatTime(request.createdAt) }}</div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="canManage" class="action-buttons">
            <button class="btn btn-approve" @click="approveRequest(request.id)">同意</button>
            <button class="btn btn-reject" @click="rejectRequest(request.id)">拒绝</button>
          </div>
          <div v-else class="status-text">
            {{ request.status === 'pending' ? '待处理' : request.status === 'approved' ? '已同意' : '已拒绝' }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无申请</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const groupId = ref(route.params.groupId as string)
const joinRequests = ref<any[]>([])
const currentUserRole = ref('')

// 计算属性
const canManage = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin' || currentUserRole.value === 'creator'
})

// 生命周期
onMounted(() => {
  loadJoinRequests()
  loadUserRole()
})

// 方法
const loadJoinRequests = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/join-requests`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        joinRequests.value = result.data.map((req: any) => ({
          id: req.id,
          userId: req.user_id,
          nickname: req.remark || req.nickname || `用户${req.user_id}`,
          avatar: req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user_id}`,
          status: req.status || 'pending',
          createdAt: req.created_at ? new Date(req.created_at).getTime() : Date.now()
        }))
        console.log('✅ 邀请进群申请加载成功:', joinRequests.value)
      }
    }
  } catch (error) {
    console.error('❌ 加载邀请进群申请失败:', error)
    appStore.showToast('加载申请失败', 'error')
  }
}

const loadUserRole = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const currentUser = result.data.find((m: any) => m.id === authStore.user?.id)
        if (currentUser) {
          currentUserRole.value = currentUser.role
          console.log('✅ 用户角色:', currentUserRole.value)
        }
      }
    }
  } catch (error) {
    console.error('❌ 加载用户角色失败:', error)
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const approveRequest = async (requestId: string) => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/join-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ action: 'approve' })
    })

    if (response.ok) {
      appStore.showToast('已同意申请', 'success')
      loadJoinRequests()
    }
  } catch (error) {
    console.error('❌ 同意申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const rejectRequest = async (requestId: string) => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/join-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ action: 'reject' })
    })

    if (response.ok) {
      appStore.showToast('已拒绝申请', 'success')
      loadJoinRequests()
    }
  } catch (error) {
    console.error('❌ 拒绝申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  padding: 0;
  padding-bottom: 100px;
}

.scroll-container {
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

.requests-list {
  padding: 8px 0;
}

.request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 12px 16px;
  margin-bottom: 2px;
  border-bottom: 1px solid #EDEDED;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-approve {
  background: #07c160;
  color: white;
}

.btn-approve:active {
  background: #06a94d;
}

.btn-reject {
  background: #f0f0f0;
  color: #333;
}

.btn-reject:active {
  background: #e0e0e0;
}

.status-text {
  font-size: 12px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}
</style>


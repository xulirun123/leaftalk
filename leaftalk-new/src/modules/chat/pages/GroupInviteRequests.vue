<template>
  <div class="page">
    <div class="body scroll-container">
      <!-- 申请列表 -->
      <div v-if="requests.length > 0" class="requests-list">
        <div v-for="request in requests" :key="request.id" class="request-item">
          <!-- 头像 -->
          <img :src="request.avatar" class="request-avatar" />

          <!-- 信息区域 -->
          <div class="request-info">
            <div class="request-name">{{ request.nickname }}</div>
            <div v-if="request.reason" class="request-reason">{{ request.reason }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="request-actions">
            <button
              v-if="request.status === 'pending'"
              class="btn-reject"
              @click="handleReject(request)"
            >
              拒绝
            </button>
            <button
              v-if="request.status === 'pending'"
              class="btn-accept"
              @click="handleAccept(request)"
            >
              接受
            </button>
            <span v-if="request.status === 'accepted'" class="status-text accepted">已同意</span>
            <span v-if="request.status === 'rejected'" class="status-text rejected">已拒绝</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <iconify-icon icon="heroicons:user-group" width="48" style="color: #ccc;"></iconify-icon>
        <p class="empty-text">暂无邀请申请</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const groupId = ref(route.params.groupId as string)
const requests = ref<any[]>([])
const loading = ref(false)

// 加载邀请申请列表
const loadRequests = async () => {
  loading.value = true
  try {
    console.log('🔄 开始加载邀请申请列表，groupId:', groupId.value)
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/invite-requests`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    console.log('📡 API 响应状态:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('📦 API 返回数据:', result)
      if (result.success && result.data) {
        requests.value = result.data
        console.log('✅ 邀请申请加载成功，数量:', requests.value.length)
      } else {
        console.warn('⚠️ API 返回失败:', result.error)
        appStore.showToast(result.error || '加载失败', 'error')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ API 返回错误:', response.status, errorText)
      appStore.showToast('加载失败', 'error')
    }
  } catch (error) {
    console.error('❌ 加载邀请申请失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

// 接受申请
const handleAccept = async (request: any) => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/invite-requests/${request.id}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('已同意', 'success')
        // 更新本地状态
        request.status = 'accepted'
      } else {
        appStore.showToast(result.error || '操作失败', 'error')
      }
    }
  } catch (error) {
    console.error('❌ 接受申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

// 拒绝申请
const handleReject = async (request: any) => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/invite-requests/${request.id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('已拒绝', 'success')
        // 更新本地状态
        request.status = 'rejected'
      } else {
        appStore.showToast(result.error || '操作失败', 'error')
      }
    }
  } catch (error) {
    console.error('❌ 拒绝申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

onMounted(() => {
  loadRequests()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  overflow-y: auto;
}

.scroll-container {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 申请列表 */
.requests-list {
  background: #fff;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 0.5px solid #E5E5E5;
  gap: 12px;
}

.request-item:last-child {
  border-bottom: none;
}

/* 头像 */
.request-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

/* 信息区域 */
.request-info {
  flex: 1;
  min-width: 0;
}

.request-name {
  font-size: 16px;
  color: #000;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-reason {
  font-size: 14px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.request-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-reject,
.btn-accept {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reject {
  background: #F7F7F7;
  color: #000;
}

.btn-reject:hover {
  background: #E5E5E5;
}

.btn-reject:active {
  background: #D5D5D5;
}

.btn-accept {
  background: #07C160;
  color: #fff;
}

.btn-accept:hover {
  background: #06AD56;
}

.btn-accept:active {
  background: #05974C;
}

.status-text {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 4px;
}

.status-text.accepted {
  color: #07C160;
  background: #F0F9FF;
}

.status-text.rejected {
  color: #999;
  background: #F7F7F7;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #fff;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}
</style>

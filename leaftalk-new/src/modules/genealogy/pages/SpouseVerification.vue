<template>
  <div class="spouse-verification-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="配偶关系确认" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="verification-content">
      <div class="verification-form">
        <!-- 说明信息 -->
        <div class="info-section">
          <div class="icon-container">
            <iconify-icon icon="heroicons:heart" width="48" color="#07c160"></iconify-icon>
          </div>
          <h2>配偶关系确认</h2>
          <p class="description">
            如果有人申请与您建立配偶关系，请输入对方提供的验证码进行确认。
          </p>
        </div>

        <!-- 验证码输入 -->
        <div class="input-section">
          <div class="form-group">
            <label for="verificationCode">验证码</label>
            <input
              id="verificationCode"
              v-model="verificationCode"
              type="text"
              placeholder="请输入6位验证码"
              maxlength="6"
              class="verification-input"
              :class="{ error: hasError }"
              @input="clearError"
            />
            <p v-if="hasError" class="error-message">{{ errorMessage }}</p>
          </div>

          <button 
            @click="verifyCode" 
            :disabled="!verificationCode || verificationCode.length !== 6 || isVerifying"
            class="verify-btn"
          >
            <span v-if="isVerifying">验证中...</span>
            <span v-else>确认关系</span>
          </button>
        </div>

        <!-- 待确认申请列表 -->
        <div v-if="pendingRequests.length > 0" class="pending-section">
          <h3>待您确认的申请</h3>
          <div class="request-list">
            <div 
              v-for="request in pendingRequests" 
              :key="request.id"
              class="request-item"
            >
              <div class="request-info">
                <h4>{{ request.requesterName }}</h4>
                <p>申请与您建立配偶关系</p>
                <p class="request-time">申请时间：{{ formatDate(request.createdAt) }}</p>
              </div>
              <div class="request-actions">
                <button @click="acceptRequest(request)" class="accept-btn">接受</button>
                <button @click="rejectRequest(request)" class="reject-btn">拒绝</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="historyRequests.length > 0" class="history-section">
          <h3>历史记录</h3>
          <div class="history-list">
            <div 
              v-for="request in historyRequests" 
              :key="request.id"
              class="history-item"
            >
              <div class="history-info">
                <h4>{{ request.requesterName }}</h4>
                <p class="status" :class="request.status">
                  {{ getStatusText(request.status) }}
                </p>
                <p class="history-time">{{ formatDate(request.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认配偶关系</h3>
          <button @click="closeConfirmModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedRequest" class="confirm-info">
            <p>您确定要与 <strong>{{ selectedRequest.requesterName }}</strong> 建立配偶关系吗？</p>
            <div class="warning">
              <iconify-icon icon="heroicons:exclamation-triangle" width="20" color="#ff9500"></iconify-icon>
              <span>此操作将在族谱中建立配偶关联，请确认信息无误。</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeConfirmModal" class="cancel-btn">取消</button>
          <button @click="confirmAccept" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const verificationCode = ref('')
const isVerifying = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const pendingRequests = ref([])
const historyRequests = ref([])
const showConfirmModal = ref(false)
const selectedRequest = ref(null)

// 生命周期
onMounted(() => {
  loadPendingRequests()
})

// 方法
const goBack = () => {
  router.back()
}

const clearError = () => {
  hasError.value = false
  errorMessage.value = ''
}

const loadPendingRequests = async () => {
  try {
    const response = await fetch('/api/spouse/verification/pending', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        pendingRequests.value = result.data.pending || []
        historyRequests.value = result.data.history || []
      }
    }
  } catch (error) {
    console.error('加载待确认申请失败:', error)
  }
}

const verifyCode = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    hasError.value = true
    errorMessage.value = '请输入6位验证码'
    return
  }

  isVerifying.value = true
  clearError()

  try {
    const response = await fetch('/api/spouse/verify-code', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        verificationCode: verificationCode.value
      })
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('配偶关系确认成功', 'success')
      verificationCode.value = ''
      loadPendingRequests() // 重新加载数据
    } else {
      hasError.value = true
      errorMessage.value = result.message || '验证码错误'
    }

  } catch (error) {
    console.error('验证失败:', error)
    hasError.value = true
    errorMessage.value = '验证失败，请重试'
  } finally {
    isVerifying.value = false
  }
}

const acceptRequest = (request: any) => {
  selectedRequest.value = request
  showConfirmModal.value = true
}

const rejectRequest = async (request: any) => {
  try {
    const response = await fetch(`/api/spouse/verification/${request.id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('已拒绝配偶关系申请', 'success')
      loadPendingRequests() // 重新加载数据
    } else {
      appStore.showToast('操作失败', 'error')
    }

  } catch (error) {
    console.error('拒绝申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  selectedRequest.value = null
}

const confirmAccept = async () => {
  if (!selectedRequest.value) return

  try {
    const response = await fetch(`/api/spouse/verification/${selectedRequest.value.id}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('配偶关系确认成功', 'success')
      closeConfirmModal()
      loadPendingRequests() // 重新加载数据
    } else {
      appStore.showToast('操作失败', 'error')
    }

  } catch (error) {
    console.error('确认申请失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'approved': '已确认',
    'rejected': '已拒绝',
    'cancelled': '已取消',
    'expired': '已过期'
  }
  return statusMap[status] || status
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.spouse-verification-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.verification-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

.verification-form {
  max-width: 400px;
  margin: 0 auto;
}

/* 说明信息样式 */
.info-section {
  text-align: center;
  margin-bottom: 32px;
}

.icon-container {
  margin-bottom: 16px;
}

.info-section h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #333;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 输入区域样式 */
.input-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.verification-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 2px;
  transition: border-color 0.2s;
}

.verification-input:focus {
  outline: none;
  border-color: #07c160;
}

.verification-input.error {
  border-color: #ff4757;
}

.error-message {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #ff4757;
}

.verify-btn {
  width: 100%;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.verify-btn:hover:not(:disabled) {
  background: #06a552;
}

.verify-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 待确认申请样式 */
.pending-section, .history-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pending-section h3, .history-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.request-list, .history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item, .history-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.request-info, .history-info {
  margin-bottom: 12px;
}

.request-info h4, .history-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.request-info p, .history-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.request-time, .history-time {
  font-size: 12px !important;
  color: #999 !important;
  margin-top: 4px !important;
}

.status {
  font-weight: 500 !important;
}

.status.approved {
  color: #07c160 !important;
}

.status.rejected {
  color: #ff4757 !important;
}

.status.cancelled {
  color: #999 !important;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn {
  flex: 1;
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.reject-btn {
  flex: 1;
  padding: 8px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
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

.confirm-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
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
}

.confirm-info p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff3cd;
  border-radius: 8px;
  font-size: 12px;
  color: #856404;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.modal-actions .cancel-btn {
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.modal-actions .confirm-btn {
  flex: 1;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
</style>

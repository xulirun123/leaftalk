<template>
  <div class="spouse-management-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="配偶关联管理" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="management-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载配偶关联数据中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <iconify-icon icon="heroicons:exclamation-triangle" width="48" color="#ff4757"></iconify-icon>
        <p>{{ error }}</p>
        <button @click="loadSpouseRequests" class="retry-btn">重试</button>
      </div>

      <!-- 正常内容 -->
      <div v-else class="content-sections">
        <!-- 待处理申请 -->
        <div class="section" v-if="pendingRequests.length > 0">
          <div class="section-header">
            <h3>待处理申请</h3>
            <span class="count">{{ pendingRequests.length }}</span>
          </div>
          <div class="request-list">
            <div 
              v-for="request in pendingRequests" 
              :key="request.id"
              class="request-item"
            >
              <div class="request-info">
                <div class="requester">
                  <h4>{{ request.requesterName }}</h4>
                  <p class="request-type">{{ getRequestTypeText(request.requestType) }}</p>
                </div>
                <div class="spouse-info">
                  <p>配偶：{{ request.spouseName }}</p>
                  <p class="request-time">{{ formatDate(request.createdAt) }}</p>
                </div>
              </div>
              
              <!-- 不同类型的处理界面 -->
              <div class="request-actions">
                <!-- 等待注册类型 -->
                <div v-if="request.requestType === 'waiting_registration'" class="waiting-info">
                  <p class="status-text">等待 {{ request.spouseName }} 注册并实名认证</p>
                  <div class="action-buttons">
                    <button @click="cancelRequest(request)" class="cancel-btn">取消申请</button>
                  </div>
                </div>

                <!-- 多选项类型 -->
                <div v-else-if="request.requestType === 'multiple_options'" class="options-selection">
                  <p class="status-text">发现多个同名用户，请选择正确的配偶：</p>
                  <div class="options-list">
                    <div 
                      v-for="(option, index) in JSON.parse(request.optionsData || '[]')" 
                      :key="option.userId"
                      class="option-item"
                      @click="selectSpouseOption(request, option)"
                    >
                      <div class="option-info">
                        <h5>{{ request.spouseName }}</h5>
                        <p>叶语号：{{ option.yeyuId }}</p>
                        <p>手机：{{ option.phone }}</p>
                        <p>地址：{{ option.address }}</p>
                      </div>
                      <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
                    </div>
                  </div>
                  <div class="action-buttons">
                    <button @click="cancelRequest(request)" class="cancel-btn">取消申请</button>
                  </div>
                </div>

                <!-- 手动确认类型 -->
                <div v-else-if="request.requestType === 'manual_confirm'" class="manual-confirm">
                  <p class="status-text">需要配偶确认关系</p>
                  <div class="verification-info">
                    <p>验证码：<strong>{{ request.verificationCode }}</strong></p>
                    <p class="hint">请将此验证码发送给您的配偶进行确认</p>
                  </div>
                  <div class="action-buttons">
                    <button @click="resendVerification(request)" class="resend-btn">重新发送</button>
                    <button @click="cancelRequest(request)" class="cancel-btn">取消申请</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已确认关系 -->
        <div class="section" v-if="confirmedRelations.length > 0">
          <div class="section-header">
            <h3>已确认关系</h3>
            <span class="count">{{ confirmedRelations.length }}</span>
          </div>
          <div class="relation-list">
            <div 
              v-for="relation in confirmedRelations" 
              :key="relation.id"
              class="relation-item"
            >
              <div class="relation-info">
                <div class="couple">
                  <h4>{{ relation.requesterName }} ↔ {{ relation.spouseName }}</h4>
                  <p class="confirm-time">确认时间：{{ formatDate(relation.approvedAt) }}</p>
                </div>
              </div>
              <div class="relation-actions">
                <button @click="viewRelationDetail(relation)" class="view-btn">查看</button>
                <button @click="removeRelation(relation)" class="remove-btn">解除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="pendingRequests.length === 0 && confirmedRelations.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:heart" width="64" color="#ccc"></iconify-icon>
          <h3>暂无配偶关联</h3>
          <p>当前没有待处理的配偶关联申请</p>
        </div>
      </div>
    </div>

    <!-- 配偶选择确认弹窗 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认配偶关系</h3>
          <button @click="closeConfirmModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedOption" class="confirm-info">
            <p>您确定要与以下用户建立配偶关系吗？</p>
            <div class="spouse-detail">
              <h4>{{ selectedRequest?.spouseName }}</h4>
              <p>叶语号：{{ selectedOption.yeyuId }}</p>
              <p>手机：{{ selectedOption.phone }}</p>
              <p>地址：{{ selectedOption.address }}</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeConfirmModal" class="cancel-btn">取消</button>
          <button @click="confirmSpouseSelection" class="confirm-btn">确认</button>
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
const loading = ref(false)
const error = ref('')
const pendingRequests = ref([])
const confirmedRelations = ref([])
const showConfirmModal = ref(false)
const selectedRequest = ref(null)
const selectedOption = ref(null)

// 生命周期
onMounted(() => {
  loadSpouseRequests()
})

// 方法
const goBack = () => {
  router.back()
}

const loadSpouseRequests = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/spouse/requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取配偶关联数据失败')
    }

    const result = await response.json()
    if (result.success) {
      pendingRequests.value = result.data.pending || []
      confirmedRelations.value = result.data.confirmed || []
    } else {
      throw new Error(result.message || '获取数据失败')
    }

  } catch (err: any) {
    console.error('加载配偶关联数据失败:', err)
    error.value = err.message || '加载失败'
    appStore.showToast('加载配偶关联数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const getRequestTypeText = (type: string) => {
  const typeMap = {
    'waiting_registration': '等待注册',
    'multiple_options': '多选确认',
    'manual_confirm': '手动确认'
  }
  return typeMap[type] || type
}

const selectSpouseOption = (request: any, option: any) => {
  selectedRequest.value = request
  selectedOption.value = option
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  selectedRequest.value = null
  selectedOption.value = null
}

const confirmSpouseSelection = async () => {
  if (!selectedRequest.value || !selectedOption.value) return

  try {
    const response = await fetch('/api/spouse/confirm-selection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: selectedRequest.value.id,
        selectedUserId: selectedOption.value.userId
      })
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('配偶关系确认成功', 'success')
      closeConfirmModal()
      loadSpouseRequests() // 重新加载数据
    } else {
      throw new Error(result.message || '确认失败')
    }

  } catch (err: any) {
    console.error('确认配偶关系失败:', err)
    appStore.showToast('确认配偶关系失败', 'error')
  }
}

const cancelRequest = async (request: any) => {
  try {
    const response = await fetch(`/api/spouse/requests/${request.id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('申请已取消', 'success')
      loadSpouseRequests() // 重新加载数据
    } else {
      throw new Error(result.message || '取消失败')
    }

  } catch (err: any) {
    console.error('取消申请失败:', err)
    appStore.showToast('取消申请失败', 'error')
  }
}

const resendVerification = async (request: any) => {
  try {
    const response = await fetch(`/api/spouse/requests/${request.id}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('验证码已重新发送', 'success')
      loadSpouseRequests() // 重新加载数据
    } else {
      throw new Error(result.message || '发送失败')
    }

  } catch (err: any) {
    console.error('重新发送验证码失败:', err)
    appStore.showToast('重新发送验证码失败', 'error')
  }
}

const removeRelation = async (relation: any) => {
  if (!confirm('确定要解除配偶关系吗？此操作不可撤销。')) {
    return
  }

  try {
    const response = await fetch(`/api/spouse/relations/${relation.id}/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('配偶关系已解除', 'success')
      loadSpouseRequests() // 重新加载数据
    } else {
      throw new Error(result.message || '解除失败')
    }

  } catch (err: any) {
    console.error('解除配偶关系失败:', err)
    appStore.showToast('解除配偶关系失败', 'error')
  }
}

const viewRelationDetail = (relation: any) => {
  // 查看关系详情
  router.push(`/spouse/relation/${relation.id}`)
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.spouse-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.management-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
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

/* 内容区域样式 */
.content-sections {
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.count {
  background: #07c160;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 申请列表样式 */
.request-list, .relation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item, .relation-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.request-info, .relation-info {
  margin-bottom: 16px;
}

.requester h4, .couple h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.request-type, .spouse-info p, .confirm-time {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.spouse-info p:first-child {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

/* 申请操作样式 */
.request-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.status-text {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.verification-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.verification-info p {
  margin: 0;
  font-size: 14px;
}

.verification-info strong {
  color: #07c160;
  font-size: 16px;
}

.hint {
  color: #999 !important;
  font-size: 12px !important;
  margin-top: 4px !important;
}

/* 选项列表样式 */
.options-list {
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.option-item:hover {
  background: #e9ecef;
}

.option-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.option-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 按钮样式 */
.action-buttons, .relation-actions {
  display: flex;
  gap: 8px;
}

.cancel-btn, .remove-btn {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
}

.resend-btn, .view-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
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

.spouse-detail {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.spouse-detail h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.spouse-detail p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.modal-actions .cancel-btn {
  flex: 1;
  background: #f8f9fa;
  color: #666;
}

.modal-actions .confirm-btn {
  flex: 1;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
}
</style>

<template>
  <div class="relationship-approvals-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="关系审批" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="approvals-content">
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

      <!-- 审批列表 -->
      <div class="approvals-list">
        <div v-if="filteredApprovals.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:clipboard-document-check" width="64" color="#ccc"></iconify-icon>
          <h4>暂无审批</h4>
          <p>{{ getEmptyStateText() }}</p>
        </div>
        <div v-else class="approval-cards">
          <div 
            v-for="approval in filteredApprovals" 
            :key="approval.id"
            class="approval-card"
            :class="{ urgent: approval.isUrgent }"
          >
            <div class="approval-header">
              <div class="member-info">
                <img 
                  :src="approval.memberAvatar || '/default-avatar.png'"
                  :alt="approval.memberName"
                  class="member-avatar"
                />
                <div class="member-details">
                  <h4>{{ approval.memberName }}</h4>
                  <p>第{{ getChineseNumber(approval.memberGeneration) }}世</p>
                </div>
              </div>
              <div class="approval-status" :class="approval.status">
                {{ getStatusText(approval.status) }}
              </div>
            </div>

            <div class="approval-content">
              <h5>申请修改关系</h5>
              <div class="relationship-changes">
                <div v-if="approval.fatherChange" class="change-item">
                  <span class="change-label">父亲：</span>
                  <span class="change-from">{{ approval.fatherChange.from || '无' }}</span>
                  <iconify-icon icon="heroicons:arrow-right" width="12" class="arrow"></iconify-icon>
                  <span class="change-to">{{ approval.fatherChange.to }}</span>
                </div>
                <div v-if="approval.motherChange" class="change-item">
                  <span class="change-label">母亲：</span>
                  <span class="change-from">{{ approval.motherChange.from || '无' }}</span>
                  <iconify-icon icon="heroicons:arrow-right" width="12" class="arrow"></iconify-icon>
                  <span class="change-to">{{ approval.motherChange.to }}</span>
                </div>
                <div v-if="approval.spouseChange" class="change-item">
                  <span class="change-label">配偶：</span>
                  <span class="change-from">{{ approval.spouseChange.from || '无' }}</span>
                  <iconify-icon icon="heroicons:arrow-right" width="12" class="arrow"></iconify-icon>
                  <span class="change-to">{{ approval.spouseChange.to }}</span>
                </div>
              </div>
              <div class="approval-reason" v-if="approval.reason">
                <span class="reason-label">申请理由：</span>
                <span>{{ approval.reason }}</span>
              </div>
            </div>

            <div class="approval-meta">
              <div class="meta-info">
                <span class="apply-time">申请时间：{{ formatTime(approval.createdAt) }}</span>
                <span v-if="approval.approvedAt" class="approve-time">
                  处理时间：{{ formatTime(approval.approvedAt) }}
                </span>
                <span v-if="approval.approvedBy" class="approver">
                  处理人：{{ approval.approvedBy }}
                </span>
              </div>
              <div v-if="approval.status === 'pending'" class="approval-actions">
                <button @click="approveRelationship(approval)" class="approve-btn">
                  <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
                  <span>通过</span>
                </button>
                <button @click="rejectRelationship(approval)" class="reject-btn">
                  <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
                  <span>拒绝</span>
                </button>
              </div>
            </div>

            <div v-if="approval.rejectionReason" class="rejection-reason">
              <iconify-icon icon="heroicons:exclamation-triangle" width="16" color="#ff4757"></iconify-icon>
              <span>拒绝原因：{{ approval.rejectionReason }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 拒绝原因弹窗 -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="reject-modal" @click.stop>
        <div class="modal-header">
          <h3>拒绝申请</h3>
          <button @click="closeRejectModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>拒绝原因</label>
            <textarea 
              v-model="rejectionReason"
              placeholder="请输入拒绝原因"
              rows="4"
              maxlength="200"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button @click="closeRejectModal" class="cancel-btn">取消</button>
            <button @click="confirmReject" :disabled="processing" class="reject-btn">
              {{ processing ? '处理中...' : '确认拒绝' }}
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
const approvals = ref([])
const currentFilter = ref('pending')
const showRejectModal = ref(false)
const selectedApproval = ref(null)
const rejectionReason = ref('')
const processing = ref(false)

// 筛选选项
const filters = ref([
  { key: 'pending', label: '待审批', count: 0 },
  { key: 'approved', label: '已通过', count: 0 },
  { key: 'rejected', label: '已拒绝', count: 0 },
  { key: 'all', label: '全部', count: 0 }
])

// 计算属性
const filteredApprovals = computed(() => {
  switch (currentFilter.value) {
    case 'pending':
      return approvals.value.filter(a => a.status === 'pending')
    case 'approved':
      return approvals.value.filter(a => a.status === 'approved')
    case 'rejected':
      return approvals.value.filter(a => a.status === 'rejected')
    default:
      return approvals.value
  }
})

// 生命周期
onMounted(() => {
  loadApprovals()
})

// 方法
const goBack = () => {
  router.back()
}

const loadApprovals = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/relationship-approvals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        approvals.value = result.data
        updateFilterCounts()
      }
    }
  } catch (error) {
    console.error('加载审批列表失败:', error)
    appStore.showToast('加载审批列表失败', 'error')
  }
}

const updateFilterCounts = () => {
  filters.value[0].count = approvals.value.filter(a => a.status === 'pending').length
  filters.value[1].count = approvals.value.filter(a => a.status === 'approved').length
  filters.value[2].count = approvals.value.filter(a => a.status === 'rejected').length
  filters.value[3].count = approvals.value.length
}

const switchFilter = (filterKey: string) => {
  currentFilter.value = filterKey
}

const approveRelationship = async (approval: any) => {
  if (!confirm(`确定要通过 ${approval.memberName} 的关系修改申请吗？`)) return

  processing.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/relationship-approvals/${approval.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('审批通过', 'success')
      loadApprovals()
    } else {
      appStore.showToast(result.message || '审批失败', 'error')
    }
  } catch (error) {
    console.error('审批失败:', error)
    appStore.showToast('审批失败', 'error')
  } finally {
    processing.value = false
  }
}

const rejectRelationship = (approval: any) => {
  selectedApproval.value = approval
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  selectedApproval.value = null
  rejectionReason.value = ''
}

const confirmReject = async () => {
  if (!rejectionReason.value.trim()) {
    appStore.showToast('请输入拒绝原因', 'error')
    return
  }

  processing.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/relationship-approvals/${selectedApproval.value.id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: rejectionReason.value.trim()
      })
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('已拒绝申请', 'success')
      closeRejectModal()
      loadApprovals()
    } else {
      appStore.showToast(result.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('拒绝申请失败:', error)
    appStore.showToast('操作失败', 'error')
  } finally {
    processing.value = false
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'pending': '待审批',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

const getEmptyStateText = () => {
  switch (currentFilter.value) {
    case 'pending':
      return '暂无待审批的关系修改申请'
    case 'approved':
      return '暂无已通过的申请'
    case 'rejected':
      return '暂无已拒绝的申请'
    default:
      return '暂无关系修改申请'
  }
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
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
.relationship-approvals-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.approvals-content {
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

/* 审批列表样式 */
.approvals-list {
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

.approval-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.approval-card {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.approval-card:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.approval-card.urgent {
  border-color: #ff4757;
  background: #fff5f5;
}

.approval-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.member-details p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.approval-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.approval-status.pending {
  background: #fff3e0;
  color: #f57c00;
}

.approval-status.approved {
  background: #e8f5e8;
  color: #388e3c;
}

.approval-status.rejected {
  background: #ffebee;
  color: #d32f2f;
}

.approval-content h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.relationship-changes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.change-label {
  font-weight: 500;
  color: #333;
  min-width: 40px;
}

.change-from {
  color: #999;
  text-decoration: line-through;
}

.arrow {
  color: #07c160;
}

.change-to {
  color: #07c160;
  font-weight: 500;
}

.approval-reason {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.reason-label {
  font-weight: 500;
  color: #333;
}

.approval-meta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.approval-actions {
  display: flex;
  gap: 8px;
}

.approve-btn, .reject-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.approve-btn {
  background: #07c160;
  color: white;
}

.approve-btn:hover {
  background: #06a552;
}

.reject-btn {
  background: #ff4757;
  color: white;
}

.reject-btn:hover {
  background: #ff3742;
}

.rejection-reason {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 6px;
  font-size: 12px;
  color: #d32f2f;
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

.reject-modal {
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
}

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

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  background: #f8f9fa;
  color: #666;
}

.modal-actions .reject-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-actions .reject-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

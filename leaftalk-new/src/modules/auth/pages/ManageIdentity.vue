<template>
  <div class="identity-management">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="nav-title">实名认证管理</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-number">{{ stats.pending }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.verified }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.rejected }}</div>
        <div class="stat-label">已拒绝</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        @click="currentTab = tab.value"
        class="tab-btn"
        :class="{ active: currentTab === tab.value }"
      >
        {{ tab.label }}
        <span v-if="stats[tab.value]" class="tab-count">{{ stats[tab.value] }}</span>
      </button>
    </div>

    <!-- 认证列表 -->
    <div class="identity-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="identities.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:document-text" width="48"></iconify-icon>
        <p>暂无{{ currentTabLabel }}的认证申请</p>
      </div>

      <div v-else>
        <div 
          v-for="identity in identities" 
          :key="identity.id"
          class="identity-item"
          @click="viewDetail(identity)"
        >
          <div class="identity-avatar">
            <img :src="getAvatar(identity)" alt="头像" />
          </div>
          
          <div class="identity-info">
            <div class="identity-name">
              <span class="real-name">{{ identity.real_name }}</span>
              <span class="username">({{ identity.name }})</span>
            </div>
            <div class="identity-details">
              <span class="id-number">{{ maskIdNumber(identity.id_number) }}</span>
              <span class="submit-time">{{ formatTime(identity.submitted_at) }}</span>
            </div>
            <div class="identity-contact">
              <span class="phone">{{ identity.phone }}</span>
              <span class="yeyu-id">{{ identity.yeyu_id }}</span>
            </div>
          </div>

          <div class="identity-actions">
            <div class="status-badge" :class="'status-' + identity.status">
              {{ getStatusText(identity.status) }}
            </div>
            
            <div v-if="identity.status === 'pending'" class="action-buttons">
              <button @click.stop="reviewIdentity(identity, 'approve')" class="approve-btn">
                <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
                通过
              </button>
              <button @click.stop="reviewIdentity(identity, 'reject')" class="reject-btn">
                <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.total > pagination.limit" class="pagination">
      <button 
        @click="loadPage(pagination.page - 1)"
        :disabled="pagination.page <= 1"
        class="page-btn"
      >
        上一页
      </button>
      
      <span class="page-info">
        第 {{ pagination.page }} 页，共 {{ Math.ceil(pagination.total / pagination.limit) }} 页
      </span>
      
      <button 
        @click="loadPage(pagination.page + 1)"
        :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
        class="page-btn"
      >
        下一页
      </button>
    </div>

    <!-- 审核对话框 -->
    <div v-if="showReviewDialog" class="dialog-overlay" @click="closeReviewDialog">
      <div class="dialog-content" @click.stop>
        <h3>{{ reviewAction === 'approve' ? '通过认证' : '拒绝认证' }}</h3>
        
        <div class="review-info">
          <p><strong>用户:</strong> {{ selectedIdentity?.real_name }} ({{ selectedIdentity?.name }})</p>
          <p><strong>身份证:</strong> {{ maskIdNumber(selectedIdentity?.id_number) }}</p>
        </div>

        <div v-if="reviewAction === 'reject'" class="form-group">
          <label>拒绝原因 *</label>
          <textarea 
            v-model="rejectReason" 
            placeholder="请输入拒绝原因"
            rows="3"
            required
          ></textarea>
        </div>

        <div class="dialog-actions">
          <button @click="closeReviewDialog" class="cancel-btn">取消</button>
          <button @click="confirmReview" class="confirm-btn" :disabled="isReviewing">
            {{ isReviewing ? '处理中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const identities = ref([])
const currentTab = ref('pending')
const showReviewDialog = ref(false)
const selectedIdentity = ref(null)
const reviewAction = ref('')
const rejectReason = ref('')
const isReviewing = ref(false)

const stats = reactive({
  pending: 0,
  verified: 0,
  rejected: 0
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 标签配置
const tabs = [
  { value: 'pending', label: '待审核' },
  { value: 'verified', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
]

// 计算属性
const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.value === currentTab.value)
  return tab ? tab.label : ''
})

// 方法
const goBack = () => {
  router.back()
}

const getAvatar = (identity) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.yeyu_id}&backgroundColor=b6e3f4`
}

const maskIdNumber = (idNumber) => {
  if (!idNumber) return ''
  return idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'verified': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
}

// 加载认证列表
const loadIdentities = async () => {
  loading.value = true
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const response = await fetch(`/api/admin/identities?status=${currentTab.value}&page=${pagination.page}&limit=${pagination.limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        identities.value = result.data.identities
        Object.assign(pagination, result.data.pagination)
      }
    }
  } catch (error) {
    console.error('加载认证列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // 并行加载各状态的统计
    const promises = tabs.map(async (tab) => {
      const response = await fetch(`/api/admin/identities?status=${tab.value}&page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          stats[tab.value] = result.data.pagination.total
        }
      }
    })

    await Promise.all(promises)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadPage = (page) => {
  pagination.page = page
  loadIdentities()
}

const viewDetail = (identity) => {
  // 可以跳转到详情页面或显示详情对话框
  console.log('查看详情:', identity)
}

const reviewIdentity = (identity, action) => {
  selectedIdentity.value = identity
  reviewAction.value = action
  rejectReason.value = ''
  showReviewDialog.value = true
}

const closeReviewDialog = () => {
  showReviewDialog.value = false
  selectedIdentity.value = null
  reviewAction.value = ''
  rejectReason.value = ''
}

const confirmReview = async () => {
  if (reviewAction.value === 'reject' && !rejectReason.value.trim()) {
    alert('请输入拒绝原因')
    return
  }

  isReviewing.value = true

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const response = await fetch(`/api/admin/identities/${selectedIdentity.value.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: reviewAction.value,
        reason: rejectReason.value
      })
    })

    const result = await response.json()
    
    if (result.success) {
      alert(result.message)
      closeReviewDialog()
      await loadIdentities() // 重新加载列表
      await loadStats() // 重新加载统计
    } else {
      throw new Error(result.message || '审核失败')
    }
  } catch (error) {
    console.error('审核失败:', error)
    alert('审核失败: ' + error.message)
  } finally {
    isReviewing.value = false
  }
}

// 监听标签切换
watch(currentTab, () => {
  pagination.page = 1
  loadIdentities()
})

// 生命周期
onMounted(() => {
  loadStats()
  loadIdentities()
})
</script>

<style scoped>
.identity-management {
  min-height: 100vh;
  background: #f5f5f5;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-placeholder {
  width: 40px;
}

.stats-section {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.filter-tabs {
  display: flex;
  background: #fff;
  margin: 0 16px 16px;
  border-radius: 8px;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #07c160;
  background: #f0f9ff;
}

.tab-count {
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

.tab-btn.active .tab-count {
  background: #07c160;
}

.identity-list {
  padding: 0 16px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.identity-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.identity-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.identity-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.identity-info {
  flex: 1;
}

.identity-name {
  margin-bottom: 4px;
}

.real-name {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
}

.username {
  color: #666;
  font-size: 14px;
}

.identity-details,
.identity-contact {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.identity-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-verified {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.approve-btn,
.reject-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.approve-btn {
  background: #07c160;
  color: white;
}

.approve-btn:hover {
  background: #06ad56;
}

.reject-btn {
  background: #ff4757;
  color: white;
}

.reject-btn:hover {
  background: #ff3742;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.review-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.review-info p {
  margin: 4px 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.confirm-btn {
  background: #07c160;
  color: white;
}

.confirm-btn:hover {
  background: #06ad56;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

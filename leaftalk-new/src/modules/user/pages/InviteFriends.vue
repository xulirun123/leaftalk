<template>
  <div class="invite-friends-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">邀请好友</h1>
      <button @click="showInviteHistory = true" class="history-btn">
        <iconify-icon icon="heroicons:list-bullet" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 邀请奖励说明 -->
    <div class="reward-banner">
      <div class="banner-content">
        <div class="banner-icon">
          <iconify-icon icon="heroicons:gift" width="32"></iconify-icon>
        </div>
        <div class="banner-info">
          <div class="banner-title">邀请好友获得奖励</div>
          <div class="banner-desc">每成功邀请1位好友注册，您和好友都可获得100叶语豆</div>
        </div>
      </div>
    </div>

    <!-- 邀请统计 -->
    <div class="invite-stats">
      <div class="stat-item">
        <div class="stat-number">{{ inviteStats.totalInvites }}</div>
        <div class="stat-label">邀请人数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ inviteStats.successfulInvites }}</div>
        <div class="stat-label">成功注册</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ inviteStats.totalRewards }}</div>
        <div class="stat-label">获得奖励</div>
      </div>
    </div>

    <!-- 邀请方式 -->
    <div class="invite-methods">
      <div class="section-title">邀请方式</div>
      
      <div class="method-cards">
        <div class="method-card" @click="shareToWechat">
          <div class="method-icon wechat">
            <iconify-icon icon="ri:wechat-line" width="24"></iconify-icon>
          </div>
          <div class="method-name">微信分享</div>
          <div class="method-desc">分享到微信好友或朋友圈</div>
        </div>
        
        <div class="method-card" @click="shareToQQ">
          <div class="method-icon qq">
            <iconify-icon icon="ri:qq-line" width="24"></iconify-icon>
          </div>
          <div class="method-name">QQ分享</div>
          <div class="method-desc">分享到QQ好友或空间</div>
        </div>
        
        <div class="method-card" @click="copyInviteLink">
          <div class="method-icon link">
            <iconify-icon icon="heroicons:link" width="24"></iconify-icon>
          </div>
          <div class="method-name">复制链接</div>
          <div class="method-desc">复制邀请链接分享</div>
        </div>
        
        <div class="method-card" @click="showQRCode = true">
          <div class="method-icon qr">
            <iconify-icon icon="heroicons:qr-code" width="24"></iconify-icon>
          </div>
          <div class="method-name">二维码</div>
          <div class="method-desc">生成二维码分享</div>
        </div>
      </div>
    </div>

    <!-- 邀请码 -->
    <div class="invite-code-section">
      <div class="section-title">我的邀请码</div>
      <div class="invite-code-card">
        <div class="code-display">
          <div class="code-label">邀请码</div>
          <div class="code-value">{{ userInviteCode }}</div>
        </div>
        <button @click="copyInviteCode" class="copy-code-btn">
          <iconify-icon icon="heroicons:clipboard-document" width="16"></iconify-icon>
          <span>复制</span>
        </button>
      </div>
      <div class="code-usage">
        <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
        <span>好友注册时输入您的邀请码，双方都可获得奖励</span>
      </div>
    </div>

    <!-- 邀请记录 -->
    <div class="invite-records">
      <div class="section-title">
        <span>最近邀请</span>
        <button @click="showInviteHistory = true" class="view-all-btn">查看全部</button>
      </div>
      
      <div class="record-list">
        <div 
          v-for="record in recentInvites" 
          :key="record.id"
          class="record-item"
        >
          <div class="record-avatar">
            <img :src="record.avatar || '/default-avatar.png'" :alt="record.name" />
          </div>
          <div class="record-info">
            <div class="record-name">{{ record.name || '未注册用户' }}</div>
            <div class="record-time">{{ formatTime(record.inviteTime) }}</div>
          </div>
          <div class="record-status" :class="record.status">
            <span>{{ getStatusText(record.status) }}</span>
            <div v-if="record.status === 'registered'" class="reward-badge">+{{ record.reward }}豆</div>
          </div>
        </div>
        
        <div v-if="recentInvites.length === 0" class="empty-records">
          <iconify-icon icon="heroicons:user-plus" width="48"></iconify-icon>
          <p>暂无邀请记录</p>
        </div>
      </div>
    </div>

    <!-- 二维码弹窗 -->
    <div v-if="showQRCode" class="modal-overlay" @click="showQRCode = false">
      <div class="qr-modal" @click.stop>
        <div class="modal-header">
          <h3>邀请二维码</h3>
          <button @click="showQRCode = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="qr-content">
          <div class="qr-code">
            <img :src="qrCodeUrl" alt="邀请二维码" />
          </div>
          <div class="qr-info">
            <div class="qr-title">扫码下载叶语</div>
            <div class="qr-desc">使用微信或其他扫码工具扫描二维码</div>
            <div class="invite-code-display">
              <span>邀请码: {{ userInviteCode }}</span>
            </div>
          </div>
        </div>
        
        <div class="qr-actions">
          <button @click="saveQRCode" class="save-qr-btn">
            <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            <span>保存图片</span>
          </button>
          <button @click="shareQRCode" class="share-qr-btn">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 邀请历史弹窗 -->
    <div v-if="showInviteHistory" class="modal-overlay" @click="showInviteHistory = false">
      <div class="history-modal" @click.stop>
        <div class="modal-header">
          <h3>邀请历史</h3>
          <button @click="showInviteHistory = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="history-filters">
          <div class="filter-tabs">
            <div 
              v-for="filter in historyFilters" 
              :key="filter.id"
              class="filter-tab"
              :class="{ active: selectedHistoryFilter === filter.id }"
              @click="selectedHistoryFilter = filter.id"
            >
              {{ filter.name }}
            </div>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="record in filteredInviteHistory" 
            :key="record.id"
            class="history-item"
          >
            <div class="history-avatar">
              <img :src="record.avatar || '/default-avatar.png'" :alt="record.name" />
            </div>
            <div class="history-info">
              <div class="history-name">{{ record.name || '未注册用户' }}</div>
              <div class="history-phone">{{ record.phone || '未知手机号' }}</div>
              <div class="history-time">{{ formatDateTime(record.inviteTime) }}</div>
            </div>
            <div class="history-status" :class="record.status">
              <div class="status-text">{{ getStatusText(record.status) }}</div>
              <div v-if="record.status === 'registered'" class="reward-info">
                <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
                <span>+{{ record.reward }}豆</span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredInviteHistory.length === 0" class="empty-history">
            <iconify-icon icon="heroicons:document-text" width="48"></iconify-icon>
            <p>暂无邀请记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 状态
const showQRCode = ref(false)
const showInviteHistory = ref(false)
const selectedHistoryFilter = ref('all')

// 用户邀请码
const userInviteCode = ref('')
const qrCodeUrl = ref('')

// 邀请统计
const inviteStats = ref({
  totalInvites: 0,
  successfulInvites: 0,
  totalRewards: 0
})

// 邀请记录
const recentInvites = ref([])
const allInviteHistory = ref([])

// 历史筛选
const historyFilters = ref([
  { id: 'all', name: '全部' },
  { id: 'pending', name: '待注册' },
  { id: 'registered', name: '已注册' },
  { id: 'expired', name: '已过期' }
])

// 计算属性
const filteredInviteHistory = computed(() => {
  if (selectedHistoryFilter.value === 'all') {
    return allInviteHistory.value
  }
  
  return allInviteHistory.value.filter(record => record.status === selectedHistoryFilter.value)
})

// 生命周期
onMounted(() => {
  loadInviteData()
  generateQRCode()
})

// 方法
const loadInviteData = async () => {
  try {
    const response = await fetch('/api/user/invite/data', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const data = result.data
        userInviteCode.value = data.inviteCode
        inviteStats.value = data.stats
        recentInvites.value = data.recentInvites
        allInviteHistory.value = data.allInvites
      }
    }
  } catch (error) {
    console.error('加载邀请数据失败:', error)
  }
}

const generateQRCode = async () => {
  try {
    const response = await fetch('/api/user/invite/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        qrCodeUrl.value = result.data.qrCodeUrl
      }
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

const shareToWechat = () => {
  const shareData = {
    title: '叶语 - 家族族谱社交平台',
    desc: `我在叶语创建了家族族谱，邀请您一起加入！邀请码：${userInviteCode.value}`,
    link: `https://yeyu.app/register?invite=${userInviteCode.value}`,
    imgUrl: '/app-icon.png'
  }
  
  // 调用微信分享API
  if (window.wx) {
    window.wx.ready(() => {
      window.wx.onMenuShareAppMessage(shareData)
      window.wx.onMenuShareTimeline(shareData)
    })
  } else {
    copyInviteLink()
  }
}

const shareToQQ = () => {
  const shareUrl = `https://yeyu.app/register?invite=${userInviteCode.value}`
  const shareTitle = '叶语 - 家族族谱社交平台'
  const shareDesc = `我在叶语创建了家族族谱，邀请您一起加入！邀请码：${userInviteCode.value}`
  
  const qqShareUrl = `mqqapi://share/to_fri?file_type=news&src_type=web&version=1&generalpastboard=1&file_data=${encodeURIComponent(JSON.stringify({
    app_name: shareTitle,
    desc: shareDesc,
    detail_url: shareUrl,
    preview_url: '/app-icon.png'
  }))}`
  
  window.location.href = qqShareUrl
}

const copyInviteLink = async () => {
  const inviteLink = `https://yeyu.app/register?invite=${userInviteCode.value}`
  
  try {
    await navigator.clipboard.writeText(inviteLink)
    appStore.showToast('邀请链接已复制', 'success')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = inviteLink
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    appStore.showToast('邀请链接已复制', 'success')
  }
}

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(userInviteCode.value)
    appStore.showToast('邀请码已复制', 'success')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = userInviteCode.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    appStore.showToast('邀请码已复制', 'success')
  }
}

const saveQRCode = () => {
  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `叶语邀请码-${userInviteCode.value}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  appStore.showToast('二维码已保存', 'success')
}

const shareQRCode = () => {
  if (navigator.share) {
    navigator.share({
      title: '叶语邀请码',
      text: `我的叶语邀请码：${userInviteCode.value}`,
      url: `https://yeyu.app/register?invite=${userInviteCode.value}`
    })
  } else {
    copyInviteLink()
  }
}

// 辅助方法
const getStatusText = (status) => {
  const statusMap = {
    pending: '待注册',
    registered: '已注册',
    expired: '已过期'
  }
  return statusMap[status] || status
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.invite-friends-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .history-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 奖励横幅 */
.reward-banner {
  margin: 16px;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.banner-content {
  display: flex;
  align-items: center;
  padding: 16px;
  color: white;
}

.banner-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.banner-info {
  flex: 1;
}

.banner-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.banner-desc {
  font-size: 12px;
  opacity: 0.8;
}

/* 邀请统计 */
.invite-stats {
  display: flex;
  justify-content: space-between;
  margin: 0 16px 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 邀请方式 */
.invite-methods {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.method-card {
  padding: 16px;
  border-radius: 12px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
}

.method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 12px;
}

.method-icon.wechat {
  background: #07c160;
}

.method-icon.qq {
  background: #12b7f5;
}

.method-icon.link {
  background: #ff9800;
}

.method-icon.qr {
  background: #673ab7;
}

.method-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 12px;
  color: #666;
}

/* 邀请码 */
.invite-code-section {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.invite-code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 12px;
}

.code-display {
  flex: 1;
}

.code-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.code-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  letter-spacing: 2px;
}

.copy-code-btn {
  height: 36px;
  border: 1px solid #07c160;
  border-radius: 18px;
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  cursor: pointer;
}

.code-usage {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

/* 邀请记录 */
.invite-records {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.view-all-btn {
  background: none;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
}

.record-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.record-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #666;
}

.record-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

.record-status.pending {
  background: #f0f0f0;
  color: #666;
}

.record-status.registered {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.record-status.expired {
  background: #f0f0f0;
  color: #999;
}

.reward-badge {
  margin-top: 4px;
  font-weight: 600;
  color: #ff9800;
}

.empty-records {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-records iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

/* 弹窗样式 */
.modal-overlay {
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
  padding: 20px;
}

.qr-modal,
.history-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

/* 二维码弹窗 */
.qr-content {
  padding: 20px;
  text-align: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.qr-code img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-info {
  margin-bottom: 20px;
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.qr-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.invite-code-display {
  display: inline-block;
  padding: 8px 16px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  color: #333;
}

.qr-actions {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.save-qr-btn,
.share-qr-btn {
  flex: 1;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.save-qr-btn {
  background: white;
  border: 1px solid #ddd;
  color: #333;
}

.share-qr-btn {
  background: #07c160;
  border: none;
  color: white;
}

/* 历史弹窗 */
.history-filters {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.filter-tabs {
  display: flex;
  gap: 16px;
}

.filter-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.filter-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.history-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.history-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.history-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.history-phone {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-status {
  text-align: center;
}

.status-text {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.history-status.pending .status-text {
  background: #f0f0f0;
  color: #666;
}

.history-status.registered .status-text {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.history-status.expired .status-text {
  background: #f0f0f0;
  color: #999;
}

.reward-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  color: #ff9800;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-history iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}
</style>

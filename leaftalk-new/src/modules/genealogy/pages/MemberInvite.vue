<template>
  <div class="member-invite-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="邀请成员" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="invite-content">
      <!-- 邀请方式选择 -->
      <div class="invite-methods">
        <h3>邀请方式</h3>
        <div class="method-cards">
          <div class="method-card" @click="showPhoneInvite">
            <div class="method-icon">
              <iconify-icon icon="heroicons:phone" width="24" color="#07c160"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>手机号邀请</h4>
              <p>通过手机号直接邀请用户加入</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>

          <div class="method-card" @click="showQRInvite">
            <div class="method-icon">
              <iconify-icon icon="heroicons:qr-code" width="24" color="#3742fa"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>二维码邀请</h4>
              <p>生成邀请二维码，扫码加入</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>

          <div class="method-card" @click="showLinkInvite">
            <div class="method-icon">
              <iconify-icon icon="heroicons:link" width="24" color="#ff6b6b"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>链接邀请</h4>
              <p>生成邀请链接，分享给家族成员</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>

          <div class="method-card" @click="goToBatchInvite">
            <div class="method-icon">
              <iconify-icon icon="heroicons:users" width="24" color="#ffa502"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>批量邀请</h4>
              <p>批量导入联系人进行邀请</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 待处理邀请 -->
      <div class="pending-invites">
        <h3>待处理邀请</h3>
        <div v-if="pendingInvites.length === 0" class="empty-invites">
          <iconify-icon icon="heroicons:inbox" width="48" color="#ccc"></iconify-icon>
          <p>暂无待处理的邀请</p>
        </div>
        <div v-else class="invite-list">
          <div 
            v-for="invite in pendingInvites" 
            :key="invite.id"
            class="invite-item"
          >
            <div class="invite-info">
              <h4>{{ invite.inviteeName || invite.phone || invite.email }}</h4>
              <p>邀请时间：{{ formatDate(invite.createdAt) }}</p>
              <div class="invite-status" :class="invite.status">
                {{ getStatusText(invite.status) }}
              </div>
            </div>
            <div class="invite-actions">
              <button @click="resendInvite(invite)" class="resend-btn">
                重发
              </button>
              <button @click="cancelInvite(invite)" class="cancel-btn">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请统计 -->
      <div class="invite-stats">
        <h3>邀请统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.total }}</div>
            <div class="stat-label">总邀请数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.accepted }}</div>
            <div class="stat-label">已接受</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.expired }}</div>
            <div class="stat-label">已过期</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 手机号邀请弹窗 -->
    <div v-if="showPhoneModal" class="modal-overlay" @click="closePhoneModal">
      <div class="invite-modal" @click.stop>
        <div class="modal-header">
          <h3>手机号邀请</h3>
          <button @click="closePhoneModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>手机号</label>
            <input 
              v-model="phoneInvite.phone"
              type="tel"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </div>
          <div class="form-group">
            <label>姓名（可选）</label>
            <input 
              v-model="phoneInvite.name"
              type="text"
              placeholder="请输入被邀请人姓名"
            />
          </div>
          <div class="form-group">
            <label>邀请消息</label>
            <textarea 
              v-model="phoneInvite.message"
              placeholder="请输入邀请消息"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button @click="closePhoneModal" class="cancel-btn">取消</button>
            <button @click="sendPhoneInvite" :disabled="sending" class="send-btn">
              {{ sending ? '发送中...' : '发送邀请' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 二维码邀请弹窗 -->
    <div v-if="showQRModal" class="modal-overlay" @click="closeQRModal">
      <div class="qr-modal" @click.stop>
        <div class="modal-header">
          <h3>二维码邀请</h3>
          <button @click="closeQRModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="qr-container">
            <div class="qr-code">
              <img :src="qrCodeUrl" alt="邀请二维码" />
            </div>
            <p class="qr-tip">扫描二维码加入家族</p>
          </div>
          <div class="qr-actions">
            <button @click="saveQRCode" class="save-btn">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
              保存图片
            </button>
            <button @click="shareQRCode" class="share-btn">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
              分享二维码
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 链接邀请弹窗 -->
    <div v-if="showLinkModal" class="modal-overlay" @click="closeLinkModal">
      <div class="link-modal" @click.stop>
        <div class="modal-header">
          <h3>链接邀请</h3>
          <button @click="closeLinkModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="link-container">
            <label>邀请链接</label>
            <div class="link-input">
              <input 
                :value="inviteLink"
                readonly
                class="link-text"
              />
              <button @click="copyLink" class="copy-btn">
                <iconify-icon icon="heroicons:clipboard" width="16"></iconify-icon>
              </button>
            </div>
          </div>
          <div class="link-settings">
            <div class="form-group">
              <label>有效期</label>
              <select v-model="linkSettings.expiry">
                <option value="1">1天</option>
                <option value="7">7天</option>
                <option value="30">30天</option>
                <option value="0">永久有效</option>
              </select>
            </div>
            <div class="form-group">
              <label>使用次数限制</label>
              <select v-model="linkSettings.maxUses">
                <option value="1">1次</option>
                <option value="10">10次</option>
                <option value="50">50次</option>
                <option value="0">无限制</option>
              </select>
            </div>
          </div>
          <div class="link-actions">
            <button @click="generateNewLink" class="generate-btn">
              重新生成
            </button>
            <button @click="shareLink" class="share-btn">
              分享链接
            </button>
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
const pendingInvites = ref([])
const inviteStats = ref({
  total: 0,
  accepted: 0,
  pending: 0,
  expired: 0
})

// 弹窗状态
const showPhoneModal = ref(false)
const showQRModal = ref(false)
const showLinkModal = ref(false)
const sending = ref(false)

// 邀请数据
const phoneInvite = ref({
  phone: '',
  name: '',
  message: '邀请您加入我们的家族族谱，一起记录和传承家族历史！'
})

const qrCodeUrl = ref('')
const inviteLink = ref('')
const linkSettings = ref({
  expiry: '7',
  maxUses: '10'
})

// 生命周期
onMounted(() => {
  loadInviteData()
  generateInviteLink()
  generateQRCode()
})

// 方法
const goBack = () => {
  router.back()
}

const loadInviteData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        pendingInvites.value = result.data.invites || []
        inviteStats.value = result.data.stats || inviteStats.value
      }
    }
  } catch (error) {
    console.error('加载邀请数据失败:', error)
  }
}

const showPhoneInvite = () => {
  showPhoneModal.value = true
}

const closePhoneModal = () => {
  showPhoneModal.value = false
  phoneInvite.value = {
    phone: '',
    name: '',
    message: '邀请您加入我们的家族族谱，一起记录和传承家族历史！'
  }
}

const sendPhoneInvite = async () => {
  if (!phoneInvite.value.phone.trim()) {
    appStore.showToast('请输入手机号', 'error')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phoneInvite.value.phone)) {
    appStore.showToast('请输入正确的手机号', 'error')
    return
  }

  sending.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(phoneInvite.value)
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('邀请发送成功', 'success')
      closePhoneModal()
      loadInviteData()
    } else {
      appStore.showToast(result.message || '发送失败', 'error')
    }
  } catch (error) {
    console.error('发送邀请失败:', error)
    appStore.showToast('发送邀请失败', 'error')
  } finally {
    sending.value = false
  }
}

const showQRInvite = () => {
  showQRModal.value = true
}

const closeQRModal = () => {
  showQRModal.value = false
}

const generateQRCode = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites/qrcode`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
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

const saveQRCode = () => {
  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `family-invite-qr-${Date.now()}.png`
  link.click()
  appStore.showToast('二维码已保存', 'success')
}

const shareQRCode = () => {
  if (navigator.share) {
    navigator.share({
      title: '家族邀请',
      text: '扫描二维码加入我们的家族',
      url: qrCodeUrl.value
    })
  } else {
    appStore.showToast('分享功能不支持', 'error')
  }
}

const showLinkInvite = () => {
  showLinkModal.value = true
}

const closeLinkModal = () => {
  showLinkModal.value = false
}

const generateInviteLink = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(linkSettings.value)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        inviteLink.value = result.data.inviteLink
      }
    }
  } catch (error) {
    console.error('生成邀请链接失败:', error)
  }
}

const generateNewLink = () => {
  generateInviteLink()
  appStore.showToast('新链接已生成', 'success')
}

const copyLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  appStore.showToast('链接已复制', 'success')
}

const shareLink = () => {
  if (navigator.share) {
    navigator.share({
      title: '家族邀请',
      text: '点击链接加入我们的家族',
      url: inviteLink.value
    })
  } else {
    copyLink()
  }
}

const goToBatchInvite = () => {
  router.push(`/genealogy/${genealogyId.value}/management/batch-invite`)
}

const resendInvite = async (invite: any) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites/${invite.id}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('重发成功', 'success')
      loadInviteData()
    } else {
      appStore.showToast(result.message || '重发失败', 'error')
    }
  } catch (error) {
    console.error('重发邀请失败:', error)
    appStore.showToast('重发邀请失败', 'error')
  }
}

const cancelInvite = async (invite: any) => {
  if (!confirm('确定要取消此邀请吗？')) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/invites/${invite.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('邀请已取消', 'success')
      loadInviteData()
    } else {
      appStore.showToast(result.message || '取消失败', 'error')
    }
  } catch (error) {
    console.error('取消邀请失败:', error)
    appStore.showToast('取消邀请失败', 'error')
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'pending': '待处理',
    'accepted': '已接受',
    'expired': '已过期',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.member-invite-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.invite-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 邀请方式样式 */
.invite-methods {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invite-methods h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.method-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-card:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
}

.method-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.method-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.arrow {
  color: #ccc;
}

/* 待处理邀请样式 */
.pending-invites {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pending-invites h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.empty-invites {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.invite-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.invite-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.invite-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.invite-status.pending {
  background: #fff3e0;
  color: #f57c00;
}

.invite-status.accepted {
  background: #e8f5e8;
  color: #388e3c;
}

.invite-status.expired {
  background: #ffebee;
  color: #d32f2f;
}

.invite-actions {
  display: flex;
  gap: 8px;
}

.resend-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.resend-btn {
  background: #07c160;
  color: white;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

/* 邀请统计样式 */
.invite-stats {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invite-stats h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
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

.invite-modal, .qr-modal, .link-modal {
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

/* 二维码样式 */
.qr-container {
  text-align: center;
  margin-bottom: 20px;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code img {
  max-width: 100%;
  max-height: 100%;
}

.qr-tip {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.qr-actions {
  display: flex;
  gap: 12px;
}

.save-btn, .share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn {
  background: #f8f9fa;
  color: #666;
}

.share-btn {
  background: #07c160;
  color: white;
}

/* 链接样式 */
.link-container {
  margin-bottom: 20px;
}

.link-input {
  display: flex;
  gap: 8px;
}

.link-text {
  flex: 1;
  background: #f8f9fa;
}

.copy-btn {
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.link-settings {
  margin-bottom: 20px;
}

.link-actions {
  display: flex;
  gap: 12px;
}

.generate-btn, .share-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.generate-btn {
  background: #f8f9fa;
  color: #666;
}
</style>

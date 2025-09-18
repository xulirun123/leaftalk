<template>
  <div class="business-card">
    <!-- 名片头部 -->
    <div class="card-header">
      <div class="user-avatar">
        <img :src="userInfo.avatar" :alt="userInfo.name" />
        <div class="online-indicator" v-if="userInfo.isOnline"></div>
      </div>
      
      <div class="user-basic">
        <h3>{{ userInfo.name }}</h3>
        <p class="user-id">叶语号：{{ userInfo.yeyuId }}</p>
        <div class="user-status">
          <span class="status-dot" :class="{ online: userInfo.isOnline }"></span>
          <span>{{ userInfo.isOnline ? '在线' : '离线' }}</span>
        </div>
      </div>
      
      <div class="card-actions" v-if="!isOwnCard">
        <button @click="addFriend" class="action-btn" v-if="!isFriend">
          <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
        </button>
        <button @click="startChat" class="action-btn">
          <iconify-icon icon="heroicons:chat-bubble-left" width="16"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 名片内容 -->
    <div class="card-content">
      <!-- 个人信息 -->
      <div class="info-section">
        <div class="info-item" v-if="userInfo.signature">
          <div class="info-label">
            <iconify-icon icon="heroicons:chat-bubble-left-ellipsis" width="16"></iconify-icon>
            <span>个性签名</span>
          </div>
          <div class="info-value">{{ userInfo.signature }}</div>
        </div>
        
        <div class="info-item" v-if="userInfo.region">
          <div class="info-label">
            <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
            <span>地区</span>
          </div>
          <div class="info-value">{{ userInfo.region }}</div>
        </div>
        
        <div class="info-item" v-if="userInfo.gender">
          <div class="info-label">
            <iconify-icon :icon="getGenderIcon()" width="16"></iconify-icon>
            <span>性别</span>
          </div>
          <div class="info-value">{{ getGenderText() }}</div>
        </div>
        
        <div class="info-item" v-if="userInfo.birthday">
          <div class="info-label">
            <iconify-icon icon="heroicons:cake" width="16"></iconify-icon>
            <span>生日</span>
          </div>
          <div class="info-value">{{ formatBirthday(userInfo.birthday) }}</div>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="contact-section" v-if="showContactInfo">
        <h4 class="section-title">联系方式</h4>
        
        <div class="contact-item" v-if="userInfo.phone">
          <div class="contact-icon">
            <iconify-icon icon="heroicons:phone" width="16"></iconify-icon>
          </div>
          <div class="contact-info">
            <span>{{ formatPhone(userInfo.phone) }}</span>
            <button @click="callPhone" class="contact-action">
              <iconify-icon icon="heroicons:phone" width="14"></iconify-icon>
            </button>
          </div>
        </div>
        
        <div class="contact-item" v-if="userInfo.email">
          <div class="contact-icon">
            <iconify-icon icon="heroicons:envelope" width="16"></iconify-icon>
          </div>
          <div class="contact-info">
            <span>{{ userInfo.email }}</span>
            <button @click="sendEmail" class="contact-action">
              <iconify-icon icon="heroicons:envelope" width="14"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 社交信息 -->
      <div class="social-section" v-if="userInfo.socialAccounts?.length > 0">
        <h4 class="section-title">社交账号</h4>
        
        <div class="social-grid">
          <div 
            v-for="account in userInfo.socialAccounts" 
            :key="account.platform"
            class="social-item"
            @click="openSocialAccount(account)"
          >
            <div class="social-icon">
              <iconify-icon :icon="getSocialIcon(account.platform)" width="20"></iconify-icon>
            </div>
            <span>{{ account.username }}</span>
          </div>
        </div>
      </div>

      <!-- 二维码 -->
      <div class="qr-section" v-if="showQRCode">
        <h4 class="section-title">二维码名片</h4>
        
        <div class="qr-container">
          <div class="qr-code">
            <canvas ref="qrCanvas" width="120" height="120"></canvas>
          </div>
          <div class="qr-info">
            <p>扫一扫上面的二维码，加我叶语</p>
            <button @click="saveQRCode" class="save-qr-btn">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
              <span>保存到相册</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="card-actions-bottom" v-if="!isOwnCard">
      <button @click="sendCard" class="action-btn-large secondary">
        <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
        <span>分享名片</span>
      </button>
      
      <button @click="startChat" class="action-btn-large primary">
        <iconify-icon icon="heroicons:chat-bubble-left" width="16"></iconify-icon>
        <span>发消息</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

// Props
interface Props {
  userId: string
  showContactInfo?: boolean
  showQRCode?: boolean
  isOwnCard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showContactInfo: false,
  showQRCode: false,
  isOwnCard: false
})

// Emits
const emit = defineEmits<{
  'add-friend': [userId: string]
  'start-chat': [userId: string]
  'send-card': [userInfo: any]
}>()

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const qrCanvas = ref<HTMLCanvasElement>()

// 用户信息（模拟数据）
const userInfo = ref({
  id: props.userId,
  name: '张小明',
  yeyuId: 'YY1234567890',
  avatar: '/avatar1.jpg',
  signature: '生活不止眼前的苟且，还有诗和远方',
  region: '北京 朝阳',
  gender: 'male', // male, female, unknown
  birthday: '1990-01-01',
  phone: '13800138000',
  email: 'zhangxiaoming@example.com',
  isOnline: true,
  socialAccounts: [
    { platform: 'wechat', username: 'zhangxiaoming' },
    { platform: 'weibo', username: '@张小明' },
    { platform: 'qq', username: '123456789' }
  ]
})

const isFriend = ref(false)

// 计算属性
const getGenderIcon = () => {
  switch (userInfo.value.gender) {
    case 'male':
      return 'heroicons:user'
    case 'female':
      return 'heroicons:user'
    default:
      return 'heroicons:user'
  }
}

const getGenderText = () => {
  switch (userInfo.value.gender) {
    case 'male':
      return '男'
    case 'female':
      return '女'
    default:
      return '未知'
  }
}

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'wechat':
      return 'heroicons:chat-bubble-left'
    case 'weibo':
      return 'heroicons:megaphone'
    case 'qq':
      return 'heroicons:chat-bubble-left-ellipsis'
    default:
      return 'heroicons:link'
  }
}

// 方法
const formatPhone = (phone: string) => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
}

const formatBirthday = (birthday: string) => {
  const date = new Date(birthday)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const addFriend = () => {
  emit('add-friend', userInfo.value.id)
  appStore.showToast('好友申请已发送', 'success')
}

const startChat = () => {
  emit('start-chat', userInfo.value.id)

  // 获取当前用户ID
  const currentUserId = '1' // 这里应该从auth store获取
  const otherUserId = userInfo.value.id

  // 生成统一的chatId格式：小ID_大ID
  const chatId = `${Math.min(Number(currentUserId), Number(otherUserId))}_${Math.max(Number(currentUserId), Number(otherUserId))}`

  router.push(`/chat/${chatId}`)
}

const sendCard = () => {
  emit('send-card', userInfo.value)
  appStore.showToast('名片已分享', 'success')
}

const callPhone = () => {
  if (userInfo.value.phone) {
    window.location.href = `tel:${userInfo.value.phone}`
  }
}

const sendEmail = () => {
  if (userInfo.value.email) {
    window.location.href = `mailto:${userInfo.value.email}`
  }
}

const openSocialAccount = (account: any) => {
  appStore.showToast(`打开${account.platform}：${account.username}`, 'info')
}

const generateQRCode = () => {
  if (!qrCanvas.value) return
  
  const canvas = qrCanvas.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return
  
  // 简单的二维码占位符
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 120, 120)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(10, 10, 100, 100)
  
  ctx.fillStyle = '#000'
  // 绘制简单的二维码图案
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(15 + i * 9, 15 + j * 9, 8, 8)
      }
    }
  }
}

const saveQRCode = () => {
  if (!qrCanvas.value) return
  
  const link = document.createElement('a')
  link.download = `${userInfo.value.name}_叶语名片.png`
  link.href = qrCanvas.value.toDataURL()
  link.click()
  
  appStore.showToast('二维码已保存到相册', 'success')
}

// 生命周期
onMounted(() => {
  console.log('名片组件加载:', props.userId)
  
  // 加载用户信息
  // loadUserInfo()
  
  // 生成二维码
  if (props.showQRCode) {
    generateQRCode()
  }
})
</script>

<style scoped>
.business-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #07C160, #06a552);
  color: white;
}

.user-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.3);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
}

.user-basic {
  flex: 1;
}

.user-basic h3 {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.user-id {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 8px 0;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-dot.online {
  background: #4CAF50;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.2);
}

.card-content {
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  color: #666;
  font-size: 14px;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 14px;
  line-height: 1.4;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.contact-section {
  margin-bottom: 24px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.contact-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.contact-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.contact-action {
  width: 28px;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background: white;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-action:hover {
  border-color: #07C160;
  color: #07C160;
}

.social-section {
  margin-bottom: 24px;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.social-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.social-item:hover {
  border-color: #07C160;
  background: #f0f8f0;
}

.social-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.qr-section {
  margin-bottom: 24px;
}

.qr-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
}

.qr-code {
  flex-shrink: 0;
}

.qr-info {
  flex: 1;
}

.qr-info p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.save-qr-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #07C160;
  border-radius: 6px;
  background: white;
  color: #07C160;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.save-qr-btn:hover {
  background: #07C160;
  color: white;
}

.card-actions-bottom {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.action-btn-large {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn-large.primary {
  background: #07C160;
  color: white;
}

.action-btn-large.primary:hover {
  background: #06a552;
}

.action-btn-large.secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.action-btn-large.secondary:hover {
  background: #e8e8e8;
}
</style>

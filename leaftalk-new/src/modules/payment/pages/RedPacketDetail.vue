<template>
  <div class="redpacket-detail-page">
    <MobileTopBar
      title="红包详情"
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content">
      <!-- 红包主体 -->
      <div class="redpacket-main" :class="{ 'opened': isOpened }">
        <div class="redpacket-header">
          <div class="sender-avatar">
            <img :src="redpacketInfo.senderAvatar" :alt="redpacketInfo.senderName" />
          </div>
          <div class="sender-info">
            <h3>{{ redpacketInfo.senderName }}</h3>
            <p>{{ redpacketInfo.blessing }}</p>
          </div>
        </div>
        
        <div class="redpacket-body">
          <div v-if="!isOpened && canOpen" class="unopened-state">
            <div class="redpacket-icon">
              <iconify-icon 
                :icon="redpacketInfo.type === 'lucky' ? 'heroicons:sparkles' : 'heroicons:gift'" 
                width="80" 
                color="white"
              ></iconify-icon>
            </div>
            <div class="open-text">
              <span>{{ redpacketInfo.type === 'lucky' ? '拼手气红包' : '红包' }}</span>
              <small>点击开启</small>
            </div>
            <button @click="openRedPacket" class="open-btn">
              开启红包
            </button>
          </div>
          
          <div v-else-if="isOpened" class="opened-state">
            <div class="amount-display">
              <span class="currency">¥</span>
              <span class="amount">{{ claimedAmount.toFixed(2) }}</span>
            </div>
            <div class="success-text">
              <span>恭喜你获得红包</span>
              <small v-if="redpacketInfo.type === 'lucky'">手气不错哦</small>
            </div>
          </div>
          
          <div v-else class="unavailable-state">
            <div class="status-icon">
              <iconify-icon 
                :icon="getStatusIcon()" 
                width="60" 
                color="#ccc"
              ></iconify-icon>
            </div>
            <div class="status-text">
              <span>{{ getStatusText() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 红包信息 -->
      <div class="redpacket-info">
        <div class="info-item">
          <span class="label">红包类型</span>
          <span class="value">{{ redpacketInfo.type === 'lucky' ? '拼手气红包' : '普通红包' }}</span>
        </div>
        <div class="info-item">
          <span class="label">红包总额</span>
          <span class="value">¥{{ redpacketInfo.totalAmount.toFixed(2) }}</span>
        </div>
        <div v-if="redpacketInfo.type === 'lucky'" class="info-item">
          <span class="label">红包个数</span>
          <span class="value">{{ redpacketInfo.totalCount }}个</span>
        </div>
        <div class="info-item">
          <span class="label">发送时间</span>
          <span class="value">{{ formatTime(redpacketInfo.createdAt) }}</span>
        </div>
      </div>

      <!-- 领取记录 -->
      <div v-if="redpacketInfo.type === 'lucky'" class="claim-records">
        <div class="records-header">
          <h4>领取记录</h4>
          <span>{{ claimRecords.length }}/{{ redpacketInfo.totalCount }}</span>
        </div>
        
        <div class="records-list">
          <div 
            v-for="record in claimRecords" 
            :key="record.id"
            class="record-item"
          >
            <div class="record-avatar">
              <img :src="record.userAvatar" :alt="record.userName" />
            </div>
            <div class="record-info">
              <span class="record-name">{{ record.userName }}</span>
              <span class="record-time">{{ formatTime(record.claimedAt) }}</span>
            </div>
            <div class="record-amount">
              <span>¥{{ record.amount.toFixed(2) }}</span>
              <small v-if="record.isLuckiest" class="lucky-tag">手气最佳</small>
            </div>
          </div>
          
          <div v-if="claimRecords.length === 0" class="empty-records">
            <iconify-icon icon="heroicons:clock" width="32" color="#ccc"></iconify-icon>
            <span>还没有人领取</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 开启动画 -->
    <div v-if="showOpenAnimation" class="open-animation-overlay">
      <div class="animation-content">
        <div class="coin-animation">
          <iconify-icon icon="heroicons:currency-dollar" width="60" color="#ffd700"></iconify-icon>
        </div>
        <div class="amount-animation">
          <span>¥{{ claimedAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const isOpened = ref(false)
const claimedAmount = ref(0)
const showOpenAnimation = ref(false)

// 红包信息
const redpacketInfo = ref({
  id: route.params.redpacketId,
  senderName: '张三',
  senderAvatar: '/avatar1.jpg',
  blessing: '恭喜发财，大吉大利！',
  type: 'lucky', // normal 或 lucky
  totalAmount: 100.00,
  totalCount: 10,
  remainingAmount: 45.50,
  remainingCount: 5,
  status: 'active', // active, finished, expired
  createdAt: new Date(Date.now() - 3600000),
  isClaimedByMe: false
})

// 领取记录
const claimRecords = ref([
  {
    id: 1,
    userName: '李四',
    userAvatar: '/avatar2.jpg',
    amount: 15.50,
    claimedAt: new Date(Date.now() - 1800000),
    isLuckiest: true
  },
  {
    id: 2,
    userName: '王五',
    userAvatar: '/avatar3.jpg',
    amount: 8.20,
    claimedAt: new Date(Date.now() - 1200000),
    isLuckiest: false
  },
  {
    id: 3,
    userName: '赵六',
    userAvatar: '/avatar4.jpg',
    amount: 12.80,
    claimedAt: new Date(Date.now() - 600000),
    isLuckiest: false
  }
])

// 计算属性
const canOpen = computed(() => {
  return redpacketInfo.value.status === 'active' && 
         redpacketInfo.value.remainingCount > 0 && 
         !redpacketInfo.value.isClaimedByMe
})

// 生命周期
onMounted(() => {
  console.log('红包详情页面加载:', route.params.redpacketId)
  loadRedPacketInfo()
})

// 方法
const goBack = () => {
  router.back()
}

const loadRedPacketInfo = async () => {
  try {
    // 这里应该调用API加载红包信息
    console.log('加载红包信息:', route.params.redpacketId)
    
    // 模拟API调用
    // const response = await api.getRedPacketDetail(route.params.redpacketId)
    // redpacketInfo.value = response.data
    
    // 检查是否已经领取过
    if (redpacketInfo.value.isClaimedByMe) {
      isOpened.value = true
      // 获取已领取的金额
      const myRecord = claimRecords.value.find(r => r.userName === '当前用户')
      if (myRecord) {
        claimedAmount.value = myRecord.amount
      }
    }
    
  } catch (error) {
    console.error('加载红包信息失败:', error)
    appStore.showToast('加载红包信息失败', 'error')
  }
}

const openRedPacket = async () => {
  if (!canOpen.value) return
  
  try {
    // 调用领取红包API
    console.log('领取红包:', route.params.redpacketId)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟领取结果
    const amount = Math.random() * 20 + 5 // 5-25元随机金额
    claimedAmount.value = amount
    
    // 显示开启动画
    showOpenAnimation.value = true
    
    setTimeout(() => {
      showOpenAnimation.value = false
      isOpened.value = true
      
      // 更新红包信息
      redpacketInfo.value.remainingAmount -= amount
      redpacketInfo.value.remainingCount -= 1
      redpacketInfo.value.isClaimedByMe = true
      
      // 添加到领取记录
      claimRecords.value.unshift({
        id: Date.now(),
        userName: '我',
        userAvatar: '/my-avatar.jpg',
        amount: amount,
        claimedAt: new Date(),
        isLuckiest: false
      })
      
      appStore.showToast('红包领取成功！', 'success')
    }, 2000)
    
  } catch (error) {
    console.error('领取红包失败:', error)
    appStore.showToast('领取红包失败，请重试', 'error')
  }
}

const getStatusIcon = () => {
  switch (redpacketInfo.value.status) {
    case 'finished':
      return 'heroicons:check-circle'
    case 'expired':
      return 'heroicons:clock'
    default:
      return 'heroicons:x-circle'
  }
}

const getStatusText = () => {
  if (redpacketInfo.value.isClaimedByMe) {
    return '你已经领取过了'
  }
  
  switch (redpacketInfo.value.status) {
    case 'finished':
      return '红包已被抢完'
    case 'expired':
      return '红包已过期'
    default:
      return '红包不可用'
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.redpacket-detail-page {
  height: 100vh;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 20px;
}

.redpacket-main {
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.redpacket-main.opened {
  background: rgba(255,255,255,0.2);
}

.redpacket-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.sender-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-info h3 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 18px;
}

.sender-info p {
  color: rgba(255,255,255,0.9);
  margin: 0;
  font-size: 14px;
}

.redpacket-body {
  text-align: center;
  color: white;
}

.unopened-state {
  padding: 20px 0;
}

.redpacket-icon {
  margin-bottom: 16px;
}

.open-text {
  margin-bottom: 24px;
}

.open-text span {
  display: block;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.open-text small {
  font-size: 14px;
  opacity: 0.8;
}

.open-btn {
  background: #ffd700;
  color: #333;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.open-btn:hover {
  background: #ffed4e;
  transform: translateY(-2px);
}

.opened-state {
  padding: 20px 0;
}

.amount-display {
  margin-bottom: 16px;
}

.currency {
  font-size: 24px;
  margin-right: 4px;
}

.amount {
  font-size: 48px;
  font-weight: bold;
}

.success-text span {
  display: block;
  font-size: 18px;
  margin-bottom: 4px;
}

.success-text small {
  font-size: 14px;
  opacity: 0.8;
}

.unavailable-state {
  padding: 20px 0;
}

.status-icon {
  margin-bottom: 16px;
}

.status-text span {
  font-size: 16px;
  opacity: 0.8;
}

.redpacket-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.claim-records {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.records-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.records-header span {
  font-size: 14px;
  color: #666;
}

.records-list {
  max-height: 300px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.record-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.record-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-amount {
  text-align: right;
}

.record-amount span {
  font-size: 16px;
  font-weight: bold;
  color: #ff4757;
}

.lucky-tag {
  display: block;
  font-size: 10px;
  color: #ffd700;
  margin-top: 2px;
}

.empty-records {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-records span {
  display: block;
  margin-top: 12px;
  font-size: 14px;
}

/* 开启动画 */
.open-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animation-content {
  text-align: center;
  color: white;
}

.coin-animation {
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: 20px;
}

.amount-animation {
  font-size: 32px;
  font-weight: bold;
  animation: fadeInUp 0.5s ease-out 0.5s both;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<template>
  <div v-if="show" class="redpacket-cover-overlay" @click="handleClose">
    <div class="redpacket-cover" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="handleClose">
        <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
      </button>

      <!-- 红包顶部装饰 -->
      <div class="cover-header">
        <div class="sender-avatar">
          <img :src="senderAvatar" :alt="senderName" />
        </div>
        <div class="sender-name">{{ senderName }}的红包</div>
        <div class="blessing-text">{{ blessing }}</div>
      </div>

      <!-- 红包金额 -->
      <div class="cover-amount">
        <div class="amount-value">{{ amount }}</div>
        <div class="amount-unit">元</div>
      </div>

      <!-- 开红包按钮或查看详情按钮 -->
      <button v-if="!isOwnRedPacket" class="open-btn" @click="handleOpen" :disabled="isOpening">
        {{ isOpening ? '开启中...' : '开' }}
      </button>
      <button v-else class="view-btn" @click="handleViewDetail">
        查看红包详情
      </button>

      <!-- 底部提示 -->
      <div class="cover-footer">
        {{ isOwnRedPacket ? '自己发的红包不能领取' : '恭喜发财，大吉大利' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  show: boolean
  data: {
    blessing: string
    amount: number
    type: string
    senderName?: string
    senderAvatar?: string
    senderId?: number | string
    isOwn?: boolean
    isClaimed?: boolean
    messageId?: string
    totalAmount?: number
    count?: number
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open'): void
  (e: 'view-detail'): void
}>()

const router = useRouter()
const isOpening = ref(false)

const senderName = computed(() => props.data.senderName || '好友')
const senderAvatar = computed(() => props.data.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
const blessing = computed(() => props.data.blessing || '恭喜发财，大吉大利')
const amount = computed(() => props.data.amount?.toFixed(2) || '0.00')
const isOwnRedPacket = computed(() => props.data.isOwn || false)
const isClaimed = computed(() => props.data.isClaimed || false)

const handleClose = () => {
  emit('close')
}

const handleOpen = async () => {
  if (isOpening.value) return

  // 如果已领取，跳转到详情页
  if (isClaimed.value) {
    handleViewDetail()
    return
  }

  isOpening.value = true

  // 模拟开红包动画
  setTimeout(() => {
    isOpening.value = false
    emit('open')
  }, 500)
}

const handleViewDetail = () => {
  // 保存红包详情到localStorage（临时方案）
  if (props.data.messageId) {
    const redPacketKey = `redpacket_detail_${props.data.messageId}`

    // 尝试获取已存在的数据，保留领取记录
    let existingData = null
    try {
      const existing = localStorage.getItem(redPacketKey)
      if (existing) {
        existingData = JSON.parse(existing)
      }
    } catch (e) {
      console.error('解析已存在的红包数据失败:', e)
    }

    const redPacketData = {
      senderName: senderName.value,
      senderAvatar: senderAvatar.value,
      blessing: blessing.value,
      totalAmount: props.data.totalAmount || props.data.amount,
      count: props.data.count || 1,
      sendTime: existingData?.sendTime || Date.now(),
      claimRecords: existingData?.claimRecords || [] // 保留已有的领取记录
    }
    localStorage.setItem(redPacketKey, JSON.stringify(redPacketData))

    // 跳转到详情页
    router.push({
      path: '/redpacket-detail',
      query: { id: props.data.messageId }
    })

    emit('close')
  } else {
    emit('view-detail')
  }
}
</script>

<style scoped>
.redpacket-cover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.redpacket-cover {
  position: relative;
  width: 320px;
  background: linear-gradient(180deg, #FF6B6B 0%, #FF8E53 100%);
  border-radius: 16px;
  padding: 40px 24px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.cover-header {
  text-align: center;
  margin-bottom: 32px;
}

.sender-avatar {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-name {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.blessing-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.cover-amount {
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.amount-value {
  color: white;
  font-size: 56px;
  font-weight: bold;
  line-height: 1;
}

.amount-unit {
  color: white;
  font-size: 20px;
  font-weight: 500;
}

.open-btn {
  width: 100%;
  height: 48px;
  background: white;
  color: #FF6B6B;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 16px;
}

.open-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.open-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view-btn {
  width: 100%;
  height: 48px;
  background: white;
  color: #FF6B6B;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 16px;
}

.view-btn:active {
  transform: scale(0.95);
}

.cover-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}
</style>


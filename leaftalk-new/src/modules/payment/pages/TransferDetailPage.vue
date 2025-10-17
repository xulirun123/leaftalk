<template>
  <div class="transfer-detail-page">
    <!-- 内容区域 -->
    <div class="content">
      <!-- 时钟图标（仅待收款状态显示） -->
      <div v-if="transferStatus === 'pending'" class="clock-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="35" stroke="#07C160" stroke-width="3" fill="white"/>
          <circle cx="40" cy="40" r="3" fill="#07C160"/>
          <line x1="40" y1="40" x2="40" y2="20" stroke="#07C160" stroke-width="3" stroke-linecap="round"/>
          <line x1="40" y1="40" x2="55" y2="40" stroke="#07C160" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- 状态文字 -->
      <div class="status-text">
        <span v-if="transferStatus === 'pending'">待{{ recipientName }}收款</span>
        <span v-else-if="transferStatus === 'received'">{{ recipientName }}领取了你的转账</span>
        <span v-else-if="transferStatus === 'refunded'">已退回</span>
      </div>

      <!-- 转账金额 -->
      <div class="transfer-amount">¥{{ amount.toFixed(2) }}</div>

      <!-- 说明文字（仅待收款状态显示） -->
      <div v-if="transferStatus === 'pending'" class="notice-text">1天内对方未收款，将退还给你</div>

      <!-- 转账说明和时间 -->
      <div class="transfer-info">
        <div v-if="note" class="info-item">
          <span class="info-label">转账说明</span>
          <span class="info-value">{{ note }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">转账时间</span>
          <span class="info-value">{{ formatTime(timestamp) }}</span>
        </div>
        <div v-if="transferStatus === 'received' && receiveTime" class="info-item">
          <span class="info-label">收款时间</span>
          <span class="info-value">{{ formatTime(receiveTime) }}</span>
        </div>
        <div v-if="transferStatus === 'refunded' && refundTime" class="info-item">
          <span class="info-label">退款时间</span>
          <span class="info-value">{{ formatTime(refundTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 转账信息
const amount = ref(0)
const note = ref('')
const recipientName = ref('')
const timestamp = ref(Date.now())
const messageId = ref('')

// 转账状态相关
const transferStatus = ref<'pending' | 'received' | 'refunded'>('pending')
const receiveTime = ref<number | null>(null)
const refundTime = ref<number | null>(null)

// 定时器
let statusCheckTimer: number | null = null

// 格式化时间
const formatTime = (time: number) => {
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 检查转账状态
const checkTransferStatus = () => {
  if (!messageId.value) return

  // 检查是否已收款
  const receivedKey = `transfer_received_${messageId.value}`
  const receivedData = localStorage.getItem(receivedKey)

  if (receivedData === 'true') {
    transferStatus.value = 'received'
    // 尝试获取收款时间
    const receiveTimeKey = `transfer_receive_time_${messageId.value}`
    const savedReceiveTime = localStorage.getItem(receiveTimeKey)
    if (savedReceiveTime) {
      receiveTime.value = parseInt(savedReceiveTime)
    }
    return
  }

  // 检查是否已超过24小时（自动退款）
  const now = Date.now()
  const elapsed = now - timestamp.value
  const oneDayInMs = 24 * 60 * 60 * 1000

  if (elapsed >= oneDayInMs) {
    transferStatus.value = 'refunded'
    refundTime.value = timestamp.value + oneDayInMs

    // 保存退款状态
    const refundKey = `transfer_refunded_${messageId.value}`
    localStorage.setItem(refundKey, 'true')
    localStorage.setItem(`transfer_refund_time_${messageId.value}`, refundTime.value.toString())
  }
}

// 监听转账收款事件
const handleTransferReceived = (event: CustomEvent) => {
  console.log('💰 转账详情页收到收款事件:', event.detail)

  if (event.detail.messageId === messageId.value) {
    console.log('✅ 当前转账已被收款，更新状态')
    transferStatus.value = 'received'
    receiveTime.value = Date.now()

    // 保存收款时间
    const receiveTimeKey = `transfer_receive_time_${messageId.value}`
    localStorage.setItem(receiveTimeKey, receiveTime.value.toString())
  }
}

// 初始化
onMounted(() => {
  console.log('💰 转账详情页初始化 - 路由参数:', route.query)

  // 从路由参数获取转账信息
  if (route.query.amount) {
    amount.value = parseFloat(route.query.amount as string)
  }
  if (route.query.note) {
    note.value = route.query.note as string
  }
  if (route.query.recipientName) {
    recipientName.value = route.query.recipientName as string
  }
  if (route.query.timestamp) {
    timestamp.value = parseInt(route.query.timestamp as string)
  }
  if (route.query.messageId) {
    messageId.value = route.query.messageId as string
  }

  console.log('💰 转账详情信息:', {
    amount: amount.value,
    note: note.value,
    recipientName: recipientName.value,
    timestamp: timestamp.value,
    messageId: messageId.value
  })

  // 检查初始状态
  checkTransferStatus()

  // 监听转账收款事件
  window.addEventListener('transfer-received', handleTransferReceived as EventListener)

  // 定时检查状态（每秒检查一次）
  statusCheckTimer = window.setInterval(() => {
    checkTransferStatus()
  }, 1000)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('transfer-received', handleTransferReceived as EventListener)

  // 清除定时器
  if (statusCheckTimer !== null) {
    clearInterval(statusCheckTimer)
  }
})
</script>

<style scoped>
.transfer-detail-page {
  min-height: 100vh;
  background-color: #EDEDED;
  display: flex;
  flex-direction: column;
}

/* 内容区域 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: white;
  margin: 8px;
  border-radius: 8px;
}

/* 时钟图标 */
.clock-icon {
  margin-bottom: 24px;
}

/* 状态文字 */
.status-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 500;
}

/* 转账金额 */
.transfer-amount {
  font-size: 48px;
  font-weight: 600;
  color: #000;
  margin-bottom: 24px;
}

/* 说明文字 */
.notice-text {
  font-size: 12px;
  color: #999;
  margin-bottom: 40px;
  text-align: center;
  line-height: 1.5;
}

/* 转账信息 */
.transfer-info {
  width: 100%;
  max-width: 400px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  margin-bottom: 2px;
  padding: 0;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 13px;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}
</style>


<template>
  <div class="received-notice-card">
    <img :src="receiverAvatar" class="receiver-avatar" alt="领取人头像" />
    <div class="notice-content">
      <div class="notice-text">{{ receiverName }} 领取了你的{{ type === 'transfer' ? '转账' : '红包' }}</div>
      <div class="notice-time">{{ formatTime(timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'transfer' | 'redpacket'
  receiverName: string
  receiverAvatar: string
  timestamp: number
}

const props = defineProps<Props>()

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 其他年份
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.received-notice-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #F7F7F7;
  border-radius: 4px;
  max-width: calc(100vw - 130px);
}

.receiver-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover;
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 12px;
  color: #999;
}
</style>


<template>
  <div class="friend-request-card">
    <div class="request-avatar">
      <img 
        :src="request.avatar || defaultAvatar" 
        :alt="request.name"
        class="avatar-image"
        @error="handleImageError"
      />
    </div>
    
    <div class="request-info">
      <div class="request-name">{{ request.name }}</div>
      <div class="request-message">{{ request.message || '请求添加您为好友' }}</div>
      <div class="request-time">{{ formatTime(request.createdAt) }}</div>
    </div>
    
    <div class="request-actions">
      <button 
        v-if="!request.isProcessed"
        @click="handleAccept"
        class="action-button accept-button"
        :disabled="processing"
      >
        {{ processing ? '处理中...' : '接受' }}
      </button>
      <button 
        v-if="!request.isProcessed"
        @click="handleReject"
        class="action-button reject-button"
        :disabled="processing"
      >
        拒绝
      </button>
      <div v-else class="processed-status">
        {{ request.status === 'accepted' ? '已接受' : '已拒绝' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FriendRequest {
  id: string
  name: string
  avatar?: string
  message?: string
  createdAt: string
  isProcessed?: boolean
  status?: 'accepted' | 'rejected'
}

interface Props {
  request: FriendRequest
}

const props = defineProps<Props>()

const emit = defineEmits<{
  accept: [request: FriendRequest]
  reject: [request: FriendRequest]
}>()

const defaultAvatar = '/images/default-avatar.png'
const processing = ref(false)

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultAvatar
}

const handleAccept = async () => {
  processing.value = true
  try {
    emit('accept', props.request)
  } finally {
    processing.value = false
  }
}

const handleReject = async () => {
  processing.value = true
  try {
    emit('reject', props.request)
  } finally {
    processing.value = false
  }
}

const formatTime = (timeString: string) => {
  const time = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return time.toLocaleDateString()
}
</script>

<style scoped>
.friend-request-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.request-avatar {
  margin-right: 12px;
}

.avatar-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.request-info {
  flex: 1;
  min-width: 0;
}

.request-name {
  font-size: 16px;
  font-weight: 500;
  color: #191919;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-message {
  font-size: 14px;
  color: #666666;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-time {
  font-size: 12px;
  color: #999999;
}

.request-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 60px;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accept-button {
  background-color: #07C160;
  color: white;
}

.accept-button:hover:not(:disabled) {
  background-color: #059649;
}

.reject-button {
  background-color: #f5f5f5;
  color: #666666;
}

.reject-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.processed-status {
  font-size: 14px;
  color: #999999;
  padding: 8px 16px;
}
</style>

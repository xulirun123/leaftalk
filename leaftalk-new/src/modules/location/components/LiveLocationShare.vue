<template>
  <div class="live-location-overlay" v-if="isSharing">
    <div class="live-location-panel">
      <div class="panel-header">
        <h3>实时位置共享</h3>
        <button class="close-btn" @click="stopSharing">
          <iconify-icon icon="heroicons:x-mark" width="20" />
        </button>
      </div>
      
      <div class="sharing-info">
        <div class="status-indicator">
          <div class="pulse-dot"></div>
          <span>正在共享位置</span>
        </div>
        
        <div class="duration">
          已共享 {{ formatDuration(sharingDuration) }}
        </div>
        
        <div class="participants">
          <div class="participant-item" v-for="user in participants" :key="user.id">
            <img :src="user.avatar" :alt="user.name" class="participant-avatar" />
            <span class="participant-name">{{ user.name }}</span>
            <span class="participant-status" :class="user.status">
              {{ user.status === 'online' ? '在线' : '离线' }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="panel-actions">
        <button class="action-btn secondary" @click="stopSharing">
          停止共享
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Participant {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline'
  lastUpdate?: number
}

interface Props {
  chatId: string
  participants: Participant[]
}

const props = defineProps<Props>()

interface Emits {
  (e: 'stop-sharing'): void
  (e: 'location-update', location: { lat: number; lng: number; timestamp: number }): void
}

const emit = defineEmits<Emits>()

const isSharing = ref(false)
const sharingDuration = ref(0)
let sharingTimer: NodeJS.Timeout | null = null
let locationWatcher: number | null = null

// 开始实时位置共享
const startSharing = () => {
  isSharing.value = true
  sharingDuration.value = 0
  
  // 启动定时器
  sharingTimer = setInterval(() => {
    sharingDuration.value += 1
  }, 1000)
  
  // 启动位置监听
  if (navigator.geolocation) {
    locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        emit('location-update', {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now()
        })
      },
      (error) => {
        console.error('位置获取失败:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )
  }
}

// 停止实时位置共享
const stopSharing = () => {
  isSharing.value = false
  
  if (sharingTimer) {
    clearInterval(sharingTimer)
    sharingTimer = null
  }
  
  if (locationWatcher !== null) {
    navigator.geolocation.clearWatch(locationWatcher)
    locationWatcher = null
  }
  
  emit('stop-sharing')
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

onMounted(() => {
  // 可以在这里自动开始共享
})

onUnmounted(() => {
  stopSharing()
})

defineExpose({
  startSharing,
  stopSharing,
  isSharing
})
</script>

<style scoped>
.live-location-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}

.live-location-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
}

.sharing-info {
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #07C160;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.duration {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.participants {
  border-top: 1px solid #e5e5e5;
  padding-top: 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.participant-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.participant-status.online {
  background: #e8f5e8;
  color: #07C160;
}

.participant-status.offline {
  background: #f5f5f5;
  color: #999;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e5e5e5;
}
</style>

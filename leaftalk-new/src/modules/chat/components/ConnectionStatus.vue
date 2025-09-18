<template>
  <div class="connection-status-wrapper">
    <!-- 连接状态指示器 -->
    <div v-if="showStatus" class="connection-status" :class="statusClass" @click="toggleDetails">
      <span class="status-dot"></span>
      <span class="status-text">{{ statusText }}</span>
      <span class="status-icon">{{ showDetails ? '▼' : '▶' }}</span>
    </div>

    <!-- 详细信息面板 -->
    <div v-if="showDetails" class="status-details">
      <div class="detail-item">
        <span class="label">连接状态:</span>
        <span class="value" :class="statusClass">{{ statusText }}</span>
      </div>
      <div class="detail-item">
        <span class="label">服务器:</span>
        <span class="value">{{ serverUrl }}</span>
      </div>
      <div class="detail-item">
        <span class="label">重连次数:</span>
        <span class="value">{{ reconnectCount }}</span>
      </div>
      <div class="detail-item">
        <span class="label">在线时长:</span>
        <span class="value">{{ onlineTime }}</span>
      </div>
      
      <div class="action-buttons">
        <button @click="reconnect" :disabled="isConnecting" class="btn-reconnect">
          {{ isConnecting ? '连接中...' : '重新连接' }}
        </button>
        <button @click="toggleOfflineMode" class="btn-offline">
          {{ isOfflineMode ? '启用在线模式' : '启用离线模式' }}
        </button>
      </div>
    </div>

    <!-- 离线模式提示 -->
    <div v-if="isOfflineMode && showOfflineNotice" class="offline-notice">
      <div class="notice-content">
        <span class="notice-icon">📱</span>
        <span class="notice-text">当前为离线模式，消息仅保存在本地</span>
        <button @click="hideOfflineNotice" class="notice-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  showStatus?: boolean
  isConnected?: boolean
  isConnecting?: boolean
  reconnectCount?: number
  serverUrl?: string
  onReconnect?: () => void
  onToggleOfflineMode?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  showStatus: true,
  isConnected: false,
  isConnecting: false,
  reconnectCount: 0,
  serverUrl: 'ws://localhost:8893',
  onReconnect: () => {},
  onToggleOfflineMode: () => {}
})

// 状态
const showDetails = ref(false)
const isOfflineMode = ref(false)
const showOfflineNotice = ref(true)
const connectTime = ref<number | null>(null)
const onlineTimeInterval = ref<NodeJS.Timeout | null>(null)

// 计算属性
const statusClass = computed(() => ({
  'status-connected': props.isConnected,
  'status-connecting': props.isConnecting,
  'status-disconnected': !props.isConnected && !props.isConnecting,
  'status-offline': isOfflineMode.value
}))

const statusText = computed(() => {
  if (isOfflineMode.value) return '离线模式'
  if (props.isConnected) return '已连接'
  if (props.isConnecting) return '连接中...'
  return '未连接'
})

const onlineTime = computed(() => {
  if (!props.isConnected || !connectTime.value) return '0秒'
  
  const duration = Date.now() - connectTime.value
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
})

// 方法
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const reconnect = () => {
  if (props.onReconnect) {
    props.onReconnect()
  }
}

const toggleOfflineMode = () => {
  isOfflineMode.value = !isOfflineMode.value
  if (props.onToggleOfflineMode) {
    props.onToggleOfflineMode()
  }
}

const hideOfflineNotice = () => {
  showOfflineNotice.value = false
}

// 监听连接状态变化
const startOnlineTimer = () => {
  if (props.isConnected && !connectTime.value) {
    connectTime.value = Date.now()
    
    // 每秒更新在线时长
    onlineTimeInterval.value = setInterval(() => {
      // 触发响应式更新
    }, 1000)
  }
}

const stopOnlineTimer = () => {
  connectTime.value = null
  if (onlineTimeInterval.value) {
    clearInterval(onlineTimeInterval.value)
    onlineTimeInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  if (props.isConnected) {
    startOnlineTimer()
  }
})

onUnmounted(() => {
  stopOnlineTimer()
})

// 监听连接状态变化
const prevConnected = ref(props.isConnected)
const checkConnectionChange = () => {
  if (props.isConnected && !prevConnected.value) {
    startOnlineTimer()
  } else if (!props.isConnected && prevConnected.value) {
    stopOnlineTimer()
  }
  prevConnected.value = props.isConnected
}

// 定期检查连接状态变化
setInterval(checkConnectionChange, 1000)
</script>

<style scoped>
.connection-status-wrapper {
  position: relative;
  z-index: 1000;
}

.connection-status {
  position: fixed;
  top: 30px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.status-connected {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
  border: 1px solid rgba(7, 193, 96, 0.3);
}

.status-connecting {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-disconnected {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.status-offline {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.status-connecting .status-dot {
  animation: blink 1s infinite;
}

.status-text {
  white-space: nowrap;
}

.status-icon {
  font-size: 10px;
  transition: transform 0.3s ease;
}

.status-details {
  position: fixed;
  top: 70px;
  right: 20px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  border: 1px solid #e9ecef;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.action-buttons {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-reconnect,
.btn-offline {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reconnect {
  background: #007bff;
  color: white;
}

.btn-reconnect:hover:not(:disabled) {
  background: #0056b3;
}

.btn-reconnect:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-offline {
  background: #6c757d;
  color: white;
}

.btn-offline:hover {
  background: #545b62;
}

.offline-notice {
  position: fixed;
  bottom: 100px;
  left: 20px;
  right: 20px;
  z-index: 999;
}

.notice-content {
  background: rgba(108, 117, 125, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
}

.notice-icon {
  font-size: 16px;
}

.notice-text {
  flex: 1;
  font-size: 14px;
}

.notice-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.notice-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}
</style>

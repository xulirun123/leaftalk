<template>
  <div
    v-if="isVisible"
    ref="floatingWindow"
    class="floating-call-window"
    :class="{ 
      'is-dragging': isDragging,
      'is-video': callType === 'video',
      'is-voice': callType === 'voice'
    }"
    :style="windowStyle"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- 视频流显示 -->
    <div v-if="callType === 'video'" class="video-container">
      <video
        ref="videoRef"
        class="floating-video"
        autoplay
        playsinline
        muted
      />
      
      <!-- 视频覆盖层 -->
      <div class="video-overlay">
        <div class="call-info">
          <span class="contact-name">{{ contactName }}</span>
          <span class="call-duration">{{ formatDuration(duration) }}</span>
        </div>
      </div>
    </div>

    <!-- 语音通话显示 -->
    <div v-else class="voice-container">
      <div class="avatar-container">
        <img :src="contactAvatar" :alt="contactName" class="contact-avatar" />
        <div class="avatar-ring" :class="{ active: isConnected }"></div>
      </div>
      
      <div class="voice-info">
        <div class="contact-name">{{ contactName }}</div>
        <div class="call-duration">{{ formatDuration(duration) }}</div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="floating-controls">
      <button
        @click.stop="toggleMute"
        :class="['control-btn', { active: isMuted }]"
        :title="isMuted ? '取消静音' : '静音'"
      >
        <iconify-icon :icon="isMuted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" width="16" />
      </button>

      <button
        v-if="callType === 'video'"
        @click.stop="toggleVideo"
        :class="['control-btn', { active: !isVideoEnabled }]"
        :title="isVideoEnabled ? '关闭视频' : '开启视频'"
      >
        <iconify-icon :icon="isVideoEnabled ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" width="16" />
      </button>

      <button
        @click.stop="endCall"
        class="control-btn end-call"
        title="挂断"
      >
        <iconify-icon icon="heroicons:phone-x-mark" width="16" />
      </button>

      <button
        @click.stop="restoreWindow"
        class="control-btn restore"
        title="恢复窗口"
      >
        <iconify-icon icon="heroicons:arrows-pointing-out" width="16" />
      </button>
    </div>

    <!-- 拖拽指示器 -->
    <div class="drag-indicator">
      <iconify-icon icon="heroicons:bars-3" width="12" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Props
interface Props {
  isVisible: boolean
  callType: 'video' | 'voice'
  contactName: string
  contactAvatar: string
  duration: number
  isConnected: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  localStream?: MediaStream | null
  remoteStream?: MediaStream | null
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: false,
  callType: 'voice',
  contactName: '未知联系人',
  contactAvatar: '',
  duration: 0,
  isConnected: false,
  isMuted: false,
  isVideoEnabled: true,
  localStream: null,
  remoteStream: null
})

// Emits
const emit = defineEmits<{
  toggleMute: []
  toggleVideo: []
  endCall: []
  restore: []
}>()

// 引用
const floatingWindow = ref<HTMLElement>()
const videoRef = ref<HTMLVideoElement>()

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 20, y: 100 })

// 窗口样式
const windowStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: isDragging.value ? 10000 : 9999
}))

/**
 * 组件挂载
 */
onMounted(() => {
  // 设置初始位置（右上角）
  setInitialPosition()
  
  // 设置视频流
  setupVideoStream()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize)
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
})

/**
 * 监听流变化
 */
watch(() => props.localStream, setupVideoStream)
watch(() => props.remoteStream, setupVideoStream)

/**
 * 设置初始位置
 */
function setInitialPosition(): void {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const floatingWidth = props.callType === 'video' ? 160 : 280
  const floatingHeight = props.callType === 'video' ? 120 : 100
  
  position.value = {
    x: windowWidth - floatingWidth - 20,
    y: 100
  }
}

/**
 * 设置视频流
 */
function setupVideoStream(): void {
  if (props.callType === 'video' && videoRef.value) {
    nextTick(() => {
      if (videoRef.value) {
        // 优先显示远程流，如果没有则显示本地流
        const stream = props.remoteStream || props.localStream
        if (stream) {
          videoRef.value.srcObject = stream
        }
      }
    })
  }
}

/**
 * 开始拖拽
 */
function startDrag(event: MouseEvent | TouchEvent): void {
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  isDragging.value = true
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

/**
 * 处理拖拽
 */
function handleDrag(event: MouseEvent | TouchEvent): void {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y
  
  // 限制在窗口范围内
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const floatingWidth = props.callType === 'video' ? 160 : 280
  const floatingHeight = props.callType === 'video' ? 120 : 100
  
  position.value = {
    x: Math.max(0, Math.min(newX, windowWidth - floatingWidth)),
    y: Math.max(0, Math.min(newY, windowHeight - floatingHeight))
  }
}

/**
 * 停止拖拽
 */
function stopDrag(): void {
  isDragging.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
  
  // 边缘吸附
  snapToEdge()
}

/**
 * 边缘吸附
 */
function snapToEdge(): void {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const floatingWidth = props.callType === 'video' ? 160 : 280
  const floatingHeight = props.callType === 'video' ? 120 : 100
  
  const centerX = position.value.x + floatingWidth / 2
  const centerY = position.value.y + floatingHeight / 2
  
  // 判断最近的边缘
  const distanceToLeft = centerX
  const distanceToRight = windowWidth - centerX
  const distanceToTop = centerY
  const distanceToBottom = windowHeight - centerY
  
  const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
  
  // 吸附到最近的边缘
  if (minDistance === distanceToLeft) {
    position.value.x = 10
  } else if (minDistance === distanceToRight) {
    position.value.x = windowWidth - floatingWidth - 10
  } else if (minDistance === distanceToTop) {
    position.value.y = 10
  } else {
    position.value.y = windowHeight - floatingHeight - 10
  }
}

/**
 * 处理窗口大小变化
 */
function handleWindowResize(): void {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const floatingWidth = props.callType === 'video' ? 160 : 280
  const floatingHeight = props.callType === 'video' ? 120 : 100
  
  // 确保浮窗在可见范围内
  position.value = {
    x: Math.max(0, Math.min(position.value.x, windowWidth - floatingWidth)),
    y: Math.max(0, Math.min(position.value.y, windowHeight - floatingHeight))
  }
}

/**
 * 格式化通话时长
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 控制功能
 */
function toggleMute(): void {
  emit('toggleMute')
}

function toggleVideo(): void {
  emit('toggleVideo')
}

function endCall(): void {
  emit('endCall')
}

function restoreWindow(): void {
  emit('restore')
}
</script>

<style scoped>
.floating-call-window {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  overflow: hidden;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.floating-call-window.is-video {
  width: 160px;
  height: 120px;
}

.floating-call-window.is-voice {
  width: 280px;
  height: 100px;
}

.floating-call-window.is-dragging {
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: flex-end;
  padding: 8px;
}

.voice-container {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  height: 100%;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  object-fit: cover;
}

.avatar-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.avatar-ring.active {
  border-color: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.voice-info {
  flex: 1;
  min-width: 0;
}

.call-info {
  flex: 1;
}

.contact-name {
  color: white;
  font-size: 12px;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.call-duration {
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  display: block;
}

.floating-controls {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-btn.active {
  background: #ef4444;
}

.control-btn.end-call {
  background: #ef4444;
}

.control-btn.end-call:hover {
  background: #dc2626;
}

.control-btn.restore {
  background: #3b82f6;
}

.control-btn.restore:hover {
  background: #2563eb;
}

.drag-indicator {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .floating-call-window.is-voice {
    width: 240px;
    height: 80px;
  }
  
  .voice-container {
    padding: 8px;
    gap: 8px;
  }
  
  .contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
  
  .contact-name {
    font-size: 11px;
  }
  
  .call-duration {
    font-size: 9px;
  }
}
</style>

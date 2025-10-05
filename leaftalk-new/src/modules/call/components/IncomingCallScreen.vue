<template>
  <div class="incoming-call-screen">

    <!-- 顶部系统状态栏（时间 + 图标） -->
    <div class="system-status-bar">
      <div class="time">{{ currentTime }}</div>
      <div class="icons">
        <!-- 蜂窝信号 -->
        <svg viewBox="0 0 24 24" class="icon" fill="currentColor" aria-label="cellular">
          <rect x="3" y="14" width="3" height="7" rx="1"/>
          <rect x="8" y="11" width="3" height="10" rx="1"/>
          <rect x="13" y="8" width="3" height="13" rx="1"/>
          <rect x="18" y="5" width="3" height="16" rx="1"/>
        </svg>
        <!-- WiFi -->
        <svg viewBox="0 0 24 24" class="icon" fill="currentColor" aria-label="wifi">
          <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2.1 9.3A17 17 0 0 1 12 6c3.6 0 6.9 1.1 9.9 3.3l-1.4 1.8A14.8 14.8 0 0 0 12 8c-3.1 0-6 .9-8.5 2.8L2.1 9.3z"/>
          <path d="M5 12.5A12 12 0 0 1 12 10c2.6 0 5 .8 7 2.5l-1.5 1.8A9.8 9.8 0 0 0 12 12c-2.2 0-4.3.6-6.1 1.9L5 12.5z"/>
          <path d="M8.3 15.3c1.1-.7 2.4-1.1 3.7-1.1s2.6.4 3.7 1.1l-1.5 1.9c-.7-.4-1.4-.6-2.2-.6s-1.5.2-2.2.6l-1.5-1.9z"/>
        </svg>
        <!-- 电池 -->
        <svg viewBox="0 0 28 24" class="icon" fill="currentColor" aria-label="battery">
          <rect x="1" y="6" width="22" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="3" y="8" width="14" height="8" rx="1" ry="1" />
          <rect x="24" y="9" width="3" height="6" rx="1" ry="1" />
        </svg>
      </div>
    </div>

    <!-- 顶部状态栏文案隐藏，避免“语音通话”字样干扰视觉 -->

    <!-- 用户信息区域（顶端 2/5 上移 100px，方形 70px，优先显示备注） -->
    <div class="user-info compact">
      <img :src="avatarUrl" :alt="displayName" class="avatar avatar-70" />
      <div class="user-text">
        <div class="user-name">{{ displayName }}</div>
      </div>
    </div>

    <!-- 底部控制区域 -->
    <div class="controls">
      <!-- 拒绝按钮 -->
      <button 
        class="control-btn reject-btn"
        @click="handleReject"
        :disabled="isProcessing"
      >
        <div class="btn-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
      </button>

      <!-- 接听按钮 -->
      <button 
        class="control-btn accept-btn"
        @click="handleAccept"
        :disabled="isProcessing"
      >
        <div class="btn-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isProcessing" class="processing-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { IncomingCallData } from '../types'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
import { contactsApi } from '../../contacts/services/contactsApi'

interface Props {
  callData: IncomingCallData
}

interface Emits {
  (e: 'accept', callData: IncomingCallData): void
  (e: 'reject', callData: IncomingCallData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const isProcessing = ref(false)

// 计算属性
const callerInfo = computed(() => props.callData.fromUserInfo)

// 兜底解析对方备注/昵称（本地缓存或联系人API）
const resolvedName = ref<string>('')
const resolveDisplayName = async () => {
  const id = String(props.callData.fromUserId || '')
  if (!id) return
  try {
    // 优先本地 friend_profile_cache
    const cache = JSON.parse(localStorage.getItem('friend_profile_cache') || '{}')
    const remark = cache?.[id]?.remark
    if (remark && String(remark).trim()) {
      resolvedName.value = remark
      return
    }
  } catch {}
  try {
    // 次之本地联系人列表缓存（yeyu_contacts）
    const raw = localStorage.getItem('yeyu_contacts')
    if (raw) {
      const list = JSON.parse(raw)
      const hit = Array.isArray(list) ? list.find((c: any) => String(c.id) === id) : null
      if (hit) {
        resolvedName.value = hit.remark || hit.remark_name || hit.nickname || hit.real_name || hit.username || hit.name || ''
        if (resolvedName.value) return
      }
    }
  } catch {}
  try {
    // 最后兜底：调用联系人API获取最新数据
    const resp = await contactsApi.getContacts()
    if (resp && resp.success && Array.isArray(resp.data)) {
      const hit = resp.data.find((c: any) => String(c.id) === id)
      if (hit) {
        const h: any = hit as any
        resolvedName.value = h.remark || h.remark_name || h.nickname || h.real_name || h.username || h.name || ''
        if (resolvedName.value) return
      }
    }
  } catch {}
  // 最后回退使用传入信息
  resolvedName.value = (callerInfo.value as any)?.remark || (callerInfo.value as any)?.nickname || (callerInfo.value as any)?.name || ''
}

const displayName = computed(() => {
  const id = String(props.callData.fromUserId || '')
  const local = resolvedName.value
  if (local && String(local).trim()) return local
  const anyInfo = callerInfo.value as any
  return anyInfo?.remark || anyInfo?.nickname || anyInfo?.name || `用户${id}`
})

const avatarUrl = computed(() => {
  const id = String(props.callData.fromUserId || '')
  return id ? getRealAvatarUrl(id) : (callerInfo.value.avatar || '')
})


// 方法
const handleAccept = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  try {
    emit('accept', props.callData)
  } catch (error) {
    console.error('接听通话失败:', error)
    isProcessing.value = false
  }
}

const handleReject = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  try {
    emit('reject', props.callData)
  } catch (error) {
    console.error('拒绝通话失败:', error)
    isProcessing.value = false
  }
}

// 生命周期
onMounted(() => {
  console.log('📞 来电界面已加载:', props.callData)
  resolveDisplayName()
})

onUnmounted(() => {
  console.log('📞 来电界面已卸载')
})
// 顶部时间（HH:mm）
const currentTime = ref('00:00')
let timeTimer: any
const formatTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
onMounted(() => {
  currentTime.value = formatTime(new Date())
  timeTimer = setInterval(() => { currentTime.value = formatTime(new Date()) }, 30000)
})
onUnmounted(() => { if (timeTimer) clearInterval(timeTimer) })
</script>

<style scoped>
.incoming-call-screen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  z-index: 2147483646; /* 置于最前，避免被其他容器遮挡 */
  /* 更自然的绿色系渐变，贴合品牌 #07C160 */
  background: linear-gradient(135deg, #0aa86e 0%, #078a5c 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}


.status-bar {
  position: relative;
  z-index: 1;
  padding: 60px 20px 20px;
  text-align: center;
}
/* 顶部系统状态栏样式 */
.system-status-bar{position:absolute;top:8px;left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;color:#fff;opacity:.95;z-index:3;pointer-events:none}
.system-status-bar .time{font-size:12px}
.system-status-bar .icons{display:flex;gap:10px;align-items:center}
.system-status-bar .icon{width:20px;height:20px}

.call-type {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
}

.user-info {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
/* 紧凑用户信息：位置在 40vh 上移 100px */
.user-info.compact{
  position:absolute;top:calc(40vh - 100px);left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:12px;z-index:1
}
.avatar.avatar-70{width:70px;height:70px;border-radius:0 !important;border:2px solid rgba(255,255,255,.35)}
.user-text .user-name{color:#fff;font-size:18px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,.3)}

.avatar-container {
  position: relative;
  margin-bottom: 30px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
/* 覆盖紧凑头像为方形 70 */
.avatar.avatar-70{width:70px;height:70px;border-radius:0 !important;border:2px solid rgba(255,255,255,.35)}

.avatar-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.user-details {
  text-align: center;
}

.user-name {
  color: white;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.call-status {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 400;
}

.controls {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 24px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-btn:not(:disabled):active {
  transform: scale(0.95);
}

.reject-btn {
  background: #ff4757;
}

.reject-btn:not(:disabled):hover {
  background: #ff3742;
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.accept-btn {
  background: #2ed573;
}

.accept-btn:not(:disabled):hover {
  background: #26d065;
  box-shadow: 0 6px 20px rgba(46, 213, 115, 0.4);
}

.btn-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.btn-icon svg {
  width: 100%;
  height: 100%;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .controls {
    padding: 30px 40px 50px;
  }
  
  .control-btn {
    width: 60px;
    height: 60px;
  }
  
  .btn-icon {
    width: 28px;
    height: 28px;
  }
  
  .avatar {
    width: 100px;
    height: 100px;
  }
  
  .user-name {
    font-size: 20px;
  }
}
</style>

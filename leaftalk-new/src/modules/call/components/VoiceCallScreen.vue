<template>
  <el-container class="voice-call-screen" :class="{ mini: isMini }" @click="isMini ? restoreFromMini() : undefined">

    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <!-- 左上：浮窗切换按钮（双框重叠） -->
      <button class="float-switch" @click.stop="toggleFloat">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h-2V7H5v8h2v2H5a2 2 0 0 1-2-2V7z"/>
          <path d="M10 12a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7zm2 0v7h7v-7h-7z"/>
        </svg>
      </button>

      <!-- 中间：通话时长（仅接通后显示） -->
      <div v-if="isConnected" class="top-center-duration">{{ formattedDuration }}</div>

      <!-- 右侧：邀请好友 + 号按钮（仅接通后显示） -->
      <button v-if="isConnected" class="invite-btn" @click.stop="inviteFriend">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 用户信息区域 -->
    <div class="user-info compact">
      <img :src="avatarUrl" :alt="displayName" class="avatar avatar-70" />
      <div class="user-text">
        <div class="user-name">{{ displayName }}</div>
      </div>
    </div>

    <!-- 底部控制区域 -->
    <el-footer class="bottom-controls" height="120px">
      <div class="control-buttons">
        <!-- 静音按钮 -->
        <button class="control-btn" :class="isMicOn ? 'on' : 'off'" @click="toggleAudio">
          <div class="btn-icon">
            <svg v-if="isMicOn" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
          </div>
          <div class="btn-label">{{ isMicOn ? '麦克风开' : '麦克风关' }}</div>
        </button>

        <!-- 取消（红色底） -->
        <button class="control-btn end-call-btn" @click="endCall">
          <div class="btn-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </div>
          <div class="btn-label">取消</div>
        </button>

        <!-- 扬声器开关 -->
        <button class="control-btn" :class="isSpeakerOn ? 'on' : 'off'" @click="toggleSpeaker">
          <div class="btn-icon">
            <svg v-if="isSpeakerOn" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm7 .17L7.83 11H5v2h2.83L10 14.83V9.17zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3z"/>
            </svg>
          </div>
          <div class="btn-label">{{ isSpeakerOn ? '扬声器开' : '扬声器关' }}contacts:174  初始化通话失败: Error: 无效的通话参数
    at initializeCall (CallPage.vue:402:13)
console.error @ contacts:174
console.error @ main.ts:157
console.error @ main.ts:157
initializeCall @ CallPage.vue:408
await in initializeCall
(匿名) @ CallPage.vue:519
(匿名) @ runtime-core.esm-bundler.js:2879
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
hook.__weh.hook.__weh @ runtime-core.esm-bundler.js:2859
flushPostFlushCbs @ runtime-core.esm-bundler.js:385
flushJobs @ runtime-core.esm-bundler.js:427
Promise.then
queueFlush @ runtime-core.esm-bundler.js:322
queuePostFlushCb @ runtime-core.esm-bundler.js:336
queueEffectWithSuspense @ runtime-core.esm-bundler.js:7411
baseWatchOptions.scheduler @ runtime-core.esm-bundler.js:6286
effect2.scheduler @ reactivity.esm-bundler.js:1853
trigger @ reactivity.esm-bundler.js:265
endBatch @ reactivity.esm-bundler.js:323
notify @ reactivity.esm-bundler.js:614
trigger @ reactivity.esm-bundler.js:588
set value @ reactivity.esm-bundler.js:1471
finalizeNavigation @ vue-router.mjs:3503
(匿名) @ vue-router.mjs:3368
Promise.then
pushWithRedirect @ vue-router.mjs:3335
(匿名) @ vue-router.mjs:3547
Promise.catch
(匿名) @ vue-router.mjs:3533
(匿名) @ vue-router.mjs:599
popStateHandler @ vue-router.mjs:598
contacts:174  初始化通话失败: Error: 无效的通话参数
    at initializeCall (CallPage.vue:402:13)</div>
        </button>
      </div>
    </el-footer>

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

  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { CallConfig, NetworkQuality } from '../types'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'

interface Props {
  callConfig: CallConfig
  networkQuality: NetworkQuality
  callDuration: number
  isAudioMuted: boolean
  callStatus: string


}

interface Emits {
  (e: 'toggle-audio'): void
  (e: 'toggle-speaker'): void
  (e: 'end-call'): void
  (e: 'toggle-floating'): void
  (e: 'invite-friend'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const isSpeakerOn = ref(false)
const isMini = ref(false)
const defaultAvatar = '/src/assets/images/default-avatar.png'

// 计算属性
const contactInfo = computed(() => props.callConfig.targetUserInfo)

const isMicOn = computed(() => !props.isAudioMuted)
const isConnected = computed(() => props.callStatus === 'connected')
// 接通后默认开启扬声器
watch(isConnected, (v, prev) => {
  if (v && !prev && !isSpeakerOn.value) {
    isSpeakerOn.value = true
    emit('toggle-speaker')
  }
})

// 解析显示名称（备注优先，其次昵称、真实姓名、用户名等）
const resolvedName = ref<string>('')
const resolveDisplayName = () => {
  const anyInfo = contactInfo.value as any
  const id = String(anyInfo?.id || '')
  if (!id) { resolvedName.value = anyInfo?.remark || anyInfo?.nickname || anyInfo?.name || ''; return }
  try {
    const cache = JSON.parse(localStorage.getItem('friend_profile_cache') || '{}')
    const remark = cache?.[id]?.remark
    if (remark && String(remark).trim()) { resolvedName.value = remark; return }
  } catch {}
  try {
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
  resolvedName.value = anyInfo?.remark || anyInfo?.nickname || anyInfo?.real_name || anyInfo?.username || anyInfo?.name || ''
}

onMounted(() => { resolveDisplayName() })
watch(contactInfo, () => resolveDisplayName(), { deep: true })

const displayName = computed(() => {
  const anyInfo = contactInfo.value as any
  const id = String(anyInfo?.id || '')
  const local = resolvedName.value
  return (local && String(local).trim()) ? local : (anyInfo?.remark || anyInfo?.nickname || anyInfo?.real_name || anyInfo?.username || anyInfo?.name || (id ? `用户${id}` : '未知'))
})
const avatarUrl = computed(() => {
  const id = (contactInfo.value as any)?.id || ''
  const raw = (contactInfo.value as any)?.avatar || ''
  // 强制走真实头像API，符合“不能生成头像”规则
  return id ? getRealAvatarUrl(String(id)) : (raw || defaultAvatar)
})


// 方法
const toggleAudio = () => {
  emit('toggle-audio')
}

const toggleSpeaker = () => {
  isSpeakerOn.value = !isSpeakerOn.value
  emit('toggle-speaker')
}

const toggleFloat = () => {
  isMini.value = !isMini.value
  emit('toggle-floating')
}

const restoreFromMini = () => { isMini.value = false }

const endCall = () => {
  emit('end-call')
}

const inviteFriend = () => {
  emit('invite-friend')
}

// 顶部时间（HH:mm）
const currentTime = ref('00:00')
let timeTimer: any
const formatTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
onMounted(() => {
  currentTime.value = formatTime(new Date())
  timeTimer = setInterval(() => { currentTime.value = formatTime(new Date()) }, 30000)
})
onUnmounted(() => { if (timeTimer) clearInterval(timeTimer) })

// 顶部中间通话时长展示（mm:ss / hh:mm:ss）
const formattedDuration = computed(() => {
  const total = Math.max(0, Number(props.callDuration) || 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${String(h).padStart(2,'0')}:${mm}:${ss}` : `${mm}:${ss}`
})
</script>

<style scoped>
.voice-call-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 更自然的绿色系渐变，贴合品牌 #07C160 */
  background: linear-gradient(135deg, #0bbd87 0%, #0a946a 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 迷你浮窗模式 */
.voice-call-screen.mini {
  position: fixed; /* 确保相对视口定位 */
  width: 70px; height: 70px; right: 16px; top: 100px; left: auto; bottom: auto;
  border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
  pointer-events: auto; /* 父容器可能 pointer-events:none，需要显式开启可点 */
}
.voice-call-screen.mini .bottom-controls,
.voice-call-screen.mini .system-status-bar,
.voice-call-screen.mini .top-bar { display: none; }
.voice-call-screen.mini .user-info.compact { top: 0; left: 0; transform: none; }
.voice-call-screen.mini .avatar-70 { width: 70px; height: 70px; border-radius: 0 !important; border: 0; }

.top-bar {
  position: relative;
  z-index: 1;
  padding: 50px 20px 20px;
}

/* 左上角浮窗按钮 */
.float-switch {
  position: absolute;
  left: 16px;
  top: 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}
.float-switch svg { width: 20px; height: 20px; }

/* 顶部中间时长 */
.top-center-duration { position:absolute; top:36px; left:50%; transform: translateX(-50%); color:#fff; font-size:14px; opacity:.9; }

/* 顶部右侧邀请按钮 */
.invite-btn {
  position: absolute; right: 16px; top: 36px; width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.2); color:#fff; border:none; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(10px);
}
.invite-btn svg { width: 20px; height: 20px; }

/* 顶部状态文字 */
.call-status-top { font-size: 14px; opacity: 0.9; }

/* 2/5 处的紧凑用户信息 */
.user-info.compact {
  position: absolute;
  top: calc(40vh - 100px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1;
}
.avatar-70 { width: 70px; height: 70px; border-radius: 0; object-fit: cover; border: 2px solid rgba(255,255,255,0.35); }
.user-text .user-name { color: #fff; font-size: 18px; font-weight: 600; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }

/* 控制按钮状态：on 白底黑Icon；off 黑底白Icon；取消为红底 */
.control-btn.on .btn-icon { background: #fff; color: #000; }
.control-btn.off .btn-icon { background: #000; color: #fff; }
.end-call-btn .btn-icon { background: #ff3b30; color: #fff; }


.call-info {
  color: white;
}

.call-type {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  opacity: 0.9;
}


/* 顶部系统状态栏（时间 + 图标） */
.system-status-bar {
  position: absolute;
  top: 8px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  opacity: 0.95;
  z-index: 3;
  pointer-events: none;
}
.system-status-bar .time { font-size: 12px; letter-spacing: .3px; }
.system-status-bar .icons { display: flex; gap: 10px; align-items: center; }
.system-status-bar .icon { width: 20px; height: 20px; }

.call-duration {
  font-size: 14px;
  opacity: 0.8;
}

.network-indicator {
  display: flex;
  align-items: center;
}

.signal-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}

.bar {
  width: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.bar:nth-child(1) { height: 8px; }
.bar:nth-child(2) { height: 12px; }
.bar:nth-child(3) { height: 16px; }
.bar:nth-child(4) { height: 20px; }

.network-indicator.excellent .bar { background: rgba(255, 255, 255, 0.9); }
.network-indicator.good .bar:nth-child(-n+3) { background: rgba(255, 255, 255, 0.7); }
.network-indicator.fair .bar:nth-child(-n+2) { background: rgba(255, 255, 255, 0.5); }
.network-indicator.poor .bar:nth-child(1) { background: rgba(255, 255, 255, 0.3); }

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

.avatar-container {
  position: relative;
  margin-bottom: 40px;
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.3);
}
/* 强制 56 方形头像覆盖圆角 */
.avatar.avatar-70 {
  width: 70px;
  height: 70px;
  border-radius: 0 !important;
  border: 2px solid rgba(255,255,255,0.35);
}

.avatar-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  opacity: 0;
  transition: all 0.3s ease;
}

.avatar-ring.active {
  opacity: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.audio-waves {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  align-items: flex-end;
}

.wave {
  width: 3px;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% {
    height: 8px;
  }
  50% {
    height: 20px;
  }
}

.user-details {
  text-align: center;
  color: white;
}

.user-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.call-status {
  font-size: 18px;
  opacity: 0.8;
}

.bottom-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 16px 20px 24px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:active {
  transform: scale(0.95);
}

.btn-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  color: white;
}

.btn-icon svg {
  width: 28px;
  height: 28px;
}

.control-btn:hover .btn-icon {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.control-btn.active .btn-icon {
  background: rgba(255, 71, 87, 0.8);
}

.end-call-btn .btn-icon {
  background: #ff4757;
}

.end-call-btn:hover .btn-icon {
  background: #ff3742;
}

.btn-label {
  color: white;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .control-buttons {
    gap: 30px;
  }

  .btn-icon {
    width: 50px;
    height: 50px;
  }

  .btn-icon svg {
    width: 24px;
    height: 24px;
  }

  .avatar {
    width: 120px;
    height: 120px;
  }

  .user-name {
    font-size: 24px;
  }

  .call-status {
    font-size: 16px;
  }
}
</style>

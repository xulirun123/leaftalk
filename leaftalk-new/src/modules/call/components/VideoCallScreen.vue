<template>
  <div class="video-call-screen" @click="onSurfaceTap">
    <!-- 远程视频 -->
    <div class="remote-video-container">
      <video
        ref="remoteVideoRef"
        class="remote-video"
        autoplay
        playsinline
        muted
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
        x5-video-player-fullscreen="true"
        @loadedmetadata="(e) => forceVideoPlay(e.target as HTMLVideoElement)"
        @canplay="(e) => forceVideoPlay(e.target as HTMLVideoElement)"
      >
      </video>
      <!-- 隐藏的远端音频播放器：确保能听到对方声音 -->
      <audio ref="remoteAudioRef" autoplay style="display: none;"></audio>

      <!-- 顶部状态栏（放入大视频容器内） -->
      <div class="top-bar status-bar" v-show="uiVisible"></div>

      <!-- 系统状态条：始终显示在最顶层 -->
      <div class="system-status-bar">
        <div class="time">{{ statusTime }}</div>
        <div class="icons">
          <svg viewBox="0 0 24 24" class="icon" fill="currentColor" aria-label="cellular">
            <rect x="3" y="14" width="3" height="7" rx="1"/>
            <rect x="8" y="11" width="3" height="10" rx="1"/>
            <rect x="13" y="8" width="3" height="13" rx="1"/>
            <rect x="18" y="5" width="3" height="16" rx="1"/>
          </svg>
          <svg viewBox="0 0 24 24" class="icon" fill="currentColor" aria-label="wifi">
            <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2.1 9.3A17 17 0 0 1 12 6c3.6 0 6.9 1.1 9.9 3.3l-1.4 1.8A14.8 14.8 0 0 0 12 8c-3.1 0-6 .9-8.5 2.8L2.1 9.3z"/>
            <path d="M5 12.5A12 12 0 0 1 12 10c2.6 0 5 .8 7 2.5l-1.5 1.8A9.8 9.8 0 0 0 12 12c-2.2 0-4.3.6-6.1 1.9L5 12.5z"/>
            <path d="M8.3 15.3c1.1-.7 2.4-1.1 3.7-1.1s2.6.4 3.7 1.1l-1.5 1.9c-.7-.4-1.4-.6-2.2-.6s-1.5.2-2.2.6l-1.5-1.9z"/>
          </svg>
          <svg viewBox="0 0 28 24" class="icon" fill="currentColor" aria-label="battery">
            <rect x="1" y="6" width="22" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="8" width="14" height="8" rx="1" ry="1" />
            <rect x="24" y="9" width="3" height="6" rx="1" ry="1" />
          </svg>
        </div>
      </div>

      <!-- 接通后，中间显示通话时长 + 左侧邀请按钮（遵循10s自动隐藏规则） -->
      <div v-if="props.callStatus === 'connected' && uiVisible" class="top-controls" @click.stop>
        <button class="top-btn" @click.stop="emit('invite-friend')" title="邀请好友视频电话">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2h5z"/></svg>
        </button>
        <div class="call-duration top">{{ formattedDuration }}</div>
        <button class="top-btn" @click.stop="emit('toggle-floating')" title="切换为浮窗">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 7a2 2 0 012-2h8a2 2 0 012 2v2h-2V7H5v10h4v2H5a2 2 0 01-2-2V7z"/>
            <path d="M11 11a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-6zm2 0h6v6h-6v-6z"/>
          </svg>
        </button>
      </div>


      <!-- 未接通时显示对方头像（仅在没有本地流时显示） -->
      <div v-if="props.callStatus !== 'connected' && !hasLocalVideo" class="remote-overlay" style="z-index: 10;">
        <div class="remote-placeholder">
          <img
            :src="contactInfo.avatar || defaultAvatar"
            :alt="displayName"
            class="remote-avatar invite-avatar"
          />
          <div class="invite-name">{{ displayName }}</div>
        </div>
      </div>

      <!-- 调试信息（临时） -->
      <div style="position: absolute; top: 80px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; border-radius: 5px; z-index: 1000; max-width: 300px;">
        状态: {{ props.callStatus }}<br>
        本地流: {{ !!props.localStream }}<br>
        远程流: {{ !!props.remoteStream }}<br>
        hasLocalVideo: {{ hasLocalVideo }}<br>
        本地视频轨道: {{ props.localStream?.getVideoTracks().length || 0 }}<br>
        本地音频轨道: {{ props.localStream?.getAudioTracks().length || 0 }}<br>
        远程视频轨道: {{ props.remoteStream?.getVideoTracks().length || 0 }}<br>
        远程音频轨道: {{ props.remoteStream?.getAudioTracks().length || 0 }}<br>
        流活跃: {{ props.localStream?.active }}<br>
        大窗流: {{ !!remoteVideoRef?.srcObject }}<br>
        小窗流: {{ !!localVideoRef?.srcObject }}<br>
        大窗播放: {{ !remoteVideoRef?.paused }}<br>
        小窗可见: {{ isLocalVideoVisible }}<br>
        小窗显示: {{ props.callStatus === 'connected' }}
      </div>

    </div>

    <!-- 本地视频（小窗）- 接通后显示 -->
    <div v-if="props.callStatus === 'connected'" class="local-video-container" :class="{ 'minimized': !isLocalVideoVisible }" @click.stop="togglePipSwap" title="切换大/小窗视频">
      <video
        ref="localVideoRef"
        class="local-video"
        autoplay
        playsinline
        muted
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
      ></video>

      <!-- 本地视频占位符（仅在没有本地流时显示） -->
      <div v-if="!hasLocalVideo" class="local-placeholder">
        <div class="camera-off-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-2-2H16c1.1 0 2 .9 2 2v1.5l4-4v8.5z"/>
            <path d="M3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 19 21 17.73 3.27 2zM5 14V8h1.73l6 6H5z"/>
          </svg>
        </div>
      </div>
    </div>



    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <!-- 已接通：挂断按钮上方一排三个按钮（麦克风 / 扬声器 / 摄像头开关） -->
      <div v-if="props.callStatus === 'connected'">
        <div class="control-buttons connected" v-show="uiVisible">
          <!-- 麦克风开关（圆形：开=白底，关=黑底） -->
          <button class="control-btn" :class="[ micOn ? 'on' : 'off' ]" @click.stop="toggleAudio">
            <div class="btn-icon">
              <svg v-if="micOn" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>
            </div>
          </button>
          <!-- 扬声器开关（圆形：开=白底，关=黑底） -->
          <button class="control-btn" :class="[ speakerOnState ? 'on' : 'off' ]" @click.stop="toggleSpeaker">
            <div class="btn-icon">
              <svg v-if="speakerOnState" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 10v4h4l5 5V5L7 10H3z"/>
                <path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v8.06A4.51 4.51 0 0 0 16.5 12z"/>
                <path d="M14 3.23v2.06c2.89 1 5 3.77 5 6.71s-2.11 5.71-5 6.71v2.06c4.01-1.1 7-4.79 7-8.77s-2.99-7.67-7-8.77z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v8.06A4.51 4.51 0 0 0 16.5 12z" opacity=".3"/>
                <path d="M4.34 2.93 2.93 4.34 7.59 9H3v6h4l5 5v-6.41l4.66 4.66 1.41-1.41L4.34 2.93z"/>
              </svg>
            </div>
          </button>
          <!-- 摄像头开关（圆形：开=白底，关=黑底） -->
          <button class="control-btn" :class="[ cameraOn ? 'on' : 'off' ]" @click.stop="toggleVideo">
            <div class="btn-icon">
              <svg v-if="cameraOn" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-2-2H16c1.1 0 2 .9 2 2v1.5l4-4v8.5z"/><path d="M3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 19 21 17.73 3.27 2z"/></svg>
            </div>
          </button>
        </div>
        <!-- 与挂断按钮的间距 36px -->

        <!-- 底部一排：左切换摄像头 / 右占位（人像） -->
        <div class="bottom-row" v-show="uiVisible">
          <div class="left">
            <button class="square-btn" @click.stop="switchCamera" :disabled="isVideoMuted" title="切换前后摄像头">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 .64-.12 1.25-.34 1.81l1.46 1.46A6.96 6.96 0 0 0 19 13c0-3.87-3.13-7-7-7zM6.34 7.19L4.88 5.73A6.96 6.96 0 0 0 5 11c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5 0-.64.12-1.25.34-1.81z"/>
              </svg>
            </button>
          </div>
          <button class="end-call-big" @click.stop="endCall" title="挂断">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </button>
          <div class="right">
            <button class="square-btn" @click.stop title="联系人">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.97 0-9 2.24-9 5v3h18v-3c0-2.76-4.03-5-9-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 邀请阶段：三等大按钮（左：切换摄像头，中：取消，右：摄像头开关） -->
      <div class="invite-big-row" v-if="props.callStatus !== 'connected'">
        <button class="big-btn" @click.stop="switchCamera" :disabled="isVideoMuted" title="切换摄像头">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"/>
          </svg>
        </button>
        <button class="big-btn end" @click.stop="endCall" title="取消">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
        </button>
        <button class="big-btn" @click.stop="toggleVideo" title="摄像头开关">
          <svg v-if="!isVideoMuted" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-2-2H16c1.1 0 2 .9 2 2v1.5l4-4v8.5z"/>
            <path d="M3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 19 21 17.73 3.27 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { CallConfig, NetworkQuality } from '../types'
import { contactsApi } from '../../contacts/services/contactsApi'


interface Props {
  callConfig: CallConfig
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  frontCameraStream?: MediaStream | null
  networkQuality: NetworkQuality
  callDuration: number
  isAudioMuted: boolean
  isVideoMuted: boolean
  callStatus: string
  isSpeakerOn?: boolean
}

interface Emits {
  (e: 'toggle-audio'): void
  (e: 'toggle-video'): void
  (e: 'toggle-speaker'): void
  (e: 'switch-camera'): void
  (e: 'end-call'): void
  (e: 'toggle-floating'): void
  (e: 'invite-friend'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 模板引用
const remoteAudioRef = ref<HTMLAudioElement>()

const localVideoRef = ref<HTMLVideoElement>()
const remoteVideoRef = ref<HTMLVideoElement>()

// 状态
const hasLocalVideo = ref(false)
const hasRemoteVideo = ref(false)
const isLocalVideoVisible = ref(true)
const defaultAvatar = '/src/assets/images/default-avatar.png'

// 计算属性

// 顶部状态栏时间
const statusTime = ref('')
function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}
let statusTimer: any
onMounted(() => {
  statusTime.value = formatTime(new Date())
  statusTimer = setInterval(() => { statusTime.value = formatTime(new Date()) }, 30000)
})
onUnmounted(() => { try { clearInterval(statusTimer) } catch {} })

// 大/小窗切换
const swapMainAndPip = ref(false)
const togglePipSwap = () => { swapMainAndPip.value = !swapMainAndPip.value; bindStreams() }

const bindStreams = async () => {
  const mainEl: any = remoteVideoRef.value
  const pipEl: any = localVideoRef.value
  // 允许在小窗尚未挂载时先绑定大窗，避免“必须点一下小窗才显示”的问题
  if (!mainEl) return

  console.log('📹 bindStreams 调用:', {
    callStatus: props.callStatus,
    localStream: props.localStream,
    localVideoTracks: props.localStream?.getVideoTracks(),
    remoteStream: props.remoteStream,
    swapMainAndPip: swapMainAndPip.value
  })

  try {
    if (props.callStatus === 'connected') {
      const local = props.localStream
      const remote = props.remoteStream

      console.log('📹 接通状态绑定流:', {
        local: !!local,
        remote: !!remote,
        localTracks: local?.getVideoTracks().length,
        remoteTracks: remote?.getVideoTracks().length,
        swapMainAndPip: swapMainAndPip.value
      })

      const remoteHasVideo = !!(remote && remote.getVideoTracks().length > 0)
      const localHasVideo = !!(local && local.getVideoTracks().length > 0)

      if (swapMainAndPip.value) {
        // 切换后：大窗=本地（仅当本地有视频），小窗=远端（仅当远端有视频）
        mainEl.srcObject = localHasVideo && local ? local : null
        mainEl.muted = true
        pipEl.srcObject = remoteHasVideo && remote ? remote : null
        pipEl.muted = true
      } else {
        // 默认：大窗=远端（仅当远端有视频），小窗=本地（仅当本地有视频）
        console.log('📹 设置大窗为远端流(hasVideo=)', remoteHasVideo)
        mainEl.srcObject = remoteHasVideo && remote ? remote : null
        // 为保证自动播放，保持视频元素静音；远端音频由隐藏 audio 元素播放
        mainEl.muted = true

        // 小窗显示本地流（仅当存在视频轨道时）
        console.log('📹 设置小窗为本地流（hasVideo=）', localHasVideo)
        if (pipEl) {
          if (localHasVideo && local) {
            pipEl.srcObject = local
            pipEl.muted = true
            pipEl.autoplay = true
            pipEl.playsInline = true
            console.log('📹 小窗流设置完成, srcObject:', pipEl.srcObject)
          } else {
            pipEl.srcObject = null
            console.log('📹 本地无视频轨道，小窗保留占位')
          }
        }
      }


	      // 远端音频绑定到隐藏的 <audio>，确保任何布局下都能听到对方
	      if (remote && remote.getAudioTracks().length > 0 && remoteAudioRef.value) {
	        const audioEl = remoteAudioRef.value
	        try {
	          if (audioEl.srcObject !== remote) {
	            audioEl.srcObject = remote
	          }
	          ;(audioEl as any).muted = false
	          await (audioEl as HTMLMediaElement).play()
          await updateAudioSink()

	          console.log('🔊 远端音频已播放')
	        } catch (e) {
	          console.warn('🔇 远端音频播放失败:', e)
	        }
	      }

      // 分别播放大窗和小窗
      if (mainEl) await forceVideoPlay(mainEl)
      if (pipEl && pipEl.srcObject) {
        await forceVideoPlay(pipEl)
        console.log('📹 小窗播放尝试完成')
      }
    } else {
      // 未接通：仅当存在本地视频轨道时才显示本地预览
      const inviteHasLocalVideo = !!(props.localStream && props.localStream.getVideoTracks().length > 0)
      console.log('📹 bindStreams 设置邀请阶段本地预览，hasVideo:', inviteHasLocalVideo)
      if (inviteHasLocalVideo && mainEl) {
        console.log('📹 bindStreams 开始设置视频流到主元素')

        mainEl.srcObject = props.localStream
        mainEl.muted = true
        mainEl.autoplay = true
        mainEl.playsInline = true

        console.log('📹 bindStreams 设置完成, srcObject:', mainEl.srcObject)

        // 立即尝试播放
        mainEl.play().then(() => {
          console.log('📹 bindStreams 播放成功')
        }).catch((e: any) => {
          console.warn('📹 bindStreams 播放失败:', e)
        })
      } else {
        // 清空主元素，显示邀请阶段头像占位
        if (mainEl) mainEl.srcObject = null
        console.warn('📹 bindStreams 跳过：无本地视频轨道或主元素缺失')
      }
    }
  } catch (e) {
    console.error('📹 bindStreams 失败:', e)
  }
}

// 强制视频播放（解决浏览器自动播放策略限制）
const forceVideoPlay = async (videoEl: HTMLVideoElement | any) => {
  if (!videoEl || !videoEl.srcObject) return

  try {
    // 确保视频元素属性正确设置
    videoEl.muted = true
    videoEl.autoplay = true
    videoEl.playsInline = true

    // 多次尝试播放
    for (let i = 0; i < 3; i++) {
      try {
        await videoEl.play()
        console.log('📹 视频播放成功')
        return true
      } catch (e: any) {
        console.warn(`📹 视频播放尝试 ${i + 1} 失败:`, e.message)
        if (i === 2) {
          // 最后一次尝试：强制设置属性并重试
          videoEl.setAttribute('autoplay', 'true')
          videoEl.setAttribute('muted', 'true')
          videoEl.setAttribute('playsinline', 'true')
          await new Promise(resolve => setTimeout(resolve, 100))
          try {
            await videoEl.play()
            console.log('📹 视频播放成功（最后尝试）')
            return true
          } catch {
            console.warn('📹 视频播放失败，但继续显示视频流')
            return false
          }
        }
      }
    }
  } catch (error) {
    console.error('📹 forceVideoPlay 失败:', error)
    return false
  }
}


// 邀请阶段头像下显示昵称/备注名（备注优先）
const contactId = computed(() => String(props.callConfig?.targetUserId || (props.callConfig?.targetUserInfo as any)?.id || ''))
const resolvedName = ref('')
const displayName = computed(() => {
  const info: any = props.callConfig?.targetUserInfo || {}
  const fallback = info.remark || info.remark_name || info.nickname || info.real_name || info.username || info.name || (contactId.value ? `用户${contactId.value}` : '')
  return (resolvedName.value && resolvedName.value.trim()) ? resolvedName.value : fallback
})

const resolveDisplayName = async () => {
  const id = contactId.value
  if (!id) return
  // 1) 本地 friend_profile_cache
  try {
    const cache = JSON.parse(localStorage.getItem('friend_profile_cache') || '{}')
    const remark = cache?.[id]?.remark
    if (remark && String(remark).trim()) { resolvedName.value = remark; return }
  } catch {}
  // 2) 本地 yeyu_contacts 缓存
  try {
    const raw = localStorage.getItem('yeyu_contacts')
    if (raw) {
      const list = JSON.parse(raw)
      const hit = Array.isArray(list) ? list.find((c: any) => String(c.id) === id) : null
      if (hit) {
        const name = hit.remark || hit.remark_name || hit.nickname || hit.real_name || hit.username || hit.name || ''
        if (name) { resolvedName.value = name; return }
      }
    }
  } catch {}
  // 3) 远程联系人API
  try {
    const resp = await contactsApi.getContacts()
    if (resp && resp.success && Array.isArray(resp.data)) {
      const hit: any = resp.data.find((c: any) => String(c.id) === id)
      if (hit) {
        const name = hit.remark || hit.remark_name || hit.nickname || hit.real_name || hit.username || hit.name || ''
        if (name) { resolvedName.value = name; return }
      }
    }
  } catch {}
}

watch(contactId, () => { resolveDisplayName() }, { immediate: true })

const contactInfo = computed(() => props.callConfig.targetUserInfo)

const formattedDuration = computed(() => {
  const duration = props.callDuration
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
})

// 摄像头状态显示（暂时不使用）
// const cameraStatusText = computed(() => {
//   return ''
// })

// 已接通上排开关按钮的开关态（开=白底，关=黑底）
const micOn = computed(() => !props.isAudioMuted)
const speakerOnState = computed(() => !!props.isSpeakerOn)
const cameraOn = computed(() => !props.isVideoMuted)



// 连接后自动隐藏UI（10秒无操作隐藏；点屏幕显示并重置计时）
const uiVisible = ref(true)
let uiHideTimer: any = null
const scheduleHideUI = () => {
  if (uiHideTimer) clearTimeout(uiHideTimer)
  uiHideTimer = setTimeout(() => { uiVisible.value = false }, 10000)
}

// 用户交互后应保持按钮显示，并重置10s隐藏计时
const onUserAction = () => {
  if (props.callStatus === 'connected') {
    uiVisible.value = true
    scheduleHideUI()
  }
}

watch(() => props.callStatus, async (s) => {
  if (s === 'connected') {
    uiVisible.value = true
    scheduleHideUI()

    // 接通后立即设置小窗视频流
    await nextTick() // 确保 DOM 已更新
    if (localVideoRef.value) {
      const hasVideo = !!(props.localStream && props.localStream.getVideoTracks().length > 0)
      console.log('📹 接通后立即设置小窗视频流（是否有本地视频轨道）:', hasVideo)
      const pipEl = localVideoRef.value

      // 强制重置
      pipEl.srcObject = null
      await new Promise(resolve => setTimeout(resolve, 50))

      if (hasVideo && props.localStream) {
        pipEl.srcObject = props.localStream
        pipEl.muted = true
        pipEl.autoplay = true
        pipEl.playsInline = true
        console.log('📹 小窗流设置完成:', pipEl.srcObject)
        try {
          await pipEl.play()
          console.log('📹 小窗立即播放成功')
        } catch (e) {
          console.warn('📹 小窗立即播放失败:', e)
        }
      } else {
        console.warn('📹 无本地视频轨道，小窗显示占位')
      }
    } else {
      console.warn('📹 小窗设置失败 - 本地流:', !!props.localStream, '小窗元素:', !!localVideoRef.value)
    }
  } else {
    uiVisible.value = true
    if (uiHideTimer) { clearTimeout(uiHideTimer); uiHideTimer = null }
  }
}, { immediate: true })
const onSurfaceTap = () => {
  // 点击页面仅用于显示/隐藏按钮，不进入全屏
  if (props.callStatus === 'connected') {
    uiVisible.value = !uiVisible.value
    if (uiVisible.value) scheduleHideUI()
  }

  // 用户交互后尝试播放视频（解决自动播放限制）
  tryPlayAllVideos()
}

// 尝试播放所有视频（用户交互后）
const tryPlayAllVideos = async () => {
  try {
    if (remoteVideoRef.value) await forceVideoPlay(remoteVideoRef.value)
    if (localVideoRef.value) await forceVideoPlay(localVideoRef.value)
  } catch (e) {
    console.warn('📹 用户交互后播放视频失败:', e)
  }
}

// 强制刷新小窗视频流
const forceRefreshPipVideo = async () => {
  if (props.callStatus === 'connected' && props.localStream && localVideoRef.value) {
    console.log('🔄 强制刷新小窗视频流')
    const pipEl = localVideoRef.value

    // 完全重置
    pipEl.srcObject = null
    pipEl.load()
    await new Promise(resolve => setTimeout(resolve, 100))

    // 重新设置
    pipEl.srcObject = props.localStream
    pipEl.muted = true
    pipEl.autoplay = true
    pipEl.playsInline = true

    console.log('🔄 小窗重新设置完成:', pipEl.srcObject)

    try {
      await pipEl.play()
      console.log('🔄 小窗重新播放成功')
      return true
    } catch (e) {
      console.warn('🔄 小窗重新播放失败:', e)
      return false
    }
  }
  return false
}

// 调试强制播放（临时保留）
// const debugForcePlay = async () => {
//   console.log('🔧 调试强制播放')
//   const mainEl = remoteVideoRef.value
//   if (mainEl && props.localStream) {
//     console.log('🔧 重新设置视频流')
//     mainEl.srcObject = null
//     await new Promise(resolve => setTimeout(resolve, 100))
//     mainEl.srcObject = props.localStream
//     mainEl.muted = true
//     mainEl.autoplay = true
//     mainEl.playsInline = true

//     try {
//       await mainEl.play()
//       console.log('🔧 调试播放成功')
//     } catch (e) {
//       console.error('🔧 调试播放失败:', e)
//     }
//   }
// }

// 监听本地流变化
watch(() => props.localStream, async (newStream) => {
  console.log('📹 本地流变化:', newStream, '活跃状态:', newStream?.active)
  console.log('📹 本地流详细信息:', {
    hasStream: !!newStream,
    isActive: newStream?.active,
    videoTracksCount: newStream?.getVideoTracks().length,
    audioTracksCount: newStream?.getAudioTracks().length,
    firstVideoTrackEnabled: newStream?.getVideoTracks()[0]?.enabled,
    streamId: newStream?.id
  })

  // 检查是否有视频轨道
  const hasVideo = !!(newStream && newStream.getVideoTracks().length > 0)
  console.log('📹 hasLocalVideo 设置为:', hasVideo)
  hasLocalVideo.value = hasVideo

  // 等待 DOM 更新后再绑定流
  await nextTick()
  bindStreams()

  // 如果是邀请阶段且有视频流，立即设置到大窗
  if (newStream && hasVideo && props.callStatus !== 'connected' && remoteVideoRef.value) {
    console.log('📹 邀请阶段立即设置本地视频流到大窗')
    const videoEl = remoteVideoRef.value
    videoEl.srcObject = newStream
    videoEl.muted = true
    videoEl.autoplay = true
    videoEl.playsInline = true

    try {
      await videoEl.play()
      console.log('📹 邀请阶段播放成功')
    } catch (e) {
      console.warn('📹 邀请阶段播放失败:', e)
    }
  }
}, { immediate: true })

// 未接通阶段：使用本地视频作为全屏背景；接通后切换为远端视频
watch([
  () => props.callStatus,
  () => props.localStream,
  () => props.remoteStream,
  () => swapMainAndPip.value


], () => { bindStreams() }, { immediate: true })

// 监听远程流变化
watch(() => props.remoteStream, (newStream) => {
  console.log('📹 远程流变化:', newStream, '视频轨道:', newStream?.getVideoTracks())
  // 只要有流就认为有视频，不管播放状态
  hasRemoteVideo.value = !!(newStream && newStream.getVideoTracks().length > 0)
  bindStreams()
}, { immediate: true })


// 扬声器开关：关闭时优先路由到耳机；开启时尽量外放。iOS/不支持 setSinkId 时退化为默认输出
watch(() => props.isSpeakerOn, async () => {
  const a: any = remoteAudioRef.value
  if (!a) return
  try {
    a.muted = false
    a.volume = 1
  } catch {}
  await updateAudioSink()
}, { immediate: true })


// 根据扬声器开关动态选择音频输出设备（优先耳机或外放）
async function updateAudioSink() {
  const a: any = remoteAudioRef.value
  if (!a || typeof a.setSinkId !== 'function' || !navigator?.mediaDevices?.enumerateDevices) {
    return
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const outputs = devices.filter(d => d.kind === 'audiooutput')
    const headphoneRegex = /(headphone|headset|earphone|耳机|耳麦|bluetooth|蓝牙)/i
    const speakerRegex = /(speaker|扬声器|喇叭|外放)/i

    let target: MediaDeviceInfo | undefined
    if (!props.isSpeakerOn) {
      // 扬声器关闭：优先耳机/耳麦/蓝牙；其次 communications；最后 default
      target = outputs.find(d => headphoneRegex.test(d.label))
        || outputs.find(d => d.deviceId === 'communications')
        || outputs.find(d => d.deviceId === 'default')
        || outputs[0]
    } else {
      // 扬声器开启：优先扬声器；否则 default
      target = outputs.find(d => speakerRegex.test(d.label))
        || outputs.find(d => d.deviceId === 'default')
        || outputs[0]
    }

    // 应用输出设备
    if (target && (a.sinkId === undefined || a.sinkId !== (target as any).deviceId)) {
      await a.setSinkId((target as any).deviceId)
      console.log('🔈 已切换音频输出到:', target.label || (target as any).deviceId)
    }
  } catch (e) {
    console.warn('setSinkId/枚举设备失败，使用默认输出', e)
  }
}

// 监听视频静音状态


// 方法
const toggleAudio = () => {
  emit('toggle-audio')
  onUserAction()
}

const toggleVideo = () => {
  emit('toggle-video')
  onUserAction()
}


const toggleSpeaker = () => {
  emit('toggle-speaker')
  onUserAction()
}



const switchCamera = () => {
  emit('switch-camera')
  onUserAction()
}

const endCall = () => {
  emit('end-call')
  onUserAction()
}

// 生命周期
onMounted(async () => {
  console.log('📹 视频通话界面已加载')
  console.log('📹 当前状态:', props.callStatus)
  console.log('📹 本地流:', props.localStream)
  console.log('📹 本地流视频轨道:', props.localStream?.getVideoTracks())
  await nextTick()
  // 首次挂载：统一走 bindStreams 绑定与播放策略（避免重复逻辑）
  bindStreams()
  // 轻量补刀，确保自动播放
  setTimeout(() => { tryPlayAllVideos() }, 100)
  setTimeout(() => { tryPlayAllVideos() }, 500)
})

onUnmounted(() => {
  console.log('📹 视频通话界面已卸载')
})
</script>

<style scoped>
.video-call-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;

  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.remote-video-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000; /* 纯黑以保证状态区也被覆盖 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remote-overlay {



  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.remote-placeholder {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  display: block;
  min-width: 0;
  max-width: none;
}

.remote-avatar {
  width: 70px;
  height: 70px;
  border-radius: 2px;
  object-fit: cover;
  border: none;
}

.remote-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.connection-status {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.local-video-container {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 120px;
  height: 160px;
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

.local-video-container.minimized {
  width: 80px;
  height: 106px;
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.float-btn {
  position: absolute;
  top: 48px; /* 下移，避免与顶部状态图标重叠 */
  left: 14px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.18);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  z-index: 8;
}
.float-btn svg { width: 20px; height: 20px; }

.local-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
}

.camera-off-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.5);
}

.camera-off-icon svg {
  width: 100%;
  height: 100%;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  height: 25px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  display: flex;
  align-items: center;
  z-index: 8;
}

/* 顶部状态栏内容 */
.status-bar .status-content {
  position: relative;
  width: 100%;
  color: #fff;
  font-size: 13px;
  line-height: 25px;
  text-align: center;
}
.status-bar .status-content .left,
.status-bar .status-content .right {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-bar .status-content .left { left: 56px; }
.status-bar .status-content .right { right: 12px; }


/* 顶部系统状态栏（时间 + 图标） - 与语音通话一致 */
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
  z-index: 9;
  pointer-events: none;
}
.system-status-bar .time { font-size: 12px; letter-spacing: .3px; }
.system-status-bar .icons { display: flex; gap: 10px; align-items: center; }
.system-status-bar .icon { width: 20px; height: 20px; }

/* 简单图标占位 */
.icon-signal, .icon-wifi, .icon-battery { display: inline-block; opacity: 0.9; }
.icon-signal { width: 16px; height: 10px; border-bottom: 2px solid #fff; border-left: 2px solid #fff; transform: skewX(-20deg); }
.icon-wifi { width: 18px; height: 12px; border-top: 2px solid #fff; border-radius: 0 0 10px 10px; }
.icon-battery { width: 22px; height: 12px; border: 2px solid #fff; border-radius: 3px; position: relative; }
.icon-battery::after { content: ''; position: absolute; right: -4px; top: 3px; width: 3px; height: 6px; background: #fff; border-radius: 1px; }

.call-info {
  color: white;
}

.contact-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.call-duration {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
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

/* 接通后顶部控制条：左 + ，中 时长，右 浮窗切换 */
.top-controls {
  position: absolute;
  top: 36px; /* 避开系统状态条 */
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 9;
}
.top-controls .top-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(0,0,0,0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.top-controls .top-btn svg { width: 20px; height: 20px; }
.call-duration.top {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
}

/* 底部一排：三列布局，保证中间挂断始终处于水平居中 */
.bottom-row {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 8px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  z-index: 6;
}
.bottom-row .left, .bottom-row .right { display: flex; }
.bottom-row .left { justify-content: flex-start; }
.bottom-row .right { justify-content: flex-end; }



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

.network-indicator.excellent .bar { background: #2ed573; }
.network-indicator.good .bar:nth-child(-n+3) { background: #ffa502; }
.network-indicator.fair .bar:nth-child(-n+2) { background: #ff6348; }
.network-indicator.poor .bar:nth-child(1) { background: #ff4757; }

.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 20px 50px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  z-index: 5;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.control-btn {


  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn.active {
  background: rgba(255, 71, 87, 0.8);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.end-call-btn {
  background: #ff4757;
}

/* 顶部联系人信息与等待提示（仿微信） */
.top-contact {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 6;
  pointer-events: none;
}
.contact-mini-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}
.contact-mini-name {
  margin-top: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
}

/* 已接通：上排三个圆形按钮（开=白底；关=黑底） */
.control-buttons.connected { display: flex; justify-content: center; gap: 28px; margin-bottom: 56px; }
.control-buttons.connected .control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}

.control-buttons.connected .btn-icon { width: 24px; height: 24px; }

/* 开：半透明白底 + 黑色图标；关：半透明黑底 + 白色图标 */
.control-buttons.connected .control-btn.on { background: rgba(255,255,255,0.85); color: #000; border-color: transparent; }
.control-buttons.connected .control-btn.off { background: rgba(0,0,0,0.55); color: #fff; }
/* 强制覆盖图标颜色（避免 .btn-icon 默认色覆盖） */
.control-buttons.connected .control-btn.on .btn-icon { color: #000; }
.control-buttons.connected .control-btn.off .btn-icon { color: #fff; }

/* 已接通：底部一排（左切换摄像头 / 右占位），与中间挂断按钮同一中线 */
.bottom-row {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12px;
  width: 240px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 6;
}
.waiting-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 160px;
  color: rgba(255,255,255,0.92);
  text-align: center;
  font-size: 14px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
  z-index: 6;
}

/* 大号挂断按钮 + 底部左右功能键 */
.end-call-big {
  width: 68px;
  height: 68px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: #ff4757;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(255,71,87,0.35);
}


/* 中部通话时长与邀请按钮 */
.center-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 7;
}
.center-overlay .invite-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}
.center-overlay .invite-btn svg { width: 22px; height: 22px; }
.center-overlay .call-duration {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
}


.end-call-big svg {
  width: 28px;
  height: 28px;
  color: #fff;
}
.side-buttons {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 6;
}
.square-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.18);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.square-btn svg {
  width: 20px;
  height: 20px;
}


.end-call-btn:hover {
  background: #ff3742;
}

.btn-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.btn-icon svg {
  width: 100%;
  height: 100%;
}

/* 响应式设计 */

/* 邀请阶段：三等大按钮布局 */
.invite-big-row {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 36px;
  z-index: 6;
}
.big-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.big-btn svg { width: 28px; height: 28px; }
.big-btn.end {
  background: #ff4757;
  box-shadow: 0 10px 24px rgba(255,71,87,0.35);
}

@media (max-width: 480px) {
  .local-video-container {
    width: 100px;
    height: 133px;
    top: 70px;
    right: 15px;
  }

  .local-video-container.minimized {
    width: 70px;
    height: 93px;
  }

  .control-buttons {
    gap: 20px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
  }

  .btn-icon {
    width: 20px;
    height: 20px;
  }
}

/* 邀请阶段头像下的昵称/备注名样式 */
.invite-name {
  margin-top: 10px;
  color: #fff;
  font-size: 16px;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.35);
}

</style>

<template>
  <div class="chat-camera-page" :class="{ closing: isClosing }" @click="beautyEnabled=false; showFlashMenu=false">
    <video ref="videoRef" class="camera-preview" autoplay muted playsinline></video>
    <canvas ref="canvasRef" style="display:none;"></canvas>

    <!-- 顶部右侧：闪光灯按钮与弹窗 -->
    <div class="flash-control">
      <button class="flash-btn" @click.stop="toggleFlashMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </button>
      <div v-if="showFlashMenu" class="flash-menu">
        <button :class="{active: flashMode==='always'}" @click.stop="setFlashMode('always')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
        <button :class="{active: flashMode==='auto'}" @click.stop="setFlashMode('auto')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v6l3-3 3 3"/>
            <path d="M12 18v4"/>
            <path d="M4.93 4.93l1.41 1.41"/>
            <path d="M17.66 17.66l1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="M6.34 17.66l-1.41 1.41"/>
            <path d="M19.07 4.93l-1.41 1.41"/>
          </svg>
        </button>
        <button :class="{active: flashMode==='off'}" @click.stop="setFlashMode('off')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <path d="M6.5 6.5l.4.4a5.98 5.98 0 0 0 8.4 8.4l.4.4"/>
          </svg>
        </button>
        <button :class="{active: flashMode==='on'}" @click.stop="setFlashMode('on')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 美颜按钮（避免与广角按钮重合） -->
    <div class="beauty-panel" @click.stop>
      <button class="beauty-toggle" :class="{ on: beautyEnabled }" @click.stop="toggleBeauty">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </button>
      <div v-if="beautyEnabled" class="beauty-slider" @click.stop>
        <input type="range" min="0" max="100" v-model="beautyLevel" />
        <span class="beauty-value">{{ beautyLevel }}</span>
      </div>
    </div>

    <!-- 预览层：拍照/录像完成后展示，支持发送/重拍 -->
    <div v-if="showPreview" class="preview-overlay">
      <div class="preview-content" @click.stop>
        <img v-if="previewType==='photo'" :src="previewUrl" class="preview-media" />
        <video v-else ref="previewVideoRef" class="preview-media" :src="previewUrl" controls autoplay loop></video>
      </div>
      <!-- 重拍按钮 - 左下角 -->
      <button class="preview-btn retake-btn" @click="retake">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>
      <!-- 发送按钮 - 右下角 -->
      <button class="preview-btn send-btn" @click="sendFromPreview">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22,2 15,22 11,13 2,9 22,2"/>
        </svg>
      </button>
    </div>

    <!-- 中部：变焦容器（在模式切换按钮上方）；长按打开弧形刻度盘 -->
    <div v-if="!beautyEnabled" class="zoom-container"
         @mousedown.prevent="startZoomDialPress"
         @mouseup.prevent="cancelZoomDialPress"
         @mouseleave="cancelZoomDialPress"
         @touchstart.passive="startZoomDialPress"
         @touchend.passive="cancelZoomDialPress">
      <div class="zoom-bg">
        <button class="zoom-btn" :class="{active: approxZoom===0.8}" @click="setZoom(0.8)">W</button>
        <button v-if="approxZoom>zoomMin && approxZoom<1" class="zoom-btn dynamic" :class="{active: true}">{{ approxZoom.toFixed(1) }}x</button>
        <button class="zoom-btn" :class="{active: approxZoom===1}" @click="setZoom(1)">1x</button>
        <button v-if="approxZoom>1 && approxZoom<2" class="zoom-btn dynamic" :class="{active: true}">{{ approxZoom.toFixed(1) }}x</button>
        <button class="zoom-btn" :class="{active: approxZoom===2}" @click="setZoom(2)">2x</button>
        <button v-if="approxZoom>2 && approxZoom<3" class="zoom-btn dynamic" :class="{active: true}">{{ approxZoom.toFixed(1) }}x</button>
        <button class="zoom-btn" :class="{active: approxZoom===3}" @click="setZoom(3)">3x</button>
        <button v-if="approxZoom>3 && approxZoom<4" class="zoom-btn dynamic" :class="{active: true}">{{ approxZoom.toFixed(1) }}x</button>
        <button class="zoom-btn" :class="{active: approxZoom===4}" @click="setZoom(4)">4x</button>
        <button v-if="approxZoom>4 && approxZoom<5" class="zoom-btn dynamic" :class="{active: true}">{{ approxZoom.toFixed(1) }}x</button>
        <button class="zoom-btn" :class="{active: approxZoom===5}" @click="setZoom(5)">5x</button>
      </div>
    </div>

    <div v-if="showArcDial" class="arc-dial-overlay" @click.self="closeArcDial" @mouseup="onArcEnd" @touchend="onArcEnd">
      <svg class="arc-dial" :viewBox="`0 0 ${dialWidth} ${dialHeight}`" @mousemove="onArcMove" @touchmove.passive="onArcTouch">
        <!-- 半圆弧黑色背景区域 -->
        <path :d="arcFillPath" fill="rgba(0,0,0,0.6)" />
        <!-- 半圆弧主刻度弧线 -->
        <path :d="arcStrokePath" stroke="rgba(255,255,255,0.6)" stroke-width="6" fill="none"/>
        <!-- 刻度线（更多密度） -->
        <g v-for="i in tickCount" :key="i">
          <line :x1="tickPos(i-1).x1" :y1="tickPos(i-1).y1" :x2="tickPos(i-1).x2" :y2="tickPos(i-1).y2"
                stroke="#fff" :stroke-width="(i-1)%10===0?2:1"/>
        </g>
        <!-- 当前指示点与文字 -->
        <circle :cx="dialPos.x" :cy="dialPos.y" r="8" fill="#07C160" />
        <text :x="dialWidth/2" :y="dialTextY" text-anchor="middle" fill="#fff" font-size="16">{{ approxZoom.toFixed(1) }}x</text>
      </svg>
    </div>


    <!-- 拍照/录像 切换文本按钮（位于拍摄按钮正上方） -->
    <div class="mode-toggle">
      <button class="mode-btn" @click="toggleMode">
        {{ mode === 'photo' ? '拍照' : (isRecording ? '录像中' : '录像') }}
      </button>
    </div>

    <!-- 底部操作栏：左关  中拍摄  右切换摄像头 -->
    <div class="bottom-controls">
      <button class="ctrl-btn ghost" @click="closePage">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <button class="capture-btn" :class="{ recording: isRecording }" @click="handleCapture">
        <svg v-if="mode === 'photo'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <svg v-else-if="isRecording" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      </button>
      <button class="ctrl-btn ghost" @click="switchCamera" aria-label="切换摄像头">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <polyline points="23 20 23 14 17 14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      </button>
    </div>



  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'


import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

// 状态
const isClosing = ref(false)
const closeCooldown = ref(false)

const mode = ref<'photo' | 'video'>('photo')
const isRecording = ref(false)
const facingMode = ref<'user' | 'environment'>('user')
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
let stream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

const initCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode.value },
      audio: true
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      updateZoomCaps()
      updateDialPosFromZoom()
      // 初始化后设置默认广角（按设备支持范围）
      setTimeout(() => {
        setZoom(Math.max(zoomMin.value, 0.8))
      }, 500)
    }
  } catch (e) {
    console.error('摄像头初始化失败', e)
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

const switchCamera = async () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  stopCamera()
  await initCamera()
}

const toggleMode = () => {
  if (isRecording.value) return
  mode.value = mode.value === 'photo' ? 'video' : 'photo'
}

const handleCapture = async () => {
  if (mode.value === 'photo') {
    // 拍照
    const video = videoRef.value
    const canvas = canvasRef.value
    if (!video || !canvas) return
    // 压缩：将最长边限制在 1920px 内，并适度降低质量以加速上传
    const maxSide = 1920
    const vw = video.videoWidth
    const vh = video.videoHeight
    const scale = Math.min(1, maxSide / Math.max(vw, vh))
    const targetW = Math.round(vw * scale)
    const targetH = Math.round(vh * scale)
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, targetW, targetH)
    const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.85)!)
    openPreview('photo', blob)
  } else {
    // 录像开始/停止
    if (!isRecording.value) {
      if (!stream) return
      recordedChunks = []

      // 优化录像设置，减小文件大小并确保包含音频（opus）
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 1000000, // 1Mbps，降低比特率
        audioBitsPerSecond: 128000   // 128kbps音频
      }

      // 如果不支持vp8+opus，则逐级降级
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          options.mimeType = 'video/webm;codecs=vp8'
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm'
          delete options.videoBitsPerSecond
          delete options.audioBitsPerSecond
        } else {
          delete (options as any).mimeType
        }
      }

      // 确保存在音频轨道
      if (stream && stream.getAudioTracks().length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          audioStream.getAudioTracks().forEach(track => stream!.addTrack(track))
        } catch (err) {
          console.warn('⚠️ 无法获取音频轨道，将录制无声视频:', err)
        }
      }

      mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
      mediaRecorder.onstop = () => {
        clearRecordTimer()
        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        console.log('录像完成，文件大小:', (blob.size / 1024 / 1024).toFixed(2) + 'MB')
        openPreview('video', blob)
        isRecording.value = false
      }
      mediaRecorder.start(1000) // 每秒收集一次数据
      isRecording.value = true
      recordSeconds.value = 0
      recordTimer = window.setInterval(() => {
        recordSeconds.value += 1
        if (recordSeconds.value >= 60) {
          mediaRecorder?.stop()
        }
      }, 1000)
    } else {
      mediaRecorder?.stop()
    }
  }
}

// 闪光灯
const showFlashMenu = ref(false)
const flashMode = ref<'always' | 'auto' | 'off' | 'on'>('auto')
const toggleFlashMenu = () => { showFlashMenu.value = !showFlashMenu.value }
const setFlashMode = async (mode: 'always' | 'auto' | 'off' | 'on') => {
  flashMode.value = mode
  showFlashMenu.value = false
  await applyTorch(mode === 'off' ? false : mode !== 'auto')
}
const applyTorch = async (on: boolean) => {
  try {
    const track = stream?.getVideoTracks()[0]
    // @ts-ignore - not all browsers type torch
    if (track && track.getCapabilities && track.getCapabilities().torch) {
      // @ts-ignore
      await track.applyConstraints({ advanced: [{ torch: on }] })
    }

  } catch (e) {
    console.warn('torch 不受支持', e)
  }
}

// 变焦 - 默认广角
const currentZoom = ref(0.8)
const approxZoom = ref(0.8)
const clamp = (v:number, min:number, max:number) => Math.min(max, Math.max(min, v))
const setZoom = async (z:number) => {
  const val = clamp(z, 0.8, 5)
  currentZoom.value = val
  approxZoom.value = Math.round(val * 10) / 10
  await applyZoom(val)
}
const applyZoom = async (z:number) => {
  try {
    const track = stream?.getVideoTracks()[0]
    if (!track) return
    // @ts-ignore
    const caps = track.getCapabilities ? track.getCapabilities() : null
    let applied = false
    if (caps && 'zoom' in caps) {
      // @ts-ignore
      const min = caps.zoom?.min ?? 1
      // @ts-ignore
      const max = caps.zoom?.max ?? 5
      const val = clamp(z, min, max)
      try {
        // 标准写法
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ zoom: val }] })
        applied = true
      } catch {}
      if (!applied) {
        try {
          // 一些实现支持直接放在顶层
          // @ts-ignore
          await track.applyConstraints({ zoom: val })
          applied = true
        } catch {}
      }
      // 同步实际设置值
      // @ts-ignore
      const settings = track.getSettings ? track.getSettings() : null
      if (settings && typeof settings.zoom === 'number') {
        approxZoom.value = Math.round(settings.zoom * 10) / 10
      }
      // 原生变焦成功时，清除数码变焦样式
      if (videoRef.value) videoRef.value.style.transform = ''
    }
    // 若原生未成功，启用数码变焦兜底（不改变容器大小，通过裁剪+缩放实现）
    if (!applied) {
      const val = Math.max(0.8, z)
      approxZoom.value = Math.round(val * 10) / 10
      if (videoRef.value) videoRef.value.style.transform = `scale(${approxZoom.value})`
    }
  } catch (e) {
    console.warn('应用变焦失败', e)
  }
}

// 长按打开弧形变焦刻度盘
const showArcDial = ref(false)
watch(showArcDial, (val) => { if (val) updateDialPosFromZoom() })

let pressTimer: number | null = null
const dialPos = ref({ x: 0, y: 0 })
const startZoomDialPress = () => {
  if (pressTimer) window.clearTimeout(pressTimer)
  pressTimer = window.setTimeout(() => { showArcDial.value = true }, 450)
}
const cancelZoomDialPress = () => {
  if (pressTimer) { window.clearTimeout(pressTimer); pressTimer = null }
}
const closeArcDial = () => { showArcDial.value = false }
const posToZoom = (clientX:number, clientY:number, el:SVGSVGElement) => {
  const rect = el.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  const cx = dialCx.value, cy = dialCy.value, r = dialRadius.value
  // 计算与圆心连线和+X轴的夹角（上半圆 0..π）
  let theta = Math.atan2(cy - y, x - cx) // -π..π
  theta = clamp(theta, 0, Math.PI)
  const t = 1 - theta / Math.PI // 左(0)..右(1)
  const z = zoomMin.value + t * (zoomMax.value - zoomMin.value)
  const ax = cx + r * Math.cos(theta)
  const ay = cy - r * Math.sin(theta)
  return { z: Math.round(z * 10) / 10, x: ax, y: ay }
}
const onArcMove = (e: MouseEvent) => {
  const svg = e.currentTarget as SVGSVGElement
  const { z, x, y } = posToZoom(e.clientX, e.clientY, svg)
  dialPos.value = { x, y }
  setZoom(z)
}
const onArcTouch = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!t) return
  const svg = e.currentTarget as SVGSVGElement
  const { z, x, y } = posToZoom(t.clientX, t.clientY, svg)
  dialPos.value = { x, y }

  setZoom(z)
}
const onArcEnd = (e: MouseEvent | TouchEvent) => {
  try {
    const svg = document.querySelector('.arc-dial') as SVGSVGElement | null
    if (svg) {
      let clientX = 0, clientY = 0
      // @ts-ignore
      if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
        // @ts-ignore
        const t = e.changedTouches && e.changedTouches[0]
        if (t) { clientX = t.clientX; clientY = t.clientY }
      } else {
        const m = e as MouseEvent
        clientX = m.clientX; clientY = m.clientY
      }
      const { z, x, y } = posToZoom(clientX, clientY, svg)
      dialPos.value = { x, y }
      setZoom(z)
    }
  } finally {
    showArcDial.value = false
  }
}


// 美颜
const beautyEnabled = ref(false)
const beautyLevel = ref(30)
const toggleBeauty = () => {
  beautyEnabled.value = !beautyEnabled.value
}
const applyBeautyFilter = () => {
  const v = beautyLevel.value / 100
  const b = 1 + 0.3 * v
  const c = 1 + 0.15 * v
  const s = 1 + 0.2 * v
  if (videoRef.value) {
    videoRef.value.style.filter = `brightness(${b}) contrast(${c}) saturate(${s})`
  }
}
// 设备变焦能力与弧形仪表尺寸（在 applyZoom 之后，模块作用域）
const zoomSupported = ref(false)
const zoomMin = ref(0.8)
const zoomMax = ref(5)

const dialWidth = ref(window.innerWidth)
const dialRadius = ref(Math.max(120, Math.floor(dialWidth.value / 2 - 16)))
const dialCx = computed(() => dialWidth.value / 2)
const dialCy = computed(() => dialRadius.value + 20)
const dialHeight = computed(() => dialCy.value + 20)
const dialTextY = computed(() => Math.max(24, dialCy.value - dialRadius.value * 0.6))

const arcStrokePath = computed(() => `M ${dialCx.value - dialRadius.value},${dialCy.value} A ${dialRadius.value},${dialRadius.value} 0 0 1 ${dialCx.value + dialRadius.value},${dialCy.value}`)
const arcFillPath = computed(() => `M ${dialCx.value - dialRadius.value},${dialCy.value} A ${dialRadius.value},${dialRadius.value} 0 0 1 ${dialCx.value + dialRadius.value},${dialCy.value} L ${dialCx.value - dialRadius.value},${dialCy.value} Z`)

const tickCount = 41
function tickPos(idx:number){
  const t = (tickCount <= 1) ? 0 : idx / (tickCount - 1)
  const theta = Math.PI * (1 - t)
  const rOuter = dialRadius.value
  const len = (idx % 10 === 0) ? 12 : (idx % 5 === 0 ? 8 : 5)
  const rInner = rOuter - len
  const cx = dialCx.value, cy = dialCy.value
  return {
    x1: cx + rInner * Math.cos(theta),
    y1: cy - rInner * Math.sin(theta),
    x2: cx + rOuter * Math.cos(theta),
    y2: cy - rOuter * Math.sin(theta)
  }
}

function updateZoomCaps(){
  const track = stream?.getVideoTracks()[0]
  // @ts-ignore
  const caps = track?.getCapabilities ? track.getCapabilities() : null
  if (caps && 'zoom' in caps) {
    zoomSupported.value = true
    // @ts-ignore
    zoomMin.value = caps.zoom?.min ?? 1
    // @ts-ignore
    zoomMax.value = caps.zoom?.max ?? Math.max(zoomMin.value, 1)
  } else {
    zoomSupported.value = false
  }
}

function updateDialPosFromZoom(){
  const range = Math.max(zoomMax.value - zoomMin.value, 0.0001)
  const t = (approxZoom.value - zoomMin.value) / range
  const theta = Math.PI * (1 - clamp(t, 0, 1))
  dialPos.value = {
    x: dialCx.value + dialRadius.value * Math.cos(theta),
    y: dialCy.value - dialRadius.value * Math.sin(theta)
  }
}

window.addEventListener('resize', () => {
  dialWidth.value = window.innerWidth
  dialRadius.value = Math.max(120, Math.floor(dialWidth.value / 2 - 16))
  updateDialPosFromZoom()
})


// 录像最长 60s
const recordSeconds = ref(0)
let recordTimer: number | null = null
const clearRecordTimer = () => {
  if (recordTimer) { window.clearInterval(recordTimer); recordTimer = null }
}

// 预览
const showPreview = ref(false)
const previewType = ref<'photo' | 'video'>('photo')
const previewBlob = ref<Blob | null>(null)
const previewUrl = ref('')
const previewVideoRef = ref<HTMLVideoElement>()
const openPreview = (type:'photo'|'video', blob: Blob) => {
  previewType.value = type
  previewBlob.value = blob
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(blob)
  showPreview.value = true
}
const retake = () => {
  showPreview.value = false
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }
}
const sendFromPreview = async () => {
  if (previewBlob.value) {
    const blob = previewBlob.value

    // 检查文件大小限制（100MB）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (blob.size > maxSize) {
      alert(`文件太大了！\n文件大小: ${(blob.size / 1024 / 1024).toFixed(1)}MB\n最大支持: 100MB\n\n请重新拍摄或选择较短的录像时间。`)
      return
    }

    // 使用全局store传递媒体，避免事件在路由切换时丢失
    appStore.setPendingCapturedMedia({ type: previewType.value, blob })
  }
  showPreview.value = false
  router.back()
}

const closePage = () => {
  // 防抖：在冷却期内直接忽略
  if (closeCooldown.value) return
  closeCooldown.value = true

  // 先淡出并暂停视频渲染，减少跳转抖动
  isClosing.value = true
  try { (videoRef.value as any)?.pause?.() } catch {}

  window.setTimeout(() => {
    stopCamera()
    router.back()
    // 结束后稍作冷却，避免重复触发
    window.setTimeout(() => { closeCooldown.value = false }, 400)
  }, 150)
}

watch(beautyLevel, () => { if (beautyEnabled.value) applyBeautyFilter() })
watch(beautyEnabled, (val) => {
  if (val) applyBeautyFilter()
  else if (videoRef.value) videoRef.value.style.filter = ''
})

onMounted(() => { initCamera() })
onUnmounted(() => { stopCamera() })
</script>

<style scoped>
.chat-camera-page {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .18s ease;
  will-change: opacity;
  backface-visibility: hidden;
}
.chat-camera-page.closing { opacity: 0; pointer-events: none; }

.camera-preview {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  transform-origin: center center;
}

.mode-toggle {
  position: absolute;
  bottom: 140px; /* 增加与拍摄按钮的距离 */
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  justify-content: center;
}
.mode-btn {
  background: rgba(0,0,0,0.4);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 14px;
}

.bottom-controls {
  position: absolute;
  bottom: 40px; /* 底部区域按钮 */
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px; /* 左右边距 20px */
  column-gap: 24px;
}
/* 左关闭贴左、右切换贴右，确保与屏幕边距为 20px */
.bottom-controls .ctrl-btn:first-of-type{justify-self:start}
.bottom-controls .ctrl-btn:last-of-type{justify-self:end}

.ctrl-btn.ghost {
  background: rgba(0,0,0,0.35);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 18px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flash-control{position:absolute;top:16px;right:16px;z-index:5}
.flash-btn{width:36px;height:36px;border-radius:18px;background:rgba(0,0,0,0.4);color:#fff;border:1px solid rgba(255,255,255,0.5)}
.flash-menu{position:absolute;top:0;right:48px;display:flex;gap:8px;background:rgba(0,0,0,0.35);padding:6px 8px;border-radius:18px;border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(6px);animation:slideLeft .16s ease-out}
.flash-menu button{color:#fff;background:transparent;border:1px solid transparent;padding:6px;border-radius:12px;font-size:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center}
.flash-menu button.active{border-color:#07C160;background:rgba(7,193,96,0.2)}
@keyframes slideLeft{from{opacity:.0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}

.zoom-container{position:absolute;left:50%;transform:translateX(-50%);width:calc(100vw - 200px);bottom:190px;display:flex;gap:15px;justify-content:center;z-index:4}
.zoom-btn{min-width:auto;height:28px;padding:0;border-radius:14px;background:transparent;color:#fff;border:none;font-size:14px;font-weight:500}
.zoom-btn.active{color:#07C160}


.arc-dial-overlay{position:absolute;inset:0;background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:150px;z-index:6}
.zoom-bg{display:flex;gap:15px;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(6px);height:30px;padding:0 8px;border-radius:18px}
.zoom-hint{margin-top:6px;color:rgba(255,255,255,0.7);font-size:12px;text-align:center;width:100%}

.arc-dial{width:100vw;height:auto}

.beauty-panel{position:absolute;left:20px;bottom:190px;z-index:5;display:flex;flex-direction:row;align-items:center;gap:12px}
.beauty-toggle{width:25px;height:25px;border-radius:50%;border:none;background:rgba(0,0,0,0.35);color:#fff;display:flex;align-items:center;justify-content:center;padding:0}
.beauty-toggle.on{border:none;background:rgba(0,0,0,0.5);color:#07C160}
.beauty-slider{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(6px);padding:8px 10px;border-radius:16px}
.beauty-slider input[type=range]{width:160px}
.beauty-value{color:#fff;font-size:12px}

.preview-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10}
.preview-content{max-width:92vw;max-height:80vh;display:flex;flex-direction:column;gap:12px}
.preview-media{max-width:92vw;max-height:70vh;border-radius:8px}

.preview-btn{position:absolute;bottom:40px;width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,0.8);color:#fff;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px)}
.retake-btn{left:40px;background:rgba(0,0,0,0.6)}
.retake-btn:hover{background:rgba(0,0,0,0.8)}
.send-btn{right:40px;background:rgba(7,193,96,0.8)}
.send-btn:hover{background:rgba(7,193,96,1)}

/* 美化拍摄按钮（外圈白色边框，录制时红色填充） */
.capture-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: transparent;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.25);
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.capture-btn.recording {
  background: #ff3b30;
  border-color: #ff3b30;
  color: #fff;
}
</style>


<template>
  <div class="wechat-camera">
    <!-- 视频预览 -->
    <video
      ref="videoRef"
      class="camera-preview"
      autoplay
      muted
      playsinline
    ></video>
    
    <!-- 画布用于拍照 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>

    <!-- 顶部控制栏 -->
    <div class="top-controls">
      <button class="close-btn" @click="$emit('close')">
        <iconify-icon icon="material-symbols:close" width="24" style="color: white;" />
      </button>
      
      <!-- 右侧功能按钮 -->
      <div class="right-controls">
        <button class="side-btn" @click="switchCamera">
          <iconify-icon icon="material-symbols:flip-camera-ios" width="20" style="color: white;" />
          <span class="side-btn-label">翻转</span>
        </button>
        <button class="side-btn" @click="toggleFilter">
          <iconify-icon icon="material-symbols:filter" width="20" style="color: white;" />
          <span class="side-btn-label">滤镜</span>
        </button>
        <button class="side-btn" @click="toggleSticker">
          <iconify-icon icon="material-symbols:emoji-emotions" width="20" style="color: white;" />
          <span class="side-btn-label">贴纸</span>
        </button>
      </div>
    </div>

    <!-- 拍摄按钮 -->
    <div class="capture-area">
      <div class="capture-container">
        <!-- 进度圆环 -->
        <svg v-if="isRecording" class="progress-ring" width="90" height="90">
          <circle
            class="progress-ring-background"
            stroke="rgba(255, 255, 255, 0.3)"
            stroke-width="6"
            fill="transparent"
            r="42"
            cx="45"
            cy="45"
          />
          <circle
            class="progress-ring-circle"
            stroke="#ff4757"
            stroke-width="6"
            fill="transparent"
            r="42"
            cx="45"
            cy="45"
            :style="{
              strokeDasharray: `${2 * Math.PI * 42}`,
              strokeDashoffset: progressOffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '45px 45px'
            }"
          />
        </svg>

        <button
          class="capture-btn"
          :class="{
            recording: isRecording,
            pressing: isPressing
          }"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @click="handleClick"
        >
          <div class="capture-inner"></div>
        </button>
      </div>
    </div>

    <!-- 底部功能栏 -->
    <div class="bottom-controls">
      <!-- 相册按钮 -->
      <button class="control-btn" @click="$emit('select-album')">
        <iconify-icon icon="heroicons:photo" width="24" style="color: white;" />
        <span>相册</span>
      </button>

      <!-- 补光按钮 -->
      <button
        class="control-btn"
        :class="{ active: flashEnabled }"
        @click="toggleFlash"
      >
        <iconify-icon
          :icon="flashEnabled ? 'material-symbols:flash-on' : 'material-symbols:flash-off'"
          width="24"
          style="color: white;"
        />
        <span>补光</span>
      </button>

      <!-- 美白按钮 -->
      <button
        class="control-btn"
        :class="{ active: beautyEnabled }"
        @click="toggleBeauty"
      >
        <iconify-icon icon="material-symbols:face-retouching-natural" width="24" style="color: white;" />
        <span>美白</span>
      </button>
    </div>

    <!-- 美白功能已简化，不再显示调节面板 -->

    <!-- 录制时长显示 -->
    <div v-if="isRecording" class="recording-timer">
      {{ formatTime(recordingTime) }}
    </div>

    <!-- 滤镜选择面板 -->
    <div v-if="showFilterPanel" class="filter-panel-overlay" @click="closeFilterPanel">
      <div class="filter-panel" @click.stop>
        <div class="panel-header">
          <h3>选择滤镜</h3>
          <button @click="showFilterPanel = false">
            <iconify-icon icon="material-symbols:close" width="20" style="color: white;" />
          </button>
        </div>
        <div class="filter-grid">
          <button
            v-for="filter in filterList"
            :key="filter.id"
            class="filter-item"
            :class="{ active: currentFilter === filter.id }"
            @click="applyFilter(filter)"
          >
            <div class="filter-preview" :style="{ filter: filter.filter }"></div>
            <span>{{ filter.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 贴纸选择面板 -->
    <div v-if="showStickerPanel" class="sticker-panel-overlay" @click="closeStickerPanel">
      <div class="sticker-panel" @click.stop>
        <div class="panel-header">
          <h3>选择贴纸</h3>
          <button @click="showStickerPanel = false">
            <iconify-icon icon="material-symbols:close" width="20" style="color: white;" />
          </button>
        </div>
        <div class="sticker-grid">
          <button
            v-for="sticker in stickerList"
            :key="sticker.id"
            class="sticker-item"
            :class="{ active: currentSticker === sticker.id }"
            @click="applySticker(sticker)"
          >
            <div class="sticker-preview">{{ sticker.emoji }}</div>
            <span>{{ sticker.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 拍摄完成预览界面 -->
    <div v-if="capturedMedia" class="preview-overlay">
      <!-- 顶部背景音乐选择 -->
      <div v-if="capturedMedia.type === 'video'" class="top-music-bar">
        <button class="music-btn" @click="showMusicSelector = !showMusicSelector">
          <iconify-icon icon="material-symbols:music-note" width="20" style="color: white;" />
          <span>{{ selectedMusic ? selectedMusic.name : '背景音乐' }}</span>
          <iconify-icon icon="material-symbols:keyboard-arrow-down" width="16" style="color: white;" />
        </button>
      </div>

      <!-- 背景音乐选择面板 -->
      <div v-if="showMusicSelector && capturedMedia.type === 'video'" class="music-selector">
        <div class="music-header">
          <h3>选择背景音乐</h3>
          <button @click="showMusicSelector = false">
            <iconify-icon icon="material-symbols:close" width="20" />
          </button>
        </div>
        <div class="music-list">
          <div
            v-for="music in backgroundMusicList"
            :key="music.id"
            class="music-item"
            :class="{ active: selectedMusic?.id === music.id }"
            @click="selectMusic(music)"
          >
            <div class="music-info">
              <div class="music-name">{{ music.name }}</div>
              <div class="music-artist">{{ music.artist }}</div>
              <div class="music-license" v-if="music.license">{{ music.license }}</div>
            </div>
            <div class="music-actions">
              <button @click.stop="previewMusic(music)" class="preview-btn">
                <iconify-icon
                  :icon="currentPreviewMusic?.id === music.id && isPreviewPlaying ? 'material-symbols:pause' : 'material-symbols:play-arrow'"
                  width="16"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览内容 -->
      <div class="preview-content" @click="addTextAtPosition">
        <img v-if="capturedMedia.type === 'photo'" :src="capturedMedia.url" class="preview-image" />
        <video
          v-else
          :src="capturedMedia.url"
          class="preview-video"
          autoplay
          loop
          muted
          playsinline
        ></video>

        <!-- 文字覆盖层 -->
        <div
          v-for="text in videoTexts"
          :key="text.id"
          class="text-overlay"
          :style="{
            left: text.x + 'px',
            top: text.y + 'px',
            fontSize: text.size + 'px',
            color: text.color,
            fontWeight: text.style === 'bold' ? 'bold' : 'normal',
            fontStyle: text.style === 'italic' ? 'italic' : 'normal',
            textShadow: text.style === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
            WebkitTextStroke: text.style === 'outline' ? '1px black' : 'none'
          }"
          @mousedown="startDrag($event, text)"
          @touchstart.passive="startDrag($event, text)"
          @click.stop="editText(text)"
        >
          {{ text.content }}
        </div>

        <!-- 贴纸覆盖层 -->
        <div
          v-if="currentSticker !== 'none'"
          class="sticker-overlay"
          :style="{
            left: '50%',
            top: '30%',
            transform: 'translate(-50%, -50%)'
          }"
        >
          {{ stickerList.find(s => s.id === currentSticker)?.emoji }}
        </div>
      </div>

      <!-- 顶部关闭按钮 -->
      <div class="preview-top-controls">
        <button class="close-btn" @click="cancelCapture">
          <iconify-icon icon="material-symbols:close" width="20" style="color: white;" />
        </button>
      </div>

      <!-- 编辑工具栏 -->
      <div v-if="capturedMedia.type === 'video'" class="edit-toolbar">
        <button class="edit-tool-btn" @click="showTextEditor = true">
          <iconify-icon icon="material-symbols:text-fields" width="20" />
          <span>文字</span>
        </button>
        <button class="edit-tool-btn" @click="cropVideo">
          <iconify-icon icon="material-symbols:crop" width="20" />
          <span>裁剪</span>
        </button>
        <button class="edit-tool-btn" @click="showFilterEditor = true">
          <iconify-icon icon="material-symbols:filter" width="20" />
          <span>滤镜</span>
        </button>
      </div>

      <!-- 底部发送按钮 -->
      <div class="preview-bottom-controls">
        <button class="send-btn-large" @click="sendMedia">
          <iconify-icon icon="material-symbols:send" width="24" style="color: white;" />
          <span>发送</span>
        </button>
      </div>

      <!-- 文字编辑器 -->
      <div v-if="showTextEditor" class="text-editor-modal">
        <div class="text-editor-content">
          <div class="text-editor-header">
            <h3>添加文字</h3>
            <button @click="showTextEditor = false">
              <iconify-icon icon="material-symbols:close" width="20" />
            </button>
          </div>
          <div class="text-input-section">
            <textarea v-model="textContent" placeholder="输入文字内容" class="text-input"></textarea>
          </div>
          <div class="text-style-section">
            <div class="style-row">
              <label>字体大小:</label>
              <input v-model="textSize" type="range" min="12" max="48" class="size-slider" />
              <span>{{ textSize }}px</span>
            </div>
            <div class="style-row">
              <label>文字颜色:</label>
              <input v-model="textColor" type="color" class="color-picker" />
            </div>
            <div class="style-row">
              <label>艺术字:</label>
              <select v-model="textStyle" class="style-select">
                <option value="normal">普通</option>
                <option value="bold">粗体</option>
                <option value="italic">斜体</option>
                <option value="shadow">阴影</option>
                <option value="outline">描边</option>
              </select>
            </div>
          </div>
          <div class="text-editor-actions">
            <button @click="addTextToVideo" class="confirm-btn">确定</button>
            <button @click="showTextEditor = false" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 裁剪编辑器 -->
      <div v-if="showCropEditor" class="crop-editor-modal">
        <div class="crop-editor-content">
          <div class="crop-editor-header">
            <h3>视频裁剪</h3>
            <button @click="showCropEditor = false">
              <iconify-icon icon="material-symbols:close" width="20" />
            </button>
          </div>
          <div class="crop-options">
            <div class="crop-ratio-section">
              <label>裁剪比例:</label>
              <div class="ratio-buttons">
                <button class="ratio-btn" @click="setCropRatio('1:1')">1:1</button>
                <button class="ratio-btn" @click="setCropRatio('4:3')">4:3</button>
                <button class="ratio-btn" @click="setCropRatio('16:9')">16:9</button>
                <button class="ratio-btn" @click="setCropRatio('9:16')">9:16</button>
              </div>
            </div>
          </div>
          <div class="crop-editor-actions">
            <button @click="applyCrop" class="confirm-btn">确定</button>
            <button @click="showCropEditor = false" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>


    </div>

    <!-- 视频预览编辑器 -->
    <VideoPreviewEditor
      v-if="showVideoEditor && currentVideoData"
      :video-url="currentVideoData.url"
      :video-blob="currentVideoData.blob"
      @cancel="handleVideoEditorCancel"
      @send="handleVideoEditorSend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import VideoPreviewEditor from './VideoPreviewEditor.vue'
import { useAppStore } from '../../../shared/stores/appStore'

// Props & Emits
interface Props {
  showAlbumButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAlbumButton: false
})

const emit = defineEmits(['close', 'capture', 'select-album'])

// Store
const appStore = useAppStore()

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const isRecording = ref(false)
const recordingTime = ref(0)
const currentCamera = ref<'user' | 'environment'>('user')
const flashEnabled = ref(false)
const beautyEnabled = ref(false)
const beautyIntensity = ref(50)
const showVideoEditor = ref(false)
const currentVideoData = ref<{ url: string, blob: Blob } | null>(null)

// 拍摄媒体相关
const capturedMedia = ref<{
  type: 'photo' | 'video'
  url: string
  blob: Blob
} | null>(null)

// 背景音乐相关
const showMusicSelector = ref(false)
const selectedMusic = ref<any>(null)
const currentPreviewMusic = ref<any>(null)
const isPreviewPlaying = ref(false)
const previewAudio = ref<any>(null)

// 视频编辑相关
const showTextEditor = ref(false)
const showCropEditor = ref(false)
const showFilterEditor = ref(false)
const textContent = ref('')
const textSize = ref(24)
const textColor = ref('#ffffff')
const textStyle = ref('normal')
const videoTexts = ref<any[]>([])

// 背景音乐列表 - 中文流行歌曲 (模拟播放，避免版权问题)
const backgroundMusicList = ref([
  {
    id: 'music_001',
    name: '晴天',
    artist: '周杰伦',
    duration: 45,
    description: '经典怀旧，适合青春回忆视频',
    license: '模拟播放'
  },
  {
    id: 'music_002',
    name: '稻香',
    artist: '周杰伦',
    duration: 38,
    description: '清新自然，适合田园风光视频',
    license: '模拟播放'
  },
  {
    id: 'music_003',
    name: '孤勇者',
    artist: '陈奕迅',
    duration: 52,
    description: '励志热血，适合燃向视频',
    license: '模拟播放'
  },
  {
    id: 'music_004',
    name: '起风了',
    artist: '买辣椒也用券',
    duration: 41,
    description: '治愈系，适合风景视频',
    license: '模拟播放'
  },
  {
    id: 'music_005',
    name: '夜曲',
    artist: '周杰伦',
    duration: 48,
    description: '浪漫夜晚，适合夜景视频',
    license: '模拟播放'
  },
  {
    id: 'music_006',
    name: '海阔天空',
    artist: 'Beyond',
    duration: 35,
    description: '励志经典，适合激励视频',
    license: '模拟播放'
  },
  {
    id: 'music_007',
    name: '搀扶',
    artist: '周深',
    duration: 44,
    description: '温暖治愈，适合温馨视频',
    license: '模拟播放'
  },
  {
    id: 'music_008',
    name: '本草纲目',
    artist: '周杰伦',
    duration: 39,
    description: '经典流行，适合各种视频',
    license: '模拟播放'
  },
  {
    id: 'music_more',
    name: '更多音乐',
    artist: '选择外部音乐',
    duration: 0,
    description: '从设备中选择音乐文件',
    isExternal: true
  }
])

// 将Blob转换为Data URL
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 摄像头流
let stream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordingTimer: any = null

// 音效管理
let currentAudio: HTMLAudioElement | null = null

// 移除特效相关数据，改为补光和美白功能

// 移除特效计算属性

// 方法
const initCamera = async () => {
  try {
    console.log('🎥 开始初始化摄像头...')
    const startTime = Date.now()

    // 优化的摄像头配置
    const constraints = {
      video: {
        facingMode: currentCamera.value,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }

    stream = await navigator.mediaDevices.getUserMedia(constraints)

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      // 等待视频加载完成
      await new Promise((resolve) => {
        videoRef.value!.onloadedmetadata = resolve
      })
    }

    const initTime = Date.now() - startTime
    console.log(`✅ 摄像头初始化完成，耗时: ${initTime}ms`)
  } catch (error: any) {
    // 静默处理摄像头初始化失败
    // 尝试降级配置
    try {
      console.log('🔄 尝试降级配置...')
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera.value },
        audio: true
      })

      if (videoRef.value) {
        videoRef.value.srcObject = stream
      }
      console.log('✅ 降级配置成功')
    } catch (fallbackError: any) {
      // 静默处理降级失败
      // 摄像头可能被占用、权限未授予、或设备不支持
      // 不在控制台输出错误，避免干扰用户
    }
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
}

const switchCamera = async () => {
  currentCamera.value = currentCamera.value === 'user' ? 'environment' : 'user'
  stopCamera()
  await initCamera()
}

const toggleFlash = async () => {
  if (!stream) return

  try {
    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()

    if ((capabilities as any).torch) {
      flashEnabled.value = !flashEnabled.value
      await track.applyConstraints({
        advanced: [{ torch: flashEnabled.value } as any]
      })
      console.log('🔦 聊天摄像头补光灯', flashEnabled.value ? '开启' : '关闭')
    } else {
      // 如果设备不支持闪光灯，使用屏幕补光
      if (flashEnabled.value) {
        // 关闭屏幕补光
        document.body.style.background = ''
        flashEnabled.value = false
        console.log('🔦 屏幕补光关闭')
      } else {
        // 开启屏幕补光
        document.body.style.background = 'white'
        flashEnabled.value = true
        console.log('🔦 屏幕补光开启，拍摄完成后手动关闭')
      }
    }
  } catch (error) {
    console.error('补光功能失败:', error)
  }
}

// 移除特效选择方法

// 移除音效播放方法

// 移除本地音效方法

// 应用特效
const applyEffect = (effectId: string) => {
  // 清除之前的特效
  clearEffect()

  if (effectId === 'none') return

  // 应用视频滤镜特效
  applyVideoFilter(effectId)

  // 根据特效ID创建对应的动画覆盖层
  switch (effectId) {
    case 'fighter':
      createFighterEffect()
      break
    case 'rocket':
      createRocketEffect()
      break
    case 'car':
      createCarEffect()
      break
    case 'motorcycle':
      createMotorcycleEffect()
      break
    case 'heart':
      createHeartRain()
      break
    case 'flower':
      createFlowerPetals()
      break
    case 'star':
      createStars()
      break
    case 'confetti':
      createConfetti()
      break
    default:
      console.log('特效暂未实现:', effectId)
  }
}

// 应用视频滤镜特效
const applyVideoFilter = (effectId: string) => {
  const video = videoRef.value
  if (!video) return

  // 移除之前的滤镜
  video.style.filter = ''

  // 根据特效应用CSS滤镜
  switch (effectId) {
    case 'fighter':
      video.style.filter = 'sepia(0.5) contrast(1.2) brightness(1.1)'
      break
    case 'rocket':
      video.style.filter = 'hue-rotate(30deg) saturate(1.5) brightness(1.2)'
      break
    case 'car':
      video.style.filter = 'contrast(1.3) brightness(0.9) saturate(1.2)'
      break
    case 'motorcycle':
      video.style.filter = 'grayscale(0.3) contrast(1.4) brightness(0.8)'
      break
    case 'heart':
      video.style.filter = 'hue-rotate(300deg) saturate(1.3) brightness(1.1)'
      break
    case 'flower':
      video.style.filter = 'hue-rotate(60deg) saturate(1.4) brightness(1.1)'
      break
    case 'star':
      video.style.filter = 'brightness(1.3) contrast(1.1) saturate(1.2)'
      break
    case 'confetti':
      video.style.filter = 'hue-rotate(180deg) saturate(1.5) brightness(1.2)'
      break
    default:
      video.style.filter = ''
  }
}

// 清除特效
const clearEffect = () => {
  const existingEffects = document.querySelectorAll('.effect-animation')
  existingEffects.forEach(el => el.remove())

  // 清除视频滤镜
  const video = videoRef.value
  if (video) {
    video.style.filter = ''
  }

  // 停止音效
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

// 战斗机驾驶特效 - 真实载人飞行
const createFighterEffect = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation fighter-flight'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  // 创建完整的战斗机飞行场景
  const flightScene = document.createElement('div')
  flightScene.innerHTML = `
    <div class="flight-environment">
      <!-- 天空背景 -->
      <div class="sky-gradient"></div>

      <!-- 战斗机机身 -->
      <div class="fighter-jet">
        <div class="jet-nose"></div>
        <div class="jet-body"></div>
        <div class="jet-wings">
          <div class="wing-left"></div>
          <div class="wing-right"></div>
        </div>
        <div class="jet-tail"></div>
        <div class="jet-engines">
          <div class="engine-flame engine-left"></div>
          <div class="engine-flame engine-right"></div>
        </div>
      </div>

      <!-- 驾驶舱玻璃反光 -->
      <div class="cockpit-glass"></div>

      <!-- 飞行轨迹 -->
      <div class="flight-trail"></div>

      <!-- 云层 -->
      <div class="cloud-layer">
        <div class="cloud-big cloud-1"></div>
        <div class="cloud-big cloud-2"></div>
        <div class="cloud-small cloud-3"></div>
        <div class="cloud-small cloud-4"></div>
      </div>

      <!-- 速度线条 -->
      <div class="speed-indicators">
        <div class="speed-line speed-1"></div>
        <div class="speed-line speed-2"></div>
        <div class="speed-line speed-3"></div>
        <div class="speed-line speed-4"></div>
      </div>

      <!-- 高度和速度显示 -->
      <div class="flight-hud">
        <div class="altitude">高度: 8000m</div>
        <div class="speed">速度: 800km/h</div>
      </div>
    </div>
  `

  effectContainer.appendChild(flightScene)
  container.appendChild(effectContainer)

  // 添加战斗机飞行特效CSS
  if (!document.querySelector('#fighter-effect-style')) {
    const style = document.createElement('style')
    style.id = 'fighter-effect-style'
    style.textContent = `
      .flight-environment {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .sky-gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom,
          #87CEEB 0%,
          #98D8E8 30%,
          #B0E0E6 60%,
          #E0F6FF 100%);
        opacity: 0.7;
        animation: skyShift 10s ease-in-out infinite alternate;
      }

      .fighter-jet {
        position: absolute;
        bottom: 20%;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 100px;
        animation: jetFly 8s ease-in-out infinite;
      }

      .jet-nose {
        position: absolute;
        top: 40%;
        left: 0;
        width: 30px;
        height: 20px;
        background: linear-gradient(45deg, #666, #999);
        border-radius: 50% 0 0 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }

      .jet-body {
        position: absolute;
        top: 35%;
        left: 25px;
        width: 100px;
        height: 30px;
        background: linear-gradient(to right, #777, #aaa, #777);
        border-radius: 15px;
        box-shadow: 0 3px 15px rgba(0,0,0,0.4);
      }

      .jet-wings {
        position: absolute;
        top: 45%;
        left: 60px;
        width: 80px;
        height: 10px;
      }

      .wing-left, .wing-right {
        position: absolute;
        width: 40px;
        height: 25px;
        background: linear-gradient(45deg, #555, #888);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }

      .wing-left {
        top: -15px;
        left: 0;
        transform: rotate(-20deg);
        border-radius: 0 15px 15px 0;
      }

      .wing-right {
        top: -15px;
        right: 0;
        transform: rotate(20deg);
        border-radius: 15px 0 0 15px;
      }

      .jet-tail {
        position: absolute;
        top: 38%;
        right: 0;
        width: 25px;
        height: 24px;
        background: linear-gradient(135deg, #666, #999);
        clip-path: polygon(0 0, 100% 40%, 100% 60%, 0 100%);
      }

      .jet-engines {
        position: absolute;
        top: 42%;
        right: -5px;
        width: 30px;
        height: 16px;
      }

      .engine-flame {
        position: absolute;
        width: 15px;
        height: 8px;
        background: linear-gradient(to right, #ff4500, #ff6500, #ff8500);
        border-radius: 0 50% 50% 0;
        animation: engineFlame 0.3s ease-in-out infinite alternate;
      }

      .engine-left {
        top: 0;
        right: 0;
      }

      .engine-right {
        bottom: 0;
        right: 0;
      }

      .cockpit-glass {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 60px;
        background: linear-gradient(135deg,
          rgba(255,255,255,0.3) 0%,
          rgba(255,255,255,0.1) 50%,
          rgba(255,255,255,0.3) 100%);
        border-radius: 50%;
        animation: glassReflection 3s ease-in-out infinite;
      }

      .flight-trail {
        position: absolute;
        bottom: 15%;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 200px;
        background: linear-gradient(to bottom,
          rgba(255,255,255,0.8),
          rgba(255,255,255,0.3),
          transparent);
        animation: trailMove 2s ease-in-out infinite;
      }

      .cloud-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .cloud-big, .cloud-small {
        position: absolute;
        background: rgba(255,255,255,0.8);
        border-radius: 50px;
        animation: cloudFloat 12s linear infinite;
      }

      .cloud-big {
        width: 80px;
        height: 40px;
      }

      .cloud-small {
        width: 50px;
        height: 25px;
      }

      .cloud-1 {
        top: 10%;
        animation-delay: 0s;
      }

      .cloud-2 {
        top: 60%;
        animation-delay: -4s;
      }

      .cloud-3 {
        top: 30%;
        animation-delay: -8s;
      }

      .cloud-4 {
        top: 80%;
        animation-delay: -2s;
      }

      .speed-indicators {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .speed-line {
        position: absolute;
        width: 2px;
        height: 100%;
        background: linear-gradient(to bottom,
          transparent,
          rgba(255,255,255,0.6),
          transparent);
        animation: speedRush 0.8s linear infinite;
      }

      .speed-1 { left: 20%; animation-delay: 0s; }
      .speed-2 { left: 40%; animation-delay: 0.2s; }
      .speed-3 { left: 60%; animation-delay: 0.4s; }
      .speed-4 { left: 80%; animation-delay: 0.6s; }

      .flight-hud {
        position: absolute;
        top: 10%;
        right: 10%;
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        text-shadow: 0 0 5px #00ff00;
      }

      .altitude, .speed {
        margin-bottom: 5px;
        animation: hudFlicker 2s ease-in-out infinite alternate;
      }

      @keyframes skyShift {
        0% { filter: hue-rotate(0deg) brightness(1); }
        100% { filter: hue-rotate(20deg) brightness(1.2); }
      }

      @keyframes jetFly {
        0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
        25% { transform: translateX(-50%) translateY(-10px) rotate(-2deg); }
        75% { transform: translateX(-50%) translateY(10px) rotate(2deg); }
      }

      @keyframes engineFlame {
        0% { transform: scaleX(1); opacity: 1; }
        100% { transform: scaleX(1.5); opacity: 0.7; }
      }

      @keyframes glassReflection {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.7; }
      }

      @keyframes trailMove {
        0%, 100% { opacity: 0.8; transform: translateX(-50%) scaleY(1); }
        50% { opacity: 0.4; transform: translateX(-50%) scaleY(1.2); }
      }

      @keyframes cloudFloat {
        0% { left: -10%; }
        100% { left: 110%; }
      }

      @keyframes speedRush {
        0% { left: -5%; opacity: 0; }
        50% { opacity: 1; }
        100% { left: 105%; opacity: 0; }
      }

      @keyframes hudFlicker {
        0% { opacity: 0.8; }
        100% { opacity: 1; text-shadow: 0 0 10px #00ff00; }
      }
    `
    document.head.appendChild(style)
  }
}

// 火箭飞行特效
const createRocketEffect = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation rocket-space'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    background: linear-gradient(to bottom, #000011, #000033);
  `

  // 创建太空环境
  const space = document.createElement('div')
  space.innerHTML = `
    <div class="space-environment">
      <!-- 星星 -->
      <div class="stars">
        <div class="star star-1">⭐</div>
        <div class="star star-2">✨</div>
        <div class="star star-3">⭐</div>
        <div class="star star-4">✨</div>
        <div class="star star-5">⭐</div>
      </div>
      <!-- 火箭窗口框架 -->
      <div class="rocket-window"></div>
      <!-- 火焰效果 -->
      <div class="rocket-flames">
        <div class="flame flame-1">🔥</div>
        <div class="flame flame-2">🔥</div>
        <div class="flame flame-3">🔥</div>
      </div>
      <!-- 地球 -->
      <div class="earth">🌍</div>
    </div>
  `

  effectContainer.appendChild(space)
  container.appendChild(effectContainer)

  // 添加火箭特效CSS
  if (!document.querySelector('#rocket-effect-style')) {
    const style = document.createElement('style')
    style.id = 'rocket-effect-style'
    style.textContent = `
      .space-environment {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .stars {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .star {
        position: absolute;
        animation: starTwinkle 2s ease-in-out infinite alternate;
      }

      .star-1 { top: 10%; left: 20%; animation-delay: 0s; }
      .star-2 { top: 20%; right: 15%; animation-delay: 0.5s; }
      .star-3 { top: 60%; left: 10%; animation-delay: 1s; }
      .star-4 { top: 70%; right: 25%; animation-delay: 1.5s; }
      .star-5 { top: 40%; left: 80%; animation-delay: 2s; }

      .rocket-window {
        position: absolute;
        top: 15%;
        left: 10%;
        right: 10%;
        bottom: 25%;
        border: 4px solid #silver;
        border-radius: 50%;
        box-shadow: inset 0 0 30px rgba(255,255,255,0.3);
      }

      .rocket-flames {
        position: absolute;
        bottom: 5%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
      }

      .flame {
        font-size: 25px;
        animation: flameFlicker 0.5s ease-in-out infinite alternate;
      }

      .flame-1 { animation-delay: 0s; }
      .flame-2 { animation-delay: 0.2s; }
      .flame-3 { animation-delay: 0.4s; }

      .earth {
        position: absolute;
        bottom: -20%;
        right: -10%;
        font-size: 80px;
        animation: earthRotate 10s linear infinite;
      }

      @keyframes starTwinkle {
        0% { opacity: 0.3; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.2); }
      }

      @keyframes flameFlicker {
        0% { transform: scale(1) translateY(0); }
        100% { transform: scale(1.2) translateY(-5px); }
      }

      @keyframes earthRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
}

// 跑车驾驶特效
const createCarEffect = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation car-driving'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  const carInterior = document.createElement('div')
  carInterior.innerHTML = `
    <div class="car-dashboard">
      <!-- 方向盘 -->
      <div class="steering-wheel">🚗</div>
      <!-- 仪表盘 -->
      <div class="car-gauges">
        <div class="speedometer">📊</div>
        <div class="fuel-gauge">⛽</div>
      </div>
      <!-- 道路效果 -->
      <div class="road-lines">
        <div class="road-line line-1"></div>
        <div class="road-line line-2"></div>
        <div class="road-line line-3"></div>
      </div>
      <!-- 速度线条 -->
      <div class="speed-lines">
        <div class="speed-line"></div>
        <div class="speed-line"></div>
        <div class="speed-line"></div>
      </div>
    </div>
  `

  effectContainer.appendChild(carInterior)
  container.appendChild(effectContainer)

  if (!document.querySelector('#car-effect-style')) {
    const style = document.createElement('style')
    style.id = 'car-effect-style'
    style.textContent = `
      .car-dashboard {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .steering-wheel {
        position: absolute;
        bottom: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 40px;
        animation: steeringMove 4s ease-in-out infinite;
      }

      .car-gauges {
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
      }

      .speedometer, .fuel-gauge {
        font-size: 25px;
        animation: gaugeGlow 2s ease-in-out infinite alternate;
      }

      .road-lines {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30%;
      }

      .road-line {
        position: absolute;
        width: 4px;
        height: 20px;
        background: white;
        left: 50%;
        transform: translateX(-50%);
        animation: roadMove 1s linear infinite;
      }

      .line-1 { animation-delay: 0s; }
      .line-2 { animation-delay: 0.3s; }
      .line-3 { animation-delay: 0.6s; }

      .speed-lines {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .speed-line {
        position: absolute;
        width: 2px;
        height: 100%;
        background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), transparent);
        animation: speedLineMove 0.5s linear infinite;
      }

      .speed-line:nth-child(1) { left: 20%; animation-delay: 0s; }
      .speed-line:nth-child(2) { left: 50%; animation-delay: 0.2s; }
      .speed-line:nth-child(3) { left: 80%; animation-delay: 0.4s; }

      @keyframes steeringMove {
        0%, 100% { transform: translateX(-50%) rotate(-5deg); }
        50% { transform: translateX(-50%) rotate(5deg); }
      }

      @keyframes gaugeGlow {
        0% { opacity: 0.7; }
        100% { opacity: 1; filter: brightness(1.3); }
      }

      @keyframes roadMove {
        0% { bottom: 100%; opacity: 0; }
        50% { opacity: 1; }
        100% { bottom: -20px; opacity: 0; }
      }

      @keyframes speedLineMove {
        0% { left: -10%; opacity: 0; }
        50% { opacity: 0.8; }
        100% { left: 110%; opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 摩托车特效
const createMotorcycleEffect = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation motorcycle-ride'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  const motorcycle = document.createElement('div')
  motorcycle.innerHTML = `
    <div class="motorcycle-view">
      <!-- 把手 -->
      <div class="handlebars">🏍️</div>
      <!-- 风效果 -->
      <div class="wind-effects">
        <div class="wind-line wind-1"></div>
        <div class="wind-line wind-2"></div>
        <div class="wind-line wind-3"></div>
        <div class="wind-line wind-4"></div>
      </div>
      <!-- 道路 -->
      <div class="motorcycle-road">
        <div class="road-marker marker-1"></div>
        <div class="road-marker marker-2"></div>
        <div class="road-marker marker-3"></div>
      </div>
    </div>
  `

  effectContainer.appendChild(motorcycle)
  container.appendChild(effectContainer)

  if (!document.querySelector('#motorcycle-effect-style')) {
    const style = document.createElement('style')
    style.id = 'motorcycle-effect-style'
    style.textContent = `
      .motorcycle-view {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .handlebars {
        position: absolute;
        bottom: 15%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 35px;
        animation: motorcycleShake 0.3s ease-in-out infinite;
      }

      .wind-effects {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .wind-line {
        position: absolute;
        width: 3px;
        height: 50px;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent);
        animation: windMove 0.8s linear infinite;
      }

      .wind-1 { top: 20%; animation-delay: 0s; }
      .wind-2 { top: 40%; animation-delay: 0.2s; }
      .wind-3 { top: 60%; animation-delay: 0.4s; }
      .wind-4 { top: 80%; animation-delay: 0.6s; }

      .motorcycle-road {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 25%;
      }

      .road-marker {
        position: absolute;
        width: 6px;
        height: 15px;
        background: yellow;
        left: 50%;
        transform: translateX(-50%);
        animation: roadMarkerMove 1.2s linear infinite;
      }

      .marker-1 { animation-delay: 0s; }
      .marker-2 { animation-delay: 0.4s; }
      .marker-3 { animation-delay: 0.8s; }

      @keyframes motorcycleShake {
        0%, 100% { transform: translateX(-50%) translateY(0) rotate(-1deg); }
        50% { transform: translateX(-50%) translateY(-2px) rotate(1deg); }
      }

      @keyframes windMove {
        0% { right: 100%; opacity: 0; }
        50% { opacity: 1; }
        100% { right: -10%; opacity: 0; }
      }

      @keyframes roadMarkerMove {
        0% { bottom: 100%; opacity: 0; }
        50% { opacity: 1; }
        100% { bottom: -15px; opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 爱心雨特效
const createHeartRain = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation heart-rain'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  // 创建多个爱心
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const heart = document.createElement('div')
      heart.innerHTML = '💖'
      heart.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 15}px;
        left: ${Math.random() * 100}%;
        top: -50px;
        animation: heartFall ${Math.random() * 3 + 2}s linear infinite;
        opacity: ${Math.random() * 0.5 + 0.5};
      `
      effectContainer.appendChild(heart)

      // 5秒后移除
      setTimeout(() => heart.remove(), 5000)
    }, i * 200)
  }

  container.appendChild(effectContainer)

  // 添加CSS动画
  if (!document.querySelector('#heart-animation-style')) {
    const style = document.createElement('style')
    style.id = 'heart-animation-style'
    style.textContent = `
      @keyframes heartFall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// 花瓣飞舞特效
const createFlowerPetals = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation flower-petals'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  const petals = ['🌸', '🌺', '🌻', '🌷']

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const petal = document.createElement('div')
      petal.innerHTML = petals[Math.floor(Math.random() * petals.length)]
      petal.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 15 + 10}px;
        left: ${Math.random() * 100}%;
        top: -50px;
        animation: petalFloat ${Math.random() * 4 + 3}s ease-in-out infinite;
        opacity: ${Math.random() * 0.4 + 0.6};
      `
      effectContainer.appendChild(petal)

      setTimeout(() => petal.remove(), 7000)
    }, i * 300)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#petal-animation-style')) {
    const style = document.createElement('style')
    style.id = 'petal-animation-style'
    style.textContent = `
      @keyframes petalFloat {
        0% { transform: translateY(-50px) rotate(0deg); }
        25% { transform: translateY(25vh) translateX(20px) rotate(90deg); }
        50% { transform: translateY(50vh) translateX(-10px) rotate(180deg); }
        75% { transform: translateY(75vh) translateX(15px) rotate(270deg); }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 雪花飘落特效
const createSnowfall = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation snowfall'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const snowflake = document.createElement('div')
      snowflake.innerHTML = '❄️'
      snowflake.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 10 + 8}px;
        left: ${Math.random() * 100}%;
        top: -50px;
        animation: snowFall ${Math.random() * 3 + 2}s linear infinite;
        opacity: ${Math.random() * 0.3 + 0.7};
      `
      effectContainer.appendChild(snowflake)

      setTimeout(() => snowflake.remove(), 5000)
    }, i * 100)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#snow-animation-style')) {
    const style = document.createElement('style')
    style.id = 'snow-animation-style'
    style.textContent = `
      @keyframes snowFall {
        to {
          transform: translateY(100vh) translateX(${Math.random() * 100 - 50}px);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// 泡泡飞舞特效
const createBubbles = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation bubbles'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const bubble = document.createElement('div')
      bubble.innerHTML = '🫧'
      bubble.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 15 + 10}px;
        left: ${Math.random() * 100}%;
        bottom: -50px;
        animation: bubbleFloat ${Math.random() * 4 + 3}s ease-out infinite;
        opacity: ${Math.random() * 0.4 + 0.6};
      `
      effectContainer.appendChild(bubble)

      setTimeout(() => bubble.remove(), 7000)
    }, i * 400)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#bubble-animation-style')) {
    const style = document.createElement('style')
    style.id = 'bubble-animation-style'
    style.textContent = `
      @keyframes bubbleFloat {
        0% { transform: translateY(0) scale(0.5); }
        50% { transform: translateY(-50vh) translateX(${Math.random() * 50 - 25}px) scale(1); }
        100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 星星闪烁特效
const createStars = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation stars'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div')
    star.innerHTML = '⭐'
    star.style.cssText = `
      position: absolute;
      font-size: ${Math.random() * 12 + 8}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: starTwinkle ${Math.random() * 2 + 1}s ease-in-out infinite alternate;
      opacity: ${Math.random() * 0.5 + 0.5};
    `
    effectContainer.appendChild(star)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#star-animation-style')) {
    const style = document.createElement('style')
    style.id = 'star-animation-style'
    style.textContent = `
      @keyframes starTwinkle {
        0% { transform: scale(0.5) rotate(0deg); opacity: 0.3; }
        100% { transform: scale(1.2) rotate(180deg); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  // 5秒后移除
  setTimeout(() => {
    effectContainer.remove()
  }, 5000)
}

// 彩带庆祝特效
const createConfetti = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation confetti'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  const confettiColors = ['🎉', '🎊', '✨', '🌟']

  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div')
      confetti.innerHTML = confettiColors[Math.floor(Math.random() * confettiColors.length)]
      confetti.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 15 + 10}px;
        left: ${Math.random() * 100}%;
        top: -50px;
        animation: confettiFall ${Math.random() * 2 + 1.5}s ease-out infinite;
        opacity: ${Math.random() * 0.4 + 0.6};
      `
      effectContainer.appendChild(confetti)

      setTimeout(() => confetti.remove(), 3000)
    }, i * 50)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#confetti-animation-style')) {
    const style = document.createElement('style')
    style.id = 'confetti-animation-style'
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(-50px) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 蝴蝶飞舞特效
const createButterflies = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation butterflies'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  for (let i = 0; i < 8; i++) {
    const butterfly = document.createElement('div')
    butterfly.innerHTML = '🦋'
    butterfly.style.cssText = `
      position: absolute;
      font-size: ${Math.random() * 12 + 10}px;
      left: ${Math.random() * 80 + 10}%;
      top: ${Math.random() * 80 + 10}%;
      animation: butterflyFly ${Math.random() * 4 + 3}s ease-in-out infinite;
      opacity: ${Math.random() * 0.4 + 0.6};
    `
    effectContainer.appendChild(butterfly)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#butterfly-animation-style')) {
    const style = document.createElement('style')
    style.id = 'butterfly-animation-style'
    style.textContent = `
      @keyframes butterflyFly {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(50px, -30px) rotate(10deg); }
        50% { transform: translate(-20px, -60px) rotate(-5deg); }
        75% { transform: translate(30px, -30px) rotate(8deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
      }
    `
    document.head.appendChild(style)
  }

  // 8秒后移除
  setTimeout(() => {
    effectContainer.remove()
  }, 8000)
}

// 烟花绽放特效
const createFireworks = () => {
  const container = document.querySelector('.wechat-camera')
  if (!container) return

  const effectContainer = document.createElement('div')
  effectContainer.className = 'effect-animation fireworks'
  effectContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
  `

  // 创建多个烟花爆炸点
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const firework = document.createElement('div')
      firework.innerHTML = '🎆'
      firework.style.cssText = `
        position: absolute;
        font-size: 30px;
        left: ${Math.random() * 80 + 10}%;
        top: ${Math.random() * 60 + 20}%;
        animation: fireworkExplode 1s ease-out;
        opacity: 1;
      `
      effectContainer.appendChild(firework)

      setTimeout(() => firework.remove(), 1000)
    }, i * 800)
  }

  container.appendChild(effectContainer)

  if (!document.querySelector('#firework-animation-style')) {
    const style = document.createElement('style')
    style.id = 'firework-animation-style'
    style.textContent = `
      @keyframes fireworkExplode {
        0% { transform: scale(0.1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.8; }
        100% { transform: scale(0.3); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// 拍摄控制变量
let pressTimer: any = null
let isLongPress = false
const isPressing = ref(false)

// 进度圆环计算
const progressOffset = computed(() => {
  const circumference = 2 * Math.PI * 42 // 使用正确的半径42
  const progress = recordingTime.value / 60 // 60秒为一圈
  return circumference - (progress * circumference)
})

// 处理触摸开始（被动事件）
const handleTouchStart = (e: TouchEvent) => {
  // 不调用 preventDefault()，因为使用了 passive 事件监听器
  startPress()
}

// 处理触摸结束（被动事件）
const handleTouchEnd = (e: TouchEvent) => {
  // 不调用 preventDefault()，因为使用了 passive 事件监听器
  endPress()
}

// 处理鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  startPress()
}

// 处理鼠标抬起
const handleMouseUp = (e: MouseEvent) => {
  e.preventDefault()
  endPress()
}

// 处理点击（防止重复触发）
const handleClick = (e: Event) => {
  e.preventDefault()
}

// 开始按压
const startPress = () => {
  isLongPress = false
  isPressing.value = true

  // 设置长按定时器（500ms后开始录像）
  pressTimer = setTimeout(() => {
    isLongPress = true
    startRecording()
  }, 500)
}

// 结束按压
const endPress = () => {
  isPressing.value = false

  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }

  if (isRecording.value) {
    // 如果正在录像，停止录像
    stopRecording()
  } else if (!isLongPress) {
    // 如果不是长按，拍照
    takePhoto()
  }
}

const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const video = videoRef.value
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.drawImage(video, 0, 0)
  
  canvas.toBlob(async (blob) => {
    if (blob) {
      // 使用Data URL而不是Blob URL
      const url = await blobToDataUrl(blob)

      console.log('📸 拍照完成，自动保存到相册并显示编辑预览')

      // 自动保存到手机相册（如果支持）
      try {
        if ('showSaveFilePicker' in window) {
          // 现代浏览器的文件保存API
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `photo_${Date.now()}.jpg`,
            types: [{
              description: 'JPEG images',
              accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
            }]
          })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
        } else {
          // 降级方案：创建下载链接
          const link = document.createElement('a')
          link.href = url
          link.download = `photo_${Date.now()}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        console.log('✅ 照片已保存到相册')
      } catch (error) {
        console.log('📱 自动保存失败，将在编辑页面提供保存选项:', error)
      }

      // 显示编辑预览页面
      capturedMedia.value = { type: 'photo', url, blob }
    }
  }, 'image/jpeg', 0.9)
}

const startRecording = async () => {
  if (!stream) {
    console.error('❌ 聊天摄像头：没有可用的媒体流')
    return
  }

  console.log('🎬 聊天摄像头开始录制视频')
  console.log('📊 录制状态 - isRecording:', isRecording.value, 'stream:', !!stream)

  try {
    // 检查浏览器支持的编码格式，优先使用带音频的opus
    let mimeType = 'video/webm;codecs=vp9,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus'
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9'
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8'
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm'
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4'
      } else {
        mimeType = '' // 由浏览器自行决定
      }
    }

    console.log('使用录制格式:', mimeType || 'browser-default')

    // 确保存在音频轨道
    if (stream && stream.getAudioTracks().length === 0) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStream.getAudioTracks().forEach(track => stream!.addTrack(track))
      } catch (err) {
        console.warn('⚠️ 无法获取音频轨道，将录制无声视频:', err)
      }
    }

    // 创建媒体录制器
    mediaRecorder = new MediaRecorder(stream, mimeType ? {
      mimeType,
      videoBitsPerSecond: 2500000
    } : { videoBitsPerSecond: 2500000 })

    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      console.log('录制数据可用:', event.data.size, 'bytes')
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      console.log('录制停止，总共', chunks.length, '个数据块')
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType })
        // 使用Data URL而不是Blob URL
        const url = await blobToDataUrl(blob)
        console.log('录制完成，文件大小:', blob.size, 'bytes')
        // 显示预览界面
        capturedMedia.value = { type: 'video', url, blob }
      } else {
        console.error('没有录制到数据')
        appStore.showToast('录制失败，请重试', 'error')
      }
    }

    mediaRecorder.onerror = (event) => {
      console.error('录制错误:', event)
      isRecording.value = false
      appStore.showToast('录制出错，请重试', 'error')
    }

    mediaRecorder.start(1000) // 每秒收集一次数据
    isRecording.value = true
    recordingTime.value = 0

    console.log('✅ 聊天摄像头录制已开始，进度条应该显示')
    console.log('📊 进度条状态 - isRecording:', isRecording.value, 'recordingTime:', recordingTime.value)

    recordingTimer = setInterval(() => {
      recordingTime.value++
      console.log('⏱️ 录制时间:', recordingTime.value, '秒，进度:', (recordingTime.value / 60 * 100).toFixed(1) + '%')

      // 最大录制60秒
      if (recordingTime.value >= 60) {
        console.log('⏰ 达到60秒限制，自动停止录制')
        stopRecording()
      }
    }, 1000)
  } catch (error) {
    console.error('录制失败:', error)
    isRecording.value = false
    appStore.showToast('录制功能不可用', 'error')
  }
}

const stopRecording = () => {
  console.log('停止录制视频')

  if (mediaRecorder && isRecording.value) {
    try {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
    } catch (error) {
      console.error('停止录制时出错:', error)
    }
  }

  isRecording.value = false

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  // 延迟清理mediaRecorder，等待onstop事件完成
  setTimeout(() => {
    mediaRecorder = null
  }, 100)
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 美白功能 - 自动调整强度，不显示面板
const toggleBeauty = () => {
  beautyEnabled.value = !beautyEnabled.value

  if (beautyEnabled.value) {
    // 自动设置适中的美白强度
    beautyIntensity.value = 60 // 60% 强度，效果自然
    console.log('✨ 聊天摄像头美白开启，强度:', beautyIntensity.value)
  } else {
    console.log('✨ 聊天摄像头美白关闭')
  }

  applyBeautyFilter()
}

// 应用亮度滤镜（补光降级方案）
const applyBrightnessFilter = () => {
  const video = videoRef.value
  if (video) {
    if (flashEnabled.value) {
      video.style.filter = `brightness(1.3) contrast(1.1)`
    } else {
      video.style.filter = beautyEnabled.value ? `brightness(1.1) contrast(1.05) saturate(1.1)` : 'none'
    }
  }
}

// 应用美白滤镜
const applyBeautyFilter = () => {
  const video = videoRef.value
  if (video) {
    if (beautyEnabled.value) {
      const brightness = 1 + (beautyIntensity.value / 200) // 1.0 - 1.5
      const contrast = 1 + (beautyIntensity.value / 400) // 1.0 - 1.25
      const saturate = 1 + (beautyIntensity.value / 500) // 1.0 - 1.2

      let filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`

      if (flashEnabled.value) {
        filter += ` brightness(1.3)`
      }

      video.style.filter = filter
    } else {
      video.style.filter = flashEnabled.value ? 'brightness(1.3) contrast(1.1)' : 'none'
    }
  }
}

// 视频编辑器事件处理
const handleVideoEditorCancel = () => {
  showVideoEditor.value = false
  // 由于使用Data URL，不需要revoke
  if (currentVideoData.value) {
    currentVideoData.value = null
  }
  capturedMedia.value = null
}

const handleVideoEditorSend = (data: any) => {
  console.log('📤 发送编辑后的视频:', data)

  // 发送视频（包含编辑信息）
  emit('capture', {
    type: 'video',
    url: data.videoUrl,
    blob: data.videoBlob,
    editData: {
      music: data.music,
      textItems: data.textItems,
      emojiItems: data.emojiItems
    }
  })

  // 关闭编辑器
  showVideoEditor.value = false
  currentVideoData.value = null
  capturedMedia.value = null
}

// 预览相关方法
const cancelCapture = () => {
  if (capturedMedia.value) {
    URL.revokeObjectURL(capturedMedia.value.url)
    capturedMedia.value = null
  }
}

const editMedia = () => {
  // TODO: 实现编辑功能
  appStore.showToast('编辑功能开发中', 'info')
}

const sendMedia = () => {
  if (capturedMedia.value) {
    // 如果是视频且选择了背景音乐，添加音乐信息
    const mediaData = { ...capturedMedia.value } as any
    if (capturedMedia.value.type === 'video' && selectedMusic.value) {
      mediaData.backgroundMusic = selectedMusic.value
    }

    emit('capture', mediaData)
    capturedMedia.value = null
    selectedMusic.value = null
    showMusicSelector.value = false
  }
}

// 背景音乐相关方法
const selectMusic = (music: any) => {
  if (music.isExternal) {
    // 选择外部音乐
    selectExternalMusic()
  } else {
    selectedMusic.value = music
    showMusicSelector.value = false
    console.log('✅ 选择背景音乐:', music.name)
  }
}

// 选择外部音乐
const selectExternalMusic = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      selectedMusic.value = {
        id: 'external_' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: '本地音乐',
        url: url,
        duration: 0,
        isExternal: true
      }
      showMusicSelector.value = false
      console.log('✅ 选择外部音乐:', file.name)
    }
  }
  input.click()
}

// 文字拖拽相关
const isDragging = ref(false)
const dragTarget = ref<any>(null)
const dragOffset = ref({ x: 0, y: 0 })
const editingText = ref<any>(null)

// 在指定位置添加文字
const addTextAtPosition = (event: MouseEvent | TouchEvent) => {
  if (isDragging.value || showTextEditor.value) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const x = clientX - rect.left
  const y = clientY - rect.top

  // 设置默认文字并打开编辑器
  textContent.value = '双击编辑文字'
  textSize.value = 24
  textColor.value = '#ffffff'
  textStyle.value = 'normal'

  const textElement = {
    id: Date.now(),
    content: textContent.value,
    size: textSize.value,
    color: textColor.value,
    style: textStyle.value,
    x: x - 50, // 居中偏移
    y: y - 12
  }

  videoTexts.value.push(textElement)
  editingText.value = textElement
  showTextEditor.value = true

  console.log('✅ 在位置添加文字:', { x, y })
}

// 添加文字到视频
const addTextToVideo = () => {
  if (!textContent.value.trim()) return

  if (editingText.value) {
    // 编辑现有文字
    editingText.value.content = textContent.value
    editingText.value.size = textSize.value
    editingText.value.color = textColor.value
    editingText.value.style = textStyle.value
  } else {
    // 添加新文字
    const textElement = {
      id: Date.now(),
      content: textContent.value,
      size: textSize.value,
      color: textColor.value,
      style: textStyle.value,
      x: 100, // 默认位置
      y: 100
    }
    videoTexts.value.push(textElement)
  }

  // 重置输入
  textContent.value = ''
  textSize.value = 24
  textColor.value = '#ffffff'
  textStyle.value = 'normal'
  showTextEditor.value = false
  editingText.value = null

  console.log('✅ 文字编辑完成，当前文字数量:', videoTexts.value.length)
}

// 开始拖拽文字
const startDrag = (event: MouseEvent | TouchEvent, text: any) => {
  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  dragTarget.value = text

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragOffset.value = {
    x: clientX - text.x,
    y: clientY - text.y
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: true })
  document.addEventListener('touchend', stopDrag, { passive: true })
}

// 处理拖拽
const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !dragTarget.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragTarget.value.x = clientX - dragOffset.value.x
  dragTarget.value.y = clientY - dragOffset.value.y
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  dragTarget.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 编辑文字
const editText = (text: any) => {
  if (isDragging.value) return

  editingText.value = text
  textContent.value = text.content
  textSize.value = text.size
  textColor.value = text.color
  textStyle.value = text.style
  showTextEditor.value = true
}

// 裁剪功能
const cropVideo = () => {
  showCropEditor.value = true
  console.log('🔧 打开视频裁剪编辑器')
}



// 设置裁剪比例
const setCropRatio = (ratio: string) => {
  console.log('📐 设置裁剪比例:', ratio)
  // 这里可以实现具体的裁剪比例设置
}

// 应用裁剪
const applyCrop = () => {
  console.log('✂️ 应用视频裁剪')
  showCropEditor.value = false
  // 这里可以实现具体的裁剪逻辑
}

// 关闭编辑器
const closeEditors = () => {
  showTextEditor.value = false
  showCropEditor.value = false
  showFilterEditor.value = false
}

// 滤镜和贴纸状态
const currentFilter = ref('none')
const currentSticker = ref('none')
const showFilterPanel = ref(false)
const showStickerPanel = ref(false)

// 滤镜列表
const filterList = [
  { id: 'none', name: '原图', filter: 'none' },
  { id: 'vintage', name: '复古', filter: 'sepia(0.8) contrast(1.2)' },
  { id: 'black-white', name: '黑白', filter: 'grayscale(1)' },
  { id: 'warm', name: '暖色', filter: 'hue-rotate(30deg) saturate(1.2)' },
  { id: 'cool', name: '冷色', filter: 'hue-rotate(-30deg) saturate(1.2)' },
  { id: 'bright', name: '明亮', filter: 'brightness(1.3) contrast(1.1)' }
]

// 贴纸列表
const stickerList = [
  { id: 'none', name: '无贴纸', emoji: '' },
  { id: 'heart', name: '爱心', emoji: '❤️' },
  { id: 'star', name: '星星', emoji: '⭐' },
  { id: 'smile', name: '笑脸', emoji: '😊' },
  { id: 'cool', name: '酷', emoji: '😎' },
  { id: 'kiss', name: '飞吻', emoji: '😘' }
]

// 右侧按钮功能
const toggleFilter = () => {
  console.log('🎨 切换滤镜面板')
  showFilterPanel.value = !showFilterPanel.value
  showStickerPanel.value = false
}

const toggleSticker = () => {
  console.log('😊 切换贴纸面板')
  showStickerPanel.value = !showStickerPanel.value
  showFilterPanel.value = false
}

// 关闭面板
const closeFilterPanel = () => {
  showFilterPanel.value = false
}

const closeStickerPanel = () => {
  showStickerPanel.value = false
}

// 应用滤镜
const applyFilter = (filter: any) => {
  currentFilter.value = filter.id
  if (videoRef.value) {
    videoRef.value.style.filter = filter.filter
  }
  console.log('🎨 应用滤镜:', filter.name)
}

// 应用贴纸
const applySticker = (sticker: any) => {
  currentSticker.value = sticker.id
  showStickerPanel.value = false
  console.log('😊 应用贴纸:', sticker.name)
}

const previewMusic = (music: any) => {
  // 停止当前预览
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value = null
  }

  if (currentPreviewMusic.value?.id === music.id && isPreviewPlaying.value) {
    // 如果点击的是正在播放的音乐，则停止
    isPreviewPlaying.value = false
    currentPreviewMusic.value = null
    return
  }

  // 如果是"更多音乐"选项，打开文件选择器
  if (music.id === 'music_more') {
    selectExternalMusic()
    return
  }

  // 开始新的预览
  currentPreviewMusic.value = music
  isPreviewPlaying.value = true

  // 所有音乐都使用模拟播放（避免版权和CORS问题）
  fallbackToSimulation(music)
}

// 备用模拟播放函数
const fallbackToSimulation = (music: any) => {
  console.log('🎵 开始模拟播放:', music.name, 'by', music.artist)
  console.log('🎵 歌曲描述:', music.description)

  let playTime = 0
  let playInterval: any = null

  // 模拟加载时间
  setTimeout(() => {
    if (!isPreviewPlaying.value) return

    console.log('🎵 ♪♫♪ 正在播放:', music.name, '♪♫♪')

    playInterval = setInterval(() => {
      playTime += 1

      // 显示更生动的播放进度
      const progress = Math.round((playTime / music.duration) * 100)
      const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))

      console.log(`🎵 [${progressBar}] ${playTime}/${music.duration}秒 (${progress}%)`)

      // 在特定时间点显示歌词片段（模拟）
      if (playTime === Math.floor(music.duration * 0.3)) {
        console.log('🎤 "' + getLyricSnippet(music.name) + '"')
      }

      if (playTime >= music.duration || !isPreviewPlaying.value) {
        clearInterval(playInterval)
        isPreviewPlaying.value = false
        currentPreviewMusic.value = null
        console.log('🎵 ✨ 播放完成:', music.name, '✨')
      }
    }, 1000)
  }, 500) // 模拟500ms加载时间

  // 保存停止函数
  previewAudio.value = {
    pause: () => {
      if (playInterval) {
        clearInterval(playInterval)
      }
      isPreviewPlaying.value = false
      currentPreviewMusic.value = null
      console.log('🎵 ⏸️ 停止播放:', music.name)
    }
  }
}

// 获取歌曲片段（模拟歌词）
const getLyricSnippet = (songName: string) => {
  const lyrics: { [key: string]: string } = {
    '晴天': '从前从前有个人爱你很久...',
    '稻香': '还记得你说家是唯一的城堡...',
    '孤勇者': '爱你孤身走暗巷，爱你不跪的模样...',
    '起风了': '我曾难自拔于世界之大...',
    '夜曲': '一群嗜血的蚂蚁被腐肉所吸引...',
    '海阔天空': '今天我寒夜里看雪飘过...',
    '搀扶': '如果说你是海上的烟火...',
    '本草纲目': '如果华佗再世，崇洋都被医治...'
  }
  return lyrics[songName] || '♪ 美妙的旋律正在播放 ♪'
}



const saveToAlbum = () => {
  if (capturedMedia.value) {
    // 创建下载链接
    const link = document.createElement('a')
    link.href = capturedMedia.value.url
    link.download = `叶语_${capturedMedia.value.type}_${Date.now()}.${capturedMedia.value.type === 'photo' ? 'jpg' : 'mp4'}`
    link.click()

    appStore.showToast('已保存到相册', 'success')
  }
}

// 生命周期
onMounted(async () => {
  console.log('🎥 聊天摄像头组件挂载，开始初始化...')
  try {
    await initCamera()
    console.log('✅ 聊天摄像头初始化完成')
  } catch (error) {
    // 静默处理初始化失败
    // 摄像头初始化失败是正常情况，不应该报错
  }
})

onUnmounted(() => {
  stopCamera()
  clearEffect()
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
})
</script>

<style scoped>
.wechat-camera {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-controls {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 20px;
  z-index: 10;
}

.close-btn {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-btn {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 12px;
  width: 48px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  gap: 2px;
  padding: 6px 4px;
}

.side-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.side-btn.active {
  background: rgba(7, 193, 96, 0.8);
}

.side-btn-label {
  font-size: 10px;
  color: white;
  line-height: 1;
  text-align: center;
}

.capture-area {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.capture-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.progress-ring-background {
  opacity: 0.3;
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.1s linear;
}

.capture-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

.capture-btn.pressing {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.5);
  border-width: 6px;
}

.capture-btn.recording {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.6);
  border-color: white; /* 保持白色边框 */
  animation: recordingPulse 2s ease-in-out infinite;
}

.capture-inner {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.capture-btn.pressing .capture-inner {
  width: 45px;
  height: 45px;
  background: #f0f0f0;
}

.capture-btn.recording .capture-inner {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: #ff4757;
  animation: recordingBlink 1s ease-in-out infinite alternate;
}

@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(7, 193, 96, 0);
  }
}

@keyframes recordingBlink {
  0% { opacity: 1; }
  100% { opacity: 0.7; }
}

.bottom-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 40px;
  z-index: 10;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}

.control-btn.active {
  background: rgba(7, 193, 96, 0.3);
  color: #07C160;
}

.control-btn span {
  font-size: 12px;
  font-weight: 500;
}

/* 美白面板样式 */
.beauty-panel-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.beauty-panel {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  color: white;
}

.beauty-panel .panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.beauty-panel .panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.beauty-panel .panel-header button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.beauty-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.beauty-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.beauty-control label {
  font-size: 14px;
  min-width: 80px;
}

.beauty-slider {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.beauty-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #07C160;
  border-radius: 50%;
  cursor: pointer;
}

.beauty-value {
  font-size: 12px;
  min-width: 40px;
  text-align: right;
  color: #07C160;
}

/* 移除特效相关样式 */

.effect-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 50px;
  cursor: pointer;
}

.effect-item.active .effect-icon {
  background: #07C160;
}

.effect-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.effect-name {
  font-size: 10px;
  color: white;
  text-align: center;
}

.more-effects-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-end;
  z-index: 20;
}

.effects-panel {
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.panel-header button {
  background: none;
  border: none;
  padding: 4px;
}

.effect-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  font-size: 14px;
  white-space: nowrap;
}

.category-btn.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.recording-timer {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  z-index: 10;
}

/* 预览界面样式 */
.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 竖屏填满预览区域 */
}

.preview-controls {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 2001;
}

.preview-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.preview-actions {
  display: flex;
  gap: 15px;
}

.send-btn {
  background: #07C160;
}

.send-btn:hover {
  background: #06a552;
}

.save-options {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
  z-index: 2001;
}

.save-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.save-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.save-option span {
  font-size: 12px;
}

/* 新的预览界面样式 */
/* 顶部背景音乐栏 */
.top-music-bar {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.music-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.music-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* 背景音乐选择面板 */
.music-selector {
  position: absolute;
  top: 100px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  z-index: 15;
  max-height: 300px;
  overflow: hidden;
}

.music-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.music-header h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.music-header button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.music-list {
  max-height: 200px;
  overflow-y: auto;
}

.music-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.music-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.music-item.active {
  background: rgba(52, 199, 89, 0.3);
}

.music-info {
  flex: 1;
}

.music-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.music-artist {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 2px;
}

.music-license {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  margin-top: 1px;
  font-style: italic;
}

.music-license {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  margin-top: 1px;
  font-style: italic;
}

.music-actions .preview-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 顶部控制栏 */
.preview-top-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
}

/* 底部控制栏 */
.preview-bottom-controls {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.send-btn-large {
  background: rgba(52, 199, 89, 0.9);
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn-large:hover {
  background: rgba(52, 199, 89, 1);
  transform: scale(1.05);
}

.cancel-btn {
  background: rgba(255, 59, 48, 0.8);
}

/* 编辑工具栏样式 */
.edit-toolbar {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 10;
}

.edit-tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-tool-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.edit-tool-btn span {
  font-size: 12px;
}

/* 文字编辑器模态框 */
.text-editor-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.text-editor-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.text-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.text-editor-header h3 {
  margin: 0;
  color: #333;
}

.text-editor-header button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.text-input-section {
  margin-bottom: 20px;
}

.text-input {
  width: 100%;
  height: 80px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: none;
}

.text-style-section {
  margin-bottom: 20px;
}

.style-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.style-row label {
  min-width: 80px;
  font-size: 14px;
  color: #333;
}

.size-slider {
  flex: 1;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.style-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.text-editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.text-editor-actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn {
  background: #07C160;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

/* 裁剪编辑器样式 */
.crop-editor-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
}

.crop-editor-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.crop-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.crop-editor-header h3 {
  margin: 0;
  color: #333;
}

.crop-editor-header button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.crop-ratio-section {
  margin-bottom: 20px;
}

.crop-ratio-section label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.ratio-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ratio-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.ratio-btn:hover {
  background: #f5f5f5;
  border-color: #07C160;
}

.ratio-btn.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.crop-editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}



/* 文字和贴纸覆盖层样式 */
.text-overlay {
  position: absolute;
  cursor: move;
  user-select: none;
  z-index: 10;
  min-width: 20px;
  min-height: 20px;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.2s;
}

.text-overlay:hover {
  background: rgba(0, 0, 0, 0.3);
}

.sticker-overlay {
  position: absolute;
  font-size: 48px;
  z-index: 10;
  pointer-events: none;
  animation: stickerPulse 2s ease-in-out infinite;
}

@keyframes stickerPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

/* 滤镜和贴纸面板覆盖层 */
.filter-panel-overlay,
.sticker-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 200px;
}

/* 文字和贴纸覆盖层样式 */
.text-overlay {
  position: absolute;
  cursor: move;
  user-select: none;
  z-index: 10;
  min-width: 20px;
  min-height: 20px;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.2s;
  white-space: nowrap;
  pointer-events: auto;
}

.text-overlay:hover {
  background: rgba(0, 0, 0, 0.3);
}

.sticker-overlay {
  position: absolute;
  font-size: 48px;
  z-index: 10;
  pointer-events: none;
  animation: stickerPulse 2s ease-in-out infinite;
}

@keyframes stickerPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

/* 滤镜和贴纸面板覆盖层 */
.filter-panel-overlay,
.sticker-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 200px;
}

/* 滤镜和贴纸面板样式 */
.filter-panel,
.sticker-panel {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 16px;
  width: 90%;
  max-width: 400px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.panel-header button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.filter-grid,
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.filter-item,
.sticker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-item:hover,
.sticker-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #07C160;
}

.filter-item.active,
.sticker-item.active {
  background: rgba(7, 193, 96, 0.3);
  border-color: #07C160;
}

.filter-preview {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.sticker-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.filter-item span,
.sticker-item span {
  font-size: 12px;
  text-align: center;
}
</style>

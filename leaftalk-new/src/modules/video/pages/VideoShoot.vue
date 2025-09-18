<template>
  <div class="video-shoot">
    <!-- 相机预览区域 -->
    <div class="camera-container" ref="cameraContainer">
      <video
        ref="videoPreview"
        class="video-preview"
        autoplay
        muted
        playsinline
        webkit-playsinline
      ></video>
      
      <!-- 录制状态覆盖层 -->
      <div class="camera-overlay">
        <!-- 顶部工具栏 -->
        <div class="top-toolbar">
          <button class="close-btn" @click="goBack">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
          </button>
          
          <div class="camera-settings">
            <button class="setting-btn" @click="toggleFlash" :class="{ active: flashEnabled }">
              <iconify-icon :icon="flashEnabled ? 'heroicons:bolt' : 'heroicons:bolt-slash'" width="20" style="color: white;"></iconify-icon>
            </button>
            <button class="setting-btn" @click="switchCamera">
              <iconify-icon icon="heroicons:arrow-path" width="20" style="color: white;"></iconify-icon>
            </button>
            <button class="setting-btn" @click="showFilters">
              <iconify-icon icon="heroicons:sparkles" width="20" style="color: white;"></iconify-icon>
            </button>
          </div>
        </div>

        <!-- 录制时长显示 -->
        <div class="recording-timer" v-if="isRecording">
          <div class="recording-dot"></div>
          <span>{{ formatTime(recordingTime) }}</span>
        </div>

        <!-- 拍摄模式切换 -->
        <div class="mode-selector">
          <button
            v-for="mode in shootModes"
            :key="mode.key"
            class="mode-btn"
            :class="{ active: currentMode === mode.key }"
            @click="switchMode(mode.key)"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- 底部控制栏 -->
        <div class="bottom-controls">
          <!-- 相册按钮 -->
          <button class="gallery-btn" @click="openGallery">
            <img :src="lastPhoto" alt="相册" class="gallery-preview" />
          </button>

          <!-- 拍摄按钮 -->
          <div class="shoot-button-container">
            <button
              class="shoot-btn"
              :class="{ recording: isRecording, photo: currentMode === 'photo' }"
              @mousedown="startShooting"
              @mouseup="stopShooting"
              @touchstart="startShooting"
              @touchend="stopShooting"
            >
              <div class="shoot-btn-inner"></div>
            </button>
            <div class="shoot-hint">
              {{ currentMode === 'photo' ? '轻触拍照' : (isRecording ? '松开结束' : '按住录像') }}
            </div>
          </div>

          <!-- 特效按钮 -->
          <button class="effects-btn" @click="showEffects">
            <iconify-icon icon="heroicons:face-smile" width="28" style="color: white;"></iconify-icon>
          </button>
        </div>

        <!-- 侧边工具栏 -->
        <div class="side-toolbar">
          <button class="tool-btn" @click="adjustSpeed" v-if="currentMode === 'video'">
            <iconify-icon icon="heroicons:forward" width="24" style="color: white;"></iconify-icon>
            <span>{{ speedText }}</span>
          </button>
          <button class="tool-btn" @click="setTimer">
            <iconify-icon icon="heroicons:clock" width="24" style="color: white;"></iconify-icon>
            <span>{{ timerText }}</span>
          </button>
          <button class="tool-btn" @click="toggleBeauty">
            <iconify-icon icon="heroicons:sparkles" width="24" style="color: white;"></iconify-icon>
            <span>美颜</span>
          </button>
        </div>
      </div>

      <!-- 滤镜选择器 -->
      <div v-if="showFilterSelector" class="filter-selector">
        <div class="filter-header">
          <h3>滤镜</h3>
          <button @click="hideFilters">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: white;"></iconify-icon>
          </button>
        </div>
        <div class="filter-list">
          <div
            v-for="filter in filters"
            :key="filter.id"
            class="filter-item"
            :class="{ active: currentFilter === filter.id }"
            @click="applyFilter(filter.id)"
          >
            <div class="filter-preview" :style="{ filter: filter.css }">
              <img src="/images/filter-preview.jpg" alt="预览" />
            </div>
            <span class="filter-name">{{ filter.name }}</span>
          </div>
        </div>
      </div>

      <!-- 特效选择器 -->
      <div v-if="showEffectSelector" class="effect-selector">
        <div class="effect-header">
          <h3>特效</h3>
          <button @click="hideEffects">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: white;"></iconify-icon>
          </button>
        </div>
        <div class="effect-categories">
          <button
            v-for="category in effectCategories"
            :key="category.key"
            class="category-btn"
            :class="{ active: currentEffectCategory === category.key }"
            @click="switchEffectCategory(category.key)"
          >
            {{ category.label }}
          </button>
        </div>
        <div class="effect-list">
          <div
            v-for="effect in currentEffects"
            :key="effect.id"
            class="effect-item"
            :class="{ active: currentEffect === effect.id }"
            @click="applyEffect(effect.id)"
          >
            <img :src="effect.thumbnail" :alt="effect.name" />
            <span class="effect-name">{{ effect.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 拍摄完成预览 -->
    <div v-if="showPreview" class="preview-container">
      <div class="preview-header">
        <button class="back-btn" @click="retakeVideo">
          <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
        </button>
        <h3>预览</h3>
        <button class="next-btn" @click="proceedToEdit">
          下一步
        </button>
      </div>

      <div class="preview-content">
        <video
          v-if="recordedVideoUrl"
          :src="recordedVideoUrl"
          class="preview-video"
          controls
          autoplay
          loop
        ></video>
        <img
          v-else-if="capturedPhotoUrl"
          :src="capturedPhotoUrl"
          class="preview-photo"
          alt="拍摄的照片"
        />
      </div>

      <div class="preview-actions">
        <button class="action-btn secondary" @click="saveToGallery">
          <iconify-icon icon="heroicons:arrow-down-tray" width="20"></iconify-icon>
          保存到相册
        </button>
        <button class="action-btn primary" @click="proceedToEdit">
          <iconify-icon icon="heroicons:pencil" width="20"></iconify-icon>
          编辑发布
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const videoPreview = ref<HTMLVideoElement>()
const cameraContainer = ref<HTMLElement>()
const isRecording = ref(false)
const recordingTime = ref(0)
const currentMode = ref('video')
const flashEnabled = ref(false)
const showFilterSelector = ref(false)
const showEffectSelector = ref(false)
const showPreview = ref(false)
const loading = ref(false)
const loadingText = ref('初始化相机...')

// 拍摄相关
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const recordedVideoUrl = ref('')
const capturedPhotoUrl = ref('')
const lastPhoto = ref('/images/default-gallery.jpg')

// 设置相关
const currentFilter = ref('none')
const currentEffect = ref('none')
const currentEffectCategory = ref('face')
const currentCamera = ref('user') // 'user' | 'environment'
const recordingSpeed = ref(1) // 0.5, 1, 1.5, 2
const timerDelay = ref(0) // 0, 3, 10 秒

// 定时器
let recordingTimer: NodeJS.Timeout | null = null
let timerCountdown: NodeJS.Timeout | null = null

// 拍摄模式
const shootModes = [
  { key: 'photo', label: '拍照' },
  { key: 'video', label: '视频' },
  { key: 'slow', label: '慢动作' },
  { key: 'time', label: '延时' }
]

// 滤镜列表
const filters = [
  { id: 'none', name: '原图', css: 'none' },
  { id: 'vintage', name: '复古', css: 'sepia(0.5) contrast(1.2)' },
  { id: 'black_white', name: '黑白', css: 'grayscale(1)' },
  { id: 'warm', name: '暖色', css: 'hue-rotate(30deg) saturate(1.2)' },
  { id: 'cool', name: '冷色', css: 'hue-rotate(-30deg) saturate(1.2)' },
  { id: 'bright', name: '明亮', css: 'brightness(1.3) contrast(1.1)' },
  { id: 'dramatic', name: '戏剧', css: 'contrast(1.5) saturate(1.3)' }
]

// 特效分类
const effectCategories = [
  { key: 'face', label: '面部' },
  { key: 'background', label: '背景' },
  { key: 'sticker', label: '贴纸' },
  { key: 'makeup', label: '美妆' }
]

// 特效列表
const faceEffects = [
  { id: 'none', name: '无特效', thumbnail: '/images/effects/none.jpg' },
  { id: 'cat_ears', name: '猫耳朵', thumbnail: '/images/effects/cat_ears.jpg' },
  { id: 'bunny_ears', name: '兔耳朵', thumbnail: '/images/effects/bunny_ears.jpg' },
  { id: 'crown', name: '皇冠', thumbnail: '/images/effects/crown.jpg' }
]

const backgroundEffects = [
  { id: 'none', name: '无背景', thumbnail: '/images/effects/none.jpg' },
  { id: 'beach', name: '海滩', thumbnail: '/images/effects/beach.jpg' },
  { id: 'city', name: '城市', thumbnail: '/images/effects/city.jpg' },
  { id: 'space', name: '太空', thumbnail: '/images/effects/space.jpg' }
]

// 计算属性
const currentEffects = computed(() => {
  switch (currentEffectCategory.value) {
    case 'face':
      return faceEffects
    case 'background':
      return backgroundEffects
    default:
      return faceEffects
  }
})

const speedText = computed(() => {
  const speedMap = {
    0.5: '0.5x',
    1: '1x',
    1.5: '1.5x',
    2: '2x'
  }
  return speedMap[recordingSpeed.value] || '1x'
})

const timerText = computed(() => {
  return timerDelay.value === 0 ? '关' : `${timerDelay.value}s`
})

// 方法
const goBack = () => {
  stopCamera()
  router.back()
}

const initCamera = async () => {
  try {
    loading.value = true
    loadingText.value = '初始化相机...'

    const constraints = {
      video: {
        facingMode: currentCamera.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoPreview.value) {
      videoPreview.value.srcObject = stream
    }

    loading.value = false
  } catch (error) {
    console.error('相机初始化失败:', error)
    loading.value = false
    loadingText.value = '相机初始化失败'
  }
}

const stopCamera = () => {
  if (videoPreview.value && videoPreview.value.srcObject) {
    const stream = videoPreview.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
  }
}

const switchCamera = async () => {
  currentCamera.value = currentCamera.value === 'user' ? 'environment' : 'user'
  await initCamera()
}

const toggleFlash = () => {
  flashEnabled.value = !flashEnabled.value
  // 这里应该控制设备闪光灯
}

const switchMode = (mode: string) => {
  currentMode.value = mode
}

const startShooting = () => {
  if (currentMode.value === 'photo') {
    takePhoto()
  } else {
    startRecording()
  }
}

const stopShooting = () => {
  if (currentMode.value !== 'photo' && isRecording.value) {
    stopRecording()
  }
}

const takePhoto = () => {
  if (!videoPreview.value) return

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  canvas.width = videoPreview.value.videoWidth
  canvas.height = videoPreview.value.videoHeight
  
  if (context) {
    context.drawImage(videoPreview.value, 0, 0)
    capturedPhotoUrl.value = canvas.toDataURL('image/jpeg', 0.9)
    showPreview.value = true
  }
}

const startRecording = () => {
  if (!videoPreview.value || !videoPreview.value.srcObject) return

  try {
    const stream = videoPreview.value.srcObject as MediaStream
    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    })

    recordedChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
      recordedVideoUrl.value = URL.createObjectURL(blob)
      showPreview.value = true
    }

    mediaRecorder.value.start()
    isRecording.value = true
    recordingTime.value = 0

    // 开始计时
    recordingTimer = setInterval(() => {
      recordingTime.value++
    }, 1000)

  } catch (error) {
    console.error('录制开始失败:', error)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }
}

const retakeVideo = () => {
  showPreview.value = false
  recordedVideoUrl.value = ''
  capturedPhotoUrl.value = ''
}

const proceedToEdit = () => {
  // 跳转到编辑页面
  router.push('/video-edit')
}

const saveToGallery = () => {
  console.log('保存到相册')
  // 这里应该保存到设备相册
}

const openGallery = () => {
  router.push('/gallery')
}

// 滤镜和特效
const showFilters = () => {
  showFilterSelector.value = true
}

const hideFilters = () => {
  showFilterSelector.value = false
}

const applyFilter = (filterId: string) => {
  currentFilter.value = filterId
  const filter = filters.find(f => f.id === filterId)
  if (filter && videoPreview.value) {
    videoPreview.value.style.filter = filter.css
  }
}

const showEffects = () => {
  showEffectSelector.value = true
}

const hideEffects = () => {
  showEffectSelector.value = false
}

const switchEffectCategory = (category: string) => {
  currentEffectCategory.value = category
}

const applyEffect = (effectId: string) => {
  currentEffect.value = effectId
  console.log('应用特效:', effectId)
  // 这里应该应用AR特效
}

// 工具功能
const adjustSpeed = () => {
  const speeds = [0.5, 1, 1.5, 2]
  const currentIndex = speeds.indexOf(recordingSpeed.value)
  const nextIndex = (currentIndex + 1) % speeds.length
  recordingSpeed.value = speeds[nextIndex]
}

const setTimer = () => {
  const timers = [0, 3, 10]
  const currentIndex = timers.indexOf(timerDelay.value)
  const nextIndex = (currentIndex + 1) % timers.length
  timerDelay.value = timers[nextIndex]
}

const toggleBeauty = () => {
  console.log('切换美颜')
  // 这里应该切换美颜效果
}

// 工具函数
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  stopCamera()
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  if (timerCountdown) {
    clearInterval(timerCountdown)
  }
})
</script>

<style scoped>
.video-shoot {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
}

/* 相机容器 */
.camera-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 相机覆盖层 */
.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.camera-overlay > * {
  pointer-events: auto;
}

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.camera-settings {
  display: flex;
  gap: 12px;
}

.setting-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-btn.active {
  background: rgba(255, 255, 255, 0.3);
}

/* 录制计时器 */
.recording-timer {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 拍摄模式选择器 */
.mode-selector {
  position: absolute;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 25px;
  padding: 4px;
}

.mode-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: white;
  font-size: 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mode-btn.active {
  background: white;
  color: black;
}

/* 底部控制栏 */
.bottom-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px 40px;
  background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%);
}

.gallery-btn {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid white;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
}

.gallery-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 拍摄按钮 */
.shoot-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.shoot-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid white;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.shoot-btn-inner {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  transition: all 0.2s;
}

.shoot-btn.recording .shoot-btn-inner {
  background: #ff4757;
  border-radius: 8px;
  width: 40px;
  height: 40px;
}

.shoot-btn.photo .shoot-btn-inner {
  background: white;
}

.shoot-hint {
  color: white;
  font-size: 12px;
  text-align: center;
}

.effects-btn {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 侧边工具栏 */
.side-toolbar {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 20px;
  padding: 12px 8px;
  color: white;
  font-size: 10px;
  cursor: pointer;
  min-width: 50px;
}

/* 滤镜选择器 */
.filter-selector {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 300px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-header h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.filter-header button {
  background: transparent;
  border: none;
  cursor: pointer;
}

.filter-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  min-width: 60px;
}

.filter-item.active .filter-preview {
  border-color: #07c160;
}

.filter-preview {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid transparent;
  overflow: hidden;
}

.filter-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.filter-name {
  color: white;
  font-size: 10px;
  text-align: center;
}

/* 特效选择器 */
.effect-selector {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 400px;
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.effect-header h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.effect-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.category-btn {
  padding: 8px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.category-btn.active {
  background: #07c160;
}

.effect-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  overflow-y: auto;
  max-height: 200px;
}

.effect-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.effect-item.active img {
  border-color: #07c160;
}

.effect-item img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid transparent;
  object-fit: cover;
}

.effect-name {
  color: white;
  font-size: 10px;
  text-align: center;
}

/* 预览容器 */
.preview-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px;
  background: rgba(0, 0, 0, 0.5);
}

.preview-header h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.back-btn,
.next-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video,
.preview-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.action-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bottom-controls {
    padding: 16px 20px 30px;
  }

  .shoot-btn {
    width: 70px;
    height: 70px;
  }

  .shoot-btn-inner {
    width: 50px;
    height: 50px;
  }

  .gallery-btn,
  .effects-btn {
    width: 45px;
    height: 45px;
  }
}
</style>

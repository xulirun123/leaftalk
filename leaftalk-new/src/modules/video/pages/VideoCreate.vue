<template>
  <div class="video-create">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <h1 class="title">创作视频</h1>
      <button class="help-btn" @click="showHelp">
        <iconify-icon icon="heroicons:question-mark-circle" width="24" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 创作方式选择 -->
    <div class="create-options" v-if="!selectedOption">
      <h2>选择创作方式</h2>
      <div class="options-grid">
        <div class="option-card" @click="selectOption('camera')">
          <div class="option-icon">
            <iconify-icon icon="heroicons:camera" width="48" style="color: #07C160;"></iconify-icon>
          </div>
          <h3>拍摄视频</h3>
          <p>使用摄像头拍摄新视频</p>
        </div>
        <div class="option-card" @click="selectOption('upload')">
          <div class="option-icon">
            <iconify-icon icon="heroicons:cloud-arrow-up" width="48" style="color: #FF6B6B;"></iconify-icon>
          </div>
          <h3>上传视频</h3>
          <p>从相册选择已有视频</p>
        </div>
        <div class="option-card" @click="selectOption('template')">
          <div class="option-icon">
            <iconify-icon icon="heroicons:rectangle-stack" width="48" style="color: #4ECDC4;"></iconify-icon>
          </div>
          <h3>使用模板</h3>
          <p>基于模板快速创作</p>
        </div>
        <div class="option-card" @click="selectOption('live')">
          <div class="option-icon">
            <iconify-icon icon="heroicons:signal" width="48" style="color: #FFD93D;"></iconify-icon>
          </div>
          <h3>直播</h3>
          <p>开始实时直播</p>
        </div>
      </div>
    </div>

    <!-- 拍摄界面 -->
    <div class="camera-interface" v-if="selectedOption === 'camera'">
      <div class="camera-container">
        <video ref="cameraVideo" autoplay muted playsinline class="camera-preview"></video>
        <canvas ref="cameraCanvas" style="display: none;"></canvas>

        <!-- 拍摄控制 -->
        <div class="camera-controls">
          <div class="control-top">
            <button class="control-btn" @click="toggleFlash">
              <iconify-icon :icon="flashOn ? 'heroicons:bolt' : 'heroicons:bolt-slash'" width="24"></iconify-icon>
            </button>
            <button class="control-btn" @click="switchCamera">
              <iconify-icon icon="heroicons:arrow-path" width="24"></iconify-icon>
            </button>
            <button class="control-btn" @click="toggleGrid">
              <iconify-icon icon="heroicons:squares-2x2" width="24"></iconify-icon>
            </button>
          </div>

          <div class="control-bottom">
            <button class="gallery-btn" @click="openGallery">
              <iconify-icon icon="heroicons:photo" width="24"></iconify-icon>
            </button>

            <button
              class="record-btn"
              :class="{ recording: isRecording }"
              @mousedown="startRecording"
              @mouseup="stopRecording"
              @touchstart="startRecording"
              @touchend="stopRecording"
            >
              <div class="record-inner"></div>
            </button>

            <button class="effects-btn" @click="showEffects">
              <iconify-icon icon="heroicons:sparkles" width="24"></iconify-icon>
            </button>
          </div>
        </div>

        <!-- 录制进度 -->
        <div class="recording-progress" v-if="isRecording">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: recordingProgress + '%' }"></div>
          </div>
          <span class="recording-time">{{ formatTime(recordingTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 上传界面 -->
    <div class="upload-interface" v-if="selectedOption === 'upload'">
      <div class="upload-area" @click="selectFile" @drop="handleDrop" @dragover.prevent>
        <input ref="fileInput" type="file" accept="video/*" @change="handleFileSelect" style="display: none;">
        <div class="upload-content">
          <iconify-icon icon="heroicons:cloud-arrow-up" width="64" style="color: #ccc;"></iconify-icon>
          <h3>选择视频文件</h3>
          <p>支持 MP4、MOV、AVI 格式</p>
          <p>文件大小不超过 100MB</p>
          <button class="upload-btn">选择文件</button>
        </div>
      </div>

      <!-- 上传进度 -->
      <div class="upload-progress" v-if="uploadProgress > 0">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <span class="progress-text">上传中... {{ uploadProgress }}%</span>
      </div>
    </div>

    <!-- 模板选择界面 -->
    <div class="template-interface" v-if="selectedOption === 'template'">
      <div class="template-categories">
        <button
          v-for="category in templateCategories"
          :key="category.key"
          :class="['category-btn', { active: activeCategory === category.key }]"
          @click="activeCategory = category.key"
        >
          {{ category.label }}
        </button>
      </div>

      <div class="templates-grid">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          @click="selectTemplate(template)"
        >
          <div class="template-preview">
            <img :src="template.thumbnail" :alt="template.name" />
            <div class="template-duration">{{ formatDuration(template.duration) }}</div>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-stats">
              <span>{{ formatNumber(template.uses) }} 使用</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 直播界面 -->
    <div class="live-interface" v-if="selectedOption === 'live'">
      <div class="live-setup">
        <h2>准备直播</h2>

        <div class="live-form">
          <div class="form-group">
            <label>直播标题</label>
            <input v-model="liveTitle" type="text" placeholder="输入直播标题" maxlength="50">
          </div>

          <div class="form-group">
            <label>直播分类</label>
            <select v-model="liveCategory">
              <option value="">选择分类</option>
              <option value="life">生活</option>
              <option value="entertainment">娱乐</option>
              <option value="education">教育</option>
              <option value="tech">科技</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label>直播封面</label>
            <div class="cover-upload" @click="selectCover">
              <img v-if="liveCover" :src="liveCover" alt="直播封面" />
              <div v-else class="cover-placeholder">
                <iconify-icon icon="heroicons:photo" width="32"></iconify-icon>
                <span>选择封面</span>
              </div>
            </div>
          </div>

          <button class="start-live-btn" @click="startLive" :disabled="!canStartLive">
            开始直播
          </button>
        </div>
      </div>
    </div>

    <!-- 视频编辑界面 -->
    <div class="edit-interface" v-if="selectedVideo">
      <div class="video-preview">
        <video ref="editVideo" :src="selectedVideo.url" controls class="edit-video"></video>
      </div>

      <div class="edit-controls">
        <div class="edit-tabs">
          <button
            v-for="tab in editTabs"
            :key="tab.key"
            :class="['edit-tab', { active: activeEditTab === tab.key }]"
            @click="activeEditTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="edit-content">
          <!-- 基础编辑 -->
          <div v-if="activeEditTab === 'basic'" class="edit-basic">
            <div class="form-group">
              <label>视频标题</label>
              <input v-model="videoTitle" type="text" placeholder="输入视频标题" maxlength="100">
            </div>

            <div class="form-group">
              <label>视频描述</label>
              <textarea v-model="videoDescription" placeholder="描述你的视频内容" maxlength="500"></textarea>
            </div>

            <div class="form-group">
              <label>标签</label>
              <div class="tags-input">
                <span v-for="tag in videoTags" :key="tag" class="tag">
                  {{ tag }}
                  <button @click="removeTag(tag)">×</button>
                </span>
                <input
                  v-model="newTag"
                  @keyup.enter="addTag"
                  placeholder="添加标签"
                  maxlength="20"
                >
              </div>
            </div>
          </div>

          <!-- 音乐编辑 -->
          <div v-if="activeEditTab === 'music'" class="edit-music">
            <div class="music-options">
              <button class="music-btn" @click="selectMusic">
                <iconify-icon icon="heroicons:musical-note" width="24"></iconify-icon>
                <span>选择音乐</span>
              </button>
              <button class="music-btn" @click="recordVoice">
                <iconify-icon icon="heroicons:microphone" width="24"></iconify-icon>
                <span>录制旁白</span>
              </button>
            </div>
          </div>

          <!-- 特效编辑 -->
          <div v-if="activeEditTab === 'effects'" class="edit-effects">
            <div class="effects-grid">
              <div
                v-for="effect in videoEffects"
                :key="effect.id"
                class="effect-item"
                @click="applyEffect(effect)"
              >
                <div class="effect-preview">
                  <img :src="effect.thumbnail" :alt="effect.name" />
                </div>
                <span>{{ effect.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="edit-actions">
          <button class="action-btn secondary" @click="saveDraft">保存草稿</button>
          <button class="action-btn primary" @click="publishVideo">发布</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { videoChannelApi } from '../../services/videoChannelApi'

const router = useRouter()

// 响应式数据
const selectedOption = ref('')
const flashOn = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const recordingProgress = ref(0)
const uploadProgress = ref(0)
const activeCategory = ref('trending')
const activeEditTab = ref('basic')

// 视频相关
const selectedVideo = ref(null)
const videoTitle = ref('')
const videoDescription = ref('')
const videoTags = ref([])
const newTag = ref('')

// 直播相关
const liveTitle = ref('')
const liveCategory = ref('')
const liveCover = ref('')

// 模板分类
const templateCategories = [
  { key: 'trending', label: '热门' },
  { key: 'dance', label: '舞蹈' },
  { key: 'comedy', label: '搞笑' },
  { key: 'food', label: '美食' },
  { key: 'travel', label: '旅行' },
  { key: 'education', label: '教育' }
]

// 编辑标签
const editTabs = [
  { key: 'basic', label: '基础' },
  { key: 'music', label: '音乐' },
  { key: 'effects', label: '特效' }
]

// 模拟数据
const templates = ref([
  {
    id: 'template_001',
    name: '快闪文字',
    description: '动感文字特效模板',
    thumbnail: '/images/template1.jpg',
    duration: 15,
    uses: 12500,
    category: 'trending'
  },
  {
    id: 'template_002',
    name: '美食展示',
    description: '美食拍摄专用模板',
    thumbnail: '/images/template2.jpg',
    duration: 30,
    uses: 8900,
    category: 'food'
  }
])

const videoEffects = ref([
  {
    id: 'effect_001',
    name: '美颜',
    thumbnail: '/images/effect1.jpg'
  },
  {
    id: 'effect_002',
    name: '滤镜',
    thumbnail: '/images/effect2.jpg'
  }
])

// 计算属性
const filteredTemplates = computed(() => {
  return templates.value.filter(t => t.category === activeCategory.value)
})

const canStartLive = computed(() => {
  return liveTitle.value.trim() && liveCategory.value
})

// Refs
const cameraVideo = ref(null)
const cameraCanvas = ref(null)
const fileInput = ref(null)
const editVideo = ref(null)

// 定时器
let recordingTimer = null

// 方法
const goBack = () => {
  if (selectedOption.value) {
    selectedOption.value = ''
  } else {
    router.back()
  }
}

const showHelp = () => {
  // 显示帮助信息
  console.log('显示创作帮助')
}

const selectOption = (option: string) => {
  selectedOption.value = option

  if (option === 'camera') {
    initCamera()
  }
}

// 摄像头相关方法
const initCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true
    })

    if (cameraVideo.value) {
      cameraVideo.value.srcObject = stream
    }
  } catch (error) {
    console.error('摄像头初始化失败:', error)
    alert('无法访问摄像头，请检查权限设置')
  }
}

const toggleFlash = () => {
  flashOn.value = !flashOn.value
}

const switchCamera = async () => {
  // 切换前后摄像头
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: flashOn.value ? 'user' : 'environment' },
      audio: true
    })

    if (cameraVideo.value) {
      cameraVideo.value.srcObject = stream
    }
  } catch (error) {
    console.error('切换摄像头失败:', error)
  }
}

const toggleGrid = () => {
  // 切换网格线
  console.log('切换网格线')
}

const startRecording = () => {
  if (isRecording.value) return

  isRecording.value = true
  recordingTime.value = 0
  recordingProgress.value = 0

  recordingTimer = setInterval(() => {
    recordingTime.value += 0.1
    recordingProgress.value = (recordingTime.value / 60) * 100 // 最大60秒

    if (recordingTime.value >= 60) {
      stopRecording()
    }
  }, 100)

  console.log('开始录制')
}

const stopRecording = () => {
  if (!isRecording.value) return

  isRecording.value = false

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  // 处理录制完成
  console.log('录制完成，时长:', recordingTime.value, '秒')

  // 模拟生成视频
  selectedVideo.value = {
    url: '/videos/recorded.mp4',
    duration: recordingTime.value
  }

  selectedOption.value = 'edit'
}

const openGallery = () => {
  selectOption('upload')
}

const showEffects = () => {
  console.log('显示特效面板')
}

// 上传相关方法
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    processVideoFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('video/')) {
    processVideoFile(file)
  }
}

const processVideoFile = (file: File) => {
  // 检查文件大小
  if (file.size > 100 * 1024 * 1024) { // 100MB
    alert('文件大小不能超过100MB')
    return
  }

  // 模拟上传进度
  uploadProgress.value = 0
  const uploadInterval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(uploadInterval)

      // 上传完成，进入编辑模式
      // 转换为Data URL
      const reader = new FileReader()
      reader.onload = () => {
        selectedVideo.value = {
          url: reader.result as string,
          duration: 0 // 实际应该从视频文件获取
        }
      }
      reader.readAsDataURL(file)

      selectedOption.value = 'edit'
    }
  }, 200)
}

// 模板相关方法
const selectTemplate = (template: any) => {
  console.log('选择模板:', template.name)

  // 基于模板创建视频
  selectedVideo.value = {
    url: '/videos/template.mp4',
    duration: template.duration
  }

  selectedOption.value = 'edit'
}

// 直播相关方法
const selectCover = () => {
  // 选择直播封面
  console.log('选择直播封面')
}

const startLive = () => {
  console.log('开始直播:', liveTitle.value)
  router.push('/live-streaming')
}

// 编辑相关方法
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !videoTags.value.includes(tag) && videoTags.value.length < 10) {
    videoTags.value.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = videoTags.value.indexOf(tag)
  if (index > -1) {
    videoTags.value.splice(index, 1)
  }
}

const selectMusic = () => {
  console.log('选择背景音乐')
  router.push('/music-library')
}

const recordVoice = () => {
  console.log('录制旁白')
}

const applyEffect = (effect: any) => {
  console.log('应用特效:', effect.name)
}

const saveDraft = async () => {
  try {
    const videoData = {
      title: videoTitle.value,
      description: videoDescription.value,
      tags: videoTags.value,
      video: selectedVideo.value,
      visibility: 'draft'
    }

    console.log('保存草稿:', videoData)

    // 调用API保存草稿
    // const response = await videoChannelApi.createVideo(videoData)

    alert('草稿保存成功')
    router.back()
  } catch (error) {
    console.error('保存草稿失败:', error)
    alert('保存失败，请重试')
  }
}

const publishVideo = async () => {
  if (!videoTitle.value.trim()) {
    alert('请输入视频标题')
    return
  }

  try {
    const videoData = {
      title: videoTitle.value,
      description: videoDescription.value,
      tags: videoTags.value,
      video: selectedVideo.value,
      visibility: 'public'
    }

    console.log('发布视频:', videoData)

    // 调用API发布视频
    // const response = await videoChannelApi.createVideo(videoData)

    alert('视频发布成功')
    router.push('/video-creator-center')
  } catch (error) {
    console.error('发布视频失败:', error)
    alert('发布失败，请重试')
  }
}

// 工具函数
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds: number) => {
  return `${seconds}s`
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

// 生命周期
onMounted(() => {
  console.log('视频创作页面已加载')
})

onUnmounted(() => {
  // 清理定时器
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }

  // 停止摄像头
  if (cameraVideo.value?.srcObject) {
    const stream = cameraVideo.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.video-create {
  min-height: 100vh;
  background: #000;
  color: white;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.back-btn, .help-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: white;
}

.back-btn:hover, .help-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: white;
  margin: 0;
}

/* 创作选项 */
.create-options {
  padding: 80px 20px 20px;
  background: #f5f5f5;
  color: #333;
  min-height: 100vh;
}

.create-options h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.option-card {
  background: white;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.option-icon {
  margin-bottom: 12px;
}

.option-card h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #333;
}

.option-card p {
  font-size: 12px;
  color: #666;
  margin: 0;
}

/* 摄像头界面 */
.camera-interface {
  position: relative;
  height: 100vh;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 80px 20px 40px;
}

.control-top {
  display: flex;
  justify-content: space-between;
}

.control-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.gallery-btn, .effects-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 4px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.record-btn.recording {
  background: #ff4444;
  border-color: #ff4444;
}

.record-inner {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ff4444;
  transition: all 0.2s;
}

.record-btn.recording .record-inner {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: white;
}

.recording-progress {
  position: absolute;
  top: 100px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ff4444;
  transition: width 0.1s;
}

.recording-time {
  color: #ff4444;
  font-weight: 500;
  font-size: 14px;
}

/* 上传界面 */
.upload-interface {
  padding: 80px 20px 20px;
  background: #f5f5f5;
  color: #333;
  min-height: 100vh;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  background: white;
}

.upload-area:hover {
  border-color: #07C160;
}

.upload-content h3 {
  margin: 16px 0 8px 0;
  color: #333;
}

.upload-content p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.upload-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 16px;
  font-size: 14px;
}

.upload-progress {
  margin-top: 20px;
  text-align: center;
}

.upload-progress .progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.upload-progress .progress-fill {
  height: 100%;
  background: #07C160;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

/* 模板界面 */
.template-interface {
  padding: 80px 20px 20px;
  background: #f5f5f5;
  color: #333;
  min-height: 100vh;
}

.template-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-btn.active {
  background: #07C160;
  border-color: #07C160;
  color: white;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
}

.template-preview {
  position: relative;
  aspect-ratio: 9/16;
  background: #f0f0f0;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.template-info {
  padding: 12px;
}

.template-info h4 {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #333;
}

.template-info p {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px 0;
}

.template-stats {
  font-size: 10px;
  color: #999;
}
</style>
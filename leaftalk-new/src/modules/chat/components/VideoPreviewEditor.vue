<template>
  <div class="video-preview-editor" v-if="visible">
    <div class="editor-overlay">
      <div class="editor-container">
        <!-- 顶部工具栏 -->
        <div class="editor-header">
          <button class="close-btn" @click="close">
            <span>❌</span>
          </button>
          <h3 class="editor-title">视频编辑</h3>
          <button class="save-btn" @click="save" :disabled="isProcessing">
            <span>✅</span>
          </button>
        </div>

        <!-- 视频预览区域 -->
        <div class="video-preview">
          <video
            ref="videoElement"
            :src="videoUrl"
            controls
            playsinline
            @loadedmetadata="onVideoLoaded"
            @timeupdate="onTimeUpdate"
          ></video>
          
          <!-- 视频信息 -->
          <div class="video-info">
            <span class="duration">{{ formatTime(duration) }}</span>
            <span class="size">{{ formatFileSize(fileSize) }}</span>
          </div>
        </div>

        <!-- 编辑工具 -->
        <div class="edit-tools">
          <!-- 裁剪工具 -->
          <div class="tool-section">
            <h4>裁剪</h4>
            <div class="trim-controls">
              <input
                type="range"
                v-model="trimStart"
                :max="duration"
                :step="0.1"
                class="trim-slider"
              />
              <input
                type="range"
                v-model="trimEnd"
                :max="duration"
                :step="0.1"
                class="trim-slider"
              />
              <div class="trim-info">
                <span>开始: {{ formatTime(trimStart) }}</span>
                <span>结束: {{ formatTime(trimEnd) }}</span>
                <span>时长: {{ formatTime(trimEnd - trimStart) }}</span>
              </div>
            </div>
          </div>

          <!-- 滤镜工具 -->
          <div class="tool-section">
            <h4>滤镜</h4>
            <div class="filter-grid">
              <button
                v-for="filter in filters"
                :key="filter.id"
                class="filter-btn"
                :class="{ active: selectedFilter === filter.id }"
                @click="applyFilter(filter.id)"
              >
                <div class="filter-preview" :style="{ filter: filter.css }">
                  <span>{{ filter.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 调整工具 -->
          <div class="tool-section">
            <h4>调整</h4>
            <div class="adjustment-controls">
              <div class="control-item">
                <label>亮度</label>
                <input
                  type="range"
                  v-model="adjustments.brightness"
                  min="0"
                  max="200"
                  class="adjustment-slider"
                />
                <span>{{ adjustments.brightness }}%</span>
              </div>
              <div class="control-item">
                <label>对比度</label>
                <input
                  type="range"
                  v-model="adjustments.contrast"
                  min="0"
                  max="200"
                  class="adjustment-slider"
                />
                <span>{{ adjustments.contrast }}%</span>
              </div>
              <div class="control-item">
                <label>饱和度</label>
                <input
                  type="range"
                  v-model="adjustments.saturation"
                  min="0"
                  max="200"
                  class="adjustment-slider"
                />
                <span>{{ adjustments.saturation }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="editor-footer">
          <button class="reset-btn" @click="reset">重置</button>
          <button class="preview-btn" @click="preview">预览</button>
          <button class="export-btn" @click="exportVideo" :disabled="isProcessing">
            {{ isProcessing ? '处理中...' : '导出' }}
          </button>
        </div>

        <!-- 处理进度 -->
        <div v-if="isProcessing" class="processing-overlay">
          <div class="processing-content">
            <div class="spinner">⟳</div>
            <p>正在处理视频...</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${processingProgress}%` }"></div>
            </div>
            <span>{{ processingProgress }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  videoUrl: string
  fileSize?: number
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { url: string; duration: number; size: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  fileSize: 0
})

const emit = defineEmits<Emits>()

// 视频元素引用
const videoElement = ref<HTMLVideoElement>()

// 视频信息
const duration = ref(0)
const currentTime = ref(0)

// 编辑参数
const trimStart = ref(0)
const trimEnd = ref(0)
const selectedFilter = ref('none')

// 调整参数
const adjustments = ref({
  brightness: 100,
  contrast: 100,
  saturation: 100
})

// 处理状态
const isProcessing = ref(false)
const processingProgress = ref(0)

// 滤镜列表
const filters = [
  { id: 'none', name: '无', css: 'none' },
  { id: 'sepia', name: '复古', css: 'sepia(100%)' },
  { id: 'grayscale', name: '黑白', css: 'grayscale(100%)' },
  { id: 'blur', name: '模糊', css: 'blur(2px)' },
  { id: 'vintage', name: '怀旧', css: 'sepia(50%) contrast(120%) brightness(110%)' },
  { id: 'cool', name: '冷色', css: 'hue-rotate(180deg) saturate(120%)' },
  { id: 'warm', name: '暖色', css: 'hue-rotate(30deg) saturate(120%) brightness(110%)' }
]

// 计算属性
const videoStyle = computed(() => {
  const filterCss = selectedFilter.value !== 'none' 
    ? filters.find(f => f.id === selectedFilter.value)?.css || 'none'
    : 'none'
  
  const adjustmentCss = `brightness(${adjustments.value.brightness}%) contrast(${adjustments.value.contrast}%) saturate(${adjustments.value.saturation}%)`
  
  return {
    filter: filterCss === 'none' ? adjustmentCss : `${filterCss} ${adjustmentCss}`
  }
})

// 监听视频样式变化
watch(videoStyle, (newStyle) => {
  if (videoElement.value) {
    Object.assign(videoElement.value.style, newStyle)
  }
}, { deep: true })

// 视频加载完成
function onVideoLoaded() {
  if (videoElement.value) {
    duration.value = videoElement.value.duration
    trimEnd.value = duration.value
  }
}

// 时间更新
function onTimeUpdate() {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
  }
}

// 应用滤镜
function applyFilter(filterId: string) {
  selectedFilter.value = filterId
}

// 重置所有设置
function reset() {
  trimStart.value = 0
  trimEnd.value = duration.value
  selectedFilter.value = 'none'
  adjustments.value = {
    brightness: 100,
    contrast: 100,
    saturation: 100
  }
}

// 预览效果
function preview() {
  if (videoElement.value) {
    videoElement.value.currentTime = trimStart.value
    videoElement.value.play()
  }
}

// 导出视频
async function exportVideo() {
  isProcessing.value = true
  processingProgress.value = 0

  try {
    // 模拟视频处理过程
    for (let i = 0; i <= 100; i += 10) {
      processingProgress.value = i
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 模拟生成新的视频URL
    const processedVideoUrl = `${props.videoUrl}?processed=${Date.now()}`
    const processedDuration = trimEnd.value - trimStart.value
    const processedSize = Math.floor(props.fileSize * (processedDuration / duration.value))

    emit('save', {
      url: processedVideoUrl,
      duration: processedDuration,
      size: processedSize
    })
  } catch (error) {
    console.error('视频处理失败:', error)
  } finally {
    isProcessing.value = false
    processingProgress.value = 0
  }
}

// 关闭编辑器
function close() {
  emit('close')
}

// 保存并关闭
function save() {
  exportVideo()
}

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 组件挂载时初始化
onMounted(() => {
  if (props.visible && videoElement.value) {
    videoElement.value.load()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.src = ''
  }
})
</script>

<style scoped>
.video-preview-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.editor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-container {
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.close-btn, .save-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.close-btn:hover, .save-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.video-preview {
  position: relative;
  padding: 16px;
  background: #000;
}

.video-preview video {
  width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 8px;
}

.video-info {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  color: white;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}

.edit-tools {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tool-section {
  margin-bottom: 24px;
}

.tool-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.trim-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trim-slider, .adjustment-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  cursor: pointer;
}

.trim-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.filter-btn {
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  border-color: #07C160;
}

.filter-preview {
  width: 100%;
  height: 60px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.adjustment-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-item label {
  width: 60px;
  font-size: 14px;
}

.control-item span {
  width: 40px;
  font-size: 12px;
  color: #666;
}

.editor-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.reset-btn, .preview-btn, .export-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.export-btn {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.reset-btn:hover, .preview-btn:hover {
  background: #f5f5f5;
}

.export-btn:hover:not(:disabled) {
  background: #06a552;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-content {
  text-align: center;
}

.spinner {
  font-size: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 16px auto;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #07C160;
  transition: width 0.3s ease;
}
</style>

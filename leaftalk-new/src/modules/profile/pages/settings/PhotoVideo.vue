<template>
  <div class="photo-video-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">照片和视频</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 拍摄设置 -->
      <div class="settings-section">
        <div class="section-title">拍摄设置</div>
        <div class="setting-item" @click="setPhotoQuality">
          <div class="setting-info">
            <span>照片质量</span>
            <span class="setting-value">{{ photoQualityLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setVideoQuality">
          <div class="setting-info">
            <span>视频质量</span>
            <span class="setting-value">{{ videoQualityLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动HDR</span>
            <span class="setting-desc">在合适的光线条件下自动启用HDR</span>
          </div>
          <div class="setting-toggle" :class="{ active: autoHDR }" @click="toggleAutoHDR">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>网格线</span>
            <span class="setting-desc">拍摄时显示网格线辅助构图</span>
          </div>
          <div class="setting-toggle" :class="{ active: showGrid }" @click="toggleGrid">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 压缩设置 -->
      <div class="settings-section">
        <div class="section-title">压缩设置</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动压缩照片</span>
            <span class="setting-desc">发送前自动压缩照片以节省流量</span>
          </div>
          <div class="setting-toggle" :class="{ active: autoCompressPhoto }" @click="toggleCompressPhoto">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动压缩视频</span>
            <span class="setting-desc">发送前自动压缩视频以节省流量</span>
          </div>
          <div class="setting-toggle" :class="{ active: autoCompressVideo }" @click="toggleCompressVideo">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setCompressionLevel">
          <div class="setting-info">
            <span>压缩级别</span>
            <span class="setting-value">{{ compressionLevelLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 存储设置 -->
      <div class="settings-section">
        <div class="section-title">存储设置</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>保存到相册</span>
            <span class="setting-desc">自动保存拍摄的照片和视频到相册</span>
          </div>
          <div class="setting-toggle" :class="{ active: saveToAlbum }" @click="toggleSaveToAlbum">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>保存接收的媒体</span>
            <span class="setting-desc">自动保存接收的照片和视频</span>
          </div>
          <div class="setting-toggle" :class="{ active: saveReceivedMedia }" @click="toggleSaveReceived">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setStorageLocation">
          <div class="setting-info">
            <span>存储位置</span>
            <span class="setting-value">{{ storageLocationLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="settings-section">
        <div class="section-title">隐私设置</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>照片位置信息</span>
            <span class="setting-desc">在照片中包含位置信息</span>
          </div>
          <div class="setting-toggle" :class="{ active: includeLocation }" @click="toggleLocation">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动删除原图</span>
            <span class="setting-desc">发送压缩图片后删除原图</span>
          </div>
          <div class="setting-toggle" :class="{ active: autoDeleteOriginal }" @click="toggleDeleteOriginal">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 设置状态
const photoQuality = ref('high')
const videoQuality = ref('standard')
const autoHDR = ref(true)
const showGrid = ref(false)
const autoCompressPhoto = ref(true)
const autoCompressVideo = ref(true)
const compressionLevel = ref('medium')
const saveToAlbum = ref(true)
const saveReceivedMedia = ref(false)
const storageLocation = ref('internal')
const includeLocation = ref(false)
const autoDeleteOriginal = ref(false)

// 计算属性
const photoQualityLabel = computed(() => {
  const labels = {
    'low': '低',
    'standard': '标准',
    'high': '高',
    'original': '原图'
  }
  return labels[photoQuality.value as keyof typeof labels] || '标准'
})

const videoQualityLabel = computed(() => {
  const labels = {
    'low': '低 (480p)',
    'standard': '标准 (720p)',
    'high': '高 (1080p)',
    'ultra': '超高 (4K)'
  }
  return labels[videoQuality.value as keyof typeof labels] || '标准 (720p)'
})

const compressionLevelLabel = computed(() => {
  const labels = {
    'low': '轻度压缩',
    'medium': '中度压缩',
    'high': '重度压缩'
  }
  return labels[compressionLevel.value as keyof typeof labels] || '中度压缩'
})

const storageLocationLabel = computed(() => {
  const labels = {
    'internal': '内部存储',
    'external': '外部存储',
    'cloud': '云存储'
  }
  return labels[storageLocation.value as keyof typeof labels] || '内部存储'
})

const goBack = () => {
  router.back()
}

// 设置方法
const setPhotoQuality = () => {
  console.log('设置照片质量')
}

const setVideoQuality = () => {
  console.log('设置视频质量')
}

const setCompressionLevel = () => {
  console.log('设置压缩级别')
}

const setStorageLocation = () => {
  console.log('设置存储位置')
}

// 开关切换方法
const toggleAutoHDR = () => {
  autoHDR.value = !autoHDR.value
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const toggleCompressPhoto = () => {
  autoCompressPhoto.value = !autoCompressPhoto.value
}

const toggleCompressVideo = () => {
  autoCompressVideo.value = !autoCompressVideo.value
}

const toggleSaveToAlbum = () => {
  saveToAlbum.value = !saveToAlbum.value
}

const toggleSaveReceived = () => {
  saveReceivedMedia.value = !saveReceivedMedia.value
}

const toggleLocation = () => {
  includeLocation.value = !includeLocation.value
}

const toggleDeleteOriginal = () => {
  autoDeleteOriginal.value = !autoDeleteOriginal.value
}
</script>

<style scoped>
.photo-video-settings {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.settings-content {
  margin-top: 60px;
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 16px;
  color: #333;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.setting-value {
  font-size: 14px;
  color: #666;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}
</style>

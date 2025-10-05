<template>
  <div class="take-photo">
    <!-- 摄像头预览 -->
    <div class="camera-preview">
      <video ref="videoElement" autoplay playsinline></video>
      <canvas ref="canvasElement" style="display: none;"></canvas>
    </div>

    <!-- 拍照后的预览 -->
    <div v-if="capturedImage" class="captured-preview">
      <img :src="capturedImage" alt="拍摄的照片" />
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <div v-if="!capturedImage" class="camera-controls">
        <button class="cancel-button" @click="goBack">取消</button>
        <button class="capture-button" @click="capturePhoto">
          <div class="capture-circle"></div>
        </button>
        <button class="switch-button" @click="switchCamera">
          <iconify-icon icon="heroicons:arrow-path" width="24" style="color: white;"></iconify-icon>
        </button>
      </div>

      <div v-else class="preview-controls">
        <button class="retake-button" @click="retakePhoto">重拍</button>
        <button class="confirm-button" @click="confirmPhoto">使用照片</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
const capturedImage = ref<string | null>(null)
const stream = ref<MediaStream | null>(null)
const facingMode = ref<'user' | 'environment'>('environment') // 默认后置摄像头

// 启动摄像头
const startCamera = async () => {
  try {
    // 停止之前的流
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
    }

    // 请求摄像头权限
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })

    stream.value = mediaStream

    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream
    }

    console.log('✅ 摄像头已启动')
  } catch (error) {
    console.error('❌ 无法访问摄像头:', error)
    alert('无法访问摄像头，请检查权限设置')
  }
}

// 切换摄像头
const switchCamera = () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  startCamera()
}

// 拍照
const capturePhoto = () => {
  if (!videoElement.value || !canvasElement.value) return

  const video = videoElement.value
  const canvas = canvasElement.value

  // 设置canvas尺寸与视频一致
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // 绘制当前视频帧到canvas
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 转换为图片
    capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
    
    console.log('✅ 照片已拍摄')
    
    // 停止摄像头
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
    }
  }
}

// 重拍
const retakePhoto = () => {
  capturedImage.value = null
  startCamera()
}

// 确认使用照片
const confirmPhoto = async () => {
  if (!capturedImage.value) return

  try {
    // 保存背景设置
    const { useGeneralStore } = await import('../stores/settingsStore')
    const generalStore = useGeneralStore()
    generalStore.updateSetting('chatBackground', `custom:${capturedImage.value}`)

    console.log('✅ 背景设置成功')
    
    // 返回聊天背景页面
    router.push('/settings/chat-background')
  } catch (error) {
    console.error('❌ 保存背景设置失败:', error)
  }
}

// 返回
const goBack = () => {
  // 停止摄像头
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
  router.back()
}

// 页面加载时启动摄像头
onMounted(() => {
  startCamera()
})

// 页面卸载时停止摄像头
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.take-photo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
}

.camera-preview {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.camera-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captured-preview {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.captured-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bottom-actions {
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
}

.camera-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.cancel-button,
.switch-button {
  width: 60px;
  height: 60px;
  background: transparent;
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capture-button {
  width: 80px;
  height: 80px;
  background: transparent;
  border: 4px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.capture-circle {
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 50%;
}

.capture-button:active .capture-circle {
  background: #ddd;
}

.preview-controls {
  display: flex;
  gap: 12px;
}

.retake-button,
.confirm-button {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.retake-button {
  background: #666;
  color: white;
}

.confirm-button {
  background: #07C160;
  color: white;
}

.retake-button:active {
  background: #555;
}

.confirm-button:active {
  background: #06AD56;
}
</style>


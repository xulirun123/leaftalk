<template>
  <div class="avatar-view">
    <!-- 头像显示区域 -->
    <div class="avatar-container">
      <div class="avatar-wrapper">
        <img :src="userInfo.avatar" alt="头像" class="avatar-image" />
        <!-- 菜单按钮 -->
        <button class="menu-btn" @click="handleTopBarAction('showMenu')">
          <iconify-icon icon="heroicons:ellipsis-horizontal" width="24" style="color: white;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 底部菜单 -->
    <div v-if="showMenu" class="menu-overlay" @click="hideMenu">
      <div class="menu-content" @click.stop>
        <div class="menu-item" @click="takePhoto">
          <iconify-icon icon="heroicons:camera" width="24"></iconify-icon>
          <span>拍照</span>
        </div>
        <div class="menu-item" @click="selectFromAlbum">
          <iconify-icon icon="heroicons:photo" width="24"></iconify-icon>
          <span>从相册选择</span>
        </div>
        <div class="menu-item cancel" @click="hideMenu">
          <span>取消</span>
        </div>
      </div>
    </div>

    <!-- 隐藏的拍照输入框 -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      style="display: none"
      @change="handleCameraSelect"
    />

    <!-- 隐藏的相册输入框 -->
    <input
      ref="albumInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAlbumSelect"
    />

    <!-- 相机预览模态框 -->
    <div v-if="showCamera" class="camera-modal">
      <div class="camera-container">
        <div class="camera-header">
          <button class="camera-close" @click="closeCamera">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
          <span class="camera-title">拍照</span>
          <div></div>
        </div>

        <div class="camera-preview">
          <video ref="videoRef" autoplay playsinline class="camera-video"></video>
          <canvas ref="canvasRef" style="display: none;"></canvas>
        </div>

        <div class="camera-controls">
          <button class="camera-switch" @click="switchCamera">
            <iconify-icon icon="heroicons:arrow-path" width="24"></iconify-icon>
          </button>
          <button class="camera-capture" @click="capturePhoto">
            <div class="capture-button"></div>
          </button>
          <button class="camera-album" @click="selectFromAlbumInCamera">
            <iconify-icon icon="heroicons:photo" width="24"></iconify-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览和裁剪模态框 -->
    <div v-if="showCrop" class="crop-modal">
      <div class="crop-container">
        <div class="crop-header">
          <button class="crop-cancel" @click="cancelCrop">取消</button>
          <div></div>
          <button class="crop-confirm" @click="confirmCrop">确定</button>
        </div>

        <div class="crop-preview">
          <div class="crop-area">
            <div class="image-container" @mousedown="startImageDrag" @touchstart="startImageDrag">
              <img
                ref="cropImageRef"
                :src="previewImageUrl"
                class="crop-image"
                :style="imageStyle"
              />
            </div>
            <div class="crop-overlay">
              <div class="crop-box" :style="cropBoxStyle">
                <div class="crop-grid">
                  <div class="grid-line grid-line-h" style="top: 33.33%"></div>
                  <div class="grid-line grid-line-h" style="top: 66.66%"></div>
                  <div class="grid-line grid-line-v" style="left: 33.33%"></div>
                  <div class="grid-line grid-line-v" style="left: 66.66%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="crop-controls">
          <button class="crop-reselect" @click="reselectImage">重新选择</button>
          <button class="crop-reset" @click="resetCrop">重置</button>
          <button class="crop-rotate" @click="rotateImage">旋转</button>
        </div>
      </div>

      <!-- 隐藏的canvas用于裁剪 -->
      <canvas ref="cropCanvasRef" style="display: none;"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const showMenu = ref(false)
const showCamera = ref(false)
const showCrop = ref(false)
const cameraInput = ref<HTMLInputElement>()
const albumInput = ref<HTMLInputElement>()
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const cropImageRef = ref<HTMLImageElement>()
const cropCanvasRef = ref<HTMLCanvasElement>()
const uploading = ref(false)
const currentStream = ref<MediaStream | null>(null)
const currentFacingMode = ref<'user' | 'environment'>('environment')

// 裁剪相关状态
const previewImageUrl = ref('')
const originalImageFile = ref<File | null>(null)
const cropBox = ref({
  x: 50,
  y: 50,
  width: 200,
  height: 200
})
const imageRotation = ref(0)
const imagePosition = ref({ x: 0, y: 0 })
const imageScale = ref(1)
const isDragging = ref(false)
const isImageDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imageStart = ref({ x: 0, y: 0 })

// 用户信息
const userInfo = computed(() => {
  const currentUser = authStore.user
  if (!currentUser) {
    return {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
    }
  }

  return {
    avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.yeyu_id || 'default'}&backgroundColor=b6e3f4`
  }
})

// 裁剪框样式
const cropBoxStyle = computed(() => ({
  left: `${cropBox.value.x}px`,
  top: `${cropBox.value.y}px`,
  width: `${cropBox.value.width}px`,
  height: `${cropBox.value.height}px`
}))

// 图片样式
const imageStyle = computed(() => ({
  transform: `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) rotate(${imageRotation.value}deg) scale(${imageScale.value})`,
  transformOrigin: 'center center',
  transition: isImageDragging.value ? 'none' : 'transform 0.3s ease'
}))



// 处理顶部按钮点击
const handleTopBarAction = (action: string) => {
  if (action === 'showMenu') {
    showMenu.value = true
  }
}

// 隐藏菜单
const hideMenu = () => {
  showMenu.value = false
}

// 拍照 - 打开相机
const takePhoto = async () => {
  hideMenu()
  try {
    // 检查是否支持相机
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // 不支持相机，回退到文件选择
      if (cameraInput.value) {
        cameraInput.value.click()
      }
      return
    }

    showCamera.value = true
    await startCamera()
  } catch (error) {
    console.error('打开相机失败:', error)
    // 相机失败，回退到文件选择
    if (cameraInput.value) {
      cameraInput.value.click()
    }
  }
}

// 从相册选择
const selectFromAlbum = () => {
  hideMenu()
  if (albumInput.value) {
    albumInput.value.click()
  }
}

// 在相机界面中选择相册
const selectFromAlbumInCamera = () => {
  if (albumInput.value) {
    albumInput.value.click()
  }
}

// 启动相机
const startCamera = async () => {
  try {
    // 停止当前流
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
    }

    const constraints = {
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    currentStream.value = stream

    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('启动相机失败:', error)
    alert('无法访问相机，请检查权限设置')
    closeCamera()
  }
}

// 切换前后摄像头
const switchCamera = async () => {
  currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user'
  await startCamera()
}

// 拍照
const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')

  if (!context) return

  // 设置canvas尺寸
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // 绘制视频帧到canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 转换为blob并进入裁剪模式
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
      showImageCrop(file)
      closeCamera()
    }
  }, 'image/jpeg', 0.9)
}

// 关闭相机
const closeCamera = () => {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach(track => track.stop())
    currentStream.value = null
  }
  showCamera.value = false
}

// 处理拍照文件选择（回退方案）
const handleCameraSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    showImageCrop(file)
  }
  target.value = ''
}

// 处理相册文件选择
const handleAlbumSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    showImageCrop(file)
    closeCamera() // 如果在相机界面选择的相册，关闭相机
  }
  target.value = ''
}

// 上传头像
const uploadAvatar = async (file: File) => {
  if (uploading.value) return

  try {
    uploading.value = true
    console.log('🔄 正在上传头像:', file.name)

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      appStore.showToast('图片大小不能超过5MB', 'error')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      appStore.showToast('请选择图片文件', 'error')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch('http://localhost:8893/api/user/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ 头像上传成功:', result.data)

      // 更新authStore中的用户头像
      if (authStore.user) {
        authStore.user.avatar = result.data.avatar
        localStorage.setItem('yeyu_user', JSON.stringify(authStore.user))
      }

      // 刷新用户信息
      await authStore.fetchUserInfo()

      appStore.showToast('头像更新成功', 'success')

      // 关闭裁剪界面，返回上一页
      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      throw new Error(result.error || '上传失败')
    }
  } catch (error) {
    console.error('❌ 头像上传失败:', error)
    appStore.showToast('头像上传失败，请重试', 'error')
  } finally {
    uploading.value = false
  }
}

// 显示图片裁剪界面
const showImageCrop = (file: File) => {
  originalImageFile.value = file

  // 创建图片预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImageUrl.value = e.target?.result as string
    showCrop.value = true

    // 等待图片加载后初始化裁剪框
    nextTick(() => {
      initializeCropBox()
    })
  }
  reader.readAsDataURL(file)
}

// 初始化裁剪框
const initializeCropBox = () => {
  if (!cropImageRef.value) return

  const container = cropImageRef.value.parentElement?.parentElement
  const containerRect = container?.getBoundingClientRect()

  if (!containerRect) return

  // 根据屏幕宽度计算裁剪框大小：屏幕宽度 - 40px
  const screenWidth = window.innerWidth
  const maxCropSize = screenWidth - 40

  // 获取图片的实际显示尺寸
  const img = cropImageRef.value
  const imgDisplayWidth = img.clientWidth
  const imgDisplayHeight = img.clientHeight

  // 如果图片比裁剪框小，使用图片的实际大小作为裁剪框大小
  const minDimension = Math.min(imgDisplayWidth, imgDisplayHeight)
  const cropSize = Math.min(maxCropSize, minDimension)

  // 裁剪框固定在容器中心
  const centerX = containerRect.width / 2
  const centerY = containerRect.height / 2

  cropBox.value = {
    x: centerX - cropSize / 2,
    y: centerY - cropSize / 2,
    width: cropSize,
    height: cropSize
  }

  // 重置图片位置和缩放
  imagePosition.value = { x: 0, y: 0 }
  imageScale.value = 1
}

// 开始拖拽图片
const startImageDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isImageDragging.value = true

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragStart.value = { x: clientX, y: clientY }
  imageStart.value = { ...imagePosition.value }

  document.addEventListener('mousemove', handleImageDrag)
  document.addEventListener('mouseup', stopImageDrag)
  document.addEventListener('touchmove', handleImageDrag)
  document.addEventListener('touchend', stopImageDrag)
}

// 处理图片拖拽
const handleImageDrag = (event: MouseEvent | TouchEvent) => {
  if (!isImageDragging.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y

  imagePosition.value = {
    x: imageStart.value.x + deltaX,
    y: imageStart.value.y + deltaY
  }
}

// 停止图片拖拽
const stopImageDrag = () => {
  isImageDragging.value = false

  document.removeEventListener('mousemove', handleImageDrag)
  document.removeEventListener('mouseup', stopImageDrag)
  document.removeEventListener('touchmove', handleImageDrag)
  document.removeEventListener('touchend', stopImageDrag)
}

// 开始调整大小
const startResize = (handle: string) => (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  event.stopPropagation()

  isResizing.value = true
  resizeHandle.value = handle

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragStart.value = { x: clientX, y: clientY }
  cropStart.value = { ...cropBox.value }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleResize)
  document.addEventListener('touchend', stopDrag)
}

// 处理调整大小
const handleResize = (event: MouseEvent | TouchEvent) => {
  if (!isResizing.value || !cropImageRef.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y

  const img = cropImageRef.value
  const rect = img.getBoundingClientRect()
  const container = img.parentElement
  const containerRect = container?.getBoundingClientRect()

  if (!containerRect) return

  // 计算图片在容器中的边界
  const imgLeft = rect.left - containerRect.left
  const imgTop = rect.top - containerRect.top
  const imgRight = imgLeft + img.clientWidth
  const imgBottom = imgTop + img.clientHeight

  // 保持正方形比例
  const delta = Math.max(deltaX, deltaY)

  switch (resizeHandle.value) {
    case 'bottom-right':
      const maxSizeBR = Math.min(imgRight - cropStart.value.x, imgBottom - cropStart.value.y)
      cropBox.value.width = Math.max(100, Math.min(cropStart.value.width + delta, maxSizeBR))
      cropBox.value.height = cropBox.value.width
      break
    case 'bottom-left':
      const maxWidthBL = cropStart.value.x + cropStart.value.width - imgLeft
      const maxHeightBL = imgBottom - cropStart.value.y
      const maxSizeBL = Math.min(maxWidthBL, maxHeightBL)
      const newWidthBL = Math.max(100, Math.min(cropStart.value.width - delta, maxSizeBL))
      cropBox.value.x = cropStart.value.x + cropStart.value.width - newWidthBL
      cropBox.value.width = newWidthBL
      cropBox.value.height = newWidthBL
      break
    case 'top-right':
      const maxWidthTR = imgRight - cropStart.value.x
      const maxHeightTR = cropStart.value.y + cropStart.value.height - imgTop
      const maxSizeTR = Math.min(maxWidthTR, maxHeightTR)
      const newSizeTR = Math.max(100, Math.min(cropStart.value.width + delta, maxSizeTR))
      cropBox.value.y = cropStart.value.y + cropStart.value.height - newSizeTR
      cropBox.value.width = newSizeTR
      cropBox.value.height = newSizeTR
      break
    case 'top-left':
      const maxWidthTL = cropStart.value.x + cropStart.value.width - imgLeft
      const maxHeightTL = cropStart.value.y + cropStart.value.height - imgTop
      const maxSizeTL = Math.min(maxWidthTL, maxHeightTL)
      const newSizeTL = Math.max(100, Math.min(cropStart.value.width - delta, maxSizeTL))
      cropBox.value.x = cropStart.value.x + cropStart.value.width - newSizeTL
      cropBox.value.y = cropStart.value.y + cropStart.value.height - newSizeTL
      cropBox.value.width = newSizeTL
      cropBox.value.height = newSizeTL
      break
  }
}

// 重新选择图片
const reselectImage = () => {
  // 取消当前裁剪
  cancelCrop()
  // 重新打开文件选择器
  if (albumInput.value) {
    albumInput.value.click()
  }
}

// 重置裁剪
const resetCrop = () => {
  initializeCropBox()
  imageRotation.value = 0
}

// 旋转图片
const rotateImage = () => {
  imageRotation.value = (imageRotation.value + 90) % 360
}

// 取消裁剪
const cancelCrop = () => {
  showCrop.value = false
  previewImageUrl.value = ''
  originalImageFile.value = null
  imageRotation.value = 0
}

// 确认裁剪
const confirmCrop = () => {
  if (!cropImageRef.value || !cropCanvasRef.value || !originalImageFile.value) return

  const img = cropImageRef.value
  const canvas = cropCanvasRef.value
  const ctx = canvas.getContext('2d')

  if (!ctx) return

  // 获取图片的实际显示尺寸
  const imgDisplayWidth = img.clientWidth
  const imgDisplayHeight = img.clientHeight
  const minImgDimension = Math.min(imgDisplayWidth, imgDisplayHeight)

  // 如果图片小于裁剪框，使用图片的实际大小；否则使用裁剪框大小
  const actualCropSize = Math.min(cropBox.value.width, minImgDimension)

  // 设置输出尺寸（保持实际裁剪大小，但最小300px用于头像质量）
  const outputSize = Math.max(300, actualCropSize)
  canvas.width = outputSize
  canvas.height = outputSize

  // 清除画布
  ctx.clearRect(0, 0, outputSize, outputSize)

  // 保存当前状态
  ctx.save()

  // 移动到画布中心
  ctx.translate(outputSize / 2, outputSize / 2)

  // 应用旋转
  if (imageRotation.value !== 0) {
    ctx.rotate((imageRotation.value * Math.PI) / 180)
  }

  // 计算图片的实际显示尺寸和位置
  const imgRect = img.getBoundingClientRect()
  const containerRect = img.parentElement?.getBoundingClientRect()

  if (!containerRect) return

  // 计算图片相对于容器的位置（考虑transform）
  const imgCenterX = imgRect.left + imgRect.width / 2 - containerRect.left
  const imgCenterY = imgRect.top + imgRect.height / 2 - containerRect.top

  // 计算裁剪框相对于容器的中心位置
  const cropCenterX = cropBox.value.x + cropBox.value.width / 2
  const cropCenterY = cropBox.value.y + cropBox.value.height / 2

  // 计算图片相对于裁剪框的偏移
  const offsetX = imgCenterX - cropCenterX
  const offsetY = imgCenterY - cropCenterY

  // 计算缩放比例 - 基于实际裁剪大小而不是裁剪框大小
  const scale = outputSize / actualCropSize

  // 绘制图片
  ctx.drawImage(
    img,
    offsetX * scale - (imgDisplayWidth * scale) / 2,
    offsetY * scale - (imgDisplayHeight * scale) / 2,
    imgDisplayWidth * scale,
    imgDisplayHeight * scale
  )

  // 恢复状态
  ctx.restore()

  // 转换为blob并上传
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' })
      uploadAvatar(file)
      cancelCrop()
    }
  }, 'image/jpeg', 0.9)
}

// 窗口大小改变时重新调整裁剪框
const handleWindowResize = () => {
  if (showCrop.value && cropImageRef.value) {
    // 延迟执行，确保DOM已更新
    nextTick(() => {
      initializeCropBox()
    })
  }
}

// 组件挂载时添加窗口大小监听器
onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

// 组件卸载时清理相机资源和事件监听器
onUnmounted(() => {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach(track => track.stop())
  }
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<style scoped>
.avatar-view {
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
}

.avatar-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.avatar-wrapper {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

/* 底部菜单 */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.menu-content {
  width: 100%;
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item.cancel {
  justify-content: center;
  color: #666;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.menu-item:active {
  background: #f8f8f8;
}

/* 相机模态框样式 */
.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.camera-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.camera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  position: relative;
  z-index: 10;
}

.camera-close {
  background: none;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.camera-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.camera-title {
  font-size: 18px;
  font-weight: 500;
}

.camera-preview {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 40px;
  background: rgba(0, 0, 0, 0.8);
  position: relative;
  z-index: 10;
}

.camera-switch,
.camera-album {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.camera-switch:hover,
.camera-album:hover {
  background: rgba(255, 255, 255, 0.3);
}

.camera-capture {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.capture-button {
  width: 70px;
  height: 70px;
  border: 4px solid white;
  border-radius: 50%;
  background: white;
  position: relative;
  transition: transform 0.1s;
}

.capture-button:active {
  transform: scale(0.95);
}

.capture-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  border: 2px solid #000;
}

/* 裁剪界面样式 */
.crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.crop-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.crop-cancel,
.crop-confirm {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
}

.crop-cancel:hover,
.crop-confirm:hover {
  background: rgba(255, 255, 255, 0.1);
}

.crop-confirm {
  color: #07C160;
  font-weight: 500;
}

.crop-title {
  font-size: 18px;
  font-weight: 500;
}

.crop-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #000;
  overflow: hidden;
}

.crop-area {
  position: relative;
  width: 100vw;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}

.crop-image {
  max-width: none;
  max-height: none;
  width: auto;
  height: auto;
  display: block;
  user-select: none;
  pointer-events: none;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.crop-box {
  position: absolute;
  border: 2px solid #07C160;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.crop-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
}

.grid-line-h {
  width: 100%;
  height: 1px;
}

.grid-line-v {
  width: 1px;
  height: 100%;
}



.crop-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.9);
}

.crop-reselect,
.crop-reset,
.crop-rotate {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  min-width: 70px;
}

.crop-reselect:hover,
.crop-reset:hover,
.crop-rotate:hover {
  background: rgba(255, 255, 255, 0.3);
}

.menu-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}
</style>

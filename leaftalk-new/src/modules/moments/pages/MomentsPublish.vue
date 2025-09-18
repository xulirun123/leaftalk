<template>
  <div class="moments-publish">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      title="发表动态"
      :show-back="true"
      :right-buttons="publishButtons"
      @button-click="handlePublish"
      @back="goBack"
    />

    <!-- 发表内容 -->
    <div class="publish-content">
      <!-- 文字输入区域 -->
      <div class="text-section">
        <textarea
          v-model="momentText"
          placeholder="分享新鲜事..."
          class="text-input"
          rows="4"
        ></textarea>
      </div>

      <!-- 媒体内容区域 -->
      <div class="media-section">
        <div class="media-grid">
          <!-- 已选择的媒体 -->
          <div 
            v-for="(media, index) in selectedMedia"
            :key="index"
            class="media-item"
          >
            <img v-if="media.type === 'image'" :src="media.url" alt="图片" />
            <video v-else-if="media.type === 'video'" :src="media.url" controls></video>
            <button @click="removeMedia(index)" class="remove-btn">
              <iconify-icon icon="heroicons:x-mark" width="16" style="color: white;"></iconify-icon>
            </button>
          </div>

          <!-- 添加媒体按钮 -->
          <div v-if="selectedMedia.length < 9" class="add-media-btn" @click="showMediaOptions">
            <iconify-icon icon="heroicons:plus" width="24" style="color: #999;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="settings-section">
        <!-- 所在位置 -->
        <div class="setting-item" @click="selectLocation">
          <div class="setting-icon">
            <iconify-icon icon="heroicons:map-pin" width="20" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="setting-content">
            <div class="setting-label">所在位置</div>
            <div class="setting-value">{{ selectedLocation || '不显示位置' }}</div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>

        <!-- 提醒谁看 -->
        <div class="setting-item" @click="selectRemindUsers">
          <div class="setting-icon">
            <iconify-icon icon="heroicons:at-symbol" width="20" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="setting-content">
            <div class="setting-label">提醒谁看</div>
            <div class="setting-value">{{ remindUsers.length > 0 ? `${remindUsers.length}人` : '不提醒任何人' }}</div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>

        <!-- 谁可以看 -->
        <div class="setting-item" @click="selectVisibility">
          <div class="setting-icon">
            <iconify-icon icon="heroicons:eye" width="20" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="setting-content">
            <div class="setting-label">谁可以看</div>
            <div class="setting-value">{{ getVisibilityText() }}</div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 媒体选择弹窗 -->
    <div v-if="showMediaDialog" class="media-overlay" @click="closeMediaOptions">
      <div class="media-dialog">
        <button @click="takePhoto" class="media-option">
          <iconify-icon icon="heroicons:camera" width="24" style="color: #07C160;"></iconify-icon>
          <span>拍摄</span>
        </button>
        <button @click="selectFromAlbum" class="media-option">
          <iconify-icon icon="heroicons:photo" width="24" style="color: #07C160;"></iconify-icon>
          <span>从相册中选择</span>
        </button>
        <button @click="closeMediaOptions" class="media-option cancel">
          <span>取消</span>
        </button>
      </div>
    </div>

    <!-- 位置选择弹窗 -->
    <div v-if="showLocationDialog" class="location-overlay" @click="closeLocationDialog">
      <div class="location-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">选择位置</div>
          <button @click="closeLocationDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: #666;"></iconify-icon>
          </button>
        </div>
        <div class="location-list">
          <div 
            v-for="location in nearbyLocations"
            :key="location.id"
            class="location-item"
            @click="selectLocationItem(location)"
          >
            <iconify-icon icon="heroicons:map-pin" width="16" style="color: #999;"></iconify-icon>
            <span>{{ location.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 可见性设置弹窗 -->
    <div v-if="showVisibilityDialog" class="visibility-overlay" @click="closeVisibilityDialog">
      <div class="visibility-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">谁可以看</div>
          <button @click="closeVisibilityDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: #666;"></iconify-icon>
          </button>
        </div>
        <div class="visibility-list">
          <div 
            v-for="option in visibilityOptions"
            :key="option.value"
            class="visibility-item"
            :class="{ active: visibility === option.value }"
            @click="selectVisibilityOption(option.value)"
          >
            <iconify-icon :icon="option.icon" width="20" style="color: #07C160;"></iconify-icon>
            <div class="visibility-info">
              <div class="visibility-title">{{ option.title }}</div>
              <div class="visibility-desc">{{ option.description }}</div>
            </div>
            <iconify-icon 
              v-if="visibility === option.value"
              icon="heroicons:check" 
              width="16" 
              style="color: #07C160;"
            ></iconify-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import {
  momentsManager,
  fileUploader,
  mapService,
  type MomentLocation,
  type PublishOptions,
  type FileUploadResult,
  type LocationCoordinates
} from '../utils/index'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 顶部栏按钮
const publishButtons = ref([{ name: '发表', icon: '', action: 'publish' }])

// 返回功能
const goBack = () => {
  console.log('🔙 发表动态返回到朋友圈')
  router.back()
}

// 发表内容
const momentText = ref('')
const selectedFiles = ref<File[]>([])
const selectedMedia = ref<Array<{ type: 'image' | 'video', url: string, file?: File }>>([])
const selectedLocation = ref<MomentLocation | null>(null)
const remindUsers = ref<string[]>([])
const visibility = ref('public')

// 弹窗状态
const showMediaDialog = ref(false)
const showLocationDialog = ref(false)
const showVisibilityDialog = ref(false)
const isPublishing = ref(false)
const publishProgress = ref(0)
const uploadResults = ref<FileUploadResult[]>([])
const isUploading = ref(false)

// 附近位置数据
const nearbyLocations = ref<Array<{
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}>>([])
const isLoadingLocations = ref(false)

// 可见性选项
const visibilityOptions = ref([
  {
    value: 'public',
    title: '公开',
    description: '所有朋友可见',
    icon: 'heroicons:globe-alt'
  },
  {
    value: 'friends',
    title: '朋友圈',
    description: '仅朋友可见',
    icon: 'heroicons:user-group'
  },
  {
    value: 'private',
    title: '仅自己可见',
    description: '只有自己能看到',
    icon: 'heroicons:lock-closed'
  },
  {
    value: 'custom',
    title: '部分可见',
    description: '选择特定朋友可见',
    icon: 'heroicons:users'
  }
])

// 显示媒体选择
const showMediaOptions = () => {
  showMediaDialog.value = true
}

// 关闭媒体选择
const closeMediaOptions = () => {
  showMediaDialog.value = false
}

// 拍摄
const takePhoto = async () => {
  closeMediaOptions()
  try {
    // 调用摄像头拍照
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    })

    // 创建视频元素用于预览
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    // 等待视频加载
    await new Promise(resolve => {
      video.onloadedmetadata = resolve
    })

    // 创建canvas截图
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    // 停止摄像头
    stream.getTracks().forEach(track => track.stop())

    // 转换为Blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        addMediaFile(file)
      }
    }, 'image/jpeg', 0.8)

  } catch (error) {
    console.error('拍照失败:', error)
    appStore.showToast('拍照失败', 'error')
  }
}

// 从相册选择
const selectFromAlbum = () => {
  closeMediaOptions()

  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,video/*'
  input.multiple = true

  input.onchange = (event) => {
    const files = Array.from((event.target as HTMLInputElement).files || [])
    files.forEach(file => addMediaFile(file))
  }

  input.click()
}

// 添加媒体文件
const addMediaFile = async (file: File) => {
  try {
    // 验证文件
    const validation = fileUploader.validateFile(file)
    if (!validation.valid) {
      appStore.showToast(validation.error!, 'error')
      return
    }

    // 检查数量限制（最多9张）
    if (selectedMedia.value.length >= 9) {
      appStore.showToast('最多只能选择9张图片或视频', 'error')
      return
    }

    // 创建预览URL - 使用Data URL
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

      // 添加到选中列表
      selectedMedia.value.push({
        type: mediaType,
        url,
        file
      })
    }
    reader.readAsDataURL(file)

    selectedFiles.value.push(file)

  } catch (error) {
    console.error('添加媒体文件失败:', error)
    appStore.showToast('添加文件失败', 'error')
  }
}

// 删除媒体
const removeMedia = (index: number) => {
  const media = selectedMedia.value[index]

  // 释放URL对象
  if (media.url.startsWith('blob:')) {
    URL.revokeObjectURL(media.url)
  }

  // 从列表中移除
  selectedMedia.value.splice(index, 1)
  if (media.file) {
    const fileIndex = selectedFiles.value.indexOf(media.file)
    if (fileIndex > -1) {
      selectedFiles.value.splice(fileIndex, 1)
    }
  }
}

// 选择位置
const selectLocation = async () => {
  showLocationDialog.value = true
  await loadNearbyLocations()
}

// 关闭位置选择
const closeLocationDialog = () => {
  showLocationDialog.value = false
}

// 选择位置项
const selectLocationItem = (location: { id: string; name: string; address: string; latitude: number; longitude: number }) => {
  selectedLocation.value = {
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude
  }
  closeLocationDialog()
}

// 加载附近位置
const loadNearbyLocations = async () => {
  if (isLoadingLocations.value) return

  isLoadingLocations.value = true

  try {
    // 获取当前位置
    const coordinates = await mapService.getCurrentPosition()

    // 搜索附近POI
    const pois = await mapService.searchNearbyPOI(coordinates, '', 1000)

    // 转换为位置格式
    nearbyLocations.value = pois.map((poi: any) => ({
      id: poi.id,
      name: poi.name,
      address: poi.address,
      latitude: poi.coordinates.latitude,
      longitude: poi.coordinates.longitude
    }))

  } catch (error) {
    console.error('加载附近位置失败:', error)
    appStore.showToast('获取位置失败', 'error')
  } finally {
    isLoadingLocations.value = false
  }
}

// 选择提醒用户
const selectRemindUsers = () => {
  console.log('选择提醒用户')
}

// 选择可见性
const selectVisibility = () => {
  showVisibilityDialog.value = true
}

// 关闭可见性选择
const closeVisibilityDialog = () => {
  showVisibilityDialog.value = false
}

// 选择可见性选项
const selectVisibilityOption = (value: string) => {
  visibility.value = value
  closeVisibilityDialog()
}

// 获取可见性文本
const getVisibilityText = () => {
  const option = visibilityOptions.value.find(opt => opt.value === visibility.value)
  return option ? option.title : '公开'
}

// 发表动态
const handlePublish = async () => {
  if (!momentText.value.trim() && selectedFiles.value.length === 0) {
    appStore.showToast('请输入内容或选择图片/视频', 'error')
    return
  }

  isPublishing.value = true
  publishProgress.value = 0

  try {
    // 准备发布选项
    const publishOptions: PublishOptions = {
      content: momentText.value.trim(),
      media: selectedFiles.value,
      location: selectedLocation.value || undefined,
      privacy: visibility.value as any
    }

    // 发布朋友圈
    const moment = await momentsManager.publishMoment(publishOptions)

    publishProgress.value = 100
    appStore.showToast('发表成功！', 'success')

    // 清理资源
    cleanupResources()

    // 返回上一页
    router.back()

  } catch (error) {
    console.error('发表失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '发表失败', 'error')
  } finally {
    isPublishing.value = false
    publishProgress.value = 0
  }
}

// 清理资源
const cleanupResources = () => {
  // 释放所有URL对象
  selectedMedia.value.forEach(media => {
    if (media.url.startsWith('blob:')) {
      URL.revokeObjectURL(media.url)
    }
  })

  // 清空数据
  momentText.value = ''
  selectedMedia.value = []
  selectedFiles.value = []
  selectedLocation.value = null
  uploadResults.value = []
}

// 事件处理
const handleUploadProgress = (progress: any) => {
  publishProgress.value = Math.round(progress.percentage * 0.8) // 上传占80%进度
}

const handleUploadComplete = (result: FileUploadResult) => {
  uploadResults.value.push(result)
}

const handleUploadError = (error: any) => {
  console.error('文件上传错误:', error)
  appStore.showToast('文件上传失败', 'error')
}

onMounted(() => {
  // 设置文件上传事件监听
  fileUploader.on('uploadProgress', handleUploadProgress)
  fileUploader.on('uploadComplete', handleUploadComplete)
  fileUploader.on('uploadError', handleUploadError)

  // 根据来源类型初始化
  const type = route.query.type
  if (type === 'camera') {
    // 如果是拍摄，自动调用拍照
    setTimeout(() => takePhoto(), 100)
  } else if (type === 'album') {
    // 如果是相册，自动调用选择
    setTimeout(() => selectFromAlbum(), 100)
  }
})

onUnmounted(() => {
  // 移除事件监听
  fileUploader.off('uploadProgress', handleUploadProgress)
  fileUploader.off('uploadComplete', handleUploadComplete)
  fileUploader.off('uploadError', handleUploadError)

  // 清理资源
  cleanupResources()
})
</script>

<style scoped>
.moments-publish {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.publish-content {
  padding: 81px 16px 16px;
}

.text-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background: transparent;
}

.text-input::placeholder {
  color: #999;
}

.media-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.media-item img,
.media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-media-btn {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.add-media-btn:hover {
  border-color: #07C160;
}

.settings-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #f0f8ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.setting-content {
  flex: 1;
}

.setting-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.setting-value {
  font-size: 14px;
  color: #666;
}

.media-overlay,
.location-overlay,
.visibility-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.media-dialog {
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

.media-option {
  width: 100%;
  padding: 16px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.media-option:hover {
  background: #f0f0f0;
}

.media-option.cancel {
  color: #666;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
  padding-top: 20px;
}

.location-overlay,
.visibility-overlay {
  align-items: center;
}

.location-dialog,
.visibility-dialog {
  background: white;
  border-radius: 12px;
  margin: 20px;
  max-width: 400px;
  width: 100%;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

.location-list,
.visibility-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.location-item:last-child {
  border-bottom: none;
}

.location-item:hover {
  background: #f8f8f8;
}

.visibility-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.visibility-item:last-child {
  border-bottom: none;
}

.visibility-item:hover {
  background: #f8f8f8;
}

.visibility-item.active {
  background: #f0f8ff;
}

.visibility-info {
  flex: 1;
}

.visibility-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.visibility-desc {
  font-size: 12px;
  color: #666;
}
</style>

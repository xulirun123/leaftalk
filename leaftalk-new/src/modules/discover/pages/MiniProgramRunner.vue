<template>
  <div class="mini-program-runner">
    <!-- 顶部导航栏 -->
    <div class="runner-header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="20" style="color: white;" />
      </button>
      
      <div class="program-title">{{ currentProgram?.name || $t('miniPrograms.loading') }}</div>
      
      <div class="header-actions">
        <button @click="showMenu = !showMenu" class="menu-btn">
          <iconify-icon icon="heroicons:ellipsis-horizontal" width="20" style="color: white;" />
        </button>
      </div>

      <!-- 菜单下拉 -->
      <div v-if="showMenu" class="action-menu" @click="showMenu = false">
        <div class="menu-item" @click="refreshProgram">
          <iconify-icon icon="heroicons:arrow-path" width="16" />
          {{ $t('miniPrograms.refresh') }}
        </div>
        <div class="menu-item" @click="shareProgram">
          <iconify-icon icon="heroicons:share" width="16" />
          {{ $t('miniPrograms.share') }}
        </div>
        <div class="menu-item" @click="showProgramInfo">
          <iconify-icon icon="heroicons:information-circle" width="16" />
          {{ $t('miniPrograms.info') }}
        </div>
        <div class="menu-item danger" @click="closeProgram">
          <iconify-icon icon="heroicons:x-mark" width="16" />
          {{ $t('miniPrograms.close') }}
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ $t('miniPrograms.loading') }}</div>
    </div>

    <!-- 小程序容器 -->
    <div 
      ref="programContainer" 
      class="program-container"
      :class="{ hidden: isLoading }"
    ></div>

    <!-- 错误状态 -->
    <div v-if="hasError" class="error-container">
      <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #ff6b6b;" />
      <div class="error-title">{{ $t('miniPrograms.loadError') }}</div>
      <div class="error-message">{{ errorMessage }}</div>
      <button @click="retryLoad" class="retry-btn">
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- 小程序信息弹窗 -->
    <div v-if="showInfo" class="info-overlay" @click="showInfo = false">
      <div class="info-modal" @click.stop>
        <div class="info-header">
          <h3>{{ $t('miniPrograms.programInfo') }}</h3>
          <button @click="showInfo = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="info-content">
          <div class="info-item">
            <span class="info-label">{{ $t('miniPrograms.name') }}</span>
            <span class="info-value">{{ currentProgram?.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ $t('miniPrograms.version') }}</span>
            <span class="info-value">v{{ currentProgram?.version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ $t('miniPrograms.developer') }}</span>
            <span class="info-value">{{ currentProgram?.developer }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ $t('miniPrograms.size') }}</span>
            <span class="info-value">{{ currentProgram?.size }}MB</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ $t('miniPrograms.runningTime') }}</span>
            <span class="info-value">{{ formatRunningTime() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <div v-if="showShareDialog" class="share-overlay" @click="showShareDialog = false">
      <div class="share-modal" @click.stop>
        <div class="share-header">
          <h3>{{ $t('miniPrograms.shareProgram') }}</h3>
          <button @click="showShareDialog = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="share-content">
          <div class="share-preview">
            <div class="share-icon">{{ currentProgram?.icon }}</div>
            <div class="share-info">
              <div class="share-name">{{ currentProgram?.name }}</div>
              <div class="share-desc">{{ currentProgram?.description }}</div>
            </div>
          </div>
          
          <div class="share-options">
            <div class="share-option" @click="shareToChat">
              <iconify-icon icon="heroicons:chat-bubble-left" width="24" style="color: #07c160;" />
              <span>{{ $t('miniPrograms.shareToChat') }}</span>
            </div>
            <div class="share-option" @click="shareToMoments">
              <iconify-icon icon="heroicons:photo" width="24" style="color: #07c160;" />
              <span>{{ $t('miniPrograms.shareToMoments') }}</span>
            </div>
            <div class="share-option" @click="copyLink">
              <iconify-icon icon="heroicons:link" width="24" style="color: #07c160;" />
              <span>{{ $t('miniPrograms.copyLink') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import { useAppStore } from '../../../shared/stores/appStore'
import { miniProgramManager, type MiniProgramInfo, type MiniProgramRuntime } from '../../utils/miniProgram'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

// 响应式数据
const programContainer = ref<HTMLElement>()
const currentProgram = ref<MiniProgramInfo | null>(null)
const currentRuntime = ref<MiniProgramRuntime | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const showMenu = ref(false)
const showInfo = ref(false)
const showShareDialog = ref(false)

// 获取小程序ID
const programId = route.params.id as string

// 方法
const goBack = () => {
  closeProgram()
  router.back()
}

const loadProgram = async () => {
  try {
    isLoading.value = true
    hasError.value = false
    
    // 获取小程序信息
    const installedPrograms = miniProgramManager.getInstalledPrograms()
    currentProgram.value = installedPrograms.find(p => p.id === programId) || null
    
    if (!currentProgram.value) {
      throw new Error(t('miniPrograms.programNotFound'))
    }

    // 等待容器准备就绪
    await nextTick()
    
    if (!programContainer.value) {
      throw new Error(t('miniPrograms.containerError'))
    }

    // 启动小程序
    const success = await miniProgramManager.launchProgram(programId, programContainer.value)
    
    if (!success) {
      throw new Error(t('miniPrograms.launchError'))
    }

    // 获取运行时信息
    const runningPrograms = miniProgramManager.getRunningPrograms()
    currentRuntime.value = runningPrograms.find(r => r.id === programId) || null

    isLoading.value = false

  } catch (error) {
    console.error('加载小程序失败:', error)
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : t('miniPrograms.unknownError')
    isLoading.value = false
  }
}

const refreshProgram = () => {
  if (currentRuntime.value?.iframe) {
    currentRuntime.value.iframe.src = currentRuntime.value.iframe.src
  }
}

const shareProgram = () => {
  showShareDialog.value = true
}

const showProgramInfo = () => {
  showInfo.value = true
}

const closeProgram = () => {
  if (programId) {
    miniProgramManager.closeProgram(programId)
  }
}

const retryLoad = () => {
  hasError.value = false
  loadProgram()
}

const formatRunningTime = () => {
  if (!currentRuntime.value) return '0分钟'
  
  const runningTime = Date.now() - currentRuntime.value.startTime
  const minutes = Math.floor(runningTime / 60000)
  const seconds = Math.floor((runningTime % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  }
  return `${seconds}秒`
}

const shareToChat = () => {
  // 分享到聊天
  appStore.showToast(t('miniPrograms.shareSuccess'), 'success')
  showShareDialog.value = false
}

const shareToMoments = () => {
  // 分享到朋友圈
  appStore.showToast(t('miniPrograms.shareSuccess'), 'success')
  showShareDialog.value = false
}

const copyLink = () => {
  // 复制链接
  const link = `${window.location.origin}/mini-program/${programId}`
  navigator.clipboard?.writeText(link).then(() => {
    appStore.showToast(t('miniPrograms.linkCopied'), 'success')
  }).catch(() => {
    appStore.showToast(t('miniPrograms.copyFailed'), 'error')
  })
  showShareDialog.value = false
}

// 事件监听
const handleProgramReady = (runtime: MiniProgramRuntime) => {
  if (runtime.id === programId) {
    isLoading.value = false
  }
}

const handleProgramClosed = (data: any) => {
  if (data.programId === programId) {
    router.back()
  }
}

const handleShowToast = (data: any) => {
  appStore.showToast(data.message, 'info')
}

// 生命周期
onMounted(() => {
  // 监听小程序事件
  miniProgramManager.on('ready', handleProgramReady)
  miniProgramManager.on('closed', handleProgramClosed)
  miniProgramManager.on('show_toast', handleShowToast)
  
  // 加载小程序
  loadProgram()
})

onUnmounted(() => {
  // 移除事件监听
  miniProgramManager.off('ready', handleProgramReady)
  miniProgramManager.off('closed', handleProgramClosed)
  miniProgramManager.off('show_toast', handleShowToast)
  
  // 关闭小程序
  closeProgram()
})
</script>

<style scoped>
.mini-program-runner {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
}

.runner-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #333;
  color: white;
  z-index: 100;
}

.back-btn, .menu-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover, .menu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.program-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  margin: 0 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  position: relative;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 101;
  min-width: 150px;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item.danger {
  color: #ff4444;
}

.menu-item.danger:hover {
  background: #ffebee;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
}

.program-container {
  flex: 1;
  background: white;
  transition: opacity 0.3s;
}

.program-container.hidden {
  opacity: 0;
}

.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 40px 20px;
  text-align: center;
}

.error-title {
  font-size: 18px;
  font-weight: 500;
  margin: 16px 0 8px 0;
  color: #333;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.retry-btn {
  padding: 10px 20px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #06a552;
}

/* 弹窗样式 */
.info-overlay, .share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.info-modal, .share-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.info-header, .share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.info-header h3, .share-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.info-content, .share-content {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.share-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.share-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
}

.share-info {
  flex: 1;
}

.share-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.share-desc {
  font-size: 14px;
  color: #666;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-option:hover {
  border-color: #07c160;
  background: #f0f8f0;
}

.share-option span {
  font-size: 14px;
  color: #333;
}
</style>

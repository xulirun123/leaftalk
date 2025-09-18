<template>
  <div class="general">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('settings.general') }}</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 多语言 -->
      <div class="settings-section">
        <div class="section-title">多语言</div>
        <div class="setting-item" @click="setLanguage">
          <div class="setting-info">
            <span>{{ $t('settings.language') }}</span>
            <span class="setting-value">{{ generalStore.languageLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 字体大小 -->
      <div class="settings-section">
        <div class="section-title">字体大小</div>
        <div class="setting-item" @click="setFontSize">
          <div class="setting-info">
            <span>{{ $t('settings.fontSize') }}</span>
            <span class="setting-value">{{ generalStore.fontSizeLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 聊天 -->
      <div class="settings-section">
        <div class="section-title">{{ $t('settings.chat') }}</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>{{ $t('settings.enterToSend') }}</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.enterToSend }" @click="toggleEnterToSend">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>{{ $t('settings.translateEnabled') }}</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.translateEnabled }" @click="toggleTranslate">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setChatBackground">
          <div class="setting-info">
            <span>{{ $t('settings.chatBackground') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setEmojiSettings">
          <div class="setting-info">
            <span>{{ $t('settings.emojiSettings') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 照片、视频、文件和通话 -->
      <div class="settings-section">
        <div class="section-title">{{ $t('settings.mediaAndFiles') }}</div>
        <div class="setting-item" @click="setPhotoVideo">
          <div class="setting-info">
            <span>{{ $t('settings.photoAndVideo') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动下载</span>
          </div>
          <ToggleSwitch
            :model-value="generalStore.settings?.autoDownload ?? true"
            @update:model-value="toggleAutoDownload"
          />
        </div>
        <div class="setting-item" @click="setStorageUsage">
          <div class="setting-info">
            <span>{{ $t('settings.storage') }}</span>
            <span class="setting-value">{{ generalStore.storageUsedGB }}GB / {{ generalStore.storageTotalGB }}GB</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 发现页管理 -->
      <div class="settings-section">
        <div class="section-title">发现页管理</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>朋友圈</span>
          </div>
          <ToggleSwitch
            :model-value="generalStore.settings?.momentsEnabled ?? true"
            @update:model-value="toggleMoments"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>视频号</span>
          </div>
          <ToggleSwitch
            :model-value="generalStore.settings?.videoChannelEnabled ?? true"
            @update:model-value="toggleVideoChannel"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>直播和附近</span>
          </div>
          <ToggleSwitch
            :model-value="generalStore.settings?.liveAndNearbyEnabled ?? true"
            @update:model-value="toggleLiveAndNearby"
          />
        </div>
      </div>

      <!-- 辅助功能 -->
      <div class="settings-section">
        <div class="section-title">辅助功能</div>
        <div class="setting-item" @click="setAccessibility">
          <div class="setting-info">
            <span>辅助功能</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>听筒模式</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.earphoneMode }" @click="toggleEarphoneMode">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="settings-section">
        <div class="section-title">关于</div>
        <div class="setting-item" @click="checkUpdate">
          <div class="setting-info">
            <span>检查新版本</span>
            <span class="setting-value">v{{ generalStore.appVersion }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../../../stores/general'
import ToggleSwitch from '../../../components/common/ToggleSwitch.vue'

const router = useRouter()
const generalStore = useGeneralStore()

const goBack = () => {
  router.back()
}

// 切换开关
const toggleEnterToSend = () => {
  generalStore.updateSetting('enterToSend', !generalStore.settings.enterToSend)
  console.log('回车键发送:', generalStore.settings.enterToSend)
}

const toggleTranslate = () => {
  generalStore.updateSetting('translateEnabled', !generalStore.settings.translateEnabled)
  console.log('翻译功能:', generalStore.settings.translateEnabled)
}

const toggleAutoDownload = (value: boolean) => {
  generalStore.updateSetting('autoDownload', value)
}

const toggleMoments = (value: boolean) => {
  generalStore.updateSetting('momentsEnabled', value)
}

const toggleVideoChannel = (value: boolean) => {
  generalStore.updateSetting('videoChannelEnabled', value)
}

const toggleLiveAndNearby = (value: boolean) => {
  generalStore.updateSetting('liveAndNearbyEnabled', value)
}

const toggleEarphoneMode = () => {
  generalStore.updateSetting('earphoneMode', !generalStore.settings.earphoneMode)
}

// 页面跳转
const setLanguage = () => {
  router.push('/settings/language')
}

const setFontSize = () => {
  router.push('/settings/font-size')
}

const setChatBackground = () => {
  router.push('/settings/chat-background')
}

const setEmojiSettings = () => {
  router.push('/settings/emoji')
}

const setStorageUsage = () => {
  router.push('/settings/storage')
}

const setPhotoVideo = () => {
  router.push('/settings/photo-video')
}

const setAccessibility = () => {
  router.push('/settings/accessibility')
}

const checkUpdate = async () => {
  try {
    console.log('🔍 检查更新中...')
    const result = await generalStore.checkForUpdates()

    if (result.hasUpdate) {
      // 显示更新对话框
      alert(`发现新版本 ${result.version}\n\n${result.description}\n\n大小: ${result.size}`)
    } else {
      alert('已是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    alert('检查更新失败，请稍后重试')
  }
}

onMounted(() => {
  generalStore.init()
})
</script>

<style scoped>
.general {
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
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #d0d0d0;
}

.setting-toggle:hover {
  background: #d5d5d5;
}

.setting-toggle.active {
  background: #07C160;
  border-color: #06a552;
  box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.2);
}

.setting-toggle.active:hover {
  background: #06a552;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* 添加开关状态文字提示 */
.setting-toggle::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  pointer-events: none;
}

.setting-toggle:not(.active)::after {
  content: 'OFF';
  right: 6px;
  color: #999;
}

.setting-toggle.active::after {
  content: 'ON';
  left: 6px;
  color: white;
}
</style>

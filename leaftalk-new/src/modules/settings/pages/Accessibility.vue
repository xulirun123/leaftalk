<template>
  <div class="accessibility-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('settings.accessibility') }}</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 视觉辅助 -->
      <div class="settings-section">
        <div class="section-title">视觉辅助</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>高对比度</span>
            <span class="setting-desc">增强界面对比度，便于视力不佳用户使用</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.highContrast }" @click="toggleHighContrast">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>减少动画</span>
            <span class="setting-desc">减少界面动画效果</span>
          </div>
          <div class="setting-toggle" :class="{ active: reduceMotion }" @click="toggleReduceMotion">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>放大手势</span>
            <span class="setting-desc">支持双击放大图片和文字</span>
          </div>
          <div class="setting-toggle" :class="{ active: zoomGestures }" @click="toggleZoomGestures">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setColorBlindness">
          <div class="setting-info">
            <span>色盲辅助</span>
            <span class="setting-value">{{ colorBlindnessLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 听觉辅助 -->
      <div class="settings-section">
        <div class="section-title">听觉辅助</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>振动反馈</span>
            <span class="setting-desc">接收消息时振动提醒</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.vibrationEnabled }" @click="toggleVibration">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>闪光提醒</span>
            <span class="setting-desc">接收消息时闪烁屏幕</span>
          </div>
          <div class="setting-toggle" :class="{ active: flashAlert }" @click="toggleFlashAlert">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>字幕显示</span>
            <span class="setting-desc">视频通话时显示字幕</span>
          </div>
          <div class="setting-toggle" :class="{ active: showSubtitles }" @click="toggleSubtitles">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 语音辅助 -->
      <div class="settings-section">
        <div class="section-title">语音辅助</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>语音转文字</span>
            <span class="setting-desc">自动将语音消息转换为文字</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.voiceToText }" @click="toggleVoiceToText">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>文字转语音</span>
            <span class="setting-desc">朗读接收到的文字消息</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.textToVoice }" @click="toggleTextToVoice">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setVoiceSpeed">
          <div class="setting-info">
            <span>语音速度</span>
            <span class="setting-value">{{ voiceSpeedLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setVoiceLanguage">
          <div class="setting-info">
            <span>语音语言</span>
            <span class="setting-value">{{ voiceLanguageLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 操作辅助 -->
      <div class="settings-section">
        <div class="section-title">操作辅助</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>单手模式</span>
            <span class="setting-desc">调整界面布局便于单手操作</span>
          </div>
          <div class="setting-toggle" :class="{ active: oneHandMode }" @click="toggleOneHandMode">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>长按延迟</span>
            <span class="setting-desc">调整长按操作的触发时间</span>
          </div>
          <div class="setting-toggle" :class="{ active: longPressDelay }" @click="toggleLongPressDelay">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>按钮提示</span>
            <span class="setting-desc">显示按钮功能提示</span>
          </div>
          <div class="setting-toggle" :class="{ active: buttonHints }" @click="toggleButtonHints">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 重置选项 -->
      <div class="settings-section">
        <div class="section-title">重置选项</div>
        <div class="setting-item" @click="resetAccessibilitySettings">
          <div class="setting-info">
            <iconify-icon icon="heroicons:arrow-path" width="20" style="color: #ff9500;"></iconify-icon>
            <span>重置辅助功能设置</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../stores/settingsStore'

const router = useRouter()
const generalStore = useGeneralStore()

// 辅助功能设置
const reduceMotion = ref(false)
const zoomGestures = ref(true)
const colorBlindness = ref('none')
const flashAlert = ref(false)
const showSubtitles = ref(false)
const voiceSpeed = ref('normal')
const voiceLanguage = ref('zh-CN')
const oneHandMode = ref(false)
const longPressDelay = ref(false)
const buttonHints = ref(false)

// 计算属性
const colorBlindnessLabel = computed(() => {
  const labels = {
    'none': '无',
    'protanopia': '红色盲',
    'deuteranopia': '绿色盲',
    'tritanopia': '蓝色盲'
  }
  return labels[colorBlindness.value as keyof typeof labels] || '无'
})

const voiceSpeedLabel = computed(() => {
  const labels = {
    'slow': '慢速',
    'normal': '正常',
    'fast': '快速'
  }
  return labels[voiceSpeed.value as keyof typeof labels] || '正常'
})

const voiceLanguageLabel = computed(() => {
  const labels = {
    'zh-CN': '中文',
    'en-US': 'English',
    'ja-JP': '日本語'
  }
  return labels[voiceLanguage.value as keyof typeof labels] || '中文'
})

const goBack = () => {
  router.back()
}

// 切换方法
const toggleHighContrast = () => {
  generalStore.updateSetting('highContrast', !generalStore.settings.highContrast)
}

const toggleReduceMotion = () => {
  reduceMotion.value = !reduceMotion.value
}

const toggleZoomGestures = () => {
  zoomGestures.value = !zoomGestures.value
}

const toggleVibration = () => {
  generalStore.updateSetting('vibrationEnabled', !generalStore.settings.vibrationEnabled)
}

const toggleFlashAlert = () => {
  flashAlert.value = !flashAlert.value
}

const toggleSubtitles = () => {
  showSubtitles.value = !showSubtitles.value
}

const toggleVoiceToText = () => {
  generalStore.updateSetting('voiceToText', !generalStore.settings.voiceToText)
}

const toggleTextToVoice = () => {
  generalStore.updateSetting('textToVoice', !generalStore.settings.textToVoice)
}

const toggleOneHandMode = () => {
  oneHandMode.value = !oneHandMode.value
}

const toggleLongPressDelay = () => {
  longPressDelay.value = !longPressDelay.value
}

const toggleButtonHints = () => {
  buttonHints.value = !buttonHints.value
}

// 设置方法
const setColorBlindness = () => {
  console.log('设置色盲辅助')
}

const setVoiceSpeed = () => {
  console.log('设置语音速度')
}

const setVoiceLanguage = () => {
  console.log('设置语音语言')
}

const resetAccessibilitySettings = () => {
  if (confirm('确定要重置所有辅助功能设置吗？')) {
    // 重置所有设置
    reduceMotion.value = false
    zoomGestures.value = true
    colorBlindness.value = 'none'
    flashAlert.value = false
    showSubtitles.value = false
    voiceSpeed.value = 'normal'
    voiceLanguage.value = 'zh-CN'
    oneHandMode.value = false
    longPressDelay.value = false
    buttonHints.value = false
    
    // 重置store中的设置
    generalStore.updateSetting('highContrast', false)
    generalStore.updateSetting('vibrationEnabled', true)
    generalStore.updateSetting('voiceToText', true)
    generalStore.updateSetting('textToVoice', false)
  }
}
</script>

<style scoped>
.accessibility-settings {
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
  display: flex;
  align-items: center;
  gap: 8px;
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

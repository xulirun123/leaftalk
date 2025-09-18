<template>
  <div class="video-call-translator">
    <!-- 翻译控制面板 -->
    <div class="translation-panel" :class="{ collapsed: !showPanel }">
      <div class="panel-header">
        <div class="title">
          <i class="icon-translate"></i>
          <span>实时翻译</span>
        </div>
        <button @click="togglePanel" class="toggle-btn">
          <i :class="showPanel ? 'icon-chevron-up' : 'icon-chevron-down'"></i>
        </button>
      </div>

      <div class="panel-content" v-if="showPanel">
        <!-- 翻译开关 -->
        <div class="translation-toggle">
          <div class="toggle-item">
            <span>启用翻译</span>
            <div class="toggle-switch" :class="{ active: isTranslationEnabled }" @click="toggleTranslation">
              <div class="toggle-handle"></div>
            </div>
          </div>
        </div>

        <!-- 语言配置 -->
        <div class="language-config">
          <div class="language-row">
            <div class="user-config">
              <div class="avatar">
                <img :src="localUser.avatar" :alt="localUser.name">
              </div>
              <div class="config">
                <div class="name">{{ localUser.name }} (我)</div>
                <select v-model="localLanguage" @change="updateConfig">
                  <option v-for="(lang, code) in supportedLanguages" :key="code" :value="code">
                    {{ lang.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="swap-icon" @click="swapLanguages">
              <i class="icon-swap"></i>
            </div>
            
            <div class="user-config">
              <div class="config">
                <div class="name">{{ remoteUser.name }}</div>
                <select v-model="remoteLanguage" @change="updateConfig">
                  <option v-for="(lang, code) in supportedLanguages" :key="code" :value="code">
                    {{ lang.name }}
                  </option>
                </select>
              </div>
              <div class="avatar">
                <img :src="remoteUser.avatar" :alt="remoteUser.name">
              </div>
            </div>
          </div>
        </div>

        <!-- 翻译设置 -->
        <div class="translation-settings">
          <div class="setting-row">
            <span>显示字幕</span>
            <div class="toggle-switch" :class="{ active: showSubtitles }" @click="showSubtitles = !showSubtitles">
              <div class="toggle-handle"></div>
            </div>
          </div>
          <div class="setting-row">
            <span>语音播放</span>
            <div class="toggle-switch" :class="{ active: enableVoiceOutput }" @click="enableVoiceOutput = !enableVoiceOutput">
              <div class="toggle-handle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 字幕显示区域 -->
    <div class="subtitles-container" v-if="showSubtitles && isTranslationEnabled">
      <!-- 本地用户字幕 -->
      <div class="subtitle-track local" v-if="localSubtitle">
        <div class="subtitle-content">
          <div class="original">{{ localSubtitle.original }}</div>
          <div class="translated">{{ localSubtitle.translated }}</div>
        </div>
        <div class="user-indicator">
          <img :src="localUser.avatar" :alt="localUser.name">
          <span>{{ localUser.name }}</span>
        </div>
      </div>

      <!-- 远程用户字幕 -->
      <div class="subtitle-track remote" v-if="remoteSubtitle">
        <div class="subtitle-content">
          <div class="original">{{ remoteSubtitle.original }}</div>
          <div class="translated">{{ remoteSubtitle.translated }}</div>
        </div>
        <div class="user-indicator">
          <img :src="remoteUser.avatar" :alt="remoteUser.name">
          <span>{{ remoteUser.name }}</span>
        </div>
      </div>
    </div>

    <!-- 翻译状态指示器 -->
    <div class="translation-status" v-if="isTranslationEnabled">
      <div class="status-dot" :class="{ active: isListening, translating: isTranslating }"></div>
      <span class="status-text">
        {{ isTranslating ? '翻译中...' : isListening ? '监听中' : '待机' }}
      </span>
    </div>

    <!-- 翻译历史（可选） -->
    <div class="translation-history" v-if="showHistory && translationHistory.length > 0">
      <div class="history-header">
        <span>翻译记录</span>
        <button @click="clearHistory" class="clear-btn">清空</button>
      </div>
      <div class="history-list">
        <div v-for="(item, index) in translationHistory" :key="index" class="history-item">
          <div class="speaker">
            <img :src="item.speaker.avatar" :alt="item.speaker.name">
            <span>{{ item.speaker.name }}</span>
          </div>
          <div class="content">
            <div class="original">{{ item.original }}</div>
            <div class="translated">{{ item.translated }}</div>
          </div>
          <div class="timestamp">{{ formatTime(item.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { autoTranslationService, globalTranslationManager } from '../../../shared/services/autoTranslationService'

// Props
interface Props {
  localUser: {
    id: string
    name: string
    avatar: string
  }
  remoteUser: {
    id: string
    name: string
    avatar: string
  }
  showHistory?: boolean
  autoStart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHistory: false,
  autoStart: false
})

// Emits
const emit = defineEmits<{
  translationResult: [result: any]
  subtitleUpdate: [subtitle: any]
  configChange: [config: any]
}>()

// 响应式数据
const showPanel = ref(false)
const isTranslationEnabled = ref(false)
const showSubtitles = ref(true)
const enableVoiceOutput = ref(true)

// 语言配置
const localLanguage = ref('zh-CN')
const remoteLanguage = ref('en')

// 翻译状态
const isListening = computed(() => autoTranslationService.isListeningState.value)
const isTranslating = computed(() => autoTranslationService.isTranslatingState.value)

// 字幕数据
const localSubtitle = ref<any>(null)
const remoteSubtitle = ref<any>(null)

// 翻译历史
const translationHistory = ref<any[]>([])

// 支持的语言
const supportedLanguages = {
  'zh-CN': { name: '简体中文' },
  'zh-TW': { name: '繁体中文' },
  'en': { name: 'English' },
  'ja': { name: '日本語' },
  'ko': { name: '한국어' },
  'ms': { name: 'Bahasa Malaysia' }
}

// 方法
const togglePanel = () => {
  showPanel.value = !showPanel.value
}

const toggleTranslation = () => {
  if (isTranslationEnabled.value) {
    stopTranslation()
  } else {
    startTranslation()
  }
}

const startTranslation = () => {
  isTranslationEnabled.value = true
  
  // 启动本地语音翻译（我说话，对方听翻译）
  autoTranslationService.startRealTimeTranslation({
    sourceLanguage: localLanguage.value,
    targetLanguage: remoteLanguage.value,
    enableVoiceOutput: enableVoiceOutput.value,
    voiceSpeed: 1.0,
    voicePitch: 1.0
  })

  console.log('🔄 视频通话翻译已启动')
  emit('configChange', {
    enabled: true,
    localLanguage: localLanguage.value,
    remoteLanguage: remoteLanguage.value
  })
}

const stopTranslation = () => {
  isTranslationEnabled.value = false
  autoTranslationService.stopRealTimeTranslation()
  
  // 清除字幕
  localSubtitle.value = null
  remoteSubtitle.value = null
  
  console.log('⏹️ 视频通话翻译已停止')
  emit('configChange', {
    enabled: false
  })
}

const updateConfig = () => {
  if (isTranslationEnabled.value) {
    autoTranslationService.updateConfig({
      sourceLanguage: localLanguage.value,
      targetLanguage: remoteLanguage.value,
      enableVoiceOutput: enableVoiceOutput.value
    })
  }
  
  emit('configChange', {
    enabled: isTranslationEnabled.value,
    localLanguage: localLanguage.value,
    remoteLanguage: remoteLanguage.value,
    showSubtitles: showSubtitles.value,
    enableVoiceOutput: enableVoiceOutput.value
  })
}

const swapLanguages = () => {
  const temp = localLanguage.value
  localLanguage.value = remoteLanguage.value
  remoteLanguage.value = temp
  updateConfig()
}

// 处理本地语音翻译结果
const handleLocalTranslation = (result: any) => {
  localSubtitle.value = {
    original: result.originalText,
    translated: result.translatedText,
    timestamp: Date.now()
  }
  
  // 添加到历史记录
  if (props.showHistory) {
    addToHistory({
      speaker: props.localUser,
      original: result.originalText,
      translated: result.translatedText,
      timestamp: Date.now()
    })
  }
  
  // 发送翻译结果给对方
  emit('translationResult', {
    type: 'local',
    ...result
  })
  
  emit('subtitleUpdate', localSubtitle.value)
  
  // 3秒后清除字幕
  setTimeout(() => {
    if (localSubtitle.value?.timestamp === result.timestamp) {
      localSubtitle.value = null
    }
  }, 3000)
}

// 处理远程语音翻译（接收对方的语音并翻译）
const handleRemoteTranslation = (audioData: any) => {
  // 这里需要实现接收对方音频并翻译的逻辑
  // 由于WebRTC的复杂性，这里提供接口
  console.log('🎤 接收到远程音频数据:', audioData)
}

// 接收对方发送的翻译结果
const receiveRemoteTranslation = (result: any) => {
  remoteSubtitle.value = {
    original: result.originalText,
    translated: result.translatedText,
    timestamp: Date.now()
  }
  
  // 播放翻译后的语音
  if (enableVoiceOutput.value) {
    autoTranslationService.speakText(result.translatedText, localLanguage.value)
  }
  
  // 添加到历史记录
  if (props.showHistory) {
    addToHistory({
      speaker: props.remoteUser,
      original: result.originalText,
      translated: result.translatedText,
      timestamp: Date.now()
    })
  }
  
  emit('subtitleUpdate', remoteSubtitle.value)
  
  // 3秒后清除字幕
  setTimeout(() => {
    if (remoteSubtitle.value?.timestamp === result.timestamp) {
      remoteSubtitle.value = null
    }
  }, 3000)
}

const addToHistory = (item: any) => {
  translationHistory.value.unshift(item)
  if (translationHistory.value.length > 20) {
    translationHistory.value = translationHistory.value.slice(0, 20)
  }
}

const clearHistory = () => {
  translationHistory.value = []
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 暴露方法给父组件
defineExpose({
  startTranslation,
  stopTranslation,
  receiveRemoteTranslation,
  handleRemoteTranslation,
  isEnabled: computed(() => isTranslationEnabled.value)
})

// 监听全局语言变更
let languageChangeCleanup: (() => void) | null = null

// 生命周期
onMounted(() => {
  if (props.autoStart) {
    startTranslation()
  }

  // 监听全局语言变更事件
  languageChangeCleanup = globalTranslationManager.onLanguageChange((language: string) => {
    console.log('📹 视频翻译收到语言变更:', language)

    // 根据用户选择的语言自动设置翻译
    if (language !== 'zh-CN') {
      // 用户选择了其他语言，设置为：中文 → 目标语言
      localLanguage.value = 'zh-CN'
      remoteLanguage.value = language
    } else {
      // 用户选择了中文，设置为：任意语言 → 中文
      remoteLanguage.value = 'zh-CN'
    }

    updateConfig()

    // 自动启用翻译（如果还没启用）
    if (!isTranslationEnabled.value) {
      startTranslation()
    } else {
      // 如果翻译已启用，重新启动以应用新语言
      stopTranslation()
      setTimeout(() => startTranslation(), 500)
    }
  })
})

onUnmounted(() => {
  if (isTranslationEnabled.value) {
    stopTranslation()
  }

  // 清理语言变更监听器
  if (languageChangeCleanup) {
    languageChangeCleanup()
  }
})

// 监听翻译结果
// 这里需要监听autoTranslationService的翻译结果事件
// 由于当前服务没有事件系统，这里提供接口
</script>

<style scoped>
.video-call-translator {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  z-index: 1000;
}

.translation-panel {
  transition: all 0.3s ease;
}

.translation-panel.collapsed {
  height: 48px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.toggle-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.panel-content {
  padding: 16px;
}

.translation-toggle {
  margin-bottom: 16px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: #07C160;
}

.toggle-handle {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-switch.active .toggle-handle {
  transform: translateX(20px);
}

.language-config {
  margin-bottom: 16px;
}

.language-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-config {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.config .name {
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.config select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
}

.swap-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.swap-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.translation-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtitles-container {
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  pointer-events: none;
}

.subtitle-track {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.subtitle-track.local {
  margin-left: auto;
  max-width: 70%;
}

.subtitle-track.remote {
  margin-right: auto;
  max-width: 70%;
}

.subtitle-content {
  flex: 1;
}

.subtitle-content .original {
  font-size: 14px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.subtitle-content .translated {
  font-size: 16px;
  font-weight: 600;
}

.user-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.8;
}

.user-indicator img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.translation-status {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  transition: background 0.3s;
}

.status-dot.active {
  background: #07C160;
  animation: pulse 1.5s infinite;
}

.status-dot.translating {
  background: #ff9500;
}

.translation-history {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
}

.clear-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.history-item .speaker {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  min-width: 60px;
}

.history-item .speaker img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.history-item .content {
  flex: 1;
  font-size: 11px;
}

.history-item .content .original {
  opacity: 0.7;
  margin-bottom: 2px;
}

.history-item .timestamp {
  font-size: 9px;
  opacity: 0.5;
}
</style>

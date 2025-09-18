<template>
  <div class="real-time-voice-translator">
    <!-- 翻译状态显示 -->
    <div class="translation-status">
      <div class="status-indicator" :class="{ active: isListening, translating: isTranslating }">
        <div class="pulse-ring" v-if="isListening"></div>
        <i class="icon" :class="statusIcon"></i>
      </div>
      <div class="status-text">
        <div class="primary-text">{{ statusText }}</div>
        <div class="secondary-text">{{ languageText }}</div>
      </div>
    </div>

    <!-- 翻译配置 -->
    <div class="translation-config" v-if="showConfig">
      <div class="language-selector">
        <div class="language-item">
          <label>我说的语言</label>
          <select v-model="sourceLanguage" @change="updateConfig">
            <option v-for="(lang, code) in supportedLanguages" :key="code" :value="code">
              {{ lang.name }}
            </option>
          </select>
        </div>
        <div class="swap-button" @click="swapLanguages">
          <i class="icon-swap"></i>
        </div>
        <div class="language-item">
          <label>对方听到的语言</label>
          <select v-model="targetLanguage" @change="updateConfig">
            <option v-for="(lang, code) in supportedLanguages" :key="code" :value="code">
              {{ lang.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="voice-settings">
        <div class="setting-item">
          <label>语音输出</label>
          <div class="toggle-switch" :class="{ active: enableVoiceOutput }" @click="toggleVoiceOutput">
            <div class="toggle-handle"></div>
          </div>
        </div>
        <div class="setting-item" v-if="enableVoiceOutput">
          <label>语速: {{ voiceSpeed.toFixed(1) }}</label>
          <input type="range" v-model="voiceSpeed" min="0.5" max="2.0" step="0.1" @input="updateConfig">
        </div>
        <div class="setting-item" v-if="enableVoiceOutput">
          <label>音调: {{ voicePitch.toFixed(1) }}</label>
          <input type="range" v-model="voicePitch" min="0.5" max="2.0" step="0.1" @input="updateConfig">
        </div>
      </div>
    </div>

    <!-- 翻译历史 -->
    <div class="translation-history" v-if="translationHistory.length > 0">
      <div class="history-header">
        <span>翻译记录</span>
        <button @click="clearHistory" class="clear-btn">清空</button>
      </div>
      <div class="history-list">
        <div 
          v-for="(item, index) in translationHistory" 
          :key="index"
          class="history-item"
        >
          <div class="original-text">
            <span class="language-tag">{{ getLanguageName(item.sourceLanguage) }}</span>
            <span class="text">{{ item.originalText }}</span>
            <button @click="speakText(item.originalText, item.sourceLanguage)" class="speak-btn">
              <i class="icon-volume"></i>
            </button>
          </div>
          <div class="translated-text">
            <span class="language-tag">{{ getLanguageName(item.targetLanguage) }}</span>
            <span class="text">{{ item.translatedText }}</span>
            <button @click="speakText(item.translatedText, item.targetLanguage)" class="speak-btn">
              <i class="icon-volume"></i>
            </button>
          </div>
          <div class="timestamp">{{ formatTime(item.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <button 
        @click="toggleTranslation" 
        class="main-button"
        :class="{ active: isListening, disabled: !isSupported }"
        :disabled="!isSupported"
      >
        <i :class="mainButtonIcon"></i>
        <span>{{ mainButtonText }}</span>
      </button>
      
      <button @click="toggleConfig" class="config-button">
        <i class="icon-settings"></i>
      </button>
      
      <button @click="testTranslation" class="test-button" v-if="showConfig">
        <i class="icon-test"></i>
        <span>测试</span>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <i class="icon-warning"></i>
      <span>{{ error }}</span>
      <button @click="error = ''" class="close-btn">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { autoTranslationService, globalTranslationManager } from '../../services/autoTranslationService'

// Props
interface Props {
  defaultSourceLanguage?: string
  defaultTargetLanguage?: string
  showHistory?: boolean
  maxHistoryItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultSourceLanguage: 'zh-CN',
  defaultTargetLanguage: 'en',
  showHistory: true,
  maxHistoryItems: 10
})

// Emits
const emit = defineEmits<{
  translationResult: [result: any]
  error: [error: string]
  statusChange: [status: string]
}>()

// 响应式数据
const isListening = computed(() => autoTranslationService.isListeningState.value)
const isTranslating = computed(() => autoTranslationService.isTranslatingState.value)
const isSupported = ref(false)
const showConfig = ref(false)
const error = ref('')

// 翻译配置
const sourceLanguage = ref(props.defaultSourceLanguage)
const targetLanguage = ref(props.defaultTargetLanguage)
const enableVoiceOutput = ref(true)
const voiceSpeed = ref(1.0)
const voicePitch = ref(1.0)

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

// 计算属性
const statusIcon = computed(() => {
  if (isTranslating.value) return 'icon-loading'
  if (isListening.value) return 'icon-mic-active'
  return 'icon-mic'
})

const statusText = computed(() => {
  if (isTranslating.value) return '正在翻译...'
  if (isListening.value) return '正在听取语音...'
  return '点击开始实时翻译'
})

const languageText = computed(() => {
  return `${getLanguageName(sourceLanguage.value)} → ${getLanguageName(targetLanguage.value)}`
})

const mainButtonIcon = computed(() => {
  if (isListening.value) return 'icon-stop'
  return 'icon-mic'
})

const mainButtonText = computed(() => {
  if (isListening.value) return '停止翻译'
  return '开始翻译'
})

// 方法
const toggleTranslation = () => {
  if (isListening.value) {
    autoTranslationService.stopRealTimeTranslation()
    emit('statusChange', 'stopped')
  } else {
    startTranslation()
  }
}

const startTranslation = () => {
  try {
    autoTranslationService.startRealTimeTranslation({
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      enableVoiceOutput: enableVoiceOutput.value,
      voiceSpeed: voiceSpeed.value,
      voicePitch: voicePitch.value
    })
    emit('statusChange', 'started')
    error.value = ''
  } catch (err) {
    error.value = '启动翻译失败: ' + (err as Error).message
    emit('error', error.value)
  }
}

const updateConfig = () => {
  autoTranslationService.updateConfig({
    sourceLanguage: sourceLanguage.value,
    targetLanguage: targetLanguage.value,
    enableVoiceOutput: enableVoiceOutput.value,
    voiceSpeed: voiceSpeed.value,
    voicePitch: voicePitch.value
  })
}

const swapLanguages = () => {
  const temp = sourceLanguage.value
  sourceLanguage.value = targetLanguage.value
  targetLanguage.value = temp
  updateConfig()
}

const toggleVoiceOutput = () => {
  enableVoiceOutput.value = !enableVoiceOutput.value
  updateConfig()
}

const toggleConfig = () => {
  showConfig.value = !showConfig.value
}

const testTranslation = async () => {
  try {
    const testText = sourceLanguage.value === 'zh-CN' ? '你好，这是一个测试' : 'Hello, this is a test'
    const result = await autoTranslationService.translateAndSpeak(testText)
    addToHistory(result)
    emit('translationResult', result)
  } catch (err) {
    error.value = '测试失败: ' + (err as Error).message
    emit('error', error.value)
  }
}

const speakText = async (text: string, language: string) => {
  try {
    await autoTranslationService.speakText(text, language)
  } catch (err) {
    error.value = '语音播放失败: ' + (err as Error).message
  }
}

const addToHistory = (result: any) => {
  if (props.showHistory) {
    translationHistory.value.unshift(result)
    if (translationHistory.value.length > props.maxHistoryItems) {
      translationHistory.value = translationHistory.value.slice(0, props.maxHistoryItems)
    }
  }
}

const clearHistory = () => {
  translationHistory.value = []
}

const getLanguageName = (code: string) => {
  return supportedLanguages[code]?.name || code
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 监听全局语言变更
let languageChangeCleanup: (() => void) | null = null

// 生命周期
onMounted(() => {
  // 检查浏览器支持
  isSupported.value = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  if (!isSupported.value) {
    error.value = '您的浏览器不支持语音识别功能'
  }

  // 监听全局语言变更事件
  languageChangeCleanup = globalTranslationManager.onLanguageChange((language: string) => {
    console.log('🎤 语音翻译收到语言变更:', language)

    // 根据用户选择的语言自动设置翻译
    if (language !== 'zh-CN') {
      // 用户选择了其他语言，设置为：中文 → 目标语言
      sourceLanguage.value = 'zh-CN'
      targetLanguage.value = language
    } else {
      // 用户选择了中文，设置为：任意语言 → 中文
      targetLanguage.value = 'zh-CN'
    }

    // 如果正在翻译，重新启动以应用新语言
    if (isListening.value) {
      stopTranslation()
      setTimeout(() => startTranslation(), 500)
    }
  })

  // 监听翻译结果
  // 这里可以添加事件监听器来接收翻译结果
})

onUnmounted(() => {
  // 清理资源
  if (isListening.value) {
    autoTranslationService.stopRealTimeTranslation()
  }

  // 清理语言变更监听器
  if (languageChangeCleanup) {
    languageChangeCleanup()
  }
})
</script>

<style scoped>
.real-time-voice-translator {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.translation-status {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-indicator {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: #07C160;
  color: white;
}

.status-indicator.translating {
  background: #ff9500;
  color: white;
}

.pulse-ring {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid #07C160;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.status-text .primary-text {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.status-text .secondary-text {
  font-size: 14px;
  color: #666;
}

.translation-config {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.language-item {
  flex: 1;
}

.language-item label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.language-item select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.swap-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.swap-button:hover {
  background: #e9ecef;
}

.voice-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item label {
  font-size: 14px;
  color: #333;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #ddd;
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

.control-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.main-button {
  flex: 1;
  padding: 12px 24px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.main-button:hover:not(.disabled) {
  background: #06a552;
}

.main-button.active {
  background: #ff3b30;
}

.main-button.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.config-button, .test-button {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.config-button:hover, .test-button:hover {
  background: #e9ecef;
}

.translation-history {
  margin-top: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.clear-btn {
  padding: 4px 8px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
}

.original-text, .translated-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.language-tag {
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 10px;
  color: #666;
}

.text {
  flex: 1;
  font-size: 14px;
}

.speak-btn {
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.speak-btn:hover {
  color: #07C160;
}

.timestamp {
  font-size: 10px;
  color: #999;
  text-align: right;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  margin-top: 16px;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ff4d4f;
}
</style>

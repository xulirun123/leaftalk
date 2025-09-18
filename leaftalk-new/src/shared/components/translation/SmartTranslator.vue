<template>
  <component 
    :is="tag" 
    :class="translationClass"
    @click="handleClick"
    v-bind="$attrs"
  >
    <span v-if="showOriginal && translatedText !== originalText" class="original-text">
      {{ originalText }}
    </span>
    <span class="translated-text">
      {{ displayText }}
    </span>
    <span v-if="showTranslationIndicator && isTranslated" class="translation-indicator">
      <i class="icon-translate"></i>
    </span>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { autoTranslationService } from '../../services/autoTranslationService'

// Props
interface Props {
  text?: string
  tag?: string
  targetLanguage?: string
  autoTranslate?: boolean
  showOriginal?: boolean
  showTranslationIndicator?: boolean
  enableClick?: boolean
  cacheKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span',
  autoTranslate: true,
  showOriginal: false,
  showTranslationIndicator: false,
  enableClick: false
})

// Emits
const emit = defineEmits<{
  translated: [result: any]
  click: [event: Event]
}>()

// 国际化
const { locale } = useI18n()

// 响应式数据
const originalText = ref('')
const translatedText = ref('')
const isTranslating = ref(false)
const isTranslated = ref(false)
const translationError = ref('')

// 计算属性
const displayText = computed(() => {
  return translatedText.value || originalText.value
})

const translationClass = computed(() => {
  return {
    'smart-translator': true,
    'translating': isTranslating.value,
    'translated': isTranslated.value,
    'clickable': props.enableClick,
    'has-error': !!translationError.value
  }
})

// 方法
const handleClick = (event: Event) => {
  if (props.enableClick) {
    emit('click', event)
    
    // 如果点击时显示原文，则切换显示
    if (isTranslated.value) {
      toggleDisplay()
    }
  }
}

const toggleDisplay = () => {
  // 切换显示原文和译文
  const temp = originalText.value
  originalText.value = translatedText.value
  translatedText.value = temp
}

const translateText = async () => {
  if (!originalText.value || !props.autoTranslate) {
    return
  }

  const targetLang = props.targetLanguage || locale.value
  
  // 检测是否需要翻译
  const detectedLang = await autoTranslationService.detectLanguage(originalText.value)
  if (detectedLang === targetLang) {
    translatedText.value = originalText.value
    return
  }

  isTranslating.value = true
  translationError.value = ''

  try {
    const result = await autoTranslationService.translateText(
      originalText.value,
      targetLang,
      detectedLang
    )

    translatedText.value = result.translatedText
    isTranslated.value = true
    
    emit('translated', result)
    
    console.log('🔄 智能翻译完成:', {
      original: originalText.value,
      translated: translatedText.value,
      from: detectedLang,
      to: targetLang
    })
    
  } catch (error) {
    console.error('❌ 智能翻译失败:', error)
    translationError.value = (error as Error).message
    translatedText.value = originalText.value
  } finally {
    isTranslating.value = false
  }
}

// 初始化文本
const initializeText = () => {
  if (props.text) {
    originalText.value = props.text
  } else {
    // 如果没有传入text，则使用slot内容
    // 这需要在mounted后获取
  }
}

// 监听属性变化
watch(() => props.text, (newText) => {
  if (newText && newText !== originalText.value) {
    originalText.value = newText
    translatedText.value = ''
    isTranslated.value = false
    translateText()
  }
})

watch(() => props.targetLanguage, () => {
  if (originalText.value) {
    translateText()
  }
})

watch(locale, () => {
  if (originalText.value && props.autoTranslate) {
    translateText()
  }
})

// 生命周期
onMounted(() => {
  initializeText()
  
  if (originalText.value && props.autoTranslate) {
    translateText()
  }
})
</script>

<style scoped>
.smart-translator {
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
}

.smart-translator.clickable {
  cursor: pointer;
}

.smart-translator.clickable:hover {
  background-color: rgba(7, 193, 96, 0.1);
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.smart-translator.translating {
  opacity: 0.7;
}

.smart-translator.translating::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -20px;
  width: 12px;
  height: 12px;
  border: 2px solid #07C160;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  transform: translateY(-50%);
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.smart-translator.has-error {
  color: #ff4d4f;
  text-decoration: underline;
  text-decoration-style: wavy;
}

.original-text {
  display: block;
  font-size: 0.8em;
  opacity: 0.6;
  font-style: italic;
  margin-bottom: 2px;
}

.translated-text {
  display: inline-block;
}

.translation-indicator {
  display: inline-block;
  margin-left: 4px;
  opacity: 0.5;
  font-size: 0.8em;
}

.translation-indicator i {
  color: #07C160;
}

/* 不同状态的样式 */
.smart-translator.translated .translated-text {
  border-bottom: 1px dotted #07C160;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .smart-translator.clickable:hover {
    background-color: transparent;
    padding: 0;
    margin: 0;
  }
  
  .original-text {
    font-size: 0.75em;
  }
  
  .translation-indicator {
    font-size: 0.7em;
  }
}
</style>

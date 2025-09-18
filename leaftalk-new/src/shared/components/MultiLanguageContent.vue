<template>
  <div class="multi-language-content">
    <!-- 内容显示 -->
    <div class="content-text" :class="{ 'translated': displayInfo.isTranslated }">
      {{ displayInfo.text }}
    </div>

    <!-- 翻译信息 -->
    <div v-if="showTranslationInfo && displayInfo.isTranslated" class="translation-info">
      <div class="translation-badge">
        <iconify-icon icon="heroicons:language" width="12"></iconify-icon>
        <span>{{ getTranslationText() }}</span>
        <div class="quality-indicator" :class="getQualityClass()"></div>
      </div>
      
      <!-- 翻译操作 -->
      <div class="translation-actions">
        <button 
          class="action-btn" 
          @click="showOriginal = !showOriginal"
          :title="showOriginal ? '显示翻译' : '显示原文'"
        >
          <iconify-icon 
            :icon="showOriginal ? 'heroicons:eye-slash' : 'heroicons:eye'" 
            width="14"
          ></iconify-icon>
        </button>
        
        <button 
          class="action-btn" 
          @click="showLanguageSelector = !showLanguageSelector"
          title="选择语言"
        >
          <iconify-icon icon="heroicons:globe-alt" width="14"></iconify-icon>
        </button>
        
        <button 
          v-if="canEdit" 
          class="action-btn" 
          @click="editTranslation"
          title="编辑翻译"
        >
          <iconify-icon icon="heroicons:pencil" width="14"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 语言选择器 -->
    <div v-if="showLanguageSelector" class="language-selector">
      <div class="language-options">
        <button
          v-for="lang in availableLanguages"
          :key="lang"
          class="language-option"
          :class="{ active: currentLanguage === lang }"
          @click="switchLanguage(lang)"
        >
          {{ getLanguageDisplayName(lang) }}
          <span v-if="lang === content.originalLanguage" class="original-badge">原文</span>
        </button>
      </div>
    </div>

    <!-- 原文显示 -->
    <div v-if="showOriginal && displayInfo.isTranslated" class="original-content">
      <div class="original-label">原文 ({{ getLanguageDisplayName(content.originalLanguage) }}):</div>
      <div class="original-text">{{ content.originalText }}</div>
    </div>

    <!-- 编辑翻译对话框 -->
    <div v-if="showEditDialog" class="edit-dialog-overlay" @click="closeEditDialog">
      <div class="edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑翻译</h3>
          <button class="close-btn" @click="closeEditDialog">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="dialog-content">
          <div class="edit-form">
            <label>{{ getLanguageDisplayName(currentLanguage) }}:</label>
            <textarea 
              v-model="editingText" 
              class="edit-textarea"
              rows="4"
              :placeholder="`输入${getLanguageDisplayName(currentLanguage)}翻译...`"
            ></textarea>
          </div>
          
          <div class="original-reference">
            <label>原文参考:</label>
            <div class="reference-text">{{ content.originalText }}</div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeEditDialog">取消</button>
          <button class="save-btn" @click="saveTranslation" :disabled="!editingText.trim()">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { 
  MultiLanguageContent, 
  contentDisplayHelper,
  multiLanguageContentService 
} from '../services/multiLanguageContent'

interface Props {
  content: MultiLanguageContent
  userLanguage?: string
  showTranslationInfo?: boolean
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userLanguage: 'zh-CN',
  showTranslationInfo: true,
  canEdit: false
})

const emit = defineEmits<{
  translationUpdated: [content: MultiLanguageContent]
}>()

const { getCurrentLanguage } = useI18n()

// 响应式数据
const currentLanguage = ref(props.userLanguage || getCurrentLanguage())
const showOriginal = ref(false)
const showLanguageSelector = ref(false)
const showEditDialog = ref(false)
const editingText = ref('')

// 计算属性
const displayInfo = computed(() => {
  const lang = showOriginal.value ? props.content.originalLanguage : currentLanguage.value
  return contentDisplayHelper.formatContentWithTranslationInfo(
    props.content,
    lang,
    props.showTranslationInfo
  )
})

const availableLanguages = computed(() => {
  return Object.keys(props.content.translations)
})

// 方法
const getTranslationText = () => {
  const quality = displayInfo.value.quality
  if (quality >= 0.9) return '人工翻译'
  if (quality >= 0.7) return '自动翻译'
  return '翻译质量较低'
}

const getQualityClass = () => {
  const quality = displayInfo.value.quality
  if (quality >= 0.9) return 'high-quality'
  if (quality >= 0.7) return 'medium-quality'
  return 'low-quality'
}

const getLanguageDisplayName = (languageCode: string) => {
  return contentDisplayHelper.getLanguageDisplayName(languageCode)
}

const switchLanguage = (language: string) => {
  currentLanguage.value = language
  showLanguageSelector.value = false
  showOriginal.value = false
}

const editTranslation = () => {
  editingText.value = props.content.translations[currentLanguage.value] || ''
  showEditDialog.value = true
}

const closeEditDialog = () => {
  showEditDialog.value = false
  editingText.value = ''
}

const saveTranslation = async () => {
  if (!editingText.value.trim()) return
  
  try {
    await multiLanguageContentService.updateTranslation(
      props.content.id,
      currentLanguage.value,
      editingText.value.trim()
    )
    
    // 更新本地内容
    const updatedContent = { ...props.content }
    updatedContent.translations[currentLanguage.value] = editingText.value.trim()
    updatedContent.autoTranslated[currentLanguage.value] = false
    updatedContent.lastUpdated = new Date()
    
    emit('translationUpdated', updatedContent)
    closeEditDialog()
    
  } catch (error) {
    console.error('保存翻译失败:', error)
    alert('保存失败，请重试')
  }
}

// 监听用户语言变化
watch(() => props.userLanguage, (newLang) => {
  if (newLang) {
    currentLanguage.value = newLang
  }
})

// 监听全局语言变化
watch(() => getCurrentLanguage(), (newLocale) => {
  currentLanguage.value = newLocale
})
</script>

<style scoped>
.multi-language-content {
  position: relative;
}

.content-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.content-text.translated {
  border-left: 3px solid #07C160;
  padding-left: 8px;
  background: rgba(7, 193, 96, 0.05);
}

.translation-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 6px 8px;
  background: #f8f8f8;
  border-radius: 4px;
  font-size: 12px;
}

.translation-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.quality-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.quality-indicator.high-quality {
  background: #07C160;
}

.quality-indicator.medium-quality {
  background: #FFB800;
}

.quality-indicator.low-quality {
  background: #FF6B6B;
}

.translation-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 3px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.language-selector {
  margin-top: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.language-option {
  padding: 4px 8px;
  background: #f0f0f0;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.language-option:hover {
  background: #e0e0e0;
}

.language-option.active {
  background: #07C160;
  color: white;
}

.original-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 1px 4px;
  border-radius: 6px;
  font-size: 10px;
}

.original-content {
  margin-top: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #999;
}

.original-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.original-text {
  font-size: 14px;
  color: #333;
}

/* 编辑对话框样式 */
.edit-dialog-overlay {
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
  padding: 20px;
}

.edit-dialog {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
}

.dialog-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.edit-form {
  margin-bottom: 16px;
}

.edit-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.original-reference {
  padding: 12px;
  background: #f8f8f8;
  border-radius: 4px;
}

.original-reference label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.reference-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.save-btn {
  background: #07C160;
  color: white;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
